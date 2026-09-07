import { query, queryOne } from '../../config/db'

export interface PriceRule {
  id: string
  size: 'A3' | 'A4' | 'A5'
  is_custom_photo: boolean
  zone: 'cbd' | 'outskirts'
  amount_kes: number
}

export async function getPriceMatrix(): Promise<PriceRule[]> {
  return query<PriceRule>(
    `SELECT id, size, is_custom_photo, zone, amount_kes FROM prices ORDER BY size ASC, zone ASC`
  )
}

export async function getCalculatedPrice(size: string, isCustomPhoto: boolean, zone: string): Promise<number> {
  const row = await queryOne<{ amount_kes: string }>(
    `SELECT amount_kes FROM prices
     WHERE size = $1 AND is_custom_photo = $2 AND zone = $3`,
    [size, isCustomPhoto, zone]
  )
  return row ? parseFloat(row.amount_kes) : 1000.00 // Default fallback
}

export async function updatePriceRule(id: string, amountKes: number): Promise<PriceRule> {
  const row = await queryOne<PriceRule>(
    `UPDATE prices SET amount_kes = $1 WHERE id = $2 RETURNING id, size, is_custom_photo, zone, amount_kes`,
    [amountKes, id]
  )
  return row!
}
