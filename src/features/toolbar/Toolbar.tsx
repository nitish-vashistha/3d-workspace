import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';

interface ToolbarProps {
  fps: number;
  drawCalls: number;
  onOpenEmbedModal?: () => void;
  isPaletteOpen?: boolean;
  onTogglePalette?: () => void;
  isPanelOpen?: boolean;
  onTogglePanel?: () => void;
  violationsCount?: number;
}

export function Toolbar({
  fps,
  drawCalls,
  onOpenEmbedModal,
  isPaletteOpen,
  onTogglePalette,
  isPanelOpen,
  onTogglePanel,
  violationsCount = 0,
}: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const canUndo = useEditorStore(s => s.canUndo());
  const canRedo = useEditorStore(s => s.canRedo());
  const selectedItemId = useEditorStore(s => s.selectedItemId);
  const itemCount = useEditorStore(s => s.getItemCount());
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const deleteItem = useEditorStore(s => s.deleteItem);
  const clearScene = useEditorStore(s => s.clearScene);
  const populateScene = useEditorStore(s => s.populateScene);
  const exportScene = useEditorStore(s => s.exportScene);
  const importScene = useEditorStore(s => s.importScene);

  // Close actions dropdown on outside click or touch
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    }
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isActionsMenuOpen]);

  const toggleLanguage = () => {
    const current = i18n.language;
    const nextLang = current === 'en' ? 'vi' : current === 'vi' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleExport = () => {
    const json = exportScene();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `industrial-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsActionsMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importScene(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsActionsMenuOpen(false);
  };

  const handleDelete = () => {
    if (selectedItemId) {
      deleteItem(selectedItemId);
      setIsActionsMenuOpen(false);
    }
  };

  return (
    <header className="h-11 sm:h-12 w-full max-w-full bg-industrial-800 border-b border-industrial-700 flex items-center px-1.5 sm:px-3 gap-1 sm:gap-2 flex-shrink-0 select-none relative z-30">
      {/* Palette toggle button: visible on desktop/tablet, mobile uses bottom floating button */}
      {onTogglePalette && (
        <button
          onClick={onTogglePalette}
          className={`hidden sm:flex btn-secondary text-xs px-2 py-1.5 items-center gap-1.5 transition-colors flex-shrink-0 ${
            isPaletteOpen ? 'bg-industrial-600 text-white border-accent' : 'text-industrial-300'
          }`}
          title={isPaletteOpen ? 'Hide Equipment Palette' : 'Show Equipment Palette'}
          aria-label="Toggle Equipment Palette"
          aria-pressed={isPaletteOpen}
        >
          <span className="text-sm leading-none">📦</span>
          <span className="hidden md:inline font-medium">{t('palette.title')}</span>
        </button>
      )}

      {/* Brand & Title */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-accent rounded flex items-center justify-center font-bold text-white shadow-sm font-mono text-xs flex-shrink-0">
          CW
        </div>
        <div className="hidden md:block">
          <h1 className="text-xs font-bold text-industrial-100 tracking-wide leading-none">
            CLOUDWORX
          </h1>
          <p className="hidden lg:block text-[10px] text-industrial-400 font-mono leading-tight">
            Digital Twin 3D Editor
          </p>
        </div>
      </div>

      <div className="w-px h-4 bg-industrial-700 mx-0.5 hidden sm:block" />

      {/* History Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="btn-secondary text-xs w-7 h-7 sm:w-auto sm:h-auto p-1 sm:px-2 sm:py-1 flex items-center justify-center gap-1"
          title={`${t('toolbar.undo')} (Ctrl+Z)`}
          aria-label={t('toolbar.undo')}
        >
          <span className="text-sm leading-none font-bold">↶</span>
          <span className="hidden lg:inline">{t('toolbar.undo')}</span>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="btn-secondary text-xs w-7 h-7 sm:w-auto sm:h-auto p-1 sm:px-2 sm:py-1 flex items-center justify-center gap-1"
          title={`${t('toolbar.redo')} (Ctrl+Shift+Z)`}
          aria-label={t('toolbar.redo')}
        >
          <span className="text-sm leading-none font-bold">↷</span>
          <span className="hidden lg:inline">{t('toolbar.redo')}</span>
        </button>
      </div>

      {/* Item Delete (visible on sm+ if item selected; mobile uses bottom card) */}
      {selectedItemId && (
        <button
          onClick={handleDelete}
          className="hidden sm:flex btn-secondary text-xs px-2 py-1 items-center gap-1 text-violation hover:text-violation border-violation/40 bg-violation/10 flex-shrink-0"
          title={`${t('toolbar.delete')} (Del)`}
          aria-label={t('toolbar.delete')}
        >
          <span>🗑</span>
          <span className="hidden md:inline">{t('toolbar.delete')}</span>
        </button>
      )}

      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Desktop inline actions (xl:flex) */}
      <div className="hidden xl:flex items-center gap-1 flex-shrink-0">
        <div className="w-px h-5 bg-industrial-700 mx-1" />
        <button
          onClick={handleExport}
          className="btn-secondary text-xs px-2 py-1"
          title="Export scene JSON"
        >
          📥 {t('toolbar.export')}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-xs px-2 py-1"
          title="Import scene JSON"
        >
          📤 Import
        </button>
        <button
          onClick={clearScene}
          className="btn-secondary text-xs px-2 py-1 text-industrial-400 hover:text-industrial-200"
          title={t('toolbar.clear')}
        >
          {t('toolbar.clear')}
        </button>
        <button
          onClick={() => populateScene(500)}
          className="btn-secondary text-xs px-2.5 py-1 bg-accent/15 border-accent/40 text-accent font-medium hover:bg-accent/25"
          title="Populate 500 items on the 20x12m grid to measure target frame rates and draw calls"
        >
          ⚡ {t('toolbar.benchmark')}
        </button>
        {onOpenEmbedModal && (
          <button
            onClick={onOpenEmbedModal}
            className="btn-secondary text-xs px-2 py-1 text-industrial-300 hover:text-white"
            title="Open PostMessage Host Simulation Modal"
          >
            🔗 Host Embed
          </button>
        )}
      </div>

      {/* Responsive Actions Dropdown (< xl) */}
      <div className="relative xl:hidden flex-shrink-0" ref={actionsMenuRef}>
        <button
          onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
          className={`btn-secondary text-xs px-1.5 sm:px-2 py-1 flex items-center gap-0.5 sm:gap-1 font-medium ${
            isActionsMenuOpen ? 'bg-industrial-600 text-white' : ''
          }`}
          aria-expanded={isActionsMenuOpen}
          aria-haspopup="true"
          title="Scene and Project Actions"
        >
          <span>⚡</span>
          <span className="hidden sm:inline">Actions</span>
          <span className="text-[9px] sm:text-[10px]">▾</span>
        </button>

        {isActionsMenuOpen && (
          <>
            {/* Mobile backdrop so tapping outside dismisses cleanly */}
            <div
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
              onClick={() => setIsActionsMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 max-w-[calc(100vw-12px)] bg-industrial-800 border border-industrial-600 rounded-lg shadow-2xl py-1 z-50 text-xs">
            {/* Mobile language switch inside actions dropdown */}
            <div className="sm:hidden px-3 py-2 border-b border-industrial-700/60 flex items-center justify-between">
              <span className="text-industrial-400 font-medium">Language</span>
              <button
                onClick={toggleLanguage}
                className="btn-secondary text-xs px-2 py-0.5 font-semibold flex items-center gap-1 border-industrial-600"
              >
                <span>
                  {i18n.language === 'vi' ? '🇻🇳 VI' : i18n.language === 'zh' ? '🇨🇳 ZH' : '🇬🇧 EN'}
                </span>
                <span className="text-[10px] text-industrial-400">↻</span>
              </button>
            </div>

            {/* Mobile palette trigger option */}
            {onTogglePalette && (
              <button
                onClick={() => {
                  setIsActionsMenuOpen(false);
                  onTogglePalette();
                }}
                className="sm:hidden w-full text-left px-3 py-2 hover:bg-industrial-700/80 text-industrial-200 flex items-center gap-2 border-b border-industrial-700/40"
              >
                <span>📦</span>
                <span>{isPaletteOpen ? 'Close Equipment Palette' : 'Open Equipment Palette'}</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="w-full text-left px-3 py-2 hover:bg-industrial-700/80 text-industrial-200 flex items-center gap-2"
            >
              <span>📥</span>
              <span>{t('toolbar.export')} Scene JSON</span>
            </button>
            <button
              onClick={() => {
                setIsActionsMenuOpen(false);
                fileInputRef.current?.click();
              }}
              className="w-full text-left px-3 py-2 hover:bg-industrial-700/80 text-industrial-200 flex items-center gap-2"
            >
              <span>📤</span>
              <span>Import Scene JSON</span>
            </button>
            <div className="border-t border-industrial-700/60 my-1" />
            <button
              onClick={() => {
                setIsActionsMenuOpen(false);
                populateScene(500);
              }}
              className="w-full text-left px-3 py-2 hover:bg-industrial-700/80 text-accent font-medium flex items-center gap-2"
            >
              <span>⚡</span>
              <span>{t('toolbar.benchmark')}</span>
            </button>
            {onOpenEmbedModal && (
              <button
                onClick={() => {
                  setIsActionsMenuOpen(false);
                  onOpenEmbedModal();
                }}
                className="w-full text-left px-3 py-2 hover:bg-industrial-700/80 text-industrial-200 flex items-center gap-2"
              >
                <span>🔗</span>
                <span>Host Embed Simulator</span>
              </button>
            )}
            {selectedItemId && (
              <>
                <div className="border-t border-industrial-700/60 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 hover:bg-violation/20 text-violation flex items-center gap-2"
                >
                  <span>🗑</span>
                  <span>Delete Selected Item</span>
                </button>
              </>
            )}
            <div className="border-t border-industrial-700/60 my-1" />
            <button
              onClick={() => {
                setIsActionsMenuOpen(false);
                clearScene();
              }}
              className="w-full text-left px-3 py-2 hover:bg-violation/20 text-violation flex items-center gap-2"
            >
              <span>🗑</span>
              <span>{t('toolbar.clear')}</span>
            </button>
          </div>
        </>
      )}
      </div>

      {/* Flexible Spacer */}
      <div className="flex-1 min-w-[4px]" />

      {/* Telemetry / Performance HUD - Compact on 320px */}
      <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono bg-industrial-900/80 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded border border-industrial-700/60 shadow-inner flex-shrink-0">
        <span className="hidden sm:inline text-industrial-300">
          {t('toolbar.items')}: <strong className="text-white">{itemCount}</strong>
        </span>
        <span className="hidden sm:inline text-industrial-600">|</span>
        <span
          className={
            fps >= 50
              ? 'text-success font-bold'
              : fps >= 30
              ? 'text-yellow-400 font-bold'
              : 'text-violation font-bold'
          }
        >
          {fps} <span className="text-[9px] sm:text-xs">FPS</span>
        </span>
        <span className="hidden md:inline text-industrial-600">|</span>
        <span className="hidden md:inline text-industrial-300">
          Calls: <strong className="text-industrial-100">{drawCalls}</strong>
        </span>
      </div>

      {/* Language Toggle in Header (visible on sm+, mobile uses Actions dropdown) */}
      <button
        onClick={toggleLanguage}
        className="hidden sm:flex btn-secondary text-xs px-2 py-1 font-semibold items-center gap-1 border-industrial-600 flex-shrink-0"
        aria-label={t('toolbar.language')}
        title="Cycle Language: English -> Tiếng Việt -> 中文"
      >
        <span>
          {i18n.language === 'vi' ? '🇻🇳' : i18n.language === 'zh' ? '🇨🇳' : '🇬🇧'}
        </span>
        <span className="hidden md:inline text-[11px]">
          {i18n.language === 'vi' ? 'VI' : i18n.language === 'zh' ? 'ZH' : 'EN'}
        </span>
      </button>

      {/* Right: Workspace Panels toggle button */}
      {onTogglePanel && (
        <button
          onClick={onTogglePanel}
          className={`btn-secondary text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 flex items-center gap-1 relative flex-shrink-0 transition-colors ${
            isPanelOpen ? 'bg-industrial-600 text-white border-accent' : 'text-industrial-300'
          }`}
          title={isPanelOpen ? 'Hide Workspace Panel' : 'Show Workspace Panel'}
          aria-label="Toggle Workspace Panel"
          aria-pressed={isPanelOpen}
        >
          <span className="text-sm leading-none">⚙️</span>
          <span className="hidden md:inline font-medium">Panel</span>
          {violationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violation opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violation text-[8px] font-bold text-white items-center justify-center">
                {violationsCount > 9 ? '9+' : violationsCount}
              </span>
            </span>
          )}
        </button>
      )}
    </header>
  );
}
