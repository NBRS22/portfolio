"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { statusLabels, type Project } from "@/data/projects"
import { cn } from "@/lib/utils"
import { BorderBeam } from "@/components/ui/border-beam"

/**
 * Bento project tile with a signal-red spotlight that follows the mouse.
 * The featured project gets an animated border, its cover picture beside the text and its key figures.
 */
export function ProjectCard({ project }: { project: Project }) {
  const mouseX = useMotionValue(-300)
  const mouseY = useMotionValue(-300)
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, color-mix(in oklch, var(--signal) 10%, transparent), transparent 75%)`

  const upcoming = project.status === "upcoming"
  const cover = project.featured && project.cover?.src ? project.cover : null

  const content = (
    <article
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        mouseX.set(event.clientX - rect.left)
        mouseY.set(event.clientY - rect.top)
      }}
      className={cn(
        "group relative h-full overflow-hidden rounded-md border transition-colors duration-300",
        upcoming ? "border-dashed bg-transparent" : "bg-card hover:border-signal/50",
        cover && "grid sm:grid-cols-[minmax(0,1fr)_minmax(0,40%)]"
      )}
    >
      {!upcoming && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight }}
        />
      )}
      {project.featured && <BorderBeam size={160} duration={9} colorFrom="var(--signal)" colorTo="transparent" />}

      {/* Cover: above the text on mobile, as a right-hand panel from sm up */}
      {cover?.src && (
        <div className="relative aspect-[4/3] overflow-hidden border-b sm:order-last sm:aspect-auto sm:border-b-0 sm:border-l">
          <Image
            src={cover.src}
            alt={cover.caption}
            fill
            sizes="(min-width: 1024px) 34vw, (min-width: 640px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
          <p className="absolute inset-x-4 bottom-3 text-center text-xs text-pretty text-white/85">{cover.caption}</p>
        </div>
      )}

      <div className="relative flex h-full flex-col p-6 sm:p-8">
        {/* Top row: status, arrow */}
        <div className="flex items-start justify-between">
          <span className="type-label inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-muted-foreground">
            {project.status === "in-progress" && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-signal" />}
            {statusLabels[project.status]}
          </span>
          {project.href && (
            <span className="grid size-10 place-items-center rounded-sm border transition-colors dark:border-signal/60 dark:text-signal group-hover:border-signal group-hover:bg-signal group-hover:text-signal-foreground">
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          )}
        </div>

        {/* Title and details */}
        <div className="mt-auto pt-10">
          <h3
            className={cn(
              "type-display text-balance",
              project.featured ? "text-4xl sm:text-5xl xl:text-6xl" : "text-2xl text-muted-foreground"
            )}
          >
            {project.title}
          </h3>
          <p className="mt-3 font-medium text-pretty">{project.tagline}</p>
          {project.featured && (
            <p className="mt-3 max-w-xl text-sm text-pretty text-muted-foreground">{project.teaser ?? project.summary}</p>
          )}
        </div>

        {/*
         * Same "Stack" box as the project page header, kept on one line: slightly tighter labels
         * (`!` beats .type-label's own size and tracking), scrolling sideways if still too narrow.
         */}
        {project.tags.length > 0 && (
          <dl className="mt-6 flex max-w-full items-center gap-x-3 self-start overflow-x-auto rounded-sm border px-3 py-2.5 whitespace-nowrap [scrollbar-width:none]">
            <dt className="type-label text-[10px]! tracking-[0.1em]! text-signal">Stack</dt>
            {project.tags.map((tag) => (
              <dd key={tag} className="type-label text-[10px]! tracking-[0.1em]!">
                {tag}
              </dd>
            ))}
          </dl>
        )}
      </div>
    </article>
  )

  return project.href ? (
    <Link
      href={project.href}
      className="block h-full rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {content}
    </Link>
  ) : (
    content
  )
}
