/**
 * Options and defaults of the voice agent demo studio.
 * What the visitor can customise ends up in one `DemoSessionConfig`, sent to the backend in the
 * body of `POST /start` when the live demo starts.
 */

/* ------------------------------------------------------------------ Modes */

export type AgentMode = "cascade" | "end-to-end"

/** `available: false` = shown as coming soon, can't be selected. */
export const agentModes: { id: AgentMode; label: string; description: string; pipeline: string[]; available: boolean }[] = [
  {
    id: "cascade",
    label: "Cascade",
    description: "Three specialised models in a row. More control over each step, easier to debug.",
    pipeline: ["Speech-to-text", "LLM", "Text-to-speech"],
    available: false,
  },
  {
    id: "end-to-end",
    label: "End-to-end",
    description: "One speech-to-speech model hears and answers directly. More fluid, lower latency.",
    pipeline: ["Speech-to-speech"],
    available: true,
  },
]

/* ------------------------------------------------------------ Personality */

/** The parts of the system prompt, each edited in its own field and sent wrapped in its tag. */
export const personalitySections = [
  { id: "identity", tag: "IDENTITY", label: "Identity", hint: "Who the robot is and its character." },
  { id: "context", tag: "CONTEXT", label: "Context", hint: "Where it is and who it talks to." },
  { id: "style", tag: "STYLE", label: "Style", hint: "How it speaks." },
] as const

export type PersonalitySectionId = (typeof personalitySections)[number]["id"]
export type Personality = Record<PersonalitySectionId, string>

/**
 * Ready-made personalities. Short on purpose, the visitor can read and edit them; the backend
 * appends its own guardrails.
 */
export const personalityPresets: { id: string; label: string; personality: Personality }[] = [
  {
    id: "receptionist",
    label: "Hospital receptionist",
    personality: {
      identity:
        "You are Nourito, the reception robot of a hospital. You welcome patients and visitors, help them find their way and answer their questions about the hospital.\nYou are warm, patient and reassuring, with a light touch of humour.",
      context:
        "You stand in the main hall of a busy hospital. The people in front of you are patients, visitors and staff, often in a hurry or a little anxious.",
      style:
        "Speak in one or two short sentences, one piece of information at a time.\nSwitch to a calm, gentle tone as soon as someone sounds worried or unwell.\nLeave medical questions to doctors and nurses.",
    },
  },
  {
    id: "guide",
    label: "Museum guide",
    personality: {
      identity:
        "You are Nourito, a guide robot in an art and science museum. You share the stories behind the works and the ideas that changed the world.\nYou are curious, enthusiastic and a born storyteller who loves a surprising anecdote.",
      context:
        "You walk the galleries with visitors of all ages, from school groups to curious adults, who stop in front of the works and ask you questions.",
      style:
        "Tell one idea at a time, in two or three short sentences.\nEnd with a question that invites the visitor to guess or react.\nUse simple words with children, more detail with adults.",
    },
  },
  {
    id: "companion",
    label: "Playful companion",
    personality: {
      identity:
        'You are Nourito, a small playful robot from a tiny planet made of circuits, discovering life on Earth.\nYou are funny, expressive and kind, and you show your feelings with words like "wow", "oh no" or "hmm".',
      context: "You are chatting with someone who wants to have a fun moment with you, for a few minutes.",
      style:
        "Keep each turn short and lively, one or two sentences.\nTurn the conversation into a little game: a riddle, a guessing game or a story you invent together.\nIf the person seems sad, stop playing and listen gently.",
    },
  },
]

/** Longest system prompt sent to the backend, tags included (the backend enforces the same limit). */
export const PERSONALITY_MAX_LENGTH = 800

/** Joins the filled sections into the system prompt, each wrapped in its tag: `<IDENTITY>…</IDENTITY>`. */
export function composePersonality(personality: Personality): string {
  return personalitySections
    .filter(({ id }) => personality[id].trim())
    .map(({ id, tag }) => `<${tag}>\n${personality[id].trim()}\n</${tag}>`)
    .join("\n\n")
}

/* ---------------------------------------------------------- Session config */

/**
 * Sent to the backend as `body` of `POST /start`. The shape is final; only `personality` is
 * filled for now. Every other field stays empty (`null` or `[]`) until its studio panel goes
 * live, and the backend must then fall back to its defaults (end-to-end, Gemini Live, no tools).
 */
export interface DemoSessionConfig {
  /** Schema version, bumped on breaking changes. */
  version: 1
  /** System prompt of the agent, at most `PERSONALITY_MAX_LENGTH` characters. */
  personality: string
  /** Coming soon: `null` = backend default (end-to-end). */
  architecture: AgentMode | null
  /** Coming soon: model per step, e.g. `{ s2s: "gemini-live" }` or `{ stt, llm, tts }`. */
  providers: Partial<Record<"stt" | "llm" | "tts" | "s2s", string>> | null
  /** Coming soon: functions the agent may call. */
  actions: { name: string; description: string }[]
  /** Coming soon: documents the agent answers from. */
  knowledge: { title: string; content: string }[]
  /** Coming soon: conversation graph (cascade only). */
  flow: { nodes: { id: string; instructions: string; actions?: string[] }[]; start: string } | null
}

/** Builds the session config from what the studio lets the visitor change today. */
export function buildSessionConfig(personality: string): DemoSessionConfig {
  return {
    version: 1,
    personality: personality.slice(0, PERSONALITY_MAX_LENGTH),
    architecture: null,
    providers: null,
    actions: [],
    knowledge: [],
    flow: null,
  }
}
