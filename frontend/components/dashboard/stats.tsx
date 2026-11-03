"use client"

import { motion } from "framer-motion"

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <motion.div
      className={`font-mono text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.25em] text-[#00d4ff] uppercase border-l-[3px] border-[#00d4ff] pl-2 md:pl-3 my-3 md:my-4 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  colorClass?: string
  showBar?: boolean
  barPercent?: number
}

export function StatCard({ label, value, subtext, colorClass = "text-[#00d4ff]", showBar, barPercent }: StatCardProps) {
  return (
    <motion.div 
      className="bg-gradient-to-b from-[#0f1722] to-[#0a0f18] border border-[#1a2332] rounded-md p-3 md:p-5 text-center h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] text-[#5a6f85] uppercase mb-2">
        {label}
      </div>
      <div className={`font-mono text-3xl md:text-[42px] font-bold leading-none ${colorClass}`}>
        {value}
      </div>
      {showBar && (
        <div className="h-2 md:h-2.5 bg-[#0a0f18] rounded-full overflow-hidden mt-3 md:mt-4 border border-[#1a2332]">
          <motion.div 
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00d4ff 0%, #ff6600 60%, #ff0000 100%)'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${barPercent || 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      )}
      {subtext && (
        <div className="font-mono text-[9px] md:text-[11px] text-[#8aa0b4] mt-2 tracking-wider">
          {subtext}
        </div>
      )}
    </motion.div>
  )
}

interface LevelBadgeProps {
  level: number
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const names: Record<number, string> = {
    1: "LEVEL 1 - NORMAL",
    2: "LEVEL 2 - ADVISORY",
    3: "LEVEL 3 - CAUTION",
    4: "LEVEL 4 - ELEVATED",
    5: "LEVEL 5 - CRITICAL"
  }

  return (
    <motion.div 
      className="bg-gradient-to-b from-[#0f1722] to-[#0a0f18] border border-[#1a2332] rounded-md p-3 md:p-5 text-center h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] text-[#5a6f85] uppercase mb-3 md:mb-4">
        Incident Level
      </div>
      <div className="mb-2 md:mb-3">
        <span className={`inline-block px-3 md:px-5 py-2 md:py-3 font-mono text-sm md:text-lg font-bold tracking-[0.15em] md:tracking-[0.2em] rounded border-2 lvl-${level}`}>
          {names[level]}
        </span>
      </div>
      <div className="font-mono text-[9px] md:text-[11px] text-[#8aa0b4] tracking-wider">
        PROTOCOL - CSP-{level}-A - ACK REQUIRED
      </div>
    </motion.div>
  )
}
