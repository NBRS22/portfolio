import { navItems, siteConfig } from "@/config/site"
import { SectionLink } from "@/components/shared/section-link"

/** Footer: navigation and links in two compact rows, then the oversized name. */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t">
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
        {/* Navigation and links on one row each, side by side from md */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <nav aria-label="Footer">
            <p className="type-label text-muted-foreground">Navigation</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <SectionLink section={item.id} className="text-sm text-muted-foreground transition-colors hover:text-signal">
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:text-right">
            <p className="type-label text-muted-foreground">Contact</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm md:justify-end">
              <li>
                <a href={siteConfig.links.github} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-signal">
                  GitHub ↗
                </a>
              </li>
              <li>
                <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-signal">
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className="text-muted-foreground hover:text-signal">
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a href={siteConfig.phone.href} className="text-muted-foreground hover:text-signal">
                  {siteConfig.phone.label}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p
          aria-hidden
          className="type-display mt-12 text-[clamp(2.5rem,11vw,10rem)] whitespace-nowrap text-foreground/[0.06] select-none"
        >
          {siteConfig.name}
        </p>
        <div className="mt-4 flex flex-col justify-between gap-2 border-t pt-6 sm:flex-row">
          <p className="type-label text-muted-foreground">© {siteConfig.name}</p>
          <p className="type-label text-muted-foreground">Built with Next.js · Deployed on Vercel</p>
        </div>
      </div>
    </footer>
  )
}
