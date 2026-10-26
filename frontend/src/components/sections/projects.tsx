import { projects } from "@/data/projects"
import { cn } from "@/lib/utils"
import { BlurFade } from "@/components/ui/blur-fade"
import { SectionHeading } from "@/components/shared/section-heading"
import { ProjectCard } from "@/components/projects/project-card"

/** Projects section: bento grid — the featured project takes a 2×2 tile, the others stack beside it. */
export function Projects() {
  return (
    <section id="projects" className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={2}
          label="Projects"
          title="Selected work"
        />

        <div className="grid auto-rows-[minmax(260px,auto)] gap-4 lg:grid-cols-3">
          {projects.map((project, i) => (
            <BlurFade
              key={project.slug}
              inView
              delay={0.08 * i}
              className={cn(project.featured && "lg:col-span-2 lg:row-span-2")}
            >
              <ProjectCard project={project} />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
