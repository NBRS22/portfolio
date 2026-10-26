import { Cpu } from "lucide-react"

import type { ProjectDeployment } from "@/data/projects"
import { HudCorners } from "@/components/shared/hud-corners"
import { HardwareMeter } from "@/components/projects/hardware-meter"
import { cn } from "@/lib/utils"

type Hardware = ProjectDeployment["hardware"]

/** Hardware panel of a deployment, as two cards side by side: the measured figures on the board, and the robot integration. */
export function HardwarePanels({ hardware }: { hardware: Hardware }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="On the hardware">
        <OnTheHardware hardware={hardware} />
      </Panel>
      <Panel title={hardware.integration.title}>
        <Integration integration={hardware.integration} />
      </Panel>
    </div>
  )
}

/** A titled card, with the title styled like a tab sitting on the card. */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <h3 className="type-label w-fit border-b-2 border-signal pb-3 text-signal">{title}</h3>
      <div className="relative mt-4 flex-1">
        <HudCorners />
        <div className="h-full overflow-hidden rounded-md border bg-card p-6 sm:p-8">{children}</div>
      </div>
    </section>
  )
}

/** The board, the stacks running on it and the measured gauges. */
function OnTheHardware({ hardware }: { hardware: Hardware }) {
  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="border-b pb-5">
        <div className="flex items-center gap-3">
          <Cpu aria-hidden className="size-5 text-signal" />
          <p className="font-mono text-sm font-semibold">{hardware.board}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {hardware.stacks.map((stack) => (
            <div
              key={stack.name}
              className={cn("rounded-md border p-3", stack.highlight ? "border-signal/40 bg-signal/5" : "border-muted-foreground/40 bg-muted-foreground/5")}
            >
              <p className="type-label flex items-center gap-2">
                <span aria-hidden className={cn("size-2 animate-pulse rounded-full", stack.highlight ? "bg-signal" : "bg-muted-foreground")} />
                {stack.name}
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {stack.items.map((item) => (
                  <li key={item} className="rounded-sm border bg-background px-2 py-1 font-mono text-xs">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {hardware.meters.map((meter) => (
        <HardwareMeter key={meter.label} meter={meter} />
      ))}
    </div>
  )
}

/** How each component of the framework was adapted to the robot. */
function Integration({ integration }: { integration: Hardware["integration"] }) {
  return (
    <ol className="space-y-6">
      {integration.components.map((component) => (
        <li key={component.name} className="border-l-2 border-signal pl-4">
          <p className="font-mono text-sm font-semibold">{component.name}</p>
          <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{component.description}</p>
          {component.tools && (
            <ul className="mt-3 space-y-1.5">
              {component.tools.map((tool) => (
                <li key={tool.name} className="flex items-baseline gap-2 text-sm">
                  <span aria-hidden className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-signal" />
                  <span>
                    <span className="font-mono text-xs font-semibold">{tool.name}</span>
                    <span className="text-muted-foreground"> · {tool.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}
