"use client"

import { useEffect, useId, useRef } from "react"
import { motion, type MotionValue, useMotionValue, useSpring, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

interface RobotFaceProps {
  /** The robot is talking: faster core LED and arm gestures. */
  speaking?: boolean
  /** Ear sensors light up while the robot is listening. */
  listening?: boolean
  /**
   * Live level (0–1) of the audio the robot is playing. The mouth opens with it, so it moves with
   * the real voice. Without it, the mouth keeps its resting smile.
   */
  audioLevel?: MotionValue<number>
  className?: string
}

/*
 * Nourito, drawn in the site's own tokens: thin outlines on the card colour, a gridded visor and the
 * red signal as the only accent. Adapts to both themes.
 */
const FG = "var(--foreground)"
const MUTED = "var(--muted-foreground)"
const LINE = "var(--border)"
const CARD = "var(--card)"
const BG = "var(--background)"
const SIGNAL = "var(--signal)"

/*
 * Rotations use `transformBox: "view-box"` so their origins are absolute SVG coordinates
 * (Motion defaults SVG elements to `fill-box`, relative to their own bounds).
 */

/** Max eye travel towards the cursor, in SVG units. */
const EYE_RANGE = 6

/** Resting mouth: a small smile, faded out as the mouth opens. */
const MOUTH = "M 109 131 Q 120 136 131 131"

/**
 * Nourito, an animated robot character: it hovers and sways, the eyes follow the cursor and blink,
 * the mouth opens with the live audio level, and the ears, chest and arms react to listening and
 * speaking.
 */
export function RobotFace({ speaking = false, listening = false, audioLevel, className }: RobotFaceProps) {
  const id = useId().replace(/:/g, "")
  const ref = useRef<SVGSVGElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const eyeX = useSpring(x, { stiffness: 150, damping: 15 })
  const eyeY = useSpring(y, { stiffness: 150, damping: 15 })

  // Mouth driven by the voice: smoothed level → opening height; the resting curve fades out as it opens
  const silent = useMotionValue(0)
  const level = useSpring(audioLevel ?? silent, { stiffness: 400, damping: 30 })
  const mouthHeight = useTransform(level, [0, 1], [0, 18])
  const mouthY = useTransform(mouthHeight, (height) => 131 - height / 2)
  const mouthOpen = useTransform(level, [0, 0.06], [0, 1])
  const mouthRest = useTransform(level, [0, 0.06], [1, 0])

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      // Eyes sit at ~27% of the drawing's height
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height * 0.27)
      const distance = Math.max(Math.hypot(dx, dy), 1)
      const strength = Math.min(distance / 300, 1)
      x.set((dx / distance) * EYE_RANGE * strength)
      y.set((dy / distance) * EYE_RANGE * 0.7 * strength)
    }
    window.addEventListener("pointermove", onPointerMove)
    return () => window.removeEventListener("pointermove", onPointerMove)
  }, [x, y])

  const lit = listening || speaking
  const url = (name: string) => `url(#${id}-${name})`

  return (
    <motion.svg
      ref={ref}
      viewBox="10 32 220 268"
      role="img"
      aria-label="Nourito the robot"
      className={cn("w-full max-w-80 overflow-visible", className)}
    >
      <defs>
        <pattern id={`${id}-grid`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 H 0 V 8" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
        </pattern>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}-visor`}>
          <rect x="48" y="64" width="144" height="86" rx="34" />
        </clipPath>
      </defs>

      {/* Hover */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
        {/* Torso */}
        <rect x="64" y="184" width="112" height="90" rx="28" fill={CARD} stroke={FG} strokeOpacity="0.55" strokeWidth="1.5" />
        <rect x="70" y="190" width="100" height="78" rx="23" fill="none" stroke={LINE} />
        {[0, 1, 2].map((i) => (
          <g key={i} stroke={MUTED} strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round">
            <line x1="81" x2="89" y1={222 + i * 7} y2={222 + i * 7} />
            <line x1="151" x2="159" y1={222 + i * 7} y2={222 + i * 7} />
          </g>
        ))}

        {/*
         * Chest emblem: a circuit-style N. A red pulse runs along the trace in a continuous
         * loop, faster during the conversation.
         */}
        <ChestEmblem fast={lit} glow={url("glow")} />

        {/* Neck */}
        <rect x="106" y="166" width="28" height="7" rx="2" fill={CARD} stroke={FG} strokeOpacity="0.45" />
        <rect x="110" y="173" width="20" height="6" rx="2" fill={CARD} stroke={FG} strokeOpacity="0.35" />
        <rect x="113" y="179" width="14" height="5" rx="2" fill={CARD} stroke={FG} strokeOpacity="0.25" />

        {/* Head, swaying a little */}
        <motion.g
          animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "view-box", originX: "120px", originY: "168px" }}
        >
          {/* Ear sensors */}
          {([26, 214] as const).map((cx) => (
            <g key={cx}>
              <rect x={cx - 8} y="88" width="16" height="36" rx="8" fill={CARD} stroke={FG} strokeOpacity="0.55" strokeWidth="1.5" />
              {[0, 1, 2].map((i) => (
                <motion.line
                  key={i}
                  x1={cx}
                  x2={cx}
                  y1={97 + i * 7}
                  y2={101 + i * 7}
                  stroke={SIGNAL}
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={lit ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.2 }}
                  transition={lit ? { duration: 0.8, repeat: Infinity, delay: i * 0.15 } : { duration: 0.3 }}
                />
              ))}
            </g>
          ))}

          {/* Head shell, with an inner contour */}
          <rect x="34" y="42" width="172" height="126" rx="48" fill={CARD} stroke={FG} strokeOpacity="0.55" strokeWidth="1.5" />
          <rect x="40" y="48" width="160" height="114" rx="42" fill="none" stroke={LINE} />

          {/* Visor: gridded screen */}
          <rect x="48" y="64" width="144" height="86" rx="34" fill={BG} stroke={FG} strokeOpacity="0.35" />
          <g clipPath={url("visor")}>
            <rect x="48" y="64" width="144" height="86" fill={url("grid")} />

            {/* Eyes and brows follow the cursor; eyes blink */}
            <motion.g style={{ x: eyeX, y: eyeY }}>
              {[92, 148].map((cx) => (
                <line key={cx} x1={cx - 9} x2={cx + 9} y1="80" y2="80" stroke={FG} strokeWidth="3.5" strokeLinecap="round" />
              ))}

              <motion.g
                animate={{ scaleY: [1, 1, 0.1, 1, 1, 0.1, 1] }}
                transition={{ duration: 0.7, times: [0, 0.2, 0.3, 0.42, 0.7, 0.8, 1], repeat: Infinity, repeatDelay: 4.2 }}
                style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
              >
                {[92, 148].map((cx) => (
                  <rect key={cx} x={cx - 10} y="90" width="20" height="28" rx="10" fill={FG} />
                ))}
              </motion.g>
            </motion.g>

            {/* Mouth: a smile at rest, opening with the live audio level */}
            <motion.path d={MOUTH} fill="none" stroke={FG} strokeWidth="3" strokeLinecap="round" style={{ opacity: mouthRest }} />
            <motion.rect
              x="110"
              width="20"
              rx="6"
              fill={FG}
              style={{ height: mouthHeight, y: mouthY, opacity: mouthOpen }}
            />
          </g>
        </motion.g>

        {/* Arms, pivoting at the shoulders */}
        <Arm side="left" speaking={speaking} />
        <Arm side="right" speaking={speaking} />
      </motion.g>
    </motion.svg>
  )
}

const N_TRACE = "M 104 248 V 210 L 136 248 V 210"

/** Length of the red pulse, as a fraction of the trace. */
const PULSE = 0.22

function ChestEmblem({ fast, glow }: { fast: boolean; glow: string }) {
  const duration = fast ? 1.4 : 2.8

  return (
    <g>
      {/* Trace */}
      <path d={N_TRACE} fill="none" stroke={FG} strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/*
       * Travelling pulse: one dash per trace length, so as it leaves one end it re-enters at the
       * other, without a pause and without the dot a zero-length round cap would draw.
       */}
      <motion.path
        d={N_TRACE}
        pathLength={1}
        fill="none"
        stroke={SIGNAL}
        strokeWidth="6"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeDasharray={`${PULSE} ${1 - PULSE}`}
        filter={glow}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -1 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
    </g>
  )
}

const SHOULDER_Y = 198
const ELBOW_Y = 226

/**
 * Arm pose as upper arm and forearm angles (deg, positive = outwards for the left arm, the forearm
 * relative to the upper arm): open and swaying at rest, wider gestures while speaking.
 */
function armPose(left: boolean, speaking: boolean) {
  const sign = left ? 1 : -1
  if (speaking) return { upper: [sign * 32, sign * 42, sign * 32], fore: [-sign * 14, -sign * 40, -sign * 14], loop: 1.2 }
  return { upper: [sign * 34, sign * 38, sign * 34], fore: [-sign * 16, -sign * 22, -sign * 16], loop: 3.2 }
}

/** Jointed arm: shoulder, upper arm, elbow, forearm and a round hand. */
function Arm({ side, speaking }: { side: "left" | "right"; speaking: boolean }) {
  const left = side === "left"
  const sx = left ? 58 : 182
  const pose = armPose(left, speaking)
  const transition = { duration: pose.loop, repeat: Infinity, ease: "easeInOut" as const }
  const shell = { fill: CARD, stroke: FG, strokeOpacity: 0.55, strokeWidth: 1.5 }

  return (
    <motion.g
      initial={false}
      animate={{ rotate: pose.upper }}
      transition={transition}
      style={{ transformBox: "view-box", originX: `${sx}px`, originY: `${SHOULDER_Y}px` }}
    >
      {/* Upper arm */}
      <rect x={sx - 7} y={SHOULDER_Y - 4} width="14" height={ELBOW_Y - SHOULDER_Y + 4} rx="7" {...shell} />

      {/* Forearm and hand, bending at the elbow */}
      <motion.g
        initial={false}
        animate={{ rotate: pose.fore }}
        transition={transition}
        style={{ transformBox: "view-box", originX: `${sx}px`, originY: `${ELBOW_Y}px` }}
      >
        <rect x={sx - 8} y={ELBOW_Y} width="16" height="24" rx="7" {...shell} />
        <line x1={sx - 8} x2={sx + 8} y1={ELBOW_Y + 15} y2={ELBOW_Y + 15} stroke={LINE} />
        <rect x={sx - 9} y={ELBOW_Y + 22} width="18" height="17" rx="8" {...shell} />
        <line x1={sx - 4} x2={sx + 4} y1={ELBOW_Y + 34} y2={ELBOW_Y + 34} stroke={MUTED} strokeOpacity="0.6" strokeLinecap="round" />
      </motion.g>

      {/* Joints */}
      <circle cx={sx} cy={ELBOW_Y} r="5.5" fill={BG} stroke={FG} strokeOpacity="0.45" />
      <circle cx={sx} cy={ELBOW_Y} r="1.8" fill={MUTED} />
      <circle cx={sx} cy={SHOULDER_Y} r="7" fill={CARD} stroke={FG} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx={sx} cy={SHOULDER_Y} r="1.8" fill={MUTED} />
    </motion.g>
  )
}
