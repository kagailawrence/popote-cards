'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card360Viewer } from '../../../components/Card360Viewer'
import { PhotoUploader } from '../../../components/PhotoUploader'
import { useCartStore } from '../../../store/useCartStore'
import { ShoppingBag, ArrowLeft, AlertCircle, CheckCircle2, Lock, Wand2, Sparkles, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface County {
  id: string
  name: string
}

interface SubCounty {
  id: string
  county_id: string
  name: string
  zone: 'cbd' | 'outskirts'
}

export default function DesignCustomizerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

  const [design, setDesign] = useState<any>(null)
  const [counties, setCounties] = useState<County[]>([])
  const [subCounties, setSubCounties] = useState<SubCounty[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  // Customization state
  const [size, setSize] = useState<'A3' | 'A4' | 'A5'>('A4')
  const [customPhotoPath, setCustomPhotoPath] = useState<string | undefined>()
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | undefined>()
  const [messageBody, setMessageBody] = useState('')
  const [messageFont, setMessageFont] = useState('serif')
  const [messageColour, setMessageColour] = useState('#ec4899')

  const [religion, setReligion] = useState<'christian' | 'muslim' | 'other' | ''>('')

  // Delivery & Recipient details
  const [recipientFullNames, setRecipientFullNames] = useState('')
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [selectedCountyId, setSelectedCountyId] = useState('')
  const [selectedSubCountyId, setSelectedSubCountyId] = useState('')

  // Dynamic Pricing State
  const [unitPriceKes, setUnitPriceKes] = useState<number>(850)
  const [sizePrices, setSizePrices] = useState<{ A5: number; A4: number; A3: number }>({
    A5: 500,
    A4: 850,
    A3: 1400,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [designRes, countiesRes, templatesRes] = await Promise.all([
          fetch(`/api/v1/catalog/designs/${resolvedParams.id}`),
          fetch('/api/v1/locations/counties'),
          fetch('/api/v1/catalog/message-templates'),
        ])

        const designData = await designRes.json()
        const countiesData = await countiesRes.json()
        const templatesData = await templatesRes.json()

        if (designData.data) {
          setDesign(designData.data)
          const isStd = designData.data.card_type === 'standard' || !designData.data.allows_custom_message
          if (isStd) {
            setMessageBody(
              designData.data.default_message ||
                'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!'
            )
          }
        }
        if (countiesData.data) setCounties(countiesData.data)
        if (templatesData.data) setTemplates(templatesData.data)
      } catch (err: any) {
        setError('Failed to load card details')
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [resolvedParams.id])

  // Sub-counties query when county changes
  useEffect(() => {
    if (!selectedCountyId) {
      setSubCounties([])
      setSelectedSubCountyId('')
      return
    }
    async function loadSubCounties() {
      try {
        const res = await fetch(`/api/v1/locations/counties/${selectedCountyId}/sub-counties`)
        const data = await res.json()
        if (data.data) {
          setSubCounties(data.data)
          if (data.data.length > 0) setSelectedSubCountyId(data.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load sub counties', err)
      }
    }
    loadSubCounties()
  }, [selectedCountyId])

  // Fetch prices for all 3 sizes (A5, A4, A3) whenever photo state or design changes
  useEffect(() => {
    async function calculateSizePrices() {
      try {
        const hasPhoto = Boolean(customPhotoPath)
        const photoFee = hasPhoto ? 100 : 0
        const baseA4 = design?.price_a4_kes || design?.price_kes || 850
        const baseA5 = design?.price_a5_kes || Math.round(Number(baseA4) * 0.65)
        const baseA3 = design?.price_a3_kes || Math.round(Number(baseA4) * 1.65)

        const newPrices = {
          A5: Number(baseA5) + photoFee,
          A4: Number(baseA4) + photoFee,
          A3: Number(baseA3) + photoFee,
        }

        setSizePrices(newPrices)
        setUnitPriceKes(newPrices[size])
      } catch (err) {
        console.error('Pricing calculation failed', err)
      }
    }
    calculateSizePrices()
  }, [design, size, customPhotoPath])

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault()

    const isStandard = design?.card_type === 'standard' || !design?.allows_custom_message
    const effectiveMessage = isStandard
      ? (design?.default_message || 'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!')
      : messageBody.trim()

    if (!recipientFullNames.trim() || recipientFullNames.trim().length < 2) {
      const msg = 'Please enter the full names of the recipient candidate (e.g. Mary Wanjiku Kinuthia).'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!admissionNumber.trim()) {
      const msg = 'Please enter the candidate admission or index number (e.g. ADM-8492 or 12345678).'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!schoolName.trim() || schoolName.trim().length < 2) {
      const msg = 'Please enter the full name of the school or institution.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!selectedCountyId) {
      const msg = 'Please select the delivery destination County.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!selectedSubCountyId) {
      const msg = 'Please select the Sub-County or delivery zone.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!isStandard && !effectiveMessage) {
      const msg = 'Please write a personal congratulatory message or select a message template.'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    const countyObj = counties.find((c) => c.id === selectedCountyId)
    const subCountyObj = subCounties.find((s) => s.id === selectedSubCountyId)

    addItem({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      designId: design.id,
      designName: design.name,
      size,
      customPhotoUrl,
      customPhotoPath,
      messageBody: effectiveMessage,
      messageFont,
      messageColour,
      recipientFullNames: recipientFullNames.trim(),
      admissionNumber: admissionNumber.trim(),
      schoolName: schoolName.trim(),
      studentClass: studentClass.trim() || undefined,
      countyId: selectedCountyId,
      countyName: countyObj?.name || '',
      subCountyId: selectedSubCountyId,
      subCountyName: subCountyObj?.name || '',
      religion: (religion as any) || undefined,
      unitPriceKes,
    })

    toast.success(`"${design.name}" added to your cart!`)
    router.push('/cart')
  }

  if (loading) return <div className="p-16 text-center text-slate-500 dark:text-zinc-500 animate-pulse">Loading Card Customizer...</div>
  if (!design) return <div className="p-16 text-center text-red-500 font-bold">Card design not found.</div>

  const isStandard = design.card_type === 'standard' || !design.allows_custom_message
  const prePrintedMessage = design.default_message || 'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!'

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up">
      {/* Top Back Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: 4-Page Live Card Inspector & Detailed Specifications */}
        <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-24 space-y-6">
          <Card360Viewer
            cardName={design.name}
            images={design.images || []}
            pages={design.pages || []}
            cardSize={size}
            customPhotoUrl={customPhotoUrl}
            customMessage={isStandard ? prePrintedMessage : messageBody}
            messageFont={messageFont}
            messageColour={messageColour}
            recipientName={recipientFullNames}
            admissionNumber={admissionNumber}
            schoolName={schoolName}
            studentClass={studentClass}
          />

          {/* Pricing & Premium Quality Specifications */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-pink-600 dark:text-pink-400">
                  {size} Print Package
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Live Price Quote</h3>
              </div>
              <span className="text-3xl font-black text-pink-600 dark:text-pink-500">
                KSh {unitPriceKes.toLocaleString()}
              </span>
            </div>

            {/* Product Specifications List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Printed on <strong>350GSM Board</strong> Gold Leaf Foil</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Includes <strong>Luxury Gold Envelope</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Direct Hand Delivery to Student at School</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>SMS Tracking & Delivery Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Card Customization & Recipient Details Form */}
        <form onSubmit={handleAddToCart} className="lg:col-span-5 xl:col-span-5 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold uppercase tracking-widest border border-pink-300 dark:border-pink-800">
                EXCELLENCE SERIES
              </span>
              {isStandard ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3" /> Standard Pre-Printed Card
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase flex items-center gap-1 border border-purple-300 dark:border-purple-800">
                  <Wand2 className="w-3 h-3" /> Fully Customizable
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">{design.name}</h1>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-black text-pink-600 dark:text-pink-400">
                KSh {Number(unitPriceKes).toLocaleString()}
              </span>
              {(() => {
                const compA4 = design.compare_at_a4_kes || design.compare_at_price_kes
                const comp = size === 'A5'
                  ? (design.compare_at_a5_kes || (compA4 ? Math.round(Number(compA4) * 0.65) : null))
                  : size === 'A3'
                  ? (design.compare_at_a3_kes || (compA4 ? Math.round(Number(compA4) * 1.65) : null))
                  : compA4
                if (comp && Number(comp) > Number(unitPriceKes)) {
                  return (
                    <span className="text-sm text-slate-400 line-through">
                      KSh {Number(comp).toLocaleString()}
                    </span>
                  )
                }
                return null
              })()}
              {design.discount_percent && Number(design.discount_percent) > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                  {design.discount_percent}% OFF
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">{design.description}</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Card Size Selection */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                1. Select Card Size
              </label>
              <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold">Live pricing updates</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['A5', 'A4', 'A3'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s)
                    setUnitPriceKes(sizePrices[s])
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    size === s
                      ? 'bg-pink-50 dark:bg-pink-600/20 border-pink-500 text-slate-900 dark:text-white shadow-md ring-1 ring-pink-500'
                      : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="block font-extrabold text-lg">{s}</span>
                  <span className="block text-xs font-bold text-pink-600 dark:text-pink-400 my-1">
                    KSh {sizePrices[s].toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-normal text-slate-500 dark:text-zinc-500">
                    {s === 'A5' ? 'Compact Fold' : s === 'A4' ? 'Standard Fold' : 'Jumbo Banner'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Message & Customization handling */}
          {isStandard ? (
            /* STANDARD CARD: Fixed Pre-Printed Message */
            <div className="p-6 rounded-3xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Pre-Printed Master Blessing (Page 3)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Standard edition: No message customization needed. Simply enter candidate details below.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/20 text-xs italic text-slate-800 dark:text-zinc-200 leading-relaxed font-serif shadow-inner">
                "{prePrintedMessage}"
              </div>
            </div>
          ) : (
            <>
              {/* Faith / Theme: Christian vs Non-Christian */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                    2. Candidate Faith / Blessing Style
                  </label>
                  <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold">Customizes message presets</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReligion('christian')
                      setMessageBody('Philippians 4:13: I can do all things through Christ who strengthens me. May the Lord grant you divine wisdom, retentive memory, and exceptional success in your examinations!')
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      religion === 'christian' || religion === ''
                        ? 'bg-pink-50 dark:bg-pink-600/20 border-pink-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-pink-500'
                        : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="block font-black text-sm">✝️ Christian</span>
                    <span className="block text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Bible Scripture & Blessings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReligion('other')
                      setMessageBody('Wishing you great focus, sharp clarity of mind, and tremendous success in your national examinations. May your dedication and hard work be crowned with flying colors!')
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      religion === 'other'
                        ? 'bg-pink-50 dark:bg-pink-600/20 border-pink-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-pink-500'
                        : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="block font-black text-sm">🎓 General / Secular</span>
                    <span className="block text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Academic Excellence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReligion('muslim')
                      setMessageBody('May Allah (SWT) ease your examinations, illuminate your mind with sharp wisdom, and bless you with flying colors. Rabbi Zidni Ilma!')
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      religion === 'muslim'
                        ? 'bg-pink-50 dark:bg-pink-600/20 border-pink-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-pink-500'
                        : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="block font-black text-sm">☪️ Islamic</span>
                    <span className="block text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Dua & Blessings</span>
                  </button>
                </div>
              </div>

              {design.allows_custom_photo && (
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                    3. Candidate Photo Resource (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Upload candidate photo to be supplied to the printing & delivery team.
                  </p>
                  <PhotoUploader
                    onPhotoUploaded={(path, url) => {
                      setCustomPhotoPath(path)
                      setCustomPhotoUrl(url)
                    }}
                    onPhotoCleared={() => {
                      setCustomPhotoPath(undefined)
                      setCustomPhotoUrl(undefined)
                    }}
                  />
                </div>
              )}

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-pink-500" /> 4. Personalized Success Message (Page 3) *
                  </label>
                </div>

                {/* Curated 1-Click Message Quick Picks based on Faith Selection */}
                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-zinc-500 mb-1.5 font-semibold">
                    {religion === 'christian' || religion === '' ? '✝️ Christian Scripture Presets:' : religion === 'muslim' ? '☪️ Islamic Dua Presets:' : '🎓 Academic Excellence Presets:'}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {(religion === 'christian' || religion === '' ? [
                      { label: 'Philippians 4:13', text: 'Philippians 4:13: I can do all things through Christ who strengthens me. May the Almighty Lord grant you divine wisdom, retentive memory, and peace in your exams!' },
                      { label: 'Jeremiah 29:11', text: 'Jeremiah 29:11: For I know the plans I have for you, plans to prosper you and not to harm you. Go forth with confidence, courage, and God’s abundant grace!' },
                      { label: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart. May God reward all your diligence with stellar grades and open great doors for your future!' }
                    ] : religion === 'muslim' ? [
                      { label: 'Rabbi Zidni Ilma', text: 'May Allah (SWT) ease your examinations, illuminate your mind with sharp wisdom, and bless you with flying colors. Rabbi Zidni Ilma!' },
                      { label: 'Barakah & Ease', text: 'In the Name of Allah, the Most Gracious. May Allah grant you tranquil focus, exceptional recall, and top success in your exams!' }
                    ] : [
                      { label: 'Confidence & Focus', text: 'Wishing you great focus, sharp clarity of mind, and tremendous success in your national examinations. May your dedication be rewarded with flying colors!' },
                      { label: 'Brilliance & Triumph', text: 'Success belongs to those who prepare and persevere. Step into the examination room with heads held high and achieve total victory!' }
                    ]).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessageBody(preset.text)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-zinc-200 dark:border-zinc-800 text-left text-xs text-slate-800 dark:text-zinc-300 transition-colors flex items-start justify-between gap-2 group"
                      >
                        <div>
                          <span className="font-bold text-pink-600 dark:text-pink-400 block text-[11px]">{preset.label}</span>
                          <span className="text-[11px] text-slate-600 dark:text-zinc-400 italic font-serif">"{preset.text}"</span>
                        </div>
                        <span className="text-[10px] font-bold text-pink-500 opacity-0 group-hover:opacity-100 shrink-0 self-center">Use &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Write your personal success message here..."
                  className="w-full rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-4 focus:border-pink-500 focus:outline-none shadow-sm"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">Font Style</label>
                    <select
                      value={messageFont}
                      onChange={(e) => setMessageFont(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:outline-none shadow-sm"
                    >
                      <option value="serif">Classic Serif</option>
                      <option value="sans-serif">Modern Sans</option>
                      <option value="cursive">Elegant Cursive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">Ink Colour</label>
                    <select
                      value={messageColour}
                      onChange={(e) => setMessageColour(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:outline-none shadow-sm"
                    >
                      <option value="#ec4899">Vibrant Pink</option>
                      <option value="#0f172a">Classic Charcoal</option>
                      <option value="#eab308">Gold Foil Accent</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Mandatory Student & School Delivery Destination Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                {isStandard ? '2. Candidate Recipient & School Destination *' : '4. Candidate Recipient & School Destination *'}
              </label>
              <span className="text-[10px] uppercase font-extrabold text-pink-600 dark:text-pink-400">Mandatory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">Candidate Full Names *</label>
                <input
                  type="text"
                  required
                  value={recipientFullNames}
                  onChange={(e) => setRecipientFullNames(e.target.value)}
                  placeholder="e.g. Mary Wanjiku Kinuthia"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">Admission / Index No. *</label>
                <input
                  type="text"
                  required
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="e.g. ADM-8492"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Alliance High School"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">
                  Class / Stream <span className="text-slate-400 dark:text-zinc-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="e.g. Form 4 West, Grade 8, Class 8 East"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">
                  Religion <span className="text-slate-400 dark:text-zinc-500 font-normal">(Optional)</span>
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                >
                  <option value="">Not Specified / Any</option>
                  <option value="christian">Christian</option>
                  <option value="muslim">Muslim</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">County *</label>
                <select
                  required
                  value={selectedCountyId}
                  onChange={(e) => setSelectedCountyId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                >
                  <option value="">Select County</option>
                  {counties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1 font-medium">Sub-County / Delivery Zone *</label>
                <select
                  required
                  value={selectedSubCountyId}
                  onChange={(e) => setSelectedSubCountyId(e.target.value)}
                  disabled={!selectedCountyId}
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none disabled:opacity-50 shadow-sm"
                >
                  <option value="">Select Sub-County</option>
                  {subCounties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.zone.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
          >
            <ShoppingBag className="w-5 h-5" /> Add {size} Card & Recipient to Cart — KSh {unitPriceKes.toLocaleString()}
          </button>
        </form>
      </div>
    </div>
  )
}
