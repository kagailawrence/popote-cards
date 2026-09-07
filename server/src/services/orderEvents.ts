import { EventEmitter } from 'events'

class OrderEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }
}

export const orderEvents = new OrderEventEmitter()

export function emitOrderCreated(order: any) {
  orderEvents.emit('order:created', order)
}

export function emitOrderStatusUpdated(orderId: string, status: string, details?: any) {
  orderEvents.emit('order:updated', { orderId, status, details, updatedAt: new Date().toISOString() })
}
