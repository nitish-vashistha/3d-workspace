import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, snapToGrid } from '../../src/store/useEditorStore';
import { GRID } from '../../src/types/scene';

describe('Editor Store & Undo/Redo Engine', () => {
  beforeEach(() => {
    // Reset store
    useEditorStore.setState({
      items: {},
      selectedItemId: null,
      hoveredItemId: null,
      history: [{}],
      historyIndex: 0,
      activeMode: 'select',
      placingType: null,
      violations: [],
      aiProposal: null,
    });
  });

  it('snaps coordinates to 0.5m grid intervals', () => {
    expect(snapToGrid(0.24)).toBe(0.0);
    expect(snapToGrid(0.26)).toBe(0.5);
    expect(snapToGrid(1.1)).toBe(1.0);
    expect(snapToGrid(1.4)).toBe(1.5);
    expect(snapToGrid(11.89)).toBe(12.0);
  });

  it('adds an item and creates an undo history point', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('cabinet', 5.0, 6.0);

    const state = useEditorStore.getState();
    expect(Object.keys(state.items)).toHaveLength(1);
    expect(state.items[id]).toBeDefined();
    expect(state.items[id].x).toBe(5.0);
    expect(state.items[id].z).toBe(6.0);
    expect(state.canUndo()).toBe(true);
    expect(state.canRedo()).toBe(false);
  });

  it('supports undo and redo for item addition', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('cabinet', 2.0, 2.0);

    expect(useEditorStore.getState().items[id]).toBeDefined();

    // Undo
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id]).toBeUndefined();
    expect(useEditorStore.getState().canRedo()).toBe(true);

    // Redo
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().items[id]).toBeDefined();
  });

  it('supports undo and redo for item translation (movement)', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('drive', 2.0, 2.0);

    useEditorStore.getState().moveItem(id, 6.0, 8.0);
    expect(useEditorStore.getState().items[id].x).toBe(6.0);
    expect(useEditorStore.getState().items[id].z).toBe(8.0);

    // Undo move
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id].x).toBe(2.0);
    expect(useEditorStore.getState().items[id].z).toBe(2.0);

    // Redo move
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().items[id].x).toBe(6.0);
    expect(useEditorStore.getState().items[id].z).toBe(8.0);
  });

  it('supports undo and redo for rotation', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('control-panel', 4.0, 4.0);

    expect(useEditorStore.getState().items[id].rotation).toBe(0);

    useEditorStore.getState().rotateItem(id);
    expect(useEditorStore.getState().items[id].rotation).toBe(90);

    useEditorStore.getState().rotateItem(id);
    expect(useEditorStore.getState().items[id].rotation).toBe(180);

    // Undo rotation
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id].rotation).toBe(90);

    // Redo rotation
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().items[id].rotation).toBe(180);
  });

  it('supports undo and redo for item deletion', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('cabinet', 3.0, 3.0);

    useEditorStore.getState().deleteItem(id);
    expect(useEditorStore.getState().items[id]).toBeUndefined();

    // Undo delete
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id]).toBeDefined();
    expect(useEditorStore.getState().items[id].name).toBe('cabinet-1');
  });

  it('clears redo stack when a new edit occurs after undo', () => {
    const store = useEditorStore.getState();
    const id1 = store.addItem('cabinet', 2.0, 2.0);
    const id2 = store.addItem('drive', 6.0, 6.0);

    expect(useEditorStore.getState().canUndo()).toBe(true);

    // Undo the second addition
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id2]).toBeUndefined();
    expect(useEditorStore.getState().canRedo()).toBe(true);

    // Now perform a new edit: add a control panel
    const id3 = useEditorStore.getState().addItem('control-panel', 8.0, 8.0);

    // Redo should now be discarded (new branch created)
    expect(useEditorStore.getState().canRedo()).toBe(false);
    expect(useEditorStore.getState().items[id1]).toBeDefined();
    expect(useEditorStore.getState().items[id3]).toBeDefined();
    expect(useEditorStore.getState().items[id2]).toBeUndefined();
  });

  it('clamps items within room floor boundaries (0 to 20m, 0 to 12m)', () => {
    const store = useEditorStore.getState();
    const id = store.addItem('cabinet', 25.0, 15.0); // Out of bounds

    const item = useEditorStore.getState().items[id];
    expect(item.x).toBeLessThanOrEqual(GRID.WIDTH);
    expect(item.z).toBeLessThanOrEqual(GRID.DEPTH);
  });

  it('populates 500 items correctly for performance benchmark', () => {
    useEditorStore.getState().populateScene(500);
    expect(useEditorStore.getState().getItemCount()).toBe(500);
  });

  it('applies batch AI proposal with multiple item moves atomically', () => {
    const store = useEditorStore.getState();
    const id1 = store.addItem('cabinet', 2.0, 2.0);
    const id2 = store.addItem('drive', 2.4, 2.0); // Violation with id1
    const id3 = store.addItem('control-panel', 2.8, 2.0); // Violation with id2

    expect(useEditorStore.getState().items[id1]).toBeDefined();
    expect(useEditorStore.getState().violations.length).toBeGreaterThanOrEqual(2);

    // Set batch AI proposal moving both id2 and id3 to safe locations
    useEditorStore.getState().setAIProposal({
      description: 'Batch fix all clearance violations',
      itemId: id2,
      newX: 6.0,
      newZ: 6.0,
      moves: [
        { itemId: id2, newX: 6.0, newZ: 6.0 },
        { itemId: id3, newX: 10.0, newZ: 10.0 },
      ],
      status: 'previewing',
    });

    // Accept batch proposal
    useEditorStore.getState().acceptProposal();

    expect(useEditorStore.getState().items[id2].x).toBe(6.0);
    expect(useEditorStore.getState().items[id2].z).toBe(6.0);
    expect(useEditorStore.getState().items[id3].x).toBe(10.0);
    expect(useEditorStore.getState().items[id3].z).toBe(10.0);
    expect(useEditorStore.getState().violations).toHaveLength(0);

    // Verify atomic undo reverts ALL moved items
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().items[id2].x).toBe(2.5);
    expect(useEditorStore.getState().items[id3].x).toBe(3.0);
    expect(useEditorStore.getState().violations.length).toBeGreaterThanOrEqual(2);
  });
});

