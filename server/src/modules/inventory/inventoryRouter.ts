import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { listInventoryItems, updateStockQuantity } from '../../db/queries/inventoryQueries'

export const inventoryRouter = Router()

inventoryRouter.get('/', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const items = await listInventoryItems()
    const lowStockAlerts = items.filter(i => (i.stock_quantity - i.reserved_quantity) <= i.reorder_threshold)
    res.json({
      data: items,
      summary: {
        total_items: items.length,
        low_stock_count: lowStockAlerts.length,
        low_stock_alerts: lowStockAlerts
      }
    })
  } catch (err) {
    next(err)
  }
})

inventoryRouter.patch('/:id/stock', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params
    const { new_quantity, reason, notes } = req.body
    if (typeof new_quantity !== 'number' || new_quantity < 0) {
      return res.status(400).json({ error: 'Invalid new_quantity' })
    }

    const updated = await updateStockQuantity(id as string, new_quantity, reason || 'manual_restock', notes)
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})
