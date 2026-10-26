import { HashCleaner } from "@/components/layout/hash-cleaner"
import { Hero } from "@/components/sections/hero"
import { Projects } from "@/components/sections/projects"
import { About } from "@/components/sections/about"
import { Experience } from "@/components/sections/experience"
import { Skills } from "@/components/sections/skills"
import { Contact } from "@/components/sections/contact"

/**
 * Home page: a single page, each section has an id used by the navbar (see `navItems`).
 * The URL always stays `/`: section links scroll instead of adding `#section` (see `SectionLink`).
 */
export default function HomePage() {
  return (
    <>
      <HashCleaner />
      <Hero />
      <Projects />
      <About />
      <Experience />
      <Skills />
      <Contact />
    </>
  )
}
