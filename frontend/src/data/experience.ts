/**
 * Professional experience and leadership, most recent first. Taken from the CV.
 * Education lives in `education.ts` (shown in the About section).
 */

export type ExperienceKind = "work" | "internship" | "leadership"

export const experienceKindLabels: Record<ExperienceKind, string> = {
  work: "Work",
  internship: "Internship",
  leadership: "Leadership",
}

export interface ExperienceEntry {
  kind: ExperienceKind
  role: string
  organization: string
  location: string
  period: string
  achievements: string[]
}

export const experience: ExperienceEntry[] = [
  {
    kind: "internship",
    role: "R&D Engineering Intern — Robotics & Physical AI",
    organization: "Accenture",
    location: "Paris, France",
    period: "Apr 2026 — Sep 2026",
    achievements: [
      "Robotic grasping & manipulation (Production 3, Franka Robotics): training and simulation-based validation of vision-based pick-and-place policies, with sim-to-real transfer.",
      "Robot interaction (Mirokai, Enchanted Tools): design and development of an embedded, modular, robot-agnostic voice agent framework orchestrating human-robot interaction in real time.",
      "Autonomous visual inspection (Spot, Boston Dynamics): design and deployment of an embedded visual perception system on a legged robot in an industrial environment.",
    ],
  },
  {
    kind: "internship",
    role: "R&D Engineering Intern — Industrial Automation & Robotics",
    organization: "Safran",
    location: "Casablanca, Morocco",
    period: "Jun 2025 — Aug 2025",
    achievements: [
      "Integration study for autonomous mobile supply robots (AMR) in an industrial environment.",
      "Design and implementation of an industrial IoT platform for real-time tool tracking, including supervision and automated replenishment.",
    ],
  },
  {
    kind: "leadership",
    role: "President — Robotics Club",
    organization: "Arts et Métiers",
    location: "Meknès, Morocco",
    period: "2024 — 2025",
    achievements: [
      "Team management and supervision of robotics projects.",
      "Organisation of robotics competitions.",
      "Winner of several national robotics competitions.",
    ],
  },
]
