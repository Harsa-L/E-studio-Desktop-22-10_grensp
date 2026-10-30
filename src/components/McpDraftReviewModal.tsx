import React, { useEffect, useState } from 'react';
import { Bot, Check, LoaderCircle, RefreshCw, Trash2, X } from 'lucide-react';
import { LabelTemplate } from '../types';
import { api, McpDraftSummary } from '../services/api';

interface McpDraftReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (template: LabelTemplate) => Promise<void>;
}

export const McpDraftReviewModal: React.FC<McpDraftReviewModalProps> = ({
  isOpen,
  onClose,
  onApprove,
}) => {
  const [drafts, setDrafts] = useState<McpDraftSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<LabelTemplate | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const refreshDrafts = async () => {
    setIsBusy(true);
    setFeedback('');
    try {
      const nextDrafts = await api.mcpDraftList();
      setDrafts(nextDrafts);
      setSelectedId((current) =>
        nextDrafts.some((draft) => draft.id === current) ? current : nextDrafts[0]?.id || ''
      );
      if (nextDrafts.length === 0) setSelectedDraft(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (isOpen) void refreshDrafts();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedId) {
      setSelectedDraft(null);
      return;
    }
    let cancelled = false;
    setIsBusy(true);
    setFeedback('');
    api.mcpDraftRead(selectedId)
      .then((template) => {
        if (!cancelled) setSelectedDraft(template);
      })
      .catch((error: unknown) => {
        if (!cancelled) setFeedback(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setIsBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedDraft) return;
    setIsBusy(true);
    setFeedback('');
    try {
      await onApprove(selectedDraft);
      await api.mcpDraftRemove(selectedDraft.id);
      setSelectedDraft(null);
      await refreshDrafts();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
      setIsBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (!selectedId) return;
    setIsBusy(true);
    setFeedback('');
    try {
      await api.mcpDraftRemove(selectedId);
      setSelectedDraft(null);
      await refreshDrafts();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
      setIsBusy(false);
    }
  };

  const draftId = drafts.find((draft) => draft.id === selectedId)?.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-drafts-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--content-primary)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-[var(--action-primary)]" />
            <div>
              <h2 id="mcp-drafts-title" className="font-bold text-[var(--content-primary)]">Brouillons MCP en attente</h2>
              <p className="mt-1 text-xs text-[var(--content-muted)]">Aucun brouillon ne rejoint la bibliothèque sans votre approbation.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-[var(--content-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--content-muted)] font-mono tabular-nums">{drafts.length} brouillon(s)</span>
              <button
                type="button"
                onClick={() => void refreshDrafts()}
                disabled={isBusy}
                aria-label="Actualiser les brouillons"
                className="rounded p-1 text-[var(--content-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            {drafts.map((draft) => (
              <button
                type="button"
                key={draft.id}
                onClick={() => setSelectedId(draft.id)}
                className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] ${
                  selectedId === draft.id
                    ? 'border-[var(--action-primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--action-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span className="block truncate text-sm font-semibold text-[var(--content-primary)]">{draft.name}</span>
                <span className="mt-1 block text-xs text-[var(--content-muted)] font-mono tabular-nums">{draft.width_mm} × {draft.height_mm} mm · {draft.item_count} objet(s)</span>
              </button>
            ))}
            {!drafts.length && !isBusy && <p className="rounded-lg border border-[var(--border-subtle)] p-3 text-xs text-[var(--content-muted)]">Aucun brouillon en attente.</p>}
          </aside>

          <div className="min-w-0 space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
              Examinez les objets et propriétés avant approbation. Le brouillon est fourni par un outil IA local; les valeurs restent à vérifier avant impression.
            </div>
            {selectedDraft && (
              <>
                <h3 className="text-sm font-bold text-[var(--content-primary)]">{selectedDraft.name}</h3>
                <pre className="max-h-[50vh] overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-4 font-mono text-xs text-[var(--content-primary)]">
                  {JSON.stringify(selectedDraft, null, 2)}
                </pre>
              </>
            )}
            {feedback && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 font-medium">{feedback}</p>}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5">
          <button
            type="button"
            onClick={() => void handleDiscard()}
            disabled={isBusy || !draftId}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer le brouillon
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-2 text-xs font-semibold text-[var(--content-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={isBusy || !selectedDraft}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--action-primary)] hover:opacity-90 px-4 py-2 text-xs font-bold text-[var(--action-primary-fg)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
            >
              {isBusy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Examiner et ajouter au projet
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
