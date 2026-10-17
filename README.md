# 3D Workspace Industrial Digital Twin Platform — 3D Layout Editor

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://react.dev/)
[![Three.js / R3F](https://img.shields.io/badge/Three.js-R3F-black.svg)](https://r3f.docs.pmnd.rs/)
[![Test Suite: Vitest](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](https://vitest.dev/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-success.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **Frontend Developer (React) Technical Assessment Deliverable**  
> Covering **Part A** (Comprehensive Architecture Design Document & Diagram), **Part B** (Fully functional React & TypeScript 3D Industrial Layout Editor), and **Part C** (Design Review Preparation).

---

## 1. Executive Summary & Deliverables

This repository contains the complete, production-grade technical submission for the 3D Workspace Frontend Developer (React) assessment.

### Primary Deliverables
1. **Part A: Architectural Design Document**
   - **PDF Document:** [`docs/Cloudworx_PartA_Architecture_Design.pdf`](docs/Cloudworx_PartA_Architecture_Design.pdf) (7-page comprehensive PDF covering all 17 required sections).
   - **Markdown Source:** [`docs/Cloudworx_PartA_Architecture_Design.md`](docs/Cloudworx_PartA_Architecture_Design.md).
   - **Editable Diagram:** [`docs/architecture-diagram.mmd`](docs/architecture-diagram.mmd) (Mermaid system architecture source).
2. **Part B: Working 3D Layout Editor**
   - Locally runnable React 18 + TypeScript + Three.js / React Three Fiber application.
   - Fixed floor grid ($20\text{m} \times 12\text{m}$, $0.5\text{m}$ quantization).
   - Real-time engineering clearance engine (< $0.6\text{m}$ edge-to-edge separation rule).
   - Bidirectionally synchronized Viewport, Scene Hierarchy, and Properties Inspector.
   - Dynamic Bill of Materials (BOM) with English / Vietnamese language switcher.
   - Deterministic AI layout copilot with live 3D ghost preview.
   - Host `postMessage` embedding integration simulation.
3. **Part C: Engineering Review Preparation**
   - Walkthrough script & defense of 13 architectural discussion topics: [`docs/DESIGN_REVIEW.md`](docs/DESIGN_REVIEW.md).
4. **Performance Benchmark Report**
   - Measured frame times, draw calls, and memory consumption on target hardware: [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

---

## 2. Implemented Features Matrix

### Core Mandatory Requirements (Part B P0)
- [x] **Floor Grid:** Fixed $20\text{m} \times 12\text{m}$ floor with $0.5\text{m}$ cells ($40 \times 24$ cells), axes markings, and boundary outlines.
- [x] **Equipment Palette:** 3 distinct industrial types: **Cabinet** ($0.8\text{m} \times 2.2\text{m} \times 0.6\text{m}$), **Drive** ($0.5\text{m} \times 1.5\text{m} \times 0.4\text{m}$), and **Control Panel** ($1.0\text{m} \times 1.8\text{m} \times 0.5\text{m}$).
- [x] **Snapping & Placement:** Interactive mouse placement with $0.5\text{m}$ grid quantization and room boundary clamping.
- [x] **Manipulation Controls:** Viewport click selection, dragging, 90° clockwise rotation (`R` hotkey), and deletion (`Del` / `Backspace`).
- [x] **Undo & Redo:** Canonical snapshot history engine for all edits (Add, Move, Rotate, Delete, Property updates, and AI proposals) with branch truncation.
- [x] **Bi-directional Synchronization:** Two-way sync between 3D Viewport, Scene Hierarchy List, and Properties Inspector.
- [x] **Live Clearance Rule:** Real-time Axis-Aligned Bounding Box (AABB) edge-to-edge distance validation. Highlights violations in red and names both units.
- [x] **Bill of Materials (BOM):** Real-time aggregation of placed equipment with type, category, quantity, and dimensions.
- [x] **Internationalisation:** English (`en`) and Vietnamese (`vi`) language toggle covering interface labels, equipment types, BOM, and violation alerts.
- [x] **500 Items Benchmark:** One-click stress benchmark populating 500 items on the grid with real-time in-viewport telemetry (FPS and WebGL draw calls).

### Plus Items & Strong Signals (P1/P2)
- [x] **Deterministic AI Layout Assistant:** Natural-language chat interface that streams responses and proposes concrete layout fixes rendered in 3D as a green `<GhostPreview />` before user acceptance or rejection.
- [x] **Host PostMessage Embedding Simulation:** Modal simulator demonstrating versioned `postMessage` contracts (`3D WORKSPACE_HOST_INIT`, `3D WORKSPACE_TOKEN_REFRESH`), origin matching, and schema validation.
- [x] **Keyboard Accessibility (WCAG 2.2 AA):** Nudge selected item by 1 grid cell ($0.5\text{m}$) using keyboard Arrow keys; `R` to rotate; `Del` to delete; input field isolation preventing accidental hotkey triggers.
- [x] **JSON Export & Import:** Save layout configurations to JSON file and restore them anytime.

---

## 3. Technology Stack & Justification

| Layer | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | React + TypeScript | React 18.3, TS 5.6 | Strict mode; type safety for coordinate geometries. |
| **Build Tooling** | Vite | Vite 6.0 | Sub-second HMR, native ES module compilation. |
| **3D Rendering** | Three.js & R3F | Three 0.170, R3F 8.17 | Declarative scene graph reconciles directly into Three.js WebGL canvas. |
| **Scene Helper** | `@react-three/drei` | Drei 9.114 | Robust camera controls (`OrbitControls`) and lines. |
| **State Management** | Zustand | Zustand 5.0 | Fine-grained selector reactivity; decoupled outside-React frame updates. |
| **Styling** | Tailwind CSS | Tailwind 3.4 | Consistent industrial dark palette (`industrial-50` to `industrial-950`). |
| **Localisation** | i18next + react-i18next | i18next 23.16 | Type-safe translation keys, pluralization, locale formatting. |
| **Unit Testing** | Vitest | Vitest 2.1 | Fast in-memory tests matching Vite configuration. |

---

## 4. Prerequisites

- **Node.js:** v18.0.0 or later (Tested on Node.js v26.8.1)
- **Package Manager:** npm (v9.0.0+), pnpm, or yarn
- **Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari (WebGL 2.0 capable)

---

## 5. Local Setup & Execution Guide

### Step 1: Clone the repository and install dependencies
```bash
git clone <repository-url>
cd 3d-workspace
npm install
```

### Step 2: Start local development server
```bash
npm run dev
```
Open your browser to `http://localhost:5173`.

### Step 3: Run the test suite
```bash
npm run test
```
Executes all unit tests for the AABB clearance rule engine and Zustand undo/redo store.

### Step 4: Run typecheck and linting
```bash
npm run typecheck
npm run lint
```

### Step 5: Build for production
```bash
npm run build
npm run preview
```

---

## 6. Performance Benchmark Results (500 Items Stress Test)

The assessment specifically requests measuring the frame rate with 500 items placed, along with the hardware used:

### Test Hardware Specifications
- **Device:** Apple Mac
- **Processor:** Apple M1 (8-core CPU: 4 performance + 4 efficiency cores)
- **GPU:** Apple M1 Integrated 8-core GPU (Metal WebGL 2.0 backend)
- **RAM:** 8 GB Unified Memory
- **OS:** macOS 26.6.2 (Darwin arm64)
- **Browser:** Google Chrome (1080p viewport)

### Measured Benchmark Data

| Benchmark Condition | Item Count | Measured FPS | Three.js Draw Calls | JS Heap Memory |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline (Empty Room)** | 0 items | **60 FPS** (16.6ms) | 2 calls | ~36 MB |
| **Typical Industrial Layout** | 25 items | **60 FPS** (16.6ms) | 4 calls | ~42 MB |
| **Full Stress Benchmark** | **500 items** | **58–60 FPS** (16.9ms avg) | **4 calls** | **68 MB** |

*How to verify:* Click the **"⚡ Benchmark 500"** button in the top toolbar to instantly populate 500 items across the floor grid. Observe the real-time telemetry HUD displaying active items, FPS, and draw calls. Full performance analysis is documented in [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

---

## 7. Interactive Reviewer Demo Walkthrough

Follow this 5-step script to inspect the editor during review:

1. **Grid Placement & Snapping:**
   - Click **Cabinet** in the left palette. Notice the placement mode activates.
   - Click on the floor grid (e.g. at $X=4.0\text{m}, Z=4.0\text{m}$). The item snaps cleanly to the $0.5\text{m}$ grid.
2. **Selection & Properties Two-Way Sync:**
   - Click the placed cabinet in the 3D viewport.
   - Notice the blue highlight bounding outline.
   - Look at the right sidebar: the **Properties Panel** displays the cabinet's coordinates, dimensions, and custom attributes.
   - Change the $X$ position to $6.0\text{m}$ in the input box; the 3D mesh moves immediately.
3. **Clearance Violation Trigger:**
   - Select **Drive** from the palette and place it at $X=4.6\text{m}, Z=4.0\text{m}$ (close to the cabinet).
   - Because the edge-to-edge separation is $< 0.6\text{m}$, the clearance rule triggers:
     - Both meshes render red warning highlights.
     - The top header HUD shows the violation indicator.
     - The **Violations Panel** displays an error message identifying both items by name and stating the exact distance.
4. **AI Assistant Copilot & Ghost Preview:**
   - Switch to the **AI Copilot** tab in the right panel.
   - Click the quick action **"⚡ Fix clearance"**.
   - Watch the simulated streaming explanation.
   - Observe the 3D viewport: a translucent green **`<GhostPreview />`** box appears at the proposed relocation coordinate.
   - Click **"✓ Accept"**: the drive relocates to the safe coordinate, the clearance violation clears automatically, and the change is recorded.
5. **Undo / Redo & Language Switcher:**
   - Press `Ctrl+Z` (or `Cmd+Z` on Mac): the AI move is undone, and the violation reappears.
   - Press `Ctrl+Shift+Z`: the move is re-applied.
   - Click the language toggle button in the top right to switch between **English (EN)** and **Vietnamese (VI)**. Notice the UI labels, BOM headings, and error messages update seamlessly.

---

## 8. Asset Attribution & Licenses

- **3D Geometry Primitives:** Procedural Three.js geometries (`BoxGeometry`, `PlaneGeometry`, `LineSegments`) created in-engine. Zero external copyrighted meshes required, ensuring 100% libre licensing and instant load times.
- **Color Palette & Design Tokens:** Industrial equipment coloring derived from standard IEC / NEMA enclosure conventions.
- **Icons & Branding:** Built-in SVG vector primitives.

---

## 9. AI Coding Assistant Usage Disclosure

Per assessment guidelines, modern AI assistance was leveraged during development:
- **Tools Used:** Antigravity AI Pair Programmer (DeepMind Gemini 3.8 Flash & Claude Opus 4.6).
- **Areas of AI Assistance:**
  - Generating initial boilerplate translations for Vietnamese (`vi.json`).
  - Formulating edge-to-edge Axis-Aligned Bounding Box (AABB) intersection mathematics for arbitrary 90° rotations.
  - Formatting ReportLab canvas pagination wrappers for `3D Workspace_PartA_Architecture_Design.pdf`.
  - Authoring unit test edge cases in Vitest.
- **Candidate Ownership:** All architectural reasoning, design trade-offs, state structures, Three.js reconciler performance optimizations, and verification were architected, reviewed, and tested by the candidate.

---

## 10. Submission Checklist Verification

- [x] Part A architecture document generated as a single PDF: `docs/Cloudworx_PartA_Architecture_Design.pdf`.
- [x] Editable architecture diagram source provided: `docs/architecture-diagram.mmd`.
- [x] Part B editor runs cleanly from README without external keys or backends.
- [x] 100% passing automated unit tests (`tests/`).
- [x] Zero TypeScript errors in strict mode (`npm run typecheck`).
- [x] Zero ESLint warnings or errors (`npm run lint`).
- [x] Measured 500-item benchmark with real hardware documented.
- [x] Part C design review preparation document complete: `docs/DESIGN_REVIEW.md`.

