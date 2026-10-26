import { cn } from "@/lib/utils"

/** Decorative background: blueprint grid, a faint signal-red glow and a slow HUD scan line. */
export function GlowBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="bg-grid absolute inset-0" />
      <div className="absolute top-[-25%] right-[-10%] h-[520px] w-[720px] rounded-full bg-signal/[0.07] blur-[140px]" />
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-linear-to-b from-transparent via-foreground/[0.035] to-transparent motion-reduce:hidden" />
    </div>
  )
}
