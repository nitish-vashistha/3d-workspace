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
import { EQUIPMENT_TYPES } from './types/equipment';

export default function App() {
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspect' | 'rules' | 'bom' | 'assistant'>('inspect');

  // Responsive drawer states: Open by default on desktop (>=1024px), closed on mobile/tablet (<1024px)
  const [isPaletteOpen, setIsPaletteOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });
  const [showControlsHint, setShowControlsHint] = useState(true);

  // Sync with window resize
  useEffect(() => {
    let prevWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // Auto-open on transitioning to desktop, auto-close on transitioning to mobile
      if (prevWidth < 1024 && currentWidth >= 1024) {
        setIsPaletteOpen(true);
        setIsPanelOpen(true);
      } else if (prevWidth >= 1024 && currentWidth < 1024) {
        setIsPaletteOpen(false);
        setIsPanelOpen(false);
      }
      prevWidth = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const activeMode = useEditorStore(s => s.activeMode);
  const placingType = useEditorStore(s => s.placingType);
  const setMode = useEditorStore(s => s.setMode);

  const selectedItem = selectedItemId ? items[selectedItemId] : null;
  const placingDef = placingType ? EQUIPMENT_TYPES[placingType] : null;

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

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inspect':
        return (
          <>
            <PropertiesPanel />
            <SceneList />
          </>
        );
      case 'rules':
        return (
          <>
            <ViolationsPanel />
            <SceneList />
          </>
        );
      case 'bom':
        return (
          <>
            <BillOfMaterials />
            <SceneList />
          </>
        );
      case 'assistant':
        return (
          <>
            <AssistantPanel />
            <ViolationsPanel />
          </>
        );
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-industrial-900 text-industrial-100 overflow-hidden select-none">
      {/* Top adaptive toolbar */}
      <Toolbar
        fps={fps}
        drawCalls={drawCalls}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
        isPaletteOpen={isPaletteOpen}
        onTogglePalette={() => setIsPaletteOpen(prev => !prev)}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(prev => !prev)}
        violationsCount={violations.length}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Equipment Palette (Docked) */}
        {isPaletteOpen && (
          <div className="hidden lg:flex w-56 flex-col border-r border-industrial-700/80 bg-industrial-800 z-10 flex-shrink-0">
            <EquipmentPalette className="h-full" />
          </div>
        )}

        {/* Mobile / Tablet Left Equipment Palette (Drawer with overlay) */}
        {isPaletteOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
              onClick={() => setIsPaletteOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-industrial-800 shadow-2xl flex flex-col border-r border-industrial-700 lg:hidden"
              role="dialog"
              aria-label="Equipment Palette Drawer"
            >
              <EquipmentPalette
                onClose={() => setIsPaletteOpen(false)}
                onItemSelect={() => {
                  if (window.innerWidth < 1024) {
                    setIsPaletteOpen(false);
                  }
                }}
                className="h-full"
              />
            </div>
          </>
        )}

        {/* Center 3D R3F Viewport */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-industrial-950 min-w-0">
          <EditorViewport onStats={handleStats} />

          {/* Placement Mode Active Banner */}
          {activeMode === 'place' && placingDef && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent/90 text-white backdrop-blur px-3.5 py-1.5 rounded-full border border-accent-light/40 shadow-xl text-xs font-medium animate-bounce-subtle max-w-[90vw]">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="truncate">
                Placing <strong>{placingType}</strong> — Tap on grid
              </span>
              <button
                onClick={() => setMode('select')}
                className="ml-1 bg-black/30 hover:bg-black/50 text-white rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors"
                title="Cancel placement"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Floating Mobile Bottom Quick-Access Bar (visible on < lg when panels are closed) */}
          <div className="lg:hidden absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none gap-2">
            {!isPaletteOpen && (
              <button
                onClick={() => setIsPaletteOpen(true)}
                className="pointer-events-auto btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 bg-industrial-850/95 backdrop-blur-md shadow-lg border-industrial-600 rounded-lg active:scale-95 transition-transform"
                title="Open Equipment Palette"
                aria-label="Open Equipment Palette"
              >
                <span>📦</span>
                <span className="font-semibold text-industrial-100">Equipment</span>
              </button>
            )}

            <div className="flex-1" />

            {!isPanelOpen && (
              <button
                onClick={() => setIsPanelOpen(true)}
                className="pointer-events-auto btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 relative bg-industrial-850/95 backdrop-blur-md shadow-lg border-industrial-600 rounded-lg active:scale-95 transition-transform"
                title="Open Workspace Panel"
                aria-label="Open Workspace Panel"
              >
                <span>⚙️</span>
                <span className="font-semibold text-industrial-100">Inspect</span>
                {violations.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-violation text-[10px] font-bold text-white rounded-full">
                    {violations.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Mobile Floating Card for Selected Item */}
          {selectedItem && (
            <div className="lg:hidden absolute bottom-14 left-3 right-3 z-20 bg-industrial-800/95 backdrop-blur-md border border-industrial-600 rounded-xl p-2.5 shadow-2xl flex items-center justify-between gap-2 animate-fade-in">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-industrial-100 truncate flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: EQUIPMENT_TYPES[selectedItem.type]?.color }}
                  />
                  <span>{selectedItem.name}</span>
                </div>
                <div className="text-[10px] text-industrial-400 font-mono">
                  ({selectedItem.x.toFixed(1)}m, {selectedItem.z.toFixed(1)}m) • {selectedItem.rotation}°
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => rotateItem(selectedItem.id)}
                  className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                  title="Rotate +90°"
                >
                  <span>↻</span>
                  <span className="text-[11px]">+90°</span>
                </button>
                <button
                  onClick={() => deleteItem(selectedItem.id)}
                  className="btn-danger text-xs px-2 py-1"
                  title="Remove item"
                >
                  🗑
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inspect');
                    setIsPanelOpen(true);
                  }}
                  className="btn-primary text-xs px-2.5 py-1"
                  title="View full properties"
                >
                  Details
                </button>
                <button
                  onClick={() => selectItem(null)}
                  className="text-industrial-400 hover:text-white px-1.5 py-1 text-sm font-mono"
                  title="Deselect"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Responsive HUD legend overlay at bottom of 3D canvas */}
          <div className="hidden sm:flex absolute bottom-2 left-3 pointer-events-none items-center gap-2 text-[11px] text-industrial-400 bg-industrial-900/85 backdrop-blur px-2.5 py-1 rounded-md border border-industrial-700/60 font-mono shadow-md">
            <span>🖱 Drag: Orbit</span>
            <span className="text-industrial-600">•</span>
            <span>Shift+Drag: Pan</span>
            <span className="text-industrial-600">•</span>
            <span>Scroll: Zoom</span>
            <span className="hidden md:inline text-industrial-600">•</span>
            <span className="hidden md:inline">R: Rotate</span>
            <span className="hidden lg:inline text-industrial-600">•</span>
            <span className="hidden lg:inline">Arrows: Nudge</span>
            <span className="hidden lg:inline text-industrial-600">•</span>
            <span className="hidden lg:inline">Del: Remove</span>
          </div>

          {/* Touch Gesture Tip on Small Screens */}
          <div className="sm:hidden absolute top-2 left-2 z-10 pointer-events-auto">
            {showControlsHint ? (
              <div className="flex items-center gap-2 text-[10px] text-industrial-300 bg-industrial-900/90 backdrop-blur px-2 py-1 rounded-md border border-industrial-700/60 font-sans shadow-md">
                <span>👆 1-finger: Orbit • ✌ 2-finger: Zoom/Pan</span>
                <button
                  onClick={() => setShowControlsHint(false)}
                  className="text-industrial-400 hover:text-white text-xs pl-1 font-mono"
                  title="Dismiss hint"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowControlsHint(true)}
                className="text-[10px] text-industrial-400 bg-industrial-900/80 backdrop-blur px-1.5 py-0.5 rounded border border-industrial-700/60"
                title="Show gesture guide"
              >
                ℹ
              </button>
            )}
          </div>
        </main>

        {/* Desktop Right Workspace Panel (Docked) */}
        {isPanelOpen && (
          <aside className="hidden lg:flex w-80 border-l border-industrial-700/80 bg-industrial-800 flex-col overflow-hidden z-10 flex-shrink-0">
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
                className={`flex-1 py-2 font-medium transition-colors border-b-2 flex items-center justify-center gap-1 ${
                  activeTab === 'rules'
                    ? 'border-accent text-white bg-industrial-700/30'
                    : 'border-transparent text-industrial-400 hover:text-industrial-200'
                }`}
              >
                <span>Violations</span>
                {violations.length > 0 && (
                  <span className="text-[10px] bg-violation/20 text-violation px-1 rounded-full font-bold">
                    {violations.length}
                  </span>
                )}
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
              {renderTabContent()}
            </div>
          </aside>
        )}

        {/* Mobile / Tablet Right Workspace Panel (Drawer with overlay) */}
        {isPanelOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
              onClick={() => setIsPanelOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="fixed inset-y-0 right-0 z-40 w-80 max-w-[90vw] bg-industrial-800 shadow-2xl flex flex-col border-l border-industrial-700 lg:hidden"
              role="dialog"
              aria-label="Workspace Panel Drawer"
            >
              {/* Drawer header with tabs & close button */}
              <div className="flex items-center justify-between border-b border-industrial-700 bg-industrial-850">
                <div className="flex flex-1 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('inspect')}
                    className={`flex-1 py-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'inspect'
                        ? 'border-accent text-white bg-industrial-700/30'
                        : 'border-transparent text-industrial-400 hover:text-industrial-200'
                    }`}
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex-1 py-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center justify-center gap-1 ${
                      activeTab === 'rules'
                        ? 'border-accent text-white bg-industrial-700/30'
                        : 'border-transparent text-industrial-400 hover:text-industrial-200'
                    }`}
                  >
                    <span>Violations</span>
                    {violations.length > 0 && (
                      <span className="text-[10px] bg-violation/20 text-violation px-1 rounded-full font-bold">
                        {violations.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('bom')}
                    className={`flex-1 py-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'bom'
                        ? 'border-accent text-white bg-industrial-700/30'
                        : 'border-transparent text-industrial-400 hover:text-industrial-200'
                    }`}
                  >
                    BOM
                  </button>
                  <button
                    onClick={() => setActiveTab('assistant')}
                    className={`flex-1 py-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'assistant'
                        ? 'border-accent text-white bg-industrial-700/30'
                        : 'border-transparent text-industrial-400 hover:text-industrial-200'
                    }`}
                  >
                    Copilot
                  </button>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="px-3 py-2 text-industrial-400 hover:text-white font-mono text-sm border-l border-industrial-700 flex-shrink-0"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>

              {/* Tab content area */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {renderTabContent()}
              </div>
            </aside>
          </>
        )}
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
