import { ArrowDown, ArrowRight } from "lucide-react"

import type { ProjectModule } from "@/data/projects"
import { BlurFade } from "@/components/ui/blur-fade"

/** Architecture diagram: modules linked by arrows (horizontal on desktop, vertical on mobile). */
export function Architecture({ modules }: { modules: ProjectModule[] }) {
  return (
    <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      {modules.map((module, i) => (
        <li key={module.name} className="contents">
          <BlurFade inView delay={0.1 * i} className="flex-1">
            <div className="group h-full rounded-md border bg-card p-5 transition-colors hover:border-signal/50">
              <div className="flex items-center justify-between">
                <span className="type-label text-signal">{String(i + 1).padStart(2, "0")}</span>
                <span className="type-label text-muted-foreground">{module.host}</span>
              </div>
              <p className="mt-6 font-mono text-sm font-semibold">{module.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
            </div>
          </BlurFade>
          {i < modules.length - 1 && (
            <div aria-hidden className="flex justify-center text-signal">
              <ArrowDown className="size-4 lg:hidden" />
              <ArrowRight className="hidden size-4 lg:block" />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
