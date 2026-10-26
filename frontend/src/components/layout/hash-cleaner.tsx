"use client"

import { useEffect } from "react"

import { scrollToSection } from "@/components/shared/section-link"

/**
 * Keeps the home page URL at `/`. When arriving with a section hash (e.g. `/#contact` from a
 * project page), it scrolls to that section, then removes the hash from the address bar.
 */
export function HashCleaner() {
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    // Wait one frame so the section is laid out before scrolling
    const frame = requestAnimationFrame(() => {
      scrollToSection(id)
      window.history.replaceState(window.history.state, "", "/")
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return null
}
