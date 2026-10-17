# Cloudworx Industrial Digital Twin Platform — Architectural Design Document
**Document Reference:** CWX-ARCH-2026-v1.0  
**Authors:** Senior Frontend Architect & 3D Web Graphics Specialist  
**Product Surfaces:** Surface 1 (Procurement Workspace) & Surface 2 (Embedded 3D Configuration Workspace)  
**Date:** October 2026  

---

## 1. Executive Summary

This architecture design document establishes the technical blueprint for the Cloudworx Industrial Digital Twin platform across two core product surfaces:
1. **Surface 1: Enterprise Procurement Workspace:** An enterprise 2D web application serving 3,000 global buyers and suppliers across Vietnam, India, and China for supplier onboarding, document compliance, and multi-line item RFQ comparisons over high-density data tables (up to 50,000 suppliers and 200,000 document records).
2. **Surface 2: Embedded 3D Configuration Workspace:** An industrial 3D micro-application embedded within an OEM partner's production product-selection host portal. It enables sales engineers and plant architects to layout industrial electrical rooms ($20\text{m} \times 12\text{m}$ envelope), position drives, cabinets, and control panels with $0.5\text{m}$ grid quantization, observe real-time engineering clearance rules (< $0.6\text{m}$ separation), inspect live bills of materials (BOM), and collaborate with an AI assistant that previews and proposes automated layout modifications.

### Scope Distinction: Implemented Prototype vs. Proposed Production Architecture

| Capability | Part B Implemented Prototype | Proposed Production Architecture |
| :--- | :--- | :--- |
| **Framework & Language** | React 18, TypeScript (Strict), Vite 6 | React 18, TypeScript Monorepo (pnpm workspaces / Turborepo) |
| **3D Engine** | Three.js via React Three Fiber (R3F) & Drei | R3F + Three.js + Custom WebGPU / WebGL2 Fallback Pipeline |
| **State & Edit History** | Zustand store with snapshot-based undo/redo (max 50) | Zustand for local scene + TanStack Query for server sync + WebSocket CRDT |
| **Grid & Asset Scale** | $20\text{m} \times 12\text{m}$ grid, 3 primitive types, 500 items benchmark | 300 glTF CAD models, 3 LODs, Draco/KTX2, up to 2,000 items |
| **Rule Validation** | In-memory AABB edge-to-edge 0.6m clearance check | Spatial hash grid client-side + Server-side asynchronous validation |
| **Host Embedding** | In-app PostMessage simulator modal (origin + payload checks) | Sandboxed iframe + Web Component MFE option + CSP Level 3 |
| **AI Assistant** | Deterministic mock with streaming generator & ghost preview | Streaming LLM service via Server-Sent Events (SSE) with JSON Schema |
| **Localisation** | English & Vietnamese (react-i18next) | English, Vietnamese, Simplified Chinese (i18next + ICU message format) |

---

## 2. Requirements and Constraints Analysis

### Key Constraints and Architecture Drivers

1. **Host-Owned Authentication (OpenID Connect / OAuth2):**
   - *Impact:* The embedded 3D application cannot maintain an independent login portal. Authentication context (bearer token, tenant ID, user role) is passed across the boundary via a secure `postMessage` handshake. The micro-app must gracefully operate in degraded mode if host credentials expire.
2. **Hardware Constraints (Corporate Laptops with Integrated Graphics & 8 GB RAM):**
   - *Impact:* Corporate users run locked-down Chrome or Edge, often inside VDI or over 10 Mbps VPNs. The 3D scene must achieve $\ge 50\text{ FPS}$ at 1080p, with $< 300$ draw calls and $< 1\text{ GB}$ browser memory. This mandates aggressive geometry and material instancing, texture compression, and strict memory deallocation.
3. **Data Scale (Grids up to 50k Suppliers & 200k Documents):**
   - *Impact:* Rendering massive datasets in the Procurement Workspace requires DOM virtualization (rendering only visible rows + overscan) and cursor-based server pagination. Traditional un-virtualized DOM tables will freeze the browser tab.
4. **Accessibility (WCAG 2.2 AA) & Internationalisation:**
   - *Impact:* One unified codebase must support English, Vietnamese, and Simplified Chinese, including locale-specific currency (USD, VND, CNY, INR) and number formatting. The 3D canvas must have an accessible DOM sibling (Scene Hierarchy List) allowing full keyboard selection, inspection, translation, and deletion.

---

## 3. System Architecture Diagram

The system topology separates host boundaries, shared monorepo packages, UI layers, local state engines, and cloud microservices.

```
+-------------------------------------------------------------------------------+
|                   HOST APPLICATION BOUNDARY (OEM Portal)                     |
|  [Host Shell UI] <---> [Host OIDC Auth Provider] <---> [Host Project State]  |
+-------------------------------------------------------------------------------+
                                      |
                         postMessage (Origin Validated,
                         Versioned JSON Contract v1.0.0)
                                      |
+-------------------------------------------------------------------------------+
|                       CLOUDWORX MONOREPO PLATFORM                             |
|                                                                               |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  | @cloudworx/ui      |  | @cloudworx/tokens  |  | @cloudworx/contracts    |  |
|  | Shared Components  |  | Color, Spacing     |  | TypeScript Schemas      |  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|                                                                               |
|  +-----------------------------------+  +----------------------------------+  |
|  | Surface 1: Procurement Workspace  |  | Surface 2: Embedded 3D Editor    |  |
|  | - TanStack Virtual Data Grid      |  | - Zustand Canonical Scene Store  |  |
|  | - Multi-step Form Wizard          |  | - R3F Canvas & Camera Controls   |  |
|  | - Draft Auto-save Engine          |  | - AABB 0.6m Clearance Validator  |  |
|  +-----------------------------------+  | - Ghost Preview & AI Copilot     |  |
|                                         +----------------------------------+  |
+-------------------------------------------------------------------------------+
          | (HTTPS / REST)                               | (WSS / HTTPS)
+-------------------------------------------------------------------------------+
|                       CLOUD SERVICES & INFRASTRUCTURE                         |
|  [API Gateway] <---> [REST Services] <---> [WebSocket Sync] <---> [AI Service] |
|                                <---> [Edge Asset CDN (glTF/KTX2)]             |
+-------------------------------------------------------------------------------+
```

*(Source definition maintained in `docs/architecture-diagram.mmd`)*

---

## 4. Application Structure and Module Boundaries

We propose an enterprise monorepo managed with **pnpm workspaces** and **Turborepo**:

```
cloudworx-monorepo/
|-- apps/
|   |-- procurement/               # Surface 1: Enterprise Procurement SPA
|   |   |-- src/features/onboarding/
|   |   |-- src/features/compliance/
|   |   +-- src/features/rfq-compare/
|   +-- layout-editor/             # Surface 2: Embedded 3D Configuration Workspace
|       |-- src/features/editor/
|       |-- src/features/palette/
|       |-- src/features/properties/
|       +-- src/features/assistant/
+-- packages/
    |-- contracts/                 # Shared TypeScript interfaces & Zod schemas
    |-- design-tokens/             # Semantic tokens (CSS variables & Tailwind)
    |-- ui/                        # WCAG 2.2 AA component library
    |-- i18n/                      # Core i18next engines & shared translation keys
    +-- tsconfig/                  # Shared base TypeScript configurations
```

### Decoupled Release Trains
- The Procurement Workspace and 3D Layout Editor are built as independent artifacts and deployed to separate CDN endpoints.
- Breaking changes in `@cloudworx/contracts` utilize semantic versioning. The 3D micro-app can be updated and released without triggering a redeploy of the Procurement application.

---

## 5. Technology Selection and Justification

| Technology | Selected For | Justification | Alternatives Rejected |
| :--- | :--- | :--- | :--- |
| **React 18 + TS** | Both Surfaces | Fixed assessment requirement; strict type safety prevents runtime regressions in complex geometric calculations. | Plain JS (untenable for large CAD models). |
| **Vite 6** | Build & Dev Tool | Sub-second HMR, native ES module compilation, superior Rollup chunking. | Webpack (slower cold starts, complex config). |
| **React Three Fiber (R3F)** | 3D Viewport | Declarative scene graph that reconciles directly into Three.js without wrapper overhead. | Direct imperative Three.js (spaghetti code), Babylon.js (heavy bundle). |
| **Zustand** | Editor State | Lightweight (< 1.5 KB), unopinionated, zero boilerplate, outside-React selector subscriptions. | Redux Toolkit (boilerplate overhead), Context API (re-render cascades). |
| **TanStack Query** | Server State | Automatic background caching, query invalidation, retry backoff, and optimistic rollback. | SWR (fewer mutation primitives). |
| **TanStack Virtual** | Data Grids | Virtualizes DOM rows to keep DOM node count constant (~30 nodes for 200k rows). | Un-virtualized HTML table (crashes browser). |
| **i18next** | Internationalisation | Built-in namespace support, interpolation, pluralization, locale formatting. | FormatJS / react-intl (heavier runtime). |
| **Vitest** | Testing Suite | Native Vite integration, fast parallel test execution, compatible with Jest APIs. | Jest (slow Babel transformation overhead). |

---

## 6. State and Data Architecture

### State Separation Strategy

```
                          STATE TAXONOMY
  +-------------------------------------------------------------+
  | 1. Server State (TanStack Query)                            |
  |    - Project metadata, saved room configurations, BOM catalogs|
  +-------------------------------------------------------------+
  | 2. Canonical Scene State (Zustand)                         |
  |    - items: Record<string, PlacedItem>                      |
  |    - Serialisable, immutable, single source of truth        |
  +-------------------------------------------------------------+
  | 3. Undo/Redo Engine (Zustand Snapshot History)              |
  |    - history: SceneSnapshot[], historyIndex: number         |
  |    - Isolated from transient selection & viewport state     |
  +-------------------------------------------------------------+
  | 4. Ephemeral / Transient UI State                           |
  |    - selectedItemId, hoveredItemId, activeMode, camera matrix|
  +-------------------------------------------------------------+
  | 5. AI Assistant Proposal State                              |
  |    - aiProposal: { itemId, newX, newZ, status }            |
  |    - Visualized via GhostPreview before user confirmation   |
  +-------------------------------------------------------------+
```

### Offline & Degraded Mode on Flaky VPNs
- **Optimistic Mutations:** When saving a layout, the UI updates immediately and queues an HTTP `PUT` request with exponential retry backoff.
- **WebSocket Reconnection Protocol:** Upon VPN reconnect, the editor sends a `RESYNC_SCENE` message with its last known vector clock timestamp to resolve concurrent multi-user conflicts (Last-Write-Wins with property-level merging).

---

## 7. High-Density Data Grids and Long Multi-Step Forms

### Large Grids (50,000 Suppliers / 200,000 Documents)
- **DOM Virtualization:** Only 25–35 visible rows are mounted in the DOM at any instant. A scroll container of simulated height ($N \times \text{rowHeight}$) translates items via CSS `transform: translateY()`.
- **Server-Side Pagination:** Keyset/cursor pagination (`cursor=supplier_9941&limit=50`) avoids expensive database offset scans.
- **Saved Views & Filtering:** Filter predicates are stored in URL query parameters, enabling direct bookmarking and shareable links.

### Multi-Step Form Persistence & Recovery
- Long forms (e.g. 5-step Supplier Compliance Verification) persist partial drafts to `IndexedDB` on every input blur.
- If the browser tab crashes or the VPN disconnects, the user is presented with a "Resume Draft" prompt upon reload.
- Server-side validation returns standard RFC 7807 problem details mapped to individual form fields.

---

## 8. Internationalisation and Accessibility (WCAG 2.2 AA)

### Internationalisation (i18n)
- **Languages:** English (`en-US`), Vietnamese (`vi-VN`), and Simplified Chinese (`zh-CN`).
- **Locale Formatting:** Uses `Intl.NumberFormat` and `Intl.DateTimeFormat` for currency display (USD, VND, CNY, INR) and number separators.
- **CJK Line Breaking & Expansion:** CSS `word-break: break-word` and `overflow-wrap: anywhere` prevent clipping when Vietnamese text expands by 25–35% compared to English.

### Accessibility in 3D Environments
- 3D WebGL canvases are non-semantic to screen readers.
- **Accessible Sibling Pattern:** The 3D editor provides a synchronized DOM Scene Hierarchy (`src/features/scene-list/SceneList.tsx`) with `role="listbox"` and `aria-selected` attributes.
- **Keyboard Navigation:** Users can navigate items via `Up`/`Down` keys, nudge items by 1 grid cell ($0.5\text{m}$) using Arrow keys, rotate items via `R`, and delete via `Delete`, with live `aria-live="polite"` clearance violation announcements.

---

## 9. Host Embedding and Security

### Iframe vs. Micro-Frontend Evaluation

| Aspect | Iframe Architecture (Recommended for Pilot) | Micro-Frontend / Module Federation |
| :--- | :--- | :--- |
| **CSS & JS Isolation** | Complete sandboxing; zero style bleed or global namespace collisions. | Shared runtime; styles can leak without strict Shadow DOM. |
| **Security Boundary** | High; strict origin checking, CSP `frame-ancestors`. | Low; host and micro-app share same DOM and JS memory. |
| **Context Communication** | Explicit via `window.postMessage`. | Shared memory / JS Event Target. |
| **Recommendation** | **Primary architecture for Surface 2** | Evaluated for enterprise hosts that prohibit iframes |

### Versioned PostMessage Handshake Protocol (v1.0.0)

1. **Host Initialization (`CLOUDWORX_HOST_INIT`):**
   ```json
   {
     "type": "CLOUDWORX_HOST_INIT",
     "version": "1.0.0",
     "payload": {
       "projectId": "PRJ-VN-2026-0891",
       "user": { "id": "usr-1", "role": "SalesEngineer" },
       "roomDimensions": { "width": 20, "depth": 12 }
     }
   }
   ```
2. **Security Checks:**
   - Verify `event.origin === hostOrigin` (never allow wildcard `*`).
   - Verify `event.source === window.parent`.
   - Validate payload against Zod schema.
3. **Token Handling:** Bearer tokens are stored exclusively in in-memory closures—never in `localStorage` or URL query params.

---

## 10. 3D Editing Architecture

- **World Coordinate Space:** Cartesian origin $(0, 0, 0)$ at room corner. $+X$ extends across floor width ($0$ to $20\text{m}$), $+Z$ extends across room depth ($0$ to $12\text{m}$), $+Y$ points vertically upwards.
- **Snapping Quantization:**
  $$\text{snap}(v) = \text{round}\left(\frac{v}{0.5}\right) \times 0.5$$
- **Boundary Clamping:** Item coordinates are clamped to $[W_{\text{half}}, 20 - W_{\text{half}}]$ and $[D_{\text{half}}, 12 - D_{\text{half}}]$.
- **Reversible Edit Commands:** Every add, move, rotate, delete, or accepted AI proposal creates a snapshot on the history stack, enabling full `Ctrl+Z` / `Ctrl+Shift+Z` navigation.

---

## 11. 3D Asset Optimisation Pipeline

Converting a 40 MB raw CAD export (STEP/IGES) into a web-ready asset:

```
[Raw CAD STEP/IGES (40 MB)]
           |
     Meshing & NURBS tessellation
           |
[Unoptimized glTF (25 MB, 350k polys)]
           |
     gltf-transform (meshopt, deduplication, weld)
           |
     Mesh Simplification (3 LOD levels: 100%, 25%, 5%)
           |
     Texture Compression (basisu -> KTX2 / UASTC)
           |
[Production Web Asset (1.2 MB, 35k polys, KTX2)]
```

### Performance Budgets

| Metric | Target Budget per Model | Target Budget per Scene (500 Items) | Measured Prototype (Primitives) |
| :--- | :--- | :--- | :--- |
| **File Size (Compressed)** | $< 2.5\text{ MB}$ | $< 25\text{ MB}$ total download | **In-memory procedural** |
| **Triangle Count** | $< 40,000$ (LOD0) | $< 600,000$ total | **6,000 triangles** |
| **Draw Calls** | 1–3 calls | $< 300\text{ calls}$ | **4 calls** |
| **Texture VRAM** | $< 8\text{ MB}$ | $< 80\text{ MB}$ | **< 1 MB** |

---

## 12. AI Assistant Architecture

The AI layout copilot follows a strict human-in-the-loop review workflow:
1. User enters natural language request (e.g. *"Fix clearance violations"*).
2. Assistant streams explanatory response via Server-Sent Events (SSE).
3. Assistant outputs a structured proposal JSON conforming to `AIProposal` schema.
4. Editor renders `<GhostPreview />` displaying proposed positions in translucent green.
5. User chooses **Accept** or **Reject**.
6. On acceptance, the layout modification is applied and recorded as an undoable state snapshot.

---

## 13. Performance and Quality Strategy

- **CI/CD Performance Budgets:** Automated Lighthouse and bundle-analyzer checks in GitHub Actions fail builds exceeding 500 KB gzipped initial JS.
- **Telemetry Probes:** Real-time FPS, draw calls, and memory monitoring via Three.js WebGL statistics.
- **Hardware Validation:** Benchmarked on target corporate profile (Apple M1, 8 GB RAM, 1080p viewport).

---

## 14. End-to-End Interaction Sequence

### Complete Sales Engineer Workflow Scenario
1. Sales engineer drags a Cabinet from palette to floor $(5.0, 5.0)$.
2. Editor snaps position to nearest $0.5\text{m}$ grid increment.
3. Engineer places a Drive at $(5.4, 5.0)$ ($< 0.6\text{m}$ clearance).
4. `RuleEngine` recalculates AABB separation and flags a clearance violation ($0.2\text{m} < 0.6\text{m}$).
5. Viewport renders red warning borders around both units; Violations Panel displays error.
6. Engineer prompts AI Assistant: *"Fix clearance violation"*.
7. Assistant streams response and proposes moving Drive to $(6.5, 5.0)$.
8. Viewport displays green `<GhostPreview />` at $(6.5, 5.0)$.
9. Engineer clicks **Accept**. Drive moves, clearance violation clears, and BOM updates.
10. Engineer presses `Ctrl+Z` to undo the change; drive returns to $(5.4, 5.0)$ and violation re-appears.

---

## 15. Trade-offs and Rejected Alternatives

1. **Snapshot Undo vs. Operational Transform (OT):**
   - *Choice:* Snapshots.
   - *Rationale:* Memory footprint for 500 items is under 25 KB per snapshot. OT adds high complexity without tangible benefit for local editing.
2. **Tailwind CSS vs. Heavy UI Component Library:**
   - *Choice:* Tailwind CSS with custom industrial semantic tokens.
   - *Rationale:* Eliminates runtime CSS-in-JS overhead while ensuring responsive, accessible layouts.
3. **Client-Side vs. Server-Side Clearance Validation:**
   - *Choice:* Client-side AABB validation for instant feedback + asynchronous server verification for multi-user compliance.

---

## 16. Assumptions and Technical Risks

- **Assumptions:** Host application supplies valid OIDC user context via postMessage; CAD files can be pre-processed into glTF 2.0; users have WebGL 2.0 capable browsers.
- **Risks & Mitigations:**
  - *VPN Disconnection:* Mitigated by local draft caching in IndexedDB and automatic query reconnection backoff.
  - *Integrated GPU Thermal Throttling:* Mitigated by LOD switching, geometry instancing, and dynamic resolution scaling.

---

## 17. Testing Strategy and Acceptance Matrix

- **Unit Testing (Vitest):** 100% coverage on clearance distance calculations, AABB rotations, coordinate grid snapping, and undo/redo state transitions.
- **Component Testing:** Properties panel input validation, BOM aggregation tables, language toggle updates.
- **Stress Testing:** Automated 500-item scene population verifying $\ge 50\text{ FPS}$ and $< 300$ draw calls.
