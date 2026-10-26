"use client"

import { ArrowRight } from "lucide-react"

import {
  agentModes,
  composePersonality,
  PERSONALITY_MAX_LENGTH,
  personalityPresets,
  personalitySections,
  type AgentMode,
  type Personality,
  type PersonalitySectionId,
} from "@/data/voice-agent-demo"
import { cn } from "@/lib/utils"
import { OptionCard } from "@/components/voice-agent/studio/option-card"
import { StudioPanel } from "@/components/voice-agent/studio/studio-panel"

/* ------------------------------------------------------------------ Mode */

export function ModePanel({ mode, onChange }: { mode: AgentMode; onChange: (mode: AgentMode) => void }) {
  return (
    <StudioPanel index={1} title="Architecture" description="How the robot turns speech into an answer.">
      <div role="radiogroup" aria-label="Architecture" className="grid gap-3 sm:grid-cols-2">
        {agentModes.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            sublabel={option.description}
            selected={mode === option.id}
            disabled={!option.available}
            onSelect={() => onChange(option.id)}
          >
            <span className="mt-3 flex flex-wrap items-center gap-1.5">
              {option.pipeline.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="size-3 text-muted-foreground" />}
                  <span className="type-label rounded-sm border px-1.5 py-0.5 text-[10px]">{step}</span>
                </span>
              ))}
            </span>
          </OptionCard>
        ))}
      </div>
    </StudioPanel>
  )
}

/* ------------------------------------------------------------- Providers */

export function ProvidersPanel() {
  return (
    <StudioPanel
      index={2}
      title="Models & providers"
      description="Swap the models & the providers behind each step."
      soon
    />
  )
}

/* ----------------------------------------------------------- Personality */

interface PersonalityPanelProps {
  presetId: string | null
  personality: Personality
  onPreset: (presetId: string) => void
  onChange: (section: PersonalitySectionId, value: string) => void
}

/** One field per prompt section; the counter and the limit apply to the prompt sent, tags included. */
export function PersonalityPanel({ presetId, personality, onPreset, onChange }: PersonalityPanelProps) {
  const prompt = composePersonality(personality)
  const remaining = PERSONALITY_MAX_LENGTH - prompt.length

  return (
    <StudioPanel
      index={3}
      title="Personality"
      description="Adapt the robot's personality to its context: start from a preset, then make it yours."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {personalityPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset.id)}
            className={cn(
              "type-label rounded-sm border px-2.5 py-1.5 transition-colors",
              presetId === preset.id ? "border-signal bg-signal/[0.08] text-signal" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {personalitySections.map((section) => {
          const value = personality[section.id]
          const fieldId = `personality-${section.id}`
          return (
            <div key={section.id}>
              <label htmlFor={fieldId} className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs font-semibold text-signal">{section.tag}</span>
                  <span className="text-xs text-muted-foreground">{section.hint}</span>
                </span>
              </label>
              <textarea
                id={fieldId}
                value={value}
                onChange={(event) => onChange(section.id, event.target.value)}
                rows={3}
                // Whatever is left of the shared budget
                maxLength={value.length + Math.max(0, remaining)}
                className="w-full resize-y rounded-sm border bg-background p-3 text-sm leading-relaxed focus-visible:border-signal focus-visible:outline-none"
              />
            </div>
          )
        })}
      </div>

      <p className={cn("type-label mt-2 text-right text-[10px]", remaining < 0 ? "text-signal" : "text-muted-foreground")}>
        {prompt.length} / {PERSONALITY_MAX_LENGTH}
      </p>
    </StudioPanel>
  )
}

/* --------------------------------------------------------------- Actions */

export function ActionsPanel() {
  return (
    <StudioPanel
      index={4}
      title="Actions"
      description="Choose what the robot is allowed to do, and add your own actions."
      soon
    />
  )
}

/* ------------------------------------------------------------ Flow nodes */

export function FlowPanel() {
  return (
    <StudioPanel
      index={6}
      title="Conversation flow"
      description="Design the conversation as a graph of nodes, each with its own instructions and actions."
      soon
    />
  )
}
