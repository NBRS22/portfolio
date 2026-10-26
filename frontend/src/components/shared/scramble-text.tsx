"use client"

import { useEffect, useState } from "react"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/"
const STEP_MS = 30

interface ScrambleTextProps {
  text: string
  className?: string
  /** Delay before the effect starts (ms). */
  delay?: number
}

/**
 * Text that "decodes" itself: random glyphs settle into the final text, left to right.
 * The server renders the final text, so content stays readable without JavaScript.
 */
export function ScrambleText({ text, className, delay = 0 }: ScrambleTextProps) {
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        frame += 1
        const revealed = Math.floor(frame / 2)
        setDisplay(
          text
            .split("")
            .map((char, i) =>
              i < revealed || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join("")
        )
        if (revealed >= text.length) clearInterval(interval)
      }, STEP_MS)
    }, delay)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, delay])

  return (
    <span className={className}>
      {/* aria-label is ignored on a plain span, so the readable text is a visually hidden copy */}
      <span className="sr-only">{text}</span>
      <span aria-hidden>{display}</span>
    </span>
  )
}
