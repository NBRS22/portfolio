import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Voice backend the live demo talks to: allowed for fetch (`/start`) and its WebSocket. */
const voiceApi = new URL(process.env.NEXT_PUBLIC_VOICE_API_URL ?? "http://localhost:7860");
const voiceWs = `${voiceApi.protocol === "https:" ? "wss:" : "ws:"}//${voiceApi.host}`;

/**
 * Hosts of Daily's media library, which the Pipecat WebSocket transport uses for the microphone.
 * It downloads its call-machine bundle from `c.<host>` and runs it with `Function()`.
 */
const daily = "https://*.daily.co https://*.dailywebrtc.net https://*.dailywebrtc.com";

/**
 * Vercel Analytics: in production its script and beacons are served from the site itself
 * (`/_vercel/insights`, covered by 'self'); in dev it loads a debug script from this host instead.
 */
const vercelAnalyticsDev = isDev ? " https://va.vercel-scripts.com" : "";

/**
 * Content Security Policy. Next.js inlines its bootstrap scripts, hence 'unsafe-inline' for
 * scripts and styles; 'unsafe-eval' is needed by Daily's bundle (see above) and by dev mode;
 * `blob:` covers the audio worklets of the voice client; dev mode also uses a hot-reload WebSocket.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${daily}${vercelAnalyticsDev}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  `connect-src 'self' ${voiceApi.origin} ${voiceWs} ${daily}${vercelAnalyticsDev}${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The demo needs the microphone; nothing else is ever requested
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
