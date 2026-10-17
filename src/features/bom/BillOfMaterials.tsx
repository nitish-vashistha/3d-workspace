import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import type { EquipmentTypeId } from '../../types/equipment';
import type { BOMEntry } from '../../types/scene';

export function BillOfMaterials() {
  const { t } = useTranslation();
  const items = useEditorStore(s => s.items);

  const bomEntries = useMemo((): BOMEntry[] => {
    const counts = new Map<EquipmentTypeId, number>();
    Object.values(items).forEach(item => {
      counts.set(item.type, (counts.get(item.type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([type, quantity]) => {
      const def = EQUIPMENT_TYPES[type];
      return {
        type,
        nameKey: def.nameKey,
        category: def.bomCategory,
        quantity,
        dimensions: `${def.width}×${def.height}×${def.depth}m`,
      };
    });
  }, [items]);

  const totalItems = Object.keys(items).length;

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex justify-between items-center">
        <span>{t('bom.title')}</span>
        <span className="text-[11px] font-mono text-industrial-400">Total: {totalItems}</span>
      </div>
      <div className="overflow-x-auto max-h-40">
        {bomEntries.length === 0 ? (
          <div className="p-3 text-xs text-industrial-400 text-center italic">
            {t('bom.empty')}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-industrial-400 border-b border-industrial-700/60 bg-industrial-900/40">
                <th className="px-2.5 py-1.5">{t('bom.type')}</th>
                <th className="px-2.5 py-1.5 text-right">{t('bom.quantity')}</th>
                <th className="px-2.5 py-1.5">{t('bom.dimensions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-700/40">
              {bomEntries.map(entry => (
                <tr key={entry.type} className="hover:bg-industrial-700/30">
                  <td className="px-2.5 py-1.5 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: EQUIPMENT_TYPES[entry.type].color }}
                    />
                    <span className="font-medium text-industrial-200">{t(entry.nameKey)}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-bold text-accent">{entry.quantity}</td>
                  <td className="px-2.5 py-1.5 text-industrial-400 font-mono text-[10px]">{entry.dimensions}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-industrial-600 bg-industrial-900/60 font-semibold text-industrial-200">
                <td className="px-2.5 py-1.5">{t('bom.total')}</td>
                <td className="px-2.5 py-1.5 text-right font-mono text-white">{totalItems}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

