"""
generate_panic_sample.py
Generates a synthetic crowd panic video for CrowdSense AI demo.
Shows: dense crowd, red danger zone, people running, bottleneck at exit.
Run: python demo/generate_panic_sample.py
"""

import cv2
import numpy as np
import math
import random
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "panic_crowd.mp4")
WIDTH, HEIGHT = 640, 360
FPS = 20
DURATION_SECS = 12
TOTAL_FRAMES = FPS * DURATION_SECS

random.seed(42)
np.random.seed(42)

# ── Person simulation ─────────────────────────────────────────
class Person:
    def __init__(self, x, y, panic_level=0):
        self.x = float(x)
        self.y = float(y)
        self.panic = panic_level          # 0=calm, 1=moving, 2=running, 3=crush
        self.vx = random.uniform(-0.3, 0.3)
        self.vy = random.uniform(-0.3, 0.3)
        self.color = (
            random.randint(160, 220),
            random.randint(140, 200),
            random.randint(120, 180)
        )
        self.size = random.randint(5, 9)

    def update(self, frame_idx, danger_x, danger_y, exit_x, exit_y):
        progress = frame_idx / TOTAL_FRAMES

        if progress < 0.25:
            # Phase 1: calm milling
            self.vx += random.uniform(-0.2, 0.2)
            self.vy += random.uniform(-0.2, 0.2)
            self.vx = max(-1, min(1, self.vx))
            self.vy = max(-1, min(1, self.vy))
        elif progress < 0.5:
            # Phase 2: crowd converging toward danger zone (concert surge)
            dx = danger_x - self.x
            dy = danger_y - self.y
            dist = math.sqrt(dx*dx + dy*dy) + 0.001
            self.vx += (dx/dist) * 0.4
            self.vy += (dy/dist) * 0.4
            self.vx = max(-2, min(2, self.vx))
            self.vy = max(-2, min(2, self.vy))
        elif progress < 0.75:
            # Phase 3: panic — run toward exit
            dx = exit_x - self.x
            dy = exit_y - self.y
            dist = math.sqrt(dx*dx + dy*dy) + 0.001
            speed = 3.0 + random.uniform(0, 2)
            self.vx = (dx/dist) * speed + random.uniform(-0.5, 0.5)
            self.vy = (dy/dist) * speed + random.uniform(-0.5, 0.5)
        else:
            # Phase 4: crush at exit — bottleneck
            dx = exit_x - self.x
            dy = exit_y - self.y
            dist = math.sqrt(dx*dx + dy*dy) + 0.001
            if dist > 30:
                self.vx = (dx/dist) * 2 + random.uniform(-1, 1)
                self.vy = (dy/dist) * 2 + random.uniform(-1, 1)
            else:
                # Stuck at bottleneck — jitter
                self.vx = random.uniform(-1.5, 1.5)
                self.vy = random.uniform(-1.5, 1.5)

        self.x = max(5, min(WIDTH-5, self.x + self.vx))
        self.y = max(5, min(HEIGHT-5, self.y + self.vy))


def draw_frame(frame_idx, persons, danger_x, danger_y, exit_x, exit_y):
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    progress = frame_idx / TOTAL_FRAMES

    # ── Background: dark venue ────────────────────────────────
    frame[:] = (12, 8, 5)

    # ── Grid lines (floor tiles) ──────────────────────────────
    for x in range(0, WIDTH, 40):
        cv2.line(frame, (x, 0), (x, HEIGHT), (20, 15, 10), 1)
    for y in range(0, HEIGHT, 40):
        cv2.line(frame, (0, y), (WIDTH, y), (20, 15, 10), 1)

    # ── Stage / danger zone ───────────────────────────────────
    stage_color = (0, 0, 180) if progress < 0.5 else (0, 0, 255)
    if progress > 0.5:
        # Flashing red danger
        if (frame_idx // 5) % 2 == 0:
            stage_color = (0, 0, 255)
        else:
            stage_color = (0, 0, 180)
    cv2.rectangle(frame, (int(danger_x)-60, int(danger_y)-30), (int(danger_x)+60, int(danger_y)+30), stage_color, -1)
    cv2.rectangle(frame, (int(danger_x)-60, int(danger_y)-30), (int(danger_x)+60, int(danger_y)+30), (0, 80, 255), 2)
    cv2.putText(frame, "STAGE", (int(danger_x)-25, int(danger_y)+6), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 255), 1)

    # ── Exit marker ───────────────────────────────────────────
    exit_color = (0, 200, 0) if progress < 0.75 else (0, 80, 0)
    cv2.rectangle(frame, (int(exit_x)-15, 0), (int(exit_x)+15, 30), exit_color, -1)
    cv2.putText(frame, "EXIT", (int(exit_x)-18, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

    # ── Danger zone overlay (phase 3+) ────────────────────────
    if progress > 0.5:
        overlay = frame.copy()
        alpha = min(0.4, (progress - 0.5) * 1.5)
        cv2.circle(overlay, (int(danger_x), int(danger_y)), 120, (0, 0, 200), -1)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    # ── Draw persons ─────────────────────────────────────────
    for p in persons:
        # Color shifts red as panic increases
        if progress > 0.5:
            r = min(255, int(p.color[2] + (progress - 0.5) * 300))
            g = max(0, int(p.color[1] - (progress - 0.5) * 200))
            b = max(0, int(p.color[0] - (progress - 0.5) * 100))
            color = (b, g, r)
        else:
            color = p.color
        cv2.circle(frame, (int(p.x), int(p.y)), p.size, color, -1)
        # Head
        cv2.circle(frame, (int(p.x), int(p.y) - p.size - 2), max(2, p.size-3), color, -1)

    # ── Crowd density heatmap (phase 2+) ─────────────────────
    if progress > 0.3:
        heat = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
        for p in persons:
            px, py = int(p.x), int(p.y)
            if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                cv2.circle(heat, (px, py), 20, 1.0, -1)
        heat = cv2.GaussianBlur(heat, (31, 31), 0)
        heat_norm = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        heat_color = cv2.applyColorMap(heat_norm, cv2.COLORMAP_JET)
        alpha = min(0.35, (progress - 0.3) * 0.8)
        cv2.addWeighted(heat_color, alpha, frame, 1 - alpha, 0, frame)

    # ── HUD overlay ───────────────────────────────────────────
    # Phase label
    if progress < 0.25:
        phase_text = "NORMAL CROWD FLOW"
        phase_color = (0, 200, 0)
    elif progress < 0.5:
        phase_text = "CROWD CONVERGING ON STAGE"
        phase_color = (0, 165, 255)
    elif progress < 0.75:
        phase_text = "⚠ PANIC — CROWD RUSHING EXIT"
        phase_color = (0, 80, 255)
    else:
        phase_text = "🚨 CRUSH AT EXIT — BOTTLENECK"
        phase_color = (0, 0, 255)

    # Dark bar at top
    cv2.rectangle(frame, (0, 0), (WIDTH, 28), (5, 5, 5), -1)
    cv2.putText(frame, phase_text, (8, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, phase_color, 1)

    # Person count
    count_text = f"PERSONS: {len(persons)}"
    cv2.putText(frame, count_text, (WIDTH-120, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 212, 255), 1)

    # Risk bar
    risk = min(10, int(progress * 12))
    bar_w = int((risk / 10) * 120)
    cv2.rectangle(frame, (8, HEIGHT-20), (128, HEIGHT-8), (30, 30, 30), -1)
    bar_color = (0, 200, 0) if risk < 4 else (0, 165, 255) if risk < 7 else (0, 0, 255)
    cv2.rectangle(frame, (8, HEIGHT-20), (8+bar_w, HEIGHT-8), bar_color, -1)
    cv2.putText(frame, f"RISK {risk}/10", (135, HEIGHT-9), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 180, 180), 1)

    # Timestamp
    ts = f"{frame_idx // FPS:02d}:{(frame_idx % FPS) * (50 // FPS):02d}"
    cv2.putText(frame, ts, (WIDTH-55, HEIGHT-9), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100, 100, 100), 1)

    return frame


def generate():
    print(f"[Demo] Generating panic crowd video → {OUTPUT_PATH}")

    # Spawn 180 persons spread across venue
    danger_x, danger_y = WIDTH * 0.5, HEIGHT * 0.65   # stage at bottom center
    exit_x, exit_y = WIDTH * 0.15, HEIGHT * 0.05       # exit top-left

    persons = []
    for _ in range(180):
        x = random.uniform(30, WIDTH - 30)
        y = random.uniform(30, HEIGHT - 30)
        persons.append(Person(x, y))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(OUTPUT_PATH, fourcc, FPS, (WIDTH, HEIGHT))

    for i in range(TOTAL_FRAMES):
        for p in persons:
            p.update(i, danger_x, danger_y, exit_x, exit_y)
        frame = draw_frame(i, persons, danger_x, danger_y, exit_x, exit_y)
        out.write(frame)

        if i % (FPS * 2) == 0:
            print(f"  {i}/{TOTAL_FRAMES} frames ({i*100//TOTAL_FRAMES}%)")

    out.release()
    size_kb = os.path.getsize(OUTPUT_PATH) // 1024
    print(f"[Demo] Done — {OUTPUT_PATH} ({size_kb}KB, {DURATION_SECS}s @ {FPS}fps)")
    print(f"[Demo] This video shows: calm → converging → panic → crush")
    print(f"[Demo] Use with CRUSH or PANIC audio scenario for maximum impact")


if __name__ == "__main__":
    generate()
