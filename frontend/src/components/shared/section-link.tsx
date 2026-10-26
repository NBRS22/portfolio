"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/** Scrolls to a section of the current page (`home` = top of the page). Smoothness comes from the CSS `scroll-behavior`. */
export function scrollToSection(id: string) {
  if (id === "home") {
    window.scrollTo({ top: 0 })
    return
  }
  document.getElementById(id)?.scrollIntoView()
}

interface SectionLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  /** Id of the section to reach. */
  section: string
}

/**
 * Link to a section, without ever adding `#section` to the URL.
 * - If the section is on the current page (any home section, or e.g. `demo` on a project page):
 *   scrolls to it and keeps the URL as is.
 * - Otherwise (e.g. "About" clicked on a project page): navigates to `/#section`; `HashCleaner` on the
 *   home page then scrolls there and resets the URL to `/`.
 */
export function SectionLink({ section, onClick, ...props }: SectionLinkProps) {
  const pathname = usePathname()

  return (
    <Link
      {...props}
      href={`/#${section}`}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        // "home" only means "top of this page" on the home page itself. Visibility check: Next keeps
        // previously visited pages mounted but hidden, so the home sections may exist in the DOM here.
        const onThisPage =
          pathname === "/" || (section !== "home" && Boolean(document.getElementById(section)?.checkVisibility()))
        if (onThisPage) {
          event.preventDefault()
          scrollToSection(section)
        }
      }}
    />
  )
}
