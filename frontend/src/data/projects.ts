/**
 * Project content. Adding a project = adding an entry here,
 * without touching any component. Projects with `href` get a detail page.
 */

export type ProjectStatus = "in-progress" | "completed" | "upcoming"

export interface ProjectModule {
  name: string
  description: string
  /** Machine the module runs on (shown in the architecture diagram). */
  host: string
}

/** A component of a layered architecture (e.g. "Audio Bridge"). */
export interface ArchitectureComponent {
  name: string
  description: string
  /** Internal modules, in processing order. */
  modules: string[]
  /** Tools the component exposes (e.g. the agent's tools), shown under the modules. */
  tools?: string[]
  /** Internal layout of a voice agent, drawn as a block diagram on wide screens (modules/tools elsewhere). */
  pipeline?: VoiceAgentPipeline
  /** Modules drawn as blocks (icon, name, role) instead of the plain module chain. */
  blocks?: PipelineBlock[]
  /** Draw a two-way link between the two blocks (e.g. SDK Client ↔ WebSocket Server). */
  linkedBlocks?: boolean
  /** Desktop column: the audio path (left), the command path (right), or both. */
  column?: "left" | "right" | "full"
}

/**
 * Blocks of a voice agent, as in its internal diagram: the audio server in front, speech-to-text and
 * text-to-speech, the agent (LLM and its tools), then the knowledge base and the command client.
 */
export interface VoiceAgentPipeline {
  server: PipelineBlock & { preprocessing: PipelineBlock }
  stt: PipelineBlock
  tts: PipelineBlock
  agent: { name: string; llm: PipelineBlock; tools: [PipelineBlock, PipelineBlock, PipelineBlock] }
  /** Linked to the first tool. */
  knowledge: PipelineBlock
  /** Linked to the last tool; the agent's only way to the robot. */
  commands: PipelineBlock
  /** Labels of the four links of the speech loop. */
  wires: { audioIn: string; transcript: string; response: string; audioOut: string }
}

/** One block of an architecture diagram, with a short line on what it does. */
export interface PipelineBlock {
  name: string
  hint?: string
  /** Icon for blocks drawn outside the voice agent diagram (mapped to lucide icons in the component). */
  icon?: BlockIcon
}

export type BlockIcon = "mic" | "radio" | "speaker" | "lips" | "server" | "plug" | "robot"

export interface ArchitectureLayer {
  id: string
  name: string
  role: string
  components: ArchitectureComponent[]
  /** Link between the left and right components of this layer. */
  peerLink?: ArchitectureLink
}

export interface ArchitectureLink {
  protocol: string
  carries: string
}

/** Layers drawn top to bottom, with the links crossing each boundary. */
export interface LayeredArchitecture {
  layers: ArchitectureLayer[]
  /** `boundaries[i]` connects `layers[i]` and `layers[i + 1]`, one link per column. */
  boundaries: { left?: ArchitectureLink; right?: ArchitectureLink }[]
}

export interface ProjectImage {
  /** File in `public/` (e.g. "/projects/robot-interaction/robot.jpg"). Missing = placeholder frame. */
  src?: string
  caption: string
  /** Intrinsic size, to show the whole picture at its own ratio instead of cropping it. */
  width?: number
  height?: number
}

/** Icons available for deployment features (mapped to lucide icons in the component). */
export type FeatureIcon = "route" | "knowledge" | "qr" | "calendar" | "booking" | "documents"

/** A gauge of the hardware panel. Segments are stacked left to right; the rest of `max` is shown as free. */
export interface HardwareMeter {
  label: string
  unit: string
  max: number
  maxLabel: string
  segments: { label: string; value: number; highlight?: boolean }[]
}

/** Where the project was deployed and tested: what the robot does there, then how it runs on the hardware. */
export interface ProjectDeployment {
  title: string
  image: ProjectImage
  intro: string
  features: { icon: FeatureIcon; title: string; description: string }[]
  hardware: {
    board: string
    meters: HardwareMeter[]
    /** Software stacks running side by side on the board. `highlight` = ours (matches the memory gauge). */
    stacks: { name: string; items: string[]; highlight?: boolean }[]
    /** How each component of the framework was adapted to the robot. */
    integration: {
      title: string
      components: { name: string; description: string; tools?: { name: string; description: string }[] }[]
    }
  }
}

export interface Project {
  slug: string
  title: string
  tagline: string
  summary: string
  status: ProjectStatus
  tags: string[]
  /** Detail page. Missing = non-clickable card. */
  href?: string
  featured?: boolean
  /** Featured card on the home page: a shorter summary. */
  teaser?: string
  /**
   * Source code repository, shown as a "View on GitHub" button on the detail page. "unavailable"
   * keeps the button but shows a "Not available yet" notice instead of opening a link.
   */
  repo?: string
  /** Main picture representing the project, shown in the detail page header. */
  cover?: ProjectImage
  links?: { label: string; url: string }[]

  /* Detail page content — every block is optional */
  /** Why the project exists: short titled paragraphs, read in order. */
  context?: { title: string; text: string }[]
  /** Either a simple module chain (`modules`) or a full layered diagram (`layered`). */
  architecture?: { title: string; description?: string; modules?: ProjectModule[]; layered?: LayeredArchitecture }
  deployment?: ProjectDeployment
}

export const statusLabels: Record<ProjectStatus, string> = {
  "in-progress": "In progress",
  completed: "Completed",
  upcoming: "Coming soon",
}

export const projects: Project[] = [
  {
    slug: "robot-interaction",
    title: "Robot Interaction",
    tagline: "An embedded, modular, robot-agnostic voice agent framework",
    summary:
      "A framework that gives any robot a natural, real-time voice agent, running entirely on board. Easy to connect, configurable without code, from personality to models, and grounded in a knowledge base and a node-based conversation flow. Deployed on Enchanted Tools’ social robot Miroka as a healthcare reception assistant, and showcased at SantExpo Paris 2026.",
    status: "in-progress",
    tags: ["Python", "Pipecat", "LLM", "Edge AI", "WebRTC", "WebSocket"],
    href: "/projects/robot-interaction",
    featured: true,
    teaser:
      "Gives any robot a natural, real-time voice agent, running entirely on board and configurable without code. Deployed on Enchanted Tools’ social robot Miroka as a hospital reception assistant at SantExpo Paris 2026.",
    cover: {
      src: "/projects/robot-interaction/home.jpg",
      caption: "Miroka interacting with a baby at SantExpo, Paris.",
    },
    // Not public yet: replace with the repository URL once it is
    repo: "unavailable",
    context: [
      { title: "The shift", text: "Robots are leaving the factory. Service robots now work in hospital corridors, reception halls and shops, in front of people who have no console and no manual. For them, being able to simply talk to the robot is what makes it usable." },
      { title: "The bottleneck", text: "Large language models made that conversation possible, but a model that understands is not yet a system. The bottleneck has moved to integration: orchestrating a real-time pipeline, connecting it to the robot's capabilities, and fitting it all on a machine with limited compute." },
      { title: "The idea", text: "Yet most of a robot's voice pipeline is the same from one platform to the next, and every project rebuilds it from scratch. Robot Interaction factors it out, so the effort goes into what actually adds value." },
      { title: "The challenge", text: "It has to meet five requirements at once, rarely satisfied together: work on any robot, converse in real time, run entirely on board, stay in control of what it says and does, and let any component be swapped through configuration alone." },
    ],
    architecture: {
      title: "Three layers, ordered by proximity to the hardware",
      layered: {
        layers: [
          {
            id: "L2",
            name: "Orchestration",
            role: "Listens, thinks and replies. Robot-agnostic: it never talks to the robot directly.",
            components: [
              {
                name: "Voice Agent",
                description:
                  "A real-time Pipecat pipeline, streamed end to end: speech synthesis starts on the model's first words, without waiting for the full answer.",
                modules: ["WebRTC Server", "Audio Preprocessing", "STT", "LLM", "TTS"],
                tools: ["Query Knowledge → RAG Engine", "Trigger Flow → conversation graph", "Execute Action → WebSocket Client"],
                pipeline: {
                  server: {
                    name: "WebRTC Server",
                    hint: "Receives the voice, sends back the reply",
                    preprocessing: { name: "Audio Preprocessing", hint: "Noise · VAD · end of turn" },
                  },
                  stt: { name: "STT", hint: "Speech to text" },
                  tts: { name: "TTS", hint: "Text to speech" },
                  agent: {
                    name: "Agent",
                    llm: { name: "LLM", hint: "Brain" },
                    tools: [{ name: "Query Knowledge" }, { name: "Trigger Flow" }, { name: "Execute Action" }],
                  },
                  knowledge: { name: "RAG Engine" },
                  commands: { name: "WebSocket Client" },
                  wires: { audioIn: "Audio", transcript: "Transcript", response: "Response", audioOut: "Audio" },
                },
                column: "full",
              },
            ],
          },
          {
            id: "L1",
            name: "Middleware",
            role: "The only interface between software and hardware. Everything platform-specific stays here.",
            components: [
              {
                name: "Audio Bridge",
                description: "Carries the audio between the robot and the agent, and triggers the robot's lip-sync.",
                modules: ["MicTrack", "WebRTC Client", "SpeakerPlayer", "LipSync"],
                blocks: [
                  { name: "MicTrack", hint: "Reads the microphone", icon: "mic" },
                  { name: "WebRTC Client", hint: "Audio to and from the agent", icon: "radio" },
                  { name: "SpeakerPlayer", hint: "Plays the reply", icon: "speaker" },
                  { name: "LipSync", hint: "Moves the lips as it speaks", icon: "lips" },
                ],
                column: "left",
              },
              {
                name: "Robot Bridge",
                description: "The only component allowed to call the robot's SDK, behind a stable interface.",
                modules: ["WebSocket Server", "SDK Client"],
                blocks: [
                  { name: "SDK Client", hint: "Calls the robot's SDK", icon: "plug" },
                  { name: "WebSocket Server", hint: "Receives the commands", icon: "server" },
                ],
                linkedBlocks: true,
                column: "right",
              },
            ],
            peerLink: { protocol: "WebSocket", carries: "lip-sync" },
          },
          {
            id: "L0",
            name: "Hardware",
            role: "Physical devices. None of our code runs at this level.",
            components: [
              {
                name: "Microphone & speakers",
                description: "The robot's own audio devices, opened by their system index.",
                modules: ["Microphone", "Speakers"],
                blocks: [
                  { name: "Microphone", hint: "Captures the voice", icon: "mic" },
                  { name: "Speakers", hint: "Play the reply", icon: "speaker" },
                ],
                column: "left",
              },
              {
                name: "Robot",
                description: "Navigation, gestures and expressions, exposed by the vendor's SDK.",
                modules: ["Vendor SDK"],
                blocks: [{ name: "Vendor SDK", hint: "Moves, gestures, expressions", icon: "robot" }],
                column: "right",
              },
            ],
          },
        ],
        boundaries: [
          {
            left: { protocol: "WebRTC", carries: "audio stream, both ways" },
            right: { protocol: "WebSocket", carries: "commands & robot events" },
          },
          {
            left: { protocol: "Device index", carries: "raw audio" },
            right: { protocol: "Robot SDK", carries: "native calls" },
          },
        ],
      },
    },
    deployment: {
      title: "From the framework to the robot",
      image: {
        src: "/projects/robot-interaction/santexpo.jpg",
        width: 503,
        height: 786,
        caption: "SantExpo, Paris 2026.",
      },
      intro:
        "I deployed Robot Interaction on Enchanted Tools' social robot Miroka, turning it into a hospital reception assistant that ran live in front of healthcare professionals at SantExpo, Paris 2026.",
      features: [
        { icon: "route", title: "Wayfinding", description: "Walks patients to where they need to go, or to a staff member when needed." },
        {
          icon: "knowledge",
          title: "Hospital knowledge",
          description: "Answers from the hospital's information system, never made up. The conversation stays on board; only the hospital's data is read over its local network.",
        },
        { icon: "qr", title: "Patient identification", description: "Scans the patient's QR code with its front camera to find them in the hospital's system." },
        { icon: "calendar", title: "Calendar check", description: "Once identified, checks the patient's schedule to inform them or guide them to their appointment." },
        { icon: "booking", title: "Appointment booking", description: "Once identified, books a slot that fits both the hospital and the patient, within the conversation." },
        {
          icon: "documents",
          title: "Documents check",
          description: "Once identified and with consent, looks up the patient's documents to send them or explain them.",
        },
      ],
      hardware: {
        board: "NVIDIA Jetson Orin NX Super 16 GB",
        meters: [
          {
            label: "Time to first token",
            unit: "ms",
            max: 1000,
            maxLabel: "1,000 ms budget for natural conversation",
            segments: [{ label: "Robot Interaction", value: 931, highlight: true }],
          },
          {
            label: "System memory",
            unit: "MB",
            max: 15657,
            maxLabel: "15,657 MB addressable",
            segments: [
              { label: "Robot's native stack", value: 4911 },
              { label: "Robot Interaction", value: 7255, highlight: true },
            ],
          },
        ],
        stacks: [
          { name: "Robot Interaction stack", items: ["Speech-to-text", "LLM", "Text-to-speech"], highlight: true },
          { name: "Robot's native stack", items: ["Navigation", "Manipulation", "Animation"] },
        ],
        integration: {
          title: "Robot integration",
          components: [
            {
              name: "Audio Bridge",
              description:
                "Streams Miroka's built-in microphone and speakers to the agent, and drives lip-sync on its animated face.",
            },
            {
              name: "Robot Bridge",
              description:
                "The only component that calls Miroka's SDK, exposing the robot's movements, gestures and expressions to the agent.",
            },
            {
              name: "Voice Agent",
              description: "Runs the conversation on board, with three tools:",
              tools: [
                { name: "Query knowledge", description: "connects the agent to the hospital's information system" },
                { name: "Trigger flow", description: "starts a predefined procedure, e.g. booking an appointment" },
                { name: "Execute action", description: "triggers robot actions through its SDK, e.g. navigation or gestures" },
              ],
            },
          ],
        },
      },
    },
  },
  {
    slug: "project-2",
    title: "Upcoming project",
    tagline: "Coming soon",
    summary: "A future project will be showcased here.",
    status: "upcoming",
    tags: [],
  },
  {
    slug: "project-3",
    title: "Upcoming project",
    tagline: "Coming soon",
    summary: "A future project will be showcased here.",
    status: "upcoming",
    tags: [],
  },
]

/** Projects that have a detail page, in display order. */
export const detailedProjects = projects.filter((project) => project.href)

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
