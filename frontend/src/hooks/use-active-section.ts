"use client"

import { useEffect, useState } from "react"

/**
 * Returns the id of the section currently in view (scrollspy).
 * A section is "active" when it crosses the middle band of the viewport.
 */
export function useActiveSection<T extends string>(ids: readonly T[], enabled = true) {
  const [active, setActive] = useState<T | null>(ids[0] ?? null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as T)
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )

    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [ids, enabled])

  return active
}
