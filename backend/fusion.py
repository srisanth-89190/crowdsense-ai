# backend/fusion.py
# Combines vision + audio into one unified context

def fuse_inputs(vision_data, audio_data=None):
    """
    Takes vision result + audio result
    Returns unified scene context for reasoning layer
    """

    # If no audio provided, use safe defaults
    if audio_data is None:
        audio_data = {
            "transcription": "no audio",
            "panic_words_detected": 0,
            "screaming_likely": False,
            "audio_concern_level": "low"
        }

    # Build text summary for LLM reasoning
    scene_summary = f"""
VISUAL OBSERVATIONS:
- Crowd density: {vision_data.get('crowd_density', 'unknown')}
- Movement: {vision_data.get('movement_pattern', 'unknown')}
- Behavior: {', '.join(vision_data.get('body_language', []))}
- Distress visible: {vision_data.get('visible_distress', False)}
- People count: {vision_data.get('crowd_count_estimate', 0)}
- Problem areas: {vision_data.get('concern_areas', 'none')}
- North zone: {vision_data.get('zone_descriptions', {}).get('north', 'unknown')}
- South zone: {vision_data.get('zone_descriptions', {}).get('south', 'unknown')}
- East zone: {vision_data.get('zone_descriptions', {}).get('east', 'unknown')}
- West zone: {vision_data.get('zone_descriptions', {}).get('west', 'unknown')}

AUDIO OBSERVATIONS:
- People said: {audio_data.get('transcription', 'none')}
- Panic words found: {audio_data.get('panic_words_detected', 0)}
- Screaming detected: {audio_data.get('screaming_likely', False)}
- Audio concern level: {audio_data.get('audio_concern_level', 'low')}
"""

    return {
        "vision": vision_data,
        "audio": audio_data,
        "scene_summary": scene_summary,
        "combined_risk_indicators": {
            "visual_risk": vision_data.get('risk_score', 0),
            "audio_risk": 7 if audio_data.get('screaming_likely') else
                          3 if audio_data.get('panic_words_detected', 0) > 0 else 1,
            "dual_high": (
                vision_data.get('visible_distress', False) and
                audio_data.get('screaming_likely', False)
            )
        }
    }