# ============================================================
# reasoning.py
# PURPOSE: The brain - takes vision data and infers danger
# OWNER: Your name
# ============================================================

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()

if _PROVIDER == "amd":
    API_URL = os.getenv("AMD_TEXT_URL", "https://api.inference.amd.com/v1/chat/completions")
    API_KEY = os.getenv("AMD_API_KEY", "")
    MODEL   = os.getenv("AMD_TEXT_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
    print(f"[Reasoning] Provider: AMD  |  Model: {MODEL}")
else:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    API_KEY = os.getenv("GROQ_API_KEY", "")
    MODEL   = "qwen/qwen3.8-27b"
    print(f"[Reasoning] Provider: Groq  |  Model: {MODEL}")

if not API_KEY:
    print("[Reasoning] API key not set - check .env")


def reason_about_scene(vision_data):
    """
    Takes vision analysis dictionary (or fused dict),
    reasons deeply about what is REALLY happening,
    returns structured risk assessment
    """

    # Handle both raw vision dict and fused dict from fusion.py
    if "vision" in vision_data and isinstance(vision_data["vision"], dict):
        vision = vision_data["vision"]
    else:
        vision = vision_data

    # Handle concern_areas being either a list or string
    concern_areas = vision.get('concern_areas', 'none')
    if isinstance(concern_areas, list):
        concern_areas = '; '.join(str(c) for c in concern_areas)

    scene_text = f"""
CROWD VISION DATA:
- Overall Density: {vision.get('crowd_density', 'unknown')}
- Movement Pattern: {vision.get('movement_pattern', 'unknown')}
- People Behavior: {', '.join(vision.get('body_language', []))}
- Visible Distress Signs: {vision.get('visible_distress', False)}
- Estimated People Count: {vision.get('crowd_count_estimate', 0)}
- Bottleneck Detected: {vision.get('bottleneck_detected', False)} — {vision.get('bottleneck_location', 'none')}
- Immediate Threats: {', '.join(vision.get('immediate_threats', ['none']))}
- Exits Status: {vision.get('visible_exits_status', 'unknown')}
- Safe Direction: {vision.get('safe_direction', 'unknown')}
- Problem Areas: {concern_areas}

ZONE-BY-ZONE BREAKDOWN:
- North Zone: {vision.get('zone_descriptions', {}).get('north', 'unknown')}
- South Zone: {vision.get('zone_descriptions', {}).get('south', 'unknown')}
- East Zone: {vision.get('zone_descriptions', {}).get('east', 'unknown')}
- West Zone: {vision.get('zone_descriptions', {}).get('west', 'unknown')}
"""

    prompt = f"""You are a world-class crowd safety expert with 20 years of experience managing stadium evacuations, concert crushes, and mass casualty events. You have personally handled the Hillsborough disaster analysis and Love Parade crush investigation.

Analyze this real-time crowd intelligence feed and predict what will happen in the next 5-15 minutes.

{scene_text}

Your analysis must go BEYOND description — infer physics, human psychology, and crowd dynamics:
1. What is the crowd's collective unconscious intent right now?
2. Where are pressure waves building that cameras can't directly see?
3. Which zone will reach critical density first and why?
4. What is the exact chain of events that leads to a crush or stampede?
5. How many minutes before the point of no return?

Respond ONLY in this exact JSON format, no extra text:
{{
  "collective_intent": "panic/celebration/evacuation/normal/confusion/surge",
  "risk_level": <integer 1-10>,
  "primary_danger": "stampede/crush/bottleneck/surge/suffocation/none",
  "most_dangerous_zone": "north/south/east/west/center",
  "second_dangerous_zone": "north/south/east/west/center/none",
  "minutes_until_critical": <integer or null if already critical>,
  "is_already_critical": <true or false>,
  "key_risk_factor": "<single sentence — the ONE physical mechanism causing the most danger>",
  "reasoning": "<2-3 sentences of expert-level assessment explaining the crowd dynamics, pressure points, and predicted trajectory>",
  "confidence": <integer 0-100>
}}"""

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    for attempt in range(3):
        try:
            response = requests.post(
                API_URL,
                headers=headers,
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 350,
                    "temperature": 0.1
                },
                timeout=30
            )
            data = response.json()
            if "choices" not in data:
                err = data.get("error", {})
                if err.get("code") == "rate_limit_exceeded" and attempt < 2:
                    import time as _t
                    wait = 10 * (attempt + 1)
                    print(f"[Reasoning] Rate limit — waiting {wait}s (attempt {attempt+1}/3)")
                    _t.sleep(wait)
                    continue
                raise ValueError(f"API error: {err.get('message', data)}")

            ai_text = data["choices"][0]["message"]["content"]
            start = ai_text.find("{")
            end = ai_text.rfind("}") + 1
            result = json.loads(ai_text[start:end])
            return result

        except requests.exceptions.ConnectionError:
            print("[Reasoning] Network error - cannot reach API")
            break
        except Exception as e:
            print(f"[Reasoning] Failed (attempt {attempt+1}): {str(e).encode('ascii', 'backslashreplace').decode('ascii')}")
            if attempt < 2:
                import time as _t; _t.sleep(5)
            continue

    # All attempts failed — return safe fallback
    return {
        "collective_intent": "unknown",
        "risk_level": 5,
        "primary_danger": "unknown",
        "most_dangerous_zone": "south",
        "second_dangerous_zone": "none",
        "minutes_until_critical": 5,
        "is_already_critical": False,
        "key_risk_factor": "Analysis failed — treat as medium risk",
        "reasoning": "AI reasoning unavailable. Defaulting to medium risk. Check API key and network.",
        "confidence": 0
    }