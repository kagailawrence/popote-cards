import path from 'path'
import fs from 'fs'
import { Response } from 'express'
import { query, queryOne } from '../config/db'
import { getDesignPages } from '../db/queries/catalogQueries'
import { renderOrderItem } from '../modules/rendering/renderingService'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiverModule = require('archiver')

export function createZipArchive(options: any = { zlib: { level: 9 } }): any {
  if (typeof archiverModule === 'function') {
    return archiverModule('zip', options)
  }
  if (archiverModule.default && typeof archiverModule.default === 'function') {
    return archiverModule.default('zip', options)
  }
  if (archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options)
  }
  if (archiverModule.create) {
    return archiverModule.create('zip', options)
  }
  throw new Error('Unable to initialize zip archiver engine')
}

const STORAGE_ROOT = path.resolve(__dirname, '../../../storage')

function sanitizeFilename(name: string): string {
  if (!name) return 'Card'
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 50)
}

function resolvePhotoFilePath(customPhotoPath?: string | null): string | null {
  if (!customPhotoPath) return null
  const filename = path.basename(customPhotoPath)
  const candidatePaths = [
    path.join(STORAGE_ROOT, 'customer-photos', filename),
    path.join(STORAGE_ROOT, 'design-images', filename),
    path.join(STORAGE_ROOT, customPhotoPath),
    path.join(STORAGE_ROOT, customPhotoPath.replace(/^\/+/, '')),
  ]
  for (const cp of candidatePaths) {
    if (fs.existsSync(cp)) {
      return cp
    }
  }
  return null
}

function generateProductionDocketHtml(item: any, order: any): string {
  const photoFilename = item.custom_photo_storage_path ? path.basename(item.custom_photo_storage_path) : ''
  const religionDisplay =
    item.religion === 'christian' ||
    (!item.religion &&
      item.message_body &&
      (item.message_body.toLowerCase().includes('god') ||
        item.message_body.toLowerCase().includes('christ') ||
        item.message_body.toLowerCase().includes('lord')))
      ? '✝️ Christian Blessing'
      : item.religion === 'muslim' || (item.message_body && item.message_body.toLowerCase().includes('allah'))
      ? '☪️ Islamic Blessing'
      : '🎓 General / Non-Denominational'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>PRODUCTION DOCKET • Order #${order.order_number} • ${item.recipient_full_names}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; line-height: 1.5; }
    .docket-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; background: #fdf2f8; color: #db2777; font-size: 11px; font-weight: 800; text-transform: uppercase; border-radius: 9999px; border: 1px solid #fbcfe8; }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .field-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
    .field-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { font-size: 14px; font-weight: 700; color: #1e293b; }
    .message-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .message-text { font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-style: italic; color: #881337; line-height: 1.6; margin-top: 8px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="docket-container">
    <div class="header">
      <div>
        <span class="badge">Commercial Print Docket</span>
        <h1 class="title">Order #${order.order_number}</h1>
        <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Card Size: <strong>${item.size} (4-Page Bi-Fold)</strong> | Created: ${new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 4px 10px; border-radius: 8px; border: 1px solid #a7f3d0;">
          STATUS: ${String(order.status || 'PAID').toUpperCase()}
        </span>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Customer: <strong>${order.phone || order.customer_phone || 'N/A'}</strong></div>
      </div>
    </div>

    <div class="grid">
      <div class="field-card">
        <div class="field-label">Candidate / Recipient Name</div>
        <div class="field-value" style="font-size: 16px; color: #db2777;">${item.recipient_full_names}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Admission / Index Number</div>
        <div class="field-value">${item.admission_number || 'N/A'}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Destination School</div>
        <div class="field-value">${item.school_name} ${item.class_form ? `(${item.class_form})` : ''}</div>
      </div>
      <div class="field-card">
        <div class="field-label">County & Sub-County</div>
        <div class="field-value">${item.county_name || 'Kenya'} • ${item.sub_county_name || ''}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Design Template</div>
        <div class="field-value">${item.design_name || 'Success Card Design'}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Blessing Category</div>
        <div class="field-value">${religionDisplay}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Photo Uploaded</div>
        <div class="field-value">${photoFilename ? `YES (${photoFilename})` : 'NO (Standard Illustrated Design)'}</div>
      </div>
      <div class="field-card">
        <div class="field-label">Assigned Print Hub</div>
        <div class="field-value">${item.print_region_name || 'Regional Print Center'}</div>
      </div>
    </div>

    <div class="message-box">
      <div class="field-label" style="color: #9f1239;">Custom Inside Message (Font: ${item.message_font || 'serif'} | Colour: ${item.message_colour || '#ec4899'})</div>
      <div class="message-text">
        "${item.message_body || 'May God grant you knowledge, wisdom, and peace as you sit for your examinations!'}"
      </div>
    </div>

    <div class="footer">
      <div>Success Card Delivery Platform • Production Manifest</div>
      <div>Order ID: ${order.id} • Item ID: ${item.id}</div>
    </div>
  </div>
</body>
</html>`
}

function generatePrintInstructionsText(order: any, items: any[]): string {
  return `================================================================================
SUCCESS CARD DELIVERY PLATFORM - COMMERCIAL PRINT & FINISHING INSTRUCTIONS
================================================================================

ORDER NUMBER     : #${order.order_number}
CUSTOMER PHONE   : ${order.phone || order.customer_phone || 'N/A'}
DELIVERY STATUS  : ${String(order.status || 'PAID').toUpperCase()}
ORDER DATE       : ${new Date(order.created_at || Date.now()).toISOString()}
TOTAL ITEMS/CARDS: ${items.length}
DELIVERY COUNTY  : ${items[0]?.county_name || 'Kenya'} (${items[0]?.sub_county_name || 'Central'})

--------------------------------------------------------------------------------
PRINTING SPECIFICATIONS & PAPER STOCK GUIDELINES
--------------------------------------------------------------------------------
1. PAPER STOCK:
   - Recommended: 300gsm to 350gsm Premium Art Card or Linen Textured Cardstock.
   - Finish: Matte or Soft-Touch Velvet lamination on the outer cover; Uncoated inside for crisp typography.

2. PRINT RESOLUTION:
   - 300 DPI High-Resolution CMYK Vector Print (refer to PRINT_READY_CARDS folder).

3. FOLDING & SCORING:
   - Score along the center vertical crease line before folding.
   - Fold: 4-Page Bi-Fold (Page 1 = Front Cover, Page 2 = Inside Left, Page 3 = Inside Right with Custom Message, Page 4 = Back Cover).

4. PACKAGING & DISPATCH:
   - Place each completed card in a branded presentation envelope.
   - Affix destination school docket on the exterior dispatch parcel.

--------------------------------------------------------------------------------
INCLUDED ORDER ITEMS:
--------------------------------------------------------------------------------
${items
  .map(
    (it, i) => `
[CARD #${i + 1}]
- Candidate Name   : ${it.recipient_full_names}
- Admission/Index  : ${it.admission_number || 'N/A'}
- School Name      : ${it.school_name} ${it.class_form ? `(${it.class_form})` : ''}
- County / Hub     : ${it.county_name || 'Kenya'} / ${it.print_region_name || 'General'}
- Card Size        : ${it.size}
- Design Template  : ${it.design_name || 'Standard'}
- Custom Photo     : ${it.custom_photo_storage_path ? 'YES (See CANDIDATE_PHOTOS folder)' : 'NO'}
- Message Snippet  : "${(it.message_body || '').substring(0, 80)}..."
`
  )
  .join('\n')}

================================================================================
Generated on: ${new Date().toLocaleString()}
Success Card Delivery Platform - All Rights Reserved.
================================================================================
`
}

/**
 * Builds and streams a complete compressed ZIP file with all designs, print PDFs,
 * candidate photos, production dockets, and manifest files for an order.
 */
export async function streamOrderResourcePackage(orderIdOrNumber: string, res: Response): Promise<void> {
  const order = await queryOne<any>(
    `SELECT o.*, c.phone as customer_phone, c.email as customer_email
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id::text = $1 OR o.order_number = $1`,
    [orderIdOrNumber]
  )

  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const items = await query<any>(
    `SELECT oi.*, 
            d.name as design_name, d.card_type, d.description as design_description, d.thumbnail_path as design_thumbnail,
            co.name as county_name, sc.name as sub_county_name, pr.name as print_region_name
     FROM order_items oi
     LEFT JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     WHERE oi.order_id = $1
     ORDER BY oi.created_at ASC`,
    [order.id]
  )

  if (items.length === 0) {
    res.status(404).json({ error: 'No items found for this order' })
    return
  }

  const zipFilename = `Order_${order.order_number}_Design_and_Resources_Package.zip`
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)

  const archive = createZipArchive({ zlib: { level: 9 } })
  archive.pipe(res)

  const rootFolder = `Order_${order.order_number}`

  // 1. Add Order-Level Manifest & Instructions
  const manifest = {
    order_number: order.order_number,
    order_id: order.id,
    customer_phone: order.phone || order.customer_phone,
    customer_email: order.customer_email,
    status: order.status,
    total_amount_kes: Number(order.total_amount_kes),
    created_at: order.created_at,
    total_cards: items.length,
    items: items.map((it, idx) => ({
      item_index: idx + 1,
      item_id: it.id,
      recipient_full_names: it.recipient_full_names,
      admission_number: it.admission_number,
      school_name: it.school_name,
      class_form: it.class_form,
      county: it.county_name,
      sub_county: it.sub_county_name,
      print_hub: it.print_region_name,
      size: it.size,
      design_name: it.design_name,
      has_custom_photo: Boolean(it.custom_photo_storage_path),
      message_body: it.message_body,
      message_font: it.message_font,
      message_colour: it.message_colour,
      religion: it.religion,
    })),
  }

  archive.append(JSON.stringify(manifest, null, 2), { name: `${rootFolder}/ORDER_MANIFEST.json` })
  archive.append(generatePrintInstructionsText(order, items), { name: `${rootFolder}/README_PRINT_INSTRUCTIONS.txt` })

  // 2. Process each card item
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const itemIndex = i + 1
    const cleanRecipient = sanitizeFilename(item.recipient_full_names)
    const cleanDesign = sanitizeFilename(item.design_name || 'Design')

    // A. Render / Include 4-Page Print PDF
    let relPdfPath = item.rendered_pdf_storage_path
    let fullPdfPath = relPdfPath ? path.join(STORAGE_ROOT, relPdfPath) : ''

    if (!relPdfPath || !fs.existsSync(fullPdfPath)) {
      try {
        relPdfPath = await renderOrderItem(item.id)
        fullPdfPath = path.join(STORAGE_ROOT, relPdfPath)
      } catch (renderErr) {
        console.error(`Failed to auto-render PDF for item ${item.id}:`, renderErr)
      }
    }

    if (fullPdfPath && fs.existsSync(fullPdfPath)) {
      const pdfZipName = `${rootFolder}/PRINT_READY_CARDS/Card_${itemIndex}_${item.size}_${cleanRecipient}_PRINT_READY.pdf`
      archive.file(fullPdfPath, { name: pdfZipName })
    }

    // B. Include Design Cover & Inside Page Templates
    if (item.design_id) {
      try {
        const designPages = await getDesignPages(item.design_id)
        for (const page of designPages) {
          if (page.storage_path) {
            const pageFilename = path.basename(page.storage_path)
            const candidateDesignPaths = [
              path.join(STORAGE_ROOT, 'design-images', pageFilename),
              path.join(STORAGE_ROOT, page.storage_path),
              path.join(STORAGE_ROOT, page.storage_path.replace(/^\/+/, '')),
            ]
            const foundDesign = candidateDesignPaths.find((p) => fs.existsSync(p))
            if (foundDesign) {
              const ext = path.extname(foundDesign) || '.webp'
              const designZipName = `${rootFolder}/CARD_DESIGNS/Card_${itemIndex}_${cleanDesign}_${page.page_type}${ext}`
              archive.file(foundDesign, { name: designZipName })
            }
          }
        }
      } catch (pageErr) {
        console.warn(`Could not load design pages for design ${item.design_id}:`, pageErr)
      }
    }

    // C. Include Uploaded Candidate Photo Resource
    const photoPath = resolvePhotoFilePath(item.custom_photo_storage_path)
    if (photoPath) {
      const ext = path.extname(photoPath) || '.jpg'
      const photoZipName = `${rootFolder}/CANDIDATE_PHOTOS/Card_${itemIndex}_${cleanRecipient}_Photo${ext}`
      archive.file(photoPath, { name: photoZipName })
    }

    // D. Include High-Definition Production Docket HTML
    const docketHtml = generateProductionDocketHtml(item, order)
    archive.append(docketHtml, {
      name: `${rootFolder}/PRODUCTION_DOCKETS/Card_${itemIndex}_${cleanRecipient}_Docket.html`,
    })
  }

  await archive.finalize()
}

/**
 * Builds and streams a compressed ZIP file for a single card/item.
 */
export async function streamOrderItemResourcePackage(orderItemId: string, res: Response): Promise<void> {
  const item = await queryOne<any>(
    `SELECT oi.*, o.order_number, o.phone as customer_phone, o.created_at as order_created_at, o.status as order_status,
            d.name as design_name, d.card_type, d.description as design_description,
            co.name as county_name, sc.name as sub_county_name, pr.name as print_region_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     WHERE oi.id = $1`,
    [orderItemId]
  )

  if (!item) {
    res.status(404).json({ error: 'Order item not found' })
    return
  }

  const cleanRecipient = sanitizeFilename(item.recipient_full_names)
  const zipFilename = `Card_${item.order_number}_${cleanRecipient}_Resources.zip`

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)

  const archive = createZipArchive({ zlib: { level: 9 } })
  archive.pipe(res)

  const rootFolder = `Card_${item.order_number}_${cleanRecipient}`

  // 1. PDF
  let relPdfPath = item.rendered_pdf_storage_path
  let fullPdfPath = relPdfPath ? path.join(STORAGE_ROOT, relPdfPath) : ''
  if (!relPdfPath || !fs.existsSync(fullPdfPath)) {
    try {
      relPdfPath = await renderOrderItem(item.id)
      fullPdfPath = path.join(STORAGE_ROOT, relPdfPath)
    } catch (err) {
      console.error(`Failed to auto-render PDF for item ${item.id}:`, err)
    }
  }

  if (fullPdfPath && fs.existsSync(fullPdfPath)) {
    archive.file(fullPdfPath, { name: `${rootFolder}/${item.size}_${cleanRecipient}_PRINT_READY.pdf` })
  }

  // 2. Designs
  if (item.design_id) {
    try {
      const designPages = await getDesignPages(item.design_id)
      for (const page of designPages) {
        if (page.storage_path) {
          const pageFilename = path.basename(page.storage_path)
          const candidateDesignPaths = [
            path.join(STORAGE_ROOT, 'design-images', pageFilename),
            path.join(STORAGE_ROOT, page.storage_path),
            path.join(STORAGE_ROOT, page.storage_path.replace(/^\/+/, '')),
          ]
          const foundDesign = candidateDesignPaths.find((p) => fs.existsSync(p))
          if (foundDesign) {
            const ext = path.extname(foundDesign) || '.webp'
            archive.file(foundDesign, { name: `${rootFolder}/DESIGN_TEMPLATES/${page.page_type}${ext}` })
          }
        }
      }
    } catch {}
  }

  // 3. Photo
  const photoPath = resolvePhotoFilePath(item.custom_photo_storage_path)
  if (photoPath) {
    const ext = path.extname(photoPath) || '.jpg'
    archive.file(photoPath, { name: `${rootFolder}/CANDIDATE_PHOTO${ext}` })
  }

  // 4. Docket & Manifest
  const docketHtml = generateProductionDocketHtml(item, {
    order_number: item.order_number,
    created_at: item.order_created_at,
    status: item.order_status,
    phone: item.customer_phone,
    id: item.order_id,
  })
  archive.append(docketHtml, { name: `${rootFolder}/PRODUCTION_DOCKET.html` })

  await archive.finalize()
}

/**
 * Builds and streams a consolidated ZIP package for all active/pending cards assigned to a specific regional print hub.
 */
export async function streamHubBatchPackage(hubId: string, res: Response): Promise<void> {
  const hub = await queryOne<any>(`SELECT * FROM print_regions WHERE id = $1`, [hubId])
  if (!hub) {
    res.status(404).json({ error: 'Regional print hub not found' })
    return
  }

  const items = await query<any>(
    `SELECT oi.*, o.order_number, o.phone as customer_phone, o.created_at as order_created_at, o.status as order_status,
            d.name as design_name, co.name as county_name, sc.name as sub_county_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     WHERE oi.print_region_id = $1 AND o.status != 'cancelled'
     ORDER BY oi.school_name ASC, oi.created_at ASC`,
    [hubId]
  )

  if (items.length === 0) {
    res.status(404).json({ error: 'No active orders or cards found for this hub' })
    return
  }

  const cleanHubName = sanitizeFilename(hub.name)
  const zipFilename = `${cleanHubName}_Hub_Print_Batch_${new Date().toISOString().split('T')[0]}.zip`

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)

  const archive = createZipArchive({ zlib: { level: 9 } })
  archive.pipe(res)

  const rootFolder = `${cleanHubName}_Batch_${items.length}_Cards`

  // Summary & Packing Slip
  const batchSummary = `================================================================================
REGIONAL PRINT HUB BATCH DISPATCH - ${hub.name.toUpperCase()} HUB
================================================================================
Contact Person   : ${hub.contact_person || 'N/A'}
Hub Phone        : ${hub.phone || 'N/A'}
Hub WhatsApp     : ${hub.whatsapp_number || 'N/A'}
Hub Address      : ${hub.address || 'N/A'}
Generated Date   : ${new Date().toLocaleString()}
Total Cards Count: ${items.length}

SCHOOLS TO DISPATCH:
${Array.from(new Set(items.map((it: any) => it.school_name)))
  .map((sch: any, idx) => `${idx + 1}. ${sch}`)
  .join('\n')}

================================================================================
`
  archive.append(batchSummary, { name: `${rootFolder}/HUB_BATCH_SUMMARY.txt` })

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const cleanSchool = sanitizeFilename(item.school_name || 'School')
    const cleanRecipient = sanitizeFilename(item.recipient_full_names)

    // Render PDF
    let relPdfPath = item.rendered_pdf_storage_path
    let fullPdfPath = relPdfPath ? path.join(STORAGE_ROOT, relPdfPath) : ''
    if (!relPdfPath || !fs.existsSync(fullPdfPath)) {
      try {
        relPdfPath = await renderOrderItem(item.id)
        fullPdfPath = path.join(STORAGE_ROOT, relPdfPath)
      } catch (err) {
        console.error(`Failed to auto-render PDF for batch item ${item.id}:`, err)
      }
    }

    if (fullPdfPath && fs.existsSync(fullPdfPath)) {
      archive.file(fullPdfPath, {
        name: `${rootFolder}/${cleanSchool}/${item.order_number}_${item.size}_${cleanRecipient}.pdf`,
      })
    }

    // Photo
    const photoPath = resolvePhotoFilePath(item.custom_photo_storage_path)
    if (photoPath) {
      const ext = path.extname(photoPath) || '.jpg'
      archive.file(photoPath, {
        name: `${rootFolder}/${cleanSchool}/PHOTOS/${item.order_number}_${cleanRecipient}_Photo${ext}`,
      })
    }

    // Docket
    const docketHtml = generateProductionDocketHtml(item, {
      order_number: item.order_number,
      created_at: item.order_created_at,
      status: item.order_status,
      phone: item.customer_phone,
      id: item.order_id,
    })
    archive.append(docketHtml, {
      name: `${rootFolder}/${cleanSchool}/DOCKETS/${item.order_number}_${cleanRecipient}_Docket.html`,
    })
  }

  await archive.finalize()
}
