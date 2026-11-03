"use client"

import { motion } from "framer-motion"

export function DashboardBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      
      {/* Cyber grid */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Radial glow top */}
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_60%)]" />
      
      {/* Radial glow bottom left */}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,255,157,0.04)_0%,transparent_60%)]" />
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#00ff9d' : '#ff6600',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.015) 50%, transparent 100%)',
          height: '30%'
        }}
        animate={{ y: ['-100%', '400%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-[#00d4ff]/10" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-[#00d4ff]/10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-[#00d4ff]/10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-[#00d4ff]/10" />
    </div>
  )
}
