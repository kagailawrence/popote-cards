/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [75, 95],
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
