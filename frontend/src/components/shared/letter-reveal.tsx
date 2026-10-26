"use client"

import { motion } from "motion/react"

interface LetterRevealProps {
  /** One entry per line. */
  lines: string[]
  /** Delay before the first letter (s). */
  delay?: number
}

/** Each letter slides up from behind a mask, one after another. Screen readers get the plain text. */
export function LetterReveal({ lines, delay = 0 }: LetterRevealProps) {
  let index = 0

  return (
    <span>
      {/* aria-label is ignored on a plain span, so the readable text is a visually hidden copy */}
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line) => (
        <span key={line} aria-hidden className="block overflow-hidden pb-[0.06em]">
          {line.split("").map((char, i) => {
            const order = index++
            return (
              <motion.span
                key={`${char}-${i}`}
                className="inline-block"
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: delay + order * 0.035, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* A lone space would collapse inside an inline-block: use a non-breaking space */}
                {char === " " ? " " : char}
              </motion.span>
            )
          })}
        </span>
      ))}
    </span>
  )
}
