import { Toaster } from 'sonner'
import './globals.css'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ThemeProvider } from '../components/ThemeProvider'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.popotecarddelivery.com'),
  title: {
    default: 'Popote Card Delivery — KCSE Success Cards & School Delivery in Kenya',
    template: '%s | Popote Card Delivery Kenya',
  },
  description:
    'Popote Card Delivery: Custom 4-page KCSE & exam success cards in Kenya with candidate photo inserts, calligraphy ink messages, 350GSM gold foil finishing, and direct delivery to students at school.',
  keywords: [
    'popotecarddelivery',
    'Popote Card Delivery',
    'KCSE success cards Kenya',
    'success cards Nairobi',
    'KCPE success cards',
    'custom photo success cards',
    'exam encouragement cards',
    'school card delivery Kenya',
    'personalized cards M-Pesa',
  ],
  authors: [{ name: 'Popote Card Delivery Kenya' }],
  creator: 'Popote Card Delivery Kenya',
  publisher: 'Popote Card Delivery Kenya',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://www.popotecarddelivery.com',
    siteName: 'Popote Card Delivery Kenya',
    title: 'Popote Card Delivery — KCSE Success Cards & Direct School Delivery in Kenya',
    description:
      'Personalized 4-page exam success cards with gold foil finishing and candidate photo inserts. Hand delivered directly to schools across Kenya by Popote Card Delivery.',
    images: [
      {
        url: 'https://www.popotecarddelivery.com/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Popote Card Delivery Kenya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popote Card Delivery — KCSE Success Cards & Direct School Delivery in Kenya',
    description:
      'Personalized 4-page exam success cards with gold foil finishing and candidate photo inserts. Hand delivered directly to schools across Kenya by Popote Card Delivery.',
    images: ['https://www.popotecarddelivery.com/og-cover.jpg'],
    creator: '@popotecardske',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon1.png', type: 'image/png' },
      { url: '/icon0.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.popotecarddelivery.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Popote Card Delivery Kenya',
    url: 'https://www.popotecarddelivery.com',
    logo: 'https://www.popotecarddelivery.com/logo.png',
    description:
      'Kenya premier platform for custom printed exam success cards, 350GSM gold foil finishing, candidate photo inserts, and direct school delivery by Popote Card Delivery.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    sameAs: [
      'https://facebook.com/popotecarddelivery',
      'https://instagram.com/popotecarddelivery',
      'https://twitter.com/popotecardske',
    ],
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('fair_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark) || (saved === 'system' && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased selection:bg-pink-500 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <Navbar />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
