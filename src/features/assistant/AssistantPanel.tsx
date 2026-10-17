import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/useEditorStore';
import { generateAssistantResponse, streamResponse } from './mockAssistant';

export function AssistantPanel() {
  const { t } = useTranslation();
  const items = useEditorStore(s => s.items);
  const aiProposal = useEditorStore(s => s.aiProposal);
  const setAIProposal = useEditorStore(s => s.setAIProposal);
  const acceptProposal = useEditorStore(s => s.acceptProposal);
  const rejectProposal = useEditorStore(s => s.rejectProposal);

  const [query, setQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);

  const handleSubmit = useCallback(async (customQuery?: string) => {
    const q = customQuery ?? query;
    if (!q.trim() || isStreaming) return;

    setResponseText('');
    setIsStreaming(true);
    abortRef.current = false;

    const response = generateAssistantResponse(q, items);

    let accumulated = '';
    for await (const chunk of streamResponse(response.text)) {
      if (abortRef.current) break;
      accumulated += chunk;
      setResponseText(accumulated);
    }

    setIsStreaming(false);

    if (response.proposal) {
      setAIProposal({ ...response.proposal, status: 'previewing' });
    }

    if (!customQuery) setQuery('');
  }, [query, items, isStreaming, setAIProposal]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const itemCount = useEditorStore(s => s.getItemCount());

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-accent animate-pulse">✨</span>
          {t('assistant.title')}
        </span>
        {aiProposal && (
          <span className="text-[10px] bg-accent/20 text-accent font-semibold px-1.5 py-0.5 rounded">
            Preview Active
          </span>
        )}
      </div>
      <div className="p-3 space-y-2.5">
        {/* Quick action buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => handleSubmit('Detect all items')}
            disabled={isStreaming}
            className="text-[11px] bg-industrial-700/60 hover:bg-industrial-700 text-industrial-200 px-2.5 py-1 rounded whitespace-nowrap border border-industrial-600/50"
            title="Inspect and detect all placed equipment in the 3D layout"
          >
            🔍 Detect ({itemCount})
          </button>
          <button
            onClick={() => handleSubmit('Fix clearance violations')}
            disabled={isStreaming}
            className="text-[11px] bg-industrial-700/60 hover:bg-industrial-700 text-industrial-200 px-2 py-1 rounded whitespace-nowrap border border-industrial-600/50"
          >
            ⚡ Fix clearance
          </button>
          <button
            onClick={() => handleSubmit('Summarize layout')}
            disabled={isStreaming}
            className="text-[11px] bg-industrial-700/60 hover:bg-industrial-700 text-industrial-200 px-2 py-1 rounded whitespace-nowrap border border-industrial-600/50"
          >
            📊 Summary
          </button>
        </div>

        {/* Response box */}
        {responseText && (
          <div className="text-xs text-industrial-200 bg-industrial-900/90 border border-industrial-700/80 rounded p-2.5 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed font-sans">
            {responseText}
            {isStreaming && <span className="inline-block w-1.5 h-3 ml-0.5 bg-accent animate-pulse align-middle" />}
          </div>
        )}

        {/* Proposal preview actions */}
        {aiProposal && aiProposal.status === 'previewing' && (
          <div className="bg-success/10 border border-success/30 rounded p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-success flex items-center gap-1">
              <span>●</span>
              <span>{t('assistant.previewActive')}</span>
            </div>
            <p className="text-xs text-industrial-200">{aiProposal.description}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={acceptProposal}
                className="btn-primary text-xs py-1 px-3 flex-1 flex items-center justify-center gap-1 font-semibold"
              >
                ✓ {t('assistant.accept')}
              </button>
              <button
                onClick={rejectProposal}
                className="btn-secondary text-xs py-1 px-3 flex-1 flex items-center justify-center gap-1"
              >
                ✕ {t('assistant.reject')}
              </button>
            </div>
          </div>
        )}

        {aiProposal?.status === 'accepted' && (
          <div className="text-xs text-success bg-success/10 border border-success/30 rounded p-2 font-medium">
            ✓ {t('assistant.accepted')} (Recorded in Undo history)
          </div>
        )}

        {/* Input prompt */}
        <div className="flex gap-1.5">
          <input
            type="text"
            className="input-field text-xs py-1.5 flex-1"
            placeholder={t('assistant.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!query.trim() || isStreaming}
            className="btn-primary text-xs px-3 py-1.5 font-medium"
          >
            {isStreaming ? '...' : t('assistant.send')}
          </button>
        </div>
      </div>
    </div>
  );
}

