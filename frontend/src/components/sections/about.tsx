import Image from "next/image"

import { siteConfig } from "@/config/site"
import { aboutBio, aboutPrinciples } from "@/data/about"
import { education } from "@/data/education"
import { BlurFade } from "@/components/ui/blur-fade"
import { SectionHeading } from "@/components/shared/section-heading"
import { HudCorners } from "@/components/shared/hud-corners"
import { ActionLink } from "@/components/shared/action-link"

/** About section: photo, bio, education, languages / soft skills / interests, and CV download. */
export function About() {
  return (
    <section id="about" className="border-t px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading index={3} label="About" title="The human behind the robots" />

        <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
          {/* Portrait, framed like a camera feed, with the bio underneath; centred on mobile */}
          <div className="flex flex-col items-center lg:items-start">
            <BlurFade inView className="relative w-full max-w-[260px]">
              <HudCorners />
              <div className="relative aspect-square overflow-hidden rounded-md border bg-card">
                <Image
                  src={siteConfig.photo.src}
                  width={siteConfig.photo.width}
                  height={siteConfig.photo.height}
                  alt={`Portrait of ${siteConfig.name}`}
                  sizes="260px"
                  className="size-full object-cover"
                />
              </div>
            </BlurFade>

            {/* Bio: greeting, paragraph, then the goal set apart under a signal rule */}
            <BlurFade inView delay={0.1} className="mt-8 max-w-[260px] text-center">
              <p className="font-display text-2xl font-medium tracking-tight">{aboutBio.greeting}</p>
              <p className="mt-3 text-sm text-pretty text-muted-foreground">{aboutBio.text}</p>
              <span aria-hidden className="mx-auto mt-5 block h-px w-10 bg-signal" />
              <p className="type-label mt-5 text-signal">{aboutBio.goal.label}</p>
              <p className="mt-1.5 font-display text-lg font-medium tracking-tight text-balance">{aboutBio.goal.text}</p>
            </BlurFade>
          </div>

          <div className="flex flex-col">
            {/* Education */}
            <BlurFade inView delay={0.15}>
              <div>
                <p className="type-label mb-4 text-muted-foreground">Education</p>
                <ol className="border-t">
                  {education.map((entry) => (
                    <li
                      key={`${entry.degree}-${entry.period}`}
                      className="grid gap-2 border-b py-5 sm:grid-cols-[130px_1fr] sm:gap-6"
                    >
                      <p className="font-mono text-sm text-muted-foreground">{entry.period}</p>
                      <div>
                        <h3 className="font-display text-lg font-medium tracking-tight">{entry.degree}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {entry.school} · {entry.location}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {entry.details.map((detail) => (
                            <li key={detail} className="type-label text-muted-foreground">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </BlurFade>

            {/* The cards grow to end level with the left column */}
            <BlurFade inView delay={0.2} className="mt-12 flex-1">
              <ul className="grid h-full gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3">
                {aboutPrinciples.map((principle, i) => (
                  <li key={principle.title} className="bg-background p-5">
                    <p className="type-label text-signal">{String(i + 1).padStart(2, "0")}</p>
                    <p className="mt-3 font-display text-lg font-medium tracking-tight">{principle.title}</p>
                    <p className="mt-2 text-sm text-pretty text-muted-foreground">{principle.description}</p>
                  </li>
                ))}
              </ul>
            </BlurFade>

            <BlurFade inView delay={0.25} className="mt-6">
              <div className="flex flex-wrap justify-center gap-3">
                <ActionLink href={siteConfig.cvUrl} download={siteConfig.cvFileName}>
                  Download CV
                </ActionLink>
                <ActionLink href="/#contact" variant="outline">
                  Get in touch
                </ActionLink>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>
  )
}
