# test_my_files.py
# Run from project root: python test_my_files.py
# Tests the full pipeline end to end

import sys
import os

# Make sure Python finds the backend folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from backend.vision_layer  import analyze_video
from backend.audio_layer   import analyze_audio          # ← real function, not mock
from backend.fusion        import fuse_inputs
from backend.reasoning     import reason_about_scene
from backend.critic        import critique_and_refine
from backend.action_agent  import generate_superintendent_commands

# ── Point this at your actual video ──────────────────────────
VIDEO_PATH = "demo/sample.mp4"
# If you have the draft video use: "demo/draft_video.mp4"
# ─────────────────────────────────────────────────────────────

def run_test():
    print("\n" + "=" * 62)
    print("  CROWDSENSE AI - FULL PIPELINE TEST")
    print("=" * 62)

    # -- STEP 1: VISION ---------------------------------------
    print("\n[1/6] Vision Analysis...")
    vision = analyze_video(VIDEO_PATH, camera_id="CAM-1")

    print(f"      Density     : {vision.get('crowd_density', '?')}")
    print(f"      Count       : ~{vision.get('crowd_count_estimate', 0)} people")
    print(f"      Movement    : {vision.get('movement_pattern', '?')}")
    print(f"      Risk score  : {vision.get('risk_score', 0)}/10")
    print(f"      Scene       : {vision.get('scene_description', '?')}")
    print(f"      Distress    : {vision.get('visible_distress', False)}")

    # ── STEP 2: AUDIO ────────────────────────────────────────
    print("\n[2/6] 🎙  Audio Analysis...")
    audio = analyze_audio(VIDEO_PATH)    # ← real Whisper, not mock

    print(f"      Said        : '{audio.get('transcription', '')[:70]}'")
    print(f"      Language    : {audio.get('language_detected', '?')}")
    print(f"      Panic words : {audio.get('panic_words_detected', 0)}")
    print(f"      Concern     : {audio.get('audio_concern_level', '?')}")
    print(f"      Screaming   : {audio.get('screaming_likely', False)}")

    # -- STEP 3: FUSION ---------------------------------------
    print("\n[3/6] Fusing Vision + Audio...")
    fused = fuse_inputs(vision, audio)

    indicators = fused["combined_risk_indicators"]
    print(f"      Visual risk : {indicators.get('visual_risk', 0)}/10")
    print(f"      Audio risk  : {indicators.get('audio_risk', 0)}/10")
    print(f"      Both high   : {indicators.get('dual_high', False)}")

    # -- STEP 4: REASONING ------------------------------------
    print("\n[4/6] AI Reasoning (Junior Analyst)...")
    initial = reason_about_scene(fused)

    print(f"      Risk level  : {initial.get('risk_level', 0)}/10")
    print(f"      Intent      : {initial.get('collective_intent', '?')}")
    print(f"      Danger      : {initial.get('primary_danger', '?')}")
    print(f"      Hot zone    : {initial.get('most_dangerous_zone', '?')}")
    print(f"      Time left   : {initial.get('minutes_until_critical', '?')} min")
    print(f"      Reasoning   : {initial.get('reasoning', '?')}")

    # -- STEP 5: CRITIC ---------------------------------------
    print("\n[5/6] Critic Refinement (Senior Analyst)...")
    final = critique_and_refine(vision, initial)

    print(f"      Final risk  : {final.get('final_risk_level', 0)}/10")
    print(f"      Danger zone : {final.get('final_most_dangerous_zone', '?')}")
    print(f"      Missed      : {final.get('what_junior_missed', '?')}")
    print(f"      Got right   : {final.get('what_junior_got_right', '?')}")
    print(f"      Call 911    : {final.get('call_emergency_services', False)}")
    print(f"      Confidence  : {final.get('final_confidence', 0)}%")

    # -- STEP 6: COMMANDS -------------------------------------
    crowd_count = vision.get("crowd_count_estimate", 0)
    print("\n[6/6] Superintendent Commands...")

    # ← FIX: 3 arguments, not 2
    commands = generate_superintendent_commands(final, {}, crowd_count)

    print(f"\n      {commands.get('incident_level', '?')}")
    print(f"      {commands.get('situation_summary', '?')}")
    print(f"\n      RADIO COMMANDS:")
    for cmd in commands.get("radio_commands", []):
        print(f"      {cmd}")

    print(f"\n      TIME WINDOW : {commands.get('commander_note', '?')}")

    # Result
    print("\n" + "=" * 62)
    risk = final.get("final_risk_level", 0)
    if risk >= 7:
        print("  [!] HIGH RISK SITUATION - Commands generated successfully")
    elif risk >= 4:
        print("  [!] ELEVATED RISK - Monitoring commands active")
    else:
        print("  [OK] NORMAL - System monitoring")
    print("  SUCCESS: FULL PIPELINE TEST PASSED")
    print("=" * 62 + "\n")


if __name__ == "__main__":
    if not os.path.exists(VIDEO_PATH):
        print(f"\n❌ Video not found at: {VIDEO_PATH}")
        print(f"   Put your video there or change VIDEO_PATH in this file")
        print(f"   Example: copy draft_video.mp4 → demo/sample.mp4\n")
        sys.exit(1)

    run_test()