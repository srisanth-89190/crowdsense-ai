"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Camera, Power, Circle, Maximize2 } from "lucide-react"

interface WebcamFeedProps {
  label: string
  isActive: boolean
  onToggle: () => void
  customFrame?: string
  isMonitoring?: boolean
}

export function WebcamFeed({ label, isActive, onToggle, customFrame, isMonitoring = false }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureInProgressRef = useRef(false)
  const shouldRunRef = useRef(false)
  const monitoringRef = useRef(isMonitoring)
  const [fps, setFps] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // CAM 01 = local webcam, others = backend frame stream
  const isLocalWebcam = label.includes("01")

  const startCamera = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Camera requires HTTPS or localhost in a supported browser")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15, max: 30 },
        },
      })
      if (!shouldRunRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      streamRef.current = stream
      setError(null)
    } catch (err) {
      console.error("Webcam access denied:", err)
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Camera permission blocked — allow camera access in browser site settings")
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("No compatible camera found — connect or enable a camera")
      } else if (name === "NotReadableError" || name === "AbortError") {
        setError("Camera is busy — close other apps or tabs using it, then retry")
      } else {
        setError("Could not start camera — check browser permission and camera connection")
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const sendFrame = useCallback(async () => {
    const video = videoRef.current
    if (!monitoringRef.current || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || captureInProgressRef.current) return

    const canvas = document.createElement("canvas")
    const scale = Math.min(1, 640 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.75))
    if (!blob) return

    captureInProgressRef.current = true
    try {
      const formData = new FormData()
      formData.append("frame", blob, "camera-frame.jpg")
      const response = await fetch("http://127.0.0.1:8080/live/frame", { method: "POST", body: formData })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.detail ?? `Camera frame upload failed (HTTP ${response.status})`)
      }
      setFps(1)
      setError(null)
    } catch (err) {
      console.error("Camera frame upload failed:", err)
      setError("Camera is on, but backend frame transfer failed — check that live monitoring is running")
    } finally {
      captureInProgressRef.current = false
    }
  }, [])

  useEffect(() => {
    monitoringRef.current = isMonitoring
  }, [isMonitoring])

  useEffect(() => {
    if (isActive && isLocalWebcam) {
      shouldRunRef.current = true
      startCamera()
      const interval = setInterval(sendFrame, 1000)
      return () => {
        shouldRunRef.current = false
        clearInterval(interval)
        stopCamera()
      }
    } else if (!isActive) {
      shouldRunRef.current = false
      setFps(0)
      if (isLocalWebcam) stopCamera()
    }
  }, [isActive, isLocalWebcam, startCamera, stopCamera, sendFrame])

  return (
    <motion.div 
      className="relative bg-[#07090f] border border-[rgba(0,212,255,0.18)] rounded-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Camera Label */}
      <div className="absolute top-2 left-2 z-20 bg-black/70 text-[#00d4ff] font-mono text-[9px] md:text-[11px] px-2 py-1 rounded border border-[rgba(0,212,255,0.4)] tracking-wider">
        {label}
      </div>
      
      {/* Live Indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff0000] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff0000]"></span>
          </span>
          <span className="font-mono text-[9px] md:text-[10px] text-[#ff0000]">LIVE</span>
        </div>
      )}
      
      {/* Video Container */}
      <div className="aspect-video bg-[#05080d] relative">
        {/* CAM-01: always show live browser webcam — never replace with backend JPEG */}
        {isLocalWebcam && isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                <div className="bg-[#05080d] border border-[#ff3a3a] px-4 py-2 rounded text-[#ff3a3a] font-mono text-xs uppercase tracking-widest">
                  {error}
                </div>
              </div>
            )}
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-30" animate={{ top: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#00d4ff]/60" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#00d4ff]/60" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#00d4ff]/60" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#00d4ff]/60" />
              <motion.div className="absolute border-2 border-[#00ff9d] rounded" style={{ width: '15%', height: '25%' }} animate={{ left: ['20%', '60%', '30%', '50%'], top: ['30%', '50%', '20%', '40%'], opacity: [0.8, 0.6, 0.8, 0.6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              <motion.div className="absolute border-2 border-[#ffd000] rounded" style={{ width: '12%', height: '20%' }} animate={{ left: ['50%', '25%', '65%', '35%'], top: ['45%', '25%', '55%', '35%'], opacity: [0.6, 0.8, 0.6, 0.8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded font-mono text-[9px] md:text-[10px] text-[#00ff9d]">{fps} FPS</div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded font-mono text-[9px] md:text-[10px] text-[#00d4ff] flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              {isMonitoring ? "AI PROCESSING" : "CAMERA PREVIEW"}
            </div>
          </>
        ) : !isLocalWebcam && customFrame ? (
          /* CAM-02: show backend frame stream */
          <>
            <img src={`data:image/jpeg;base64,${customFrame}`} className="w-full h-full object-cover" alt="camera feed" />
            <div className="absolute inset-0 pointer-events-none">
              <motion.div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-30" animate={{ top: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded font-mono text-[9px] md:text-[10px] text-[#00d4ff] flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              AI PROCESSING
            </div>
          </>
        ) : isActive && !isLocalWebcam ? (
          /* CAM-02 active but no frame yet */
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <span className="font-mono text-[10px] text-[#5a6f85] mt-2">LOADING FEED...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Camera className="w-8 h-8 md:w-12 md:h-12 text-[#5a6f85] mb-2" />
            <span className="font-mono text-[10px] md:text-xs text-[#5a6f85]">CAMERA OFFLINE</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-[#05080d] border-t border-[#1a2332]">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded font-mono text-[9px] md:text-[10px] tracking-wider transition-all ${
            isActive 
              ? 'bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/40 hover:bg-[#ff0000]/30' 
              : 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 hover:bg-[#00d4ff]/30'
          }`}
        >
          <Power className="w-3 h-3" />
          {isActive ? 'STOP' : 'START'}
        </button>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded border border-[#1a2332] text-[#5a6f85] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition-colors">
            <Circle className="w-3 h-3" />
          </button>
          <button className="p-1.5 rounded border border-[#1a2332] text-[#5a6f85] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition-colors">
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
