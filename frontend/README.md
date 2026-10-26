# Portfolio — Frontend

Single-page portfolio (Home, Projects, About, Experience, Skills, Contact) with a dedicated page per project. V1: English only, "robotics lab" design (near-black, signal red, Space Grotesk display type), dark theme by default with a light mode toggle.

## Stack

| Tech | Role |
|---|---|
| [Next.js 16](https://nextjs.org) (App Router, Cache Components) + TypeScript | Framework |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | Component registry (CLI) used to install Magic UI components |
| [Magic UI](https://magicui.design) | Animated components (`BlurFade`, `BorderBeam`) |
| [Motion](https://motion.dev) | Animations |
| [next-themes](https://github.com/pacocoursey/next-themes) | Light / dark mode |
| [Vercel Analytics](https://vercel.com/docs/analytics) | Visitor analytics (active once deployed) |

## Run locally

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_VOICE_API_URL: the voice backend (local or Cloud Run)
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_VOICE_API_URL` | Public URL of the voice backend (`backend/voice_agent`). Defaults to `http://localhost:7860`. |
| `NEXT_PUBLIC_SITE_URL` | Optional. Public URL for social previews; on Vercel the production domain is used by default. |

## Structure

```
src/
├── app/
│   ├── layout.tsx                 # Global layout: fonts, metadata, providers, navbar, footer, analytics
│   ├── page.tsx                   # Single page: Hero → Projects → About → Experience → Skills → Contact
│   ├── projects/[slug]/page.tsx   # Shared project page template (one static page per project)
│   ├── not-found.tsx              # 404 page ("Robot lost")
│   ├── opengraph-image.tsx        # Social preview image, generated at build time
│   └── globals.css                # Theme (colors, radii) and utilities
├── components/
│   ├── layout/                    # Navbar (floating, scrollspy), theme toggle, footer
│   ├── sections/                  # Home page sections
│   ├── projects/                  # Project card + project page blocks (header, sections, architecture, pager, demos)
│   ├── voice-agent/               # Live demo: configuration panels and the Pipecat voice client
│   ├── robot/                     # Nourito, the animated robot (eyes follow the cursor, mouth follows the voice)
│   ├── shared/                    # Reusable pieces (headings, backgrounds, HUD corners, scramble text,
│   │                              #   counters, copy button, brand icons, action links)
│   ├── providers.tsx              # Theme + Motion providers
│   └── ui/                        # shadcn/ui + Magic UI (generated, editable)
├── config/site.ts                 # Identity, links, CV & photo paths, navigation entries
├── data/
│   ├── projects.ts                # Projects and their detail page content
│   ├── about.ts                   # Bio and facts
│   ├── experience.ts              # Internships and leadership
│   ├── education.ts               # Degrees (shown in About)
│   ├── skills.ts                  # Skills by domain, linked to projects
│   └── voice-agent-demo.ts        # Live demo presets and the session config sent to the backend
├── hooks/                         # React hooks (active section)
└── lib/utils.ts                   # `cn` helper
```

## Editing content

- **Name, role, email, phone, links** → `src/config/site.ts` (the site URL comes from the environment)
- **CV & photo** → `public/home/` (`CV_Nour_EL_Bachari.pdf`, `Photo_Nour_EL_Bachari.jpg`), referenced by `cvUrl` and `photo` in `src/config/site.ts`
- **Bio, experience, skills** → `src/data/about.ts`, `experience.ts`, `skills.ts`
- **Projects** → `src/data/projects.ts` (one object per project; blocks of the detail page are optional)
- **Colors** → `:root` (light) and `.dark` (dark) blocks in `src/app/globals.css`

## Adding a project page

1. Add an entry with an `href: "/projects/<slug>"` in `src/data/projects.ts` and fill the blocks you need
   (`context`, `architecture`, `deployment`).
2. Optional: build an interactive demo and register it in `src/components/projects/project-demo.tsx`.

The page is generated automatically from the shared template.

## Adding a home page section

1. Create `src/components/sections/<name>.tsx` with a `<section id="<id>">`.
2. Add it to `src/app/page.tsx`.
3. Add `{ id: "<id>", label: "…" }` to `navItems` (`src/config/site.ts`) — the navbar picks it up automatically.

Links to a section go through `SectionLink` (`src/components/shared/section-link.tsx`): the home page URL always stays `/`
(no `#section`). Only project detail pages have their own URL (`/projects/<slug>`).

## Adding a component

```bash
npx shadcn@latest add <component>                           # shadcn/ui
npx shadcn@latest add "https://magicui.design/r/<name>.json" # Magic UI
```

## Deploy on Vercel

Import the repository, set **Root Directory** to `frontend`, add `NEXT_PUBLIC_VOICE_API_URL` (the Cloud Run URL)
and deploy. Then add the Vercel domain to the backend's `PIPECAT_ALLOWED_ORIGINS`. See the root `README.md`.

## Next steps

- Live demo: models & providers, actions, knowledge base and conversation flow (shown as "Coming soon")
- French version (i18n)
