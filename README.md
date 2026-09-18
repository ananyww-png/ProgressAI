# ProgressAI
### *"From Site Updates to Schedule Intelligence"*

> **Smart India Hackathon (SIH) Prototype**  
> AI-powered construction progress tracking, unstructured activity extraction, L5/L6 Primavera P6 / MS Project schedule matching, confidence-based planner triage, immutable audit trail, historical project memory, and reactive EPC analytics.

---

## 🏗️ 1. Problem Statement

Mega infrastructure and EPC (Engineering, Procurement, Construction) project schedules are structured from high-level milestones (**L1/L2**) down to discrete, executable work activities (**L5/L6**).

On site, specialized disciplines—**Civil, Piping, Static Equipment, Rotating Equipment, Electrical, Instrumentation, and HSE**—report their actual daily progress through disparate and fragmented channels:
- Daily Progress Reports (DPRs)
- Contractor Excel spreadsheets
- Site supervisor field diaries
- Voice and text mobile notes
- Site memos and punch lists

This data is **unstructured, informal, and lacks formal Primavera/MS Project WBS activity IDs**.

### The Critical Gap
```
Schedule Baseline (P6): "Erect Line 24-XX" (ID: PIP-L6-024)
Site Supervisor Field Note: "Line 24 spool erection started at 9:15 AM and completed at 4:30 PM."
```
Human planners spend hours cross-referencing messy field logs against thousands of schedule lines. Mismatches lead to delayed milestone billing, uncredited contractor progress, disputed delay claims, and out-of-date executive forecasts.

---

## 💡 2. The ProgressAI Solution

ProgressAI bridges this operational divide through an intelligent, human-in-the-loop pipeline:

```
Unstructured Site Update (Text / Voice / DPR / Excel)
                      ↓
           AI Activity Extraction
(Discipline detection, timing parameters, scope normalization)
                      ↓
     Local NLP Schedule Matching Engine
(Domain synonyms, tag parsing, token similarity, discipline heuristics)
                      ↓
           Match Confidence Score (0–100%)
                      ↓
      Confidence-Based Intelligent Routing:
   ├── High Confidence (≥90%): 1-Click Approve / Auto-Update
   ├── Medium Confidence (70–89%): Planner Review Recommended
   └── Low Confidence (<70%): Route to Review Queue for Triage
                      ↓
     Primavera L5/L6 Schedule Update (Actuals & Progress)
                      ↓
         Contractual Audit Trail (Immutable Log)
                      ↓
         Historical Project Memory (Duration Benchmarks)
                      ↓
           Executive S-Curve & Trades Analytics
```

---

## ⚡ 3. Key Features

- 🤖 **AI Time Agent**: Conversational chat and voice-enabled field logger for site supervisors with multi-phase animated parsing states and immediate schedule candidate generation.
- 🎯 **Domain-Aware Matching Engine**: Local NLP algorithm featuring EPC construction synonym banks (erect/spool, foundation/footing/raft, cable tray/pulling/termination, hydrotest, etc.), tag/number extraction, and discipline bias.
- 📋 **Daily Progress Reports (DPR) Suite**: Create, edit, search, filter, export, and trigger batch AI processing for field reports.
- 📥 **Multi-Format Input Ingestion**: Drag-and-drop ingestion for PDF daily logs, XLSX contractor spreadsheets, CSV schedules, and TXT diaries with built-in one-click sample loaders.
- 📅 **L5/L6 Master Schedule Table**: Interactive WBS viewer with search, discipline/WBS/status filters, sorting, activity details drawer, and manual actual progress updates.
- 🛡️ **Planner Triage & Review Queue**: Interactive workbench with 1-click approval, intelligent alternative suggestions, live schedule search for re-linking, and formal rejection logging.
- 📊 **Executive Analytics**: 7 real-time Recharts visualizations (S-Curve planned vs actual, trade-wise progress, status breakdown, confidence distribution, delay root causes, daily run-rate, AI acceptance trends).
- 🧠 **Project Memory Knowledge Base**: Historical benchmarks (e.g. Pipe Spool Erection avg 3.1d vs 2.0d planned), recurring delay cause analytics, and "Use Historical Data" insights drawer.
- 📜 **Compliance Audit Trail**: Full ledger of every system event, user action, schedule state delta (before/after diff), and justification.
- ⚙️ **Reactive Configuration**: Live-tunable confidence sliders, discipline toggles, auto-update switches, matching rules, and full JSON state export/import.
- 🔍 **Universal Global Search (`Ctrl+K`)**: Instant cross-entity search across activities, DPRs, audit records, and memory.

---

## 🛠️ 4. Technology Stack

- **Frontend Framework**: React 18 with Vite
- **Language**: TypeScript for strict EPC data modeling
- **Styling**: Tailwind CSS with enterprise industrial dark navy and slate themes
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Celebration Effects**: Canvas Confetti
- **State Management & Persistence**: React Context API synchronized with `localStorage` (100% offline, zero paid API dependencies)

---

## 📁 5. Folder Structure

```
g:/progress ai/
├── index.html                # HTML entry point with EPC typography
├── package.json              # Dependencies and build scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Custom construction palette theme
├── tsconfig.json             # TypeScript compiler settings
├── vite.config.ts            # Vite configuration & dev server
└── src/
    ├── main.tsx              # React mounting root
    ├── App.tsx               # Primary layout with navigation router
    ├── index.css             # Tailwind base & custom animations
    ├── types/
    │   └── index.ts          # Core EPC interfaces & data types
    ├── services/
    │   ├── nlpMatcher.ts     # Domain synonym matcher & confidence scoring
    │   └── activityExtractor.ts # Supervisor text/speech parameter parser
    ├── data/
    │   └── seedData.ts       # 30+ L5/L6 activities, 15 DPRs, historical memory
    ├── context/
    │   └── AppContext.tsx    # Reactive state, persistent storage, and actions
    ├── components/
    │   ├── Sidebar.tsx       # Enterprise navigation drawer
    │   ├── Topbar.tsx        # Project switcher, global search, notifications
    │   ├── KpiCard.tsx       # Metric cards with sparklines and trends
    │   ├── ConfidenceBadge.tsx # High/Medium/Low confidence indicators
    │   ├── StatusBadge.tsx   # Visual status chips
    │   └── GlobalSearchModal.tsx # Universal search dialog (Ctrl+K)
    └── views/
        ├── DashboardView.tsx     # Executive control center & S-Curve
        ├── TimeAgentView.tsx     # Conversational supervisor interface
        ├── ReportsView.tsx       # Daily progress reports management
        ├── InputIngestionView.tsx# File ingestion & sample loaders
        ├── ScheduleView.tsx      # L5/L6 Master schedule table & actuals
        ├── ReviewQueueView.tsx   # Planner triage & re-linking modal
        ├── AnalyticsView.tsx     # 7 interactive Recharts visualizers
        ├── ProjectMemoryView.tsx # Historical benchmarks & delay mitigations
        ├── AuditTrailView.tsx    # Regulatory compliance ledger
        └── SettingsView.tsx      # Configurable thresholds & backup tools
```

---

## 🚀 6. How to Install & Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (included with Node.js)

### Installation
1. Open your terminal and navigate to the project directory:
   ```bash
   cd "g:\progress ai"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Build
To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## 🧠 7. How the AI Matching Engine Works

The local AI matching engine evaluates unstructured site reports using a weighted, multi-layered deterministic algorithm:

1. **Tag & Equipment Code Extraction**:
   Regular expressions extract high-value EPC identifiers such as `Line 24`, `Line 24-XX`, `CT102`, `F102`, `P-101A`, `C-101`. Exact tag matches grant a **+45% primary weight**.
2. **EPC Synonym Expansion**:
   Correlates field terms with schedule standards across 12 domain synonym groups:
   - `erect` ↔ `erected` ↔ `erection` ↔ `spool erection` ↔ `fitup`
   - `foundation` ↔ `footing` ↔ `raft` ↔ `plinth` ↔ `casting` ↔ `concrete`
   - `cable tray` ↔ `tray` ↔ `cable pull` ↔ `cable laying` ↔ `cable work`
   - `termination` ↔ `glanding` ↔ `lugging` ↔ `terminal` ↔ `wiring`
   - `hydrotest` ↔ `pressure test` ↔ `leak test` ↔ `test pack`
3. **Token Overlap & Jaccard Similarity**:
   Calculates ratio of shared operational words between input and schedule activity titles (**+35% weight**).
4. **Fuzzy String Distance**:
   Levenshtein metric accounts for spelling differences, typos, and abbreviations (**+15% weight**).
5. **Discipline Bias Filtering**:
   Validates trade alignment (Piping vs Civil vs Electrical) and applies penalty for cross-discipline mismatches.
6. **Threshold Routing**:
   - **Score ≥ 90%**: **HIGH CONFIDENCE** → Prompts 1-Click "Approve & Update".
   - **Score 70–89%**: **MEDIUM CONFIDENCE** → Flags "Planner Review Recommended".
   - **Score < 70%**: **LOW CONFIDENCE** → Displays "No Reliable Match", directs to "Send to Planner".

---

## 🎬 8. Live Demonstration Walkthrough (SIH Presentation Guide)

### Demo Scenario 1: High Confidence Spool Erection
1. **Open Dashboard**: Note initial KPIs (Activities Processed, Auto Matched, Completion %).
2. **Go to Time Agent**: Click on the example prompt or type:
   > *"Line 24 spool erection started at 9:15 AM and completed at 4:30 PM."*
3. **Observe AI Processing**: Watch the multi-step status indicator:
   - *Reading site update...* → *Extracting activity...* → *Matching L5/L6 schedule...* → *Calculating confidence...*
4. **Inspect Extracted Card**:
   - **Discipline**: Piping
   - **Normalized Activity**: Line 24 spool erection
   - **Timing**: 09:15 AM to 04:30 PM
   - **Matched Activity**: `PIP-L6-024 Erect Line 24-XX` (Confidence: **96%**)
5. **Click "Approve & Update"**: Confetti triggers and toast notification confirms schedule sync.
6. **Open Schedule**: Filter by `PIP-L6-024`. Observe Actual Start (17 Sept 2026), Actual Finish (17 Sept 2026), Status: **Completed**, Progress: **100%**.
7. **Open Audit Trail**: Review the newly logged immutable record signed off by `Planner-02`.
8. **Open Project Memory**: See the completed activity recorded in historical duration statistics.
9. **Open Analytics & Dashboard**: Observe KPIs and completion percent updated in real-time.

### Demo Scenario 2: Ambiguous Update & Planner Triage
1. **In Time Agent**, enter:
   > *"Cable work completed."*
2. **Observe AI Result**: Engine flags **LOW CONFIDENCE (68%)** due to lack of specific cable tray/tag identifier. Shows candidate matches:
   - `Install Cable Tray CT102` (68%)
   - `Cable Termination CT201 in MCC-01` (54%)
3. **Click "Send to Planner"**: The item is routed to the Review Queue.
4. **Open Review Queue**: Locate the item with status **Pending**.
5. **Click "Edit Match"**: The planner modal opens. Search for and select `ELE-L6-102 Install Cable Tray CT102`.
6. **Click "Approve & Update Schedule"**: The match is authoritative (100%), queue is cleared, and schedule milestone is credited.

---

## 🔒 9. Safety & Data Integrity Principles

- **Zero Silent Overwrites**: ProgressAI will never modify an L5/L6 milestone silently when confidence is medium or low.
- **Planner Authority**: Human planners retain final veto, reassignment, and sign-off authority.
- **Contractual Traceability**: Every schedule date modification records user ID, timestamp, original source text, and engine confidence.

---

## 🔮 10. Future Scope

- **Direct Primavera P6 / MS Project REST Integration**: Native Primavera P6 Web Services and MS Project Online bi-directional synchronization.
- **Computer Vision for Site CCTV**: On-site camera feeds analyzing concrete pour trucks and pipe laydown yards.
- **Multilingual / Voice Dialect Support**: Hindi, regional Indian languages, and noisy field voice recognition for site foremen.
- **BIM 4D/5D Linking**: Overlaying actual completion dates on Autodesk Revit / Navisworks 3D models for color-coded visual site walkthroughs.

---

## 📄 License
Developed for the **Smart India Hackathon (SIH)**. Open for academic and demonstration evaluation.
