import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import {
  getActiveDesigns,
  getDesignById,
  getDesignImages,
  getCategories,
  getMessageTemplates,
  createCategory,
  deleteCategory,
  createDesign,
  deleteDesign,
  addDesignImage,
  deleteDesignImage,
  upsertDesignPage,
  getDesignPages,
  getDesignPageById,
  upsertCustomizationZone,
  getCustomizationZonesForPage,
  getCustomizationZonesForDesign,
  updateDesignFlags,
  updateDesignThumbnail,
  updateDesign,
  getDesignCategories,
  getAllDesignCategories,
  setDesignCategories,
} from '../../db/queries/catalogQueries'
import { requireAuth } from '../../middleware/auth'
import { STORAGE_ROOT, formatImageUrl } from '../../utils/storage'
import { getOrSetCache, invalidateCache, invalidateCachePattern } from '../../utils/cache'

const router = Router()

async function invalidateCatalogCache(designId?: string) {
  await Promise.all([
    invalidateCachePattern('catalog:designs:*'),
    invalidateCache('catalog:categories:all'),
    designId ? invalidateCache(`catalog:design:${designId}`) : Promise.resolve(),
  ])
}

router.get('/designs', async (req, res, next) => {
  try {
    const { occasion, style, religion } = req.query as { occasion?: string; style?: string; religion?: string }
    const cacheKey = `catalog:designs:${occasion || 'all'}:${style || 'all'}:${religion || 'all'}`

    const enriched = await getOrSetCache(cacheKey, 3600, async () => {
      const designs = await getActiveDesigns({ occasion, style, religion })
      const allDesignCategories = await getAllDesignCategories()

      return Promise.all(
        designs.map(async (d) => {
          const images = await getDesignImages(d.id)
          const pages = await getDesignPages(d.id)
          const zones = await getCustomizationZonesForDesign(d.id)
          const frontPage = pages.find((p) => p.page_type === 'front')
          const firstImg = images.length > 0 ? images[0] : null
          const thumbnailUrl = d.thumbnail_path
            ? formatImageUrl(d.thumbnail_path)
            : frontPage
            ? formatImageUrl(frontPage.storage_path)
            : firstImg
            ? formatImageUrl(firstImg.storage_path)
            : null

          const designCategories = allDesignCategories
            .filter((dc) => dc.design_id === d.id)
            .map((dc) => ({ id: dc.category_id, type: dc.type, name: dc.name }))

          return {
            ...d,
            thumbnail_url: thumbnailUrl,
            categories: designCategories,
            images: images.map((img) => ({
              id: img.id,
              angleOrder: img.angle_order,
              url: formatImageUrl(img.storage_path),
            })),
            pages: pages.map((p) => ({
              ...p,
              url: formatImageUrl(p.storage_path),
            })),
            zones,
          }
        })
      )
    })

    res.json({ data: enriched })
  } catch (err) {
    next(err)
  }
})

router.get('/designs/:id', async (req, res, next) => {
  try {
    const designId = req.params.id as string
    const cacheKey = `catalog:design:${designId}`

    const designData = await getOrSetCache(cacheKey, 3600, async () => {
      const design = await getDesignById(designId)
      if (!design) return null

      const images = await getDesignImages(design.id)
      const pages = await getDesignPages(design.id)
      const zones = await getCustomizationZonesForDesign(design.id)
      const categories = await getDesignCategories(design.id)
      const frontPage = pages.find((p) => p.page_type === 'front')
      const firstImg = images.length > 0 ? images[0] : null
      const thumbnailUrl = design.thumbnail_path
        ? formatImageUrl(design.thumbnail_path)
        : frontPage
        ? formatImageUrl(frontPage.storage_path)
        : firstImg
        ? formatImageUrl(firstImg.storage_path)
        : null

      return {
        ...design,
        thumbnail_url: thumbnailUrl,
        categories,
        images: images.map((img) => ({
          id: img.id,
          angleOrder: img.angle_order,
          url: formatImageUrl(img.storage_path),
        })),
        pages: pages.map((p) => ({
          ...p,
          url: formatImageUrl(p.storage_path),
        })),
        zones,
      }
    })

    if (!designData) return res.status(404).json({ error: 'Design not found' })
    res.json({ data: designData })
  } catch (err) {
    next(err)
  }
})

// Design Thumbnail Upload Handler
router.post('/designs/:id/thumbnail', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { storagePath } = req.body
    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' })
    }

    await updateDesignThumbnail(req.params.id as string, storagePath)
    await invalidateCatalogCache(req.params.id as string)

    res.status(200).json({
      success: true,
      thumbnail_url: formatImageUrl(storagePath),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/designs', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { 
      name, description, cardType, defaultMessage, allowsCustomPhoto, allowsCustomMessage, categoryIds, 
      priceKes, compareAtPriceKes, discountPercent,
      priceA5Kes, priceA4Kes, priceA3Kes,
      compareAtA5Kes, compareAtA4Kes, compareAtA3Kes
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Design name is required' })
    }

    const design = await createDesign(
      name.trim(),
      description || '',
      Boolean(allowsCustomPhoto),
      categoryIds || [],
      cardType === 'standard' ? 'standard' : 'customizable',
      defaultMessage || null,
      allowsCustomMessage !== undefined ? Boolean(allowsCustomMessage) : true,
      priceKes !== undefined && priceKes !== null ? Number(priceKes) : (priceA4Kes !== undefined ? Number(priceA4Kes) : 850),
      compareAtPriceKes !== undefined && compareAtPriceKes !== null ? Number(compareAtPriceKes) : (compareAtA4Kes !== undefined ? Number(compareAtA4Kes) : null),
      discountPercent !== undefined && discountPercent !== null ? parseInt(discountPercent, 10) : null,
      priceA5Kes !== undefined && priceA5Kes !== null ? Number(priceA5Kes) : undefined,
      priceA4Kes !== undefined && priceA4Kes !== null ? Number(priceA4Kes) : undefined,
      priceA3Kes !== undefined && priceA3Kes !== null ? Number(priceA3Kes) : undefined,
      compareAtA5Kes !== undefined && compareAtA5Kes !== null ? Number(compareAtA5Kes) : undefined,
      compareAtA4Kes !== undefined && compareAtA4Kes !== null ? Number(compareAtA4Kes) : undefined,
      compareAtA3Kes !== undefined && compareAtA3Kes !== null ? Number(compareAtA3Kes) : undefined
    )

    await invalidateCatalogCache(design.id)
    res.status(201).json({ data: design })
  } catch (err) {
    next(err)
  }
})

router.patch('/designs/:id/customization-flags', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { allowsCustomMessage, allowsCustomPhoto } = req.body
    await updateDesignFlags(
      req.params.id as string,
      Boolean(allowsCustomMessage),
      Boolean(allowsCustomPhoto)
    )
    await invalidateCatalogCache(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

const handleUpdateDesignRoute = async (req: any, res: any, next: any) => {
  try {
    const { 
      name, description, is_active, isActive, cardType, defaultMessage, allows_custom_message, allows_custom_photo, 
      allowsCustomMessage, allowsCustomPhoto, categoryIds,
      priceKes, compareAtPriceKes, discountPercent,
      priceA5Kes, priceA4Kes, priceA3Kes,
      compareAtA5Kes, compareAtA4Kes, compareAtA3Kes
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Design name is required' })
    }

    const effectiveActive = is_active !== undefined ? Boolean(is_active) : (isActive !== undefined ? Boolean(isActive) : true)
    const effectiveAllowsMsg = allows_custom_message !== undefined ? Boolean(allows_custom_message) : (allowsCustomMessage !== undefined ? Boolean(allowsCustomMessage) : true)
    const effectiveAllowsPhoto = allows_custom_photo !== undefined ? Boolean(allows_custom_photo) : (allowsCustomPhoto !== undefined ? Boolean(allowsCustomPhoto) : true)

    const updated = await updateDesign(
      req.params.id as string,
      name.trim(),
      description || '',
      effectiveActive,
      effectiveAllowsMsg,
      effectiveAllowsPhoto,
      cardType === 'standard' ? 'standard' : 'customizable',
      defaultMessage || null,
      priceKes !== undefined && priceKes !== null ? Number(priceKes) : (priceA4Kes !== undefined ? Number(priceA4Kes) : 850),
      compareAtPriceKes !== undefined && compareAtPriceKes !== null ? Number(compareAtPriceKes) : (compareAtA4Kes !== undefined ? Number(compareAtA4Kes) : null),
      discountPercent !== undefined && discountPercent !== null ? parseInt(discountPercent, 10) : null,
      priceA5Kes !== undefined && priceA5Kes !== null ? Number(priceA5Kes) : undefined,
      priceA4Kes !== undefined && priceA4Kes !== null ? Number(priceA4Kes) : undefined,
      priceA3Kes !== undefined && priceA3Kes !== null ? Number(priceA3Kes) : undefined,
      compareAtA5Kes !== undefined && compareAtA5Kes !== null ? Number(compareAtA5Kes) : undefined,
      compareAtA4Kes !== undefined && compareAtA4Kes !== null ? Number(compareAtA4Kes) : undefined,
      compareAtA3Kes !== undefined && compareAtA3Kes !== null ? Number(compareAtA3Kes) : undefined
    )

    if (Array.isArray(categoryIds)) {
      await setDesignCategories(req.params.id as string, categoryIds)
    }

    const updatedCategories = await getDesignCategories(req.params.id as string)

    await invalidateCatalogCache(req.params.id as string)
    res.json({ data: { ...updated, categories: updatedCategories } })
  } catch (err) {
    next(err)
  }
}

router.patch('/designs/:id', requireAuth(['admin', 'super_admin']), handleUpdateDesignRoute)
router.put('/designs/:id', requireAuth(['admin', 'super_admin']), handleUpdateDesignRoute)

// Design 4-Page Upload Handler
router.post('/designs/:id/pages', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { pageType, storagePath } = req.body
    if (!pageType || !['front', 'inside_left', 'inside_right', 'back'].includes(pageType)) {
      return res.status(400).json({ error: 'Valid pageType (front, inside_left, inside_right, back) is required' })
    }
    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' })
    }

    // Auto-detect image dimensions using sharp
    let widthPx = req.body.widthPx || 1200
    let heightPx = req.body.heightPx || 900

    const fullPath = path.join(STORAGE_ROOT, 'design-images', path.basename(storagePath))
    if (fs.existsSync(fullPath)) {
      try {
        const meta = await sharp(fullPath).metadata()
        if (meta.width && meta.height) {
          widthPx = meta.width
          heightPx = meta.height
        }
      } catch (err) {
        console.warn('Could not read image dimensions via sharp, using defaults', err)
      }
    }

    const page = await upsertDesignPage(
      req.params.id as string,
      pageType,
      storagePath,
      widthPx,
      heightPx
    )

    if (pageType === 'front') {
      const design = await getDesignById(req.params.id as string)
      if (design && !design.thumbnail_path) {
        await updateDesignThumbnail(req.params.id as string, storagePath)
      }
    }

    await invalidateCatalogCache(req.params.id as string)

    res.status(201).json({
      data: {
        ...page,
        url: formatImageUrl(page.storage_path),
      },
    })
  } catch (err) {
    next(err)
  }
})

// Customization Zone Placement Handler with Boundary Validation
router.post('/design-pages/:pageId/zones', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { zoneType, xPx, yPx, widthPx, heightPx, fontFamily, maxFontSizePx, textAlign } = req.body
    if (!zoneType || !['message', 'photo'].includes(zoneType)) {
      return res.status(400).json({ error: 'Valid zoneType (message, photo) is required' })
    }

    const page = await getDesignPageById(req.params.pageId as string)
    if (!page) {
      return res.status(404).json({ error: 'Design page not found' })
    }

    const x = Math.max(0, parseInt(xPx || 0, 10))
    const y = Math.max(0, parseInt(yPx || 0, 10))
    const w = Math.max(10, parseInt(widthPx || 100, 10))
    const h = Math.max(10, parseInt(heightPx || 100, 10))

    // Server-side boundary check
    if (x + w > page.width_px + 50 || y + h > page.height_px + 50) {
      return res.status(400).json({
        error: `Zone coordinates (${x}, ${y}, ${w}, ${h}) exceed page boundaries (${page.width_px} x ${page.height_px})`,
      })
    }

    const zone = await upsertCustomizationZone(
      page.id,
      zoneType,
      x,
      y,
      w,
      h,
      fontFamily || 'serif',
      maxFontSizePx || 24,
      textAlign || 'left'
    )

    await invalidateCatalogCache(page.design_id)

    res.status(201).json({ data: zone })
  } catch (err) {
    next(err)
  }
})

router.post('/designs/:id/images', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { storagePath, angleOrder } = req.body
    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' })
    }

    const image = await addDesignImage(req.params.id as string, storagePath, angleOrder || 1)
    await invalidateCatalogCache(req.params.id as string)
    res.status(201).json({ data: image })
  } catch (err) {
    next(err)
  }
})

router.delete('/designs/:id/images/:imageId', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteDesignImage(req.params.imageId as string)
    await invalidateCatalogCache(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/designs/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteDesign(req.params.id as string)
    await invalidateCatalogCache(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await getOrSetCache('catalog:categories:all', 86400, async () => {
      return getCategories()
    })
    res.json({ data: categories })
  } catch (err) {
    next(err)
  }
})

router.post('/categories', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { type, name } = req.body
    if (!type || !['occasion', 'style', 'religion'].includes(type) || !name || !name.trim()) {
      return res.status(400).json({ error: 'Valid category type (occasion/style/religion) and name are required' })
    }
    const category = await createCategory(type, name.trim())
    await invalidateCatalogCache()
    res.status(201).json({ data: category })
  } catch (err) {
    next(err)
  }
})

router.delete('/categories/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteCategory(req.params.id as string)
    await invalidateCatalogCache()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.get('/message-templates', async (req, res, next) => {
  try {
    const occasion = req.query.occasion as string | undefined
    const cacheKey = `catalog:templates:${occasion || 'all'}`
    const templates = await getOrSetCache(cacheKey, 86400, async () => {
      return getMessageTemplates(occasion)
    })
    res.json({ data: templates })
  } catch (err) {
    next(err)
  }
})

export default router

