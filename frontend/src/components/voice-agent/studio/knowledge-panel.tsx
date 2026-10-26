import { StudioPanel } from "@/components/voice-agent/studio/studio-panel"

export function KnowledgePanel() {
  return (
    <StudioPanel
      index={5}
      title="Knowledge base"
      description="Connect the robot to a knowledge base, so it answers from facts, without hallucinations or unwanted answers."
      soon
    />
  )
}
