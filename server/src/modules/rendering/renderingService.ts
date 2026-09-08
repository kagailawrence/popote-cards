import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { queryOne, query } from '../../config/db'
import { getDesignPages, getCustomizationZonesForDesign } from '../../db/queries/catalogQueries'
import { STORAGE_ROOT } from '../../utils/storage'

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function sanitizeWinAnsi(text: string): string {
  if (!text) return ''
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/\xA0/g, ' ')
    .replace(/[^\x00-\xFF]/g, '')
}

export async function renderOrderItem(orderItemId: string): Promise<string> {
  const item = await queryOne<any>(
    `SELECT oi.*, o.order_number, d.name as design_name, co.name as county_name, sc.name as sub_county_name, pr.name as print_region_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     WHERE oi.id = $1`,
    [orderItemId]
  )

  if (!item) throw new Error(`Order item ${orderItemId} not found`)

  // Update status to rendering
  await query(`UPDATE order_items SET render_status = 'rendering' WHERE id = $1`, [orderItemId])

  try {
    const pages = await getDesignPages(item.design_id)
    const zones = await getCustomizationZonesForDesign(item.design_id)

    // Standard 4 page fallback structure
    const pageTypes: ('front' | 'inside_left' | 'inside_right' | 'back')[] = ['front', 'inside_left', 'inside_right', 'back']

    const pdfDoc = await PDFDocument.create()
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

    const fontMap: Record<string, any> = {
      'serif': fontTimes,
      'sans-serif': fontHelvetica,
      'cursive': fontTimesItalic,
    }

    const printReadyDir = path.join(STORAGE_ROOT, 'print-ready')
    ensureDir(printReadyDir)

    // Resolve photo file path if candidate photo is provided
    let photoFilePath = ''
    if (item.custom_photo_storage_path) {
      const filename = path.basename(item.custom_photo_storage_path)
      const candidatePaths = [
        path.join(STORAGE_ROOT, 'customer-photos', filename),
        path.join(STORAGE_ROOT, 'design-images', filename),
        path.join(STORAGE_ROOT, item.custom_photo_storage_path),
        path.join(STORAGE_ROOT, item.custom_photo_storage_path.replace(/^\/+/, '')),
      ]
      for (const cp of candidatePaths) {
        if (fs.existsSync(cp)) {
          photoFilePath = cp
          break
        }
      }
    }

    for (const pageType of pageTypes) {
      const pageRecord = pages.find((p) => p.page_type === pageType)
      const pageZonePhoto = zones.find((z) => z.page_type === pageType && z.zone_type === 'photo')
      const pageZoneMsg = zones.find((z) => z.page_type === pageType && z.zone_type === 'message')

      // Resolve base image path
      let imageFilePath = pageRecord
        ? path.join(STORAGE_ROOT, 'design-images', path.basename(pageRecord.storage_path))
        : path.join(STORAGE_ROOT, 'design-images', 'default-front.webp')

      if (!fs.existsSync(imageFilePath)) {
        imageFilePath = path.join(STORAGE_ROOT, 'design-images', 'default-front.webp')
      }

      // If no image file exists at all, create a clean white canvas
      let compositePipeline: sharp.Sharp
      let width = 1200
      let height = 1600

      if (fs.existsSync(imageFilePath)) {
        compositePipeline = sharp(imageFilePath)
        const meta = await compositePipeline.metadata()
        width = meta.width || 1200
        height = meta.height || 1600
      } else {
        compositePipeline = sharp({
          create: {
            width,
            height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
      }

      const overlays: sharp.OverlayOptions[] = []

      // Note: Candidate photos are supplied as separate high-resolution resource assets 
      // for the print team to mount/insert physically, rather than hard-baked into the card canvas.

      // Render page background + image overlays via Sharp
      let finalPageBuffer: Buffer
      if (overlays.length > 0) {
        finalPageBuffer = await compositePipeline.composite(overlays).png().toBuffer()
      } else {
        finalPageBuffer = await compositePipeline.png().toBuffer()
      }

      // Add page to PDF Document
      const pdfImage = await pdfDoc.embedPng(finalPageBuffer)
      const pdfPage = pdfDoc.addPage([pdfImage.width, pdfImage.height])
      pdfPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      })

      const pageWidth = pdfImage.width
      const pageHeight = pdfImage.height

      // 2. Candidate Inscription on Inside Left (Page 2)
      if (pageType === 'inside_left') {
        const candidateName = sanitizeWinAnsi(item.recipient_full_names || 'Candidate')
        const admLine = sanitizeWinAnsi(
          `Index / ADM: ${item.admission_number || 'N/A'} • ${item.school_name || ''}${item.class_form ? ` (${item.class_form})` : ''}`
        )
        const countyLine = sanitizeWinAnsi(
          `Destination: ${item.county_name || ''}${item.sub_county_name ? ` • ${item.sub_county_name}` : ''}`
        )

        if (photoFilePath) {
          // Photo subtitle underneath photo frame
          const labelWidth = fontTimesBold.widthOfTextAtSize(candidateName, 18)
          pdfPage.drawText(candidateName, {
            x: Math.max(30, (pageWidth - labelWidth) / 2),
            y: Math.round(pageHeight * 0.18),
            size: 18,
            font: fontTimesBold,
            color: rgb(0.12, 0.12, 0.18),
          })

          const subWidth = fontHelvetica.widthOfTextAtSize(admLine, 11)
          pdfPage.drawText(admLine, {
            x: Math.max(30, (pageWidth - subWidth) / 2),
            y: Math.round(pageHeight * 0.14),
            size: 11,
            font: fontHelvetica,
            color: rgb(0.35, 0.35, 0.4),
          })
        } else {
          // If no photo was attached, render an elegant candidate dedication crest
          const dedicationTitle = 'EXAMINATION SUCCESS CANDIDATE'
          const titleWidth = fontHelveticaBold.widthOfTextAtSize(dedicationTitle, 12)
          pdfPage.drawText(dedicationTitle, {
            x: Math.max(30, (pageWidth - titleWidth) / 2),
            y: Math.round(pageHeight * 0.58),
            size: 12,
            font: fontHelveticaBold,
            color: rgb(0.74, 0.09, 0.36),
          })

          const nameWidth = fontTimesBold.widthOfTextAtSize(candidateName, 22)
          pdfPage.drawText(candidateName, {
            x: Math.max(30, (pageWidth - nameWidth) / 2),
            y: Math.round(pageHeight * 0.52),
            size: 22,
            font: fontTimesBold,
            color: rgb(0.12, 0.12, 0.18),
          })

          const admWidth = fontTimes.widthOfTextAtSize(admLine, 13)
          pdfPage.drawText(admLine, {
            x: Math.max(30, (pageWidth - admWidth) / 2),
            y: Math.round(pageHeight * 0.47),
            size: 13,
            font: fontTimes,
            color: rgb(0.3, 0.3, 0.35),
          })

          if (item.county_name) {
            const locWidth = fontHelvetica.widthOfTextAtSize(countyLine, 11)
            pdfPage.drawText(countyLine, {
              x: Math.max(30, (pageWidth - locWidth) / 2),
              y: Math.round(pageHeight * 0.43),
              size: 11,
              font: fontHelvetica,
              color: rgb(0.45, 0.45, 0.5),
            })
          }
        }
      }

      // 3. Candidate Details & Congratulatory Message on Page 3 (Inside Right)
      if (pageType === 'inside_right') {
        const selectedFont = fontMap[item.message_font || 'serif'] || fontTimesItalic
        const messageBody = sanitizeWinAnsi(
          item.message_body || 'May God grant you wisdom, excellence, and abundant success as you sit for your Examinations!'
        )
        const recipientName = sanitizeWinAnsi(item.recipient_full_names || 'Student / Candidate')
        const schoolLine = sanitizeWinAnsi(`ADM: ${item.admission_number || ''}  •  ${item.school_name || ''}${item.class_form ? ` (${item.class_form})` : ''}`)
        const primaryColor = parseHexColor(item.message_colour || '#be185d')

        // Layout boundaries
        const marginX = pageZoneMsg ? pageZoneMsg.x_px : Math.round(pageWidth * 0.12)
        const contentWidth = pageZoneMsg ? pageZoneMsg.width_px : Math.round(pageWidth * 0.76)
        let currentY = pageZoneMsg ? (pageHeight - pageZoneMsg.y_px - 30) : Math.round(pageHeight * 0.82)

        // Draw Salutation: "Dear [Candidate Name],"
        const salutation = `Dear ${recipientName},`
        pdfPage.drawText(salutation, {
          x: marginX,
          y: currentY,
          size: 20,
          font: fontTimesBold,
          color: rgb(0.12, 0.12, 0.18),
        })
        currentY -= 26

        // Draw Candidate Meta Line: "ADM: 1234  •  Kenya High School"
        pdfPage.drawText(schoolLine, {
          x: marginX,
          y: currentY,
          size: 11,
          font: fontHelvetica,
          color: rgb(0.45, 0.45, 0.5),
        })
        currentY -= 36

        // Draw Decorative Divider Line
        pdfPage.drawLine({
          start: { x: marginX, y: currentY },
          end: { x: marginX + contentWidth, y: currentY },
          thickness: 1,
          color: rgb(0.85, 0.85, 0.88),
        })
        currentY -= 32

        // Draw Message Body with dynamic wrap and font scale
        let fontSize = pageZoneMsg ? (pageZoneMsg.max_font_size_px || 22) : 20
        let lines = wrapText(messageBody, selectedFont, fontSize, contentWidth)
        let totalTextHeight = lines.length * (fontSize * 1.4)

        const availableHeight = pageZoneMsg ? pageZoneMsg.height_px : Math.round(pageHeight * 0.45)
        while (totalTextHeight > availableHeight && fontSize > 12) {
          fontSize -= 1
          lines = wrapText(messageBody, selectedFont, fontSize, contentWidth)
          totalTextHeight = lines.length * (fontSize * 1.4)
        }

        for (const line of lines) {
          let lineX = marginX
          const lineWidth = selectedFont.widthOfTextAtSize(line, fontSize)
          // Center align message text
          lineX = marginX + Math.max(0, (contentWidth - lineWidth) / 2)

          pdfPage.drawText(line, {
            x: lineX,
            y: currentY,
            size: fontSize,
            font: selectedFont,
            color: primaryColor,
          })
          currentY -= fontSize * 1.4
        }

        // Draw Warm Sign-off
        currentY -= 24
        const signoffText = "With Warmest Wishes & Sincere Prayers"
        const signoffWidth = fontTimesItalic.widthOfTextAtSize(signoffText, 14)
        pdfPage.drawText(signoffText, {
          x: marginX + Math.max(0, (contentWidth - signoffWidth) / 2),
          y: currentY,
          size: 14,
          font: fontTimesItalic,
          color: rgb(0.35, 0.35, 0.4),
        })
      }

      // 4. Commercial Print Details & Metadata Stamp on Page 4 (Back Cover)
      if (pageType === 'back') {
        const orderStamp = `ORDER: #${item.order_number} | CANDIDATE: ${sanitizeWinAnsi(item.recipient_full_names).toUpperCase()} | SIZE: ${item.size}`
        const metaStamp = `ADM: ${item.admission_number || 'N/A'} | SCHOOL: ${sanitizeWinAnsi(item.school_name)} | ${item.county_name || ''} (${item.sub_county_name || ''}) | HUB: ${item.print_region_name || 'Central Hub'}`

        pdfPage.drawText(orderStamp, {
          x: 24,
          y: 34,
          size: 9,
          font: fontHelveticaBold,
          color: rgb(0.2, 0.2, 0.25),
        })

        pdfPage.drawText(metaStamp, {
          x: 24,
          y: 20,
          size: 8,
          font: fontHelvetica,
          color: rgb(0.4, 0.4, 0.45),
        })
      }
    }

    const pdfBytes = await pdfDoc.save()
    const fileName = `order-item-${orderItemId}.pdf`
    const relativePath = path.join('print-ready', fileName)
    const fullPath = path.join(STORAGE_ROOT, relativePath)

    fs.writeFileSync(fullPath, pdfBytes)

    // Update database record
    await query(
      `UPDATE order_items 
       SET rendered_pdf_storage_path = $1, render_status = 'ready', print_status = 'queued'
       WHERE id = $2`,
      [relativePath, orderItemId]
    )

    return relativePath
  } catch (err: any) {
    console.error(`Failed to render order item ${orderItemId}:`, err)
    await query(`UPDATE order_items SET render_status = 'failed' WHERE id = $1`, [orderItemId])
    throw err
  }
}

export async function generateCustomerProof(
  designId: string,
  options: {
    pageType?: 'front' | 'inside_left' | 'inside_right' | 'back'
    message?: string
    font?: string
    colour?: string
    photoPath?: string
    recipientName?: string
  }
): Promise<Buffer> {
  const pageType = options.pageType || 'inside_right'
  const pages = await getDesignPages(designId)
  const zones = await getCustomizationZonesForDesign(designId)

  const pageRecord = pages.find((p) => p.page_type === pageType)
  const pageZonePhoto = zones.find((z) => z.page_type === pageType && z.zone_type === 'photo')
  const pageZoneMsg = zones.find((z) => z.page_type === pageType && z.zone_type === 'message')

  let imageFilePath = pageRecord
    ? path.join(STORAGE_ROOT, 'design-images', path.basename(pageRecord.storage_path))
    : path.join(STORAGE_ROOT, 'design-images', 'default-front.webp')

  if (!fs.existsSync(imageFilePath)) {
    imageFilePath = path.join(STORAGE_ROOT, 'design-images', 'default-front.webp')
  }

  let pipeline: sharp.Sharp
  let width = 800
  let height = 600

  if (fs.existsSync(imageFilePath)) {
    pipeline = sharp(imageFilePath)
    const meta = await pipeline.metadata()
    width = meta.width || 800
    height = meta.height || 600
  } else {
    pipeline = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
  }

  const overlays: sharp.OverlayOptions[] = []

  // 1. Overlay Custom Photo if inside_left or photo zone
  if (options.photoPath && (pageType === 'inside_left' || (pageZonePhoto && pageZonePhoto.page_type === pageType))) {
    let photoFilePath = path.join(STORAGE_ROOT, 'customer-photos', path.basename(options.photoPath))
    if (!fs.existsSync(photoFilePath)) {
      photoFilePath = path.join(STORAGE_ROOT, 'design-images', path.basename(options.photoPath))
    }

    if (fs.existsSync(photoFilePath)) {
      const pWidth = pageZonePhoto ? pageZonePhoto.width_px : Math.round(width * 0.6)
      const pHeight = pageZonePhoto ? pageZonePhoto.height_px : Math.round(height * 0.55)
      const pX = pageZonePhoto ? Math.max(0, pageZonePhoto.x_px) : Math.round((width - pWidth) / 2)
      const pY = pageZonePhoto ? Math.max(0, pageZonePhoto.y_px) : Math.round(height * 0.2)

      try {
        const croppedBuffer = await sharp(photoFilePath)
          .resize({
            width: pWidth,
            height: pHeight,
            fit: 'cover',
            position: 'center',
          })
          .toBuffer()

        overlays.push({
          input: croppedBuffer,
          left: pX,
          top: pY,
        })
      } catch (err) {
        console.warn('Failed to overlay customer proof photo', err)
      }
    }
  }

  // 2. Overlay SVG Text for inside_right
  if (pageType === 'inside_right' || options.message || options.recipientName) {
    const msgText = options.message || 'Congratulations on your Examination Triumph!'
    const recName = options.recipientName ? `Dear ${options.recipientName},` : ''
    const textColour = options.colour || '#be185d'
    const fontFamily = options.font === 'sans-serif' ? 'system-ui, sans-serif' : options.font === 'cursive' ? 'cursive, Georgia' : 'Georgia, serif'

    const svgX = pageZoneMsg ? pageZoneMsg.x_px : Math.round(width * 0.1)
    const svgY = pageZoneMsg ? pageZoneMsg.y_px : Math.round(height * 0.15)
    const svgW = pageZoneMsg ? pageZoneMsg.width_px : Math.round(width * 0.8)
    const svgH = pageZoneMsg ? pageZoneMsg.height_px : Math.round(height * 0.7)

    const svgContent = `
      <svg width="${width}" height="${height}">
        <foreignObject x="${svgX}" y="${svgY}" width="${svgW}" height="${svgH}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; font-family:${fontFamily}; color:${textColour}; font-size:22px; text-align:center; overflow:hidden; font-style:italic; line-height:1.4; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            ${recName ? `<div style="font-size:24px; font-weight:bold; margin-bottom:12px; font-style:normal; color:#1e293b;">${recName}</div>` : ''}
            <div>"${msgText}"</div>
          </div>
        </foreignObject>
      </svg>
    `

    overlays.push({
      input: Buffer.from(svgContent),
      top: 0,
      left: 0,
    })
  }

  if (overlays.length > 0) {
    return pipeline.composite(overlays).png().toBuffer()
  }

  return pipeline.png().toBuffer()
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0] || ''

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const testLine = `${currentLine} ${word}`
    const width = font.widthOfTextAtSize(testLine, fontSize)
    if (width < maxWidth) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

function parseHexColor(hex: string) {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return rgb(0.74, 0.09, 0.36)
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}
