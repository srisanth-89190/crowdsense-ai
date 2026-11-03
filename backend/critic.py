# ============================================================
# critic.py
# PURPOSE: Second AI that checks and improves first AI's work
# This is YOUR biggest differentiator in the hackathon
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
    print(f"[Critic] Provider: AMD  |  Model: {MODEL}")
else:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    API_KEY = os.getenv("GROQ_API_KEY", "")
    MODEL   = "qwen/qwen3.8-27b"
    print(f"[Critic] Provider: Groq  |  Model: {MODEL}")

if not API_KEY:
    print("[Critic] API key not set - check .env")


def critique_and_refine(vision_data, initial_assessment):
    """
    Takes the initial AI assessment and challenges it.
    Looks for mistakes, missed risks, or false alarms.
    Returns improved final assessment.
    """

    # Handle concern_areas being either a list or string
    concern_areas = vision_data.get('concern_areas', 'none')
    if isinstance(concern_areas, list):
        concern_areas = '; '.join(concern_areas)

    prompt = f"""You are the SENIOR crowd safety director reviewing a junior analyst's report. You have final authority. Your job is to challenge, correct, and improve — not rubber-stamp.

ORIGINAL SCENE DATA:
- Crowd density: {vision_data.get('crowd_density')}
- Movement: {vision_data.get('movement_pattern')}
- Behavior: {', '.join(vision_data.get('body_language', []))}
- Distress visible: {vision_data.get('visible_distress')}
- People count: {vision_data.get('crowd_count_estimate')}
- Bottleneck: {vision_data.get('bottleneck_detected')} at {vision_data.get('bottleneck_location', 'none')}
- Immediate threats: {', '.join(vision_data.get('immediate_threats', ['none']))}
- Problem areas: {concern_areas}
- Zone North: {vision_data.get('zone_descriptions', {}).get('north', 'unknown')}
- Zone South: {vision_data.get('zone_descriptions', {}).get('south', 'unknown')}
- Zone East: {vision_data.get('zone_descriptions', {}).get('east', 'unknown')}
- Zone West: {vision_data.get('zone_descriptions', {}).get('west', 'unknown')}

JUNIOR ANALYST'S ASSESSMENT:
- Risk Level: {initial_assessment.get('risk_level')}/10
- Situation: {initial_assessment.get('collective_intent')}
- Primary Danger: {initial_assessment.get('primary_danger')}
- Most Dangerous Zone: {initial_assessment.get('most_dangerous_zone')}
- Minutes Until Critical: {initial_assessment.get('minutes_until_critical')}
- Key Risk: {initial_assessment.get('key_risk_factor')}
- Reasoning: {initial_assessment.get('reasoning')}
- Confidence: {initial_assessment.get('confidence')}%

As senior director, critically evaluate:
1. Is the risk level calibrated correctly? (Overreaction causes panic; underreaction causes deaths)
2. Did they correctly identify the most dangerous zone based on crowd physics?
3. Is the time estimate realistic given the density and movement data?
4. What crowd dynamics did they miss? (Compression waves, exit blocking, herding behavior)
5. Does this require emergency services or can venue security handle it?

Respond ONLY in this exact JSON format, no extra text:
{{
  "final_risk_level": <integer 1-10>,
  "final_collective_intent": "panic/celebration/evacuation/normal/confusion/surge",
  "final_primary_danger": "stampede/crush/bottleneck/surge/suffocation/none",
  "final_most_dangerous_zone": "north/south/east/west/center",
  "final_minutes_until_critical": <integer or null>,
  "final_is_critical": <true or false>,
  "what_junior_missed": "<specific crowd dynamics or data point the junior analyst overlooked>",
  "what_junior_got_right": "<what they correctly identified>",
  "final_key_risk": "<the single most critical risk factor right now>",
  "final_reasoning": "<your authoritative 2-3 sentence assessment with specific crowd physics reasoning>",
  "call_emergency_services": <true or false>,
  "final_confidence": <integer 0-100>
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
                    "max_tokens": 400,
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
                    print(f"[Critic] Rate limit — waiting {wait}s (attempt {attempt+1}/3)")
                    _t.sleep(wait)
                    continue
                raise ValueError(f"API error: {err.get('message', data)}")

            ai_text = data["choices"][0]["message"]["content"]
            start = ai_text.find("{")
            end = ai_text.rfind("}") + 1
            return json.loads(ai_text[start:end])

        except requests.exceptions.ConnectionError:
            print("[Critic] Network error")
            break
        except Exception as e:
            print(f"[Critic] Failed (attempt {attempt+1}): {str(e).encode('ascii', 'backslashreplace').decode('ascii')}")
            if attempt < 2:
                import time as _t; _t.sleep(5)
            continue

    # All attempts failed — pass through initial assessment
    return {
        "final_risk_level": initial_assessment.get("risk_level", 5),
        "final_collective_intent": initial_assessment.get("collective_intent", "unknown"),
        "final_primary_danger": initial_assessment.get("primary_danger", "unknown"),
        "final_most_dangerous_zone": initial_assessment.get("most_dangerous_zone", "south"),
        "final_minutes_until_critical": initial_assessment.get("minutes_until_critical"),
        "final_is_critical": initial_assessment.get("is_already_critical", False),
        "what_junior_missed": "Critic unavailable — using junior assessment",
        "what_junior_got_right": "Initial assessment used as final",
        "final_key_risk": initial_assessment.get("key_risk_factor", "unknown"),
        "final_reasoning": initial_assessment.get("reasoning", ""),
        "call_emergency_services": initial_assessment.get("risk_level", 0) >= 8,
        "final_confidence": initial_assessment.get("confidence", 30)
    }