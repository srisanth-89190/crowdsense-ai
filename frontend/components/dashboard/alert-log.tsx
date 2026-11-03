"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef } from "react"

export interface Alert {
  id: string
  time: string
  severity: "info" | "warn" | "crit"
  message: string
}

interface AlertLogProps {
  alerts: Alert[]
}

const severityStyles = {
  info: { class: "sev-info", label: "INFO" },
  warn: { class: "sev-warn", label: "WARN" },
  crit: { class: "sev-crit", label: "CRIT" }
}

export function AlertLog({ alerts }: AlertLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [alerts])

  return (
    <motion.div 
      ref={scrollRef}
      className="bg-[#05080d] border border-[#1a2332] rounded-md p-3 md:p-4 max-h-[200px] md:max-h-[260px] overflow-y-auto font-mono text-[10px] md:text-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <motion.div 
            key={alert.id}
            className="flex flex-wrap md:flex-nowrap gap-2 md:gap-4 py-1.5 md:py-2 border-b border-[#11161f] last:border-b-0"
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-[#5a6f85] w-full md:w-auto">{alert.time}</div>
            <div className={`font-bold min-w-[50px] md:min-w-[80px] ${severityStyles[alert.severity].class}`}>
              [{severityStyles[alert.severity].label}]
            </div>
            <div className="text-[#cfdde9] flex-1 w-full md:w-auto">{alert.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
