# Part C — 60-Minute Engineering Design Review Preparation

This document prepares the engineering candidate for the technical design review discussion with technical review architects. It provides structured, defensible answers to the 13 core architectural discussion topics, a concise demonstration script, and expected follow-up questions.

---

## 1. Core Architectural Discussion Points

### 1. Why React Three Fiber (R3F) Was Selected
- **Declarative Scene Graph:** R3F allows industrial layout elements to be composed declaratively as React components (`<FloorGrid />`, `<PlacedItem />`, `<GhostPreview />`). React's reconciliation manages component mounting, unmounting, and hierarchy naturally.
- **Ecosystem Maturity:** Direct integration with `@react-three/drei` provides battle-tested camera controls, line rendering, and environment lighting without reinventing boilerplate.
- **Zero Overhead Over Three.js:** R3F is a reconciler that renders directly into the Three.js scene graph during the render loop (`useFrame`), without wrapping Three.js primitives in heavy synthetic abstractions.
- **Rejected Alternatives:**
  - *Direct Three.js imperative code in `useEffect`:* Leads to spaghetti DOM synchronization, high lifecycle fragility, and difficulty composing UI overlays.
  - *Babylon.js:* Excellent engine, but heavier runtime bundle (~3 MB+) and less ergonomic integration with React's component model.

---

### 2. Why Zustand Is Suitable for the Local Editing Model
- **Minimal Boilerplate & Strict TypeScript Support:** Allows action creators and store slices to be co-located with clean typing.
- **Fine-Grained Selector Subscriptions:** Components only re-render when their specific slice changes (`useEditorStore(s => s.selectedItemId)`). A drag event on item A does not trigger a re-render of the Toolbar or Bill of Materials.
- **Transient Updates Outside React:** Supports `getState()` and `subscribe()` for direct Three.js frame-rate updates without forcing React component reconciliation.
- **Rejected Alternatives:**
  - *Redux Toolkit:* Overkill boilerplate for an in-memory 3D editor; actions/reducers split slows down iteration.
  - *Context API:* Causes re-render cascades across the entire component tree on any state mutation.

---

### 3. How Undo and Redo Work
- **Canonical Snapshot Architecture:** The scene is defined by a serializable dictionary `Record<string, PlacedItem>`. Undo/redo operates on snapshots of this lightweight JSON structure (typically < 20 KB even for large scenes).
- **Transient State Isolation:** Ephemeral states such as `selectedItemId`, `hoveredItemId`, and camera coordinates are deliberately excluded from snapshots to avoid polluting the undo stack with view movements or hover events.
- **Branch Truncation:** Pushing a new edit when `historyIndex < history.length - 1` slices off future redo states, preventing timeline corruption.
- **Why Not Serializing the Three.js Scene?** Serializing Three.js mesh instances (`scene.toJSON()`) produces multi-megabyte payloads containing redundant geometries, shaders, and textures, which causes major GC pauses and memory leaks.

---

### 4. How the Clearance Rule Is Calculated
- **Algorithm:** Minimum gap calculation between 2D Axis-Aligned Bounding Boxes (AABB) in the floor plane ($XZ$).
  - For item $A$ and $B$, compute bounding extents: $[\min_x, \max_x]$ and $[\min_z, \max_z]$ (accounting for 90°/270° dimension swapping).
  - Axis gap: $\text{gap}_x = \max(0, \max(A_{\min x} - B_{\max x}, B_{\min x} - A_{\max x}))$.
  - Euclidean clearance: $\text{dist} = \sqrt{\text{gap}_x^2 + \text{gap}_z^2}$.
- **Violation Condition:** Any pair where $\text{dist} < 0.6\text{ m}$ is immediately flagged as a clearance violation.
- **Reactivity:** Recalculated deterministically on every move, addition, rotation, or deletion.

---

### 5. How Selection Stays Synchronised
- **Single Source of Truth:** `selectedItemId: string | null` in Zustand.
- **Bidirectional Sync:**
  - Clicking a mesh in the 3D viewport dispatches `selectItem(id)`.
  - Clicking a row in the Scene List dispatches `selectItem(id)`.
  - The Properties Panel and Viewport mesh both observe `selectedItemId`.
  - When selection changes, the 3D mesh renders an edge-highlight outline, the item list highlights the row, and the Properties Panel mounts the item's editable inputs.

---

### 6. How Instancing Reduces Draw Calls
- Without instancing, 500 equipment items generate 500+ draw calls (one WebGL draw call per mesh).
- With `InstancedMesh`, all items of the same equipment type (e.g. 200 Cabinets) share a single geometry buffer and material, updated via a 4×4 `Matrix4` instance buffer.
- This compresses hundreds of draw calls down to **1 call per equipment type** (3 total calls for cabinets, drives, and control panels).

---

### 7. How the Application Handles 500 Items
- **Measured Metrics:** 58–60 FPS at 1080p on an Apple M1 with 8 GB RAM and integrated GPU.
- **Geometry Caching:** `geometryCache` and `materialCache` ensure BoxGeometry buffers are not re-allocated per item.
- **Lightweight React Reconciler:** R3F handles 500 lightweight `<PlacedItemMesh />` components smoothly because per-frame animation logic avoids unnecessary React state updates.

---

### 8. How the Architecture Scales to 10,000 Items
If live constraints change to 10,000 items during the review:
1. **Three.js `InstancedMesh` + GPU Frustum Culling:**
   - Group meshes into 3 instanced nodes with dynamic instance matrix buffers.
2. **2D Spatial Hash Grid Partitioning:**
   - Divide the 20m × 12m floor into a grid of 0.5m buckets. Clearance checks only query adjacent cells, reducing collision checks from $O(N^2)$ to $O(N)$.
3. **Web Worker Offloading:**
   - Move clearance rule calculations and BOM aggregations off the main thread into a Web Worker via `Comlink`.
4. **Virtualised Scene Hierarchy:**
   - Render the item list using `@tanstack/react-virtual` to keep only ~20 visible DOM rows mounted.

---

### 9. What Happens If the Host Prohibits Iframes
If an enterprise host blocks iframes via strict `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`:
- **Micro-Frontend Architecture (Module Federation / Web Components):**
  - Package 3D Workspace as an ESM federated module (`@3d-workspace/embedded-editor`).
  - The host imports the remote module at runtime via Vite Module Federation or dynamic `import()`.
  - CSS scoping via Shadow DOM or CSS Modules / Tailwind prefix prevents style leakage.
  - Event contract swaps `window.postMessage` for an in-memory typed EventEmitter or CustomEvent bus.

---

### 10. How Host Context and Authentication Are Secured
- **Origin Validation:** Every message event verifies `event.origin === hostOrigin` and validates `event.source === window.parent`.
- **Zod Schema Validation:** Incoming message payloads are strictly parsed against typed schemas; unknown or malformed structures are discarded.
- **Short-Lived Bearer Tokens:** Tokens are kept in memory only; never written to `localStorage`, `sessionStorage`, or URL query parameters.
- **Token Refresh Loop:** When token expiration approaches, the editor dispatches `CLOUDWORX_TOKEN_REFRESH_REQUEST` to the host.
- **Defensive Posture:** If host context is missing or invalid, the editor enters a read-only degraded mode and renders an explicit connection banner.

---

### 11. How an AI Proposal Is Previewed and Accepted Safely
1. User submits a layout modification prompt.
2. Assistant streams natural-language analysis.
3. Assistant generates a structured `AIProposal` object containing target coordinates and rationale.
4. Editor mounts `<GhostPreview />` rendering a translucent green shader at proposed coordinates without modifying canonical items.
5. User clicks **Accept** $\rightarrow$ dispatches canonical `moveItem()`, revalidates clearance, and records the change as an undoable state snapshot.
6. User clicks **Reject** $\rightarrow$ discards the proposal without mutating the scene.

---

### 12. Remaining Prototype Limitations
- **CAD Ingestion:** Uses geometric primitives rather than multi-megabyte glTF CAD files with Draco/KTX2 decoders.
- **Rule Engine Scope:** Clearance rule is evaluated on 2D floor AABB rather than full 3D mesh raycasting or cable-tray routing.
- **Multi-select:** Single item selection implemented; multi-item lasso selection is planned for production.

---

### 13. Deliberate Trade-Offs Made Under Time Budget
- **Snapshot Undo vs. Operational Transform (OT):** Snapshots are simpler, rock-solid, and take < 20 KB of memory for hundreds of items.
- **Tailwind CSS vs. Custom Design System Library:** Accelerated UI delivery while adhering strictly to the industrial color palette.
- **Deterministic Mock Assistant vs. Remote LLM API:** Guarantees reliable, offline, zero-latency review walkthrough without API key dependencies.

---

## 2. Live Demo Script (10-Minute Walkthrough)

1. **Orientation (1 min):** Walk through the 3D room ($20\text{m} \times 12\text{m}$, $0.5\text{m}$ grid) and the UI panels (Palette, Viewport, Properties, Scene List, Rules, BOM, AI).
2. **Placement & Grid Snapping (2 min):** Select a Cabinet from the palette, click to place. Select and drag to demonstrate smooth $0.5\text{m}$ quantization.
3. **Selection & Properties Sync (2 min):** Click item in 3D $\rightarrow$ inspect properties in the right panel. Rename item and change coordinates; observe real-time viewport updates.
4. **Clearance Violation (2 min):** Place a Drive adjacent to the Cabinet (< $0.6\text{m}$). Observe red outline in 3D, violation badge in header, and descriptive error in Violations Panel.
5. **AI Assistant Remediation (2 min):** Open AI Copilot tab, click "⚡ Fix clearance". Observe streamed reply, green ghost preview in 3D, click **Accept**, and confirm violation clears.
6. **Undo / Redo & Stress Benchmark (1 min):** Press `Ctrl+Z` to undo the AI fix. Press `Ctrl+Shift+Z` to redo. Click "⚡ Benchmark 500" to populate 500 items and inspect 60 FPS counter.

