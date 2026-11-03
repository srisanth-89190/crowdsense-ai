// ============================================================
// demo-data.ts
// Complete hardcoded demo scenarios — no backend required.
// Shows exactly what the system looks like when fully operational.
// ============================================================

export interface DemoScenario {
  label: string
  riskScore: number
  incidentLevel: 1 | 2 | 3 | 4 | 5
  crowdCount: number
  density: number
  countdownMins: number

  // Vision
  vision: {
    crowd_density: string
    movement_pattern: string
    visible_distress: boolean
    scene_description: string
    risk_score: number
    zone_descriptions: { north: string; south: string; east: string; west: string }
    bottleneck_detected: boolean
    bottleneck_location: string
    immediate_threats: string[]
  }

  // Audio
  audio: {
    transcription: string
    panic_words_found: string[]
    screaming_likely: boolean
    audio_concern_level: string
    audio_risk_score: number
  }

  // Junior analyst
  initial: {
    risk_level: number
    collective_intent: string
    primary_danger: string
    most_dangerous_zone: string
    minutes_until_critical: number | null
    reasoning: string
    key_risk_factor: string
    confidence: number
  }

  // Senior critic
  final: {
    final_risk_level: number
    final_primary_danger: string
    final_most_dangerous_zone: string
    final_minutes_until_critical: number | null
    final_is_critical: boolean
    what_junior_missed: string
    what_junior_got_right: string
    final_reasoning: string
    final_confidence: number
    call_emergency_services: boolean
  }

  // Commands
  commands: {
    incident_level: string
    color: "green" | "yellow" | "orange" | "red"
    radio_commands: string[]
    exit_operations: {
      OPEN_IMMEDIATELY?: string[]
      OPEN_NOW?: string[]
      OPEN_QUIETLY?: string[]
      CLOSE_NOW?: string[]
      PREPARE_TO_OPEN?: string[]
    }
    pa_system: { announce_now: boolean; script: string }
    commander_note: string
  }

  // Alerts
  alerts: Array<{ time: string; level: "INFO" | "WARN" | "CRIT"; message: string }>

  // Reasoning stream events
  streamEvents: Array<{ tag: string; text: string }>
}

const T = () => {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ── LEVEL 1-2: NORMAL ──────────────────────────────────────
  {
    label: "NORMAL OPERATIONS",
    riskScore: 3,
    incidentLevel: 2,
    crowdCount: 124,
    density: 0.05,
    countdownMins: 0,
    vision: {
      crowd_density: "medium",
      movement_pattern: "calm",
      visible_distress: false,
      scene_description: "124 people moving calmly through the venue entrance. Orderly queues, free movement throughout all zones.",
      risk_score: 3,
      zone_descriptions: { north: "crowded", south: "clear", east: "crowded", west: "clear" },
      bottleneck_detected: false,
      bottleneck_location: "none",
      immediate_threats: ["none"],
    },
    audio: {
      transcription: "background crowd chatter, music playing, general ambience",
      panic_words_found: [],
      screaming_likely: false,
      audio_concern_level: "low",
      audio_risk_score: 1,
    },
    initial: {
      risk_level: 3,
      collective_intent: "normal",
      primary_danger: "none",
      most_dangerous_zone: "north",
      minutes_until_critical: null,
      reasoning: "The crowd is exhibiting normal dispersal behavior with free movement across all zones. North zone shows moderate density consistent with typical venue entrance flow. No pressure waves or convergence patterns detected. Audio confirms calm ambience with no distress indicators.",
      key_risk_factor: "North zone density slightly elevated — monitor for queue build-up at entrance",
      confidence: 92,
    },
    final: {
      final_risk_level: 3,
      final_primary_danger: "none",
      final_most_dangerous_zone: "north",
      final_minutes_until_critical: null,
      final_is_critical: false,
      what_junior_missed: "Potential for density increase if incoming flow continues at current rate without dispersal",
      what_junior_got_right: "Correctly identified calm movement pattern and low immediate threat level",
      final_reasoning: "Crowd dynamics are within safe parameters. The junior analyst correctly assessed the situation. Minor note: north zone should be monitored as incoming flow could create a queue bottleneck within 20-30 minutes if not managed proactively.",
      final_confidence: 94,
      call_emergency_services: false,
    },
    commands: {
      incident_level: "LEVEL 1-2 — NORMAL OPERATIONS",
      color: "green",
      radio_commands: [
        "🟢 ALL UNITS — Standard positions confirmed. Maintain visual on all 4 zones.",
        "🟢 UNIT ALPHA — North Gate: count incoming flow every 10 minutes. Report if queue exceeds 50 persons.",
        "🟢 UNIT BRAVO — South Zone: walk the perimeter. Check barrier integrity. Report any crowd build-up.",
        "🟢 UNIT CHARLIE — East corridor clear. Monitor food court density. Soft-close if it exceeds 80 persons.",
        "🟢 UNIT ECHO — Command post active. Next full status report in 15 minutes. Stay on channel.",
      ],
      exit_operations: { OPEN_NOW: ["E1", "E2", "E3", "E4"] },
      pa_system: { announce_now: false, script: "SYSTEM STANDBY. No announcement required. Activate only if risk reaches Level 3." },
      commander_note: "All clear. Reassess in 15 minutes or immediately if any unit reports anomaly.",
    },
    alerts: [
      { time: "09:41:02", level: "INFO", message: "System online — all 4 monitoring threads active" },
      { time: "09:41:08", level: "INFO", message: "CAM-1 — medium density — 124 persons — risk 3/10" },
      { time: "09:41:10", level: "INFO", message: "Audio nominal — concern LOW — background chatter" },
      { time: "09:41:15", level: "INFO", message: "Analysis #1 — LEVEL 1-2 NORMAL OPERATIONS — risk 3/10" },
    ],
    streamEvents: [
      { tag: "VISION", text: "[CAM-1] MEDIUM density — ~124 persons | calm movement | risk 3/10" },
      { tag: "VISION", text: '[CAM-1] "124 people moving calmly through venue entrance. Orderly queues."' },
      { tag: "AUDIO", text: 'Audio nominal — concern LOW | "background crowd chatter, music playing"' },
      { tag: "FUSION", text: "Sensor fusion — visual=3/10  audio=1/10  → forwarding to reasoning layer" },
      { tag: "JUNIOR", text: "Assessment — risk=3/10 | intent=normal | danger=none | hot zone=NORTH" },
      { tag: "JUNIOR", text: 'Key risk: "North zone density slightly elevated — monitor for queue build-up"' },
      { tag: "CRITIC", text: "Review — junior=3/10 → final=3/10 (concurred) | confidence=94%" },
      { tag: "CRITIC", text: 'Confirmed: "Correctly identified calm movement pattern and low immediate threat level"' },
      { tag: "VERDICT", text: "LEVEL 1-2 — NORMAL OPERATIONS | no danger | NORTH zone | all clear" },
      { tag: "COMMAND", text: "ALL UNITS — Standard positions confirmed. Maintain visual on all 4 zones." },
    ],
  },

  // ── LEVEL 3: ELEVATED ──────────────────────────────────────
  {
    label: "ELEVATED RISK",
    riskScore: 6,
    incidentLevel: 3,
    crowdCount: 387,
    density: 0.15,
    countdownMins: 12,
    vision: {
      crowd_density: "high",
      movement_pattern: "converging",
      visible_distress: false,
      scene_description: "387 people converging on north gate entrance. Shoulder-to-shoulder movement, restricted flow. Bottleneck forming at single entry point.",
      risk_score: 6,
      zone_descriptions: { north: "danger", south: "crowded", east: "crowded", west: "clear" },
      bottleneck_detected: true,
      bottleneck_location: "North gate entrance — crowd converging on single entry point, 3m width for 387 persons",
      immediate_threats: ["bottleneck forming at north gate", "restricted movement in north zone", "incoming flow not slowing"],
    },
    audio: {
      transcription: "loud crowd noise, some shouting, move back, watch out, excuse me",
      panic_words_found: ["back", "move"],
      screaming_likely: false,
      audio_concern_level: "medium",
      audio_risk_score: 4,
    },
    initial: {
      risk_level: 5,
      collective_intent: "surge",
      primary_danger: "bottleneck",
      most_dangerous_zone: "north",
      minutes_until_critical: 15,
      reasoning: "The converging movement pattern at the north gate is creating a classic bottleneck scenario. With 387 persons competing for a 3m entry point, pressure is building. If incoming flow continues at current rate, density will reach critical threshold within 15 minutes. Audio confirms elevated crowd noise with early distress indicators.",
      key_risk_factor: "Single entry point bottleneck — 387 persons converging on 3m gate width creates dangerous pressure buildup",
      confidence: 78,
    },
    final: {
      final_risk_level: 6,
      final_primary_danger: "bottleneck",
      final_most_dangerous_zone: "north",
      final_minutes_until_critical: 12,
      final_is_critical: false,
      what_junior_missed: "West zone is clear and could serve as natural dispersal route — opening west gate would immediately reduce north pressure by ~30%",
      what_junior_got_right: "Correctly identified the bottleneck mechanism and converging movement pattern as primary risk",
      final_reasoning: "The junior correctly identified the bottleneck but underestimated the dispersal options. West zone is completely clear — redirecting incoming flow to West Gate (E4) would reduce north pressure significantly. Risk is elevated but manageable with immediate preventive action. Time window is 12 minutes before situation becomes critical.",
      final_confidence: 88,
      call_emergency_services: false,
    },
    commands: {
      incident_level: "LEVEL 3 — ELEVATED",
      color: "yellow",
      radio_commands: [
        "🟡 UNIT ALPHA — Increase patrol frequency in NORTH zone. Position at gate mouth. Begin gentle crowd guidance — direct people to West Gate.",
        "🟡 UNIT BRAVO — Quietly open West Gate (E4) now. No announcement. Stand at exit and wave people through. Target: reduce north density by 30%.",
        "🟡 UNIT CHARLIE — Slow entry at main north gate by 50%. Politely ask people to use West Gate instead. Be friendly, not alarming.",
        "🟡 ALL UNITS — Prepare Level 4 positions. Brief your teams. If Alpha reports density still rising in 5 minutes, we escalate.",
      ],
      exit_operations: { OPEN_QUIETLY: ["E4"], PREPARE_TO_OPEN: ["E1", "E3"] },
      pa_system: { announce_now: false, script: "SYSTEM MUTE. No announcement recommended at this time to prevent crowd alarm." },
      commander_note: "Reassess in 5 minutes. If north density does not reduce, move to Level 4 immediately. West gate dispersal is key.",
    },
    alerts: [
      { time: "09:43:12", level: "WARN", message: "CAM-1 — high density — risk 6/10 — 387 persons converging" },
      { time: "09:43:14", level: "WARN", message: "Bottleneck detected: North gate entrance — 387 persons, 3m width" },
      { time: "09:43:18", level: "WARN", message: "Audio: elevated crowd noise — panic words: [back, move]" },
      { time: "09:43:22", level: "INFO", message: "Analysis #3 — LEVEL 3 ELEVATED — risk 6/10 — T-minus 12 min" },
      { time: "09:43:25", level: "WARN", message: "Senior critic: West gate dispersal option identified — action recommended" },
    ],
    streamEvents: [
      { tag: "VISION", text: "[CAM-1] HIGH density — ~387 persons | converging movement | risk 6/10" },
      { tag: "VISION", text: "⚠ BOTTLENECK: North gate entrance — crowd converging on single entry point, 3m width" },
      { tag: "VISION", text: "Threats: bottleneck forming at north gate | restricted movement in north zone" },
      { tag: "AUDIO", text: 'Panic indicators: 2 word(s) — concern MEDIUM — "loud crowd noise, some shouting, move back"' },
      { tag: "FUSION", text: "Sensor fusion — visual=6/10  audio=4/10  → forwarding to reasoning layer" },
      { tag: "JUNIOR", text: "Assessment — risk=5/10 | intent=surge | danger=bottleneck | hot zone=NORTH | T-15min" },
      { tag: "JUNIOR", text: 'Key risk: "Single entry point bottleneck — 387 persons converging on 3m gate width"' },
      { tag: "CRITIC", text: "Review — junior=5/10 → final=6/10 (↑ raised +1) | confidence=88%" },
      { tag: "CRITIC", text: 'Junior missed: "West zone is clear — opening west gate would reduce north pressure by ~30%"' },
      { tag: "VERDICT", text: "LEVEL 3 — ELEVATED | bottleneck risk | NORTH zone | T-minus 12 min" },
      { tag: "COMMAND", text: "UNIT ALPHA — Increase patrol in NORTH zone. Direct people to West Gate." },
      { tag: "COMMAND", text: "UNIT BRAVO — Quietly open West Gate (E4). Reduce north density by 30%." },
    ],
  },

  // ── LEVEL 4-5: CRITICAL ────────────────────────────────────
  {
    label: "CRITICAL INCIDENT",
    riskScore: 8,
    incidentLevel: 4,
    crowdCount: 652,
    density: 0.26,
    countdownMins: 4,
    vision: {
      crowd_density: "high",
      movement_pattern: "pushing",
      visible_distress: true,
      scene_description: "652 people pushing at south stage barrier. People stumbling, arms raised, visible distress. Crush risk imminent at south barrier.",
      risk_score: 8,
      zone_descriptions: { north: "danger", south: "danger", east: "crowded", west: "clear" },
      bottleneck_detected: true,
      bottleneck_location: "South stage barrier — crowd surge toward stage, barrier overwhelmed",
      immediate_threats: ["crowd crush imminent at south barrier", "people falling near stage", "exit E2 blocked by crowd pressure"],
    },
    audio: {
      transcription: "Help! Stop pushing! I cannot breathe! Move back! Please stop!",
      panic_words_found: ["help", "stop", "push", "back", "please"],
      screaming_likely: true,
      audio_concern_level: "critical",
      audio_risk_score: 9,
    },
    initial: {
      risk_level: 7,
      collective_intent: "panic",
      primary_danger: "crush",
      most_dangerous_zone: "south",
      minutes_until_critical: 5,
      reasoning: "Critical crowd surge at south stage barrier. Pushing behavior and visible distress indicate crowd crush is developing. Audio confirms screaming and panic keywords. The barrier is being overwhelmed by forward pressure from the crowd. People are falling. Immediate intervention required.",
      key_risk_factor: "Active crowd crush developing at south stage barrier — people falling, barrier overwhelmed, exit E2 blocked",
      confidence: 85,
    },
    final: {
      final_risk_level: 8,
      final_primary_danger: "crush",
      final_most_dangerous_zone: "south",
      final_minutes_until_critical: 4,
      final_is_critical: false,
      what_junior_missed: "North zone is also at danger level — dual-zone threat means standard dispersal routes are compromised. Emergency services should be pre-alerted now, not when situation worsens.",
      what_junior_got_right: "Correctly identified the crush mechanism at south barrier and the audio-visual correlation confirming active distress",
      final_reasoning: "This is a developing crowd crush with dual-zone threat. The junior correctly identified the south barrier crush but missed that north zone is also compromised, limiting safe dispersal routes. West exits (E1, E4) are the only viable evacuation corridors. Emergency services must be pre-alerted immediately — we have approximately 4 minutes before this becomes catastrophic.",
      final_confidence: 91,
      call_emergency_services: true,
    },
    commands: {
      incident_level: "LEVEL 4 — CRITICAL",
      color: "orange",
      radio_commands: [
        "🟠 UNIT ALPHA — PRIORITY MOVE to SOUTH zone NOW. Do not alarm crowd. Form barrier at stage front. Push crowd BACK gently but firmly.",
        "🟠 UNIT BRAVO — Open exits E1 and E4 IMMEDIATELY. Stand at exit mouth. Guide crowd through. Shout 'THIS WAY — KEEP MOVING'.",
        "🟠 UNIT CHARLIE — Slow ALL entry at main gates by 70%. Nobody new enters until south zone clears.",
        "🟠 UNIT DELTA — Move to SOUTH zone as backup for Alpha. Maintain visual. If barrier fails, escalate to Level 5.",
        "🟠 UNIT ECHO — Pre-alert emergency services. Message: crowd incident developing, may need 4 units and 1 ambulance in 5 minutes.",
      ],
      exit_operations: { OPEN_NOW: ["E1", "E4"], PREPARE_TO_OPEN: ["E3"], CLOSE_NOW: ["E2 — South Emergency Exit (faces danger zone)"] },
      pa_system: { announce_now: true, script: "Attention all guests. For your safety and comfort, we are opening additional exits. Please begin moving calmly toward the North Main Exit and West Gate. Walk slowly. Help those around you. Do not push." },
      commander_note: "Time critical — 4 minutes to threshold. If Alpha reports barrier breach, escalate to Level 5 immediately. Evacuation via E1 and E4 only.",
    },
    alerts: [
      { time: "09:47:33", level: "CRIT", message: "🚨 CAM-1 — people falling — risk 8/10 — 652 persons — CRUSH IMMINENT" },
      { time: "09:47:35", level: "CRIT", message: "Screaming detected — words: [help, stop, push, back, please]" },
      { time: "09:47:38", level: "CRIT", message: "Bottleneck: South stage barrier overwhelmed — exit E2 blocked" },
      { time: "09:47:41", level: "WARN", message: "Senior critic: dual-zone threat — north also compromised — emergency services pre-alert required" },
      { time: "09:47:44", level: "CRIT", message: "Analysis #7 — LEVEL 4 CRITICAL — risk 8/10 — T-minus 4 min" },
      { time: "09:47:46", level: "CRIT", message: "PA SYSTEM ACTIVATED — directing crowd to E1 and E4" },
    ],
    streamEvents: [
      { tag: "VISION", text: "[CAM-1] HIGH density — ~652 persons | pushing movement | risk 8/10" },
      { tag: "VISION", text: '[CAM-1] "652 people pushing at south stage barrier. People stumbling, visible distress."' },
      { tag: "VISION", text: "⚠ BOTTLENECK: South stage barrier — crowd surge, barrier overwhelmed" },
      { tag: "VISION", text: "Threats: crowd crush imminent at south barrier | people falling near stage | exit E2 blocked" },
      { tag: "AUDIO", text: "⚠ SCREAMING DETECTED — audio risk 9/10 — \"Help! Stop pushing! I cannot breathe!\"" },
      { tag: "FUSION", text: "Sensor fusion — visual=8/10  audio=9/10  ⚠ DUAL HIGH — elevated threat confidence" },
      { tag: "JUNIOR", text: "Assessment — risk=7/10 | intent=panic | danger=crush | hot zone=SOUTH | T-5min" },
      { tag: "JUNIOR", text: 'Key risk: "Active crowd crush developing at south stage barrier — people falling"' },
      { tag: "CRITIC", text: "Review — junior=7/10 → final=8/10 (↑ raised +1) | confidence=91%" },
      { tag: "CRITIC", text: 'Junior missed: "North zone also at danger — dual-zone threat, emergency services must be pre-alerted NOW"' },
      { tag: "ALERT", text: "🚨 EMERGENCY SERVICES REQUIRED — pre-alerting police + ambulance" },
      { tag: "VERDICT", text: "LEVEL 4 — CRITICAL | crush risk | SOUTH zone | T-minus 4 min" },
      { tag: "COMMAND", text: "UNIT ALPHA — PRIORITY MOVE to SOUTH zone. Form barrier at stage front." },
      { tag: "COMMAND", text: "UNIT BRAVO — Open exits E1 and E4 IMMEDIATELY. Guide crowd through." },
    ],
  },

  // ── LEVEL 5: CATASTROPHIC ──────────────────────────────────
  {
    label: "CATASTROPHIC",
    riskScore: 10,
    incidentLevel: 5,
    crowdCount: 1247,
    density: 0.50,
    countdownMins: 1,
    vision: {
      crowd_density: "critical",
      movement_pattern: "chaotic",
      visible_distress: true,
      scene_description: "CATASTROPHIC: 1247 persons in mass panic. Active trampling visible. All exits blocked by crowd pressure. People falling and not getting up.",
      risk_score: 10,
      zone_descriptions: { north: "danger", south: "danger", east: "danger", west: "crowded" },
      bottleneck_detected: true,
      bottleneck_location: "ALL exits — crowd blocking all egress points simultaneously",
      immediate_threats: ["active crowd crush", "people being trampled", "all exits blocked", "mass panic spreading", "people not getting up"],
    },
    audio: {
      transcription: "Help us! Run! Fire! Emergency! People are dying! Get out! Crush! Back up! Stop pushing!",
      panic_words_found: ["help", "run", "fire", "emergency", "dying", "out", "crush", "push", "back", "stop"],
      screaming_likely: true,
      audio_concern_level: "critical",
      audio_risk_score: 10,
    },
    initial: {
      risk_level: 9,
      collective_intent: "panic",
      primary_danger: "stampede",
      most_dangerous_zone: "south",
      minutes_until_critical: 1,
      reasoning: "Mass panic event in progress. 1247 persons in chaotic movement with active trampling. All exits are blocked. Audio confirms mass screaming with 10 panic keywords including 'dying' and 'fire'. This is a life-threatening situation requiring immediate full evacuation and emergency services.",
      key_risk_factor: "Active trampling with all exits blocked — people cannot escape, compression forces building to lethal levels",
      confidence: 97,
    },
    final: {
      final_risk_level: 10,
      final_primary_danger: "stampede",
      final_most_dangerous_zone: "south",
      final_minutes_until_critical: 1,
      final_is_critical: true,
      what_junior_missed: "West zone still has partial capacity — emergency breach of west perimeter wall should be considered as last resort evacuation route",
      what_junior_got_right: "Correctly identified all critical elements: trampling, blocked exits, mass panic, and the need for immediate emergency services",
      final_reasoning: "This is a full mass casualty event in progress. The junior correctly assessed the catastrophic nature. Critical addition: west zone perimeter breach should be authorized as emergency evacuation route — it is the only zone not at critical density. Every second of delay increases casualties. Emergency services must be on scene within 3 minutes.",
      final_confidence: 98,
      call_emergency_services: true,
    },
    commands: {
      incident_level: "LEVEL 5 — CATASTROPHIC",
      color: "red",
      radio_commands: [
        "🔴 ALL UNITS THIS IS COMMAND — LEVEL 5 INCIDENT DECLARED. THIS IS NOT A DRILL.",
        "🔴 UNIT ALPHA — ABANDON CURRENT POST. MOVE IMMEDIATELY TO SOUTH ZONE. Form human barrier. Do NOT let anyone enter. Confirm when in position.",
        "🔴 UNIT BRAVO — BREACH WEST PERIMETER NOW. Create emergency exit. Stand at breach. Shout 'THIS WAY, KEEP MOVING, DO NOT STOP'. Guide people through.",
        "🔴 UNIT CHARLIE — POSITION AT CENTER. Face SOUTH zone. Push crowd AWAY from danger toward west. Use arms wide, steady pushes, verbal commands only.",
        "🔴 UNIT DELTA — CLOSE ALL ENTRY POINTS. Nobody enters. Lock if necessary. Redirect incoming crowd to outer perimeter.",
        "🔴 UNIT ECHO — YOU ARE MY EYES. Highest point. Report crowd movement every 60 seconds. Tell me if west corridor holds.",
        "🔴 FOXTROT + 5 ADDITIONAL OFFICERS — REPORT TO WEST COMMAND POST. Standby for dynamic deployment.",
      ],
      exit_operations: {
        OPEN_IMMEDIATELY: ["E1 — North Main Exit", "E4 — West Gate"],
        CLOSE_NOW: ["E2 — South Emergency Exit (faces danger zone)", "E3 — East Side Exit (faces danger zone)"],
      },
      pa_system: {
        announce_now: true,
        script: "Attention please. For your safety, please move immediately and calmly toward the North Main Exit and West Gate. Walk steadily. Help those around you. Do not run. Do not push. Move toward the exits now.",
      },
      commander_note: "CRITICAL — 1 minute to threshold. Evacuation via E1 and E4 only. Emergency services ETA 4 minutes. Start NOW.",
    },
    alerts: [
      { time: "09:52:01", level: "CRIT", message: "🚨🚨 CATASTROPHIC — mass panic — 1247 persons — active trampling" },
      { time: "09:52:03", level: "CRIT", message: "ALL EXITS BLOCKED — active trampling — EVACUATE NOW" },
      { time: "09:52:05", level: "CRIT", message: "Screaming detected — 10 panic words: [help, run, fire, emergency, dying...]" },
      { time: "09:52:07", level: "CRIT", message: "🚨 EMERGENCY SERVICES DISPATCHED — police + ambulance — ETA 4 min" },
      { time: "09:52:09", level: "CRIT", message: "Senior critic: west perimeter breach authorized as emergency evacuation route" },
      { time: "09:52:11", level: "CRIT", message: "LEVEL 5 DECLARED — all units deployed — PA system active" },
      { time: "09:52:13", level: "CRIT", message: "Analysis #12 — LEVEL 5 CATASTROPHIC — risk 10/10 — T-minus 1 min" },
    ],
    streamEvents: [
      { tag: "VISION", text: "[CAM-1] CRITICAL density — ~1247 persons | chaotic movement | risk 10/10" },
      { tag: "VISION", text: '[CAM-1] "CATASTROPHIC: 1247 persons in mass panic. Active trampling. People not getting up."' },
      { tag: "VISION", text: "⚠ BOTTLENECK: ALL exits — crowd blocking all egress points simultaneously" },
      { tag: "VISION", text: "Threats: active crowd crush | people being trampled | all exits blocked | mass panic spreading" },
      { tag: "AUDIO", text: "⚠ SCREAMING DETECTED — audio risk 10/10 — \"Help us! Run! Fire! Emergency! People are dying!\"" },
      { tag: "FUSION", text: "Sensor fusion — visual=10/10  audio=10/10  ⚠ DUAL HIGH — maximum threat confidence" },
      { tag: "JUNIOR", text: "Assessment — risk=9/10 | intent=panic | danger=stampede | hot zone=SOUTH | T-1min" },
      { tag: "JUNIOR", text: 'Key risk: "Active trampling with all exits blocked — compression forces building to lethal levels"' },
      { tag: "CRITIC", text: "Review — junior=9/10 → final=10/10 (↑ raised +1) | confidence=98%" },
      { tag: "CRITIC", text: 'Junior missed: "West perimeter breach should be authorized — only viable emergency evacuation route"' },
      { tag: "ALERT", text: "🚨 EMERGENCY SERVICES REQUIRED — dispatching police + ambulance NOW" },
      { tag: "VERDICT", text: "LEVEL 5 — CATASTROPHIC | stampede | SOUTH zone | T-minus 1 min | CRITICAL NOW" },
      { tag: "COMMAND", text: "ALL UNITS — LEVEL 5 INCIDENT DECLARED. THIS IS NOT A DRILL." },
      { tag: "COMMAND", text: "UNIT BRAVO — BREACH WEST PERIMETER NOW. Create emergency exit." },
      { tag: "COMMAND", text: "UNIT CHARLIE — Push crowd AWAY from SOUTH toward west. Verbal commands only." },
    ],
  },
]
