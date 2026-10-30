import React, { useMemo, useState } from 'react';
import { buildGs1ElementString, COMMON_GS1_AI_VALUES, parseGs1ElementString, type Gs1AiValue } from '../utils/gs1Payload';

interface Gs1PayloadWizardProps {
  initialPayload: string;
  onApply: (payload: string) => void;
  onClose: () => void;
}

const FIELD_CLASS = 'w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-2.5 py-2 text-xs text-[var(--content-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]';

export const Gs1PayloadWizard: React.FC<Gs1PayloadWizardProps> = ({ initialPayload, onApply, onClose }) => {
  const [segments, setSegments] = useState<Gs1AiValue[]>(
    () => parseGs1ElementString(initialPayload)
      || (initialPayload
        ? [{ ai: '', value: initialPayload }]
        : COMMON_GS1_AI_VALUES.map((segment) => ({ ...segment }))),
  );
  const result = useMemo(() => {
    try {
      return { payload: buildGs1ElementString(segments), error: '' };
    } catch (error) {
      return { payload: '', error: error instanceof Error ? error.message : 'Unable to build GS1 content.' };
    }
  }, [segments]);

  const updateSegment = (index: number, patch: Partial<Gs1AiValue>) => {
    setSegments((current) => current.map((segment, at) => at === index ? { ...segment, ...patch } : segment));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="gs1-payload-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--content-primary)] shadow-2xl"
      >
        <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-4">
          <h2 id="gs1-payload-title" className="text-base font-bold text-[var(--content-primary)]">Build GS1 content</h2>
          <p className="mt-1 text-xs text-[var(--content-muted)]">Compose application identifiers and validate the payload with E-studio’s GS1 encoder before applying it.</p>
        </header>
        <div className="space-y-3 overflow-y-auto p-5">
          <datalist id="gs1-ai-suggestions">
            {[...new Set(COMMON_GS1_AI_VALUES.map(({ ai }) => ai).concat([
              '00', '02', '11', '15', '20', '21', '30', '37', '3103', '3922', '414', '420', '422', '423', '8005', '8008',
            ]))].map((ai) => <option key={ai} value={ai} />)}
          </datalist>
          {segments.map((segment, index) => (
            <div key={index} className="grid grid-cols-[6rem_1fr_auto] items-end gap-2">
              <label className="block text-xs font-semibold text-[var(--content-secondary)]">
                AI
                <input
                  value={segment.ai}
                  list="gs1-ai-suggestions"
                  inputMode="numeric"
                  aria-label={`Application identifier ${index + 1}`}
                  onChange={(event) => updateSegment(index, { ai: event.target.value })}
                  className={`${FIELD_CLASS} mt-1 font-mono tabular-nums`}
                />
              </label>
              <label className="block text-xs font-semibold text-[var(--content-secondary)]">
                Value
                <input
                  value={segment.value}
                  aria-label={`Value for application identifier ${index + 1}`}
                  onChange={(event) => updateSegment(index, { value: event.target.value })}
                  className={`${FIELD_CLASS} mt-1 font-mono tabular-nums`}
                />
              </label>
              <button
                type="button"
                aria-label={`Remove application identifier ${index + 1}`}
                disabled={segments.length === 1}
                onClick={() => setSegments((current) => current.filter((_, at) => at !== index))}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSegments((current) => [...current, { ai: '10', value: '' }])}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--action-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
          >
            Add application identifier
          </button>
          <div aria-live="polite" className={`rounded-lg border p-3 ${result.error ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
            <p className={`text-xs font-semibold ${result.error ? 'text-rose-500' : 'text-emerald-500'}`}>{result.error || 'Valid GS1 element string'}</p>
            {result.payload && <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[var(--content-primary)]">{result.payload}</pre>}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2 text-xs font-semibold text-[var(--content-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!result.payload}
            onClick={() => onApply(result.payload)}
            className="rounded-lg bg-[var(--action-primary)] hover:opacity-90 px-3 py-2 text-xs font-semibold text-[var(--action-primary-fg)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
          >
            Apply GS1 content
          </button>
        </footer>
      </section>
    </div>
  );
};
