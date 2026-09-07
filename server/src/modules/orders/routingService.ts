import { queryOne, query } from '../../config/db'

export async function findPrintRegionForCounty(countyId: string): Promise<string | null> {
  const row = await queryOne<{ print_region_id: string }>(
    `SELECT print_region_id
     FROM county_print_regions
     WHERE county_id = $1
     LIMIT 1`,
    [countyId]
  )

  if (row?.print_region_id) return row.print_region_id

  // Fallback to Nairobi/Central hub if available
  const fallback = await queryOne<{ id: string }>(
    `SELECT id FROM print_regions ORDER BY name ASC LIMIT 1`
  )

  return fallback?.id ?? null
}

export async function autoRouteOrderItems(orderId: string): Promise<number> {
  const items = await query<{ id: string; county_id: string }>(
    `SELECT id, county_id FROM order_items WHERE order_id = $1`,
    [orderId]
  )

  let routedCount = 0
  for (const item of items) {
    const regionId = await findPrintRegionForCounty(item.county_id)
    if (regionId) {
      await query(
        `UPDATE order_items
         SET print_region_id = $1, print_status = 'routed'
         WHERE id = $2`,
        [regionId, item.id]
      )
      routedCount++
    }
  }

  return routedCount
}
