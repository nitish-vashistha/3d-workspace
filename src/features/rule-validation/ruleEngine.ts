import type { PlacedItem, Violation } from '../../types/scene';
import { GRID } from '../../types/scene';
import { EQUIPMENT_TYPES } from '../../types/equipment';

/**
 * Compute clearance violations between all pairs of placed items.
 *
 * Rule: Any two items whose edges are closer than GRID.MIN_CLEARANCE (0.6m)
 * are in violation.
 *
 * Distance calculation:
 * We use axis-aligned bounding box (AABB) edge-to-edge distance.
 * For each item, we compute the AABB based on item center position and dimensions
 * (accounting for rotation), then compute the minimum gap between the two AABBs.
 * If this gap is less than MIN_CLEARANCE, the pair is in violation.
 *
 * This is a centre-to-centre distance simplified for the prototype.
 * For the prototype we use centre-to-centre Euclidean distance as a practical
 * simplification that is deterministic, easy to test, and sufficient for the
 * assessment's clearance rule.
 */
export function computeViolations(items: Record<string, PlacedItem>): Violation[] {
  const violations: Violation[] = [];
  const itemList = Object.values(items);

  for (let i = 0; i < itemList.length; i++) {
    for (let j = i + 1; j < itemList.length; j++) {
      const a = itemList[i];
      const b = itemList[j];
      const distance = itemDistance(a, b);

      if (distance < GRID.MIN_CLEARANCE) {
        violations.push({
          itemA: a.id,
          itemB: b.id,
          nameA: a.name,
          nameB: b.name,
          distance: Math.round(distance * 1000) / 1000,
          messageKey: 'rules.clearanceViolation',
        });
      }
    }
  }

  return violations;
}

/**
 * Compute edge-to-edge distance between two items using their AABBs.
 *
 * Each item has a centre position (x, z) and dimensions (width, depth).
 * Rotation swaps width and depth for 90° and 270° rotations.
 * We compute the gap between the two bounding boxes on each axis,
 * then the Euclidean distance using the maximum of 0 and each gap.
 */
export function itemDistance(a: PlacedItem, b: PlacedItem): number {
  const aBox = getAABB(a);
  const bBox = getAABB(b);

  // Gap on each axis: positive means separation, negative means overlap
  const gapX = Math.max(0, Math.max(aBox.minX - bBox.maxX, bBox.minX - aBox.maxX));
  const gapZ = Math.max(0, Math.max(aBox.minZ - bBox.maxZ, bBox.minZ - aBox.maxZ));

  // If both gaps are 0, boxes overlap — distance is 0
  return Math.sqrt(gapX * gapX + gapZ * gapZ);
}

interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function getAABB(item: PlacedItem): AABB {
  const def = EQUIPMENT_TYPES[item.type];
  const isRotated = item.rotation === 90 || item.rotation === 270;
  const halfW = (isRotated ? def.depth : def.width) / 2;
  const halfD = (isRotated ? def.width : def.depth) / 2;

  return {
    minX: item.x - halfW,
    maxX: item.x + halfW,
    minZ: item.z - halfD,
    maxZ: item.z + halfD,
  };
}

/**
 * Check if a specific item is involved in any violation.
 */
export function isItemInViolation(itemId: string, violations: Violation[]): boolean {
  return violations.some(v => v.itemA === itemId || v.itemB === itemId);
}

