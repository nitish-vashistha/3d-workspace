import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import { isItemInViolation } from '../rule-validation/ruleEngine';

export function SceneList() {
  const { t } = useTranslation();
  const items = useEditorStore(s => s.items);
  const selectedItemId = useEditorStore(s => s.selectedItemId);
  const violations = useEditorStore(s => s.violations);
  const selectItem = useEditorStore(s => s.selectItem);

  const itemList = Object.values(items);

  return (
    <div className="panel flex flex-col max-h-56 overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>{t('sceneList.title')}</span>
        <span className="text-industrial-400 font-mono text-xs font-normal">
          {t('sceneList.count', { count: itemList.length })}
        </span>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-industrial-700/60">
        {itemList.length === 0 ? (
          <div className="p-3 text-xs text-industrial-400 text-center italic">
            {t('sceneList.empty')}
          </div>
        ) : (
          <ul className="divide-y divide-industrial-700/50" role="listbox" aria-label={t('sceneList.title')}>
            {itemList.map(item => {
              const def = EQUIPMENT_TYPES[item.type];
              const isSelected = selectedItemId === item.id;
              const hasViolation = isItemInViolation(item.id, violations);

              return (
                <li key={item.id} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => selectItem(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent/20 text-white font-medium border-l-2 border-accent'
                        : 'hover:bg-industrial-700/50 text-industrial-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: hasViolation ? '#ef4444' : def.color }}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-[10px] font-mono text-industrial-400">
                      ({item.x.toFixed(1)}, {item.z.toFixed(1)})
                    </span>
                    {hasViolation && (
                      <span className="text-violation font-bold text-xs" title="Clearance violation">
                        ⚠
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

