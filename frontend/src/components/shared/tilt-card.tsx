"use client"

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

/** Max rotation in degrees. */
const MAX_TILT = 8

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  /** Element drawn behind the card that moves the opposite way (parallax depth). */
  backdrop?: React.ReactNode
}

/**
 * 3D tilt on hover: the card leans towards the cursor, a glare follows it,
 * and the optional backdrop shifts the other way for depth.
 */
export function TiltCard({ children, className, backdrop }: TiltCardProps) {
  // Pointer position inside the card, from -0.5 to 0.5
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 160, damping: 18 }
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), spring)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), spring)
  const backdropX = useSpring(useTransform(px, [-0.5, 0.5], [14, -14]), spring)
  const backdropY = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), spring)

  const glareX = useTransform(px, [-0.5, 0.5], [0, 100])
  const glareY = useTransform(py, [-0.5, 0.5], [0, 100])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 55%)`

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  function reset() {
    px.set(0)
    py.set(0)
  }

  return (
    <div className={cn("relative [perspective:1000px]", className)} onPointerMove={onPointerMove} onPointerLeave={reset}>
      {backdrop && (
        <motion.div aria-hidden className="absolute inset-0" style={{ x: backdropX, y: backdropY }}>
          {backdrop}
        </motion.div>
      )}
      <motion.div className="group/tilt relative h-full" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ background: glare }}
        />
      </motion.div>
    </div>
  )
}
