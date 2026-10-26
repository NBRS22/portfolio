"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Lock } from "lucide-react"

import { actionClass } from "@/components/shared/action-link"
import { GithubIcon } from "@/components/shared/brand-icons"

/** "View on GitHub" for a repository that is not public yet: a click shows a short notice instead. */
export function RepoUnavailableButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  // The notice closes by itself after a moment
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setOpen(false), 2500)
    return () => clearTimeout(timer)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-describedby={open ? "repo-unavailable" : undefined}
        className={actionClass("primary", className)}
      >
        <GithubIcon className="size-4" />
        View on GitHub
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="repo-unavailable"
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 z-20 mt-2 flex -translate-x-1/2 items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs whitespace-nowrap shadow-xl"
          >
            <Lock aria-hidden className="size-3.5 text-signal" />
            Not available yet
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
