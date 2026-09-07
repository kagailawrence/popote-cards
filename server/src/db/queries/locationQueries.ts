import { query, queryOne } from '../../config/db'

export interface County {
  id: string
  name: string
}

export interface SubCounty {
  id: string
  county_id: string
  name: string
  zone: 'cbd' | 'outskirts'
}

export interface PrintRegion {
  id: string
  name: string
}

export async function getCounties(): Promise<County[]> {
  return query<County>(`SELECT id, name FROM counties ORDER BY name ASC`)
}

export async function getSubCountiesByCountyId(countyId: string): Promise<SubCounty[]> {
  return query<SubCounty>(
    `SELECT id, county_id, name, zone FROM sub_counties WHERE county_id = $1 ORDER BY name ASC`,
    [countyId]
  )
}

export async function getSubCountyById(id: string): Promise<SubCounty | null> {
  return queryOne<SubCounty>(
    `SELECT id, county_id, name, zone FROM sub_counties WHERE id = $1`,
    [id]
  )
}

export async function getPrintRegionForCounty(countyId: string): Promise<PrintRegion | null> {
  return queryOne<PrintRegion>(
    `SELECT pr.id, pr.name
     FROM print_regions pr
     JOIN county_print_regions cpr ON cpr.print_region_id = pr.id
     WHERE cpr.county_id = $1 LIMIT 1`,
    [countyId]
  )
}

export async function createCounty(name: string): Promise<County> {
  const row = await queryOne<County>(
    `INSERT INTO counties (name) VALUES ($1) RETURNING id, name`,
    [name]
  )
  return row!
}

export async function createSubCounty(countyId: string, name: string, zone: 'cbd' | 'outskirts'): Promise<SubCounty> {
  const row = await queryOne<SubCounty>(
    `INSERT INTO sub_counties (county_id, name, zone) VALUES ($1, $2, $3) RETURNING id, county_id, name, zone`,
    [countyId, name, zone]
  )
  return row!
}

export async function deleteCounty(id: string): Promise<void> {
  await query(`DELETE FROM counties WHERE id = $1`, [id])
}

export async function deleteSubCounty(id: string): Promise<void> {
  await query(`DELETE FROM sub_counties WHERE id = $1`, [id])
}

export async function getAllSubCounties(): Promise<(SubCounty & { county_name: string })[]> {
  return query(
    `SELECT sc.id, sc.county_id, sc.name, sc.zone, c.name as county_name
     FROM sub_counties sc
     JOIN counties c ON c.id = sc.county_id
     ORDER BY c.name ASC, sc.name ASC`
  )
}

export async function updateCounty(id: string, name: string): Promise<County> {
  const row = await queryOne<County>(
    `UPDATE counties SET name = $1 WHERE id = $2 RETURNING id, name`,
    [name, id]
  )
  return row!
}

export async function updateSubCounty(id: string, name: string, zone: 'cbd' | 'outskirts'): Promise<SubCounty> {
  const row = await queryOne<SubCounty>(
    `UPDATE sub_counties SET name = $1, zone = $2 WHERE id = $3 RETURNING id, county_id, name, zone`,
    [name, zone, id]
  )
  return row!
}

// ─── REGIONAL PRINT HUBS QUERIES ─────────────────────────────────────────────

export interface PrintHub {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  whatsapp_number: string | null
  email: string | null
  address: string | null
  status: 'active' | 'standby' | 'maintenance'
  cost_per_card_kes: number
  created_at: string
  updated_at: string
  mapped_counties_count: number
  mapped_counties_names: string | null
  total_cards: number
  pending_cards: number
  printing_cards: number
  dispatched_cards: number
  delivered_cards: number
  total_cogs_kes: number
}

export async function listPrintHubsWithMetrics(): Promise<PrintHub[]> {
  return query<PrintHub>(
    `SELECT 
       pr.id,
       pr.name,
       pr.contact_person,
       pr.phone,
       pr.whatsapp_number,
       pr.email,
       pr.address,
       COALESCE(pr.status, 'active') as status,
       COALESCE(pr.cost_per_card_kes, 150.00)::numeric as cost_per_card_kes,
       pr.created_at,
       pr.updated_at,
       COUNT(DISTINCT cpr.county_id)::int as mapped_counties_count,
       string_agg(DISTINCT c.name, ', ') as mapped_counties_names,
       COUNT(DISTINCT oi.id)::int as total_cards,
       COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'routed_to_print') THEN oi.id END)::int as pending_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'printing' THEN oi.id END)::int as printing_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'dispatched' THEN oi.id END)::int as dispatched_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN oi.id END)::int as delivered_cards,
       COALESCE(SUM(CASE WHEN o.status IN ('paid', 'routed_to_print', 'printing', 'dispatched', 'delivered') THEN COALESCE(oi.cogs_kes, pr.cost_per_card_kes, 150.00) ELSE 0 END), 0)::numeric as total_cogs_kes
     FROM print_regions pr
     LEFT JOIN county_print_regions cpr ON cpr.print_region_id = pr.id
     LEFT JOIN counties c ON c.id = cpr.county_id
     LEFT JOIN order_items oi ON oi.print_region_id = pr.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
     GROUP BY pr.id, pr.name, pr.contact_person, pr.phone, pr.whatsapp_number, pr.email, pr.address, pr.status, pr.cost_per_card_kes, pr.created_at, pr.updated_at
     ORDER BY pr.name ASC`
  )
}

export async function getPrintHubById(id: string): Promise<PrintHub | null> {
  const list = await query<PrintHub>(
    `SELECT 
       pr.id,
       pr.name,
       pr.contact_person,
       pr.phone,
       pr.whatsapp_number,
       pr.email,
       pr.address,
       COALESCE(pr.status, 'active') as status,
       COALESCE(pr.cost_per_card_kes, 150.00)::numeric as cost_per_card_kes,
       pr.created_at,
       pr.updated_at,
       COUNT(DISTINCT cpr.county_id)::int as mapped_counties_count,
       string_agg(DISTINCT c.name, ', ') as mapped_counties_names,
       COUNT(DISTINCT oi.id)::int as total_cards,
       COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'routed_to_print') THEN oi.id END)::int as pending_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'printing' THEN oi.id END)::int as printing_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'dispatched' THEN oi.id END)::int as dispatched_cards,
       COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN oi.id END)::int as delivered_cards,
       COALESCE(SUM(CASE WHEN o.status IN ('paid', 'routed_to_print', 'printing', 'dispatched', 'delivered') THEN COALESCE(oi.cogs_kes, pr.cost_per_card_kes, 150.00) ELSE 0 END), 0)::numeric as total_cogs_kes
     FROM print_regions pr
     LEFT JOIN county_print_regions cpr ON cpr.print_region_id = pr.id
     LEFT JOIN counties c ON c.id = cpr.county_id
     LEFT JOIN order_items oi ON oi.print_region_id = pr.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
     WHERE pr.id = $1
     GROUP BY pr.id, pr.name, pr.contact_person, pr.phone, pr.whatsapp_number, pr.email, pr.address, pr.status, pr.cost_per_card_kes, pr.created_at, pr.updated_at`,
    [id]
  )
  return list[0] || null
}

export async function createPrintHub(data: {
  name: string
  contact_person?: string
  phone?: string
  whatsapp_number?: string
  email?: string
  address?: string
  status?: 'active' | 'standby' | 'maintenance'
  cost_per_card_kes?: number
}): Promise<PrintHub> {
  const row = await queryOne<PrintHub>(
    `INSERT INTO print_regions (name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes, created_at, updated_at`,
    [
      data.name.trim(),
      data.contact_person || null,
      data.phone || null,
      data.whatsapp_number || null,
      data.email || null,
      data.address || null,
      data.status || 'active',
      data.cost_per_card_kes ?? 150.00,
    ]
  )
  return row!
}

export async function updatePrintHub(
  id: string,
  data: {
    name?: string
    contact_person?: string
    phone?: string
    whatsapp_number?: string
    email?: string
    address?: string
    status?: 'active' | 'standby' | 'maintenance'
    cost_per_card_kes?: number
  }
): Promise<PrintHub | null> {
  const row = await queryOne<PrintHub>(
    `UPDATE print_regions SET
       name = COALESCE($1, name),
       contact_person = COALESCE($2, contact_person),
       phone = COALESCE($3, phone),
       whatsapp_number = COALESCE($4, whatsapp_number),
       email = COALESCE($5, email),
       address = COALESCE($6, address),
       status = COALESCE($7, status),
       cost_per_card_kes = COALESCE($8, cost_per_card_kes),
       updated_at = now()
     WHERE id = $9
     RETURNING id, name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes, created_at, updated_at`,
    [
      data.name?.trim(),
      data.contact_person,
      data.phone,
      data.whatsapp_number,
      data.email,
      data.address,
      data.status,
      data.cost_per_card_kes,
      id,
    ]
  )
  return row
}

export async function deletePrintHub(id: string): Promise<void> {
  // Re-route any active order items to the default fallback hub first
  const fallback = await queryOne<{ id: string }>(`SELECT id FROM print_regions WHERE id != $1 ORDER BY name ASC LIMIT 1`, [id])
  if (fallback) {
    await query(`UPDATE order_items SET print_region_id = $1 WHERE print_region_id = $2`, [fallback.id, id])
  }
  await query(`DELETE FROM county_print_regions WHERE print_region_id = $1`, [id])
  await query(`DELETE FROM print_regions WHERE id = $1`, [id])
}

export async function getHubAssignedCounties(hubId: string): Promise<County[]> {
  return query<County>(
    `SELECT c.id, c.name
     FROM counties c
     JOIN county_print_regions cpr ON cpr.county_id = c.id
     WHERE cpr.print_region_id = $1
     ORDER BY c.name ASC`,
    [hubId]
  )
}

export async function assignCountiesToHub(hubId: string, countyIds: string[]): Promise<void> {
  if (countyIds.length === 0) return
  // Remove existing mappings for these counties to assign them exclusively to this hub
  await query(`DELETE FROM county_print_regions WHERE county_id = ANY($1::uuid[])`, [countyIds])
  for (const cid of countyIds) {
    await query(
      `INSERT INTO county_print_regions (county_id, print_region_id)
       VALUES ($1, $2)
       ON CONFLICT (county_id, print_region_id) DO NOTHING`,
      [cid, hubId]
    )
  }
}

export async function getHubOrders(hubId: string) {
  return query<any>(
    `SELECT 
       oi.id as item_id,
       oi.order_id,
       oi.size,
       oi.recipient_full_names,
       oi.admission_number,
       oi.school_name,
       oi.class_form,
       oi.custom_photo_storage_path,
       oi.message_body,
       oi.message_font,
       oi.message_colour,
       oi.religion,
       oi.unit_price_kes,
       oi.cogs_kes,
       oi.print_status,
       oi.rendered_pdf_storage_path,
       o.order_number,
       o.status as order_status,
       o.created_at as order_created_at,
       o.phone as customer_phone,
       co.name as county_name,
       sc.name as sub_county_name,
       d.name as design_name,
       pr.name as hub_name,
       pr.phone as hub_phone,
       pr.whatsapp_number as hub_whatsapp,
       pr.contact_person as hub_contact
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN designs d ON d.id = oi.design_id
     WHERE oi.print_region_id = $1 AND o.status != 'cancelled'
     ORDER BY o.created_at DESC`,
    [hubId]
  )
}

export async function rerouteOrderItemsToHub(orderId: string, newHubId: string): Promise<void> {
  await query(
    `UPDATE order_items 
     SET print_region_id = $1, print_status = 'routed_to_print'
     WHERE order_id = $2`,
    [newHubId, orderId]
  )
  await query(
    `UPDATE orders 
     SET status = 'routed_to_print', updated_at = now() 
     WHERE id = $1 AND status IN ('paid', 'pending_payment', 'printing')`,
    [orderId]
  )
}

