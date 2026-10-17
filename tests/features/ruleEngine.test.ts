import { describe, it, expect } from 'vitest';
import { computeViolations, itemDistance, isItemInViolation } from '../../src/features/rule-validation/ruleEngine';
import type { PlacedItem } from '../../src/types/scene';
import { GRID } from '../../src/types/scene';

describe('RuleEngine - Clearance Validation', () => {
  it('correctly calculates distance between two items', () => {
    // Cabinet: width 0.8m, depth 0.6m
    // itemA centered at (2.0, 2.0) -> x bounds [1.6, 2.4], z bounds [1.7, 2.3]
    const itemA: PlacedItem = {
      id: 'item-1',
      type: 'cabinet',
      name: 'Cabinet-1',
      x: 2.0,
      z: 2.0,
      rotation: 0,
      properties: {},
    };

    // itemB centered at (3.0, 2.0) -> x bounds [2.6, 3.4], z bounds [1.7, 2.3]
    // Separation along X: 2.6 - 2.4 = 0.2m (< 0.6m minimum clearance)
    const itemB: PlacedItem = {
      id: 'item-2',
      type: 'cabinet',
      name: 'Cabinet-2',
      x: 3.0,
      z: 2.0,
      rotation: 0,
      properties: {},
    };

    const dist = itemDistance(itemA, itemB);
    expect(dist).toBeCloseTo(0.2, 3);
  });

  it('detects a clearance violation when items are closer than 0.6m', () => {
    const items: Record<string, PlacedItem> = {
      'c-1': {
        id: 'c-1',
        type: 'cabinet',
        name: 'Main Cabinet',
        x: 5.0,
        z: 5.0,
        rotation: 0,
        properties: {},
      },
      'c-2': {
        id: 'c-2',
        type: 'drive',
        name: 'VFD Drive 1',
        x: 5.8, // Cabinet half-width=0.4, Drive half-width=0.25 -> gap = 5.8 - 0.25 - (5.0 + 0.4) = 0.15m < 0.6m
        z: 5.0,
        rotation: 0,
        properties: {},
      },
    };

    const violations = computeViolations(items);
    expect(violations).toHaveLength(1);
    expect(violations[0].itemA).toBe('c-1');
    expect(violations[0].itemB).toBe('c-2');
    expect(violations[0].nameA).toBe('Main Cabinet');
    expect(violations[0].nameB).toBe('VFD Drive 1');
    expect(violations[0].distance).toBeLessThan(GRID.MIN_CLEARANCE);
    expect(isItemInViolation('c-1', violations)).toBe(true);
    expect(isItemInViolation('c-2', violations)).toBe(true);
  });

  it('reports zero violations when items are adequately spaced (> 0.6m)', () => {
    const items: Record<string, PlacedItem> = {
      'c-1': {
        id: 'c-1',
        type: 'cabinet',
        name: 'Cabinet 1',
        x: 2.0,
        z: 2.0,
        rotation: 0,
        properties: {},
      },
      'c-2': {
        id: 'c-2',
        type: 'drive',
        name: 'Drive 1',
        x: 5.0,
        z: 2.0,
        rotation: 0,
        properties: {},
      },
    };

    const violations = computeViolations(items);
    expect(violations).toHaveLength(0);
    expect(isItemInViolation('c-1', violations)).toBe(false);
  });

  it('accounts for 90-degree rotation when computing bounding box and clearance', () => {
    // Control panel: width=1.0m, depth=0.5m
    // When rotated 90 deg, effective width becomes 0.5m, effective depth becomes 1.0m
    const itemRotated: PlacedItem = {
      id: 'p-1',
      type: 'control-panel',
      name: 'Panel 1',
      x: 4.0,
      z: 4.0,
      rotation: 90,
      properties: {},
    };

    const itemBeside: PlacedItem = {
      id: 'p-2',
      type: 'control-panel',
      name: 'Panel 2',
      x: 4.0,
      z: 5.2, // Gap along Z: 5.2 - 0.25 - (4.0 + 0.5) = 0.45m < 0.6m
      rotation: 0,
      properties: {},
    };

    const violations = computeViolations({ 'p-1': itemRotated, 'p-2': itemBeside });
    expect(violations).toHaveLength(1);
  });
});

