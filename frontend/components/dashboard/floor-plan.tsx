"use client"

import { motion } from "framer-motion"

interface FloorPlanProps {
  zoneData?: {
    north?: string
    south?: string
    east?: string
    west?: string
  }
  riskScore: number
}

export function VenueFloorPlan({ zoneData, riskScore }: FloorPlanProps) {
  // Determine colors based on risk score or zone descriptions
  // For simplicity, we use the global risk score to scale the zone colors,
  // but if zoneData mentions 'danger' or 'blocked', we could color specifically.
  
  const getZoneColor = (zone: 'north' | 'south' | 'east' | 'west') => {
    const data = zoneData?.[zone] || ""
    if (data.includes("danger") || data.includes("blocked")) return "rgba(255, 58, 58, 0.4)" // Red
    if (data.includes("crowded")) return "rgba(255, 102, 0, 0.4)" // Orange
    if (riskScore >= 7) return "rgba(255, 102, 0, 0.2)" // Orange-ish
    if (riskScore >= 4) return "rgba(255, 208, 0, 0.2)" // Yellow
    return "rgba(0, 255, 157, 0.15)" // Green
  }

  const getBorderColor = (zone: 'north' | 'south' | 'east' | 'west') => {
    const data = zoneData?.[zone] || ""
    if (data.includes("danger") || data.includes("blocked")) return "#ff3a3a"
    if (data.includes("crowded")) return "#ff6600"
    if (riskScore >= 7) return "#ff6600"
    if (riskScore >= 4) return "#ffd000"
    return "#00ff9d"
  }

  return (
    <div className="relative w-full aspect-video bg-[#05080d] border border-[#1a2332] rounded-lg p-4 flex flex-col">
      <div className="absolute top-2 left-2 z-20 bg-black/70 text-[#00d4ff] font-mono text-[9px] md:text-[11px] px-2 py-1 rounded border border-[rgba(0,212,255,0.4)] tracking-wider">
        VENUE TOPOLOGY MAP
      </div>
      
      <div className="flex-1 mt-6 relative border-2 border-[#1a2332] rounded bg-[#0a0d12]">
        {/* SVG Floor Plan */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          {/* North Zone */}
          <motion.rect 
            x="100" y="0" width="200" height="80" 
            fill={getZoneColor('north')} 
            stroke={getBorderColor('north')} 
            strokeWidth="2" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
          />
          <text x="200" y="45" fill="white" fontSize="12" fontFamily="monospace" textAnchor="middle" className="opacity-70">NORTH (ENTRANCE)</text>
          
          {/* South Zone */}
          <motion.rect 
            x="100" y="120" width="200" height="80" 
            fill={getZoneColor('south')} 
            stroke={getBorderColor('south')} 
            strokeWidth="2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}
          />
          <text x="200" y="165" fill="white" fontSize="12" fontFamily="monospace" textAnchor="middle" className="opacity-70">SOUTH (STAGE)</text>
          
          {/* West Zone */}
          <motion.rect 
            x="0" y="0" width="100" height="200" 
            fill={getZoneColor('west')} 
            stroke={getBorderColor('west')} 
            strokeWidth="2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
          />
          <text x="50" y="105" fill="white" fontSize="12" fontFamily="monospace" textAnchor="middle" className="opacity-70">WEST</text>
          
          {/* East Zone */}
          <motion.rect 
            x="300" y="0" width="100" height="200" 
            fill={getZoneColor('east')} 
            stroke={getBorderColor('east')} 
            strokeWidth="2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
          />
          <text x="350" y="105" fill="white" fontSize="12" fontFamily="monospace" textAnchor="middle" className="opacity-70">EAST</text>
          
          {/* Center Connector */}
          <rect x="100" y="80" width="200" height="40" fill="#0d1117" stroke="#1a2332" strokeWidth="1" />
          <text x="200" y="105" fill="#5a6f85" fontSize="10" fontFamily="monospace" textAnchor="middle">CENTER HUB</text>
        </svg>

        {/* Animated Scanning Line */}
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-50 pointer-events-none"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  )
}
