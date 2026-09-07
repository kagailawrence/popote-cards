import { Router } from 'express'
import { generateCustomerProof, renderOrderItem } from './renderingService'
import { requireAuth } from '../../middleware/auth'

const router = Router()

import path from 'path'
import fs from 'fs'

const STORAGE_ROOT = path.resolve(__dirname, '../../../../storage')

// Public proof preview endpoint (rate-limited, returns PNG buffer)
router.post('/proof/:designId', async (req, res, next) => {
  try {
    const { pageType, message, font, colour, photoPath, recipientName } = req.body
    const buffer = await generateCustomerProof(req.params.designId, {
      pageType,
      message,
      font,
      colour,
      photoPath,
      recipientName,
    })
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

// High-resolution vector/print PDF rendering & download endpoint
const handleVectorPdfDownload = async (req: any, res: any, next: any) => {
  try {
    const orderItemId = req.params.orderItemId as string
    const relativePath = await renderOrderItem(orderItemId)
    const fullPdfPath = path.join(STORAGE_ROOT, relativePath)

    if (!fs.existsSync(fullPdfPath)) {
      return res.status(500).json({ error: 'Failed to locate generated print PDF file' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="PRINT_ITEM_${orderItemId}.pdf"`)
    fs.createReadStream(fullPdfPath).pipe(res)
  } catch (err: any) {
    console.error(`Error rendering vector PDF for order item ${req.params.orderItemId}:`, err)
    res.status(500).json({ error: err.message || 'Failed to generate high-resolution print PDF' })
  }
}

router.post('/vector-pdf/:orderItemId', handleVectorPdfDownload)
router.get('/vector-pdf/:orderItemId', handleVectorPdfDownload)

// Trigger / re-run order item PDF rendering
router.post('/render-item/:orderItemId', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const pdfPath = await renderOrderItem(req.params.orderItemId as string)
    res.json({ success: true, orderItemId: req.params.orderItemId, pdfPath })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Render failed' })
  }
})

export default router
