import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';

interface ToolbarProps {
  fps: number;
  drawCalls: number;
  onOpenEmbedModal?: () => void;
}

export function Toolbar({ fps, drawCalls, onOpenEmbedModal }: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleDelete = () => {
    if (selectedItemId) {
      deleteItem(selectedItemId);
    }
  };

  return (
    <header className="h-12 bg-industrial-800 border-b border-industrial-700 flex items-center px-3 gap-2 flex-shrink-0 select-none z-10">
      {/* Brand & Title */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-7 h-7 bg-accent rounded flex items-center justify-center font-bold text-white shadow-sm font-mono text-sm">
          CW
        </div>
        <div>
          <h1 className="text-xs font-bold text-industrial-100 tracking-wide leading-none">
            CLOUDWORX
          </h1>
          <p className="text-[10px] text-industrial-400 font-mono leading-tight">
            Digital Twin 3D Editor
          </p>
        </div>
      </div>

      <div className="w-px h-6 bg-industrial-700 mx-1" />

      {/* History Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
          title={`${t('toolbar.undo')} (Ctrl+Z)`}
          aria-label={t('toolbar.undo')}
        >
          <span className="text-sm leading-none">↶</span>
          <span className="hidden md:inline">{t('toolbar.undo')}</span>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
          title={`${t('toolbar.redo')} (Ctrl+Shift+Z)`}
          aria-label={t('toolbar.redo')}
        >
          <span className="text-sm leading-none">↷</span>
          <span className="hidden md:inline">{t('toolbar.redo')}</span>
        </button>
      </div>

      {/* Item Delete */}
      <button
        onClick={handleDelete}
        disabled={!selectedItemId}
        className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1 text-violation hover:text-violation"
        title={`${t('toolbar.delete')} (Del)`}
        aria-label={t('toolbar.delete')}
      >
        <span>🗑</span>
        <span className="hidden lg:inline">{t('toolbar.delete')}</span>
      </button>

      <div className="w-px h-6 bg-industrial-700 mx-1" />

      {/* Project file ops */}
      <div className="flex items-center gap-1">
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          onClick={clearScene}
          className="btn-secondary text-xs px-2 py-1 text-industrial-400 hover:text-industrial-200"
          title={t('toolbar.clear')}
        >
          {t('toolbar.clear')}
        </button>
      </div>

      <div className="w-px h-6 bg-industrial-700 mx-1" />

      {/* Benchmark Action */}
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

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* Telemetry / Performance HUD */}
      <div className="flex items-center gap-3 text-xs font-mono bg-industrial-900/80 px-2.5 py-1 rounded border border-industrial-700/60 shadow-inner">
        <span className="text-industrial-300">
          {t('toolbar.items')}: <strong className="text-white">{itemCount}</strong>
        </span>
        <span className="text-industrial-600">|</span>
        <span
          className={
            fps >= 50
              ? 'text-success font-bold'
              : fps >= 30
              ? 'text-yellow-400 font-bold'
              : 'text-violation font-bold'
          }
        >
          {t('toolbar.fps')}: {fps}
        </span>
        <span className="text-industrial-600">|</span>
        <span className="text-industrial-300">
          Calls: <strong className="text-industrial-100">{drawCalls}</strong>
        </span>
      </div>

      <div className="w-px h-6 bg-industrial-700 mx-1" />

      {/* Language Toggle (EN / VI / ZH) */}
      <button
        onClick={toggleLanguage}
        className="btn-secondary text-xs px-2.5 py-1 font-semibold flex items-center gap-1.5 border-industrial-600"
        aria-label={t('toolbar.language')}
        title="Cycle Language: English -> Tiếng Việt -> 中文"
      >
        <span>
          {i18n.language === 'vi' ? '🇻🇳 VI' : i18n.language === 'zh' ? '🇨🇳 ZH' : '🇬🇧 EN'}
        </span>
      </button>
    </header>
  );
}

