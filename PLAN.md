# 3D Workspace Frontend Assessment — Implementation Plan

## Project Objectives

Deliver the three-part 3D Workspace Frontend Developer (React) technical assessment:

| Deliverable | Weight | Description |
|---|---|---|
| **Part A** | 40% | Architecture design document as a single PDF |
| **Part B** | 40% | Working React/TypeScript 3D industrial layout editor |
| **Part C** | 20% | Preparation for 60-minute engineering design review |

**Time Budget**: 8–10 hours total focused effort. Part B core editor ≈ 5 hours.

---

## Requirements Traceability Matrix

### Part B — Mandatory (P0)

| ID | Requirement | Implementation | Acceptance Criteria | Status |
|---|---|---|---|---|
| B1 | Floor grid 20m × 12m, 0.5m cells | `src/features/editor/FloorGrid.tsx` | Grid renders with 40×24 cells, axes visible | ✅ Completed |
| B2 | Equipment palette ≥3 item types | `src/features/palette/` | Cabinet, Drive, Control Panel with metadata | ✅ Completed |
| B3 | Place items with grid snapping | `src/features/editor/PlacedItem.tsx` + store | Items snap to 0.5m grid, stay within bounds | ✅ Completed |
| B4 | Select, move, rotate, delete items | Store actions + viewport interaction | All operations work from viewport | ✅ Completed |
| B5 | Undo/redo for every edit | `src/store/useEditorStore.ts` | Add/move/rotate/delete/property edits undoable | ✅ Completed |
| B6 | Item list + properties panel synced | `src/features/scene-list/` + `src/features/properties/` | Select in list ↔ viewport, properties update | ✅ Completed |
| B7 | Clearance rule: <0.6m violation | `src/features/rule-validation/` | Violations highlighted, both items named | ✅ Completed |
| B8 | Bill of materials from scene | `src/features/bom/` | Grouped by type, count, auto-updates | ✅ Completed |
| B9 | EN/VI language toggle | `src/i18n/` | Labels, equipment names, BOM, rules toggle | ✅ Completed |
| B10 | README with run instructions + FPS@500 | `README.md` | Exact commands, measured FPS, hardware | ✅ Completed |

### Part B — Optional "Strong Signals" (P1/P2)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| B11 | AI assistant preview (mock, deterministic) | P1 | ✅ Completed (`GhostPreview.tsx` + `AssistantPanel.tsx`) |
| B12 | Keyboard editing + accessibility | P1 | ✅ Completed (Arrows nudge 0.5m, `R` rotate, `Del` remove) |
| B13 | Embedded mode (iframe + postMessage) | P2 | ✅ Completed (`HostSimulationModal.tsx`) |
| B14 | 3D model optimisation (documented) | P2 | ✅ Completed (`docs/Cloudworx_PartA_Architecture_Design.pdf` §11) |
| B15 | Editing depth (JSON export/import) | P2 | ✅ Completed (Toolbar Export/Import) |

### Part A — Architecture Document

| ID | Section | Status |
|---|---|---|
| A1 | Executive summary | ✅ Completed |
| A2 | Requirements and constraints | ✅ Completed |
| A3 | System architecture diagram (Mermaid) | ✅ Completed (`docs/architecture-diagram.mmd`) |
| A4 | Application structure and module boundaries | ✅ Completed |
| A5 | Technology selection and justification | ✅ Completed |
| A6 | State and data architecture | ✅ Completed |
| A7 | Large grids and forms | ✅ Completed |
| A8 | Internationalisation and accessibility | ✅ Completed |
| A9 | Host embedding and security | ✅ Completed |
| A10 | 3D editing architecture | ✅ Completed |
| A11 | 3D asset optimisation | ✅ Completed |
| A12 | AI assistant architecture | ✅ Completed |
| A13 | Performance and quality strategy | ✅ Completed |
| A14 | End-to-end interaction sequence | ✅ Completed |
| A15 | Trade-offs and rejected alternatives | ✅ Completed |
| A16 | Assumptions and risks | ✅ Completed |
| A17 | Testing and acceptance criteria | ✅ Completed |

### Part C — Design Review

| ID | Item | Status |
|---|---|---|
| C1 | `docs/DESIGN_REVIEW.md` with 13 discussion topics | ✅ Completed |
| C2 | Demo walkthrough script | ✅ Completed |
| C3 | Editable architecture diagram ready | ✅ Completed |

---

## Technology Stack

| Layer | Choice | Justification |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | Assessment requirement |
| Build | Vite 5 | Fast HMR, ESM-native, small config |
| 3D | Three.js via React Three Fiber + Drei | Declarative 3D in React, large ecosystem, community support |
| State | Zustand | Minimal boilerplate, selector-based reactivity, middleware for undo |
| Styling | Tailwind CSS | Rapid industrial UI, consistent spacing, purged in prod |
| i18n | i18next + react-i18next | Mature, namespace support, interpolation, plurals |
| Testing | Vitest + React Testing Library | Vite-native, fast, compatible |
| Linting | ESLint + Prettier | Standard quality gates |

**Rejected alternatives**:
- Redux: Unnecessary boilerplate for a local editor. Zustand achieves the same with less code.
- Babylon.js: Heavier, less React integration than R3F.
- CSS Modules: Less productive than Tailwind for rapid prototyping.
- MobX: Observable model adds complexity vs. Zustand's simplicity.

---

## Directory Structure

```
3d-workspace/
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   ├── equipment.ts          # Equipment type definitions
│   │   ├── scene.ts              # Scene model types
│   │   └── editor.ts             # Editor state types
│   ├── store/
│   │   ├── useEditorStore.ts     # Main editor state with undo/redo
│   │   └── editorActions.ts      # Action creators
│   ├── features/
│   │   ├── editor/
│   │   │   ├── EditorViewport.tsx # R3F Canvas + scene
│   │   │   ├── FloorGrid.tsx     # 20×12m grid
│   │   │   ├── PlacedItem.tsx    # Individual 3D item
│   │   │   ├── SceneItems.tsx    # All placed items renderer
│   │   │   ├── CameraControls.tsx
│   │   │   └── GhostPreview.tsx  # AI proposal preview
│   │   ├── palette/
│   │   │   └── EquipmentPalette.tsx
│   │   ├── properties/
│   │   │   └── PropertiesPanel.tsx
│   │   ├── scene-list/
│   │   │   └── SceneList.tsx
│   │   ├── rule-validation/
│   │   │   ├── RuleEngine.ts     # Clearance validation logic
│   │   │   └── ViolationsPanel.tsx
│   │   ├── bom/
│   │   │   └── BillOfMaterials.tsx
│   │   ├── assistant/
│   │   │   ├── AssistantPanel.tsx
│   │   │   └── mockAssistant.ts
│   │   └── toolbar/
│   │       └── Toolbar.tsx
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── en.json
│   │   └── vi.json
│   ├── hooks/
│   │   ├── useGridSnap.ts
│   │   └── usePerformanceStats.ts
│   ├── utils/
│   │   ├── geometry.ts
│   │   └── idGenerator.ts
│   └── styles/
│       └── globals.css
├── tests/
│   ├── store/
│   │   └── editorStore.test.ts
│   ├── features/
│   │   └── ruleEngine.test.ts
│   └── setup.ts
├── docs/
│   ├── 3D Workspace_PartA_Architecture_Design.md  # Source for PDF
│   ├── architecture-diagram.mmd
│   ├── DESIGN_REVIEW.md
│   └── PERFORMANCE.md
└── public/
    └── models/               # glTF assets if used
```

---

## Component Architecture

```
App
├── Toolbar (undo/redo, save, language toggle, perf stats)
├── MainLayout (flex row)
│   ├── EquipmentPalette (left sidebar)
│   ├── EditorViewport (center, R3F Canvas)
│   │   ├── FloorGrid
│   │   ├── SceneItems
│   │   │   └── PlacedItem × N
│   │   ├── GhostPreview (AI proposal)
│   │   └── CameraControls
│   └── RightPanel (right sidebar, tabs)
│       ├── PropertiesPanel
│       ├── SceneList
│       ├── ViolationsPanel
│       └── BillOfMaterials
└── AssistantPanel (bottom or floating)
```

---

## State Management Architecture

### Zustand Store Structure

```typescript
interface EditorState {
  // Scene data (canonical, serialisable)
  items: Record<string, PlacedItem>;
  
  // Selection (transient, NOT in undo history)
  selectedItemId: string | null;
  hoveredItemId: string | null;
  
  // Undo/redo history
  history: SceneSnapshot[];
  historyIndex: number;
  
  // UI state
  activeMode: 'select' | 'place';
  placingType: EquipmentType | null;
  language: 'en' | 'vi';
  
  // Rule violations (derived, recalculated)
  violations: Violation[];
  
  // AI assistant
  aiProposal: AIProposal | null;
  
  // Actions
  addItem: (type: EquipmentType, position: Vec3) => void;
  moveItem: (id: string, position: Vec3) => void;
  rotateItem: (id: string, rotation: number) => void;
  deleteItem: (id: string) => void;
  updateItemProperty: (id: string, key: string, value: any) => void;
  selectItem: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
}
```

### Undo/Redo Strategy

Use **snapshot-based undo** with selective state:
- Each undoable action pushes a snapshot of `items` (the canonical scene state) to history.
- Selection and hover are NOT included in snapshots.
- New edits after undo clear the redo branch.
- History capped at 50 entries to bound memory.
- AI proposal acceptance creates a normal undoable entry.

This is simpler than command pattern and sufficient for the prototype scope.

---

## Grid Snapping and Collision Strategy

- **Grid**: Origin at (0, 0, 0). X-axis = width (0 to 20m). Z-axis = depth (0 to 12m). Y-axis = up.
- **Snapping**: Round position to nearest 0.5m: `Math.round(pos / 0.5) * 0.5`
- **Bounds checking**: Clamp item center within [0, 20] × [0, 12], accounting for item dimensions.
- **Clearance rule**: Distance between item centers < 0.6m → violation. Recalculated on every scene mutation.

---

## i18n Strategy

- Two locale files: `en.json`, `vi.json`
- Keys: `toolbar.undo`, `palette.cabinet`, `bom.title`, `rules.clearanceViolation`, etc.
- Language toggle in toolbar switches `i18next.changeLanguage()`
- Machine translations acceptable per assessment

---

## Performance Budget

| Metric | Target | Measurement Method |
|---|---|---|
| 500 items FPS | ≥50 FPS at 1080p | Three.js `renderer.info` + `performance.now()` loop |
| Draw calls | <300 | `renderer.info.render.calls` |
| Browser memory | <1 GB | `performance.memory` (Chrome) |
| Bundle size | <500 KB gzipped | `vite build` + analysis |

### Optimisation Priorities
1. Reuse geometries and materials across same-type items
2. Avoid React re-renders during pointer movement (use refs)
3. Use `React.memo` on item components with stable props
4. Consider instancing for repeated primitives at high item counts
5. Debounce violation recalculation if needed

---

## Milestones

| # | Milestone | Priority | Est. Time |
|---|---|---|---|
| 1 | Project scaffold + Vite + R3F + Zustand + Tailwind + i18n | P0 | 30 min |
| 2 | Floor grid + camera controls | P0 | 30 min |
| 3 | Equipment palette + placement with snapping | P0 | 45 min |
| 4 | Selection + move + rotate + delete | P0 | 60 min |
| 5 | Undo/redo with history | P0 | 30 min |
| 6 | Item list + properties panel (synced) | P0 | 45 min |
| 7 | Clearance validation + violations panel | P0 | 30 min |
| 8 | BOM table + language toggle | P0 | 30 min |
| 9 | Unit tests (store, rules, undo) | P0 | 30 min |
| 10 | Performance benchmark @ 500 items | P0 | 30 min |
| 11 | AI assistant mock preview | P1 | 45 min |
| 12 | Keyboard editing + accessibility | P1 | 30 min |
| 13 | Part A architecture document | P0 | 120 min |
| 14 | Part C design review notes | P0 | 30 min |
| 15 | Final polish, README, validation | P0 | 30 min |
| | **Total** | | **~9.5 hours** |

---

## Dependencies and Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Three.js performance on 500 items | Benchmark may not hit 50 FPS | Use instancing, shared geometries |
| Complex undo bugs | Stale state after undo | Snapshot-based approach, thorough tests |
| R3F click/drag interference | Difficult selection/movement | Use Drei TransformControls or pointer events |
| PDF generation in CI-less env | Can't auto-generate PDF | Use Markdown → PDF via pandoc or browser print |
| Tailwind + R3F canvas sizing | Layout issues | Test responsive layout early |

---

## Assumptions

1. No backend service needed — all data is local/in-memory.
2. No real glTF models required — primitives are acceptable per assessment.
3. Machine-translated Vietnamese is acceptable.
4. The application runs offline without API keys.
5. Performance measurements are from the development machine.
6. The assessment PDF is kept out of the public repository.
7. Chrome/Edge target browsers.

---

## Execution Order

1. ✅ Inspect assessment and existing files
2. ✅ Create PLAN.md
3. 🔲 Scaffold project (Vite + React + TS + R3F + Zustand + Tailwind + i18n)
4. 🔲 Implement core editor (grid, palette, placement, selection, move, rotate, delete)
5. 🔲 Implement undo/redo
6. 🔲 Implement item list + properties panel
7. 🔲 Implement clearance validation
8. 🔲 Implement BOM + language toggle
9. 🔲 Add tests
10. 🔲 Performance benchmark
11. 🔲 AI assistant (optional)
12. 🔲 Part A architecture document + PDF
13. 🔲 Part C design review notes
14. 🔲 README + final validation

