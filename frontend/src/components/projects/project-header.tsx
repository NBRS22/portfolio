import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowUpRight, ImageIcon, Play } from "lucide-react"

import { statusLabels, type Project, type ProjectImage } from "@/data/projects"
import { BlurFade } from "@/components/ui/blur-fade"
import { GlowBackground } from "@/components/shared/glow-background"
import { HudCorners } from "@/components/shared/hud-corners"
import { ActionLink } from "@/components/shared/action-link"
import { GithubIcon } from "@/components/shared/brand-icons"
import { RepoUnavailableButton } from "@/components/projects/repo-unavailable-button"

interface ProjectHeaderProps {
  project: Project
  /** Shows a "Try the demo" button that scrolls to the demo block. */
  hasDemo?: boolean
}

/** Top of a project page: back link, status, title, summary, demo + GitHub buttons, stack and links. */
export function ProjectHeader({ project, hasDemo }: ProjectHeaderProps) {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-16">
      <GlowBackground />
      <div className="mx-auto max-w-7xl">
        <BlurFade delay={0.05}>
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <Link
              href="/#projects"
              className="type-label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-signal"
            >
              <ArrowLeft className="size-3.5" />
              All projects
            </Link>
            <span className="type-label inline-flex items-center gap-2 text-muted-foreground">
              {project.status === "in-progress" && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-signal" />}
              {statusLabels[project.status]}
            </span>
          </div>
        </BlurFade>

        {/* Like the home hero: centred text on the left, picture on the right, both the same height */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-stretch lg:gap-16">
          <div className="@container flex flex-col justify-center text-center">
            <BlurFade delay={0.15}>
              <h1 className="type-display text-[min(15cqw,7rem)] text-balance">{project.title}</h1>
            </BlurFade>

            <BlurFade delay={0.25}>
              <p className="mt-6 font-display text-xl font-medium tracking-tight text-pretty sm:text-2xl">
                {project.tagline}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted-foreground">{project.summary}</p>
            </BlurFade>

            <BlurFade delay={0.35}>
              {/* Demo + GitHub buttons and the stack on the same line */}
              <div className="mt-8 flex flex-wrap items-stretch justify-center gap-3">
                {hasDemo && (
                  <ActionLink href="/#demo" className="h-auto min-h-11">
                    <Play className="size-4" />
                    Try the demo
                  </ActionLink>
                )}
                {project.repo === "unavailable" ? (
                  <RepoUnavailableButton className="h-auto min-h-11" />
                ) : (
                  project.repo && (
                    <ActionLink href={project.repo} external className="h-auto min-h-11">
                      <GithubIcon className="size-4" />
                      View on GitHub
                      <ArrowUpRight className="size-4" />
                    </ActionLink>
                  )
                )}
                <dl className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-sm border px-4 py-2.5">
                  <dt className="type-label text-signal">Stack</dt>
                  {project.tags.map((tag) => (
                    <dd key={tag} className="type-label">
                      {tag}
                    </dd>
                  ))}
                </dl>
              </div>

              {project.links && project.links.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-4">
                  {project.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="type-label inline-flex items-center gap-1 hover:text-signal"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </BlurFade>
          </div>

          <BlurFade delay={0.25} direction="up" className="h-full">
            <ProjectCover image={project.cover} />
          </BlurFade>
        </div>
      </div>
    </section>
  )
}

/**
 * Main picture of the project, framed with HUD corners. On desktop it stretches to the height of the
 * text column next to it; on mobile it keeps a 4:5 ratio. Shows a placeholder until the image is added.
 */
function ProjectCover({ image }: { image?: ProjectImage }) {
  return (
    <figure className="h-full">
      <div className="relative h-full">
        <HudCorners />
        <div className="relative aspect-[4/5] h-full min-h-72 overflow-hidden rounded-md border bg-card lg:aspect-auto">
          {image?.src ? (
            <Image
              src={image.src}
              alt={image.caption}
              fill
              preload
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="bg-grid absolute inset-0 grid place-items-center [mask-image:none]">
              <span className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-6" />
                <span className="type-label text-[10px]">Project image coming soon</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </figure>
  )
}
