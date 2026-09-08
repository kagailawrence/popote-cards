import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { uploadCustomerPhoto, uploadDeliveryNote, uploadDesignImage, moveToPermanentStorage } from '../../middleware/upload'
import { requireAuth } from '../../middleware/auth'
import { STORAGE_ROOT } from '../../utils/storage'

const router = Router()
const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'super-secret-development-jwt-key-32-chars-min'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-32-chars-min'

// Controlled streaming file endpoint with Access Control
router.get('/:type/:filename', (req, res) => {
  const { type, filename } = req.params
  const safeTypes = ['design-images', 'customer-photos', 'delivery-notes']

  if (!safeTypes.includes(type)) {
    return res.status(403).json({ error: 'Access denied to directory' })
  }

  // Access Control check for sensitive customer photos and rider delivery proof
  if (type === 'customer-photos' || type === 'delivery-notes') {
    const authHeader = req.headers.authorization
    const queryToken = req.query.token as string | undefined
    const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : queryToken

    if (!rawToken) {
      return res.status(401).json({
        error: 'Authentication token required to view customer photos or delivery proofs',
      })
    }

    try {
      try {
        jwt.verify(rawToken, JWT_ACCESS_SECRET, { algorithms: ['HS256'] })
      } catch {
        jwt.verify(rawToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] })
      }
    } catch (tokenErr) {
      return res.status(403).json({ error: 'Invalid or expired access token for requested file' })
    }
  }

  // Prevent path traversal attacks
  const sanitizedFilename = path.basename(filename)
  let filePath = path.join(STORAGE_ROOT, type, sanitizedFilename)

  // Secondary checks across common storage directories
  if (!fs.existsSync(filePath)) {
    const altPath1 = path.join(STORAGE_ROOT, sanitizedFilename)
    const altPath2 = path.join(STORAGE_ROOT, 'design-images', sanitizedFilename)
    if (fs.existsSync(altPath1)) {
      filePath = altPath1
    } else if (fs.existsSync(altPath2)) {
      filePath = altPath2
    } else if (type === 'design-images') {
      const fallbackPath = path.join(STORAGE_ROOT, 'design-images', 'default-front.webp')
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath
      } else {
        return res.status(404).json({ error: 'File not found' })
      }
    } else {
      return res.status(404).json({ error: 'File not found' })
    }
  }

  // Determine correct MIME type for proper browser rendering
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  }
  const contentType = mimeTypes[ext] || 'image/svg+xml'

  // Set explicit security, Content-Type, and caching headers
  res.setHeader('Content-Type', contentType)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

  if (type === 'design-images') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  }

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
})

// Public/Guest photo upload endpoint with EXIF stripping and magic-byte check
router.post('/upload-photo', uploadCustomerPhoto.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const storagePath = await moveToPermanentStorage(req.file.path, 'customer-photos')
    const filename = path.basename(storagePath)

    // Generate signed preview token for immediate customer card customization
    const previewToken = jwt.sign(
      { file: filename, role: 'customer', type: 'file_preview' },
      JWT_ACCESS_SECRET,
      { expiresIn: '2h' }
    )

    res.status(201).json({
      data: {
        storagePath,
        url: `/api/v1/files/customer-photos/${filename}?token=${previewToken}`,
        token: previewToken,
      },
    })
  } catch (err) {
    next(err)
  }
})

// Admin Design Image Upload Route (360° frames & covers)
router.post(
  '/upload-design-image',
  requireAuth(['admin', 'super_admin']),
  uploadDesignImage.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

      const storagePath = await moveToPermanentStorage(req.file.path, 'design-images')
      const filename = path.basename(storagePath)

      res.status(201).json({
        data: {
          storagePath,
          url: `/api/v1/files/design-images/${filename}`,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
