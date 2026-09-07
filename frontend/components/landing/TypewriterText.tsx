'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  words?: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  className?: string
}

const DEFAULT_WORDS = [
  'KCSE Success Cards',
  'KPSEA Exam Cards',
  'Gold Foil Success Cards',
  'Custom Photo Cards',
  'KCPE & High School Cards',
]

export function TypewriterText({
  words = DEFAULT_WORDS,
  typingSpeed = 100,
  deletingSpeed = 60,
  pauseDuration = 2000,
  className = '',
}: TypewriterTextProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const targetWord = words[wordIndex % words.length]

    let timer: NodeJS.Timeout

    if (isDeleting) {
      // Deleting character by character
      timer = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1))
      }, deletingSpeed)
    } else {
      // Typing character by character
      timer = setTimeout(() => {
        setCurrentText((prev) => targetWord.slice(0, prev.length + 1))
      }, typingSpeed)
    }

    // When full word is typed, pause before deleting
    if (!isDeleting && currentText === targetWord) {
      timer = setTimeout(() => {
        setIsDeleting(true)
      }, pauseDuration)
    }

    // When word is completely erased, switch to next word
    if (isDeleting && currentText === '') {
      setIsDeleting(false)
      setWordIndex((prev) => (prev + 1) % words.length)
    }

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration])

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="animate-shimmer font-black">
        {currentText}
      </span>
      {/* Typewriter Blinking Cursor */}
      <span className="inline-block w-[3px] h-[0.85em] ml-1 bg-pink-500 dark:bg-pink-400 animate-pulse rounded-full shadow-sm" />
    </span>
  )
}
