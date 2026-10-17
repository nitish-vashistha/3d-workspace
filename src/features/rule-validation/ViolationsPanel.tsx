import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { generateAssistantResponse } from '../assistant/mockAssistant';

export function ViolationsPanel() {
  const { t } = useTranslation();
  const violations = useEditorStore(s => s.violations);
  const items = useEditorStore(s => s.items);
  const selectItem = useEditorStore(s => s.selectItem);
  const setAIProposal = useEditorStore(s => s.setAIProposal);

  const handleFixAll = () => {
    const response = generateAssistantResponse('Fix all violations', items);
    if (response.proposal) {
      setAIProposal({ ...response.proposal, status: 'previewing' });
    }
  };

  const handleFixOne = (violationKey: string) => {
    const response = generateAssistantResponse('Fix clearance violation', items, violationKey);
    if (response.proposal) {
      setAIProposal({ ...response.proposal, status: 'previewing' });
    }
  };

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className={violations.length > 0 ? 'text-violation' : 'text-success'}>●</span>
          {t('rules.title')}
        </span>
        <div className="flex items-center gap-1.5">
          {violations.length > 1 && (
            <button
              onClick={handleFixAll}
              className="text-[10px] bg-accent/20 hover:bg-accent/30 text-accent font-semibold px-1.5 py-0.5 rounded border border-accent/40"
              title="Generate batch proposal to resolve all clearance violations"
            >
              ⚡ Fix All
            </button>
          )}
          {violations.length > 0 ? (
            <span className="violation-badge text-[10px] font-bold px-1.5 py-0.5">
              {t('rules.violationCount', { count: violations.length })}
            </span>
          ) : (
            <span className="text-[10px] text-success font-medium">Clear</span>
          )}
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {violations.length === 0 ? (
          <div className="p-3 text-xs text-success/90 flex items-center gap-2 bg-success/5">
            <span>✓</span>
            <span>{t('rules.noViolations')}</span>
          </div>
        ) : (
          <ul className="divide-y divide-industrial-700/60">
            {violations.map((v) => {
              const vKey = `${v.itemA}-${v.itemB}`;
              return (
                <li key={vKey} className="p-2 bg-violation/5 hover:bg-violation/10 transition-colors">
                  <div className="text-xs text-violation flex items-start gap-1.5">
                    <span className="font-bold mt-0.5">⚠</span>
                    <div className="flex-1">
                      <p className="text-industrial-200 leading-tight">
                        {t(v.messageKey, {
                          nameA: v.nameA,
                          nameB: v.nameB,
                          distance: v.distance.toFixed(2),
                        })}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => selectItem(v.itemA)}
                            className="text-[11px] font-mono text-accent hover:underline bg-industrial-900/50 px-1 rounded"
                          >
                            inspect {v.nameA}
                          </button>
                          <button
                            onClick={() => selectItem(v.itemB)}
                            className="text-[11px] font-mono text-accent hover:underline bg-industrial-900/50 px-1 rounded"
                          >
                            inspect {v.nameB}
                          </button>
                        </div>
                        <button
                          onClick={() => handleFixOne(vKey)}
                          className="text-[10px] text-accent hover:text-white bg-accent/20 hover:bg-accent/40 px-1.5 py-0.5 rounded font-medium border border-accent/40"
                          title={`Generate AI preview to resolve violation between ${v.nameA} and ${v.nameB}`}
                        >
                          ⚡ AI Fix
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
