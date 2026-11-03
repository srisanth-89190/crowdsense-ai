import sys, time
sys.path.insert(0, '.')
from backend.vision_layer import analyze_video
from backend.audio_layer import analyze_audio
from backend.fusion import fuse_inputs
from backend.reasoning import reason_about_scene
from backend.critic import critique_and_refine
from backend.action_agent import generate_superintendent_commands

VIDEO = 'demo/panic_crowd.mp4'
t0 = time.time()

print('=== PANIC VIDEO FULL PIPELINE TEST ===')
vision = analyze_video(VIDEO)
print(f"Vision: density={vision['crowd_density']} count={vision['crowd_count_estimate']} risk={vision['risk_score']}/10")
print(f"  Scene: {vision['scene_description']}")

audio = analyze_audio(VIDEO)
print(f"Audio: concern={audio['audio_concern_level']} risk={audio['audio_risk_score']}/10")
print(f"  Panic words: {audio['panic_words_found']}")
print(f"  Screaming: {audio['screaming_likely']}")

fused = fuse_inputs(vision, audio)
initial = reason_about_scene(fused)
print(f"Junior: risk={initial['risk_level']}/10 danger={initial['primary_danger']} zone={initial['most_dangerous_zone']}")
print(f"  Reasoning: {initial['reasoning'][:120]}")

final = critique_and_refine(vision, initial)
print(f"Critic: risk={final['final_risk_level']}/10 confidence={final['final_confidence']}%")
print(f"  Missed: {final['what_junior_missed'][:100]}")
print(f"  Final reasoning: {final['final_reasoning'][:120]}")

commands = generate_superintendent_commands(final, {}, vision['crowd_count_estimate'])
print(f"Commands: {commands['incident_level']}")
for cmd in commands['radio_commands'][:4]:
    print(f"  {cmd[:90]}")
print(f"\nTotal time: {time.time()-t0:.1f}s")
