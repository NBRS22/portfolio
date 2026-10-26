import { ImageResponse } from "next/og"

import { siteConfig } from "@/config/site"

/** Social preview image (LinkedIn, X, Slack…), generated at build time. */

export const alt = `${siteConfig.name} — ${siteConfig.role}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const SIGNAL = "#D92D2D"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0B0B0C",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          color: "#EDEDED",
          fontFamily: "sans-serif",
        }}
      >
        {/* Status line */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontFamily: "monospace", color: "#8A8A8F" }}>
          <span style={{ color: SIGNAL }}>{siteConfig.name.toUpperCase()}</span>
          <span>PORTFOLIO · 2026</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 700, letterSpacing: -5, lineHeight: 0.9 }}>
            <span>ROBOTICS</span>
            <span>
              &amp; AI ENGINEER<span style={{ color: SIGNAL }}>_</span>
            </span>
          </div>

          {/* Robot face */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
              width: 230,
              height: 130,
              borderRadius: 28,
              background: "#000",
              border: `2px solid ${SIGNAL}`,
            }}
          >
            <div style={{ width: 30, height: 44, borderRadius: 999, background: "#fff" }} />
            <div style={{ width: 30, height: 44, borderRadius: 999, background: "#fff" }} />
          </div>
        </div>
      </div>
    ),
    size
  )
}
