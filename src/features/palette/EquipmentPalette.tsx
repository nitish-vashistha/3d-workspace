import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import type { EquipmentTypeId } from '../../types/equipment';

export function EquipmentPalette() {
  const { t } = useTranslation();
  const activeMode = useEditorStore(s => s.activeMode);
  const placingType = useEditorStore(s => s.placingType);
  const setMode = useEditorStore(s => s.setMode);

  const handleSelect = (typeId: EquipmentTypeId) => {
    if (activeMode === 'place' && placingType === typeId) {
      setMode('select');
    } else {
      setMode('place', typeId);
    }
  };

  return (
    <div className="w-56 panel flex flex-col overflow-hidden m-1 mr-0">
      <div className="panel-header">{t('palette.title')}</div>
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        <p className="text-xs text-industrial-400 px-1">{t('palette.dragToPlace')}</p>
        {(Object.keys(EQUIPMENT_TYPES) as EquipmentTypeId[]).map(typeId => {
          const def = EQUIPMENT_TYPES[typeId];
          const isActive = activeMode === 'place' && placingType === typeId;
          return (
            <button
              key={typeId}
              onClick={() => handleSelect(typeId)}
              className={`w-full flex items-center gap-3 p-2 rounded transition-colors text-left border ${
                isActive
                  ? 'bg-accent/20 border-accent text-industrial-100 ring-1 ring-accent'
                  : 'hover:bg-industrial-700/60 border-industrial-700/50 bg-industrial-800/80 text-industrial-300'
              }`}
              aria-pressed={isActive}
              aria-label={t(def.nameKey)}
            >
              <div
                className="w-8 h-8 rounded flex-shrink-0 shadow-inner flex items-center justify-center text-xs font-bold text-white/90"
                style={{ backgroundColor: def.color }}
              >
                {typeId[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-industrial-200">{t(def.nameKey)}</div>
                <div className="text-xs text-industrial-400">
                  {def.width}m × {def.height}m × {def.depth}m
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

