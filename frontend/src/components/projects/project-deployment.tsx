import Image from "next/image"
import { BookOpen, CalendarPlus, CalendarSearch, FileSearch, type LucideIcon, Route, ScanQrCode } from "lucide-react"

import type { FeatureIcon, ProjectDeployment as Deployment } from "@/data/projects"
import { BlurFade } from "@/components/ui/blur-fade"
import { HudCorners } from "@/components/shared/hud-corners"
import { HardwarePanels } from "@/components/projects/hardware-panels"

const featureIcons: Record<FeatureIcon, LucideIcon> = {
  route: Route,
  knowledge: BookOpen,
  qr: ScanQrCode,
  calendar: CalendarSearch,
  booking: CalendarPlus,
  documents: FileSearch,
}

/**
 * Where the project was deployed and tested: the picture next to the story, the robot's features,
 * then two cards side by side: the measured figures on the board, and the robot integration.
 */
export function ProjectDeployment({ deployment }: { deployment: Deployment }) {
  const { image, intro, features, hardware } = deployment

  return (
    <div className="space-y-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,23rem)_1fr] lg:items-stretch xl:gap-16">
        <BlurFade inView>
          <figure className="relative mx-auto flex max-w-xs flex-col gap-3 lg:max-w-none">
            {/* Whole picture at its own ratio, never cropped */}
            <div className="relative">
              <HudCorners />
              {image.src && image.width && image.height && (
                <Image
                  src={image.src}
                  alt={image.caption}
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 1024px) 23rem, 20rem"
                  className="h-auto w-full rounded-md border"
                />
              )}
            </div>
            <figcaption className="text-center text-sm text-pretty text-muted-foreground lg:absolute lg:inset-x-0 lg:top-full lg:mt-3">{image.caption}</figcaption>
          </figure>
        </BlurFade>

        {/* Cards stretch so this column ends with the picture (the caption sits below, out of the flow) */}
        <div className="flex flex-col">
          <BlurFade inView delay={0.1}>
            <p className="max-w-3xl text-xl text-pretty">{intro}</p>
          </BlurFade>

          <h3 className="type-label mt-8 text-signal">What the robot does</h3>
          <ul className="mt-4 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = featureIcons[feature.icon]
              return (
                <li key={feature.title}>
                  <BlurFade inView delay={0.05 * i} className="h-full">
                    <article className="group h-full rounded-md border bg-card p-5 transition-colors hover:border-signal/50">
                      <div className="flex items-center justify-between">
                        <span className="grid size-10 place-items-center rounded-md border border-signal/30 bg-signal/10 text-signal transition-colors group-hover:bg-signal group-hover:text-signal-foreground">
                          <Icon aria-hidden className="size-5" />
                        </span>
                        <span className="type-label text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <h4 className="mt-5 font-display text-lg font-medium tracking-tight">{feature.title}</h4>
                      <p className="mt-2 text-sm text-pretty text-muted-foreground">{feature.description}</p>
                    </article>
                  </BlurFade>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <BlurFade inView>
        <HardwarePanels hardware={hardware} />
      </BlurFade>
    </div>
  )
}
