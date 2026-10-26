"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { FileUser, Menu, X } from "lucide-react"

import { navItems, siteConfig, type SectionId } from "@/config/site"
import { useActiveSection } from "@/hooks/use-active-section"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { GithubIcon, LinkedinIcon } from "@/components/shared/brand-icons"
import { SectionLink } from "@/components/shared/section-link"

const sectionIds = navItems.map((item) => item.id)

/** Bar width at the top of the page, then once scrolled (px). */
const WIDTH_TOP = 1280
const WIDTH_SCROLLED = 1040

/** Shared desktop width of the left (wordmark) and right (actions) blocks — keeps both gaps equal. */
const SIDE_WIDTH = "lg:w-40 xl:w-44"

/**
 * Floating lab-style navigation bar.
 * - At the top of the page: wide and transparent.
 * - On scroll: shrinks into a panel with border and blur.
 * - A red marker slides under the link of the section in view (scrollspy).
 */
export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const spied = useActiveSection(sectionIds, isHome)
  const active: SectionId | null = isHome ? spied : pathname.startsWith("/projects") ? "projects" : null

  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 10))

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <motion.div
        initial={{ opacity: 0, y: -16, maxWidth: WIDTH_TOP }}
        animate={{ opacity: 1, y: 0, maxWidth: scrolled ? WIDTH_SCROLLED : WIDTH_TOP }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "w-full rounded-md border transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          scrolled || menuOpen
            ? "shadow-soft border-border bg-background/80 backdrop-blur-lg"
            : "border-transparent"
        )}
      >
        {/*
          3-column grid: wordmark (left), links (exact centre), actions (right).
          On desktop both side blocks share the same fixed width (SIDE_WIDTH), so the empty
          space on each side of the links is identical.
        */}
        <nav
          className="grid h-14 grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr]"
          aria-label="Main navigation"
        >
          {/* Wordmark: name in the display face, centred above the role */}
          <SectionLink
            section="home"
            className={cn(
              "flex w-fit shrink-0 flex-col items-center justify-self-start text-center leading-none",
              SIDE_WIDTH
            )}
            aria-label={`${siteConfig.name} — home`}
          >
            <span className="font-display text-lg font-semibold tracking-tight">{siteConfig.name}</span>
            {/* Hidden between lg and xl, where the side column is too narrow for it */}
            <span className="type-label mt-1 hidden text-[10px] whitespace-nowrap text-muted-foreground sm:block lg:hidden xl:block">
              {siteConfig.role}
            </span>
          </SectionLink>

          <NavMenu active={active} />

          {/* Actions: GitHub, LinkedIn, CV and theme, spread over the same width as the wordmark */}
          <div className={cn("flex shrink-0 items-center gap-2 justify-self-end lg:justify-between", SIDE_WIDTH)}>
            <SocialLink href={siteConfig.links.github} label="GitHub">
              <GithubIcon className="size-3.5" />
            </SocialLink>
            <SocialLink href={siteConfig.links.linkedin} label="LinkedIn">
              <LinkedinIcon className="size-3.5" />
            </SocialLink>
            <a
              href={siteConfig.cvUrl}
              download={siteConfig.cvFileName}
              aria-label="Download CV"
              title="Download CV"
              className="hidden size-8 place-items-center rounded-sm border text-muted-foreground transition-colors hover:border-signal hover:text-signal lg:grid dark:border-signal/60 dark:text-signal"
            >
              <FileUser className="size-3.5" />
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-8 place-items-center rounded-sm border lg:hidden dark:border-signal/60 dark:text-signal"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-col border-t p-2">
                {navItems.map((item, i) => (
                  <SectionLink
                    key={item.id}
                    section={item.id}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-sm px-3 py-3",
                      active === item.id ? "bg-secondary text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span className="type-label text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="type-label">{item.label}</span>
                  </SectionLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  )
}

/** Desktop links with a red marker that slides under the active item. */
function NavMenu({ active }: { active: SectionId | null }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const element = active ? listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null
    setIndicator(element ? { left: element.offsetLeft, width: element.offsetWidth } : null)
  }, [active])

  return (
    <ul ref={listRef} className="relative hidden h-14 items-center lg:flex">
      {indicator && (
        <motion.li
          aria-hidden
          className="absolute bottom-[-1px] h-0.5 bg-signal"
          initial={false}
          animate={indicator}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        />
      )}
      {navItems.map((item, i) => (
        <li key={item.id} data-id={item.id} className="flex h-full items-center">
          <SectionLink
            section={item.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 transition-colors duration-200",
              active === item.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("type-label", active === item.id ? "text-signal" : "text-muted-foreground/60")}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="type-label">{item.label}</span>
          </SectionLink>
        </li>
      ))}
    </ul>
  )
}

/** Icon link to a social profile, styled like the theme toggle. Desktop only (the hero and footer cover mobile). */
function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="hidden size-8 place-items-center rounded-sm border text-muted-foreground transition-colors hover:border-signal hover:text-signal lg:grid dark:border-signal/60 dark:text-signal"
    >
      {children}
    </a>
  )
}
