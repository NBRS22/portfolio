import { cn } from "@/lib/utils"
import { BlurFade } from "@/components/ui/blur-fade"

interface SectionHeadingProps {
  /** Section number, shown as [01]. */
  index: number
  label: string
  title: string
  description?: string
  className?: string
}

/**
 * Lab-style section heading:
 * [01] — LABEL ───────────────
 * OVERSIZED TITLE           description
 */
export function SectionHeading({ index, label, title, description, className }: SectionHeadingProps) {
  return (
    <BlurFade inView className={cn("mb-14", className)}>
      <div className="mb-8 flex items-center gap-4">
        <span className="type-label text-signal">[{String(index).padStart(2, "0")}]</span>
        <span className="type-label text-muted-foreground">{label}</span>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      <div className="grid items-end gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Without a description, the title gets the full width */}
        <h2 className={cn("type-display text-5xl text-balance sm:text-7xl", !description && "lg:col-span-2")}>
          {title}
        </h2>
        {description && <p className="max-w-md text-pretty text-muted-foreground lg:justify-self-end">{description}</p>}
      </div>
    </BlurFade>
  )
}
