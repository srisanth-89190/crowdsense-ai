"use client"

import { motion } from "framer-motion"

interface IntelPanelProps {
  type: "junior" | "senior"
  title: string
  children: React.ReactNode
}

export function IntelPanel({ type, title, children }: IntelPanelProps) {
  const isJunior = type === "junior"
  
  return (
    <motion.div 
      className={`bg-[#0a0f18] border border-[#1a2332] rounded-md p-4 md:p-5 h-full ${
        isJunior 
          ? 'border-l-[3px] border-l-[#5a6f85]' 
          : 'border-l-[3px] border-l-[#00d4ff]'
      }`}
      style={!isJunior ? { boxShadow: '0 0 18px rgba(0, 212, 255, 0.15)' } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: isJunior ? 0 : 0.1 }}
    >
      <div className={`font-mono text-[10px] md:text-[11px] tracking-[0.15em] md:tracking-[0.2em] uppercase mb-3 ${
        isJunior ? 'text-[#8aa0b4]' : 'text-[#00d4ff]'
      }`}>
        {isJunior ? '⚙' : '★'} {title}
      </div>
      <div className="text-xs md:text-[13px] leading-relaxed text-[#cfdde9]">
        {children}
      </div>
    </motion.div>
  )
}

export function DiffAdd({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[rgba(0,212,255,0.15)] text-[#00d4ff] px-1 rounded text-xs">
      {children}
    </span>
  )
}

export function DiffRemove({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[rgba(255,0,0,0.15)] text-[#ff6677] line-through px-1 rounded text-xs">
      {children}
    </span>
  )
}
