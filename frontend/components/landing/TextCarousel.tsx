'use client'

import { useState, useEffect } from 'react'

interface TextCarouselProps {
  phrases?: string[]
  intervalMs?: number
  className?: string
}

const DEFAULT_PHRASES = [
  'KCSE Success Cards',
  'KPSEA Exam Cards',
  'Gold Foil Success Cards',
  'Custom Photo Cards',
]

export function TextCarousel({
  phrases = DEFAULT_PHRASES,
  intervalMs = 3200,
  className = '',
}: TextCarouselProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [phrases.length, intervalMs])

  // Find longest phrase to reserve space dynamically
  const longestPhrase = phrases.reduce((a, b) => (a.length > b.length ? a : b), phrases[0] || '')

  return (
    <span className={`inline-block relative overflow-visible align-bottom py-1 px-2 text-center ${className}`}>
      {/* Invisible spacer to reserve width/height and prevent clipping */}
      <span className="invisible opacity-0 select-none font-black px-1 pointer-events-none" aria-hidden="true">
        {longestPhrase}
      </span>

      {phrases.map((phrase, i) => {
        const isActive = i === index
        const isPrev = i === (index - 1 + phrases.length) % phrases.length

        return (
          <span
            key={phrase}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) font-black animate-shimmer whitespace-nowrap py-1 px-2 ${
              isActive
                ? 'opacity-100 translate-y-0 scale-100'
                : isPrev
                ? 'opacity-0 -translate-y-6 scale-95 pointer-events-none'
                : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
            }`}
          >
            {phrase}
          </span>
        )
      })}
    </span>
  )
}
