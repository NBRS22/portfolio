"use client"

import { useEffect, useRef } from "react"
import { animate, useInView } from "motion/react"

/** Number that counts up from 0 when it scrolls into view. Zero-padded to `digits`, or with thousands separators when `grouped`. */
export function Counter({ value, digits = 2, grouped = false }: { value: number; digits?: number; grouped?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (!ref.current) return
        const rounded = Math.round(latest)
        ref.current.textContent = grouped ? rounded.toLocaleString("en-US") : String(rounded).padStart(digits, "0")
      },
    })
    return () => controls.stop()
  }, [inView, value, digits, grouped])

  return (
    <span ref={ref} className="tabular-nums">
      {grouped ? "0" : "0".repeat(digits)}
    </span>
  )
}
