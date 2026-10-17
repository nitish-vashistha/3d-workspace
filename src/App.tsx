import { useState, useCallback, useEffect } from 'react';
import { Toolbar } from './features/toolbar/Toolbar';
import { EquipmentPalette } from './features/palette/EquipmentPalette';
import { EditorViewport } from './features/editor/EditorViewport';
import { PropertiesPanel } from './features/properties/PropertiesPanel';
import { SceneList } from './features/scene-list/SceneList';
import { ViolationsPanel } from './features/rule-validation/ViolationsPanel';
import { BillOfMaterials } from './features/bom/BillOfMaterials';
import { AssistantPanel } from './features/assistant/AssistantPanel';
import { HostSimulationModal } from './features/embed/HostSimulationModal';
import { useEditorStore } from './store/useEditorStore';
import { GRID } from './types/scene';

export default function App() {
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspect' | 'rules' | 'bom' | 'assistant'>('inspect');

  const handleStats = useCallback((newFps: number, newDrawCalls: number) => {
    setFps(newFps);
    setDrawCalls(newDrawCalls);
  }, []);

  // Keyboard navigation & editing operations
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const deleteItem = useEditorStore(s => s.deleteItem);
  const selectedItemId = useEditorStore(s => s.selectedItemId);
  const rotateItem = useEditorStore(s => s.rotateItem);
  const items = useEditorStore(s => s.items);
  const moveItem = useEditorStore(s => s.moveItem);
  const selectItem = useEditorStore(s => s.selectItem);
  const violations = useEditorStore(s => s.violations);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keyboard shortcuts when user is interacting with text/number inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo / Redo: Ctrl+Z / Cmd+Z and Ctrl+Shift+Z / Cmd+Shift+Z
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          e.preventDefault();
          deleteItem(selectedItemId);
        }
        return;
      }

      // Rotate: 'R' key
      if (e.key === 'r' || e.key === 'R') {
        if (selectedItemId) {
          e.preventDefault();
          rotateItem(selectedItemId);
        }
        return;
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        selectItem(null);
        useEditorStore.getState().setMode('select');
        return;
      }

      // Keyboard arrow keys: Move selected item by 1 grid cell (0.5m)
      if (selectedItemId && items[selectedItemId]) {
        const item = items[selectedItemId];
        let dx = 0;
        let dz = 0;

        if (e.key === 'ArrowLeft') dx = -GRID.CELL_SIZE;
        else if (e.key === 'ArrowRight') dx = GRID.CELL_SIZE;
        else if (e.key === 'ArrowUp') dz = -GRID.CELL_SIZE;
        else if (e.key === 'ArrowDown') dz = GRID.CELL_SIZE;

        if (dx !== 0 || dz !== 0) {
          e.preventDefault();
          moveItem(item.id, item.x + dx, item.z + dz);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteItem, selectedItemId, rotateItem, items, moveItem, selectItem]);

  return (
    <div className="h-screen w-screen flex flex-col bg-industrial-900 text-industrial-100 overflow-hidden select-none">
      <Toolbar
        fps={fps}
        drawCalls={drawCalls}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left equipment palette */}
        <EquipmentPalette />

        {/* Center 3D R3F Viewport */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-industrial-950">
          <EditorViewport onStats={handleStats} />

          {/* Quick HUD legend overlay at bottom of 3D canvas */}
          <div className="absolute bottom-2 left-3 pointer-events-none flex items-center gap-3 text-[11px] text-industrial-400 bg-industrial-900/80 backdrop-blur px-2.5 py-1 rounded border border-industrial-700/60 font-mono">
            <span>🖱 Drag: Orbit</span>
            <span>•</span>
            <span>Shift+Drag: Pan</span>
            <span>•</span>
            <span>Scroll: Zoom</span>
            <span>•</span>
            <span>R: Rotate</span>
            <span>•</span>
            <span>Arrows: Nudge 0.5m</span>
            <span>•</span>
            <span>Del: Remove</span>
          </div>
        </main>

        {/* Right workspace panels with tabs & responsive stacking */}
        <aside className="w-80 border-l border-industrial-700/80 bg-industrial-800 flex flex-col overflow-hidden">
          {/* Panel navigation tabs */}
          <div className="flex border-b border-industrial-700 bg-industrial-800 text-xs">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'inspect'
                  ? 'border-accent text-white bg-industrial-700/30'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              Inspect
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'rules'
                  ? 'border-accent text-white bg-industrial-700/30'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              Violations
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'bom'
                  ? 'border-accent text-white bg-industrial-700/30'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              BOM
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'assistant'
                  ? 'border-accent text-white bg-industrial-700/30'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              AI Copilot
            </button>
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activeTab === 'inspect' && (
              <>
                <PropertiesPanel />
                <SceneList />
              </>
            )}

            {activeTab === 'rules' && (
              <>
                <ViolationsPanel />
                <SceneList />
              </>
            )}

            {activeTab === 'bom' && (
              <>
                <BillOfMaterials />
                <SceneList />
              </>
            )}

            {activeTab === 'assistant' && (
              <>
                <AssistantPanel />
                <ViolationsPanel />
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Host PostMessage Handshake Simulator Modal */}
      <HostSimulationModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />

      {/* Screen Reader Live Region for WCAG 2.2 AA Compliance */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {violations.length > 0
          ? `${violations.length} clearance violation(s) active in the layout.`
          : 'All placed equipment meets minimum safety clearance.'}
        {selectedItemId && items[selectedItemId]
          ? ` Selected ${items[selectedItemId].name} at coordinates ${items[selectedItemId].x.toFixed(1)} meters X, ${items[selectedItemId].z.toFixed(1)} meters Z.`
          : ''}
      </div>
    </div>
  );
}

