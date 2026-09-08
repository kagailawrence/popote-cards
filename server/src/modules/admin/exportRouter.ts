import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../../middleware/auth'
import { query } from '../../config/db'
import { renderOrderItem } from '../rendering/renderingService'
import { streamOrderResourcePackage, streamOrderItemResourcePackage, streamHubBatchPackage, createZipArchive } from '../../services/orderPackageService'
import { STORAGE_ROOT } from '../../utils/storage'

const router = Router()

router.use(requireAuth(['admin', 'super_admin', 'rider_manager']))

const handleExportZip = async (req: any, res: any, next: any) => {
  try {
    const printRegionId = req.query.printRegion as string | undefined

    let sql = `
      SELECT oi.id, oi.rendered_pdf_storage_path, oi.recipient_full_names, oi.size, oi.custom_photo_storage_path, o.order_number, pr.name as region_name
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
      WHERE o.status != 'cancelled'
    `
    const params: any[] = []
    if (printRegionId) {
      params.push(printRegionId)
      sql += ` AND oi.print_region_id = $1`
    }

    const items = await query(sql, params)

    if (items.length === 0) {
      return res.status(404).json({ error: 'No order cards found for export' })
    }

    const archive = createZipArchive({ zlib: { level: 9 } })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="Print_Ready_Cards_Export_${Date.now()}.zip"`)

    archive.pipe(res)

    for (const item of items) {
      let relPath = item.rendered_pdf_storage_path
      let fullPdfPath = relPath ? path.join(STORAGE_ROOT, relPath) : ''

      // Auto-render PDF on-the-fly if missing or not generated yet
      if (!relPath || !fs.existsSync(fullPdfPath)) {
        try {
          relPath = await renderOrderItem(item.id)
          fullPdfPath = path.join(STORAGE_ROOT, relPath)
        } catch (renderErr) {
          console.error(`Failed to auto-render PDF for order item ${item.id}`, renderErr)
          continue
        }
      }

      const regionFolderName = item.region_name ? item.region_name.replace(/\s+/g, '_') : 'General_Region'

      if (fs.existsSync(fullPdfPath)) {
        const zipFileName = `${regionFolderName}/${item.order_number}_${item.recipient_full_names.replace(/\s+/g, '_')}_${item.size}.pdf`
        archive.file(fullPdfPath, { name: zipFileName })
      }

      // Include standalone candidate photo resource if uploaded
      if (item.custom_photo_storage_path) {
        const photoName = path.basename(item.custom_photo_storage_path)
        const candidatePhotoPaths = [
          path.join(STORAGE_ROOT, 'customer-photos', photoName),
          path.join(STORAGE_ROOT, 'design-images', photoName),
          path.join(STORAGE_ROOT, item.custom_photo_storage_path),
          path.join(STORAGE_ROOT, item.custom_photo_storage_path.replace(/^\/+/, '')),
        ]
        const foundPhoto = candidatePhotoPaths.find((p) => fs.existsSync(p))
        if (foundPhoto) {
          const ext = path.extname(foundPhoto) || '.jpg'
          const photoZipPath = `${regionFolderName}/PHOTOS/${item.order_number}_${item.recipient_full_names.replace(/\s+/g, '_')}_PHOTO${ext}`
          archive.file(foundPhoto, { name: photoZipPath })
        }
      }
    }

    await archive.finalize()
  } catch (err) {
    next(err)
  }
}

// Bulk download print PDFs as a ZIP archive (auto-renders pending items on-the-fly)
router.get('/export', handleExportZip)
router.get('/regional-print-zip', handleExportZip)

// Single order item PDF download (auto-renders on-the-fly if missing)
router.get('/items/:orderItemId/download-pdf', async (req, res, next) => {
  try {
    const orderItemId = req.params.orderItemId as string
    const items = await query(
      `SELECT oi.id, oi.rendered_pdf_storage_path, oi.recipient_full_names, o.order_number
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1`,
      [orderItemId]
    )

    if (items.length === 0) {
      return res.status(404).json({ error: 'Order item not found' })
    }

    let relPath = items[0].rendered_pdf_storage_path
    let fullPdfPath = relPath ? path.join(STORAGE_ROOT, relPath) : ''

    // Auto-render PDF on-the-fly if missing
    if (!relPath || !fs.existsSync(fullPdfPath)) {
      try {
        relPath = await renderOrderItem(orderItemId)
        fullPdfPath = path.join(STORAGE_ROOT, relPath)
      } catch (renderErr: any) {
        return res.status(500).json({ error: renderErr.message || 'Failed to render PDF for order item' })
      }
    }

    const filename = `${items[0].order_number}_${items[0].recipient_full_names.replace(/\s+/g, '_')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    fs.createReadStream(fullPdfPath).pipe(res)
  } catch (err) {
    next(err)
  }
})

// Single complete order compressed ZIP download (design images, print PDFs, photo resources, dockets, manifest)
router.get('/orders/:orderId/zip', async (req, res, next) => {
  try {
    const orderId = req.params.orderId as string
    await streamOrderResourcePackage(orderId, res)
  } catch (err) {
    next(err)
  }
})

// Single order item compressed ZIP download (design templates, print PDF, photo, docket)
router.get('/items/:orderItemId/zip', async (req, res, next) => {
  try {
    const orderItemId = req.params.orderItemId as string
    await streamOrderItemResourcePackage(orderItemId, res)
  } catch (err) {
    next(err)
  }
})

// Consolidated Regional Print Hub Batch ZIP download
router.get('/hubs/:hubId/zip', async (req, res, next) => {
  try {
    const hubId = req.params.hubId as string
    await streamHubBatchPackage(hubId, res)
  } catch (err) {
    next(err)
  }
})

export default router
