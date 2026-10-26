import {
  AudioWaveform,
  BookOpen,
  Bot,
  BrainCircuit,
  Cable,
  Captions,
  ChevronRight,
  Database,
  type LucideIcon,
  Mic,
  Plug,
  RadioTower,
  Server,
  Smile,
  Volume2,
  Workflow,
  Zap,
} from "lucide-react"

import type {
  ArchitectureComponent,
  ArchitectureLayer,
  ArchitectureLink,
  BlockIcon,
  LayeredArchitecture as Diagram,
  PipelineBlock,
  VoiceAgentPipeline,
} from "@/data/projects"
import { BlurFade } from "@/components/ui/blur-fade"
import { cn } from "@/lib/utils"

/** Diagram columns: audio path, gap holding the peer link, command path. Shared by layers and boundaries so they align. */
const COLUMNS = "md:grid-cols-[1fr_7rem_1fr]"
/** Layer label column on large screens. */
const ROW = "grid gap-4 lg:grid-cols-[11rem_1fr] lg:gap-8"
/** Side padding of a layer panel; boundaries use it too, so their links stay over the panels' columns. */
const LAYER_PADDING = "px-4 sm:px-5"

/**
 * Layered architecture diagram: layers stacked by proximity to the hardware, each split into
 * an audio path (left) and a command path (right), with the protocol crossing each boundary.
 */
export function LayeredArchitecture({ diagram }: { diagram: Diagram }) {
  return (
    <div className="relative isolate overflow-hidden rounded-md border bg-background p-4 sm:p-6">
      {/* Separate layer: `.bg-grid` masks its own element, so it must not hold the content */}
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />

      {diagram.layers.map((layer, i) => (
        <div key={layer.id}>
          <BlurFade inView delay={0.1 * i}>
            <Layer layer={layer} />
          </BlurFade>
          {diagram.boundaries[i] && <Boundary {...diagram.boundaries[i]} />}
        </div>
      ))}
    </div>
  )
}

function Layer({ layer }: { layer: ArchitectureLayer }) {
  const left = layer.components.find((component) => component.column === "left")
  const right = layer.components.find((component) => component.column === "right")
  const full = layer.components.filter((component) => !component.column || component.column === "full")
  const isHardware = layer.id === "L0"

  return (
    // Each layer is its own tinted, dashed panel (as in the report's figure), set apart from the
    // links crossing between layers, which sit on the plain background
    <section
      className={cn(
        ROW,
        LAYER_PADDING,
        "rounded-lg border border-dashed border-foreground/25 bg-foreground/[0.035] py-4 sm:py-5",
      )}
      aria-label={`${layer.id} ${layer.name}`}
    >
      <header className="lg:border-r lg:border-foreground/15 lg:pt-5 lg:pr-6">
        <p className="type-label inline-flex rounded-sm bg-signal px-1.5 py-0.5 text-signal-foreground">{layer.id}</p>
        <h3 className="mt-1 font-display text-lg font-medium tracking-tight">{layer.name}</h3>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{layer.role}</p>
      </header>

      <div className={cn("grid gap-3 md:items-stretch md:gap-0", COLUMNS)}>
        {full.map((component) => (
          <ComponentCard key={component.name} component={component} muted={isHardware} className="md:col-span-3" />
        ))}
        {left && <ComponentCard component={left} muted={isHardware} />}
        {(left || right) && (
          <div className="flex items-center justify-center">
            {layer.peerLink && <PeerLink link={layer.peerLink} />}
          </div>
        )}
        {right && <ComponentCard component={right} muted={isHardware} className="md:col-start-3" />}
      </div>
    </section>
  )
}

function ComponentCard({
  component,
  muted,
  className,
}: {
  component: ArchitectureComponent
  muted: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        "rounded-md border p-5 transition-colors hover:border-signal/50",
        muted ? "border-dashed border-muted-foreground/40 bg-background" : "bg-card",
        className,
      )}
    >
      <p className="font-mono text-sm font-semibold">{component.name}</p>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{component.description}</p>

      {component.pipeline && <PipelineDiagram pipeline={component.pipeline} />}
      {component.pipeline && <CompactPipeline pipeline={component.pipeline} />}
      {component.blocks && <ModuleBlocks blocks={component.blocks} linked={component.linkedBlocks} />}

      {/* Plain module chain and tools, for components drawn without blocks */}
      <div className={cn((component.pipeline || component.blocks) && "hidden")}>
        <ol className="mt-4 flex flex-wrap items-center gap-1.5">
          {component.modules.map((module, i) => (
            <li key={module} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight aria-hidden className="size-3 text-signal" />}
              <span className="rounded-sm border bg-background px-2 py-1 font-mono text-xs">{module}</span>
            </li>
          ))}
        </ol>

        {component.tools && (
          <div className="mt-4 border-t pt-4">
            <p className="type-label text-muted-foreground">Agent tools</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {component.tools.map((tool) => (
                <li key={tool} className="flex items-center gap-2 font-mono text-xs">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

const blockIcons: Record<BlockIcon, LucideIcon> = {
  mic: Mic,
  radio: RadioTower,
  speaker: Volume2,
  lips: Smile,
  server: Server,
  plug: Plug,
  robot: Bot,
}

/**
 * A component's modules as blocks: two linked blocks side by side (e.g. SDK Client ↔ WebSocket
 * Server), otherwise a grid.
 */
function ModuleBlocks({ blocks, linked }: { blocks: PipelineBlock[]; linked?: boolean }) {
  const icon = (block: PipelineBlock) => blockIcons[block.icon ?? "server"]

  if (linked && blocks.length === 2) {
    return (
      <div className="mt-5 grid grid-cols-[1fr_2.5rem_1fr] items-center">
        <Block block={blocks[0]} icon={icon(blocks[0])} className="h-full" />
        <Wire to="both" />
        <Block block={blocks[1]} icon={icon(blocks[1])} className="h-full" />
      </div>
    )
  }

  return (
    <div className={cn("mt-5 grid gap-2", blocks.length > 1 && "sm:grid-cols-2")}>
      {blocks.map((block) => (
        <Block key={block.name} block={block} icon={icon(block)} />
      ))}
    </div>
  )
}

/**
 * Inside the voice agent, laid out like its block diagram: the WebRTC Server (with audio
 * preprocessing) feeds STT, the agent's LLM calls its tools, and TTS sends the reply back. Query
 * Knowledge reaches the RAG Engine, Execute Action the WebSocket Client. Three shared rows keep
 * STT, the first tool and the RAG Engine level, and TTS, the last tool and the client level.
 */
function PipelineDiagram({ pipeline }: { pipeline: VoiceAgentPipeline }) {
  const { server, agent, wires } = pipeline
  const toolIcons = [BookOpen, Workflow, Zap]

  return (
    <div
      aria-label="Voice agent internal diagram"
      className="mt-6 hidden grid-cols-[11.5rem_minmax(2.75rem,1fr)_7.5rem_minmax(4.25rem,1fr)_auto_minmax(1.5rem,0.6fr)_9rem] grid-rows-[auto_auto_auto_auto_0] items-center gap-y-4 rounded-md border bg-background/60 p-3 xl:grid"
    >
      {/* WebRTC Server, wrapping the audio preprocessing */}
      <div className="row-span-5 flex flex-col self-stretch rounded-md border border-dashed border-foreground/25 p-3">
        <GroupTitle label={server.name} icon={RadioTower} />
        <div className="flex flex-1 flex-col justify-center gap-3 pt-3">
          <Block block={server.preprocessing} icon={AudioWaveform} />
          {server.hint && <p className="text-center text-xs text-pretty text-muted-foreground">{server.hint}</p>}
        </div>
      </div>

      {/* Speech loop: what comes in on top, what goes out at the bottom */}
      <Wire label={wires.audioIn} to="right" className="col-start-2 row-start-2" />
      <Block block={pipeline.stt} icon={Captions} className="col-start-3 row-start-2" />
      <Wire label={wires.transcript} to="right" className="col-start-4 row-start-2" />

      <Wire label={wires.audioOut} to="left" className="col-start-2 row-start-4" />
      <Block block={pipeline.tts} icon={Volume2} className="col-start-3 row-start-4" />
      <Wire label={wires.response} to="left" className="col-start-4 row-start-4" />

      {/*
       * Agent: shares the diagram's rows (title row, three block rows, a closing row) so each tool
       * sits level with what it lines up with outside
       */}
      <div className="col-start-5 row-span-5 row-start-1 grid grid-cols-[4.5rem_2rem_10rem] grid-rows-subgrid items-center self-stretch rounded-md border border-dashed border-signal/50 bg-signal/5 px-3">
        <GroupTitle label={agent.name} signal className="col-span-3 pt-3" />
        <div className="row-span-3 row-start-2 flex flex-col items-center justify-center gap-2 self-stretch rounded-md border border-signal/40 bg-card px-2 text-center">
          <BrainCircuit aria-hidden className="size-5 text-signal" />
          <span className="font-mono text-sm font-semibold">{agent.llm.name}</span>
          {agent.llm.hint && <span className="text-[11px] text-muted-foreground">{agent.llm.hint}</span>}
        </div>
        {agent.tools.map((tool, i) => (
          <div key={tool.name} className="contents">
            <Wire to="both" className={cn("col-start-2", ROWS[i])} />
            <Block block={tool} icon={toolIcons[i]} className={cn("col-start-3", ROWS[i])} />
          </div>
        ))}
      </div>

      {/* What the tools reach outside the agent */}
      <Wire to="both" className="col-start-6 row-start-2" />
      <Block block={pipeline.knowledge} icon={Database} className="col-start-7 row-start-2" />
      <Wire to="both" className="col-start-6 row-start-4" />
      <Block block={pipeline.commands} icon={Cable} className="col-start-7 row-start-4" />
    </div>
  )
}

/**
 * The voice agent on narrower screens, where the full diagram does not fit: the speech loop in
 * order, then the agent's tools with what each one reaches.
 */
function CompactPipeline({ pipeline }: { pipeline: VoiceAgentPipeline }) {
  const { agent } = pipeline
  const loop = [
    { block: pipeline.server.preprocessing, icon: AudioWaveform },
    { block: pipeline.stt, icon: Captions },
    { block: agent.llm, icon: BrainCircuit },
    { block: pipeline.tts, icon: Volume2 },
  ]
  const reaches = [pipeline.knowledge.name, undefined, pipeline.commands.name]

  return (
    <div className="mt-5 space-y-5 xl:hidden">
      <div className="grid gap-2 sm:grid-cols-2">
        {loop.map(({ block, icon }) => (
          <Block key={block.name} block={block} icon={icon} />
        ))}
      </div>
      <div className="rounded-md border border-dashed border-signal/50 bg-signal/5 p-3">
        <GroupTitle label={`${agent.name} tools`} signal />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {agent.tools.map((tool, i) => (
            <Block
              key={tool.name}
              block={{ ...tool, hint: reaches[i] && `→ ${reaches[i]}` }}
              icon={[BookOpen, Workflow, Zap][i]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Block rows of the diagram (row 1 holds the group titles). */
const ROWS = ["row-start-2", "row-start-3", "row-start-4"]

function GroupTitle({ label, icon: Icon, signal, className }: { label: string; icon?: LucideIcon; signal?: boolean; className?: string }) {
  return (
    <span className={cn("type-label flex items-center gap-1.5", signal ? "text-signal" : "text-foreground", className)}>
      {Icon && <Icon aria-hidden className="size-3.5 text-signal" />}
      {label}
    </span>
  )
}

/** A block: icon and name, centred, with a short line on what it does underneath. */
function Block({ block, icon: Icon, className }: { block: PipelineBlock; icon: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex flex-col justify-center rounded-md border bg-card px-3 py-2.5 text-center leading-tight", className)}>
      <span className="flex items-center justify-center gap-2">
        <Icon aria-hidden className="size-4 shrink-0 text-signal" />
        <span className="font-mono text-xs font-semibold">{block.name}</span>
      </span>
      {block.hint && <span className="mt-1 block text-[11px] text-muted-foreground">{block.hint}</span>}
    </div>
  )
}

/** Horizontal link between two blocks; the label sits above the line, the arrowheads give the direction. */
function Wire({ label, to, className }: { label?: string; to: "left" | "right" | "both"; className?: string }) {
  return (
    <div className={cn("relative flex items-center px-1 text-signal", className)}>
      {label && (
        <span className="absolute inset-x-0 bottom-full mb-1 text-center text-[11px] font-medium whitespace-nowrap text-muted-foreground">
          {label}
        </span>
      )}
      {to !== "right" && <Arrowhead className="rotate-180" />}
      <span className="h-0.5 flex-1 rounded-full bg-signal/70" />
      {to !== "left" && <Arrowhead />}
    </div>
  )
}

function Arrowhead({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 8 10" className={cn("size-2.5 shrink-0 fill-current", className)}>
      <path d="M 0 0 L 8 5 L 0 10 Z" />
    </svg>
  )
}

/** Links crossing the boundary between two layers, one per column. */
function Boundary({ left, right }: { left?: ArchitectureLink; right?: ArchitectureLink }) {
  return (
    <div className={cn(ROW, LAYER_PADDING)} aria-hidden>
      <span className="hidden lg:block" />
      <div className={cn("grid grid-cols-2 md:gap-0", COLUMNS)}>
        <div className="flex justify-center">{left && <VerticalLink link={left} />}</div>
        <span className="hidden md:block" />
        <div className="flex justify-center">{right && <VerticalLink link={right} />}</div>
      </div>
    </div>
  )
}

/** Two-way link between layers, drawn like the diagram's wires, standing up. */
function VerticalLink({ link }: { link: ArchitectureLink }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <VerticalWire className="h-16" />
      <LinkLabel link={link} />
    </div>
  )
}

/** Two-way link between the two components of a layer: across on desktop, down on mobile. */
function PeerLink({ link }: { link: ArchitectureLink }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2 md:w-full md:px-2">
      <Wire to="both" className="hidden w-full md:flex" />
      <VerticalWire className="h-10 md:hidden" />
      <LinkLabel link={link} className="text-center" />
    </div>
  )
}

function VerticalWire({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col items-center text-signal", className)}>
      <Arrowhead className="-rotate-90" />
      <span className="w-0.5 flex-1 rounded-full bg-signal/70" />
      <Arrowhead className="rotate-90" />
    </div>
  )
}

function LinkLabel({ link, className }: { link: ArchitectureLink; className?: string }) {
  return (
    <p className={cn("leading-tight", className)}>
      <span className="block font-mono text-xs font-semibold text-foreground">{link.protocol}</span>
      <span className="mt-0.5 block text-[11px] text-muted-foreground">{link.carries}</span>
    </p>
  )
}
