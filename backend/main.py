# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import tempfile, os
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.vision_layer  import analyze_video
from backend.audio_layer   import analyze_audio
from backend.fusion        import fuse_inputs
from backend.reasoning     import reason_about_scene
from backend.critic        import critique_and_refine
from backend.action_agent  import generate_superintendent_commands
from backend.live_monitor  import start_monitoring, stop_monitoring, state
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="CrowdSense AI", version="1.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Serve demo videos as static files so frontend can load them
if os.path.exists("demo"):
    app.mount("/demo", StaticFiles(directory="demo"), name="demo")

# Shared thread pool — reused across requests
_executor = ThreadPoolExecutor(max_workers=4)


# ── ROUTES ───────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "CrowdSense AI running", "version": "1.0"}


@app.post("/analyze")
async def analyze_video_upload(
    video: UploadFile = File(...),
    audio_scenario: str = "auto"   # auto | fight | panic | crush | evacuation | normal
):
    """
    One-shot: upload video → full parallel pipeline → results.
    audio_scenario overrides Whisper with a realistic crowd audio context
    when the video has no useful audio track.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
        f.write(await video.read())
        path = f.name

    # Realistic audio scenarios for crowd events
    AUDIO_SCENARIOS = {
        "fight": {
            "transcription": "stop it, get off me, help, fight, security, move back, stop stop stop",
            "panic_words_detected": 5,
            "panic_words_found": ["stop", "help", "back", "move", "fight"],
            "screaming_likely": True,
            "audio_concern_level": "high",
            "audio_risk_score": 7,
            "analysis_success": True,
            "scenario_note": "Fight detected — aggressive shouting, calls for security"
        },
        "panic": {
            "transcription": "run run run, get out, emergency, help us, move move, out of the way, please help",
            "panic_words_detected": 7,
            "panic_words_found": ["run", "emergency", "help", "out", "move", "please"],
            "screaming_likely": True,
            "audio_concern_level": "critical",
            "audio_risk_score": 9,
            "analysis_success": True,
            "scenario_note": "Mass panic — crowd running, screaming for exit"
        },
        "crush": {
            "transcription": "push back, stop pushing, I can't breathe, help, crush, back up, stop",
            "panic_words_detected": 6,
            "panic_words_found": ["push", "back", "help", "crush", "stop"],
            "screaming_likely": True,
            "audio_concern_level": "critical",
            "audio_risk_score": 10,
            "analysis_success": True,
            "scenario_note": "Crowd crush — people screaming they cannot breathe, pushing"
        },
        "evacuation": {
            "transcription": "please exit calmly, move to the exits, this way please, keep moving, exit now",
            "panic_words_detected": 2,
            "panic_words_found": ["exit", "move"],
            "screaming_likely": False,
            "audio_concern_level": "medium",
            "audio_risk_score": 4,
            "analysis_success": True,
            "scenario_note": "Controlled evacuation — PA system directing crowd to exits"
        },
        "normal": {
            "transcription": "background crowd noise, music, general chatter",
            "panic_words_detected": 0,
            "panic_words_found": [],
            "screaming_likely": False,
            "audio_concern_level": "low",
            "audio_risk_score": 1,
            "analysis_success": True,
            "scenario_note": "Normal crowd ambience"
        },
    }

    try:
        import asyncio
        loop = asyncio.get_event_loop()

        # ── STAGE 1: Vision + Audio in parallel ──────────────
        vision_future = loop.run_in_executor(_executor, analyze_video, path)

        if audio_scenario != "auto" and audio_scenario in AUDIO_SCENARIOS:
            # Use injected audio scenario instead of Whisper
            audio = AUDIO_SCENARIOS[audio_scenario]
            vision = await vision_future
        else:
            # Run real Whisper audio analysis
            audio_future = loop.run_in_executor(_executor, analyze_audio, path)
            vision, audio = await asyncio.gather(vision_future, audio_future)

        if not vision or vision.get("analysis_success") is False:
            analysis_error = (vision or {}).get("analysis_error", "")
            if "invalid api key" in analysis_error.lower():
                detail = (
                    "Groq rejected the configured API key. Replace GROQ_API_KEY in the project .env "
                    "with a valid key, then restart the backend."
                )
            else:
                detail = (
                    f"Vision analysis failed: {analysis_error}"
                    if analysis_error
                    else "Vision analysis failed. Check the backend console for details."
                )
            raise HTTPException(
                status_code=503,
                detail=detail
            )

        # ── STAGE 2: Fuse ─────────────────────────────────────
        fused = fuse_inputs(vision, audio)

        # ── STAGE 3: Reasoning → Critic ───────────────────────
        initial = await loop.run_in_executor(_executor, reason_about_scene, fused)
        final   = await loop.run_in_executor(_executor, critique_and_refine, vision, initial)

        crowd_count = vision.get("crowd_count_estimate", 0) if vision else 0
        commands = generate_superintendent_commands(final, {}, crowd_count)

        return {
            "success": True,
            "vision": vision, "audio": audio,
            "initial": initial, "final": final,
            "commands": commands,
            "audio_scenario_used": audio_scenario
        }
    finally:
        try:
            os.remove(path)
        except Exception:
            pass


@app.post("/live/start")
def start_live():
    """Start live monitoring with dual cameras."""
    start_monitoring()
    return {"status": "live monitoring started; waiting for browser camera frames"}


@app.post("/live/frame")
async def receive_live_frame(frame: UploadFile = File(...)):
    """Receive a webcam frame captured by the browser and share it with analysis."""
    if not state.is_running:
        raise HTTPException(status_code=409, detail="Start live monitoring before sending camera frames.")

    if frame.content_type != "image/jpeg":
        raise HTTPException(status_code=415, detail="Camera frames must be JPEG images.")

    contents = await frame.read(5 * 1024 * 1024 + 1)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Camera frame exceeds the 5 MB limit.")

    image = cv2.imdecode(np.frombuffer(contents, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode the camera frame.")

    state.update_frame("CAM-1", image)
    return {"status": "frame received"}


@app.post("/live/stop")
def stop_live():
    stop_monitoring()
    return {"status": "stopped"}


@app.post("/demo/scenario")
async def inject_demo_scenario(scenario: str = "critical"):
    """
    Inject a realistic demo scenario directly into system state.
    Runs the full AI reasoning + critic + commands pipeline on synthetic crowd data.
    scenario = "normal" | "elevated" | "critical" | "catastrophic"
    """
    import asyncio
    loop = asyncio.get_event_loop()

    # Realistic synthetic vision data for each scenario
    scenarios = {
        "normal": {
            "crowd_density": "medium", "crowd_count_estimate": 120,
            "movement_pattern": "calm", "visible_distress": False,
            "body_language": ["walking", "standing", "chatting"],
            "zone_descriptions": {"north": "crowded", "south": "clear", "east": "crowded", "west": "clear"},
            "visible_exits_status": "open_and_clear", "bottleneck_detected": False,
            "bottleneck_location": "none", "immediate_threats": ["none"],
            "safe_direction": "multiple", "risk_score": 3,
            "scene_description": "Moderate crowd moving calmly through venue entrance area.",
            "concern_areas": "none"
        },
        "elevated": {
            "crowd_density": "high", "crowd_count_estimate": 380,
            "movement_pattern": "converging", "visible_distress": False,
            "body_language": ["pushing forward", "shoulder-to-shoulder", "slow movement"],
            "zone_descriptions": {"north": "danger", "south": "crowded", "east": "crowded", "west": "clear"},
            "visible_exits_status": "partially_blocked", "bottleneck_detected": True,
            "bottleneck_location": "North gate entrance — crowd converging on single entry point",
            "immediate_threats": ["bottleneck forming at north gate", "restricted movement in north zone"],
            "safe_direction": "west", "risk_score": 6,
            "scene_description": "Dense crowd converging on north gate, movement restricted, bottleneck forming.",
            "concern_areas": "North gate bottleneck — 380 persons competing for single entry"
        },
        "critical": {
            "crowd_density": "high", "crowd_count_estimate": 650,
            "movement_pattern": "pushing", "visible_distress": True,
            "body_language": ["pushing", "stumbling", "arms raised", "people falling", "panic faces"],
            "zone_descriptions": {"north": "danger", "south": "danger", "east": "crowded", "west": "clear"},
            "visible_exits_status": "partially_blocked", "bottleneck_detected": True,
            "bottleneck_location": "South stage area — crowd surge toward stage barrier",
            "immediate_threats": ["crowd crush imminent at south barrier", "people falling near stage", "exit E2 blocked by crowd"],
            "safe_direction": "west", "risk_score": 8,
            "scene_description": "Critical crowd surge at south stage — people pushing, some falling, crush risk imminent.",
            "concern_areas": "South stage crush — 650 persons, barrier overwhelmed, people falling"
        },
        "catastrophic": {
            "crowd_density": "critical", "crowd_count_estimate": 1200,
            "movement_pattern": "chaotic", "visible_distress": True,
            "body_language": ["running", "screaming", "falling", "trampling", "panic", "fighting crowd pressure"],
            "zone_descriptions": {"north": "danger", "south": "danger", "east": "danger", "west": "crowded"},
            "visible_exits_status": "blocked", "bottleneck_detected": True,
            "bottleneck_location": "All exits — crowd blocking all egress points simultaneously",
            "immediate_threats": ["active crowd crush", "people being trampled", "all exits blocked", "mass panic spreading"],
            "safe_direction": "west", "risk_score": 10,
            "scene_description": "CATASTROPHIC: Mass panic, 1200+ persons, active trampling, all exits blocked, immediate evacuation required.",
            "concern_areas": "FULL VENUE CRITICAL — mass panic, trampling, blocked exits"
        }
    }

    vision = scenarios.get(scenario, scenarios["critical"])
    audio = {
        "transcription": {
            "normal": "background chatter, music",
            "elevated": "loud crowd noise, some shouting",
            "critical": "screaming, help, move back, push, stop pushing",
            "catastrophic": "screaming, help us, fire, run, emergency, people dying"
        }.get(scenario, "screaming, help, emergency"),
        "panic_words_detected": {"normal": 0, "elevated": 1, "critical": 4, "catastrophic": 8}.get(scenario, 4),
        "panic_words_found": {"normal": [], "elevated": ["push"], "critical": ["help", "stop", "push", "back"], "catastrophic": ["help", "fire", "run", "emergency", "dying", "stop", "push", "back"]}.get(scenario, []),
        "screaming_likely": scenario in ("critical", "catastrophic"),
        "audio_concern_level": {"normal": "low", "elevated": "medium", "critical": "high", "catastrophic": "critical"}.get(scenario, "high"),
        "audio_risk_score": {"normal": 1, "elevated": 3, "critical": 7, "catastrophic": 10}.get(scenario, 7),
        "analysis_success": True
    }

    fused = fuse_inputs(vision, audio)
    initial = await loop.run_in_executor(_executor, reason_about_scene, fused)
    final = await loop.run_in_executor(_executor, critique_and_refine, vision, initial)
    crowd_count = vision["crowd_count_estimate"]
    # Never force is_critical from demo data — let AI risk score decide
    final["final_is_critical"] = final.get("final_risk_level", 0) >= 9
    commands = generate_superintendent_commands(final, {}, crowd_count)

    # Inject into live state so dashboard picks it up
    state.update_vision("CAM-DEMO", vision)
    state.update_audio(audio)
    state.update_full_analysis(fused, initial, final, commands)
    state.is_running = True

    # Add dramatic alerts
    alert_messages = {
        "normal": [("INFO", "Demo scenario: Normal operations — 120 persons, calm movement")],
        "elevated": [("WARN", "Demo scenario: Elevated risk — bottleneck forming at North gate"), ("WARN", "CAM-DEMO — high density — risk 6/10 — 380 persons")],
        "critical": [("CRIT", "🚨 Demo scenario: CRITICAL — crowd crush imminent at South barrier"), ("CRIT", "CAM-DEMO — people falling — risk 8/10 — 650 persons"), ("WARN", "Audio: screaming detected — panic words: help, stop, push")],
        "catastrophic": [("CRIT", "🚨🚨 Demo scenario: CATASTROPHIC — mass panic, 1200+ persons"), ("CRIT", "ALL EXITS BLOCKED — active trampling — EVACUATE NOW"), ("CRIT", "Audio: mass screaming — 8 panic words detected"), ("CRIT", f"AI Assessment: {final.get('final_reasoning', '')[:80]}")]
    }
    for level, msg in alert_messages.get(scenario, []):
        state.add_alert(level, msg)

    return {
        "success": True,
        "scenario": scenario,
        "risk_level": final.get("final_risk_level"),
        "incident_level": commands.get("incident_level"),
        "crowd_count": crowd_count
    }


@app.post("/demo/reset")
def reset_demo():
    """Reset demo state back to idle."""
    state.is_running = False
    with state._lock:
        state.vision_results.clear()
        state.audio_result = {}
        state.initial_result = {}
        state.final_result = {}
        state.commands = {}
        state.current_risk = 0
        state.alert_log.clear()
    return {"success": True}


@app.get("/live/status")
def live_status():
    """Dashboard polls this every 2 seconds to get fresh data."""
    return JSONResponse(content=state.get_snapshot())
