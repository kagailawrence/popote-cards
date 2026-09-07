import { app } from './app'
import { initRedis } from './config/redis'

const port = Number(process.env.PORT ?? 4000)

async function startServer() {
  await initRedis()
  app.listen(port, () => {
    console.log(`[fair-server] listening on :${port}`)
  })
}

startServer().catch((err) => {
  console.error('[fair-server] Failed to start:', err)
  process.exit(1)
})
