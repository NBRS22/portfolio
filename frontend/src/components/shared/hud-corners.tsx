import { cn } from "@/lib/utils"

/** Four corner brackets, like a targeting frame on a robot HUD. Place inside a `relative` parent. */
export function HudCorners({ className }: { className?: string }) {
  const corner = "absolute size-3 border-signal"
  return (
    <div aria-hidden className={cn("pointer-events-none absolute -inset-2", className)}>
      <span className={cn(corner, "top-0 left-0 border-t border-l")} />
      <span className={cn(corner, "top-0 right-0 border-t border-r")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "right-0 bottom-0 border-r border-b")} />
    </div>
  )
}
