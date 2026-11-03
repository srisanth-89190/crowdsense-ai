# CrowdSense AI — Setup & Testing Guide

## 🚀 Quick Start (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
pip install fastapi uvicorn python-multipart opencv-python requests python-dotenv
pip install openai-whisper  # For audio analysis
pip install sounddevice scipy  # For live microphone (optional)
```

### 2. Get Your FREE Groq API Key (REQUIRED)
**This is the most critical step — without this, nothing will work!**

1. Go to https://console.groq.com
2. Sign up (free, no credit card required)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_...`)
5. Open `.env` file in the project root
6. Replace `your_groq_api_key_here` with your actual key:
   ```
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

### 3. Start the Backend Server
```bash
# From project root
uvicorn backend.main:app --host 127.0.0.1 --port 8080 --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
[AudioLayer] Whisper 'small' loaded [OK]
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
# or
pnpm install
```

### 5. Start the Frontend
```bash
npm run dev
# or
pnpm dev
```

Open http://localhost:3000/dashboard

---

## 🎥 What Videos to Use

### For Hackathon Demo — Use Real Crowd Footage

**Best Sources:**
1. **YouTube** — Search for:
   - "concert crowd timelapse"
   - "stadium crowd entrance"
   - "festival crowd movement"
   - "airport terminal busy"
   - "train station rush hour"
   - "black friday crowd"

2. **Download with yt-dlp:**
   ```bash
   pip install yt-dlp
   yt-dlp -f "best[height<=720]" -o "demo/sample.mp4" "YOUTUBE_URL"
   ```

3. **Recommended Video Characteristics:**
   - **Duration:** 10-60 seconds (longer = slower analysis)
   - **Resolution:** 720p or 1080p
   - **Crowd density:** Medium to high (50+ people visible)
   - **Movement:** People walking, entering, or gathering
   - **Angle:** Overhead or elevated view (like CCTV)
   - **Lighting:** Good visibility of faces and bodies

### Example Good Videos:
- Concert entrance with crowd flowing through gates
- Stadium evacuation drill
- Shopping mall during holiday season
- Airport security checkpoint during peak hours
- Music festival crowd during set change

### ❌ Avoid:
- Static images or slideshows
- Videos with no people
- Extreme close-ups (need wide crowd view)
- Very dark or blurry footage
- Videos under 5 seconds

---

## 🧪 Testing the System

### Test 1: Backend Pipeline Test
```bash
python test_my_files.py
```

This runs the full AI pipeline on `demo/sample.mp4` and shows:
- Vision analysis (crowd count, density, risk)
- Audio transcription (Whisper)
- Junior analyst reasoning
- Senior critic refinement
- Superintendent commands

**Expected output:**
```
[1/6] Vision Analysis...
      Density     : medium
      Count       : ~45 people
      Risk score  : 4/10
      
[2/6] Audio Analysis...
      Said        : 'crowd chatter, footsteps'
      Panic words : 0
      
[4/6] AI Reasoning (Junior Analyst)...
      Risk level  : 4/10
      Intent      : normal
      Danger      : none
      Hot zone    : south
      
[5/6] Critic Refinement (Senior Analyst)...
      Final risk  : 3/10
      Confidence  : 85%
      
[6/6] Superintendent Commands...
      LEVEL 2 — ADVISORY
```

### Test 2: Video Upload via Dashboard
1. Open http://localhost:3000/dashboard
2. Check bottom-right badge shows **"BACKEND ONLINE"** (green)
3. Click "CAM 03 · UPLOAD VIDEO"
4. Drag and drop your crowd video
5. Click "ANALYZE" button
6. Watch the dashboard update with:
   - Composite Risk Index (1-10)
   - Crowd Count Estimate
   - Incident Level (1-5)
   - Superintendent Commands
   - Alert Log entries

### Test 3: Live Monitoring (Webcam)
1. Click "Start Live Monitoring"
2. Allow webcam access when prompted
3. CAM 01 shows your webcam feed
4. CAM 02 shows the sample video on loop
5. Dashboard updates every 2 seconds with live analysis

---

## 🐛 Troubleshooting

### "Failed to fetch" error
**Cause:** Backend server not running
**Fix:** Start the backend with `uvicorn backend.main:app --host 127.0.0.1 --port 8080`

### Crowd density shows 0.00
**Cause:** API key not set or vision AI returning fallback
**Fix:** 
1. Check `.env` has real Groq API key (not `your_groq_api_key_here`)
2. Restart backend server after updating `.env`
3. Check backend terminal for errors

### Commands say "unknown place"
**Cause:** Vision AI failed, returned zone="unknown"
**Fix:** Same as above — set API key and restart

### Junior/Senior analyst show "Awaiting..."
**Cause:** No analysis has run yet, or API calls failing
**Fix:**
1. Upload a video or start live monitoring
2. Check backend terminal for API errors
3. Verify Groq API key is valid

### "Whisper not available"
**Cause:** openai-whisper not installed
**Fix:** `pip install openai-whisper`

### Webcam not working
**Cause:** Browser denied camera permission
**Fix:** Click the camera icon in browser address bar → Allow

---

## 📊 Understanding the Dashboard

### Composite Risk Index (1-10)
- **1-4 (Green):** Normal operations
- **5-7 (Yellow):** Elevated risk, preventive action
- **8-10 (Red):** Critical, immediate evacuation

### Incident Levels
- **LEVEL 1-2:** Standard monitoring
- **LEVEL 3:** Caution protocol, increased patrols
- **LEVEL 4:** Critical, priority moves, entry restriction
- **LEVEL 5:** Catastrophic, full evacuation, emergency services

### Crowd Density (persons/m²)
- **0.0-0.5:** Low density, free movement
- **0.5-1.0:** Medium density, comfortable
- **1.0-2.0:** High density, restricted movement
- **2.0+:** Critical density, crush risk

### T-Minus to Critical
Countdown timer showing estimated minutes until situation becomes critical. Based on AI prediction of crowd dynamics.

---

## 🎯 Hackathon Tips

### Make It Look Impressive:
1. **Use dramatic crowd footage** — concert entrances, stadium evacuations
2. **Show the dual-model intelligence** — point out how Senior Critic corrects Junior
3. **Demonstrate real-time** — upload a video, show instant analysis
4. **Highlight the commands** — show how it generates specific radio commands for security officers
5. **Show the countdown** — "AI predicts critical situation in 5 minutes"

### Key Differentiators:
- **Dual-model AI** (Junior + Senior Critic) — no one else does this
- **Real superintendent commands** — not just "high risk", but "Unit Alpha move to North Gate NOW"
- **Multi-modal** — vision + audio fusion
- **Real-time countdown** — predictive, not reactive
- **Exit routing** — tells you which exits to open/close

### Demo Script:
1. "This is CrowdSense AI — a real-time crowd safety system"
2. Upload a concert crowd video
3. "Watch — it analyzes the video in 3 seconds"
4. Point to risk score: "Risk level 7 — elevated"
5. Point to commands: "It's already telling security officers exactly what to do"
6. Point to countdown: "And it predicts we have 8 minutes before critical"
7. "This is powered by AMD MI300X GPUs running Llama 4 vision and Llama 3.3 reasoning"

---

## 🔥 Advanced: Using Your Own Videos

### Record Your Own Crowd Footage:
1. Go to a public space (mall, train station, campus)
2. Record 30-60 seconds of crowd movement
3. Use elevated angle if possible (stairs, balcony)
4. Ensure good lighting
5. Save as MP4, 720p or 1080p
6. Upload via dashboard

### Simulate Different Scenarios:
- **Normal:** People walking calmly
- **Elevated:** Dense crowd, slow movement
- **Critical:** Running, pushing, panic

The AI will adapt its analysis to the actual crowd behavior in the video.

---

## 📞 Support

If you're stuck:
1. Check backend terminal for error messages
2. Verify `.env` has real Groq API key
3. Ensure all dependencies installed
4. Try the test script: `python test_my_files.py`
5. Check bottom-right badge on dashboard for "BACKEND ONLINE"

**Most common issue:** Forgot to set GROQ_API_KEY in `.env` — this breaks everything!
