'use client'

import { useState, useRef, useEffect } from 'react'
import { RotateCw, Play, Pause, Maximize2, Sparkles, BookOpen, ShieldCheck, Award, ZoomIn, Eye, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PageRecord {
  id: string
  page_type: 'front' | 'inside_left' | 'inside_right' | 'back'
  url: string
  width_px?: number
  height_px?: number
}

interface ImageRecord {
  id: string
  angleOrder: number
  url: string
}

interface Card360ViewerProps {
  cardName: string
  images?: ImageRecord[]
  pages?: PageRecord[]
  cardSize?: 'A3' | 'A4' | 'A5'
  customPhotoUrl?: string
  customMessage?: string
  messageFont?: string
  messageColour?: string
  recipientName?: string
  admissionNumber?: string
  schoolName?: string
  studentClass?: string
}

export function Card360Viewer({
  cardName,
  images = [],
  pages = [],
  cardSize = 'A4',
  customPhotoUrl,
  customMessage,
  messageFont,
  messageColour,
  recipientName,
  admissionNumber,
  schoolName,
  studentClass,
}: Card360ViewerProps) {
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4>(1)
  const [isAutoSpin, setIsAutoSpin] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef<number>(0)

  // 360 Spin Frame Index (if 360 images provided)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const hasReal360 = images.length > 2 || (images.length > 1 && !images[0]?.url?.includes('default-'))
  const [viewMode, setViewMode] = useState<'4pages' | '360'>('4pages')

  // WooCommerce-style Hover Zoom state
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  // Full Screen Lightbox Modal State
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Auto flip pages or auto spin 360 frames
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoSpin) {
      interval = setInterval(() => {
        if (viewMode === '360' && images.length > 0) {
          setCurrentFrameIndex((prev) => (prev + 1) % images.length)
        } else {
          setActivePage((prev) => ((prev % 4) + 1) as 1 | 2 | 3 | 4)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isAutoSpin, viewMode, images.length])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    setIsAutoSpin(false)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    startXRef.current = clientX
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    // Hover zoom calculation
    if ('clientX' in e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePos({ x, y })
    }

    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - startXRef.current

    if (Math.abs(deltaX) > 20) {
      if (viewMode === '360' && images.length > 0) {
        if (deltaX > 0) {
          setCurrentFrameIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        } else {
          setCurrentFrameIndex((prev) => (prev + 1) % images.length)
        }
      } else {
        if (deltaX > 0) {
          setActivePage((prev) => (prev === 1 ? 4 : ((prev - 1) as any)))
        } else {
          setActivePage((prev) => (prev === 4 ? 1 : ((prev + 1) as any)))
        }
      }
      startXRef.current = clientX
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const sizeStyles = {
    A5: {
      maxWidth: 'w-full max-w-xl',
      label: 'A5 (14.8 x 21 cm)',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
    },
    A4: {
      maxWidth: 'w-full max-w-2xl',
      label: 'A4 (21 x 29.7 cm)',
      badgeBg: 'bg-pink-100 dark:bg-pink-950/80 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300',
    },
    A3: {
      maxWidth: 'w-full max-w-3xl',
      label: 'A3 (29.7 x 42 cm)',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    },
  }[cardSize]

  const pageTypes: ('front' | 'inside_left' | 'inside_right' | 'back')[] = ['front', 'inside_left', 'inside_right', 'back']
  const currentPageType = pageTypes[activePage - 1]
  const adminPageRecord = pages.find((p) => p.page_type === currentPageType)

  const pageTitles = {
    1: 'Page 1: Front Cover',
    2: 'Page 2: Inside Left (Photo)',
    3: 'Page 3: Inside Right (Message)',
    4: 'Page 4: Back Cover',
  }

  return (
    <>
      <div className="relative rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px] overflow-hidden select-none shadow-xl dark:shadow-2xl transition-all duration-300 w-full">
        {/* Top Banner Controls - Mobile Friendly Flex Wrap */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                4-Page Card Studio
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] sm:text-[11px] font-extrabold truncate">
              {viewMode === '360' ? `360° View (${currentFrameIndex + 1}/${images.length})` : pageTitles[activePage]}
            </span>
          </div>

          {/* View Mode Toggle & Full Screen Buttons */}
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {hasReal360 && (
              <button
                onClick={() => setViewMode(viewMode === '4pages' ? '360' : '4pages')}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 hover:border-pink-500 transition-colors"
              >
                <RotateCw className="w-3 h-3 text-pink-500" />
                {viewMode === '360' ? '4 Pages' : '360° View'}
              </button>
            )}

            <button
              onClick={() => setIsFullScreen(true)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 hover:bg-pink-100 transition-colors shadow-sm"
              title="Open Full Screen View"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Screen</span>
            </button>

            <div className={`px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-extrabold flex items-center gap-1 shadow-sm ${sizeStyles.badgeBg}`}>
              <span>{sizeStyles.label}</span>
            </div>
          </div>
        </div>

        {/* Responsive Interactive Display Viewport */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className={`relative w-full ${sizeStyles.maxWidth} aspect-[4/3] sm:aspect-[16/11] min-h-[260px] sm:min-h-[420px] lg:min-h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-zinc-200 dark:border-zinc-800 shadow-xl cursor-crosshair flex items-center justify-center my-4 sm:my-6 transition-all duration-300 ${isHovered ? 'ring-2 ring-pink-500/80 scale-[1.01]' : ''
            }`}
        >
          {/* Hover Zoom & Drag Navigation Hint (Hidden on mobile touch screens) */}
          <div className="hidden sm:flex absolute top-3 right-3 z-20 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs text-white font-bold items-center gap-1.5 opacity-90 border border-white/10">
            <ZoomIn className="w-3.5 h-3.5 text-pink-400" /> Hover to Zoom • Drag to Flip
          </div>

          {/* Mobile Swipe / Arrow Navigation Overlays */}
          <button
            onClick={() => setActivePage((prev) => (prev === 1 ? 4 : ((prev - 1) as any)))}
            className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-black/60 hover:bg-pink-600 text-white backdrop-blur-md border border-white/10 transition-all duration-200 active:scale-95 shadow-xl group"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setActivePage((prev) => (prev === 4 ? 1 : ((prev + 1) as any)))}
            className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-black/60 hover:bg-pink-600 text-white backdrop-blur-md border border-white/10 transition-all duration-200 active:scale-95 shadow-xl group"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* 360° FRAME VIEW MODE */}
          {viewMode === '360' && images.length > 0 ? (
            <img
              src={images[currentFrameIndex]?.url}
              alt={`${cardName} 360 view frame ${currentFrameIndex + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain block transition-transform duration-200 p-2"
              style={
                isHovered
                  ? {
                    transform: 'scale(1.7)',
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  }
                  : undefined
              }
            />
          ) : (
            /* 4-PAGE VIEW MODE WITH ADMIN UPLOADED ARTWORK OVERLAY */
            <div
              className="w-full h-full relative overflow-hidden flex items-center justify-center transition-transform duration-200"
              style={
                isHovered
                  ? {
                    transform: 'scale(1.6)',
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  }
                  : undefined
              }
            >
              {adminPageRecord?.url ? (
                <img
                  src={adminPageRecord.url}
                  alt={`${cardName} - ${currentPageType}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain block absolute inset-0 z-0 p-1 sm:p-2"
                />
              ) : null}

              {/* PAGE 1: FRONT COVER OVERLAY */}
              {activePage === 1 && (
                <div className={`w-full h-full ${adminPageRecord?.url ? 'bg-black/30 backdrop-blur-[1px]' : 'bg-gradient-to-br from-pink-600 via-purple-700 to-indigo-900'} p-4 sm:p-8 flex flex-col justify-between relative z-10 text-white`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-200 border border-amber-300/40 backdrop-blur-md">
                      PAGE 1 • COVER
                    </span>
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-300" />
                  </div>

                  <div className="my-auto text-center px-2 z-10 space-y-2">
                    {!adminPageRecord?.url && (
                      <>
                        <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-amber-200/90 block">
                          SUCCESS & TRIUMPH
                        </span>
                        <h3 className="text-xl sm:text-3xl font-black text-amber-200 tracking-tight font-serif drop-shadow-md">
                          {cardName}
                        </h3>
                        <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto" />
                      </>
                    )}

                    {recipientName && (
                      <div className="pt-1 animate-scale-in bg-black/50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md max-w-md mx-auto border border-white/20 shadow-2xl">
                        <span className="text-[9px] sm:text-xs uppercase tracking-wider text-amber-300 font-bold block">Specially Printed For</span>
                        <p className="text-xs sm:text-base font-extrabold text-white drop-shadow-sm truncate">
                          {recipientName} {studentClass ? `(${studentClass})` : ''}
                        </p>
                        {schoolName && <span className="text-[10px] sm:text-xs text-amber-200/90 block truncate">{schoolName}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end z-10 text-[9px] sm:text-xs text-amber-100/90 font-medium">
                    <span>{cardSize} Deluxe Edition</span>
                    <span className="font-bold tracking-wider">POPOTE CARD DELIVERY</span>
                  </div>
                </div>
              )}

              {/* PAGE 2: INSIDE LEFT (PHOTO) OVERLAY */}
              {activePage === 2 && (
                <div className={`w-full h-full ${adminPageRecord?.url ? 'bg-black/20' : 'bg-slate-900'} p-4 sm:p-8 flex flex-col justify-between relative z-10 text-slate-100`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold uppercase tracking-widest bg-pink-500/20 text-pink-300 border border-pink-400/30">
                      PAGE 2 • PHOTO
                    </span>
                    <span className="text-[10px] sm:text-xs text-pink-400 font-bold">PHOTO INSERT</span>
                  </div>

                  <div className="my-auto flex flex-col items-center justify-center space-y-2 sm:space-y-4 text-center px-2 z-10">
                    {customPhotoUrl ? (
                      <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-pink-400 shadow-2xl animate-scale-in">
                        <img src={customPhotoUrl} alt="Recipient photo insert" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl border-2 border-dashed border-pink-500/60 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-2 text-pink-300 space-y-1">
                        <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-extrabold text-center">Photo Zone</span>
                      </div>
                    )}
                    {recipientName && (
                      <span className="text-xs sm:text-sm font-extrabold text-white block bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-lg truncate max-w-[200px] sm:max-w-xs">
                        {recipientName} {admissionNumber ? `(${admissionNumber})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-center text-[9px] sm:text-xs text-pink-300/80 font-medium z-10">
                    High Resolution Glossy Photo Print
                  </div>
                </div>
              )}

              {/* PAGE 3: INSIDE RIGHT (MESSAGE) OVERLAY */}
              {activePage === 3 && (
                <div className={`w-full h-full ${adminPageRecord?.url ? 'bg-black/20' : 'bg-white dark:bg-zinc-900'} p-4 sm:p-8 flex flex-col justify-between relative z-10 text-slate-900 dark:text-zinc-100`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold uppercase tracking-widest bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                      PAGE 3 • MESSAGE
                    </span>
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  </div>

                  <div className="my-auto text-center px-3 space-y-2 z-10 bg-black/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-md border border-white/15 text-white max-w-xl mx-auto shadow-2xl">
                    <p
                      className="text-xs sm:text-base font-medium leading-relaxed italic"
                      style={{
                        fontFamily: messageFont === 'sans-serif' ? 'system-ui, sans-serif' : messageFont === 'cursive' ? 'cursive, Georgia' : 'Georgia, serif',
                        color: messageColour || '#ec4899',
                      }}
                    >
                      "{customMessage || 'May your wisdom shine brightly in your exams. Wishing you victory and excellence on your journey ahead!'}"
                    </p>
                    {recipientName && (
                      <div className="text-xs sm:text-sm font-extrabold text-amber-200 block pt-1">
                        <span>— Best Wishes for {recipientName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end text-[9px] sm:text-xs text-slate-300 font-medium z-10">
                    <span>Personalized Calligraphy</span>
                    <span>Printed in Kenya</span>
                  </div>
                </div>
              )}

              {/* PAGE 4: BACK COVER OVERLAY */}
              {activePage === 4 && (
                <div className={`w-full h-full ${adminPageRecord?.url ? 'bg-black/30' : 'bg-slate-950'} p-4 sm:p-8 flex flex-col justify-between relative z-10 text-amber-200`}>
                  <div className="flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-200 border border-amber-300/40">
                      PAGE 4 • BACK
                    </span>
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  </div>

                  <div className="my-auto text-center space-y-2 z-10 bg-black/50 p-4 sm:p-6 rounded-2xl backdrop-blur-md border border-white/15 max-w-sm mx-auto shadow-2xl">
                    <Award className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mx-auto" />
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">AUTHENTIC POPOTE QUALITY</h4>
                    <p className="text-[10px] sm:text-xs text-amber-200/90 leading-relaxed">
                      Printed on 350GSM Premium {cardSize} Card Stock with Gold Foil Finishing.
                    </p>
                  </div>

                  <div className="text-center text-[9px] sm:text-xs text-amber-300/80 font-mono tracking-widest z-10">
                    WWW.POPOTECARDDELIVERY.COM • NAIROBI KENYA
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Touch-Friendly Mobile Scrollable Thumbnail Gallery Strip */}
        <div className="w-full flex items-center justify-start sm:justify-center gap-2 sm:gap-4 py-3 px-2 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 overflow-x-auto snap-x scroll-smooth">
          {[
            { num: 1, type: 'front', label: 'Front Cover' },
            { num: 2, type: 'inside_left', label: 'Inside Left (Photo)' },
            { num: 3, type: 'inside_right', label: 'Inside Right (Msg)' },
            { num: 4, type: 'back', label: 'Back Cover' },
          ].map((p) => {
            const pageRec = pages.find((record) => record.page_type === p.type)
            const isActive = activePage === p.num && viewMode === '4pages'

            return (
              <button
                key={p.num}
                onClick={() => {
                  setActivePage(p.num as any)
                  setViewMode('4pages')
                  setIsAutoSpin(false)
                }}
                title={p.label}
                className={`relative group flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 shrink-0 snap-center ${isActive
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/60 shadow-lg scale-105 ring-2 ring-pink-500/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-pink-400'
                  }`}
              >
                {/* Mini Thumbnail Image Viewport */}
                <div className="w-16 h-12 sm:w-24 sm:h-18 rounded-lg sm:rounded-xl overflow-hidden bg-slate-900 relative flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  {pageRec?.url ? (
                    <img src={pageRec.url} alt={p.label} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-1 text-[10px] font-bold text-pink-400 text-center leading-tight">
                      <ImageIcon className="w-4 h-4 mb-0.5 text-pink-500" />
                      <span>Page {p.num}</span>
                    </div>
                  )}
                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center backdrop-blur-[0.5px]">
                      <Eye className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-extrabold ${isActive ? 'text-pink-600 dark:text-pink-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                  P{p.num}: {p.type === 'front' ? 'Cover' : p.type === 'inside_left' ? 'Photo' : p.type === 'inside_right' ? 'Msg' : 'Back'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Control Actions Bar */}
        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4 w-full">
          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-extrabold rounded-xl bg-pink-600 hover:bg-pink-500 text-white shadow-md flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          >
            {isAutoSpin ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoSpin ? 'Pause' : viewMode === '360' ? 'Auto Spin 360°' : 'Auto Flip'}
          </button>

          <button
            onClick={() => {
              if (viewMode === '360' && images.length > 0) {
                setCurrentFrameIndex((prev) => (prev + 1) % images.length)
              } else {
                setActivePage((prev) => ((prev % 4) + 1) as any)
              }
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-extrabold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
          >
            <RotateCw className="w-4 h-4 text-pink-500" /> Next Page &rarr;
          </button>
        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX MODAL - MOBILE OPTIMIZED */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-8 animate-scale-in">
          {/* Modal Header */}
          <div className="w-full max-w-6xl flex justify-between items-center pb-3 border-b border-white/10 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
              <div className="truncate max-w-[200px] sm:max-w-none">
                <h3 className="text-sm sm:text-lg font-black truncate">{cardName}</h3>
                <span className="text-[10px] sm:text-xs text-pink-300 font-bold block">{pageTitles[activePage]}</span>
              </div>
            </div>

            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-pink-600 text-white transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Giant Image Display Viewport */}
          <div className="relative w-full max-w-5xl h-[65vh] sm:h-[75vh] flex items-center justify-center my-auto">
            {adminPageRecord?.url ? (
              <img
                src={adminPageRecord.url}
                alt={`${cardName} full screen`}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/10"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-3 p-4">
                <BookOpen className="w-12 h-12 text-pink-400" />
                <h4 className="text-lg font-bold">{pageTitles[activePage]}</h4>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div className="flex gap-1.5 w-full sm:w-auto justify-center">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setActivePage(num as any)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all ${activePage === num ? 'bg-pink-600 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  Page {num}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullScreen(false)}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-pink-50 transition-colors"
            >
              Close Lightbox
            </button>
          </div>
        </div>
      )}
    </>
  )
}
