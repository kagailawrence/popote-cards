'use client'

import React, { useState } from 'react'
import { Award, Star, Sun, Crown, GraduationCap, Layers } from 'lucide-react'

interface CardThumbnailVisualProps {
  cardName: string
  imageUrl?: string | null
  secondaryImageUrl?: string | null
  allowsCustomPhoto?: boolean
  className?: string
  aspectRatio?: string
  showThumbStrip?: boolean
}

export function CardThumbnailVisual({
  cardName,
  imageUrl,
  secondaryImageUrl,
  allowsCustomPhoto = false,
  className = '',
  aspectRatio = 'aspect-[4/3]',
  showThumbStrip = false,
}: CardThumbnailVisualProps) {
  const [imgError, setImgError] = useState(false)
  const [secondaryErr, setSecondaryErr] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Theme presets based on card design title
  const getThemePreset = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('dawn') || lower.includes('sun')) {
      return {
        bg: 'from-amber-500 via-orange-500 to-pink-600',
        titleColor: 'text-amber-100',
        badgeBg: 'bg-amber-400/25 text-amber-200 border-amber-300/40',
        icon: <Sun className="w-5 h-5 text-amber-200 animate-spin-slow" />,
        pattern: 'radial-gradient(circle at 50% 30%, rgba(254, 240, 138, 0.4) 0%, transparent 60%)',
        motto: 'Radiant Bright Future Ahead',
      }
    }
    if (lower.includes('you did it') || lower.includes('bold')) {
      return {
        bg: 'from-fuchsia-600 via-pink-600 to-purple-800',
        titleColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-400/25 text-yellow-200 border-yellow-300/40',
        icon: <Award className="w-5 h-5 text-yellow-300" />,
        pattern: 'radial-gradient(circle at 20% 20%, rgba(253, 224, 71, 0.3) 0%, transparent 50%)',
        motto: 'Major Victory & Milestone',
      }
    }
    if (lower.includes('grace') || lower.includes('glory') || lower.includes('royal')) {
      return {
        bg: 'from-slate-900 via-indigo-950 to-blue-900',
        titleColor: 'text-amber-300',
        badgeBg: 'bg-amber-400/25 text-amber-200 border-amber-300/40',
        icon: <Crown className="w-5 h-5 text-amber-300" />,
        pattern: 'radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)',
        motto: 'Excellence & Heavenly Blessings',
      }
    }
    if (lower.includes('keep') || lower.includes('minimal')) {
      return {
        bg: 'from-emerald-800 via-teal-900 to-slate-900',
        titleColor: 'text-teal-200',
        badgeBg: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40',
        icon: <Star className="w-5 h-5 text-teal-200" />,
        pattern: 'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.2) 0%, transparent 60%)',
        motto: 'Unstoppable Determination',
      }
    }
    // Default Fallback Theme (Pink/Purple Luxury Gold Foil)
    return {
      bg: 'from-pink-600 via-purple-700 to-indigo-900',
      titleColor: 'text-amber-300',
      badgeBg: 'bg-amber-400/25 text-amber-200 border-amber-300/40',
      icon: <GraduationCap className="w-5 h-5 text-amber-300" />,
      pattern: 'radial-gradient(circle at 50% 20%, rgba(252, 211, 77, 0.25) 0%, transparent 60%)',
      motto: 'Success & Examination Triumph',
    }
  }

  const theme = getThemePreset(cardName)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/thumb select-none"
    >
      {/* WooCommerce Style Product Gallery Thumbnail Frame */}
      <div
        className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800 transition-all duration-500 group-hover/thumb:shadow-xl group-hover/thumb:border-pink-500/50 ${className}`}
      >
        {/* WooCommerce Hover Page Flip Indicator Badge */}
        <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-extrabold text-white flex items-center gap-1 opacity-90 transition-opacity">
          <Layers className="w-3 h-3 text-pink-400" />
          <span>4 Pages Fold</span>
        </div>

        {/* PRIMARY FRONT COVER IMAGE */}
        {imageUrl && !imgError ? (
          <div className="w-full h-full relative">
            <img
              src={imageUrl}
              alt={`${cardName} front cover thumbnail`}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isHovered && secondaryImageUrl && !secondaryErr
                  ? 'opacity-0 scale-105'
                  : 'opacity-100 group-hover/thumb:scale-105'
                }`}
            />

            {/* WOOCOMMERCE SECONDARY HOVER IMAGE (PAGE 3 INSIDE MESSAGE) */}
            {secondaryImageUrl && !secondaryErr && (
              <img
                src={secondaryImageUrl}
                alt={`${cardName} inside preview`}
                loading="lazy"
                decoding="async"
                onError={() => setSecondaryErr(true)}
                className={`w-full h-full object-cover absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
              />
            )}
          </div>
        ) : (
          /* Rendered Custom Graphic Visual */
          <div
            className={`w-full h-full bg-gradient-to-br ${theme.bg} p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-500`}
            style={{ backgroundImage: theme.pattern }}
          >
            {/* Metallic Gold Corner Accents */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-300/60 rounded-tl" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-300/60 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-300/60 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-300/60 rounded-br" />

            {/* Header Badge */}
            <div className="flex justify-between items-center z-10">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border backdrop-blur-md ${theme.badgeBg}`}>
                SUCCESS CARD
              </span>
              <div className="p-1 rounded-full bg-black/20 backdrop-blur-md">
                {theme.icon}
              </div>
            </div>

            {/* Center Title Art */}
            <div className="my-auto text-center px-2 z-10 space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-200/90 block">
                {theme.motto}
              </span>
              <h3 className={`text-lg sm:text-xl font-black ${theme.titleColor} tracking-tight drop-shadow-md leading-tight font-serif`}>
                {cardName}
              </h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-1" />
            </div>

            {/* Clean Footer Info */}
            <div className="flex justify-between items-end z-10 text-[9px] text-amber-100/80 font-medium">
              <span>{allowsCustomPhoto ? '📷 Photo Optional' : '✨ Deluxe Edition'}</span>
              <span className="font-bold tracking-wider opacity-90">POPOTE CARDS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
