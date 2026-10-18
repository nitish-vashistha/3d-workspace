import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { PlacedItem, SceneSnapshot, Violation, AIProposal } from '../types/scene';
import type { EquipmentTypeId } from '../types/equipment';
import { EQUIPMENT_TYPES } from '../types/equipment';
import { GRID } from '../types/scene';
import { computeViolations } from '../features/rule-validation/ruleEngine';

/** Snap a value to the nearest grid cell */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID.CELL_SIZE) * GRID.CELL_SIZE;
}

/** Clamp a value within floor boundaries accounting for item half-width */
function clampToFloor(value: number, itemSize: number, maxBound: number): number {
  const half = itemSize / 2;
  return Math.max(half, Math.min(maxBound - half, value));
}

/** Compute valid snapped position for an item on the floor */
export function computeValidPosition(
  x: number,
  z: number,
  type: EquipmentTypeId,
  rotation: number
): { x: number; z: number } {
  const def = EQUIPMENT_TYPES[type];
  // Account for rotation: swap width/depth for 90° and 270°
  const isRotated = rotation === 90 || rotation === 270;
  const effectiveWidth = isRotated ? def.depth : def.width;
  const effectiveDepth = isRotated ? def.width : def.depth;

  const snappedX = snapToGrid(clampToFloor(x, effectiveWidth, GRID.WIDTH));
  const snappedZ = snapToGrid(clampToFloor(z, effectiveDepth, GRID.DEPTH));
  return { x: snappedX, z: snappedZ };
}

const MAX_HISTORY = 50;

interface EditorState {
  // === Canonical scene data ===
  items: Record<string, PlacedItem>;

  // === Selection (transient — NOT in undo history) ===
  selectedItemId: string | null;
  hoveredItemId: string | null;

  // === Undo/Redo ===
  history: SceneSnapshot[];
  historyIndex: number;

  // === UI Mode ===
  activeMode: 'select' | 'place';
  placingType: EquipmentTypeId | null;
  draggedItemId: string | null;
  dragState: {
    itemId: string;
    offsetX: number;
    offsetZ: number;
    startX: number;
    startZ: number;
  } | null;

  // === Derived state ===
  violations: Violation[];

  // === AI Assistant ===
  aiProposal: AIProposal | null;

  // === Actions ===
  addItem: (type: EquipmentTypeId, x: number, z: number) => string;
  moveItem: (id: string, x: number, z: number) => void;
  rotateItem: (id: string) => void;
  deleteItem: (id: string) => void;
  updateItemProperty: (id: string, key: string, value: string | number) => void;
  updateItemName: (id: string, name: string) => void;
  updateItemPosition: (id: string, x: number, z: number) => void;
  selectItem: (id: string | null) => void;
  hoverItem: (id: string | null) => void;
  setMode: (mode: 'select' | 'place', placingType?: EquipmentTypeId) => void;
  setDraggedItem: (id: string | null) => void;
  startDrag: (id: string, offsetX: number, offsetZ: number, startX: number, startZ: number) => void;
  endDrag: () => void;
  setLivePosition: (id: string, x: number, z: number) => void;
  undo: () => void;
  redo: () => void;

  // AI Assistant actions
  setAIProposal: (proposal: AIProposal | null) => void;
  acceptProposal: () => void;
  rejectProposal: () => void;

  // Utility
  getItemCount: () => number;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearScene: () => void;
  populateScene: (count: number) => void;
  exportScene: () => string;
  importScene: (json: string) => void;
}

/** Push a scene snapshot and trim history */
function pushHistory(
  history: SceneSnapshot[],
  historyIndex: number,
  snapshot: SceneSnapshot
): { history: SceneSnapshot[]; historyIndex: number } {
  // Discard any redo entries beyond current index
  const trimmed = history.slice(0, historyIndex + 1);
  trimmed.push(structuredClone(snapshot));
  // Enforce max history size
  if (trimmed.length > MAX_HISTORY) {
    trimmed.shift();
  }
  return {
    history: trimmed,
    historyIndex: trimmed.length - 1,
  };
}

/** Generate a counter-based name for an item */
function generateItemName(items: Record<string, PlacedItem>, type: EquipmentTypeId): string {
  const typeItems = Object.values(items).filter(i => i.type === type);
  const baseName = EQUIPMENT_TYPES[type].nameKey.split('.').pop() ?? type;
  return `${baseName}-${typeItems.length + 1}`;
}

const defaultInitialItems: Record<string, PlacedItem> = {
  'cabinet-1': {
    id: 'cabinet-1',
    type: 'cabinet',
    name: 'Cabinet-1',
    x: 4.0,
    z: 4.0,
    rotation: 0,
    properties: { voltage: '480V', rating: 'IP54', maxLoad: '100A' },
  },
  'cabinet-2': {
    id: 'cabinet-2',
    type: 'cabinet',
    name: 'Cabinet-2',
    x: 4.5, // 0.5m spacing triggers < 0.6m clearance violation
    z: 4.0,
    rotation: 0,
    properties: { voltage: '480V', rating: 'IP54', maxLoad: '100A' },
  },
  'drive-1': {
    id: 'drive-1',
    type: 'drive',
    name: 'Drive-1',
    x: 8.0,
    z: 4.0,
    rotation: 0,
    properties: { powerKw: 75, coolingType: 'Forced Air', busVoltage: 690 },
  },
  'panel-1': {
    id: 'panel-1',
    type: 'control-panel',
    name: 'ControlPanel-1',
    x: 12.0,
    z: 4.0,
    rotation: 0,
    properties: { screenCount: 2, networkProtocol: 'Profinet', emergencyStop: 'True' },
  },
};

export const useEditorStore = create<EditorState>((set, get) => ({
  items: defaultInitialItems,
  selectedItemId: null,
  hoveredItemId: null,
  history: [defaultInitialItems], // Initial history snapshot
  historyIndex: 0,
  activeMode: 'select',
  placingType: null,
  draggedItemId: null,
  dragState: null,
  violations: computeViolations(defaultInitialItems),
  aiProposal: null,

  addItem: (type, x, z) => {
    const id = nanoid(10);
    const def = EQUIPMENT_TYPES[type];
    const pos = computeValidPosition(x, z, type, 0);
    const item: PlacedItem = {
      id,
      type,
      name: generateItemName(get().items, type),
      x: pos.x,
      z: pos.z,
      rotation: 0,
      properties: { ...def.defaultProperties },
    };
    const newItems = { ...get().items, [id]: item };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
      selectedItemId: id,
      activeMode: 'select',
      placingType: null,
    });
    return id;
  },

  moveItem: (id, x, z) => {
    const item = get().items[id];
    if (!item) return;
    const pos = computeValidPosition(x, z, item.type, item.rotation);
    const newItems = {
      ...get().items,
      [id]: { ...item, x: pos.x, z: pos.z },
    };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
    });
  },

  rotateItem: (id) => {
    const item = get().items[id];
    if (!item) return;
    const newRotation = (item.rotation + 90) % 360;
    // Revalidate position after rotation (dimensions may swap)
    const pos = computeValidPosition(item.x, item.z, item.type, newRotation);
    const newItems = {
      ...get().items,
      [id]: { ...item, rotation: newRotation, x: pos.x, z: pos.z },
    };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
    });
  },

  deleteItem: (id) => {
    const newItems = { ...get().items };
    delete newItems[id];
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
      selectedItemId: get().selectedItemId === id ? null : get().selectedItemId,
    });
  },

  updateItemProperty: (id, key, value) => {
    const item = get().items[id];
    if (!item) return;
    const newItems = {
      ...get().items,
      [id]: { ...item, properties: { ...item.properties, [key]: value } },
    };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({ items: newItems, history, historyIndex });
  },

  updateItemName: (id, name) => {
    const item = get().items[id];
    if (!item) return;
    const newItems = {
      ...get().items,
      [id]: { ...item, name },
    };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({ items: newItems, history, historyIndex });
  },

  updateItemPosition: (id, x, z) => {
    const item = get().items[id];
    if (!item) return;
    const pos = computeValidPosition(x, z, item.type, item.rotation);
    const newItems = {
      ...get().items,
      [id]: { ...item, x: pos.x, z: pos.z },
    };
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
    });
  },

  selectItem: (id) => set({ selectedItemId: id }),
  hoverItem: (id) => set({ hoveredItemId: id }),

  setMode: (mode, placingType) =>
    set({
      activeMode: mode,
      placingType: placingType ?? null,
      selectedItemId: mode === 'place' ? null : get().selectedItemId,
    }),

  setDraggedItem: (id) => {
    if (!id) {
      get().endDrag();
    } else {
      set({ draggedItemId: id });
    }
  },

  startDrag: (id, offsetX, offsetZ, startX, startZ) =>
    set({
      draggedItemId: id,
      dragState: { itemId: id, offsetX, offsetZ, startX, startZ },
    }),

  endDrag: () => {
    const { dragState, items, history, historyIndex } = get();
    if (dragState) {
      const item = items[dragState.itemId];
      if (item && (item.x !== dragState.startX || item.z !== dragState.startZ)) {
        const { history: newHistory, historyIndex: newIndex } = pushHistory(history, historyIndex, items);
        set({
          draggedItemId: null,
          dragState: null,
          history: newHistory,
          historyIndex: newIndex,
        });
        return;
      }
    }
    set({ draggedItemId: null, dragState: null });
  },

  setLivePosition: (id, x, z) => {
    const item = get().items[id];
    if (!item) return;
    const pos = computeValidPosition(x, z, item.type, item.rotation);
    if (item.x === pos.x && item.z === pos.z) return;
    const newItems = {
      ...get().items,
      [id]: { ...item, x: pos.x, z: pos.z },
    };
    set({
      items: newItems,
      violations: computeViolations(newItems),
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const items = structuredClone(history[newIndex]);
    set({
      items,
      historyIndex: newIndex,
      violations: computeViolations(items),
      selectedItemId: null,
    });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const items = structuredClone(history[newIndex]);
    set({
      items,
      historyIndex: newIndex,
      violations: computeViolations(items),
      selectedItemId: null,
    });
  },

  setAIProposal: (proposal) => set({ aiProposal: proposal }),

  acceptProposal: () => {
    const { aiProposal, items } = get();
    if (!aiProposal || aiProposal.status !== 'previewing') return;

    const newItems = { ...items };

    // Batch moves (multi-violation remediation)
    if (aiProposal.moves && aiProposal.moves.length > 0) {
      for (const move of aiProposal.moves) {
        const item = newItems[move.itemId];
        if (item) {
          const rotation = move.newRotation !== undefined ? move.newRotation : item.rotation;
          const pos = computeValidPosition(move.newX, move.newZ, item.type, rotation);
          newItems[move.itemId] = {
            ...item,
            x: pos.x,
            z: pos.z,
            rotation,
          };
        }
      }
    } else {
      // Single item move
      const item = newItems[aiProposal.itemId];
      if (item) {
        const rotation = aiProposal.newRotation !== undefined ? aiProposal.newRotation : item.rotation;
        const pos = computeValidPosition(aiProposal.newX, aiProposal.newZ, item.type, rotation);
        newItems[aiProposal.itemId] = {
          ...item,
          x: pos.x,
          z: pos.z,
          rotation,
        };
      }
    }

    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
      aiProposal: { ...aiProposal, status: 'accepted' },
    });

    // Clear proposal after 1.5 seconds
    setTimeout(() => {
      if (get().aiProposal?.status === 'accepted') {
        set({ aiProposal: null });
      }
    }, 1500);
  },

  rejectProposal: () => {
    set({ aiProposal: null });
  },

  getItemCount: () => Object.keys(get().items).length,
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  clearScene: () => {
    const newItems: Record<string, PlacedItem> = {};
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: [],
      selectedItemId: null,
    });
  },

  populateScene: (count) => {
    const types: EquipmentTypeId[] = ['cabinet', 'drive', 'control-panel'];
    const newItems: Record<string, PlacedItem> = { ...get().items };

    for (let i = 0; i < count; i++) {
      const id = nanoid(10);
      const type = types[i % types.length];
      const def = EQUIPMENT_TYPES[type];

      // Distribute items evenly across the grid
      const col = i % 38; // leave 1 cell margin
      const row = Math.floor(i / 38) % 22;
      const x = snapToGrid(1 + col * 0.5);
      const z = snapToGrid(1 + row * 0.5);

      newItems[id] = {
        id,
        type,
        name: `${type}-${i + 1}`,
        x: Math.min(x, GRID.WIDTH - def.width / 2),
        z: Math.min(z, GRID.DEPTH - def.depth / 2),
        rotation: 0,
        properties: { ...def.defaultProperties },
      };
    }

    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
    set({
      items: newItems,
      history,
      historyIndex,
      violations: computeViolations(newItems),
      selectedItemId: null,
    });
  },

  exportScene: () => JSON.stringify(Object.values(get().items), null, 2),

  importScene: (json) => {
    try {
      const items: PlacedItem[] = JSON.parse(json);
      const newItems: Record<string, PlacedItem> = {};
      for (const item of items) {
        newItems[item.id] = item;
      }
      const { history, historyIndex } = pushHistory(get().history, get().historyIndex, newItems);
      set({
        items: newItems,
        history,
        historyIndex,
        violations: computeViolations(newItems),
        selectedItemId: null,
      });
    } catch {
      console.error('Failed to import scene');
    }
  },
}));

