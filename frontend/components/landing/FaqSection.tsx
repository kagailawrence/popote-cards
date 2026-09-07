'use client'

import { useState } from 'react'
import { ChevronDown, Search, HelpCircle, Sparkles, ShieldCheck, Truck, CreditCard, Palette } from 'lucide-react'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: 'delivery' | 'customization' | 'payments' | 'tracking'
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'delivery',
    question: 'How does school doorstep delivery work for boarding schools in Kenya?',
    answer: 'Our dedicated Popote delivery riders hand-deliver your success card directly to the school gate or administration desk. Every rider presents an official Popote Delivery Note to the school security matron or deputy principal. Upon handover, the rider takes a digital photo scan of the signed delivery note which is instantly uploaded to your order tracking timeline.',
  },
  {
    id: 'faq-2',
    category: 'delivery',
    question: 'Can I send a card to any school across Kenya?',
    answer: 'Yes! We deliver to both public and private primary, secondary, and tertiary institutions across all 47 counties in Kenya. We have established regional printing and logistics hubs in Nairobi, Nakuru, Eldoret, Kisumu, and Mombasa for ultra-fast dispatch.',
  },
  {
    id: 'faq-3',
    category: 'customization',
    question: 'What physical card sizes and cardstock materials are available?',
    answer: 'We offer three physical sizes: A5 (14.8 x 21 cm), A4 (21 x 29.7 cm), and A3 Jumbo (29.7 x 42 cm). All cards are printed on heavy 350GSM premium textured cardstock featuring 4 pages (Front Cover, Inside Left Photo Insert, Inside Right Handwritten Message, and Back Cover Quality Seal) with optional gold foil foil finishing.',
  },
  {
    id: 'faq-4',
    category: 'customization',
    question: 'Can I upload a custom photo of the candidate?',
    answer: 'Yes! Inside Page 2 of every card is designed specifically for candidate photo inserts. You can upload any high-resolution photo from your phone or laptop. Our print studio calibrates color balance and prints the image directly onto glossy photo archival stock fused into the card.',
  },
  {
    id: 'faq-5',
    category: 'payments',
    question: 'How do I pay with M-Pesa?',
    answer: 'Payment is 100% automated via M-Pesa STK Push. When completing your order at checkout, simply enter your M-Pesa phone number. An instant popup prompt will appear on your mobile phone screen requesting your M-Pesa PIN. Once confirmed, your order is automatically verified and dispatched to the nearest hub within seconds.',
  },
  {
    id: 'faq-6',
    category: 'tracking',
    question: 'How can I track my card delivery status?',
    answer: 'As soon as your payment is processed, you will receive an SMS and email with a unique tracking code (e.g. POP-84729). You can paste this code into our "Track Existing Order" page anytime to view real-time status updates from printing, dispatch, rider transit, to final school gate handover.',
  },
  {
    id: 'faq-7',
    category: 'delivery',
    question: 'What happens if the school does not allow visitors during exams?',
    answer: 'Schools routinely accept official candidate examination success cards at the main gate administration office during KCSE & KPSEA season. Our riders coordinate with school gatekeepers to deposit cards safely in candidate cubbies or class envelopes designated by school principals.',
  },
  {
    id: 'faq-8',
    category: 'payments',
    question: 'Can I order multiple cards for different candidates in one go?',
    answer: 'Absolutely! You can add multiple success cards with different candidate names, schools, and personalized messages to your shopping cart and complete payment for all of them in a single M-Pesa transaction.',
  },
]

export function FaqSection() {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1')
  const [activeTab, setActiveTab] = useState<'all' | 'delivery' | 'customization' | 'payments' | 'tracking'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id)
  }

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Schema.org FAQPage JSON-LD object for Google Rich Results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Everything you need to know about our physical card quality, direct school delivery procedures, and M-Pesa payments.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs (e.g., M-Pesa, Alliance High, delivery proof)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All FAQs', icon: HelpCircle },
            { id: 'delivery', label: 'School Delivery', icon: Truck },
            { id: 'customization', label: 'Card Quality & Sizes', icon: Palette },
            { id: 'payments', label: 'M-Pesa & Payment', icon: CreditCard },
            { id: 'tracking', label: 'Order Tracking & Proof', icon: ShieldCheck },
          ].map((tab) => {
            const TabIcon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-pink-400'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Accordion FAQ Items List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? 'border-pink-500 bg-white dark:bg-zinc-900 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? 'bg-pink-600 text-white rotate-180' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 text-slate-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 animate-slide-up">
                      <p className="pt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-sm">
              No questions matched your search query. Try searching for "delivery", "M-Pesa", or "A4".
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
