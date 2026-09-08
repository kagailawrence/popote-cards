import nodemailer, { Transporter } from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  previewUrl?: string | false
  error?: string
}

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Popote Cards <notifications@popotecards.co.ke>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

let transporterInstance: Transporter | null = null

export function getTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance
  }

  if (SMTP_USER && SMTP_PASS) {
    transporterInstance = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    })
    console.log(`[Email] Configured production SMTP transport via ${SMTP_HOST}:${SMTP_PORT} (${SMTP_USER})`)
  } else {
    // Development / fallback mode: create jsonTransport / stream fallback
    transporterInstance = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
      // Stream output when no SMTP server is configured
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })
    console.log('[Email] Configured fallback development email transport (Simulated/Stream logger)')
  }

  return transporterInstance
}

export async function verifyEmailTransporter(): Promise<boolean> {
  try {
    const transporter = getTransporter()
    if (SMTP_USER && SMTP_PASS) {
      await transporter.verify()
      console.log('[Email] SMTP connection verified successfully.')
      return true
    }
    return true
  } catch (err: any) {
    console.warn('[Email] SMTP verify warning (will operate in graceful mode):', err.message)
    return false
  }
}

export async function sendEmail({ to, subject, html, text, from }: EmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter()
    const sender = from || DEFAULT_FROM

    const mailOptions = {
      from: sender,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ').trim(),
    }

    const info = await transporter.sendMail(mailOptions)

    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log(`[Email] Email sent successfully to ${to} | Subject: "${subject}" | MsgId: ${info.messageId}`)
    if (previewUrl) {
      console.log(`[Email] Ethereal preview URL: ${previewUrl}`)
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    }
  } catch (err: any) {
    console.error(`[Email] Error sending email to ${to}:`, err.message)
    return {
      success: false,
      error: err.message || 'Unknown email delivery error',
    }
  }
}

// -------------------------------------------------------------
// Base HTML Email Template Layout
// -------------------------------------------------------------
function renderEmailLayout({
  title,
  preheader,
  contentHtml,
}: {
  title: string
  preheader: string
  contentHtml: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 30px 10px;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    }
    .header-bar {
      background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
      padding: 24px 32px;
      text-align: center;
    }
    .header-logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .header-subtext {
      color: #fce7f3;
      font-size: 13px;
      font-weight: 500;
      margin-top: 4px;
    }
    .content-body {
      padding: 32px;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
      transition: all 0.2s ease;
    }
    .card-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 14px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #64748b;
      font-weight: 500;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-info {
      background-color: #e0f2fe;
      color: #0369a1;
    }
    .badge-pink {
      background-color: #fce7f3;
      color: #be185d;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background-color: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #e11d48;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 620px) {
      .content-body {
        padding: 24px 18px !important;
      }
      .header-bar {
        padding: 20px 18px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main-card">
            <!-- Header -->
            <div class="header-bar">
              <a href="${FRONTEND_URL}" class="header-logo">
                ✨ Popote Cards
              </a>
              <div class="header-subtext">Delivering Exam Success Cards Across All 47 Counties of Kenya 🇰🇪</div>
            </div>

            <!-- Main Body -->
            <div class="content-body">
              ${contentHtml}
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">
                Popote Cards Kenya &bull; Direct School Delivery Network
              </p>
              <p style="margin: 0 0 12px 0;">
                Have questions or need help? Reply directly to this email or reach us on 
                <a href="tel:+254700000000">+254 700 000 000</a> / <a href="mailto:support@popotecards.co.ke">support@popotecards.co.ke</a>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Popote Cards. All rights reserved. Nairobi, Kenya.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
}

// -------------------------------------------------------------
// 1. WELCOME EMAIL
// -------------------------------------------------------------
export async function sendWelcomeEmail(
  toEmail: string,
  params: { name?: string; loginUrl?: string }
): Promise<SendEmailResult> {
  const customerName = params.name || 'Friend'
  const catalogUrl = `${FRONTEND_URL}/catalog`
  const loginUrl = params.loginUrl || `${FRONTEND_URL}/login`

  const subject = `Welcome to Popote Cards, ${customerName}! 🎓✨`
  const preheader = `Send personalized exam success cards directly to candidates across all 47 counties of Kenya.`

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 38px; line-height: 1; margin-bottom: 12px;">🎉</div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Welcome to the Family, ${customerName}!
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        We're thrilled to have you. Popote Cards makes it delightfully easy to send beautiful, custom-printed exam success cards directly to secondary and primary school candidates in any corner of Kenya.
      </p>
    </div>

    <div class="card-box" style="background-color: #fdf2f8; border-color: #fbcfe8;">
      <h3 style="font-size: 15px; font-weight: 700; color: #be185d; margin: 0 0 12px 0;">
        🌟 Why Families & Mentors Love Popote Cards:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
        <li><strong>Full Countrywide Reach:</strong> Direct delivery to national, extra-county, county, and sub-county schools in all 47 counties.</li>
        <li><strong>Custom Photos & Messages:</strong> Upload student photos and craft personal blessing messages.</li>
        <li><strong>Live Order Tracking:</strong> Track print status, packaging, and rider dispatch straight to the school gate.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${catalogUrl}" class="btn-primary">
        Browse Card Designs 🌸
      </a>
    </div>

    <p style="text-align: center; font-size: 13px; color: #64748b; margin: 16px 0 0 0;">
      Already placed an order? <a href="${loginUrl}" style="color: #e11d48; font-weight: 600; text-decoration: none;">Access your account & tracking portal &rarr;</a>
    </p>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}

// -------------------------------------------------------------
// 2. PASSWORD RESET / FORGOT PASSWORD EMAIL
// -------------------------------------------------------------
export async function sendPasswordResetEmail(
  toEmail: string,
  params: { name?: string; resetLink: string; resetToken: string; expiresMinutes?: number }
): Promise<SendEmailResult> {
  const userName = params.name || 'Valued User'
  const expires = params.expiresMinutes || 60

  const subject = `Reset Your Popote Cards Password 🔐`
  const preheader = `Here is your secure password reset link. This link will expire in ${expires} minutes.`

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Password Reset Request
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        Hello <strong>${userName}</strong>, we received a request to reset the password for your Popote Cards account associated with <strong>${toEmail}</strong>.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.resetLink}" class="btn-primary">
        Reset My Password 🔒
      </a>
    </div>

    <div class="card-box" style="background-color: #f1f5f9; border-color: #cbd5e1;">
      <p style="font-size: 13px; color: #475569; margin: 0 0 8px 0;">
        <strong>Security Notice:</strong> This password reset link is valid for <strong>${expires} minutes</strong>. If you did not make this request, you can safely ignore this email—your account remains safe and no changes have been made.
      </p>
      <p style="font-size: 12px; color: #64748b; margin: 0; word-break: break-all;">
        If the button above doesn't work, copy and paste this URL into your browser:<br>
        <a href="${params.resetLink}" style="color: #e11d48;">${params.resetLink}</a>
      </p>
    </div>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}

// -------------------------------------------------------------
// 3. ORDER CONFIRMATION / PLACED EMAIL
// -------------------------------------------------------------
export interface OrderEmailItem {
  recipientName: string
  schoolName: string
  countyName?: string
  subCountyName?: string
  admissionNumber?: string
  size: string
  unitPriceKes: number
  messagePreview?: string
}

export async function sendOrderConfirmationEmail(
  toEmail: string,
  params: {
    orderNumber: string
    customerName?: string
    customerPhone?: string
    totalAmountKes: number
    cardsSubtotalKes?: number
    deliveryFeeKes?: number
    items: OrderEmailItem[]
    trackingUrl?: string
  }
): Promise<SendEmailResult> {
  const customerName = params.customerName || 'Customer'
  const trackingUrl = params.trackingUrl || `${FRONTEND_URL}/order/track?orderNumber=${params.orderNumber}`

  const subject = `Order Confirmed: ${params.orderNumber} 💌 (Popote Cards)`
  const preheader = `Thank you! Your order #${params.orderNumber} has been received and is queued for high-resolution printing.`

  const itemsHtml = params.items
    .map(
      (item, idx) => `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a;">
              ${idx + 1}. Candidate: ${item.recipientName}
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
              🏫 ${item.schoolName} &bull; Adm: ${item.admissionNumber || 'N/A'}
            </div>
            ${item.countyName ? `<div style="font-size: 12px; color: #94a3b8;">📍 ${item.subCountyName || ''}, ${item.countyName}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <span class="badge badge-pink">${item.size} Card</span>
            <div style="font-size: 14px; font-weight: 800; color: #e11d48; margin-top: 4px;">
              KES ${Number(item.unitPriceKes).toLocaleString()}
            </div>
          </div>
        </div>
        ${
          item.messagePreview
            ? `<div style="background-color: #f8fafc; border-left: 3px solid #ec4899; padding: 8px 12px; border-radius: 4px; font-size: 13px; color: #334155; font-style: italic; margin-top: 8px;">
                "${item.messagePreview.length > 120 ? item.messagePreview.substring(0, 120) + '...' : item.messagePreview}"
              </div>`
            : ''
        }
      </div>`
    )
    .join('')

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; margin-bottom: 8px;">
        <span class="badge badge-success">✓ Order Received</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Thank You for Your Order, ${customerName}!
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        We have received your success card order <strong>#${params.orderNumber}</strong>. Our print hub has queued the personalized cards for high-precision printing, packaging, and rider dispatch.
      </p>
    </div>

    <!-- Order Summary Box -->
    <div class="card-box">
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
        Order Details & Summary
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b;">Order Number:</td>
          <td align="right" style="font-weight: 800; color: #0f172a;">${params.orderNumber}</td>
        </tr>
        ${
          params.cardsSubtotalKes
            ? `<tr>
                <td style="color: #64748b;">Cards Subtotal:</td>
                <td align="right" style="font-weight: 600; color: #0f172a;">KES ${Number(params.cardsSubtotalKes).toLocaleString()}</td>
              </tr>`
            : ''
        }
        ${
          params.deliveryFeeKes !== undefined
            ? `<tr>
                <td style="color: #64748b;">School Delivery Fee:</td>
                <td align="right" style="font-weight: 600; color: #0f172a;">KES ${Number(params.deliveryFeeKes).toLocaleString()}</td>
              </tr>`
            : ''
        }
        <tr style="border-top: 2px solid #cbd5e1;">
          <td style="font-size: 16px; font-weight: 800; color: #0f172a; padding-top: 8px;">Total Amount:</td>
          <td align="right" style="font-size: 16px; font-weight: 800; color: #e11d48; padding-top: 8px;">
            KES ${Number(params.totalAmountKes).toLocaleString()}
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Section -->
    <div style="margin: 24px 0 16px 0;">
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
        Cards in This Order (${params.items.length})
      </div>
      ${itemsHtml}
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${trackingUrl}" class="btn-primary">
        Track Order Live 🚚
      </a>
    </div>

    <p style="text-align: center; font-size: 13px; color: #64748b; margin: 0;">
      You will receive another update as soon as your card is dispatched with our county rider.
    </p>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}

// -------------------------------------------------------------
// 4. ORDER DISPATCHED / IN-TRANSIT EMAIL
// -------------------------------------------------------------
export async function sendOrderDispatchedEmail(
  toEmail: string,
  params: {
    orderNumber: string
    recipientNames: string
    schoolNames: string
    countyName?: string
    trackingUrl?: string
    riderName?: string
    riderPhone?: string
    estimatedDelivery?: string
  }
): Promise<SendEmailResult> {
  const trackingUrl = params.trackingUrl || `${FRONTEND_URL}/order/track?orderNumber=${params.orderNumber}`

  const subject = `Your Card is on the Way! 🏍️💨 #${params.orderNumber}`
  const preheader = `Exciting news! Order #${params.orderNumber} for ${params.recipientNames} has been dispatched for delivery to ${params.schoolNames}.`

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; margin-bottom: 8px;">
        <span class="badge badge-info">🏍️ Dispatched & In-Transit</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Success Card is on the Way!
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        The personalized success card for <strong>${params.recipientNames}</strong> has been printed, sealed, and handed over to our regional delivery rider heading to <strong>${params.schoolNames}</strong>.
      </p>
    </div>

    <div class="card-box">
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
        Delivery Information
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b;">Order Number:</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Candidate(s):</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.recipientNames}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Destination School:</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.schoolNames}</td>
        </tr>
        ${
          params.countyName
            ? `<tr>
                <td style="color: #64748b;">County:</td>
                <td align="right" style="font-weight: 700; color: #0f172a;">${params.countyName}</td>
              </tr>`
            : ''
        }
        ${
          params.riderName
            ? `<tr>
                <td style="color: #64748b;">Delivery Rider:</td>
                <td align="right" style="font-weight: 700; color: #0f172a;">${params.riderName} ${params.riderPhone ? `(${params.riderPhone})` : ''}</td>
              </tr>`
            : ''
        }
        ${
          params.estimatedDelivery
            ? `<tr>
                <td style="color: #64748b;">Estimated Arrival:</td>
                <td align="right" style="font-weight: 700; color: #15803d;">${params.estimatedDelivery}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${trackingUrl}" class="btn-primary">
        View Live Tracking 📍
      </a>
    </div>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}

// -------------------------------------------------------------
// 5. ORDER DELIVERED EMAIL
// -------------------------------------------------------------
export async function sendOrderDeliveredEmail(
  toEmail: string,
  params: {
    orderNumber: string
    recipientNames: string
    schoolNames: string
    countyName?: string
    deliveredAt?: string
    reviewUrl?: string
    deliveryNoteUrl?: string
  }
): Promise<SendEmailResult> {
  const reviewUrl = params.reviewUrl || `${FRONTEND_URL}/reviews`
  const deliveredTime = params.deliveredAt || new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })

  const subject = `Delivered! 🎉 Candidate Received Their Card #${params.orderNumber}`
  const preheader = `Success! Order #${params.orderNumber} has been safely delivered to ${params.schoolNames} for ${params.recipientNames}.`

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 42px; line-height: 1; margin-bottom: 12px;">🎊</div>
      <div style="display: inline-block; margin-bottom: 8px;">
        <span class="badge badge-success">✓ Successfully Delivered</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Card Safely Delivered to ${params.schoolNames}!
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        Mission accomplished! The success card for candidate <strong>${params.recipientNames}</strong> has been officially delivered at <strong>${params.schoolNames}</strong>.
      </p>
    </div>

    <div class="card-box" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="font-size: 14px; font-weight: 800; color: #166534; margin-bottom: 12px;">
        Delivery Confirmation
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #166534;">Order Number:</td>
          <td align="right" style="font-weight: 700; color: #14532d;">${params.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #166534;">Candidate:</td>
          <td align="right" style="font-weight: 700; color: #14532d;">${params.recipientNames}</td>
        </tr>
        <tr>
          <td style="color: #166534;">School:</td>
          <td align="right" style="font-weight: 700; color: #14532d;">${params.schoolNames}</td>
        </tr>
        <tr>
          <td style="color: #166534;">Delivered At:</td>
          <td align="right" style="font-weight: 700; color: #14532d;">${deliveredTime}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${reviewUrl}" class="btn-primary">
        Leave a Review & Rate Experience ⭐
      </a>
    </div>

    <p style="text-align: center; font-size: 13px; color: #64748b; margin: 0;">
      Thank you for trusting Popote Cards to deliver your love, blessings, and encouragement! 💖
    </p>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}

// -------------------------------------------------------------
// 6. ORDER TRACKING STATUS UPDATE EMAIL
// -------------------------------------------------------------
export async function sendOrderTrackingUpdateEmail(
  toEmail: string,
  params: {
    orderNumber: string
    recipientNames: string
    schoolNames: string
    statusTitle: string
    statusDescription: string
    trackingUrl?: string
  }
): Promise<SendEmailResult> {
  const trackingUrl = params.trackingUrl || `${FRONTEND_URL}/order/track?orderNumber=${params.orderNumber}`

  const subject = `Update on Order #${params.orderNumber}: ${params.statusTitle} 📦`
  const preheader = `Status update for order #${params.orderNumber} to ${params.schoolNames}: ${params.statusTitle}`

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; margin-bottom: 8px;">
        <span class="badge badge-pink">${params.statusTitle}</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Order Tracking Update
      </h1>
      <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
        ${params.statusDescription}
      </p>
    </div>

    <div class="card-box">
      <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b;">Order Number:</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Recipient Candidate:</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.recipientNames}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Destination:</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${params.schoolNames}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${trackingUrl}" class="btn-primary">
        Track Order Live &rarr;
      </a>
    </div>
  `

  const html = renderEmailLayout({ title: subject, preheader, contentHtml })
  return sendEmail({ to: toEmail, subject, html })
}
