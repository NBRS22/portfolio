import { cn } from "@/lib/utils"

interface StudioPanelProps {
  index: number
  title: string
  description?: string
  /** Shown greyed out with a "Coming soon" badge. */
  soon?: boolean
  className?: string
  /** Optional: a "soon" panel can be just its title and description. */
  children?: React.ReactNode
}

/** One numbered block of the demo studio ("01 Architecture", "02 Providers"…). */
export function StudioPanel({ index, title, description, soon, className, children }: StudioPanelProps) {
  return (
    <section className={cn("rounded-md border bg-card p-5 sm:p-6", soon && "border-dashed bg-transparent", className)}>
      <header className={cn("flex items-start justify-between gap-4", children && "mb-5")}>
        <div>
          <p className="type-label text-signal">{String(index).padStart(2, "0")}</p>
          <h3 className="mt-2 font-display text-xl font-medium tracking-tight">{title}</h3>
          {description && <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>}
        </div>
        {soon && <SoonBadge />}
      </header>
      {children && (
        <div className={cn(soon && "pointer-events-none opacity-50 select-none")} aria-disabled={soon || undefined}>
          {children}
        </div>
      )}
    </section>
  )
}

export function SoonBadge({ className }: { className?: string }) {
  return (
    <span className={cn("type-label shrink-0 rounded-sm border px-2 py-0.5 text-[10px] text-muted-foreground", className)}>
      Coming soon
    </span>
  )
}
