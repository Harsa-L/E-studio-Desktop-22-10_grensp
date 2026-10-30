import React, { useMemo, useState } from 'react';
import { buildTypedQrPayload, TypedQrPayloadInput, TypedQrPayloadKind } from '../utils/typedQrPayload';

interface TypedQrPayloadWizardProps {
  onApply: (payload: string) => void;
  onClose: () => void;
}

const KIND_LABELS: Record<TypedQrPayloadKind, string> = {
  url: 'URL',
  wifi: 'Wi-Fi',
  contact: 'Contact',
  email: 'Email',
  phone: 'Phone call',
  sms: 'SMS',
  geo: 'Location',
};

const CONTROL_CLASS = 'w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-2.5 py-2 text-xs text-[var(--content-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]';
const FIELD_LABEL_CLASS = 'mb-1 block text-xs font-semibold text-[var(--content-secondary)]';

export const TypedQrPayloadWizard: React.FC<TypedQrPayloadWizardProps> = ({ onApply, onClose }) => {
  const [kind, setKind] = useState<TypedQrPayloadKind>('url');
  const [values, setValues] = useState<TypedQrPayloadInput>({
    kind: 'url',
    security: 'WPA',
    hidden: false,
  });
  const result = useMemo(() => {
    try {
      return { payload: buildTypedQrPayload({ ...values, kind }), error: '' };
    } catch (error) {
      return { payload: '', error: error instanceof Error ? error.message : 'Unable to build this QR payload.' };
    }
  }, [kind, values]);

  const update = (patch: Partial<TypedQrPayloadInput>) => setValues((current) => ({ ...current, ...patch }));
  const field = (label: string, key: keyof TypedQrPayloadInput, options: { type?: string; placeholder?: string } = {}) => (
    <label className="block">
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <input
        type={options.type || 'text'}
        value={String(values[key] ?? '')}
        placeholder={options.placeholder}
        onChange={(event) => update({ [key]: event.target.value })}
        className={CONTROL_CLASS}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="typed-qr-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--content-primary)] shadow-2xl"
      >
        <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-4">
          <h2 id="typed-qr-title" className="text-base font-bold text-[var(--content-primary)]">Build QR content</h2>
          <p className="mt-1 text-xs text-[var(--content-muted)]">Create a typed payload and review the exact content before applying it.</p>
        </header>
        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className={FIELD_LABEL_CLASS}>Content type</span>
            <select
              value={kind}
              onChange={(event) => {
                const next = event.target.value as TypedQrPayloadKind;
                setKind(next);
                setValues((current) => ({ ...current, kind: next }));
              }}
              className={CONTROL_CLASS}
            >
              {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          {kind === 'url' && field('URL', 'url', { placeholder: 'https://example.com' })}
          {kind === 'wifi' && (
            <div className="space-y-3">
              {field('Network name (SSID)', 'ssid')}
              <label className="block">
                <span className={FIELD_LABEL_CLASS}>Security</span>
                <select value={values.security || 'WPA'} onChange={(event) => update({ security: event.target.value as TypedQrPayloadInput['security'] })} className={CONTROL_CLASS}>
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open network</option>
                </select>
              </label>
              {values.security !== 'nopass' && field('Password', 'password', { type: 'password' })}
              <label className="flex items-center gap-2 text-xs text-[var(--content-secondary)]">
                <input
                  type="checkbox"
                  checked={Boolean(values.hidden)}
                  onChange={(event) => update({ hidden: event.target.checked })}
                  className="rounded border-[var(--border-strong)] accent-[var(--action-primary)]"
                />
                Hidden network
              </label>
            </div>
          )}
          {kind === 'contact' && (
            <div className="space-y-3">
              {field('Full name', 'name')}
              {field('Organization (optional)', 'organization')}
              {field('Phone (optional)', 'contactPhone', { type: 'tel' })}
              {field('Email (optional)', 'contactEmail', { type: 'email' })}
            </div>
          )}
          {kind === 'email' && (
            <div className="space-y-3">
              {field('Email address', 'email', { type: 'email' })}
              {field('Subject (optional)', 'subject')}
              <label className="block">
                <span className={FIELD_LABEL_CLASS}>Message (optional)</span>
                <textarea value={values.body || ''} onChange={(event) => update({ body: event.target.value })} rows={3} className={CONTROL_CLASS} />
              </label>
            </div>
          )}
          {kind === 'phone' && field('Phone number', 'phone', { type: 'tel', placeholder: '+1 555 0100' })}
          {kind === 'sms' && (
            <div className="space-y-3">
              {field('Phone number', 'phone', { type: 'tel', placeholder: '+1 555 0100' })}
              <label className="block">
                <span className={FIELD_LABEL_CLASS}>Message (optional)</span>
                <textarea value={values.body || ''} onChange={(event) => update({ body: event.target.value })} rows={3} className={CONTROL_CLASS} />
              </label>
            </div>
          )}
          {kind === 'geo' && (
            <div className="grid grid-cols-2 gap-3">
              {field('Latitude (-90 to 90)', 'latitude', { type: 'number' })}
              {field('Longitude (-180 to 180)', 'longitude', { type: 'number' })}
            </div>
          )}

          <div aria-live="polite" className={`rounded-lg border p-3 ${result.error ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
            <p className={`text-xs font-semibold ${result.error ? 'text-rose-500' : 'text-emerald-500'}`}>{result.error || 'Payload preview'}</p>
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
            Apply QR content
          </button>
        </footer>
      </section>
    </div>
  );
};
