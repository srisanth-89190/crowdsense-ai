# ============================================================
# action_agent.py — SUPERINTENDENT INTELLIGENCE ENGINE
# Thinks like a 20-year crowd safety commander
# ============================================================

from datetime import datetime

# Venue knowledge the superintendent has memorized
VENUE_KNOWLEDGE = {
    "exits": {
        "E1": {"name": "North Main Exit", "location": "north", "capacity_per_min": 300, "width": "6m"},
        "E2": {"name": "South Emergency Exit", "location": "south", "capacity_per_min": 150, "width": "3m"},
        "E3": {"name": "East Side Exit", "location": "east", "capacity_per_min": 200, "width": "4m"},
        "E4": {"name": "West Gate", "location": "west", "capacity_per_min": 250, "width": "5m"},
    },
    "officer_posts": {
        "Alpha": "North Gate entrance",
        "Bravo": "South barrier",
        "Charlie": "East corridor",
        "Delta": "West gate",
        "Echo": "Center command",
        "Foxtrot": "Emergency reserve"
    },
    "backup_capacity": 6  # max backup officers available
}


def calculate_evacuation_time(crowd_count, available_exits, risk_level):
    """Calculate how long evacuation will take"""
    total_exit_capacity = sum(
        VENUE_KNOWLEDGE["exits"][e]["capacity_per_min"]
        for e in available_exits
        if e in VENUE_KNOWLEDGE["exits"]
    )
    if total_exit_capacity == 0:
        return "unknown"
    minutes = crowd_count / total_exit_capacity
    return round(minutes, 1)


def determine_safe_exits(danger_zone, crowd_count, vision_data):
    """Figure out which exits are safe based on where danger is"""
    danger_side = danger_zone.lower().strip()

    # If zone is unknown/center, all exits are available
    if danger_side in ("unknown", "center", "none", ""):
        return list(VENUE_KNOWLEDGE["exits"].keys())

    safe_exits = []
    for exit_id, info in VENUE_KNOWLEDGE["exits"].items():
        if info["location"] != danger_side:
            safe_exits.append(exit_id)

    # Always return at least 2 exits
    if len(safe_exits) == 0:
        safe_exits = list(VENUE_KNOWLEDGE["exits"].keys())

    return safe_exits


def generate_superintendent_commands(final_assessment, all_camera_results, crowd_count):
    """
    Generates commands exactly like a real security superintendent.
    Considers all cameras, venue layout, officer positions,
    evacuation math, and backup needs.
    """

    risk = final_assessment.get("final_risk_level", 0)
    danger_zone = final_assessment.get("final_most_dangerous_zone", "south")
    # Normalize: if unknown/center/empty, default to south (typically densest event zone)
    if not danger_zone or danger_zone in ("unknown", "center", ""):
        danger_zone = "south"
    danger_type = final_assessment.get("final_primary_danger", "none")
    is_critical = final_assessment.get("final_is_critical", False)
    minutes_left = final_assessment.get("final_minutes_until_critical")
    reasoning = final_assessment.get("final_reasoning", "")

    safe_exits = determine_safe_exits(danger_zone, crowd_count, all_camera_results)
    evac_time = calculate_evacuation_time(crowd_count, safe_exits, risk)

    timestamp = datetime.now().strftime("%H:%M:%S")
    backup_needed = max(0, int(risk / 2))

    # =========================================================
    # LEVEL 5 — CATASTROPHIC
    # =========================================================
    if risk >= 9 or is_critical:
        return {
            "incident_level": "LEVEL 5 — CATASTROPHIC",
            "color": "red",
            "timestamp": timestamp,
            "situation_summary": f"CRITICAL CROWD INCIDENT DETECTED. {reasoning}",

            "radio_commands": [
                f"🔴 ALL UNITS THIS IS COMMAND — LEVEL 5 INCIDENT DECLARED AT {timestamp}",
                f"🔴 UNIT ALPHA — ABANDON CURRENT POST. MOVE IMMEDIATELY TO {danger_zone.upper()} ZONE. Form human barrier. Do NOT let anyone enter. Confirm when in position.",
                f"🔴 UNIT BRAVO — OPEN EXITS {', '.join(safe_exits)} NOW. Stand at exit mouth. Shout 'THIS WAY, KEEP MOVING, DO NOT STOP'. Guide at least 50 people through before reporting.",
                f"🔴 UNIT CHARLIE — POSITION AT CENTER. Face {danger_zone.upper()} zone. Push crowd AWAY from danger toward {safe_exits[0] if safe_exits else 'nearest exit'}. Use arms wide, steady pushes, verbal commands only.",
                f"🔴 UNIT DELTA — CLOSE MAIN ENTRANCE NOW. Nobody enters. Lock if necessary. Redirect any incoming crowd to outer perimeter.",
                f"🔴 UNIT ECHO — YOU ARE MY EYES. Station at highest point. Report crowd movement every 90 seconds. Tell me if {danger_zone.upper()} barrier holds.",
                f"🔴 FOXTROT PLUS {backup_needed} ADDITIONAL OFFICERS — REPORT TO SOUTH COMMAND POST. Standby for dynamic deployment.",
            ],

            "exit_operations": {
                "OPEN_IMMEDIATELY": [f"{eid} — {VENUE_KNOWLEDGE['exits'][eid]['name']}" for eid in safe_exits],
                "CLOSE_NOW": [f"{eid} — {info['name']} (faces danger zone)" for eid, info in VENUE_KNOWLEDGE["exits"].items() if info["location"] == danger_zone],
                "BLOCK_ENTRY": "ALL venue entry points — zero entry allowed"
            },

            "crowd_routing": {
                "push_crowd_away_from": danger_zone.upper(),
                "route_toward": [VENUE_KNOWLEDGE["exits"][e]["name"] for e in safe_exits],
                "primary_corridor": f"From {danger_zone.upper()} → through CENTER → to {safe_exits[0] if safe_exits else 'E1'}",
                "estimated_evacuation_time": f"{evac_time} minutes at current exit capacity"
            },

            "pa_system": {
                "announce_now": True,
                "script": f"Attention please. For your safety and comfort, we are opening additional exits. Please calmly move toward the {' and '.join([VENUE_KNOWLEDGE['exits'][e]['name'] for e in safe_exits[:2]])}. Walk slowly. Help those around you. Do not run.",
                "do_not_say": "Emergency, danger, fire, panic, stampede — any alarm word"
            },

            "emergency_services": {
                "call_police": True,
                "call_ambulance": True,
                "message": f"Crowd incident. Venue capacity ~{crowd_count} persons. Risk level critical. Danger zone {danger_zone}. Request 6 units and 2 ambulances. ETA needed.",
                "estimated_medical_cases": f"{max(1, crowd_count // 200)} potential injuries based on crowd size"
            },

            "backup_request": {
                "officers_needed": backup_needed,
                "deploy_to": f"{danger_zone.upper()} barrier reinforcement",
                "priority": "IMMEDIATE"
            },

            "commander_note": f"Time critical. Estimated {minutes_left or '<1'} minutes before situation worsens. Evacuation takes {evac_time} min. Start NOW."
        }

    # =========================================================
    # LEVEL 4 — CRITICAL
    # =========================================================
    elif risk >= 7:
        return {
            "incident_level": "LEVEL 4 — CRITICAL",
            "color": "orange",
            "timestamp": timestamp,
            "situation_summary": f"DANGEROUS CROWD BUILD-UP DETECTED. {reasoning}",

            "radio_commands": [
                f"🟠 UNIT ALPHA — PRIORITY MOVE to {danger_zone.upper()} zone. Do not alarm crowd. Walk with purpose. Begin gentle barrier formation.",
                f"🟠 UNIT BRAVO — Quietly open exits {', '.join(safe_exits[:2])}. No announcement yet. Just open and stand ready.",
                f"🟠 UNIT CHARLIE — Slow entry at main gate by 70%. Politely ask people to wait briefly outside.",
                f"🟠 UNIT DELTA — Move to {danger_zone.upper()} zone as backup for Alpha. Maintain visual with Alpha team.",
                f"🟠 ALL UNITS — Prepare Level 5 protocols. If Alpha reports barrier breach, we escalate immediately.",
            ],

            "exit_operations": {
                "OPEN_NOW": safe_exits[:2],
                "PREPARE_TO_OPEN": safe_exits[2:],
                "RESTRICT_ENTRY": "Slow main entrance to 30% flow"
            },

            "crowd_routing": {
                "push_crowd_away_from": danger_zone.upper(),
                "route_toward": [VENUE_KNOWLEDGE["exits"][e]["name"] for e in safe_exits[:2]],
                "estimated_evacuation_time": f"{evac_time} minutes if needed"
            },

            "pa_system": {
                "announce_now": True,
                "script": f"Attention all guests. For your safety, please begin moving toward the nearest exit. {' and '.join([VENUE_KNOWLEDGE['exits'][e]['name'] for e in safe_exits[:2]])} are now open. Please move calmly and steadily. Do not push. Help those around you.",
                "trigger_when": "NOW — risk is at Level 4"
            },

            "emergency_services": {
                "call_police": False,
                "alert_on_standby": True,
                "message": "Pre-alert: crowd situation developing. May need units in 10 minutes. Monitoring."
            },

            "backup_request": {
                "officers_needed": backup_needed,
                "deploy_to": f"{danger_zone.upper()} zone support",
                "priority": "HIGH — within 3 minutes"
            },

            "commander_note": f"Monitor every 60 seconds. If risk holds at 7+ for 3 minutes, escalate to Level 5. Evacuation time {evac_time} min."
        }

    # =========================================================
    # LEVEL 3 — ELEVATED
    # =========================================================
    elif risk >= 5:
        return {
            "incident_level": "LEVEL 3 — ELEVATED",
            "color": "yellow",
            "timestamp": timestamp,
            "situation_summary": f"CROWD DENSITY INCREASING. PREVENTIVE ACTION NEEDED. {reasoning}",

            "radio_commands": [
                f"🟡 UNIT ALPHA — Increase patrol frequency in {danger_zone.upper()} zone. No barrier needed yet. Observe and report every 5 minutes.",
                f"🟡 UNIT BRAVO — Quietly open one additional exit ({safe_exits[0] if safe_exits else 'E3'}) to naturally reduce density. No announcement.",
                f"🟡 ALL UNITS — Prepare Level 4 positions. Brief your teams. No action yet.",
            ],

            "exit_operations": {
                "OPEN_QUIETLY": [safe_exits[0]] if safe_exits else [],
                "MONITOR": "All other exits"
            },

            "crowd_routing": {
                "action": "Natural dispersal only — no forced movement",
                "guidance": f"Officer positioning near {danger_zone.upper()} zone creates natural dispersal pressure"
            },

            "pa_system": {"announce_now": False, "script": "SYSTEM MUTE. No announcement recommended at this time to prevent crowd alarm."},
            "emergency_services": {"call": False, "note": "Not required yet"},
            "backup_request": {"officers_needed": 0, "note": "Current team sufficient"},
            "commander_note": f"Reassess in 5 minutes. If density increases, move to Level 4 immediately."
        }

    # =========================================================
    # LEVELS 1-2 — NORMAL / WATCH
    # =========================================================
    else:
        return {
            "incident_level": "LEVEL 1-2 — NORMAL OPERATIONS",
            "color": "green",
            "timestamp": timestamp,
            "situation_summary": "Crowd levels within normal parameters. Standard monitoring active.",
            "radio_commands": [
                f"🟢 ALL UNITS — Standard positions confirmed at {timestamp}. Maintain visual on all 4 zones.",
                f"🟢 UNIT ALPHA — North Gate: count incoming flow every 10 minutes. Report if queue exceeds 50 persons.",
                f"🟢 UNIT BRAVO — South Zone: walk the perimeter. Check barrier integrity. Report any crowd build-up.",
                f"🟢 UNIT CHARLIE — East corridor clear. Monitor food court density. Soft-close if it exceeds 80 persons.",
                f"🟢 UNIT ECHO — Command post active. Next full status report in 15 minutes. Stay on channel.",
            ],
            "exit_operations": {
                "OPEN_NOW": list(VENUE_KNOWLEDGE["exits"].keys()),
                "status": "All 4 exits open — normal flow"
            },
            "crowd_routing": {
                "action": "Passive monitoring — no intervention required",
                "guidance": "Natural crowd flow. Officers visible but not directing."
            },
            "pa_system": {
                "announce_now": False,
                "script": "SYSTEM STANDBY. No announcement required. Activate only if risk reaches Level 3."
            },
            "emergency_services": {"call": False, "note": "Not required"},
            "backup_request": {"officers_needed": 0, "note": "Full team on standard deployment"},
            "commander_note": f"All clear at {timestamp}. Reassess in 15 minutes or immediately if any unit reports anomaly."
        }