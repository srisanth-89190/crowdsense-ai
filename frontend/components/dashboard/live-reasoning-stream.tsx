"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ── Types ──────────────────────────────────────────────────────
export interface BackendData {
  vision?: Record<string, {
    crowd_density?: string
    crowd_count_estimate?: number
    movement_pattern?: string
    visible_distress?: boolean
    scene_description?: string
    risk_score?: number
    bottleneck_detected?: boolean
    bottleneck_location?: string
    immediate_threats?: string[]
    zone_descriptions?: Record<string, string>
  }>
  audio?: {
    transcription?: string
    panic_words_detected?: number
    panic_words_found?: string[]
    screaming_likely?: boolean
    audio_concern_level?: string
    audio_risk_score?: number
  }
  initial?: {
    risk_level?: number
    collective_intent?: string
    primary_danger?: string
    most_dangerous_zone?: string
    minutes_until_critical?: number | null
    reasoning?: string
    confidence?: number
    key_risk_factor?: string
  }
  final?: {
    final_risk_level?: number
    final_primary_danger?: string
    final_most_dangerous_zone?: string
    final_minutes_until_critical?: number | null
    final_is_critical?: boolean
    what_junior_missed?: string
    what_junior_got_right?: string
    final_reasoning?: string
    final_confidence?: number
    call_emergency_services?: boolean
  }
  commands?: {
    incident_level?: string
    radio_commands?: string[]
    commander_note?: string
    color?: string
  }
  alert_log?: Array<{ time: string; level: string; message: string }>
  analysis_count?: number
  risk_history?: number[]
  active_cameras?: string[]
  system_running?: boolean
}

interface StreamEvent {
  id: string
  time: string
  tag: "BOOT" | "VISION" | "AUDIO" | "FUSION" | "JUNIOR" | "CRITIC" | "VERDICT" | "COMMAND" | "TREND" | "ALERT" | "INFO"
  text: string
  isNew?: boolean
}

// ── Tag config ─────────────────────────────────────────────────
const TAG_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  BOOT:    { color: "#00d4ff", bg: "rgba(0,212,255,0.08)",   label: "BOOT"    },
  VISION:  { color: "#00d4ff", bg: "rgba(0,212,255,0.06)",   label: "VISION"  },
  AUDIO:   { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "AUDIO"   },
  FUSION:  { color: "#00d4ff", bg: "rgba(0,212,255,0.04)",   label: "FUSION"  },
  JUNIOR:  { color: "#ffe44d", bg: "rgba(255,228,77,0.07)",  label: "ANALYST" },
  CRITIC:  { color: "#ff8c00", bg: "rgba(255,140,0,0.07)",   label: "CRITIC"  },
  VERDICT: { color: "#ff2244", bg: "rgba(255,34,68,0.09)",   label: "VERDICT" },
  COMMAND: { color: "#ff8c00", bg: "rgba(255,140,0,0.06)",   label: "COMMAND" },
  TREND:   { color: "#00ff9d", bg: "rgba(0,255,157,0.06)",   label: "TREND"   },
  ALERT:   { color: "#ff2244", bg: "rgba(255,34,68,0.06)",   label: "ALERT"   },
  INFO:    { color: "#4a6a7a", bg: "transparent",             label: "INFO"    },
}

function nowStr(): string {
  return new Date().toTimeString().slice(0, 8)
}

let _id = 0
function uid() { return `e${++_id}` }

// ── Synthesise real thinking events from backend data ──────────
function synthesiseEvents(data: BackendData): StreamEvent[] {
  const events: StreamEvent[] = []
  const t = nowStr()

  // ── VISION ──────────────────────────────────────────────────
  const visionCams = Object.entries(data.vision ?? {})
  visionCams.forEach(([camId, v]) => {
    if (!v || v.crowd_density === "unknown") return
    const risk = v.risk_score ?? 0
    events.push({
      id: uid(), time: t, tag: "VISION", isNew: true,
      text: `[${camId}] ${(v.crowd_density ?? "?").toUpperCase()} density — ~${v.crowd_count_estimate ?? 0} persons | ${v.movement_pattern ?? "?"} | risk ${risk}/10`,
    })
    if (v.scene_description) {
      events.push({
        id: uid(), time: t, tag: "VISION", isNew: true,
        text: `[${camId}] "${v.scene_description}"`,
      })
    }
    if (v.bottleneck_detected && v.bottleneck_location && v.bottleneck_location !== "none") {
      events.push({
        id: uid(), time: t, tag: "VISION", isNew: true,
        text: `[${camId}] ⚠ BOTTLENECK: ${v.bottleneck_location}`,
      })
    }
    const threats = (v.immediate_threats ?? []).filter(t => t && t !== "none")
    if (threats.length) {
      events.push({
        id: uid(), time: t, tag: "VISION", isNew: true,
        text: `[${camId}] Threats: ${threats.join(" | ")}`,
      })
    }
  })

  // ── AUDIO ───────────────────────────────────────────────────
  const a = data.audio ?? {}
  if (a.transcription && !a.transcription.includes("unavailable") && !a.transcription.includes("no audio")) {
    const concern = (a.audio_concern_level ?? "low").toUpperCase()
    const panic = a.panic_words_detected ?? 0
    if (a.screaming_likely) {
      events.push({
        id: uid(), time: t, tag: "AUDIO", isNew: true,
        text: `⚠ SCREAMING DETECTED — audio risk ${a.audio_risk_score ?? 0}/10 — "${a.transcription?.slice(0, 60)}"`,
      })
    } else if (panic > 0) {
      events.push({
        id: uid(), time: t, tag: "AUDIO", isNew: true,
        text: `Panic words (${panic}): [${(a.panic_words_found ?? []).join(", ")}] — concern ${concern} — "${a.transcription?.slice(0, 50)}"`,
      })
    } else {
      events.push({
        id: uid(), time: t, tag: "AUDIO", isNew: true,
        text: `Audio nominal — concern ${concern} | "${a.transcription?.slice(0, 60)}"`,
      })
    }
  }

  // ── FUSION ──────────────────────────────────────────────────
  const vRisk = Math.max(...Object.values(data.vision ?? {}).map(v => v?.risk_score ?? 0), 0)
  const aRisk = a.audio_risk_score ?? 0
  if (vRisk > 0 || aRisk > 0) {
    const dual = Object.values(data.vision ?? {}).some(v => v?.visible_distress) && a.screaming_likely
    events.push({
      id: uid(), time: t, tag: "FUSION", isNew: true,
      text: `Sensor fusion — visual=${vRisk}/10  audio=${aRisk}/10${dual ? "  ⚠ DUAL HIGH — elevated threat confidence" : "  → forwarding to reasoning layer"}`,
    })
  }

  // ── JUNIOR ANALYST ──────────────────────────────────────────
  const ini = data.initial ?? {}
  if (ini.risk_level !== undefined) {
    events.push({
      id: uid(), time: t, tag: "JUNIOR", isNew: true,
      text: `Assessment — risk=${ini.risk_level}/10 | intent=${ini.collective_intent ?? "?"} | danger=${ini.primary_danger ?? "?"} | hot zone=${(ini.most_dangerous_zone ?? "?").toUpperCase()}${ini.minutes_until_critical ? ` | T-${ini.minutes_until_critical}min` : ""}`,
    })
    if (ini.key_risk_factor) {
      events.push({
        id: uid(), time: t, tag: "JUNIOR", isNew: true,
        text: `Key risk: "${ini.key_risk_factor}"`,
      })
    }
    if (ini.reasoning) {
      events.push({
        id: uid(), time: t, tag: "JUNIOR", isNew: true,
        text: `Reasoning: "${ini.reasoning.slice(0, 150)}"`,
      })
    }
  }

  // ── SENIOR CRITIC ───────────────────────────────────────────
  const fin = data.final ?? {}
  if (fin.final_risk_level !== undefined && ini.risk_level !== undefined) {
    const delta = fin.final_risk_level - ini.risk_level
    const dir = delta > 0 ? `↑ raised +${delta}` : delta < 0 ? `↓ lowered ${delta}` : "concurred"
    events.push({
      id: uid(), time: t, tag: "CRITIC", isNew: true,
      text: `Review — junior=${ini.risk_level}/10 → final=${fin.final_risk_level}/10 (${dir}) | confidence=${fin.final_confidence ?? 0}%`,
    })
    if (fin.what_junior_missed && fin.what_junior_missed !== "Critic unavailable" && fin.what_junior_missed !== "Network unavailable — check internet connection") {
      events.push({
        id: uid(), time: t, tag: "CRITIC", isNew: true,
        text: `Junior missed: "${fin.what_junior_missed.slice(0, 110)}"`,
      })
    }
    if (fin.what_junior_got_right && fin.what_junior_got_right !== "Initial assessment used as fallback") {
      events.push({
        id: uid(), time: t, tag: "CRITIC", isNew: true,
        text: `Confirmed: "${fin.what_junior_got_right.slice(0, 110)}"`,
      })
    }
  }

  // ── VERDICT ─────────────────────────────────────────────────
  if (fin.final_risk_level !== undefined) {
    const level = data.commands?.incident_level ?? "UNKNOWN"
    const mins = fin.final_minutes_until_critical
    events.push({
      id: uid(), time: t, tag: "VERDICT", isNew: true,
      text: `${level} — ${(fin.final_primary_danger ?? "?").toUpperCase()} | zone=${( fin.final_most_dangerous_zone ?? "?").toUpperCase()}${mins ? ` | T-minus ${mins} min` : fin.final_is_critical ? " | CRITICAL NOW" : ""}`,
    })
    if (fin.final_reasoning) {
      events.push({
        id: uid(), time: t, tag: "VERDICT", isNew: true,
        text: `"${fin.final_reasoning.slice(0, 160)}"`,
      })
    }
    if (fin.call_emergency_services) {
      events.push({
        id: uid(), time: t, tag: "ALERT", isNew: true,
        text: "🚨 EMERGENCY SERVICES REQUIRED — dispatching police + ambulance",
      })
    }
  }

  // ── COMMANDS (first 3) ──────────────────────────────────────
  const cmds = data.commands?.radio_commands ?? []
  cmds.slice(0, 3).forEach(cmd => {
    events.push({
      id: uid(), time: t, tag: "COMMAND", isNew: true,
      text: cmd.replace(/^[🔴🟠🟡🟢]\s?/, ""),
    })
  })

  // ── TREND ───────────────────────────────────────────────────
  const hist = data.risk_history ?? []
  if (hist.length >= 3) {
    const diff = hist[0] - hist[Math.min(2, hist.length - 1)]
    if (Math.abs(diff) >= 2) {
      events.push({
        id: uid(), time: t, tag: "TREND", isNew: true,
        text: diff > 0
          ? `⚠ ESCALATION — risk +${diff} pts over last 3 cycles (${hist[Math.min(2, hist.length-1)]}→${hist[0]})`
          : `✓ De-escalation — risk ${diff} pts (${hist[Math.min(2, hist.length-1)]}→${hist[0]})`,
      })
    }
  }

  return events
}

// ── Boot sequence ──────────────────────────────────────────────
const BOOT: StreamEvent[] = [
  { id: "b0", time: "--:--:--", tag: "BOOT", text: "CrowdSense AI tactical intelligence system initialising..." },
  { id: "b1", time: "--:--:--", tag: "BOOT", text: "Vision pipeline ready — Llama 4 Scout 17B multimodal (Groq)" },
  { id: "b2", time: "--:--:--", tag: "BOOT", text: "Reasoning engine ready — Llama 3.3 70B adversarial dual-model" },
  { id: "b3", time: "--:--:--", tag: "BOOT", text: "Audio module ready — Whisper/small speech transcription (local CPU)" },
  { id: "b4", time: "--:--:--", tag: "BOOT", text: "4 camera sources registered — awaiting feeds" },
  { id: "b5", time: "--:--:--", tag: "INFO", text: "All systems nominal. Use Demo buttons or upload a video to begin analysis." },
]

// ── Main Component ─────────────────────────────────────────────
export function LiveReasoningStream({ data }: { data: BackendData | null }) {
  const [events, setEvents] = useState<StreamEvent[]>(BOOT)
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  // Synthesise events on each new analysis cycle
  useEffect(() => {
    if (!data) return
    const count = data.analysis_count ?? 0
    if (count === prevCountRef.current) return
    prevCountRef.current = count

    setIsThinking(true)
    const t = setTimeout(() => setIsThinking(false), 2500)

    const sep: StreamEvent = {
      id: uid(), time: nowStr(), tag: "INFO",
      text: `──────────── Analysis cycle #${count} ────────────`,
    }
    const newEvts = synthesiseEvents(data)
    setEvents(prev => [...prev, sep, ...newEvts].slice(-150))
    return () => clearTimeout(t)
  }, [data?.analysis_count])

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [events])

  const risk = data?.final?.final_risk_level ?? 0
  const camCount = data?.active_cameras?.length ?? 0

  return (
    <div className="flex flex-col bg-[#03060d] border border-[#1a2332] rounded-md overflow-hidden" style={{ minHeight: 340 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2332] flex-shrink-0 bg-[rgba(0,212,255,0.02)]">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#00d4ff] uppercase border-l-[3px] border-[#00d4ff] pl-2">
            AI Reasoning Stream
          </div>
          <AnimatePresence>
            {isThinking && (
              <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2 }} />
                ))}
                <span className="font-mono text-[10px] text-[#00d4ff] ml-1 tracking-widest">THINKING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3">
          {risk >= 7 && (
            <motion.div
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: "rgba(255,34,68,0.15)", color: "#ff2244", border: "1px solid rgba(255,34,68,0.4)" }}
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
              ● THREAT ACTIVE
            </motion.div>
          )}
          <span className="font-mono text-[9px] text-[#3a5060]">{events.length} events</span>
        </div>
      </div>

      {/* Stream body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5"
        style={{ maxHeight: 360, scrollbarWidth: "thin", scrollbarColor: "#1a2332 transparent" }}>
        {events.map((evt, idx) => {
          const cfg = TAG_STYLE[evt.tag] ?? TAG_STYLE.INFO
          const isLast = idx === events.length - 1
          return (
            <motion.div key={evt.id} className="flex items-start gap-2 py-[3px]"
              initial={evt.isNew ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}>
              {/* Timestamp */}
              <span className="font-mono text-[9px] text-[#2a3a44] flex-shrink-0 mt-0.5 w-[58px]">{evt.time}</span>
              {/* Tag */}
              <span className="font-mono text-[8px] font-bold tracking-[0.12em] flex-shrink-0 px-1.5 py-0.5 rounded mt-0.5"
                style={{ background: cfg.bg, color: cfg.color, minWidth: 54, textAlign: "center" }}>
                {cfg.label}
              </span>
              {/* Text */}
              <span className="font-mono text-[11px] leading-relaxed flex-1"
                style={{
                  color: evt.tag === "INFO"    ? "#3a5060"
                       : evt.tag === "ALERT"   ? "#ff2244"
                       : evt.tag === "VERDICT" ? "#e0eeff"
                       : evt.tag === "COMMAND" ? "#ffaa44"
                       : evt.tag === "JUNIOR"  ? "#ffe44d"
                       : evt.tag === "CRITIC"  ? "#ff8c00"
                       : evt.tag === "AUDIO"   ? "#c4b5fd"
                       : evt.tag === "TREND"   ? "#00ff9d"
                       : "#8ab4c8"
                }}>
                {evt.text}
              </span>
              {/* Blinking cursor on last line */}
              {isLast && (
                <motion.span className="w-1.5 h-3.5 bg-[#00d4ff] flex-shrink-0 mt-0.5"
                  animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a2332] flex-shrink-0 bg-[rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span className="font-mono text-[9px] text-[#4a6a7a] tracking-wider">MONITORING ACTIVE</span>
        </div>
        <span className="font-mono text-[9px] text-[#2a3a44]">
          Cycle #{data?.analysis_count ?? 0} · Dual-model · {camCount} camera{camCount !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto font-mono text-[10px] font-bold"
          style={{ color: risk >= 7 ? "#ff2244" : risk >= 4 ? "#ff8c00" : "#00ff9d" }}>
          RISK {risk}/10
        </div>
      </div>
    </div>
  )
}
