import { experience, experienceKindLabels } from "@/data/experience"
import { BlurFade } from "@/components/ui/blur-fade"
import { SectionHeading } from "@/components/shared/section-heading"

/** Experience section: a "log" of rows — period | role & achievements. Rows light up on hover. */
export function Experience() {
  return (
    <section id="experience" className="border-t px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={4}
          label="Experience"
          title="Where I've been building"
        />

        <ol className="border-t">
          {experience.map((entry, i) => (
            <li key={`${entry.role}-${entry.period}`}>
              <BlurFade inView delay={0.05 * i}>
                <article className="group relative grid gap-4 border-b py-8 transition-colors hover:bg-card/60 md:grid-cols-[200px_1fr] md:gap-8 md:px-4">
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 h-full w-0.5 origin-top scale-y-0 bg-signal transition-transform duration-300 group-hover:scale-y-100"
                  />
                  <div>
                    <p className="font-mono text-sm">{entry.period}</p>
                    <p className="type-label mt-2 text-muted-foreground">
                      {experienceKindLabels[entry.kind]}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-medium tracking-tight">{entry.role}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.organization} · {entry.location}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-pretty text-muted-foreground">
                      {entry.achievements.map((achievement) => {
                        // "Project (robot, company): what I did" → the project part stands out
                        const [, project, details] = achievement.match(/^(.+?\)):\s*(.*)$/) ?? []
                        return (
                          <li key={achievement} className="flex gap-3">
                            <span aria-hidden className="mt-[0.55em] h-px w-3 shrink-0 bg-signal" />
                            <span>
                              {project ? (
                                <>
                                  <span className="font-medium text-foreground">{project}</span>: {details}
                                </>
                              ) : (
                                achievement
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </article>
              </BlurFade>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
