import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'
import sharp from 'sharp'
import { BadRequestError } from '../utils/errors'
import { STORAGE_ROOT } from '../utils/storage'

const TMP_DIR = path.join(STORAGE_ROOT, 'tmp')

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TMP_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const uuidName = `${randomUUID()}${ext}`
    cb(null, uuidName)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WebP and PDF files are allowed.'))
  }
}

export const uploadCustomerPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
})

export const uploadDeliveryNote = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
})

export const uploadDesignImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
})

/**
 * Dynamic ESM import helper for file-type package in Node/CommonJS environments
 */
async function detectFileType(filePath: string): Promise<{ ext: string; mime: string } | undefined> {
  const dynamicImport = new Function('moduleName', 'return import(moduleName)')
  const fileTypeModule = await dynamicImport('file-type')
  return fileTypeModule.fileTypeFromFile(filePath)
}

/**
 * Validates magic bytes using `file-type`, strips privacy-sensitive EXIF/GPS metadata using `sharp`,
 * and moves the sanitized file to permanent storage.
 */
export async function moveToPermanentStorage(
  tmpPath: string,
  subfolder: 'design-images' | 'customer-photos' | 'delivery-notes'
): Promise<string> {
  const filename = path.basename(tmpPath)
  const targetDir = path.join(STORAGE_ROOT, subfolder)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  const finalPath = path.join(targetDir, filename)

  try {
    // 1. Deep magic byte inspection
    const detected = await detectFileType(tmpPath)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

    if (!detected || !allowedMimes.includes(detected.mime)) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
      throw new BadRequestError(
        `Invalid file content: binary signature (${detected?.mime || 'unknown'}) does not match permitted types.`
      )
    }

    // 2. EXIF & Geolocation Stripping for Images
    if (detected.mime.startsWith('image/')) {
      // sharp automatically removes EXIF/GPS metadata when processing unless withMetadata() is explicitly called
      await sharp(tmpPath)
        .rotate() // Automatically orient image based on EXIF before stripping
        .toFile(finalPath)

      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath)
      }
    } else {
      // Non-image (e.g. PDF delivery notes)
      fs.renameSync(tmpPath, finalPath)
    }

    return `${subfolder}/${filename}`
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath)
    }
    throw err
  }
}
