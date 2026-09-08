import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.popote.co.ke'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  try {
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000'
    const res = await fetch(`${backendUrl}/api/v1/catalog/designs`, {
      next: { revalidate: 3600 },
    })
    const data = await res.json()

    if (Array.isArray(data.data)) {
      const designRoutes: MetadataRoute.Sitemap = data.data.map((design: any) => ({
        url: `${baseUrl}/design/${design.id}`,
        lastModified: design.updated_at ? new Date(design.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
      return [...staticRoutes, ...designRoutes]
    }
  } catch (err) {
    console.error('Failed to fetch designs for sitemap:', err)
  }

  return staticRoutes
}
