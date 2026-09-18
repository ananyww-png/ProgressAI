"""
ProgressAI - Construction Schedule Dataset Generator
Generates realistic, domain-specific EPC progress logs, supervisor notes, DPR entries, and voice transcripts.
"""

import os
import random
import pandas as pd

random.seed(42)

# Activity specifications
ACTIVITIES = [
    # Piping
    {
        "id": "PIP-L6-024",
        "name": "Erect Line 24-XX",
        "discipline": "Piping",
        "tags": ["Line 24", "Line 24-XX", "24-XX", "Line-24", "L-24"],
        "verbs": ["erect", "erected", "spool erection", "spool erected", "installation", "spooled", "fit-up", "rigged"],
        "templates": [
            "{tag} {verb} started at {start} and completed at {end}.",
            "Today the crew finished {verb} for {tag} in Unit 100.",
            "{tag} {verb} done with {manpower} welders and riggers.",
            "Field update: {tag} {verb} completed successfully by day shift.",
            "Supervisor reports {tag} {verb} from {start} to {end}.",
            "{tag} spool has been {verb} onto the rack supports.",
            "Work on {tag} {verb} completed today without any safety incident."
        ]
    },
    {
        "id": "PIP-L6-025",
        "name": "Erect Line 25-XX",
        "discipline": "Piping",
        "tags": ["Line 25", "Line 25-XX", "25-XX", "Line-25"],
        "verbs": ["erect", "erected", "spool erection", "erection", "rigging"],
        "templates": [
            "{tag} {verb} started at {start} and completed at {end}.",
            "Crane crew hoisted and {verb} {tag} at rack level 2.",
            "Completed {tag} {verb} today, 18 spools positioned.",
            "{tag} {verb} ongoing from {start} to {end}."
        ]
    },
    {
        "id": "PIP-L6-018",
        "name": "Hydrotest Piping Line 18-HV",
        "discipline": "Piping",
        "tags": ["Line 18-HV", "Line 18", "18-HV", "L-18"],
        "verbs": ["hydrotest", "hydro test", "pressure test", "leak test", "flushing"],
        "templates": [
            "{verb} on {tag} completed successfully at 150 bar hold test.",
            "{tag} {verb} completed at {end} with QA signoff.",
            "Conducted {verb} on {tag}, zero pressure drop recorded.",
            "{tag} de-watering and air drying after {verb} finished at {end}."
        ]
    },
    {
        "id": "PIP-L6-030",
        "name": "Fitup and Weld Line 30-HP Feed",
        "discipline": "Piping",
        "tags": ["Line 30-HP", "Line 30", "30-HP", "Line 30 Feed"],
        "verbs": ["fitup", "fit-up", "root pass welding", "butt welding", "welded"],
        "templates": [
            "{tag} {verb} joints 05 through 09 completed at {end}.",
            "Fitters and welders performed {verb} on {tag} header.",
            "{tag} {verb} completed by {manpower} certified welders.",
            "NDT inspection cleared {tag} {verb} executed today."
        ]
    },
    {
        "id": "PIP-L5-001",
        "name": "Fabricate Unit 100 Rack Piping",
        "discipline": "Piping",
        "tags": ["Unit 100 Rack", "Pipe Rack PR-01", "Rack Piping"],
        "verbs": ["fabricate", "fabrication", "spool fabrication", "cutting and beveling"],
        "templates": [
            "{verb} for {tag} progressed with 6 tons fabricated.",
            "Pipe shop completed {verb} for {tag} batch 3.",
            "{tag} {verb} ongoing with {manpower} fitters from {start} to {end}."
        ]
    },
    {
        "id": "PIP-L6-042",
        "name": "Install Line 24 Steam Tracing",
        "discipline": "Piping",
        "tags": ["Line 24 Steam Tracing", "Line 24 Tracing", "Line 24"],
        "verbs": ["steam tracing installation", "tracing install", "tubing tracing"],
        "templates": [
            "{tag} {verb} 45 meters installed along the line.",
            "Tubing crew completed {tag} {verb} at {end}."
        ]
    },

    # Civil
    {
        "id": "CIV-L6-102",
        "name": "Construct Foundation F102",
        "discipline": "Civil",
        "tags": ["Foundation F102", "F102", "F-102", "Foundation F-102"],
        "verbs": ["construct", "concreting", "casting", "concrete pouring", "pour"],
        "templates": [
            "Constructed {tag} casting of 65 m3 M35 grade concrete completed at {end}.",
            "{tag} {verb} completed with cube sample collection at {end}.",
            "Batching plant delivered concrete for {tag} {verb}, pour finished.",
            "{tag} shuttering and {verb} executed from {start} to {end}."
        ]
    },
    {
        "id": "CIV-L6-103",
        "name": "Excavate Foundation F103 Footing",
        "discipline": "Civil",
        "tags": ["Foundation F103", "F103", "F-103", "F103 Footing"],
        "verbs": ["excavate", "excavation", "soil trenching", "pit digging"],
        "templates": [
            "{tag} {verb} reached depth of 3.2m at {end}.",
            "Excavator backhoe completed {tag} {verb} with {manpower} laborers.",
            "{tag} {verb} finished, soil compaction test passed."
        ]
    },
    {
        "id": "CIV-L6-104",
        "name": "Cast Heavy Column Pedestal P104",
        "discipline": "Civil",
        "tags": ["Column Pedestal P104", "Pedestal P104", "P104", "P-104"],
        "verbs": ["casting", "concreting", "rebar binding", "pour"],
        "templates": [
            "{tag} {verb} finished at {end} using self-compacting concrete.",
            "Rebar fixing and {verb} for {tag} completed today."
        ]
    },
    {
        "id": "CIV-L5-020",
        "name": "Excavate Main Drainage Trench TR-01",
        "discipline": "Civil",
        "tags": ["Drainage Trench TR-01", "Trench TR-01", "TR-01", "Trenching TR01"],
        "verbs": ["excavation", "trenching", "digging", "backfilling"],
        "templates": [
            "{tag} {verb} completed 80 linear meters today.",
            "Drainage corridor {tag} {verb} executed from {start} to {end}."
        ]
    },
    {
        "id": "CIV-L6-110",
        "name": "Grout Compressor Foundation Baseplates",
        "discipline": "Civil",
        "tags": ["Compressor Foundation", "Baseplate Grout", "CH-01 Grouting"],
        "verbs": ["grouting", "epoxy grout", "grout touchup", "baseplate grouting"],
        "templates": [
            "{tag} {verb} completed for 4 anchor bolts at {end}.",
            "High strength epoxy {verb} on {tag} finished."
        ]
    },

    # Electrical
    {
        "id": "ELE-L6-102",
        "name": "Install Cable Tray CT102",
        "discipline": "Electrical",
        "tags": ["Cable Tray CT102", "Tray CT102", "CT102", "CT-102"],
        "verbs": ["install", "installed", "tray installation", "fixing", "tray erection"],
        "templates": [
            "Installed {tag} 40 LM on Level 2 rack today.",
            "{tag} {verb} completed from {start} to {end}.",
            "Electrical crew completed {tag} {verb} in Substation SS-01.",
            "{tag} ladder {verb} coupled and grounded at {end}."
        ]
    },
    {
        "id": "ELE-L6-201",
        "name": "Cable Termination CT201 in MCC-01",
        "discipline": "Electrical",
        "tags": ["Cable Termination CT201", "CT201", "CT-201", "MCC-01 Terminations"],
        "verbs": ["termination", "glanding", "lugging", "cable termination", "wiring"],
        "templates": [
            "{tag} {verb} completed for 32 cores at {end}.",
            "Control cables {verb} in {tag} verified with continuity check.",
            "Electricians finished {tag} {verb} from {start} to {end}."
        ]
    },
    {
        "id": "ELE-L6-105",
        "name": "Lay 11kV Feeder Cable Feed-01",
        "discipline": "Electrical",
        "tags": ["11kV Feeder Cable Feed-01", "Feed-01", "11kV Cable", "Feed 01"],
        "verbs": ["cable laying", "cable pull", "pulling", "pulled", "laid"],
        "templates": [
            "Lay {tag} 420 LM completed at {end}.",
            "Cable winch crew completed {tag} {verb} along the main trench.",
            "{tag} {verb} finished and megger tested successfully."
        ]
    },
    {
        "id": "ELE-L6-108",
        "name": "Install Plant Earthing Grid Sector 3",
        "discipline": "Electrical",
        "tags": ["Earthing Grid Sector 3", "Earthing Grid", "Sector 3 Earthing"],
        "verbs": ["earthing installation", "copper tape laying", "exothermic welding", "grounding"],
        "templates": [
            "Earthing grid copper conductors laid 135 meters in {tag}.",
            "{tag} {verb} completed with cadweld joints inspected at {end}."
        ]
    },

    # Instrumentation
    {
        "id": "INS-L6-301",
        "name": "Calibrate Pressure Transmitters PT-101/102",
        "discipline": "Instrumentation",
        "tags": ["Pressure Transmitters PT-101/102", "PT-101", "PT-102", "PT101", "PT102"],
        "verbs": ["calibrate", "calibration", "bench calibration", "loop test"],
        "templates": [
            "Calibration for {tag} executed in site lab at {end}.",
            "{tag} {verb} finished within 0.05% margin.",
            "Zero and span {verb} for {tag} completed by instrument technicians."
        ]
    },
    {
        "id": "INS-L6-304",
        "name": "Install Impulse Piping for Orifice Plate FE-104",
        "discipline": "Instrumentation",
        "tags": ["Impulse Piping FE-104", "FE-104", "FE104", "Orifice FE-104"],
        "verbs": ["install impulse piping", "tubing", "impulse lines", "bending"],
        "templates": [
            "Tubing connected on feed line meter {tag} at {end}.",
            "{tag} {verb} completed and pressure tested at {end}."
        ]
    },

    # Static Equipment
    {
        "id": "STA-L6-010",
        "name": "Erect Distillation Column C-101 Shell",
        "discipline": "Static Equipment",
        "tags": ["Column C-101", "C-101", "Distillation Column", "C101"],
        "verbs": ["erect", "erection", "tandem crane lift", "vertical positioning"],
        "templates": [
            "Erect {tag} shell completed with 300T crawler crane at {end}.",
            "{tag} {verb} verticality checked within plumb tolerance."
        ]
    },
    {
        "id": "STA-L6-022",
        "name": "Position Heat Exchanger E-102 on Saddle",
        "discipline": "Static Equipment",
        "tags": ["Heat Exchanger E-102", "E-102", "E102", "Exchanger E-102"],
        "verbs": ["positioning", "placement", "saddle positioning", "rigging"],
        "templates": [
            "Heat exchanger {tag} moved onto saddle beams using 100T crane.",
            "{tag} {verb} on concrete saddles finished at {end}."
        ]
    },

    # Rotating Equipment
    {
        "id": "ROT-L6-050",
        "name": "Mount Crude Charge Pump P-101A on Skid",
        "discipline": "Rotating Equipment",
        "tags": ["Crude Charge Pump P-101A", "P-101A", "Pump P-101A", "P101A"],
        "verbs": ["mount", "mounting", "placed", "skid placement"],
        "templates": [
            "Crude pump {tag} placed onto concrete plinth at {end}.",
            "{tag} {verb} and anchor bolts tensioned with torque multiplier."
        ]
    },
    {
        "id": "ROT-L6-051",
        "name": "Laser Alignment of Pump P-101A and Driver Motor",
        "discipline": "Rotating Equipment",
        "tags": ["Pump P-101A Alignment", "P-101A Motor", "P-101A Laser"],
        "verbs": ["laser alignment", "coupling alignment", "dial indicator check", "shimming"],
        "templates": [
            "Laser alignment for crude pump {tag} reached tolerance at {end}.",
            "{tag} {verb} finished, cold alignment certificate signed."
        ]
    },

    # HSE
    {
        "id": "HSE-L6-901",
        "name": "Conduct Site Wide Scaffolding Safety Inspection Week 37",
        "discipline": "HSE",
        "tags": ["Scaffolding Safety", "HSE Inspection", "Week 37 Audit"],
        "verbs": ["inspection", "safety audit", "tagging", "walkthrough"],
        "templates": [
            "Site-wide {tag} conducted. 45 scaffolds inspected, green tagged 42.",
            "Safety officer completed {tag} {verb} across all construction zones."
        ]
    }
]

# Ambiguous / Generic site notes that lack exact IDs (requires review queue)
AMBIGUOUS_NOTES = [
    {"text": "Cable work completed.", "discipline": "Electrical", "suggested_id": "ELE-L6-102"},
    {"text": "Cable tray installation ongoing in corridor.", "discipline": "Electrical", "suggested_id": "ELE-L6-102"},
    {"text": "Electrical wiring and termination done.", "discipline": "Electrical", "suggested_id": "ELE-L6-201"},
    {"text": "Trenching near unit 200 encountered buried line.", "discipline": "Civil", "suggested_id": "CIV-L5-020"},
    {"text": "Foundation excavation ongoing.", "discipline": "Civil", "suggested_id": "CIV-L6-103"},
    {"text": "Civil concrete pour completed today.", "discipline": "Civil", "suggested_id": "CIV-L6-102"},
    {"text": "Compressor foundation grout touchup.", "discipline": "Civil", "suggested_id": "CIV-L6-110"},
    {"text": "Spool erection started by morning crew.", "discipline": "Piping", "suggested_id": "PIP-L6-024"},
    {"text": "Piping welding joints inspected.", "discipline": "Piping", "suggested_id": "PIP-L6-030"},
    {"text": "Hydrotesting in progress on process line.", "discipline": "Piping", "suggested_id": "PIP-L6-018"},
    {"text": "Exchanger saddle positioning started.", "discipline": "Static Equipment", "suggested_id": "STA-L6-022"},
    {"text": "Pump alignment underway.", "discipline": "Rotating Equipment", "suggested_id": "ROT-L6-051"},
    {"text": "Safety inspection completed.", "discipline": "HSE", "suggested_id": "HSE-L6-901"},
    {"text": "Tubing connected on meter.", "discipline": "Instrumentation", "suggested_id": "INS-L6-304"}
]

TIME_PAIRS = [
    ("08:00 AM", "04:30 PM"),
    ("09:15 AM", "04:30 PM"),
    ("07:30 AM", "02:00 PM"),
    ("08:30 AM", "05:00 PM"),
    ("10:00 AM", "06:00 PM"),
    ("09:00 AM", "01:30 PM"),
    ("08:15 AM", "03:45 PM")
]

def generate_dataset(num_samples: int = 1200) -> pd.DataFrame:
    rows = []

    # 1. Generate clear, tag-rich training samples
    per_act = (num_samples - 150) // len(ACTIVITIES)
    for act in ACTIVITIES:
        for _ in range(per_act):
            tag = random.choice(act["tags"])
            verb = random.choice(act["verbs"])
            template = random.choice(act["templates"])
            start, end = random.choice(TIME_PAIRS)
            manpower = random.randint(4, 22)

            text = template.format(
                tag=tag,
                verb=verb,
                start=start,
                end=end,
                manpower=manpower
            )

            # Randomly add conversational prefixes
            prefixes = ["", "Supervisor-07 notes: ", "Site report: ", "Shift log: ", "Field diary: ", "Today "]
            text = random.choice(prefixes) + text

            rows.append({
                "text": text,
                "discipline": act["discipline"],
                "activity_id": act["id"],
                "activity_name": act["name"],
                "actual_start": start,
                "actual_end": end,
                "status": "Completed" if "completed" in text.lower() or "done" in text.lower() or "finished" in text.lower() else "In Progress",
                "manpower": manpower,
                "is_ambiguous": 0
            })

    # 2. Add ambiguous samples requiring review
    for _ in range(150):
        item = random.choice(AMBIGUOUS_NOTES)
        start, end = random.choice(TIME_PAIRS)
        target_act = next(a for a in ACTIVITIES if a["id"] == item["suggested_id"])
        
        rows.append({
            "text": item["text"],
            "discipline": item["discipline"],
            "activity_id": item["suggested_id"],
            "activity_name": target_act["name"],
            "actual_start": start,
            "actual_end": end,
            "status": "Completed" if "completed" in item["text"].lower() or "done" in item["text"].lower() else "In Progress",
            "manpower": random.randint(4, 15),
            "is_ambiguous": 1
        })

    # Shuffle
    random.shuffle(rows)
    df = pd.DataFrame(rows)
    return df

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    df = generate_dataset(1250)
    out_path = "ml/data/construction_dataset.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} construction site progress records saved to '{out_path}'.")
    print(f"Disciplines breakdown:\n{df['discipline'].value_counts()}")
    print(f"Ambiguous records count: {df['is_ambiguous'].sum()}")
