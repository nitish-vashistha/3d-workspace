import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import { GRID } from '../../types/scene';
import { snapToGrid } from '../../store/useEditorStore';

export function PropertiesPanel() {
  const { t } = useTranslation();
  const selectedItemId = useEditorStore(s => s.selectedItemId);
  const items = useEditorStore(s => s.items);
  const updateItemName = useEditorStore(s => s.updateItemName);
  const updateItemPosition = useEditorStore(s => s.updateItemPosition);
  const rotateItem = useEditorStore(s => s.rotateItem);
  const updateItemProperty = useEditorStore(s => s.updateItemProperty);
  const deleteItem = useEditorStore(s => s.deleteItem);

  const item = selectedItemId ? items[selectedItemId] : null;

  const handlePositionChange = useCallback(
    (axis: 'x' | 'z', value: string) => {
      if (!item) return;
      const num = parseFloat(value);
      if (isNaN(num)) return;
      const snapped = snapToGrid(num);
      const clamped = Math.max(0, Math.min(axis === 'x' ? GRID.WIDTH : GRID.DEPTH, snapped));
      updateItemPosition(
        item.id,
        axis === 'x' ? clamped : item.x,
        axis === 'z' ? clamped : item.z
      );
    },
    [item, updateItemPosition]
  );

  if (!item) {
    return (
      <div className="panel p-3">
        <div className="panel-header -mx-3 -mt-3 mb-3">{t('properties.title')}</div>
        <div className="p-4 text-xs text-industrial-400 text-center italic">
          {t('properties.noSelection')}
        </div>
      </div>
    );
  }

  const def = EQUIPMENT_TYPES[item.type];

  return (
    <div className="panel p-3">
      <div className="panel-header -mx-3 -mt-3 mb-3">{t('properties.title')}</div>
      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs text-industrial-400 block mb-1">{t('properties.name')}</label>
          <input
            type="text"
            className="input-field"
            value={item.name}
            onChange={e => updateItemName(item.id, e.target.value)}
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs text-industrial-400 block mb-1">{t('properties.type')}</label>
          <div className="text-xs text-industrial-200 flex items-center gap-2 bg-industrial-900/60 p-1.5 rounded border border-industrial-700/50">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: def.color }} />
            {t(def.nameKey)}
          </div>
        </div>

        {/* Position X and Z */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-industrial-400 block mb-1">{t('properties.positionX')}</label>
            <input
              type="number"
              className="input-field"
              value={item.x}
              min={0}
              max={GRID.WIDTH}
              step={GRID.CELL_SIZE}
              onChange={e => handlePositionChange('x', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-industrial-400 block mb-1">{t('properties.positionZ')}</label>
            <input
              type="number"
              className="input-field"
              value={item.z}
              min={0}
              max={GRID.DEPTH}
              step={GRID.CELL_SIZE}
              onChange={e => handlePositionChange('z', e.target.value)}
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="flex items-center justify-between bg-industrial-900/40 p-2 rounded border border-industrial-700/40">
          <div>
            <label className="text-xs text-industrial-400 block">{t('properties.rotation')}</label>
            <span className="text-sm font-mono text-industrial-200">{item.rotation}°</span>
          </div>
          <button
            onClick={() => rotateItem(item.id)}
            className="btn-secondary text-xs px-2.5 py-1"
            title="Rotate 90 degrees clockwise (Hotkey: R)"
          >
            ↻ +90°
          </button>
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-xs text-industrial-400 block mb-1">{t('properties.dimensions')}</label>
          <div className="text-xs text-industrial-300 font-mono bg-industrial-900/40 p-1.5 rounded border border-industrial-700/40">
            {def.width}m (W) × {def.height}m (H) × {def.depth}m (D)
          </div>
        </div>

        {/* Custom properties */}
        <div className="border-t border-industrial-700 pt-2 space-y-2">
          <div className="text-xs font-semibold text-industrial-400 uppercase tracking-wider">Attributes</div>
          {Object.entries(item.properties).map(([key, value]) => (
            <div key={key}>
              <label className="text-xs text-industrial-400 block mb-0.5 capitalize">{key}</label>
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                className="input-field text-xs py-1"
                value={value}
                onChange={e =>
                  updateItemProperty(
                    item.id,
                    key,
                    typeof value === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* Delete button */}
        <div className="border-t border-industrial-700 pt-2">
          <button
            onClick={() => deleteItem(item.id)}
            className="btn-danger w-full text-xs py-1.5"
          >
            {t('toolbar.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

