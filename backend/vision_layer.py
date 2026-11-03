# ============================================================
# vision_layer.py — FINAL VERSION
# Handles: webcam live / video file / multiple CCTV feeds
# ============================================================

import cv2
import base64
import requests
import json
import threading
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# ============================================================
# CONFIG — driven entirely by .env AI_PROVIDER
# ============================================================
load_dotenv()

_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()

if _PROVIDER == "amd":
    VISION_API_URL = os.getenv("AMD_VISION_URL", "https://api.inference.amd.com/v1/chat/completions")
    VISION_API_KEY = os.getenv("AMD_API_KEY", "")
    VISION_MODEL   = os.getenv("AMD_VISION_MODEL", "Qwen/Qwen2-VL-7B-Instruct")
    print(f"[VisionLayer] Provider: AMD  |  Model: {VISION_MODEL}")
else:
    VISION_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    VISION_API_KEY = os.getenv("GROQ_API_KEY", "")
    VISION_MODEL   = "qwen/qwen3.8-27b"
    print(f"[VisionLayer] Provider: Groq  |  Model: {VISION_MODEL}")

if not VISION_API_KEY:
    print(f"[VisionLayer] API key not set - check .env ({_PROVIDER.upper()}_API_KEY)")

# ============================================================
# VENUE MAP — System learns the venue on startup
# This is what makes it feel like a real security system
# ============================================================
VENUE_MAP = {
    "exits": {
        "E1": "North Main Exit — capacity 300/min",
        "E2": "South Emergency Exit — capacity 150/min",
        "E3": "East Side Exit — capacity 200/min",
        "E4": "West Gate — capacity 250/min"
    },
    "zones": {
        "north": "Main entrance area — highest incoming flow",
        "south": "Stage/event area — densest crowd zone",
        "east": "Food court — moderate density",
        "west": "Parking access — natural dispersal route"
    },
    "total_capacity": 5000,
    "officer_positions": {
        "post_1": "North Gate",
        "post_2": "South Barrier",
        "post_3": "East Corridor",
        "post_4": "West Gate",
        "post_5": "Center Command",
        "post_6": "Emergency Post"
    }
}


def frame_to_base64(frame):
    """Convert OpenCV frame to base64 string for API — compressed for speed"""
    # Resize to max 640px wide to reduce payload size and API latency
    h, w = frame.shape[:2]
    if w > 640:
        scale = 640 / w
        frame = cv2.resize(frame, (640, int(h * scale)), interpolation=cv2.INTER_AREA)
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return base64.b64encode(buffer).decode('utf-8')


def analyze_frame(frame, camera_id="CAM-1", venue_context=""):
    """Send one frame to vision AI and get crowd analysis"""

    image_b64 = frame_to_base64(frame)

    prompt = f"""You are an expert crowd safety AI for a real-time security command center. Your job is to ACCURATELY assess risk — not to be conservative. Underestimating risk costs lives.

CAMERA: {camera_id}  |  TIME: {datetime.now().strftime('%H:%M:%S')}

VENUE CONTEXT:
{venue_context if venue_context else "Large public venue, capacity 5000, 4 exits (North/South/East/West)"}

━━━ STRICT CALIBRATION — USE THESE THRESHOLDS ━━━

CROWD DENSITY (count visible people carefully):
  empty    = 0–5 people visible
  low      = 6–30 people, free movement everywhere
  medium   = 31–100 people, some congestion forming
  high     = 101–300 people, movement restricted, shoulder-to-shoulder
  critical = 300+ people visible OR any pushing/crushing/falling observed

RISK SCORE (be aggressive — err on the side of caution):
  1–2  = Empty or sparse, no concerns
  3–4  = Normal crowd, monitor only
  5–6  = Elevated — density building, preventive action needed
  7–8  = HIGH RISK — bottlenecks, restricted movement, distress signs visible
  9–10 = CRITICAL — crushing imminent, people falling, immediate evacuation

MOVEMENT PATTERNS that raise risk:
  - People pushing against each other → risk +3
  - Crowd converging on single point → risk +3
  - People unable to move freely → risk +2
  - Running or rushing → risk +2
  - People looking back in fear → risk +2
  - Bottleneck at exit → risk +3

⚠️ DO NOT default to low scores. If you see 50+ people in a confined space, that is AT LEAST medium density and risk 4+. If movement is restricted, risk is 6+.

Analyze this image now and return ONLY this JSON:
{{
  "crowd_density": "empty/low/medium/high/critical",
  "crowd_count_estimate": <count every visible person carefully>,
  "movement_pattern": "stationary/calm/moving/rushing/chaotic/converging/dispersing/pushing",
  "visible_distress": true or false,
  "body_language": ["specific behaviors you observe"],
  "zone_descriptions": {{
    "north": "clear/crowded/blocked/danger",
    "south": "clear/crowded/blocked/danger",
    "east": "clear/crowded/blocked/danger",
    "west": "clear/crowded/blocked/danger"
  }},
  "visible_exits_status": "open_and_clear/partially_blocked/blocked/not_visible",
  "bottleneck_detected": true or false,
  "bottleneck_location": "exact location or none",
  "immediate_threats": ["specific dangers observed, or none"],
  "safe_direction": "north/south/east/west/multiple",
  "risk_score": <integer 1-10, calibrated strictly to thresholds above>,
  "scene_description": "one precise sentence: count, density, movement, any danger"
}}"""

    headers = {
        "Authorization": f"Bearer {VISION_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            VISION_API_URL,
            headers=headers,
            json={
                "model": VISION_MODEL,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                    ]
                }],
                "response_format": {"type": "json_object"},
                "max_tokens": 600,
                "temperature": 0.1
            },
            timeout=30
        )

        response_json = response.json()
        if "choices" not in response_json:
            print(f"[Vision] Unexpected API response: {json.dumps(response_json, ensure_ascii=True)}")
            return _fallback_result(f"API Error: {response_json.get('error', {}).get('message', 'Unknown')}")

        text = response_json["choices"][0]["message"]["content"]
        print(f"[Vision] Received raw response: {json.dumps(text[:200], ensure_ascii=True)}")
        
        start, end = text.find("{"), text.rfind("}") + 1
        if start == -1 or end == 0:
            print(f"[Vision] No JSON found in text: {json.dumps(text, ensure_ascii=True)}")
            return _fallback_result("No JSON found in AI response")
            
        return json.loads(text[start:end])

    except requests.exceptions.ConnectionError as e:
        print(f"[Vision] Network error - check internet connection: {str(e).encode('ascii', 'backslashreplace').decode('ascii')}")
        return _fallback_result("Network unreachable — check internet connection")
    except requests.exceptions.Timeout:
        print("[Vision] Request timed out")
        return _fallback_result("API request timed out")
    except Exception as e:
        print(f"[Vision] Analysis failed: {str(e).encode('ascii', 'backslashreplace').decode('ascii')}")
        return _fallback_result(str(e))

def _fallback_result(reason: str):
    return {
        "analysis_success": False,
        "analysis_error": reason,
        "crowd_density": "unknown",
        "crowd_count_estimate": 0,
        "movement_pattern": "unknown",
        "visible_distress": False,
        "body_language": [f"Analysis failed: {reason}"],
        "zone_descriptions": {
            "north": "unknown",
            "south": "unknown",
            "east": "unknown",
            "west": "unknown"
        },
        "visible_exits_status": "unknown",
        "bottleneck_detected": False,
        "bottleneck_location": "none",
        "immediate_threats": ["none"],
        "safe_direction": "unknown",
        "risk_score": 0,
        "scene_description": f"Vision API analysis failed: {reason}"
    }
def analyze_video(video_path, camera_id="CAM-1"):
    """
    Analyze a video file by sampling one frame from the middle.
    This is used for one-shot analysis of uploaded files.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        return None

    # Get total frames and go to middle
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)

    success, frame = cap.read()
    cap.release()

    if success:
        return analyze_frame(frame, camera_id)
    return None


# ============================================================
# LIVE WEBCAM FEED — Analyzes your laptop camera in real time
# ============================================================

# Shared storage for latest results from each camera
camera_results = {}
camera_frames = {}

def run_camera_feed(source, camera_id):
    """
    Runs a camera feed in background thread.
    source = 0 for webcam, or "path/to/video.mp4"
    """
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"Cannot open {camera_id}")
        return

    venue_context = f"""
    Venue exits: {json.dumps(VENUE_MAP['exits'])}
    Zone layout: {json.dumps(VENUE_MAP['zones'])}
    Total venue capacity: {VENUE_MAP['total_capacity']}
    """

    frame_count = 0
    print(f"{camera_id} started")

    while True:
        success, frame = cap.read()

        if not success:
            # If video ended, loop it (for demo purposes)
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Store latest frame for dashboard display
        camera_frames[camera_id] = frame

        # Analyze every 60 frames (every 2 seconds)
        if frame_count % 60 == 0:
            print(f"Analyzing {camera_id} frame {frame_count}...")
            result = analyze_frame(frame, camera_id, venue_context)
            if result:
                result["camera_id"] = camera_id
                result["timestamp"] = datetime.now().strftime("%H:%M:%S")
                camera_results[camera_id] = result

        frame_count += 1
        time.sleep(0.033)  # ~30fps display

    cap.release()


def start_webcam(camera_index=0, camera_id="WEBCAM-1"):
    """Start live webcam analysis in background"""
    thread = threading.Thread(
        target=run_camera_feed,
        args=(camera_index, camera_id),
        daemon=True
    )
    thread.start()
    return thread


def start_video_file(video_path, camera_id="CAM-1"):
    """Start video file analysis in background (for demo)"""
    thread = threading.Thread(
        target=run_camera_feed,
        args=(video_path, camera_id),
        daemon=True
    )
    thread.start()
    return thread


def get_latest_results():
    """Get latest analysis from all cameras"""
    return dict(camera_results)


def get_latest_frames():
    """Get latest video frames from all cameras"""
    return dict(camera_frames)