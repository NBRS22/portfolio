"use client"

import { useMemo, useState } from "react"

import {
  buildSessionConfig,
  composePersonality,
  personalityPresets,
  type AgentMode,
  type Personality,
} from "@/data/voice-agent-demo"
import { VoiceDemo } from "@/components/voice-agent/voice-demo"
import { KnowledgePanel } from "@/components/voice-agent/studio/knowledge-panel"
import {
  ActionsPanel,
  FlowPanel,
  ModePanel,
  PersonalityPanel,
  ProvidersPanel,
} from "@/components/voice-agent/studio/studio-panels"

/**
 * Demo studio: the visitor customises the voice agent and talks to the robot, shown side by side.
 * Only the architecture and the personality are live; the other panels are coming soon.
 */
export function DemoStudio() {
  const [mode, setMode] = useState<AgentMode>("end-to-end")
  const [presetId, setPresetId] = useState<string | null>(personalityPresets[0].id)
  const [personality, setPersonality] = useState<Personality>(personalityPresets[0].personality)

  // Only the personality is sent for now, as one prompt made of its sections; the architecture
  // choice stays visual (end-to-end is the default)
  const config = useMemo(() => buildSessionConfig(composePersonality(personality)), [personality])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      {/* Settings */}
      <div className="space-y-4">
        <ModePanel mode={mode} onChange={setMode} />
        <ProvidersPanel />
        <PersonalityPanel
          presetId={presetId}
          personality={personality}
          onPreset={(id) => {
            const preset = personalityPresets.find((p) => p.id === id)
            if (!preset) return
            setPresetId(id)
            setPersonality(preset.personality)
          }}
          onChange={(section, value) => {
            setPersonality((current) => ({ ...current, [section]: value }))
            setPresetId(null)
          }}
        />
        <ActionsPanel />
        <KnowledgePanel />
        {/* Flows rely on tool calls between steps, which the end-to-end model does not offer */}
        {mode === "cascade" && <FlowPanel />}
      </div>

      {/* Live robot, kept in view while scrolling the settings */}
      <div className="lg:sticky lg:top-24">
        <VoiceDemo config={config} />
      </div>
    </div>
  )
}
