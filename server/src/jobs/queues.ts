import { Queue } from 'bullmq'
import { redis } from '../config/redis'

export const notificationQueue = new Queue('notifications', { connection: redis as any })
export const printRoutingQueue = new Queue('print-routing', { connection: redis as any })

export async function enqueueNotificationJob(orderId: string, type: string) {
  try {
    await notificationQueue.add('send-notification', { orderId, type })
  } catch (err: any) {
    console.warn('[Queue] Enqueue notification fallback:', err.message)
  }
}

export async function enqueuePrintRoutingJob(orderId: string) {
  try {
    await printRoutingQueue.add('route-print', { orderId })
  } catch (err: any) {
    console.warn('[Queue] Enqueue print-routing fallback:', err.message)
  }
}
