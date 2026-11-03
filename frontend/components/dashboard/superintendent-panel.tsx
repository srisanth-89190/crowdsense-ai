"use client"

import { motion } from "framer-motion"

interface Command {
  type: "blue" | "orange" | "red" | "green"
  label: string
  text: string
}

interface ExitStatus {
  name: string
  status: "open" | "partial" | "congested" | "blocked"
  flow: string
  action: string
}

interface SuperintendentPanelProps {
  commands: Command[]
  exits: ExitStatus[]
  paMessage: string
}

const bulletColors = {
  blue: "#00d4ff",
  orange: "#ff6600",
  red: "#ff0000",
  green: "#00ff9d"
}

const statusColors = {
  open: "status-open",
  partial: "status-partial",
  congested: "status-congested",
  blocked: "status-blocked"
}

const statusLabels = {
  open: "OPEN",
  partial: "PARTIAL",
  congested: "CONGESTED",
  blocked: "BLOCKED"
}

export function SuperintendentPanel({ commands, exits, paMessage }: SuperintendentPanelProps) {
  return (
    <motion.div 
      className="bg-[#05080d] border border-[#1a2332] rounded-md p-4 md:p-6 mt-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="font-mono text-[10px] md:text-[11px] tracking-[0.2em] md:tracking-[0.25em] text-[#00d4ff] uppercase border-l-[3px] border-[#00d4ff] pl-2 md:pl-3 mb-4 md:mb-5">
        Superintendent - Active Commands
      </div>

      {/* Commands List */}
      <div className="space-y-0">
        {commands.map((cmd, i) => (
          <motion.div 
            key={i}
            className="flex items-start gap-2 md:gap-3 py-2 md:py-3 border-b border-dashed border-[#1a2332] last:border-b-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <div 
              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ 
                backgroundColor: bulletColors[cmd.type],
                boxShadow: `0 0 8px ${bulletColors[cmd.type]}`
              }}
            />
            <div className="font-mono text-[10px] md:text-[13px] text-[#8aa0b4] min-w-[60px] md:min-w-[90px]">
              {cmd.label}
            </div>
            <div className="font-mono text-[10px] md:text-[13px] text-[#e6f7ff] flex-1" dangerouslySetInnerHTML={{ __html: cmd.text }} />
          </motion.div>
        ))}
      </div>

      {/* Exit Status Table */}
      <div className="overflow-x-auto mt-4 md:mt-5">
        <table className="w-full border-collapse font-mono text-[10px] md:text-xs">
          <thead>
            <tr className="bg-[#0f1722]">
              <th className="text-left p-2 md:p-3 text-[#00d4ff] text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] border-b border-[rgba(0,212,255,0.25)]">EXIT</th>
              <th className="text-left p-2 md:p-3 text-[#00d4ff] text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] border-b border-[rgba(0,212,255,0.25)]">STATUS</th>
              <th className="text-left p-2 md:p-3 text-[#00d4ff] text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] border-b border-[rgba(0,212,255,0.25)] hidden sm:table-cell">FLOW (P/MIN)</th>
              <th className="text-left p-2 md:p-3 text-[#00d4ff] text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] border-b border-[rgba(0,212,255,0.25)]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {exits.map((exit, i) => (
              <motion.tr 
                key={i}
                className="border-b border-[#1a2332]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              >
                <td className="p-2 md:p-3 text-[#cfdde9]">{exit.name}</td>
                <td className={`p-2 md:p-3 ${statusColors[exit.status]}`}>{statusLabels[exit.status]}</td>
                <td className="p-2 md:p-3 text-[#cfdde9] hidden sm:table-cell">{exit.flow}</td>
                <td className="p-2 md:p-3 text-[#cfdde9]">{exit.action}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PA Announcement */}
      <motion.div 
        className="mt-4 md:mt-5 p-3 md:p-4 rounded border-2 border-[#ffd000] border-l-[5px]"
        style={{
          background: 'linear-gradient(180deg, #2a2200 0%, #1a1500 100%)',
          boxShadow: '0 0 22px rgba(255, 208, 0, 0.2)'
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <span className="inline-block bg-[#ffd000] text-black font-mono font-bold text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-2 py-1 rounded mb-2 md:mb-3">
          ★ PA SCRIPT - READ NOW
        </span>
        <p className="font-mono text-xs md:text-[13px] text-[#fff5b8] leading-relaxed">
          {paMessage}
        </p>
      </motion.div>
    </motion.div>
  )
}
