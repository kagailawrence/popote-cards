import { query, queryOne } from '../../config/db'

export interface Design {
  id: string
  name: string
  description: string | null
  card_type: 'standard' | 'customizable'
  default_message: string | null
  price_kes: number
  price_a5_kes: number
  price_a4_kes: number
  price_a3_kes: number
  compare_at_price_kes: number | null
  compare_at_a5_kes: number | null
  compare_at_a4_kes: number | null
  compare_at_a3_kes: number | null
  discount_percent: number | null
  is_active: boolean
  allows_custom_message: boolean
  allows_custom_photo: boolean
  thumbnail_path: string | null
  created_at: Date
  updated_at: Date
}

export interface DesignImage {
  id: string
  design_id: string
  storage_path: string
  angle_order: number
}

export interface DesignPage {
  id: string
  design_id: string
  page_type: 'front' | 'inside_left' | 'inside_right' | 'back'
  storage_path: string
  width_px: number
  height_px: number
  created_at: Date
}

export interface CustomizationZone {
  id: string
  design_page_id: string
  zone_type: 'message' | 'photo'
  x_px: number
  y_px: number
  width_px: number
  height_px: number
  font_family?: string
  max_font_size_px?: number
  text_align?: string
  created_at: Date
}

export interface Category {
  id: string
  type: 'occasion' | 'style' | 'religion'
  name: string
}

export async function getActiveDesigns(filters?: { occasion?: string; style?: string; religion?: string }): Promise<Design[]> {
  let sql = `
    SELECT DISTINCT d.id, d.name, d.description, d.card_type, d.default_message, 
           d.price_kes, d.price_a5_kes, d.price_a4_kes, d.price_a3_kes,
           d.compare_at_price_kes, d.compare_at_a5_kes, d.compare_at_a4_kes, d.compare_at_a3_kes,
           d.discount_percent, d.is_active, d.allows_custom_message, d.allows_custom_photo, d.thumbnail_path, d.created_at, d.updated_at
    FROM designs d
    LEFT JOIN design_categories dc ON dc.design_id = d.id
    LEFT JOIN categories c ON c.id = dc.category_id
    WHERE d.is_active = true
  `
  const params: any[] = []

  if (filters?.occasion) {
    params.push(filters.occasion)
    sql += ` AND d.id IN (SELECT dc1.design_id FROM design_categories dc1 JOIN categories c1 ON c1.id = dc1.category_id WHERE c1.name = $${params.length})`
  }
  if (filters?.style) {
    params.push(filters.style)
    sql += ` AND d.id IN (SELECT dc2.design_id FROM design_categories dc2 JOIN categories c2 ON c2.id = dc2.category_id WHERE c2.name = $${params.length})`
  }
  if (filters?.religion) {
    params.push(filters.religion)
    sql += ` AND d.id IN (SELECT dc3.design_id FROM design_categories dc3 JOIN categories c3 ON c3.id = dc3.category_id WHERE c3.name = $${params.length})`
  }

  sql += ` ORDER BY d.created_at DESC`
  return query<Design>(sql, params)
}

export async function getDesignById(id: string): Promise<Design | null> {
  return queryOne<Design>(
    `SELECT id, name, description, card_type, default_message, 
            price_kes, price_a5_kes, price_a4_kes, price_a3_kes,
            compare_at_price_kes, compare_at_a5_kes, compare_at_a4_kes, compare_at_a3_kes,
            discount_percent, is_active, allows_custom_message, allows_custom_photo, thumbnail_path, created_at, updated_at
     FROM designs WHERE id = $1`,
    [id]
  )
}

export async function updateDesignFlags(id: string, allowsCustomMessage: boolean, allowsCustomPhoto: boolean): Promise<void> {
  await query(
    `UPDATE designs SET allows_custom_message = $1, allows_custom_photo = $2, updated_at = now() WHERE id = $3`,
    [allowsCustomMessage, allowsCustomPhoto, id]
  )
}

export async function updateDesignThumbnail(id: string, thumbnailPath: string): Promise<void> {
  await query(
    `UPDATE designs SET thumbnail_path = $1, updated_at = now() WHERE id = $2`,
    [thumbnailPath, id]
  )
}

export async function getDesignImages(designId: string): Promise<DesignImage[]> {
  return query<DesignImage>(
    `SELECT id, design_id, storage_path, angle_order
     FROM design_images WHERE design_id = $1 ORDER BY angle_order ASC`,
    [designId]
  )
}

// Design Pages Queries
export async function upsertDesignPage(
  designId: string,
  pageType: 'front' | 'inside_left' | 'inside_right' | 'back',
  storagePath: string,
  widthPx: number,
  heightPx: number
): Promise<DesignPage> {
  const row = await queryOne<DesignPage>(
    `INSERT INTO design_pages (design_id, page_type, storage_path, width_px, height_px)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (design_id, page_type) DO UPDATE SET
       storage_path = EXCLUDED.storage_path,
       width_px = EXCLUDED.width_px,
       height_px = EXCLUDED.height_px
     RETURNING id, design_id, page_type, storage_path, width_px, height_px, created_at`,
    [designId, pageType, storagePath, widthPx, heightPx]
  )
  return row!
}

export async function getDesignPages(designId: string): Promise<DesignPage[]> {
  return query<DesignPage>(
    `SELECT id, design_id, page_type, storage_path, width_px, height_px, created_at
     FROM design_pages WHERE design_id = $1 ORDER BY 
     CASE page_type 
       WHEN 'front' THEN 1 
       WHEN 'inside_left' THEN 2 
       WHEN 'inside_right' THEN 3 
       WHEN 'back' THEN 4 
     END ASC`,
    [designId]
  )
}

export async function getDesignPageById(pageId: string): Promise<DesignPage | null> {
  return queryOne<DesignPage>(
    `SELECT id, design_id, page_type, storage_path, width_px, height_px, created_at
     FROM design_pages WHERE id = $1`,
    [pageId]
  )
}

// Customization Zones Queries
export async function upsertCustomizationZone(
  designPageId: string,
  zoneType: 'message' | 'photo',
  xPx: number,
  yPx: number,
  widthPx: number,
  heightPx: number,
  fontFamily: string = 'serif',
  maxFontSizePx: number = 24,
  textAlign: string = 'left'
): Promise<CustomizationZone> {
  const row = await queryOne<CustomizationZone>(
    `INSERT INTO customization_zones (design_page_id, zone_type, x_px, y_px, width_px, height_px, font_family, max_font_size_px, text_align)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (design_page_id, zone_type) DO UPDATE SET
       x_px = EXCLUDED.x_px,
       y_px = EXCLUDED.y_px,
       width_px = EXCLUDED.width_px,
       height_px = EXCLUDED.height_px,
       font_family = EXCLUDED.font_family,
       max_font_size_px = EXCLUDED.max_font_size_px,
       text_align = EXCLUDED.text_align
     RETURNING id, design_page_id, zone_type, x_px, y_px, width_px, height_px, font_family, max_font_size_px, text_align, created_at`,
    [designPageId, zoneType, xPx, yPx, widthPx, heightPx, fontFamily, maxFontSizePx, textAlign]
  )
  return row!
}

export async function getCustomizationZonesForPage(designPageId: string): Promise<CustomizationZone[]> {
  return query<CustomizationZone>(
    `SELECT id, design_page_id, zone_type, x_px, y_px, width_px, height_px, font_family, max_font_size_px, text_align, created_at
     FROM customization_zones WHERE design_page_id = $1`,
    [designPageId]
  )
}

export async function getCustomizationZonesForDesign(designId: string): Promise<(CustomizationZone & { page_type: string })[]> {
  return query<CustomizationZone & { page_type: string }>(
    `SELECT cz.*, dp.page_type
     FROM customization_zones cz
     JOIN design_pages dp ON dp.id = cz.design_page_id
     WHERE dp.design_id = $1`,
    [designId]
  )
}

export async function getCategories(): Promise<Category[]> {
  return query<Category>(
    `SELECT id, type, name FROM categories ORDER BY type ASC, name ASC`
  )
}

export async function getDesignCategories(designId: string): Promise<Category[]> {
  return query<Category>(
    `SELECT c.id, c.type, c.name
     FROM categories c
     JOIN design_categories dc ON dc.category_id = c.id
     WHERE dc.design_id = $1
     ORDER BY c.type ASC, c.name ASC`,
    [designId]
  )
}

export async function getAllDesignCategories(): Promise<{ design_id: string; category_id: string; type: 'occasion' | 'style' | 'religion'; name: string }[]> {
  return query<{ design_id: string; category_id: string; type: 'occasion' | 'style' | 'religion'; name: string }>(
    `SELECT dc.design_id, c.id as category_id, c.type, c.name
     FROM design_categories dc
     JOIN categories c ON c.id = dc.category_id
     ORDER BY c.type ASC, c.name ASC`
  )
}

export async function setDesignCategories(designId: string, categoryIds: string[]): Promise<void> {
  await query(`DELETE FROM design_categories WHERE design_id = $1`, [designId])
  if (categoryIds && categoryIds.length > 0) {
    for (const catId of categoryIds) {
      await query(
        `INSERT INTO design_categories (design_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [designId, catId]
      )
    }
  }
}

export async function getMessageTemplates(occasionCategoryName?: string): Promise<{ id: string; occasion_name: string; body: string }[]> {
  let sql = `
    SELECT mt.id, c.name as occasion_name, mt.body
    FROM message_templates mt
    LEFT JOIN categories c ON c.id = mt.occasion_category_id
  `
  const params: any[] = []
  if (occasionCategoryName) {
    params.push(occasionCategoryName)
    sql += ` WHERE c.name = $1`
  }
  return query(sql, params)
}

export async function createCategory(type: 'occasion' | 'style' | 'religion', name: string): Promise<Category> {
  const row = await queryOne<Category>(
    `INSERT INTO categories (type, name) VALUES ($1, $2) RETURNING id, type, name`,
    [type, name]
  )
  return row!
}

export async function deleteCategory(id: string): Promise<void> {
  await query(`DELETE FROM categories WHERE id = $1`, [id])
}

function cleanNumber(val: any, defaultVal: number): number {
  if (val === undefined || val === null || val === '') return defaultVal
  const cleaned = typeof val === 'string' ? val.replace(/[^0-9.]/g, '') : val
  const num = Number(cleaned)
  return isNaN(num) || num <= 0 ? defaultVal : num
}

function cleanOptionalNumber(val: any): number | null {
  if (val === undefined || val === null || val === '') return null
  const cleaned = typeof val === 'string' ? val.replace(/[^0-9.]/g, '') : val
  const num = Number(cleaned)
  return isNaN(num) || num <= 0 ? null : num
}

function cleanOptionalInt(val: any): number | null {
  if (val === undefined || val === null || val === '') return null
  const cleaned = typeof val === 'string' ? val.replace(/[^0-9]/g, '') : val
  const num = parseInt(String(cleaned), 10)
  return isNaN(num) ? null : num
}

export async function createDesign(
  name: string,
  description: string,
  allowsCustomPhoto: boolean = true,
  categoryIds: string[] = [],
  cardType: 'standard' | 'customizable' = 'customizable',
  defaultMessage: string | null = null,
  allowsCustomMessage: boolean = true,
  priceKes: number = 850,
  compareAtPriceKes: number | null = null,
  discountPercent: number | null = null,
  priceA5Kes?: number,
  priceA4Kes?: number,
  priceA3Kes?: number,
  compareAtA5Kes?: number | null,
  compareAtA4Kes?: number | null,
  compareAtA3Kes?: number | null
): Promise<Design> {
  const isCustom = cardType === 'customizable'
  const finalAllowsMsg = isCustom ? allowsCustomMessage : false
  const finalAllowsPhoto = isCustom ? allowsCustomPhoto : false
  const finalDefaultMsg = defaultMessage || (cardType === 'standard' ? 'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!' : null)
  
  const finalA4 = cleanNumber(priceA4Kes !== undefined ? priceA4Kes : priceKes, 850)
  const finalA5 = cleanNumber(priceA5Kes !== undefined ? priceA5Kes : Math.round(finalA4 * 0.65), 500)
  const finalA3 = cleanNumber(priceA3Kes !== undefined ? priceA3Kes : Math.round(finalA4 * 1.65), 1400)

  const finalCompA4 = cleanOptionalNumber(compareAtA4Kes !== undefined ? compareAtA4Kes : compareAtPriceKes)
  const finalCompA5 = cleanOptionalNumber(compareAtA5Kes !== undefined ? compareAtA5Kes : (finalCompA4 ? Math.round(finalCompA4 * 0.65) : null))
  const finalCompA3 = cleanOptionalNumber(compareAtA3Kes !== undefined ? compareAtA3Kes : (finalCompA4 ? Math.round(finalCompA4 * 1.65) : null))

  const finalDiscount = cleanOptionalInt(
    discountPercent !== null && discountPercent !== undefined
      ? discountPercent
      : (finalCompA4 && finalCompA4 > finalA4
        ? Math.round(((finalCompA4 - finalA4) / finalCompA4) * 100)
        : null)
  )

  const design = await queryOne<Design>(
    `INSERT INTO designs (
       name, description, card_type, default_message, 
       price_kes, price_a5_kes, price_a4_kes, price_a3_kes,
       compare_at_price_kes, compare_at_a5_kes, compare_at_a4_kes, compare_at_a3_kes,
       discount_percent, allows_custom_photo, allows_custom_message, is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
     RETURNING id, name, description, card_type, default_message, 
               price_kes, price_a5_kes, price_a4_kes, price_a3_kes,
               compare_at_price_kes, compare_at_a5_kes, compare_at_a4_kes, compare_at_a3_kes,
               discount_percent, is_active, allows_custom_photo, allows_custom_message, created_at, updated_at`,
    [
      name, description, cardType, finalDefaultMsg, 
      finalA4, finalA5, finalA4, finalA3,
      finalCompA4, finalCompA5, finalCompA4, finalCompA3,
      finalDiscount, finalAllowsPhoto, finalAllowsMsg
    ]
  )

  if (categoryIds && categoryIds.length > 0) {
    for (const catId of categoryIds) {
      await query(
        `INSERT INTO design_categories (design_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [design!.id, catId]
      )
    }
  }

  // Create default 360 preview image placeholders if needed
  await query(
    `INSERT INTO design_images (design_id, storage_path, angle_order) VALUES ($1, 'default-front.webp', 1), ($1, 'default-back.webp', 2)`,
    [design!.id]
  )

  return design!
}

export async function deleteDesign(id: string): Promise<void> {
  await query(`DELETE FROM design_images WHERE id = $1`, [id])
  await query(`DELETE FROM design_pages WHERE design_id = $1`, [id])
  await query(`DELETE FROM design_categories WHERE design_id = $1`, [id])
  await query(`DELETE FROM designs WHERE id = $1`, [id])
}

export async function addDesignImage(designId: string, storagePath: string, angleOrder: number): Promise<DesignImage> {
  const row = await queryOne<DesignImage>(
    `INSERT INTO design_images (design_id, storage_path, angle_order)
     VALUES ($1, $2, $3)
     RETURNING id, design_id, storage_path, angle_order`,
    [designId, storagePath, angleOrder]
  )
  return row!
}

export async function deleteDesignImage(imageId: string): Promise<void> {
  await query(`DELETE FROM design_images WHERE id = $1`, [imageId])
}

export async function updateDesign(
  id: string,
  name: string,
  description: string,
  isActive: boolean,
  allowsCustomMessage: boolean,
  allowsCustomPhoto: boolean,
  cardType: 'standard' | 'customizable' = 'customizable',
  defaultMessage: string | null = null,
  priceKes: number = 850,
  compareAtPriceKes: number | null = null,
  discountPercent: number | null = null,
  priceA5Kes?: number,
  priceA4Kes?: number,
  priceA3Kes?: number,
  compareAtA5Kes?: number | null,
  compareAtA4Kes?: number | null,
  compareAtA3Kes?: number | null
): Promise<Design> {
  const isCustom = cardType === 'customizable'
  const finalAllowsMsg = isCustom ? allowsCustomMessage : false
  const finalAllowsPhoto = isCustom ? allowsCustomPhoto : false
  
  const finalA4 = cleanNumber(priceA4Kes !== undefined ? priceA4Kes : priceKes, 850)
  const finalA5 = cleanNumber(priceA5Kes !== undefined ? priceA5Kes : Math.round(finalA4 * 0.65), 500)
  const finalA3 = cleanNumber(priceA3Kes !== undefined ? priceA3Kes : Math.round(finalA4 * 1.65), 1400)

  const finalCompA4 = cleanOptionalNumber(compareAtA4Kes !== undefined ? compareAtA4Kes : compareAtPriceKes)
  const finalCompA5 = cleanOptionalNumber(compareAtA5Kes !== undefined ? compareAtA5Kes : (finalCompA4 ? Math.round(finalCompA4 * 0.65) : null))
  const finalCompA3 = cleanOptionalNumber(compareAtA3Kes !== undefined ? compareAtA3Kes : (finalCompA4 ? Math.round(finalCompA4 * 1.65) : null))

  const finalDiscount = cleanOptionalInt(
    discountPercent !== null && discountPercent !== undefined
      ? discountPercent
      : (finalCompA4 && finalCompA4 > finalA4
        ? Math.round(((finalCompA4 - finalA4) / finalCompA4) * 100)
        : null)
  )

  const row = await queryOne<Design>(
    `UPDATE designs 
     SET name = $1, description = $2, is_active = $3, allows_custom_message = $4, allows_custom_photo = $5, 
         card_type = $6, default_message = $7, 
         price_kes = $8, price_a5_kes = $9, price_a4_kes = $10, price_a3_kes = $11,
         compare_at_price_kes = $12, compare_at_a5_kes = $13, compare_at_a4_kes = $14, compare_at_a3_kes = $15,
         discount_percent = $16, updated_at = now() 
     WHERE id = $17 
     RETURNING id, name, description, card_type, default_message, 
               price_kes, price_a5_kes, price_a4_kes, price_a3_kes,
               compare_at_price_kes, compare_at_a5_kes, compare_at_a4_kes, compare_at_a3_kes,
               discount_percent, is_active, allows_custom_message, allows_custom_photo, thumbnail_path, created_at, updated_at`,
    [
      name, description, isActive, finalAllowsMsg, finalAllowsPhoto, 
      cardType, defaultMessage, 
      finalA4, finalA5, finalA4, finalA3,
      finalCompA4, finalCompA5, finalCompA4, finalCompA3,
      finalDiscount, id
    ]
  )
  return row!
}
