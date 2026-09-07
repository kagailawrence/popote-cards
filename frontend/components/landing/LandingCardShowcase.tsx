'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, RotateCw, BookOpen, ChevronRight, ChevronLeft, Eye, Award, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

interface PresetTheme {
  id: string
  name: string
  subtitle: string
  badge: string
  badgeBg: string
  coverBg: string
  accentColor: string
  imageSrc: string
  sampleMsg: string
}

const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'kcse-form4',
    name: 'Form 4 "Best Wishes" KCSE Card',
    subtitle: 'Navy & Gold Foil Mortarboard',
    badge: 'KCSE 2026 BESTSELLER',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    coverBg: 'from-blue-950 via-slate-900 to-amber-950',
    accentColor: '#fbbf24',
    imageSrc: '/form4-success-card.jpg',
    sampleMsg: 'Your hard work, discipline and determination have brought you this far. Go for it! All the best in your Form 4 exams!',
  },
  {
    id: 'kpsea-star',
    name: 'KPSEA Grade 6 Assessment Card',
    subtitle: 'Sky Blue, Stars & Golden Medal',
    badge: 'PRIMARY SCHOOL CHOICE',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    coverBg: 'from-cyan-950 via-blue-900 to-indigo-950',
    accentColor: '#38bdf8',
    imageSrc: '/card-kpsea-star.jpg',
    sampleMsg: 'We are incredibly proud of you and the hard work you’ve put into your studies. Believe in yourself and keep shining!',
  },
  {
    id: 'floral-bloom',
    name: 'Floral Watercolor & Gold Frame',
    subtitle: 'Blush Blossoms & Deckled Paper',
    badge: 'FAMILY FAVORITE',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    coverBg: 'from-pink-950 via-rose-900 to-slate-950',
    accentColor: '#fb7185',
    imageSrc: '/card-floral-bloom.jpg',
    sampleMsg: 'We are so incredibly proud of you! Believe in yourself as much as we believe in you. All your hard work is about to pay off!',
  },
  {
    id: 'kcse-royal-gold',
    name: 'National School Royal Gold',
    subtitle: 'Emerald Velvet & Wax Seal',
    badge: 'EXCELLENCE EDITION',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    coverBg: 'from-emerald-950 via-teal-900 to-slate-950',
    accentColor: '#34d399',
    imageSrc: '/card-kcse-gold.jpg',
    sampleMsg: 'May wisdom, brilliance, and tranquility guide your pen in every KCSE exam paper. Top universities await you!',
  },
]

export function LandingCardShowcase() {
  const [selectedTheme, setSelectedTheme] = useState<PresetTheme>(PRESET_THEMES[0])
  const [viewMode, setViewMode] = useState<'bifold' | 'pages'>('bifold')
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4>(1)
  const [cardSize, setCardSize] = useState<'A5' | 'A4' | 'A3'>('A4')
  const [candidateName, setCandidateName] = useState('Brenda Wanjiru')
  const [schoolName, setSchoolName] = useState('Kenya High School, Nairobi')
  const [isFoilShimmer, setIsFoilShimmer] = useState(true)
  const [isAutoSpin, setIsAutoSpin] = useState(false)

  // 3D Tilt calculation
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Max rotation 12 degrees
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10

    setTilt({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  // Auto flip effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoSpin && viewMode === 'pages') {
      interval = setInterval(() => {
        setActivePage((prev) => ((prev % 4) + 1) as 1 | 2 | 3 | 4)
      }, 2500)
    }
    return () => clearInterval(interval)
  }, [isAutoSpin, viewMode])

  return (
    <div className="w-full relative py-6">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 blur-3xl -z-10 rounded-3xl" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive Controls & Live Customizer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-300 dark:border-pink-500/40 text-pink-700 dark:text-pink-300 text-xs font-bold shadow-sm">
              <Zap className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>Kenyan Success Cards Studio</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Test Drive Your <span className="animate-shimmer">Success Card</span> Design
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Explore authentic Kenyan examination cards for Form 4 (KCSE), Grade 6 (KPSEA), and National Schools. Type details below to test how your personalized message renders in real time.
            </p>
          </div>

          {/* Theme Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
              1. Choose Kenyan Card Design
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 ring-2 ring-pink-500/30 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-pink-300'
                      }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {theme.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {theme.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Live Customizer Input Fields */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-sm">
            <div className="space-y-1">
              <label htmlFor="candidate-name" className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Candidate Name
              </label>
              <input
                id="candidate-name"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter Student Name"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="school-name" className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Target School & Location
              </label>
              <input
                id="school-name"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter School Name"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Size & Foil Toggles */}
            <div className="flex justify-between items-center pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 mr-1">Size:</span>
                {(['A5', 'A4', 'A3'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setCardSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${cardSize === sz
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                      }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsFoilShimmer(!isFoilShimmer)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${isFoilShimmer
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-zinc-800 border-zinc-200 text-slate-600 dark:text-zinc-400'
                  }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isFoilShimmer ? 'Gold Foil On' : 'Foil Off'}
              </button>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/catalog"
              className="flex-1 px-6 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              Order This Design <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Column: 3D Animated Card Preview Showcase */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          
          {/* View Mode Switcher Header */}
          <div className="flex items-center justify-between w-full max-w-xl px-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
              <button
                onClick={() => setViewMode('bifold')}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'bifold'
                  ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                📖 Open Bifold Physical Card
              </button>
              <button
                onClick={() => setViewMode('pages')}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'pages'
                  ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                📑 4-Page Customizer
              </button>
            </div>

            {viewMode === 'pages' && (
              <button
                onClick={() => setIsAutoSpin(!isAutoSpin)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 text-pink-500 ${isAutoSpin ? 'animate-spin' : ''}`} />
                {isAutoSpin ? 'Pause' : 'Auto Flip'}
              </button>
            )}
          </div>

          {/* Card Viewport Container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-xl aspect-[16/10] relative rounded-3xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 border-2 border-zinc-200/80 dark:border-zinc-800/80 bg-slate-950 cursor-pointer select-none"
            style={{
              perspective: '1000px',
              transform: isHovered
                ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
            }}
          >
            {/* Gold Foil Shimmer Overlay */}
            {isFoilShimmer && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/15 to-transparent pointer-events-none animate-shimmer z-20" />
            )}

            {/* Header info badge on 3D card */}
            <div className="flex justify-between items-center z-20">
              <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-widest border backdrop-blur-md ${selectedTheme.badgeBg}`}>
                {selectedTheme.badge}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] font-bold backdrop-blur-md">
                  SIZE: {cardSize}
                </span>
                {viewMode === 'pages' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-pink-600/50 border border-pink-500/50 text-pink-200 text-[10px] font-extrabold uppercase backdrop-blur-md">
                    PAGE {activePage} OF 4
                  </span>
                )}
              </div>
            </div>

            {/* VIEW MODE 1: OPEN BIFOLD PHYSICAL CARD PHOTOGRAPHY */}
            {viewMode === 'bifold' && (
              <div className="absolute inset-0 z-0">
                <img
                  src={selectedTheme.imageSrc}
                  alt={selectedTheme.name}
                  className="w-full h-full object-cover object-center"
                />
                {/* Real-time Dynamic Candidate Overlay Badge */}
                <div className="absolute bottom-4 left-4 z-10 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white max-w-xs shadow-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-300">
                    <Sparkles className="w-3 h-3" /> Personalized For
                  </div>
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    {candidateName || 'Brenda Wanjiru'}
                  </p>
                  <p className="text-[10px] text-zinc-300 truncate">
                    {schoolName || 'Kenya High School, Nairobi'}
                  </p>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: 4-PAGE PHYSICAL TACTILE CARD VIEWER */}
            {viewMode === 'pages' && (
              <div className="my-auto relative z-10 w-full">
                
                {/* PAGE 1: AUTHENTIC PHYSICAL FRONT COVER */}
                {activePage === 1 && (
                  <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border-2 border-amber-400/50 shadow-2xl text-center space-y-4 relative overflow-hidden">
                    {/* Gold Leaf Corner Borders */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

                    <div className="flex justify-center pt-1">
                      <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-400/20">
                        <Award className="w-6 h-6 animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-300 font-bold block">
                        OFFICIAL 2026 EXAMINATION CARD
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight font-serif drop-shadow-md">
                        {selectedTheme.name}
                      </h4>
                      <p className="text-[11px] text-amber-200/70 font-serif italic">
                        &quot;Dream • Study • Conquer&quot;
                      </p>
                    </div>

                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />

                    {/* Recipient Details Ribbon */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-amber-400/30 max-w-sm mx-auto shadow-inner space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-amber-300 tracking-widest block">
                        Prepared Specially For
                      </span>
                      <p className="text-sm sm:text-base font-black text-white font-serif tracking-wide truncate">
                        {candidateName || 'Candidate Name'}
                      </p>
                      <p className="text-[11px] text-amber-200/80 truncate">
                        {schoolName || 'School Name'}
                      </p>
                    </div>
                  </div>
                )}

                {/* PAGE 2: INSIDE LEFT (CANDIDATE PHOTO MOUNT) */}
                {activePage === 2 && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#fdfbf7] text-slate-900 border-2 border-amber-300 shadow-2xl text-center space-y-3 relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-600" /> High-Gloss Candidate Photo Insert
                    </div>

                    {/* Realistic Photo Frame with Gold Corner Mounts */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-xl border-4 border-white bg-slate-200 overflow-hidden shadow-xl relative group">
                      <img
                        src="/placeholder-user.jpg"
                        alt="Candidate preview insert"
                        className="w-full h-full object-cover"
                      />
                      {/* Gold Corner Mounts */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-500" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-500" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-500" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-500" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-black text-slate-900 font-serif">
                        {candidateName || 'Candidate Name'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                        INDEX: 2026/0401/KCSE • OFFICIAL CANDIDATE
                      </p>
                    </div>
                  </div>
                )}

                {/* PAGE 3: INSIDE RIGHT (CURSIVE HANDWRITTEN BLESSINGS) */}
                {activePage === 3 && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#fdfbf7] text-slate-900 border-2 border-amber-300 shadow-2xl text-center space-y-3 relative">
                    {/* Floral Watermark Accents */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-100 text-pink-900 text-[10px] font-extrabold border border-pink-200">
                      <BookOpen className="w-3 h-3 text-pink-600" /> Handwritten Family Encouragement
                    </div>

                    <div className="p-4 rounded-xl bg-white/90 border border-amber-200/80 max-w-md mx-auto space-y-2.5 shadow-sm">
                      <p className="text-xs sm:text-sm italic leading-relaxed font-serif text-slate-800">
                        &quot;{selectedTheme.sampleMsg}&quot;
                      </p>
                      <div className="pt-2 text-right border-t border-slate-200">
                        <span className="text-xs font-bold font-serif text-pink-700">
                          — Lots of Love, Your Family & Friends ❤️
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 4: BACK COVER (AUTHENTIC QUALITY GUARANTEE) */}
                {activePage === 4 && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#0b1120] text-white border-2 border-amber-400/40 text-center space-y-3 shadow-2xl relative">
                    <div className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-300">
                      <ShieldCheck className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-mono">
                        AUTHENTIC POPOTE DELIVERY PROOF
                      </h4>
                      <p className="text-[11px] text-zinc-300 max-w-sm mx-auto leading-relaxed">
                        Printed on 350GSM silk cardstock with heat-fused gold foil. Hand-delivered straight to the recipient student&apos;s school gate with signed photo handover scan.
                      </p>
                    </div>

                    <div className="pt-1 text-[9px] text-amber-300/80 font-mono tracking-widest uppercase">
                      KENYA • NAIROBI • NAKURU • ELDORET • KISUMU • MOMBASA
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Bottom Controls / Pill Selector */}
            <div className="flex justify-between items-center z-20 pt-2 border-t border-white/10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl">
              {viewMode === 'pages' ? (
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setActivePage(num as any)
                        setIsAutoSpin(false)
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${activePage === num
                          ? 'bg-pink-600 text-white shadow-md scale-105'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                    >
                      Page {num}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-bold text-white tracking-wide">
                    Live Bifold Physical Preview • {selectedTheme.name}
                  </span>
                </div>
              )}

              <span className="text-[10px] text-amber-300 font-mono tracking-wider font-bold">
                POPOTE VERIFIED
              </span>
            </div>
          </div>

          {/* Quick Stats bar below card */}
          <div className="w-full max-w-xl mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 block">350 GSM</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Thick Cardstock</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 block">Gold Foil</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Embossed Seals</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 block">100% Guaranteed</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Direct School Gate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
