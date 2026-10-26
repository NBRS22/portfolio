import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface OptionCardProps {
  label: string
  sublabel?: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children?: React.ReactNode
}

/** Selectable card used as a radio option. Disabled options show "Coming soon" and can't be picked. */
export function OptionCard({ label, sublabel, selected, disabled, onSelect, children }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex w-full flex-col items-start rounded-sm border p-3 text-left transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "border-signal bg-signal/[0.06]" : "hover:border-foreground/30",
        disabled && "cursor-not-allowed border-dashed opacity-45 hover:border-border"
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-medium">{label}</span>
        {selected && (
          <span className="grid size-4 place-items-center rounded-full bg-signal text-signal-foreground">
            <Check className="size-3" />
          </span>
        )}
        {disabled && <span className="type-label shrink-0 text-[10px] text-muted-foreground">Coming soon</span>}
      </span>
      {sublabel && <span className="mt-0.5 text-xs text-muted-foreground">{sublabel}</span>}
      {children}
    </button>
  )
}
