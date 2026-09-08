import { Router } from 'express'
import { z } from 'zod'
import {
  findOrCreateCustomer,
  createOrderTransaction,
  getOrderTrackingTimeline,
  getOrderSummary,
  getOrderDetailsWithItems,
} from '../../db/queries/orderQueries'
import { normalizePhoneNumber, isValidKenyanPhone } from '../../utils/phoneUtils'
import { getSubCountyById, getPrintRegionForCounty } from '../../db/queries/locationQueries'
import { getCalculatedPrice, getDeliveryPricing } from '../../db/queries/pricingQueries'
import { getDesignById } from '../../db/queries/catalogQueries'
import { generateCustomerTokens, CustomerPayload, requireAuth } from '../../middleware/auth'
import jwt from 'jsonwebtoken'
import { BadRequestError, NotFoundError } from '../../utils/errors'
import { emitOrderCreated } from '../../services/orderEvents'
import { streamOrderResourcePackage } from '../../services/orderPackageService'
import {
  sendOrderConfirmationEmail,
  sendOrderTrackingUpdateEmail,
} from '../../services/emailService'
import { orderLimiter, emailLimiter } from '../../middleware/rateLimiter'

const router = Router()

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'super-secret-development-jwt-key-32-chars-min'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-32-chars-min'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export const orderItemStudentSchema = z.object({
  design_id: z.string().uuid('Valid design ID is required'),
  size: z.enum(['A3', 'A4', 'A5']),
  custom_photo_storage_path: z.string().optional(),
  message_body: z.string().min(1, 'Personal message body is required'),
  message_font: z.string().optional(),
  message_colour: z.string().optional(),
  recipient_full_names: z
    .string()
    .min(2, 'Student full names are mandatory (at least 2 characters)')
    .refine((name) => name.trim().length >= 2, { message: 'Student full names cannot be blank' })
    .refine((name) => name.trim().toLowerCase() !== 'student / candidate', {
      message: 'Please provide the student\'s real full names',
    }),
  admission_number: z
    .string()
    .min(1, 'Student admission/index number is mandatory')
    .refine((adm) => adm.trim().length >= 1, { message: 'Student admission number cannot be blank' }),
  school_name: z
    .string()
    .min(2, 'School name is mandatory')
    .refine((sch) => sch.trim().length >= 2, { message: 'School name cannot be blank' }),
  county_id: z.string().uuid('Valid county selection is mandatory'),
  sub_county_id: z.string().uuid('Valid sub-county selection is mandatory'),
  po_box: z.string().optional(),
  class_form: z.string().optional(),
})

const createOrderSchema = z.object({
  customer: z.object({
    phone: z.string().refine(isValidKenyanPhone, {
      message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
    }),
    email: z.string().email().optional(),
    fullName: z.string().optional(),
  }),
  items: z.array(orderItemStudentSchema).min(1, 'Order must contain at least one card item with student information'),
})

router.post('/', orderLimiter, async (req, res, next) => {
  try {
    const parse = createOrderSchema.safeParse(req.body)
    if (!parse.success) {
      throw new BadRequestError('Invalid order input data', parse.error.format())
    }

    const { customer, items } = parse.data
    const normalizedPhone = normalizePhoneNumber(customer.phone)
    const dbCustomer = await findOrCreateCustomer(normalizedPhone, customer.email)

    const deliveryPricing = await getDeliveryPricing()
    let cardsSubtotal = 0
    let deliveryTotal = 0
    const processedItems = []

    for (const item of items) {
      const subCounty = await getSubCountyById(item.sub_county_id)
      if (!subCounty) {
        throw new BadRequestError(`Invalid sub-county ID: ${item.sub_county_id}`)
      }

      const hasPhoto = Boolean(item.custom_photo_storage_path)
      const photoFee = hasPhoto ? 100 : 0

      // Use specific card design price for the selected size if available
      let unitPrice: number
      const design = item.design_id ? await getDesignById(item.design_id) : null
      if (design) {
        const baseA4 = Number(design.price_a4_kes || design.price_kes || 850)
        const baseA5 = Number(design.price_a5_kes || Math.round(baseA4 * 0.65))
        const baseA3 = Number(design.price_a3_kes || Math.round(baseA4 * 1.65))

        if (item.size === 'A5') unitPrice = baseA5 + photoFee
        else if (item.size === 'A3') unitPrice = baseA3 + photoFee
        else unitPrice = baseA4 + photoFee
      } else {
        unitPrice = await getCalculatedPrice(item.size, hasPhoto, subCounty.zone)
      }

      const itemDeliveryFee = subCounty.zone === 'outskirts' ? deliveryPricing.outskirts : deliveryPricing.cbd
      cardsSubtotal += unitPrice
      deliveryTotal += itemDeliveryFee

      const printRegion = await getPrintRegionForCounty(item.county_id)

      processedItems.push({
        ...item,
        unit_price_kes: unitPrice,
        print_region_id: printRegion?.id,
      })
    }

    const totalAmount = cardsSubtotal + deliveryTotal
    const result = await createOrderTransaction(dbCustomer.id, totalAmount, processedItems)
    const customerTokens = generateCustomerTokens(dbCustomer.id, dbCustomer.phone)

    // Notify real-time admin stream
    try {
      const summary = await getOrderSummary(result.order.id)
      if (summary) emitOrderCreated(summary)
    } catch (e) {
      console.error('Failed to emit order:created event', e)
    }

    // Trigger Order Confirmation Email if customer has an email address
    const recipientEmail = customer.email || dbCustomer.email
    if (recipientEmail) {
      const emailItems = processedItems.map((pi) => ({
        recipientName: pi.recipient_full_names,
        schoolName: pi.school_name,
        admissionNumber: pi.admission_number,
        size: pi.size,
        unitPriceKes: pi.unit_price_kes,
        messagePreview: pi.message_body,
      }))

      sendOrderConfirmationEmail(recipientEmail, {
        orderNumber: result.order.order_number,
        customerName: customer.fullName || dbCustomer.full_name || 'Customer',
        customerPhone: dbCustomer.phone,
        totalAmountKes: totalAmount,
        cardsSubtotalKes: cardsSubtotal,
        deliveryFeeKes: deliveryTotal,
        items: emailItems,
        trackingUrl: `${FRONTEND_URL}/order/track?orderNumber=${result.order.order_number}&phone=${encodeURIComponent(dbCustomer.phone)}`,
      }).catch((emailErr) => {
        console.error('[Email] Failed to dispatch order confirmation email:', emailErr)
      })
    }

    res.status(201).json({
      data: {
        orderId: result.order.id,
        orderNumber: result.order.order_number,
        totalAmountKes: result.order.total_amount_kes,
        cardsSubtotalKes: cardsSubtotal,
        deliveryFeeKes: deliveryTotal,
        status: result.order.status,
        sessionTokens: {
          accessToken: customerTokens.accessToken,
          sessionToken: customerTokens.sessionToken,
          expiresIn: '24h',
          sessionExpiresIn: '24h',
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/timeline/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const { phone } = req.query as { phone?: string }

    let normalizedPhone: string | undefined
    if (phone) {
      if (!isValidKenyanPhone(phone)) {
        throw new BadRequestError('Invalid phone number format. Must be a valid Kenyan mobile number.')
      }
      normalizedPhone = normalizePhoneNumber(phone)
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1]
      try {
        let decoded: CustomerPayload
        try {
          decoded = jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as CustomerPayload
        } catch {
          decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as CustomerPayload
        }
        if (decoded.role === 'customer' && decoded.phone) {
          normalizedPhone = decoded.phone
        }
      } catch {
        // Fall back to public lookup if token invalid
      }
    }

    const tracking = await getOrderTrackingTimeline(orderNumber as string, normalizedPhone)

    if (!tracking) {
      throw new NotFoundError(`Order '${orderNumber}' not found or phone number does not match record`)
    }

    res.json({ data: tracking })
  } catch (err) {
    next(err)
  }
})

// Send or resend tracking info to user's email
router.post('/timeline/:orderNumber/send-email', emailLimiter, async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const { email } = req.body

    if (!email || !z.string().email().safeParse(email).success) {
      return res.status(400).json({ error: 'Valid recipient email address is required' })
    }

    const tracking = await getOrderTrackingTimeline(orderNumber as string)
    if (!tracking) {
      return res.status(404).json({ error: `Order #${orderNumber} not found` })
    }

    const recipientNames = tracking.items?.map((i: any) => i.recipient_full_names).join(', ') || 'Student'
    const schoolNames = tracking.items?.map((i: any) => i.school_name).join(', ') || 'School'
    const statusFormatted = (tracking.order.status || 'Received').replace(/_/g, ' ').toUpperCase()

    const trackingUrl = `${FRONTEND_URL}/order/track?orderNumber=${orderNumber}`

    await sendOrderTrackingUpdateEmail(email, {
      orderNumber: tracking.order.order_number,
      recipientNames,
      schoolNames,
      statusTitle: `Current Status: ${statusFormatted}`,
      statusDescription: `Your order #${orderNumber} is currently at status: ${statusFormatted}. You can track the real-time fulfillment progress using the button below.`,
      trackingUrl,
    })

    res.json({ success: true, message: `Tracking details sent to ${email}` })
  } catch (err) {
    next(err)
  }
})

// Admin & Print Hub Manager Download endpoint for complete order resource package (.zip)
router.get(
  '/:orderNumber/download-package',
  requireAuth(['admin', 'super_admin', 'rider_manager']),
  async (req, res, next) => {
    try {
      const { orderNumber } = req.params
      await streamOrderResourcePackage(orderNumber as string, res)
    } catch (err) {
      next(err)
    }
  }
)

export default router
