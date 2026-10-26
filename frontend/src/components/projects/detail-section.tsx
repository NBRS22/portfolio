import { BlurFade } from "@/components/ui/blur-fade"

interface DetailSectionProps {
  index: number
  title: string
  description?: string
  /** HTML id, so the section can be linked to (e.g. "demo"). */
  id?: string
  children: React.ReactNode
}

/** Numbered block of a project page: "[01] CONTEXT ────" then a heading line and the content. */
export function DetailSection({ index, title, description, id, children }: DetailSectionProps) {
  return (
    <section id={id} className="border-t px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <BlurFade inView className="mb-10">
          <div className="flex items-center gap-4">
            <span className="type-label text-signal">[{String(index).padStart(2, "0")}]</span>
            <span className="type-label text-muted-foreground">{title}</span>
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>
          {description && (
            <p className="type-display mt-8 text-3xl text-balance sm:text-5xl">{description}</p>
          )}
        </BlurFade>
        {children}
      </div>
    </section>
  )
}
