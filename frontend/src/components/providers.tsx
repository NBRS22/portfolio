"use client"

import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"

/**
 * Global client-side providers.
 * - Dark/light theme (`.dark` class on <html>), dark by default, choice remembered.
 * - Animations respect the OS "reduce motion" setting.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  )
}
