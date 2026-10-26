import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { getProject } from "@/data/projects"
import { skillGroups } from "@/data/skills"
import { BlurFade } from "@/components/ui/blur-fade"
import { SectionHeading } from "@/components/shared/section-heading"

/** Skills section: a grid of domain "modules"; each skill links to the projects where it was used. */
export function Skills() {
  return (
    <section id="skills" className="border-t px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={5}
          label="Skills"
          title="What I work with"
        />

        <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <BlurFade key={group.domain} inView delay={0.04 * i} className="bg-background">
              <article className="group h-full p-6 transition-colors hover:bg-card sm:p-8">
                <h3 className="type-display text-3xl">{group.domain}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {group.skills.map((skill) => (
                    <li key={skill.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className="size-1 rounded-full bg-muted-foreground/60 dark:bg-signal" />
                        {skill.name}
                      </span>
                      <SkillProjects slugs={skill.projects} />
                    </li>
                  ))}
                </ul>
              </article>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Small links to the projects that use a skill. */
function SkillProjects({ slugs }: { slugs?: string[] }) {
  if (!slugs?.length) return null
  return (
    <span className="flex shrink-0 gap-1">
      {slugs.map((slug) => {
        const project = getProject(slug)
        if (!project?.href) return null
        return (
          <Link
            key={slug}
            href={project.href}
            title={`Used in ${project.title}`}
            className="group/project inline-flex items-center gap-0.5 rounded-full border border-signal/30 bg-signal/10 py-0.5 pr-1.5 pl-2 font-mono text-[10px] leading-none whitespace-nowrap text-signal transition-colors hover:border-signal hover:bg-signal hover:text-signal-foreground"
          >
            {project.title.split(" — ")[0]}
            <ArrowUpRight
              aria-hidden
              className="size-3 transition-transform group-hover/project:translate-x-px group-hover/project:-translate-y-px"
            />
          </Link>
        )
      })}
    </span>
  )
}
