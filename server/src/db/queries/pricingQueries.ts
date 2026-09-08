import { query, queryOne } from '../../config/db'

export interface PriceRule {
  id: string
  size: 'A3' | 'A4' | 'A5'
  is_custom_photo: boolean
  zone: 'cbd' | 'outskirts'
  amount_kes: number
}

export interface DeliveryPricingRule {
  zone: 'cbd' | 'outskirts'
  amount_kes: number
  label: string
  updated_at?: string
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

export async function getDeliveryPricing(): Promise<{
  cbd: number
  outskirts: number
  rules: DeliveryPricingRule[]
}> {
  try {
    const rows = await query<DeliveryPricingRule>(
      `SELECT zone, amount_kes::numeric, label, updated_at FROM delivery_pricing ORDER BY zone ASC`
    )
    let cbd = 150
    let outskirts = 300
    for (const r of rows) {
      if (r.zone === 'cbd') cbd = Number(r.amount_kes)
      if (r.zone === 'outskirts') outskirts = Number(r.amount_kes)
    }
    return { cbd, outskirts, rules: rows }
  } catch (err) {
    return {
      cbd: 150,
      outskirts: 300,
      rules: [
        { zone: 'cbd', amount_kes: 150, label: 'Town Center & CBD Express Rider Delivery' },
        { zone: 'outskirts', amount_kes: 300, label: 'Outskirts & Rural Regional Delivery' },
      ],
    }
  }
}

export async function updateDeliveryPricing(
  zone: 'cbd' | 'outskirts',
  amountKes: number,
  label?: string
): Promise<DeliveryPricingRule> {
  const defaultLabel =
    zone === 'cbd'
      ? 'Town Center & CBD Express Rider Delivery'
      : 'Outskirts & Rural Regional Delivery'

  const row = await queryOne<DeliveryPricingRule>(
    `INSERT INTO delivery_pricing (zone, amount_kes, label, updated_at)
     VALUES ($1, $2, COALESCE($3, $4), now())
     ON CONFLICT (zone) DO UPDATE SET
       amount_kes = EXCLUDED.amount_kes,
       label = COALESCE($3, delivery_pricing.label),
       updated_at = now()
     RETURNING zone, amount_kes::numeric, label, updated_at`,
    [zone, amountKes, label ?? null, defaultLabel]
  )
  return row!
}
