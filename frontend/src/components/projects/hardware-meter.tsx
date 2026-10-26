"use client"

import { motion } from "motion/react"

import type { HardwareMeter as Meter } from "@/data/projects"
import { Counter } from "@/components/shared/counter"
import { cn } from "@/lib/utils"

/** Stacked gauge that fills when it scrolls into view. The headline value is the total in use. */
export function HardwareMeter({ meter }: { meter: Meter }) {
  const used = meter.segments.reduce((total, segment) => total + segment.value, 0)
  const free = meter.max - used

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-label text-muted-foreground">{meter.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meter.maxLabel}</p>
        </div>
        <p className="shrink-0 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          <Counter value={used} grouped />
          <span className="ml-1 text-lg text-signal">{meter.unit}</span>
        </p>
      </div>

      {/* The unused part is the track itself, a light tint rather than a dark block */}
      <div
        role="img"
        aria-label={`${meter.label}: ${used.toLocaleString("en-US")} of ${meter.maxLabel}`}
        className="mt-3 flex h-2 overflow-hidden rounded-full bg-foreground/10"
      >
        {meter.segments.map((segment, i) => (
          <motion.span
            key={segment.label}
            initial={{ width: 0 }}
            whileInView={{ width: `${(segment.value / meter.max) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 + 0.4 * i, ease: "easeOut" }}
            className={cn("h-full", segment.highlight ? "bg-signal" : "bg-muted-foreground/50")}
          />
        ))}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {meter.segments.length > 1 &&
          meter.segments.map((segment) => (
            <li key={segment.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", segment.highlight ? "bg-signal" : "bg-muted-foreground/50")}
              />
              {segment.label} · {segment.value.toLocaleString("en-US")} {meter.unit}
            </li>
          ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-foreground/15" />
          {free.toLocaleString("en-US")} {meter.unit} margin
        </li>
      </ul>
    </div>
  )
}
