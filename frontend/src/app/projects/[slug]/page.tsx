import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { detailedProjects, getProject } from "@/data/projects"
import { BlurFade } from "@/components/ui/blur-fade"
import { ProjectHeader } from "@/components/projects/project-header"
import { DetailSection } from "@/components/projects/detail-section"
import { Architecture } from "@/components/projects/architecture"
import { LayeredArchitecture } from "@/components/projects/layered-architecture"
import { ProjectDeployment } from "@/components/projects/project-deployment"
import { ProjectPager } from "@/components/projects/project-pager"
import { getProjectDemo } from "@/components/projects/project-demo"

/** One static page per project that has a detail page. */
export async function generateStaticParams() {
  return detailedProjects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  return project ? { title: project.title, description: project.summary } : {}
}

/**
 * Every known project page is fully prerendered (see `generateStaticParams`), so reading the slug at
 * the top level never blocks in practice — and it lets unknown slugs return a real 404 status.
 * Opting out of instant validation silences the dev-only "URL data outside Suspense" insight.
 */
export const instant = false

/**
 * Shared project page template:
 * header → context → architecture → deployment → demo → pager.
 * Every block is optional and only rendered when the project data provides it.
 */
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project?.href) notFound()

  const demo = getProjectDemo(project.slug)
  let section = 0

  return (
    <>
      <ProjectHeader project={project} hasDemo={Boolean(demo)} />

      {project.context && (
        <DetailSection index={++section} title="Context" description="The problem it solves">
          <ol className="grid gap-4 md:grid-cols-2">
            {project.context.map((item, i) => (
              <li key={item.title}>
                <BlurFade inView delay={0.06 * i} className="h-full">
                  <article className="group relative h-full overflow-hidden rounded-md border bg-card p-6 transition-colors hover:border-signal/50 sm:p-8">
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 h-full w-0.5 origin-top scale-y-0 bg-signal transition-transform duration-300 group-hover:scale-y-100"
                    />
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="font-display text-xl font-medium tracking-tight">{item.title}</h3>
                    </div>
                    <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{item.text}</p>
                  </article>
                </BlurFade>
              </li>
            ))}
          </ol>
        </DetailSection>
      )}

      {project.architecture && (
        <DetailSection
          index={++section}
          title="Architecture"
          description={project.architecture.title}
        >
          {project.architecture.description && (
            <p className="-mt-4 mb-10 max-w-2xl text-lg text-pretty text-muted-foreground">
              {project.architecture.description}
            </p>
          )}
          {project.architecture.layered && <LayeredArchitecture diagram={project.architecture.layered} />}
          {project.architecture.modules && <Architecture modules={project.architecture.modules} />}
        </DetailSection>
      )}

      {project.deployment && (
        <DetailSection index={++section} title="Deployment" description={project.deployment.title}>
          <ProjectDeployment deployment={project.deployment} />
        </DetailSection>
      )}

      {demo && (
        <DetailSection index={++section} id="demo" title="Live Demo" description="Build your own agent, then talk to it">
          {demo}
        </DetailSection>
      )}

      <ProjectPager slug={project.slug} />
    </>
  )
}
