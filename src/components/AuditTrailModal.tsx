import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { AuditLogService } from '../services/auditLogService';
import { desktopFileService } from '../services/desktopFileService';
import { History, Filter, Download, Trash2, Clock, User, X } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const { locale, t } = useLocalization();
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => AuditLogService.getAll());
  const [filterAction, setFilterAction] = useState<string>('all');
  const [loadError, setLoadError] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoadError(false);
      AuditLogService.fetchAll()
        .then((records) => setLogs(records))
        .catch(() => setLoadError(true));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = filterAction === 'all'
    ? logs
    : logs.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()));

  const handleClearLogs = () => {
    AuditLogService.clear();
    setLogs([]);
  };

  const handleExportLogs = async () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const filename = `label-audit-log-${Date.now()}.json`;
    await desktopFileService.saveText(filename, dataStr, [
      { name: t('auditTitle'), extensions: ['json'] },
    ]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 bg-[var(--scrim,rgba(0,0,0,0.6))] backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[var(--surface-panel)] rounded-2xl shadow-2xl max-w-3xl w-full border border-[var(--border-default)] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh] text-[var(--content-primary)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="font-bold text-[var(--content-primary)] text-sm">{t('auditTitle')}</h2>
              <p className="text-[11px] text-[var(--content-muted)]">{t('auditSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="p-1.5 text-[var(--content-muted)] hover:text-[var(--content-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[var(--content-muted)]" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1 border border-[var(--border-default)] rounded-lg text-xs bg-[var(--surface-input)] text-[var(--content-primary)] outline-none"
            >
              <option value="all">{t('auditFilterAll')}</option>
              <option value="create">{t('auditFilterCreate')}</option>
              <option value="update">{t('auditFilterUpdate')}</option>
              <option value="print">{t('auditFilterPrint')}</option>
              <option value="export">{t('auditFilterExport')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="px-2.5 py-1 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] font-semibold rounded-lg flex items-center gap-1 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('auditExport')}</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('auditClear')}</span>
            </button>
          </div>
        </div>

        {loadError && (
          <p role="alert" className="border-b border-rose-500/30 bg-rose-500/10 px-5 py-2 text-xs text-rose-400">
            {t('auditLoadError')}
          </p>
        )}

        {/* Log Entries */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--content-muted)] italic">
              {t('auditEmpty')}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 border border-[var(--border-subtle)] rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition flex items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--content-primary)] capitalize">{log.action}</span>
                    {log.template_name && (
                      <span className="px-1.5 py-0.2 bg-[var(--action-primary-bg)]/10 text-[var(--action-primary-bg)] border border-[var(--action-primary-bg)]/30 rounded text-[10px] font-mono">
                        {log.template_name}
                      </span>
                    )}
                  </div>

                  <p className="text-[var(--content-secondary)] text-[11px]">{log.details}</p>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--content-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--content-muted)]" />
                      {new Date(log.timestamp).toLocaleString(locale)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[var(--content-muted)]" />
                      {log.user || t('system')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
