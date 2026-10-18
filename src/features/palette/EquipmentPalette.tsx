import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import type { EquipmentTypeId } from '../../types/equipment';

interface EquipmentPaletteProps {
  onClose?: () => void;
  onItemSelect?: (typeId: EquipmentTypeId) => void;
  className?: string;
}

export function EquipmentPalette({ onClose, onItemSelect, className = '' }: EquipmentPaletteProps) {
  const { t } = useTranslation();
  const activeMode = useEditorStore(s => s.activeMode);
  const placingType = useEditorStore(s => s.placingType);
  const setMode = useEditorStore(s => s.setMode);

  const handleSelect = (typeId: EquipmentTypeId) => {
    if (activeMode === 'place' && placingType === typeId) {
      setMode('select');
    } else {
      setMode('place', typeId);
      onItemSelect?.(typeId);
    }
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-industrial-800 ${className}`}>
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold">
          <span>📦</span>
          <span>{t('palette.title')}</span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-industrial-400 hover:text-white rounded hover:bg-industrial-700/60 transition-colors"
            aria-label="Close palette"
          >
            ✕
          </button>
        )}
      </div>
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        <p className="text-xs text-industrial-400 px-1 leading-snug">{t('palette.dragToPlace')}</p>
        {(Object.keys(EQUIPMENT_TYPES) as EquipmentTypeId[]).map(typeId => {
          const def = EQUIPMENT_TYPES[typeId];
          const isActive = activeMode === 'place' && placingType === typeId;
          return (
            <button
              key={typeId}
              onClick={() => handleSelect(typeId)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left border ${
                isActive
                  ? 'bg-accent/20 border-accent text-industrial-100 ring-2 ring-accent/60'
                  : 'hover:bg-industrial-700/60 border-industrial-700/50 bg-industrial-900/60 text-industrial-300'
              }`}
              aria-pressed={isActive}
              aria-label={t(def.nameKey)}
            >
              <div
                className="w-9 h-9 rounded-md flex-shrink-0 shadow-inner flex items-center justify-center text-xs font-bold text-white/90 border border-white/20"
                style={{ backgroundColor: def.color }}
              >
                {typeId[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate text-industrial-100">{t(def.nameKey)}</div>
                <div className="text-[11px] text-industrial-400 font-mono">
                  {def.width}m × {def.height}m × {def.depth}m
                </div>
              </div>
              {isActive && (
                <span className="text-accent text-xs font-bold font-mono">ACTIVE</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
