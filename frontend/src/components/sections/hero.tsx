import Image from "next/image"
import { ArrowDownRight, FileUser, MapPin } from "lucide-react"

import { siteConfig } from "@/config/site"
import { BlurFade } from "@/components/ui/blur-fade"
import { GlowBackground } from "@/components/shared/glow-background"
import { LetterReveal } from "@/components/shared/letter-reveal"
import { ScrambleText } from "@/components/shared/scramble-text"
import { TiltCard } from "@/components/shared/tilt-card"
import { ActionLink } from "@/components/shared/action-link"
import { GithubIcon, LinkedinIcon } from "@/components/shared/brand-icons"

/**
 * Home section: name, role, location, one-line pitch and shortcuts on the left; a portrait on the right.
 * The section fills one screen height and its content is vertically centred. The portrait's size
 * follows the screen height so the whole hero always fits on screen.
 *
 * Motion details: letter-by-letter name reveal, decoding role and a 3D tilt
 * portrait with a parallax frame.
 */
export function Hero() {
  const [firstName, ...lastName] = siteConfig.name.split(" ")

  return (
    <section id="home" className="relative flex min-h-dvh flex-col overflow-hidden px-6 pt-24 pb-10 lg:pt-28">
      <GlowBackground />

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          {/* Text: one compact, centred block */}
          <div className="@container order-2 text-center lg:order-1">
            <h1>
              {/*
                "NOUR" centred above "EL BACHARI". The size follows the column width (cqw) so the
                last name stays on one line, and the screen height (dvh) so everything fits on short screens.
              */}
              <span className="type-display mx-auto block w-fit text-[min(19cqw,11dvh)] whitespace-nowrap lg:text-[min(19cqw,15dvh)]">
                <LetterReveal lines={[firstName, lastName.join(" ")]} delay={0.1} />
              </span>
              <BlurFade delay={0.6}>
                <span className="mt-4 flex items-center justify-center gap-2 font-mono text-base font-medium tracking-[0.08em] uppercase sm:text-xl lg:mt-6 lg:text-2xl">
                  <span className="text-muted-foreground">&gt;</span>
                  <ScrambleText text={siteConfig.role} delay={900} className="text-signal" />
                  <span aria-hidden className="inline-block h-[1em] w-[0.55em] animate-pulse bg-signal" />
                </span>
              </BlurFade>
            </h1>

            <BlurFade delay={0.7}>
              <p className="type-label mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="size-3.5 text-signal" />
                {siteConfig.location}
              </p>
            </BlurFade>

            <BlurFade delay={0.8}>
              <p className="mx-auto mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg lg:mt-8 lg:text-xl">
                {siteConfig.description}
              </p>
            </BlurFade>

            {/* Shortcuts */}
            <BlurFade delay={0.9}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:mt-10">
                <ActionLink href="/#projects">
                  Explore projects
                  <ArrowDownRight className="size-4 transition-transform group-hover/action:translate-x-0.5 group-hover/action:translate-y-0.5" />
                </ActionLink>
                <ActionLink href="/#contact">
                  Contact me
                  <ArrowDownRight className="size-4 transition-transform group-hover/action:translate-x-0.5 group-hover/action:translate-y-0.5" />
                </ActionLink>
                {/* Same order as the navbar: GitHub, LinkedIn, CV */}
                <div className="flex items-center gap-2">
                  <IconLink href={siteConfig.links.github} label="GitHub">
                    <GithubIcon className="size-4" />
                  </IconLink>
                  <IconLink href={siteConfig.links.linkedin} label="LinkedIn">
                    <LinkedinIcon className="size-4" />
                  </IconLink>
                  <IconLink href={siteConfig.cvUrl} label="Download CV" download={siteConfig.cvFileName}>
                    <FileUser className="size-4" />
                  </IconLink>
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Portrait: 4:5, sized from the screen height, tilts towards the cursor */}
          <BlurFade
            delay={0.3}
            direction="up"
            className="relative order-1 mx-auto aspect-[4/5] h-[32dvh] lg:order-2 lg:h-[min(62dvh,560px)]"
          >
            <TiltCard
              className="h-full"
              backdrop={<div className="absolute inset-0 translate-x-4 translate-y-4 rounded-md border border-signal/60" />}
            >
              <figure className="relative h-full overflow-hidden rounded-md border bg-card shadow-2xl shadow-black/40">
                <Image
                  src={siteConfig.photo.src}
                  width={siteConfig.photo.width}
                  height={siteConfig.photo.height}
                  alt={`Portrait of ${siteConfig.name}`}
                  sizes="(min-width: 1024px) 450px, 60vw"
                  preload
                  className="size-full object-cover object-[center_15%] transition-transform duration-700 group-hover/tilt:scale-[1.04]"
                />
              </figure>
            </TiltCard>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}

interface IconLinkProps {
  href: string
  label: string
  /** File name to download the target as (e.g. the CV) instead of opening it in a new tab. */
  download?: string
  children: React.ReactNode
}

/** Square icon-only shortcut (external profile, or a file download). */
function IconLink({ href, label, download, children }: IconLinkProps) {
  return (
    <a
      href={href}
      {...(download ? { download } : { target: "_blank", rel: "noreferrer" })}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-sm border text-muted-foreground transition-colors hover:border-signal hover:text-signal dark:border-signal/60 dark:text-signal dark:hover:bg-signal dark:hover:text-signal-foreground"
    >
      {children}
    </a>
  )
}
