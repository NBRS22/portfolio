import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { detailedProjects, projects } from "@/data/projects"
import { cn } from "@/lib/utils"

/**
 * Previous / next project links at the bottom of a project page. Falls back to "back to projects",
 * and to a "coming soon" teaser of the next upcoming project when there is no next page yet.
 */
export function ProjectPager({ slug }: { slug: string }) {
  const index = detailedProjects.findIndex((project) => project.slug === slug)
  const previous = index > 0 ? detailedProjects[index - 1] : undefined
  const next = index < detailedProjects.length - 1 ? detailedProjects[index + 1] : undefined
  const upcoming = projects.find((project) => project.status === "upcoming")

  return (
    <nav aria-label="Other projects" className="border-t px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2">
        {previous ? (
          <PagerLink href={previous.href!} label="Previous project" title={previous.title} direction="previous" />
        ) : (
          <PagerLink href="/#projects" label="Back to" title="All projects" direction="previous" />
        )}
        {next ? (
          <PagerLink href={next.href!} label="Next project" title={next.title} direction="next" />
        ) : (
          upcoming && <UpcomingTeaser title={upcoming.title} />
        )}
      </div>
    </nav>
  )
}

interface PagerLinkProps {
  href: string
  label: string
  title: string
  direction: "previous" | "next"
}

function PagerLink({ href, label, title, direction }: PagerLinkProps) {
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-5 rounded-md border bg-card p-6 transition-colors hover:border-signal",
        direction === "next" && "flex-row-reverse text-right sm:col-start-2"
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-sm border transition-colors dark:border-signal/60 dark:text-signal group-hover:border-signal group-hover:bg-signal group-hover:text-signal-foreground">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="type-label block text-muted-foreground">{label}</span>
        <span className="type-display mt-2 block text-2xl">{title}</span>
      </span>
    </Link>
  )
}

/** Same layout as a "next" link, but inert: the project isn't published yet. */
function UpcomingTeaser({ title }: { title: string }) {
  return (
    <div
      aria-disabled
      className="flex flex-row-reverse items-center gap-5 rounded-md border border-dashed p-6 text-right sm:col-start-2"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-sm border border-dashed text-muted-foreground">
        <ArrowRight className="size-4" />
      </span>
      <span>
        <span className="type-label block text-muted-foreground">Next project · Coming soon</span>
        <span className="type-display mt-2 block text-2xl text-muted-foreground">{title}</span>
      </span>
    </div>
  )
}
