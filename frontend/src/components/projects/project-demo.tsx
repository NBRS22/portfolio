import type { ReactNode } from "react"

import { DemoStudio } from "@/components/voice-agent/studio/demo-studio"

/**
 * Interactive demo per project slug. A project without an entry here simply has no demo block.
 * To add one: build the component, then register it below.
 */
const demos: Record<string, ReactNode> = {
  "robot-interaction": <DemoStudio />,
}

export function getProjectDemo(slug: string): ReactNode | undefined {
  return demos[slug]
}
