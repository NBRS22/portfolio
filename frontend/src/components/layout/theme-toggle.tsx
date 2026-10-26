"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dark / light switch.
 * Icons swap via CSS (`dark:` variant), so the server render is correct without waiting for hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "relative grid size-8 place-items-center rounded-sm border text-muted-foreground transition-colors hover:border-signal hover:text-signal dark:border-signal/60 dark:text-signal",
        className
      )}
      aria-label="Toggle light and dark mode"
    >
      <Sun className="size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
      <Moon className="absolute size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
    </button>
  )
}
