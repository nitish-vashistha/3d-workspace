import type { EquipmentTypeId } from './equipment';

/**
 * Canonical representation of a placed item in the scene.
 * This is the serialisable data model — independent of Three.js.
 */
export interface PlacedItem {
  /** Unique stable ID (nanoid) */
  id: string;
  /** Equipment type identifier */
  type: EquipmentTypeId;
  /** User-editable display name */
  name: string;
  /** World-space X position (metres, snapped to 0.5m grid) */
  x: number;
  /** World-space Z position (metres, snapped to 0.5m grid) */
  z: number;
  /** Y-axis rotation in degrees (0, 90, 180, 270) */
  rotation: number;
  /** User-editable properties */
  properties: Record<string, string | number>;
}

/**
 * A clearance-rule violation between two items.
 */
export interface Violation {
  /** ID of first item */
  itemA: string;
  /** ID of second item */
  itemB: string;
  /** Name of first item */
  nameA: string;
  /** Name of second item */
  nameB: string;
  /** Distance in metres */
  distance: number;
  /** Human-readable message key for i18n */
  messageKey: string;
}

/**
 * Scene snapshot for undo/redo.
 * Contains only the canonical items state.
 */
export type SceneSnapshot = Record<string, PlacedItem>;

/**
 * Single proposed item translation or rotation.
 */
export interface ProposedItemMove {
  itemId: string;
  name?: string;
  newX: number;
  newZ: number;
  newRotation?: number;
}

/**
 * AI assistant proposal for a layout change.
 * Supports both single-item fix and multi-item batch remediation.
 */
export interface AIProposal {
  /** Description of the proposed change */
  description: string;
  /** Primary item ID (for single item moves) */
  itemId: string;
  /** Proposed new position for primary item */
  newX: number;
  newZ: number;
  /** Proposed new rotation for primary item */
  newRotation?: number;
  /** List of all proposed item relocations (for batch/all fixes) */
  moves?: ProposedItemMove[];
  /** Status of the proposal */
  status: 'pending' | 'previewing' | 'accepted' | 'rejected';
}

/** 
 * Bill of materials line item.
 */
export interface BOMEntry {
  type: EquipmentTypeId;
  nameKey: string;
  category: string;
  quantity: number;
  dimensions: string;
}

/** Grid configuration constants */
export const GRID = {
  /** Floor width in metres (X-axis) */
  WIDTH: 20,
  /** Floor depth in metres (Z-axis) */
  DEPTH: 12,
  /** Cell size in metres */
  CELL_SIZE: 0.5,
  /** Cells across (X) */
  CELLS_X: 40,
  /** Cells deep (Z) */
  CELLS_Z: 24,
  /** Minimum clearance distance in metres */
  MIN_CLEARANCE: 0.6,
} as const;

