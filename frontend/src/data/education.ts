/** Education, most recent first. Taken from the CV; shown in the About section. */

export interface EducationEntry {
  degree: string
  school: string
  location: string
  period: string
  details: string[]
}

export const education: EducationEntry[] = [
  {
    // "Diplôme d'Études Supérieures"
    degree: "Exchange Year, Generalist Engineering",
    school: "Centrale Lyon",
    location: "Écully, France",
    period: "2025 — 2026",
    details: ["Track: Intelligent Transport", "Specialisation: Entrepreneur & Intrapreneur Engineer"],
  },
  {
    degree: "Master's degree in Electronics, Electrical Energy and Control",
    school: "Centrale Lyon",
    location: "Écully, France",
    period: "2025 — 2026",
    details: ["Track: Electronics and Embedded Systems"],
  },
  {
    degree: "Engineering Degree in Electromechanics",
    school: "Arts et Métiers",
    location: "Meknès, Morocco",
    period: "2021 — 2025",
    details: ["Track: Control and Industrial Management"],
  },
]
