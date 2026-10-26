import { ArrowUpRight } from "lucide-react"

import { siteConfig } from "@/config/site"
import { BlurFade } from "@/components/ui/blur-fade"
import { GlowBackground } from "@/components/shared/glow-background"
import { CopyButton } from "@/components/shared/copy-button"
import { actionClass } from "@/components/shared/action-link"

/** Contact section: oversized call to action, with email, phone, copy button and social links on its right. */
export function Contact() {
  const channels = [
    { href: `mailto:${siteConfig.email}`, label: siteConfig.email },
    { href: siteConfig.phone.href, label: siteConfig.phone.label },
  ]

  return (
    <section id="contact" className="relative overflow-hidden border-t px-6 py-32">
      <GlowBackground />
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center gap-4">
          <span className="type-label text-signal">[06]</span>
          <span className="type-label text-muted-foreground">Contact</span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>

        {/* Headline on the left, contact details on its right from xl */}
        <div className="grid gap-14 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-center xl:gap-10">
          <BlurFade inView>
            <h2 className="type-display text-[clamp(3.5rem,11vw,10rem)] text-balance">
              Let&apos;s build <span className="text-signal">robots</span> together.
            </h2>
          </BlurFade>

          <BlurFade inView delay={0.15}>
            <ul className="border-t">
              {channels.map((channel) => (
                <li key={channel.href} className="border-b">
                  <a href={channel.href} className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-signal">
                    <span className="font-display text-2xl font-medium tracking-tight break-all sm:text-3xl">{channel.label}</span>
                    <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 dark:text-signal" />
                  </a>
                </li>
              ))}
            </ul>

            {/* Buttons sharing the column's width, each on a single line */}
            <div className="mt-6 flex flex-wrap gap-2">
              <CopyButton value={siteConfig.email} label="Copy email" className={actionClass("outline", "flex-auto px-3 whitespace-nowrap")} />
              <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className={actionClass("outline", "flex-auto px-3 whitespace-nowrap")}>
                LinkedIn ↗
              </a>
              <a href={siteConfig.links.github} target="_blank" rel="noreferrer" className={actionClass("outline", "flex-auto px-3 whitespace-nowrap")}>
                GitHub ↗
              </a>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}
