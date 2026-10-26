import { GlowBackground } from "@/components/shared/glow-background"
import { HudCorners } from "@/components/shared/hud-corners"
import { ActionLink } from "@/components/shared/action-link"
import { RobotFace } from "@/components/robot/robot-face"

/** 404 page, in the robot theme. */
export default function NotFound() {
  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden px-6 py-32">
      <GlowBackground />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="type-label text-signal">Error 404 · Route not found</p>
          <h1 className="type-display mt-6 text-[clamp(4rem,12vw,10rem)]">Robot lost.</h1>
          <p className="mt-6 max-w-md text-lg text-pretty text-muted-foreground">
            This page doesn&apos;t exist, or it has wandered off the map.
          </p>
          <ActionLink href="/" className="mt-10">
            Return to base
          </ActionLink>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <HudCorners />
          <div className="flex justify-center rounded-md border bg-card p-8">
            <RobotFace />
          </div>
        </div>
      </div>
    </section>
  )
}
