"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

/** Copies `value` to the clipboard and briefly shows a confirmation. */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  // The confirmation goes away by itself; the timer is cleared if the button unmounts first
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard unavailable (e.g. insecure context): the mailto link remains as a fallback.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={copied ? "Copied" : label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "check" : "copy"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Copied!" : label}
    </button>
  )
}
