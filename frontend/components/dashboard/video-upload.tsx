"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Upload, Play, Pause, RotateCcw, Film, Mic } from "lucide-react"

export interface VideoAnalysisResult {
  success: boolean
  vision: any
  audio: any
  initial: any
  final: any
  commands: any
  audio_scenario_used?: string
}

type AudioScenario = "auto" | "normal" | "fight" | "panic" | "crush" | "evacuation"

const AUDIO_SCENARIOS: { value: AudioScenario; label: string; color: string; desc: string }[] = [
  { value: "auto",       label: "AUTO",       color: "#00d4ff", desc: "Real Whisper transcription" },
  { value: "normal",     label: "NORMAL",     color: "#00ff9d", desc: "Calm crowd ambience" },
  { value: "fight",      label: "FIGHT",      color: "#ffd000", desc: "Shouting, calls for security" },
  { value: "panic",      label: "PANIC",      color: "#ff6600", desc: "Mass panic, running, screaming" },
  { value: "crush",      label: "CRUSH",      color: "#ff0000", desc: "Can't breathe, crowd crush" },
  { value: "evacuation", label: "EVACUATION", color: "#a78bfa", desc: "PA directing crowd to exits" },
]

interface VideoUploadProps {
  label: string
  defaultVideo?: string   // URL to auto-load (e.g. "/demo/panic_crowd.mp4" from backend)
  onVideoAnalysis?: (isAnalyzing: boolean) => void
  onAnalysisResult?: (result: VideoAnalysisResult) => void
}

export function VideoUpload({ label, defaultVideo, onVideoAnalysis, onAnalysisResult }: VideoUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [audioScenario, setAudioScenario] = useState<AudioScenario>("auto")
  const [showScenarioPicker, setShowScenarioPicker] = useState(false)

  // Auto-load default video from backend on mount
  useEffect(() => {
    if (!defaultVideo) return
    const backendUrl = `http://127.0.0.1:8080${defaultVideo}`
    fetch(backendUrl, { method: "HEAD" })
      .then(r => {
        if (r.ok) {
          setVideoUrl(backendUrl)
          // Store a reference so sendToBackend can fetch it
          fileRef.current = null  // no File object, URL will be used directly
        }
      })
      .catch(() => {}) // backend not running yet, ignore
  }, [defaultVideo])

  const handleFile = useCallback((file: File) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, MOV, AVI)')
      return
    }
    const url = URL.createObjectURL(file)
    fileRef.current = file
    setVideoUrl(url)
    setIsPlaying(false)
    setIsAnalyzing(false)
    setProgress(0)
    setDetectedCount(null)
    setAnalysisError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleFile(file)
  }, [handleFile])

  const sendToBackend = useCallback(async (file: File | null) => {
    try {
      let res: Response
      const url = `http://127.0.0.1:8080/analyze?audio_scenario=${audioScenario}`

      if (file) {
        // Uploaded file — send as multipart
        const formData = new FormData()
        formData.append("video", file)
        res = await fetch(url, { method: "POST", body: formData })
      } else if (defaultVideo) {
        // Default video — fetch from backend static, re-upload as blob
        const videoRes = await fetch(`http://127.0.0.1:8080${defaultVideo}`)
        const blob = await videoRes.blob()
        const formData = new FormData()
        formData.append("video", blob, "panic_crowd.mp4")
        res = await fetch(url, { method: "POST", body: formData })
      } else {
        throw new Error("No video source")
      }

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(error?.detail ?? `HTTP ${res.status}`)
      }
      const result: VideoAnalysisResult = await res.json()
      setDetectedCount(result.vision?.crowd_count_estimate ?? null)
      onAnalysisResult?.(result)
    } catch (err: any) {
      console.error("Video analysis failed:", err)
      setAnalysisError(err?.name === "TypeError" ? "Backend offline — start the server first" : `Analysis failed: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
      onVideoAnalysis?.(false)
    }
  }, [audioScenario, defaultVideo, onAnalysisResult, onVideoAnalysis])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
      if (!isAnalyzing) {
        setIsAnalyzing(true)
        setAnalysisError(null)
        onVideoAnalysis?.(true)
        sendToBackend(fileRef.current)
      }
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, isAnalyzing, onVideoAnalysis, sendToBackend])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false); setIsAnalyzing(false); onVideoAnalysis?.(false)
  }, [onVideoAnalysis])

  const resetVideo = useCallback(() => {
    setVideoUrl(null); setIsPlaying(false); setIsAnalyzing(false)
    setProgress(0); setDetectedCount(null); setAnalysisError(null)
    fileRef.current = null
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const selectedScenario = AUDIO_SCENARIOS.find(s => s.value === audioScenario)!

  return (
    <motion.div
      className="relative bg-[#07090f] border border-[rgba(0,212,255,0.18)] rounded-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
    >
      {/* Camera Label */}
      <div className="absolute top-2 left-2 z-20 bg-black/70 text-[#00d4ff] font-mono text-[9px] md:text-[11px] px-2 py-1 rounded border border-[rgba(0,212,255,0.4)] tracking-wider">
        {label}
      </div>

      {/* Analyzing Indicator */}
      {isAnalyzing && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded">
          <motion.span className="w-2 h-2 rounded-full bg-[#ffd000]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <span className="font-mono text-[9px] md:text-[10px] text-[#ffd000]">ANALYZING</span>
        </div>
      )}

      {/* Video Container */}
      <div className="aspect-video bg-[#05080d] relative">
        {videoUrl ? (
          <>
            <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
            {isAnalyzing && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.3) 1px,transparent 1px)`, backgroundSize: '30px 30px' }} />
                <motion.div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd000] to-transparent" animate={{ top: ['0%','100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <motion.div className="absolute border-2 border-[#00ff9d] rounded" style={{ width:'18%', height:'28%' }} animate={{ left:['15%','55%','25%'], top:['25%','45%','35%'], opacity:[0.7,1,0.7] }} transition={{ duration: 3, repeat: Infinity }} />
                <motion.div className="absolute border-2 border-[#ff6600] rounded" style={{ width:'14%', height:'22%' }} animate={{ left:['55%','30%','60%'], top:['40%','20%','50%'], opacity:[1,0.7,1] }} transition={{ duration: 4, repeat: Infinity }} />
                <div className="absolute top-4 left-4 bg-black/70 px-2 py-1 rounded font-mono text-[10px] text-[#00d4ff]">
                  DETECTED: <span className="text-[#00ff9d]">{detectedCount !== null ? detectedCount : "..."}</span>
                </div>
                {/* Audio scenario badge */}
                <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded font-mono text-[9px] flex items-center gap-1" style={{ color: selectedScenario.color }}>
                  <Mic className="w-2.5 h-2.5" />
                  {selectedScenario.label}
                </div>
              </div>
            )}
            {analysisError && (
              <div className="absolute bottom-8 left-2 right-2 bg-black/80 px-2 py-1 rounded font-mono text-[9px] text-[#ff3a3a] text-center">{analysisError}</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a2332]">
              <motion.div className="h-full bg-[#00d4ff]" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <div
            className={`flex flex-col items-center justify-center h-full border-2 border-dashed m-2 rounded-lg transition-colors cursor-pointer ${isDragging ? 'border-[#00d4ff] bg-[#00d4ff]/5' : 'border-[#1a2332] hover:border-[#00d4ff]/50'}`}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" className="hidden" onChange={handleFileInput} />
            <Upload className={`w-8 h-8 md:w-10 md:h-10 mb-2 ${isDragging ? 'text-[#00d4ff]' : 'text-[#5a6f85]'}`} />
            <span className="font-mono text-[9px] md:text-xs text-[#5a6f85] text-center px-4">DROP VIDEO OR CLICK TO UPLOAD</span>
            <span className="font-mono text-[8px] md:text-[10px] text-[#3a4a5a] mt-1">MP4, WebM, MOV, AVI</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[#05080d] border-t border-[#1a2332]">
        {/* Audio scenario picker */}
        <div className="px-2 pt-2 pb-1">
          <div className="flex items-center gap-1 flex-wrap">
            <Mic className="w-2.5 h-2.5 text-[#5a6f85] flex-shrink-0" />
            <span className="font-mono text-[8px] text-[#5a6f85] uppercase tracking-wider mr-1">Audio:</span>
            {AUDIO_SCENARIOS.map(s => (
              <button key={s.value} onClick={() => setAudioScenario(s.value)}
                title={s.desc}
                className="px-1.5 py-0.5 font-mono text-[8px] rounded transition-all border"
                style={{
                  borderColor: audioScenario === s.value ? s.color : 'rgba(26,35,50,1)',
                  color: audioScenario === s.value ? s.color : '#4a6a7a',
                  background: audioScenario === s.value ? `${s.color}15` : 'transparent',
                  fontWeight: audioScenario === s.value ? 700 : 400,
                }}>
                {s.label}
              </button>
            ))}
          </div>
          {audioScenario !== "auto" && (
            <div className="font-mono text-[8px] mt-1 pl-4" style={{ color: selectedScenario.color }}>
              ↳ {selectedScenario.desc}
            </div>
          )}
        </div>

        {/* Play/Reset */}
        <div className="flex items-center justify-between px-2 pb-2">
          {videoUrl ? (
            <>
              <button onClick={togglePlay}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded font-mono text-[9px] md:text-[10px] tracking-wider bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 hover:bg-[#00d4ff]/30 transition-all">
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isPlaying ? 'PAUSE' : 'ANALYZE'}
              </button>
              <button onClick={resetVideo} className="p-1.5 rounded border border-[#1a2332] text-[#5a6f85] hover:text-[#ff0000] hover:border-[#ff0000]/40 transition-colors">
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[#5a6f85] font-mono text-[9px] md:text-[10px]">
              <Film className="w-3 h-3" />
              NO VIDEO LOADED
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}