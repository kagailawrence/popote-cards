import path from 'path'
import fs from 'fs'

/**
 * Dynamically resolves the storage root directory across local dev,
 * monorepo setups, and production Docker containers (/app/storage).
 */
export function getStorageRoot(): string {
  if (process.env.STORAGE_PATH && fs.existsSync(process.env.STORAGE_PATH)) {
    return process.env.STORAGE_PATH
  }
  if (process.env.STORAGE_ROOT_PATH && fs.existsSync(process.env.STORAGE_ROOT_PATH)) {
    return process.env.STORAGE_ROOT_PATH
  }

  const candidatePaths = [
    '/app/storage',
    path.resolve(process.cwd(), 'storage'),
    path.resolve(process.cwd(), '../storage'),
    path.resolve(__dirname, '../../../storage'),
    path.resolve(__dirname, '../../../../storage'),
    path.resolve(__dirname, '../../storage'),
  ]

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    } catch {
      // ignore check error
    }
  }

  const defaultPath = fs.existsSync('/app')
    ? '/app/storage'
    : path.resolve(process.cwd(), 'storage')

  try {
    fs.mkdirSync(defaultPath, { recursive: true })
  } catch {
    // ignore
  }

  return defaultPath
}

export const STORAGE_ROOT = getStorageRoot()

/**
 * Format image URL for client rendering.
 * Uses clean relative paths (/api/v1/files/...) to prevent broken localhost:4000
 * references on production domains, Docker environments, and mobile clients.
 */
export function formatImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return ''

  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:') ||
    storagePath.startsWith('blob:')
  ) {
    return storagePath
  }

  if (storagePath.startsWith('/api/v1/files/')) {
    return storagePath
  }

  const filename = path.basename(storagePath)
  return `/api/v1/files/design-images/${filename}`
}

/**
 * Format customer photo URL for client rendering.
 */
export function formatCustomerPhotoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null

  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:') ||
    storagePath.startsWith('blob:') ||
    storagePath.startsWith('/api/v1/files/')
  ) {
    return storagePath
  }

  const filename = path.basename(storagePath)
  return `/api/v1/files/customer-photos/${filename}`
}
