import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Sparkles, ArrowRight, Truck, ShieldCheck, Heart, Palette, RotateCw, CheckCircle2, Award, Zap, PhoneCall } from 'lucide-react'
import { LandingCardShowcase } from '../components/landing/LandingCardShowcase'
import { TextCarousel } from '../components/landing/TextCarousel'
import type { Metadata } from 'next'

const HowItWorksSection = dynamic(
  () => import('../components/landing/HowItWorksSection').then((mod) => mod.HowItWorksSection),
  { loading: () => <div className="py-16 text-center text-slate-400 dark:text-zinc-600 animate-pulse text-xs">Loading how it works...</div> }
)

const TestimonialsSection = dynamic(
  () => import('../components/landing/TestimonialsSection').then((mod) => mod.TestimonialsSection),
  { loading: () => <div className="py-16 text-center text-slate-400 dark:text-zinc-600 animate-pulse text-xs">Loading testimonials...</div> }
)

const FaqSection = dynamic(
  () => import('../components/landing/FaqSection').then((mod) => mod.FaqSection),
  { loading: () => <div className="py-16 text-center text-slate-400 dark:text-zinc-600 animate-pulse text-xs">Loading FAQs...</div> }
)

const SeoRichContent = dynamic(
  () => import('../components/landing/SeoRichContent').then((mod) => mod.SeoRichContent),
  { loading: () => <div className="py-16 text-center text-slate-400 dark:text-zinc-600 animate-pulse text-xs">Loading information...</div> }
)

export const metadata: Metadata = {
  title: 'Popote Card Delivery — KCSE & KPSEA Success Cards School Delivery Kenya',
  description:
    'Order custom 4-page exam success cards in Kenya with candidate photo inserts, gold foil finishing, handwritten calligraphy, and guaranteed direct school gate delivery across Nairobi, Nakuru, Eldoret, Kisumu & Mombasa.',
  keywords: [
    'Popote Card Delivery',
    'KCSE success cards Kenya',
    'KPSEA exam success cards',
    'school card delivery Nairobi',
    'custom candidate photo cards',
    'gold foil success cards',
    'M-Pesa success card order',
    'Alliance High success card',
    'Kenya High success card',
  ],
}

export default function HomePage() {
  // Structured Data / Schema.org JSON-LD for Search Engines
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Popote Card Delivery Kenya',
    url: 'https://www.popotecarddelivery.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.popotecarddelivery.com/catalog?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'KCSE Exam Success Card Direct School Delivery',
    provider: {
      '@type': 'Organization',
      name: 'Popote Card Delivery Kenya',
      url: 'https://www.popotecarddelivery.com',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Kenya',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'KCSE & KPSEA Success Cards Catalog',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'A4 Deluxe Gold Foil KCSE Success Card',
            description: '4-page custom success card with candidate photo insert and gold foil seal.',
          },
          priceCurrency: 'KES',
          price: '500',
        },
      ],
    },
  }

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-hidden">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero Section (Side-by-Side Split Layout with Full Mobile Responsiveness) */}
      <section className="relative pt-4 sm:pt-10 pb-10 sm:pb-16 overflow-hidden">
        {/* Subtle Ambient Background Light Glows */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-pink-500/10 blur-[100px] sm:blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-amber-500/10 blur-[100px] sm:blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Description, CTAs, and Trust Badges */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left animate-slide-up">
              
              {/* Seasonal Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/30 text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-sm">
                <span>popote Cards - Kenya's #1 Exam Success Card Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.18] sm:leading-[1.15]">
                Send Unforgettable <br />
                <TextCarousel phrases={['KCSE Success Cards', 'KPSEA Exam Cards', 'Gold Foil Success Cards', 'Custom Photo Cards']} /> <br />
                Straight to School
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 dark:text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Thoughtfully crafted physical exam success cards printed  with candidate photo inserts & handwritten personal blessings, delivered directly to schools nationwide.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-1 sm:pt-2">
                <Link
                  href="/catalog"
                  className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-pink-600/30 transition-all duration-300 hover:scale-105 active:scale-95 animate-glow"
                >
                  Browse Card Collection <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  href="/dispute"
                  className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-200 font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Track Existing Order
                </Link>
              </div>

              {/* Micro Trust Pills */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 sm:gap-3 pt-2 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>M-Pesa STK Push</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Photo & Handwritten Notes</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Direct School Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Physical Form 4 Card Showcase (Responsive Frame) */}
            <div className="lg:col-span-6 relative flex items-center justify-center w-full max-w-lg lg:max-w-none mx-auto pt-2 lg:pt-0">
              
              {/* Ambient Card Backlight Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-2xl transform scale-95 -z-10" />

              {/* Floating Top Badge */}
              <div className="absolute -top-3 sm:-top-4 right-2 sm:right-6 z-20 inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-500 text-amber-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg border-2 border-amber-300 animate-bounce">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Form 4 & KCSE Edition</span>
              </div>

              {/* Card Container with Elegant Frame & 3D Shadow */}
              <div className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-white dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 transition-all duration-500 hover:shadow-pink-500/20 hover:scale-[1.01] sm:hover:scale-[1.02] group">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src="/form4-success-card.jpg"
                    alt="Authentic Form 4 Exam Success Card Preview"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    quality={95}
                  />
                </div>

                {/* Card Feature Footer Bar */}
                <div className="p-3 sm:p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 backdrop-blur-md">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Deluxe 4-Page Open Success Card
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      350GSM Satin Cardstock • Gold Foil • Calligraphy
                    </p>
                  </div>
                  <Link
                    href="/catalog"
                    className="shrink-0 px-3 sm:px-3.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/80 font-bold text-xs flex items-center gap-1 hover:bg-pink-600 hover:text-white transition-colors"
                  >
                    Customize <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Floating Bottom Left Pill (visible on sm and up) */}
              <div className="hidden sm:flex absolute -bottom-3 left-4 z-20 items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700 shadow-xl backdrop-blur-md text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Photo Insert Included</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive 3D Card Showcase Sandbox */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingCardShowcase />
      </section>

      {/* Value Proposition Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 transition-transform duration-300 hover:rotate-6">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Full Customization</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Upload candidate photos, add personalized handwriting messages, specify student index numbers, and choose physical sizes from A5 to A3.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 transition-transform duration-300 hover:rotate-6">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Regional Print Hubs</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Orders automatically route to regional thermal print hubs in Nairobi, Nakuru, Eldoret, Kisumu, and Mombasa for express dispatch.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 transition-transform duration-300 hover:rotate-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delivery Note Scan Proof</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Popote delivery riders verify handovers with signed delivery note photo scans accessible live on your order tracking timeline.
            </p>
          </div>
        </div>
      </section>

      {/* How The System Works (Step-by-Step System Flow) */}
      <HowItWorksSection />

      {/* Customer Testimonials & Live Delivery Ticker */}
      <TestimonialsSection />

      {/* Frequently Asked Questions (FAQ Section with Schema.org JSON-LD) */}
      <FaqSection />

      {/* Deep SEO Keyword & Regional Coverage Content */}
      <SeoRichContent />

      {/* High-Impact Bottom Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-pink-900 via-purple-900 to-slate-900 dark:from-pink-950 dark:via-zinc-900 dark:to-purple-950 border border-pink-500/30 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl animate-glow">

          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Ready to Send Joy & Encouragement?
          </h2>

          <p className="text-pink-100 dark:text-zinc-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Select a design from our 2026 catalog, personalize your message with M-Pesa express payment, and let Popote handle the school delivery with proof!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link
              href="/catalog"
              className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black text-base shadow-xl shadow-pink-600/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Open Card Collection <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dispute"
              className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-base border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Track Existing Order
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
