import Link from "next/link"

import { cn } from "@/lib/utils"
import { SectionLink } from "@/components/shared/section-link"

type Variant = "primary" | "outline"

const variants: Record<Variant, string> = {
  primary: "bg-signal text-signal-foreground hover:brightness-110",
  outline:
    "border border-border bg-background/40 text-foreground backdrop-blur hover:border-signal hover:text-signal dark:border-signal/60 dark:hover:bg-signal dark:hover:text-signal-foreground",
}

/** Shared class names for lab-style buttons (mono, uppercase, sharp corners). */
export function actionClass(variant: Variant = "primary", className?: string) {
  return cn(
    "group/action inline-flex h-11 items-center justify-center gap-2 rounded-sm px-5 font-mono text-xs font-medium tracking-[0.14em] uppercase transition-all",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    variants[variant],
    className
  )
}

interface ActionLinkProps {
  href: string
  variant?: Variant
  className?: string
  children: React.ReactNode
  /** Render a plain <a> (external links, downloads) instead of a Next.js <Link>. */
  external?: boolean
  /** Download the target instead of opening it; a string sets the saved file name. */
  download?: boolean | string
}

/** Lab-style call-to-action link. */
export function ActionLink({ href, variant = "primary", className, children, external, download }: ActionLinkProps) {
  const classes = actionClass(variant, className)
  if (external || download) {
    return (
      <a
        href={href}
        className={classes}
        download={download === true ? "" : download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {children}
      </a>
    )
  }
  // Home page sections ("/#contact"…) scroll without changing the URL
  if (href.startsWith("/#")) {
    return (
      <SectionLink section={href.slice(2)} className={classes}>
        {children}
      </SectionLink>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
