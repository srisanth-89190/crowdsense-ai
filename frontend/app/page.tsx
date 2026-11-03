"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Eye, 
  Shield,
  Zap,
  Wifi,
  AlertTriangle
} from "lucide-react"

// Floating Icon Component
function FloatingIcon({ 
  icon, 
  startX, 
  startY, 
  duration, 
  delay 
}: { 
  icon: "signal" | "wifi" | "shield" | "chevron"
  startX: string
  startY: string
  duration: number
  delay: number 
}) {
  const iconPaths: Record<string, React.ReactNode> = {
    signal: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/40">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
      </svg>
    ),
    wifi: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/40">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" />
      </svg>
    ),
    shield: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/30">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    chevron: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500/30">
        <path d="M9 18l6-6-6-6" />
      </svg>
    )
  }

  return (
    <motion.div
      initial={{ x: startX, y: startY, opacity: 0 }}
      animate={{ 
        x: ["0%", "10%", "-5%", "0%"],
        y: ["0%", "-15%", "10%", "0%"],
        opacity: [0, 0.6, 0.6, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute"
      style={{ left: startX, top: startY }}
    >
      {iconPaths[icon]}
    </motion.div>
  )
}

// Horizontal Scan Line Component
function ScanLine({ delay, yPosition }: { delay: number; yPosition: string }) {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: "200%", opacity: [0, 0.6, 0.6, 0] }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 2
      }}
      className="absolute h-[1px] w-1/3"
      style={{ top: yPosition }}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
    </motion.div>
  )
}

// Hexagon Background Pattern with Animations
function HexagonBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0a0d12]" />
      
      {/* Hexagonal grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
            <path 
              d="M28 0 L56 16.67 L56 50 L28 66.67 L0 50 L0 16.67 Z M28 100 L56 83.33 L56 116.67 L28 133.33 L0 116.67 L0 83.33 Z M84 50 L112 66.67 L112 100 L84 116.67 L56 100 L56 66.67 Z M-28 50 L0 66.67 L0 100 L-28 116.67 L-56 100 L-56 66.67 Z" 
              fill="none" 
              stroke="rgba(0, 180, 216, 0.2)" 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
      
      {/* Radial glow from top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.1)_0%,transparent_60%)]" />
      
      {/* Horizontal scan lines - animated */}
      <ScanLine delay={0} yPosition="20%" />
      <ScanLine delay={1.5} yPosition="45%" />
      <ScanLine delay={3} yPosition="70%" />
      <ScanLine delay={4.5} yPosition="85%" />
      
      {/* Floating tech icons - animated */}
      <FloatingIcon icon="signal" startX="5%" startY="25%" duration={8} delay={0} />
      <FloatingIcon icon="wifi" startX="8%" startY="60%" duration={10} delay={1} />
      <FloatingIcon icon="shield" startX="92%" startY="30%" duration={9} delay={0.5} />
      <FloatingIcon icon="chevron" startX="90%" startY="70%" duration={7} delay={2} />
      <FloatingIcon icon="signal" startX="3%" startY="80%" duration={11} delay={3} />
      <FloatingIcon icon="chevron" startX="95%" startY="50%" duration={8} delay={1.5} />
      
      {/* Horizontal glow streaks */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[60%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent"
      />
      
      {/* Corner frame elements - animated */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 left-6"
      >
        <div className="w-16 h-16 border-l-2 border-t-2 border-cyan-500/50" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-6 right-6"
      >
        <div className="w-16 h-16 border-r-2 border-t-2 border-cyan-500/50" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-6 left-6"
      >
        <div className="w-16 h-16 border-l-2 border-b-2 border-cyan-500/50" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-6 right-6"
      >
        <div className="w-16 h-16 border-r-2 border-b-2 border-cyan-500/50" />
      </motion.div>

      {/* Additional animated decorative elements */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-6"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-500/30">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [0, 10, 0],
          opacity: [0.15, 0.35, 0.15]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-6"
      >
        <Eye className="w-8 h-8 text-cyan-500/30" />
      </motion.div>
    </div>
  )
}

// Decrypt Text Animation Component
function DecryptText({ 
  text, 
  className = "", 
  delay = 0 
}: { 
  text: string
  className?: string
  delay?: number 
}) {
  const [displayText, setDisplayText] = useState("")
  const [isDecrypting, setIsDecrypting] = useState(true)
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*!?<>{}[]"
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let iteration = 0
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " "
              if (index < iteration) return text[index]
              return characters[Math.floor(Math.random() * characters.length)]
            })
            .join("")
        )
        
        iteration += 0.5
        
        if (iteration > text.length) {
          clearInterval(interval)
          setDisplayText(text)
          setIsDecrypting(false)
        }
      }, 40)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [text, delay])
  
  return (
    <span className={className} suppressHydrationWarning>
      {displayText || text.split("").map(() => characters[Math.floor(Math.random() * characters.length)]).join("")}
    </span>
  )
}

// System Status Indicator
function SystemStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center gap-3 mb-12"
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      <span className="font-mono text-sm tracking-[0.2em] text-gray-400">SYSTEM ONLINE</span>
      <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
    </motion.div>
  )
}

// Main Title with Warning Icon
function MainTitle() {
  return (
    <div className="relative mb-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center justify-center gap-4 mb-4"
      >
        {/* Warning Triangle Icon */}
        <div className="relative">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 80 80" 
            className="text-red-500"
          >
            <path 
              d="M40 8 L72 68 L8 68 Z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
              className="drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            />
            <text 
              x="40" 
              y="52" 
              textAnchor="middle" 
              fill="currentColor" 
              fontSize="28" 
              fontWeight="bold"
              className="drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            >
              !
            </text>
          </svg>
        </div>
        
        {/* CrowdSense AI Title */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
          <DecryptText 
            text="Crowd" 
            className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            delay={300}
          />
          <DecryptText 
            text="Sense AI" 
            className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
            delay={600}
          />
        </h1>
      </motion.div>
    </div>
  )
}

// Subtitle Section
function Subtitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="text-center mb-4"
    >
      <h2 className="text-2xl md:text-3xl text-gray-300 font-light tracking-wide">
        Real-Time Crowd Panic Detection
      </h2>
    </motion.div>
  )
}

// Tagline
function Tagline() {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="text-gray-500 text-lg mb-16 text-center"
    >
      Detect danger before it becomes disaster
    </motion.p>
  )
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  iconColor,
  delay 
}: { 
  icon: React.ElementType
  title: string
  description: string
  iconColor: string
  delay: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div 
        className={`
          relative p-8 rounded-2xl border transition-all duration-500
          ${isHovered 
            ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,0.15)]' 
            : 'bg-[#0d1117]/80 border-gray-700/50 hover:border-gray-600'
          }
        `}
      >
        {/* Icon */}
        <div className={`mb-6 transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <Icon 
            className={`w-10 h-10 ${iconColor} ${isHovered ? 'drop-shadow-[0_0_15px_currentColor]' : ''}`}
          />
        </div>
        
        {/* Title */}
        <h3 className={`
          text-xl font-semibold mb-3 transition-colors duration-300
          ${isHovered ? 'text-white' : 'text-gray-200'}
        `}>
          {title}
        </h3>
        
        {/* Description */}
        <p className={`
          text-sm leading-relaxed transition-colors duration-300
          ${isHovered ? 'text-cyan-100' : 'text-gray-400'}
        `}>
          {description}
        </p>
      </div>
    </motion.div>
  )
}

// Feature Cards Section
function FeatureCards() {
  const features = [
    {
      icon: Eye,
      title: "Vision Analysis",
      description: "Real-time crowd density and movement detection using advanced computer vision",
      iconColor: "text-cyan-400",
      delay: 1.4
    },
    {
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeOpacity="0" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h2M16 12h2" />
          <path d="M4 12c0-1 1-2 2-2M18 12c0-1-1-2-2-2" />
          <path d="M4 12c0 1 1 2 2 2M18 12c0 1-1 2-2 2" />
        </svg>
      ),
      title: "Audio Processing",
      description: "Panic detection through sophisticated sound pattern analysis",
      iconColor: "text-cyan-400",
      delay: 1.6
    },
    {
      icon: Shield,
      title: "AI Reasoning",
      description: "Multi-model threat assessment with critic validation",
      iconColor: "text-green-400",
      delay: 1.8
    }
  ]

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 px-6">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  )
}

// CTA Button
function CTAButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 2 }}
      className="flex justify-center mb-20"
    >
      <Link 
        href="/dashboard"
        className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105"
      >
        <Zap className="w-5 h-5" />
        <span>ACTIVATE CONTROL PANEL</span>
        <svg 
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </Link>
    </motion.div>
  )
}

// Stats Section
function StatsSection() {
  const stats = [
    { value: "99.7%", label: "Accuracy" },
    { value: "<100ms", label: "Response Time" },
    { value: "24/7", label: "Monitoring" }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 2.2 }}
      className="flex justify-center gap-8 md:gap-16"
    >
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          {/* Icon above stat */}
          <div className="flex justify-center mb-3">
            {index === 0 && <Wifi className="w-6 h-6 text-green-400/50" />}
            {index === 1 && (
              <svg className="w-6 h-6 text-cyan-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            )}
            {index === 2 && <Shield className="w-6 h-6 text-cyan-400/50" />}
          </div>
          
          {/* Stat container */}
          <div className="relative px-6 py-4 bg-[#0d1117]/60 border border-gray-700/50 rounded-lg">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500/50" />
            
            <div className="font-mono text-3xl md:text-4xl font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0d12] text-white overflow-hidden">
      <HexagonBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12">
        <SystemStatus />
        <MainTitle />
        <Subtitle />
        <Tagline />
        <FeatureCards />
        <CTAButton />
        <StatsSection />
      </div>
    </main>
  )
}
