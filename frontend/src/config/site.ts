/**
 * Global site information: identity, links, navigation.
 */

/** CV file in `public/`. The downloaded file keeps this exact name. */
const CV_PATH = "/home/CV_Nour_EL_Bachari.pdf"

export const siteConfig = {
  name: "Nour El Bachari",
  role: "Robotics & AI Engineer",
  description:
    "From motors to models, I build robots that see, move and talk.",
  location: "Paris, France",
  email: "n.elbachari@gmail.com",
  /** Shown spaced out, dialled in E.164. */
  phone: { label: "+33 7 46 49 89 39", href: "tel:+33746498939" },
  /**
   * Public URL of the deployed site (used for absolute links and social previews). Set
   * NEXT_PUBLIC_SITE_URL for a custom domain; otherwise Vercel's production domain, then localhost.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  cvUrl: CV_PATH,
  /** Name the CV gets when downloaded — derived from the file itself, so both always match. */
  cvFileName: CV_PATH.split("/").pop()!,
  /** Large portrait (hero, About). */
  photo: { src: "/home/Photo_Nour_EL_Bachari.jpg", width: 800, height: 800 },
  links: {
    github: "https://github.com/NBRS22",
    linkedin: "https://www.linkedin.com/in/nour-el-bachari",
  },
} as const

/** Navbar entries, in page order. `id` = HTML id of the section on the home page. */
export const navItems = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const

export type SectionId = (typeof navItems)[number]["id"]
