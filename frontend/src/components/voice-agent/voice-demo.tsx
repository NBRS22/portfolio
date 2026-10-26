"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue } from "motion/react"
import { PipecatClient } from "@pipecat-ai/client-js"
import { ProtobufFrameSerializer, WebSocketTransport } from "@pipecat-ai/websocket-transport"
import { Loader2, Mic, Square } from "lucide-react"

import type { DemoSessionConfig } from "@/data/voice-agent-demo"
import { cn } from "@/lib/utils"
import { BorderBeam } from "@/components/ui/border-beam"
import { HudCorners } from "@/components/shared/hud-corners"
import { RobotFace } from "@/components/robot/robot-face"

/** Voice backend (`backend/voice_agent`). Only its public URL is needed: no API key on the client. */
const API_URL = process.env.NEXT_PUBLIC_VOICE_API_URL ?? "http://localhost:7860"

/** Messages for the `POST /start` refusals of the backend's guards. */
const startErrors: Record<number, string> = {
  400: "The agent refused this configuration.",
  429: "You've reached today's conversation limit. Try again tomorrow.",
  503: "Someone is already talking to the agent. Try again in a few minutes.",
}

/** Session lifecycle. `listening` / `thinking` / `speaking` only happen while connected. */
type Status = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error"

/** One line of the transcript. User and robot lines are updated while they stream (`final: false`). */
interface Entry {
  id: number
  role: "user" | "robot"
  text: string
  final: boolean
}

const hints: Record<Status, string> = {
  idle: "Press to start a new conversation.",
  connecting: "Connecting to the agent…",
  listening: "Listening. Press to end the conversation.",
  thinking: "Thinking. Press to end the conversation.",
  speaking: "Speaking. Press to end the conversation.",
  error: "The conversation couldn't start.",
}

/**
 * Voice demo widget: the robot, and a live transcript of what it hears and says. `start()` sends the Playground config to the backend (`POST /start`), then a
 * Pipecat client streams the microphone over WebSocket; its callbacks drive the state below.
 */
export function VoiceDemo({ config }: { config: DemoSessionConfig }) {
  const [status, setStatus] = useState<Status>("idle")
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)
  const nextId = useRef(0)
  const transcriptRef = useRef<HTMLOListElement>(null)
  const clientRef = useRef<PipecatClient | null>(null)
  // Bumped by every start/stop, so a start still in flight knows it was cancelled
  const attemptRef = useRef(0)
  // Text of the robot's current reply, streamed in chunks until it stops speaking
  const botText = useRef("")
  // Bot output segments already shown: the backend reports each one more than once
  const seenSegments = useRef(new Set<number>())
  // Live level of the robot's voice (0–1): the robot's mouth opens with it
  const botLevel = useMotionValue(0)

  // End the conversation when the widget unmounts
  useEffect(() => {
    const attempts = attemptRef
    const clients = clientRef
    return () => {
      attempts.current++
      void clients.current?.disconnect()
    }
  }, [])

  // Keep the latest line in view
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" })
  }, [entries])

  /* State helpers, called from the transport callbacks */

  /** Adds a line, or updates the last one of `role` while it is still streaming (interim transcripts). */
  function upsertLine(role: "user" | "robot", text: string, final: boolean) {
    setEntries((list) => {
      const last = list.at(-1)
      if (last && last.role === role && !last.final) return [...list.slice(0, -1), { ...last, text, final }]
      // Speech-to-speech models transcribe the visitor while already replying: keep the visitor's
      // line before the reply it triggered
      if (role === "user" && last?.role === "robot" && !last.final) {
        const before = list.at(-2)
        if (before?.role === "user" && !before.final) {
          return [...list.slice(0, -2), { ...before, text, final }, last]
        }
        return [...list.slice(0, -1), { id: ++nextId.current, role, text, final }, last]
      }
      return [...list, { id: ++nextId.current, role, text, final }]
    })
  }

  /** Marks the robot's reply as complete. */
  function finishReply() {
    if (botText.current) upsertLine("robot", botText.current.trim(), true)
    botText.current = ""
  }

  function fail(message: string) {
    setStatus("error")
    setError(message)
  }

  function reset() {
    botLevel.set(0)
    setStatus("idle")
  }

  /* Session */

  async function start() {
    const attempt = ++attemptRef.current
    // A fatal error can leave the previous client connected: close it, or the backend would see
    // its session still running and refuse this one as busy
    const previous = clientRef.current
    clientRef.current = null
    if (previous) await previous.disconnect().catch(() => {})
    setEntries([])
    setError(null)
    setStatus("connecting")
    botText.current = ""
    seenSegments.current.clear()

    // 1. Ask the backend for a session, with the Playground config (personality, ...)
    let session: { wsUrl: string; token: string }
    try {
      const response = await fetch(`${API_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transport: "websocket", body: config }),
      })
      if (!response.ok) {
        if (attempt === attemptRef.current) {
          fail(startErrors[response.status] ?? "The agent couldn't start. Try again later.")
        }
        return
      }
      session = await response.json()
    } catch {
      if (attempt === attemptRef.current) fail("The agent is unavailable right now. Try again later.")
      return
    }
    if (attempt !== attemptRef.current) return

    // 2. Stream the microphone to the agent and follow the conversation
    const client = new PipecatClient({
      transport: new WebSocketTransport({ serializer: new ProtobufFrameSerializer() }),
      enableMic: true,
      enableCam: false,
      callbacks: {
        onBotReady: () => setStatus("listening"),
        onUserStartedSpeaking: () => setStatus("listening"),
        onUserStoppedSpeaking: () => setStatus("thinking"),
        onBotStartedSpeaking: () => setStatus("speaking"),
        onBotStoppedSpeaking: () => {
          botLevel.set(0)
          setStatus("listening")
          finishReply()
        },
        // The transport samples the played audio every 100 ms; its average spectrum is quiet, so boost it
        onRemoteAudioLevel: (level) => botLevel.set(Math.min(1, level * 4)),
        onUserTranscript: (data) => {
          if (data.text.trim()) upsertLine("user", data.text.trim(), data.final)
        },
        onBotOutput: (data) => {
          if (data.segment_id !== undefined) {
            if (seenSegments.current.has(data.segment_id)) return
            seenSegments.current.add(data.segment_id)
          } else if (data.spoken === false) {
            return // Protocol 1.x: the same text comes again once spoken
          }
          botText.current += data.text
          upsertLine("robot", botText.current.trim(), false)
        },
        onError: (message) => {
          const data = message.data as { error?: string; fatal?: boolean } | undefined
          if (data?.fatal) fail("The conversation stopped because of an error. Try again later.")
        },
        // The backend ends the session after a few minutes, or on our disconnect()
        onDisconnected: () => {
          if (clientRef.current !== client) return
          clientRef.current = null
          finishReply()
          botLevel.set(0)
          setStatus((value) => (value === "error" ? value : "idle"))
        },
      },
    })
    clientRef.current = client

    try {
      await client.connect({ wsUrl: session.wsUrl, token: session.token })
    } catch (e) {
      if (clientRef.current === client) clientRef.current = null
      void client.disconnect()
      if (attempt !== attemptRef.current) return
      const micDenied = e instanceof Error && e.name === "NotAllowedError"
      fail(micDenied ? "Allow the microphone to talk to the agent." : "Couldn't connect to the agent. Try again later.")
      return
    }
    // Stopped while connecting
    if (attempt !== attemptRef.current) void client.disconnect()
  }

  async function stop() {
    attemptRef.current++
    const client = clientRef.current
    clientRef.current = null
    // Back to the start screen: the conversation is cleared
    botText.current = ""
    seenSegments.current.clear()
    setEntries([])
    setError(null)
    reset()
    await client?.disconnect()
  }

  const connected = status !== "idle" && status !== "error"
  const lobby = entries.length === 0 && (status === "idle" || status === "error" || status === "connecting")

  return (
    // On desktop the widget fills the viewport height (its column is sticky, see DemoStudio)
    <div className="relative lg:h-[calc(100dvh-7rem)]">
      <HudCorners />
      <div className="relative flex h-full flex-col overflow-hidden rounded-md border bg-card">
        <BorderBeam size={160} duration={10} colorFrom="var(--signal)" colorTo="transparent" />

        {/* Robot */}
        <div className="flex shrink-0 flex-col items-center px-4 pt-5 pb-2">
          <RobotFace
            speaking={status === "speaking"}
            listening={status === "listening"}
            audioLevel={botLevel}
            className="max-h-[28dvh] max-w-60"
          />
        </div>

        {lobby ? (
          /* Before the first exchange: one panel to set up and start the conversation */
          <Lobby status={status} error={error} onStart={start} onStop={stop} />
        ) : (
          <>
            {/* Transcript */}
            <div className="flex min-h-0 flex-1 flex-col border-t bg-background/40">
              <ol
                ref={transcriptRef}
                aria-live="polite"
                className="h-72 space-y-3 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,black_20px)] lg:h-auto lg:min-h-0 lg:flex-1"
              >
                {entries.map((entry) => (
                  <TranscriptLine key={entry.id} entry={entry} />
                ))}
              </ol>
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center gap-4 border-t px-5 py-4">
              <div className="relative grid place-items-center">
                {status === "listening" && (
                  <motion.span
                    aria-hidden
                    className="absolute size-12 rounded-full border border-signal"
                    animate={{ scale: [1, 1.7], opacity: [0.8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.button
                  type="button"
                  onClick={connected ? stop : start}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="relative grid size-12 place-items-center rounded-full bg-signal text-signal-foreground shadow-xl"
                  aria-label={connected ? "End the conversation" : "Start the conversation"}
                >
                  {connected ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
                </motion.button>
              </div>
              <p aria-live="polite" className="text-xs text-pretty text-muted-foreground">
                {status === "error" ? (error ?? hints.error) : hints[status]}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const steps = ["Customise", "Press", "Talk"]

/**
 * The panel shown before the first exchange: what to do, and a big mic to start. Stays up while
 * connecting, then gives way to the live transcript.
 */
function Lobby({
  status,
  error,
  onStart,
  onStop,
}: {
  status: Status
  error: string | null
  onStart: () => void
  onStop: () => void
}) {
  const connecting = status === "connecting"

  return (
    <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-6 border-t bg-background/40 px-6 py-8 text-center">
      <div className="relative grid size-32 place-items-center">
        {/* Rings inviting a press, faster while connecting */}
        <span aria-hidden className="absolute inset-0 rounded-full border border-signal/20" />
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute size-24 rounded-full border border-signal"
            animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
            transition={{ duration: connecting ? 1.1 : 2.4, repeat: Infinity, ease: "easeOut", delay: i * (connecting ? 0.55 : 1.2) }}
          />
        ))}
        <motion.button
          type="button"
          onClick={connecting ? onStop : onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="relative grid size-24 place-items-center rounded-full bg-signal text-signal-foreground shadow-[0_0_40px_-6px_var(--signal)] focus-visible:ring-4 focus-visible:ring-signal/40 focus-visible:outline-none"
          aria-label={connecting ? "Cancel" : "Start the conversation"}
        >
          {connecting ? <Loader2 className="size-9 animate-spin" /> : <Mic className="size-9" />}
        </motion.button>
      </div>

      <div>
        <p className="font-display text-2xl font-medium tracking-tight">Talk to the robot</p>
        <p aria-live="polite" className={cn("mx-auto mt-2 max-w-72 text-sm text-pretty", error ? "text-signal" : "text-muted-foreground")}>
          {connecting
            ? hints.connecting
            : (error ?? "Customise the robot's voice agent in the panels, then press the mic for a live demo.")}
        </p>
      </div>

      <ol className="flex flex-wrap justify-center gap-1.5">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-1.5 rounded-sm border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">
            <span className="text-signal">{String(i + 1).padStart(2, "0")}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** A chat bubble: the agent on the left, the visitor on the right in the signal colour. */
function TranscriptLine({ entry }: { entry: Entry }) {
  const robot = entry.role === "robot"
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex", robot ? "justify-start" : "justify-end")}
    >
      <p
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed text-pretty transition-opacity",
          robot ? "rounded-bl-sm border bg-card" : "rounded-br-sm bg-signal text-signal-foreground",
          !entry.final && "opacity-75"
        )}
      >
        {/* Who speaks, for screen readers (the bubble side shows it visually) */}
        <span className="sr-only">{robot ? "Agent: " : "You: "}</span>
        {entry.text || <TypingDots />}
      </p>
    </motion.li>
  )
}

/** Three dots pulsing while a line has no text yet. */
function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="sr-only">Typing</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="size-1.5 rounded-full bg-current opacity-60"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}
