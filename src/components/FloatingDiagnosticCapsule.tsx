import React, { useState, useRef, useEffect } from 'react';
import { LabelTemplate } from '../types';
import { LayoutIssue, analyzeLayoutIssues, autoFixAllLayoutIssues } from '../utils/layoutAutoFix';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Eye,
  RefreshCw,
  Flame,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { ContextTooltip } from '../context/TooltipContext';

interface FloatingDiagnosticCapsuleProps {
  template: LabelTemplate;
  onApplyTemplateFix: (updatedTemplate: LabelTemplate) => void;
  onSelectItem: (itemId: string) => void;
  isHeatmapActive: boolean;
  onToggleHeatmap: () => void;
}

export const FloatingDiagnosticCapsule: React.FC<FloatingDiagnosticCapsuleProps> = ({
  template,
  onApplyTemplateFix,
  onSelectItem,
  isHeatmapActive,
  onToggleHeatmap,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const issues = analyzeLayoutIssues(template);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const totalLabelArea = Math.max(1, template.width_mm * template.height_mm);
  const totalItemArea = (template.items || []).reduce((acc, item) => acc + item.w_mm * item.h_mm, 0);
  const densityPct = Math.min(100, Math.round((totalItemArea / totalLabelArea) * 100));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFixAll = () => {
    const updated = autoFixAllLayoutIssues(template);
    onApplyTemplateFix(updated);
  };

  const handleFixSingle = (issue: LayoutIssue) => {
    if (issue.applyFix) {
      const updated = issue.applyFix(template);
      onApplyTemplateFix(updated);
    }
  };

  return (
    <div ref={popoverRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none">
      {/* Floating Status Capsule Pill */}
      <div className="flex items-center gap-1.5 bg-[var(--surface-panel)] text-[var(--content-primary)] backdrop-blur-md border border-[var(--border-subtle)] rounded-full shadow-xl px-3 py-1 text-xs transition-all hover:bg-[var(--surface-raised)]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 font-medium hover:text-[var(--action-primary)] transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none rounded-full"
        >
          {errorCount > 0 ? (
            <div className="flex items-center gap-1 text-red-400 font-bold tabular-nums">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>{errorCount} {errorCount > 1 ? 'Erreurs' : 'Erreur'}</span>
            </div>
          ) : warningCount > 0 ? (
            <div className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warningCount} {warningCount > 1 ? 'Alertes' : 'Alerte'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gabarit Conforme</span>
            </div>
          )}

          <span className="text-[var(--content-muted)] text-[11px] font-mono tabular-nums">({densityPct}% densité)</span>
          <ChevronDown className={`w-3 h-3 text-[var(--content-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-1" />

        {/* Heatmap Fast Toggle */}
        <ContextTooltip
          title={isHeatmapActive ? 'Désactiver Heatmap' : 'Activer Heatmap Visuelle'}
          content="Affiche le calque néon d'analyse des collisions, marges et densités directement sur le canevas"
          category="Diagnostic"
        >
          <button
            onClick={onToggleHeatmap}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              isHeatmapActive
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-[var(--surface-raised)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Heatmap</span>
          </button>
        </ContextTooltip>

        {issues.length > 0 && (
          <ContextTooltip title="Auto-Correction Rapide" content="Résout instantanément tous les problèmes détectés" category="Assistance">
            <button
              onClick={handleFixAll}
              className="px-2 py-0.5 bg-[var(--action-primary)] hover:bg-[var(--action-hover)] text-[var(--action-primary-fg)] rounded-full text-[10px] font-bold flex items-center gap-1 transition shadow-xs ml-0.5 focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span>Corriger Tout</span>
            </button>
          </ContextTooltip>
        )}
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="mt-2 w-96 bg-[var(--surface-panel)] text-[var(--content-primary)] backdrop-blur-md rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[70vh]">
          {/* Popover Header */}
          <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--action-primary)]" />
              <span className="font-bold text-xs text-[var(--content-primary)] uppercase tracking-wider">
                Diagnostics de Disposition
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--content-muted)] hover:text-[var(--content-primary)] p-1 rounded-md transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Density bar */}
          <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/50">
            <div className="flex justify-between items-center text-xs mb-1 font-medium text-[var(--content-secondary)]">
              <span>Densité d'Occupation</span>
              <span className="font-bold text-[var(--content-primary)] font-mono tabular-nums">{densityPct}%</span>
            </div>
            <div className="w-full bg-[var(--surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className={`h-full transition-all duration-300 ${
                  densityPct > 85 ? 'bg-amber-500' : densityPct > 95 ? 'bg-red-500' : 'bg-[var(--action-primary)]'
                }`}
                style={{ width: `${densityPct}%` }}
              />
            </div>
          </div>

          {/* Issue list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {issues.length === 0 ? (
              <div className="text-center py-6 text-[var(--content-muted)] space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto stroke-[1.5]" />
                <div className="font-bold text-[var(--content-primary)] text-xs">Mise en page optimale</div>
                <div className="text-[11px] text-[var(--content-secondary)]">
                  Aucune collision, débordement ou violation de marge détectée.
                </div>
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    issue.severity === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-xs leading-tight">{issue.message}</div>
                      {issue.fixDescription && (
                        <div className="text-[11px] opacity-80 mt-1 italic">
                          Action : {issue.fixDescription}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        onSelectItem(issue.itemId);
                        setIsOpen(false);
                      }}
                      className="text-[11px] text-[var(--content-secondary)] hover:text-[var(--action-primary)] flex items-center gap-1 font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none rounded"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Cibler</span>
                    </button>

                    {issue.autoFixAvailable && (
                      <button
                        onClick={() => handleFixSingle(issue)}
                        className="px-2 py-0.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--action-primary)] border border-[var(--border-subtle)] rounded font-semibold text-[11px] flex items-center gap-1 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Corriger</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Footer */}
          {issues.length > 0 && (
            <div className="p-3 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] flex justify-end">
              <button
                onClick={handleFixAll}
                className="w-full py-2 bg-[var(--action-primary)] hover:bg-[var(--action-hover)] text-[var(--action-primary-fg)] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Corriger Tout ({issues.length} défauts)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
