import React, { useState } from 'react';
import { LabelTemplate } from '../types';
import { LabelRenderer } from './LabelRenderer';
import {
  Plus,
  Printer,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  Search,
  Tag,
  BookOpen,
  FileSpreadsheet,
  Cpu,
  Database,
  History,
  FileCode2,
} from 'lucide-react';
import { desktopFileService } from '../services/desktopFileService';
import { PrintJobHistoryModal } from './PrintJobHistoryModal';
import { PreFlightEngine } from '../utils/preFlightEngine';
import { api } from '../services/api';
import { ZplSourceWorkbench } from './ZplSourceWorkbench';
import { useLocalization } from '../context/LocalizationContext';
import { translateDashboardAction } from '../i18n/localization';

interface HomeDashboardProps {
  templates: LabelTemplate[];
  onSelectTemplateToEdit: (template: LabelTemplate) => void;
  onSelectTemplateToGenerate: (template: LabelTemplate) => void;
  onOpenNewWizard: () => void;
  onDuplicateTemplate: (template: LabelTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onImportTemplate: (template: LabelTemplate) => Promise<LabelTemplate>;
  onOpenRulesModal: () => void;
  onOpenAuditLogs?: () => void;
  onOpenFontManager?: () => void;
  onOpenMappingDictionary?: () => void;
  onOpenCatalog?: () => void;
  onRefreshTemplates?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  templates,
  onSelectTemplateToEdit,
  onSelectTemplateToGenerate,
  onOpenNewWizard,
  onDuplicateTemplate,
  onDeleteTemplate,
  onImportTemplate,
  onOpenRulesModal,
  onOpenAuditLogs,
  onOpenFontManager,
  onOpenMappingDictionary,
  onOpenCatalog,
  onRefreshTemplates,
}) => {
  const { t, locale } = useLocalization();
  const dashboardText = (key: Parameters<typeof translateDashboardAction>[1]) =>
    translateDashboardAction(locale, key);
  const [searchTerm, setSearchTerm] = useState('');
  const [devTestResult, setDevTestResult] = useState<string | null>(null);
  const [dbOpMessage, setDbOpMessage] = useState<string | null>(null);

  const handleBackupDatabase = async () => {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        const defaultFilename = `estudio_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
        const path = await desktopFileService.saveBinary(
          defaultFilename,
          new Uint8Array(0),
          [{ name: 'Base SQLite E-Studio', extensions: ['sqlite', 'db'] }]
        );
        if (path) {
          await api.backupDb(path);
          setDbOpMessage(`Base SQLite sauvegardée vers ${path} (base locale non chiffrée).`);
          return;
        }
      }
      const dump = await api.exportDatabase();
      const filename = `estudio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      await desktopFileService.saveText(filename, dump, [
        { name: 'Sauvegarde E-Studio (JSON)', extensions: ['json'] },
      ]);
      setDbOpMessage('Base sauvegardée avec succès (base locale non chiffrée).');
    } catch (err: any) {
      setDbOpMessage(`Erreur de sauvegarde: ${err?.message || String(err)}`);
    }
  };

  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri && file.name.endsWith('.sqlite')) {
        setDbOpMessage('Pour restaurer un fichier binaire .sqlite natif, placez-le dans le répertoire utilisateur ou relancez l\'application.');
        return;
      }
      const text = await file.text();
      const count = await api.importDatabase(text);
      setDbOpMessage(`Restauration terminée : ${count} éléments importés dans la base SQLite locale.`);
      if (onRefreshTemplates) onRefreshTemplates();
    } catch (err: any) {
      setDbOpMessage(`Échec de la restauration : ${err?.message || String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleDevTestSQLite = async () => {
    try {
      const sampleDoc: LabelTemplate = {
        id: `tpl_dev_${Date.now()}`,
        name: 'Gabarit Test IPC SQLite',
        revision: 1,
        schema_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        width_mm: 80,
        height_mm: 40,
        inner_margins_mm: { top: 2, bottom: 2, left: 2, right: 2 },
        outer_margins_mm: { top: 1, bottom: 1, left: 1, right: 1 },
        bg_color: '#FFFFFF',
        bg_opacity: 1,
        items: [],
      };

      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        const saved = await invoke<LabelTemplate>('template_save', { doc: sampleDoc });
        const retrieved = await invoke<LabelTemplate>('template_get', { id: saved.id });
        setDevTestResult(`✅ SQLite vérifié (Tauri IPC): ${retrieved.name} [id=${retrieved.id}, rev=${retrieved.revision}]`);
      } else {
        setDevTestResult(`ℹ️ SQLite Tauri prêt: commandes 'template_save' & 'template_get' configurées`);
      }
    } catch (err: any) {
      setDevTestResult(`❌ Erreur SQLite: ${err?.message || String(err)}`);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [importError, setImportError] = useState<string | null>(null);
  const [showJobHistory, setShowJobHistory] = useState(false);
  const [showZplWorkbench, setShowZplWorkbench] = useState(false);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setImportError(null);
      const isZpl = file.name.toLowerCase().endsWith('.zpl') || file.name.toLowerCase().endsWith('.txt');
      if (isZpl) {
        setShowZplWorkbench(true);
        return;
      }
      const rawText = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        setShowZplWorkbench(true);
        return;
      }

      const candidateList: any[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of candidateList) {
        if (item && typeof item === 'object' && typeof item.name === 'string') {
          const docToImport: LabelTemplate = {
            id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            revision: Number(item.revision) || 1,
            schema_version: Number(item.schema_version) || 1,
            name: item.name || 'Gabarit Importé',
            width_mm: Number(item.width_mm) || 80,
            height_mm: Number(item.height_mm) || 40,
            inner_margins_mm: item.inner_margins_mm || { top: 2, bottom: 2, left: 2, right: 2 },
            outer_margins_mm: item.outer_margins_mm || { top: 1, bottom: 1, left: 1, right: 1 },
            bg_color: item.bg_color || '#FFFFFF',
            bg_opacity: item.bg_opacity ?? 1,
            items: Array.isArray(item.items) ? item.items : [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await onImportTemplate(docToImport);
        }
      }
    } catch (error) {
      setImportError(`Import impossible : ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExportTemplate = async (template: LabelTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const filename = `gabarit_${template.name.replace(/\s+/g, '_')}.json`;
    await desktopFileService.saveText(filename, dataStr, [
      { name: 'Gabarit E-Studio', extensions: ['json'] },
    ]);
  };

  return (
    <div data-studio-workspace="library" className="flex-1 flex flex-col bg-[var(--surface-app)] text-[var(--content-primary)] overflow-y-auto font-sans select-none">
      {/* Top Welcome Banner */}
      <div className="bg-[var(--surface-panel)] border-b border-[var(--border-subtle)] py-6 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--action-primary-bg)] mb-1 font-semibold text-xs uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>{t('productLine')}</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--content-primary)] tracking-tight">
              E-Studio Desktop
            </h1>
            <p className="text-xs text-[var(--content-muted)] mt-1 max-w-xl">
              {locale === 'fr'
                ? 'Conception vectorielle en millimètres réels, résolution locale de catalogue Excel/CSV, validation pré-presse déterministe et imposition sur planches.'
                : 'Design labels in real millimeters, work with local Excel/CSV catalogs, run deterministic preflight checks, and impose print sheets.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowZplWorkbench(true)}
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
              title={dashboardText('zplWorkbench')}
            >
              <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{dashboardText('zplWorkbench')}</span>
            </button>
            <button
              onClick={onOpenCatalog}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{dashboardText('catalogImport')}</span>
            </button>

            <button
              onClick={() => setShowJobHistory(true)}
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
              title={dashboardText('printHistory')}
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>{dashboardText('printHistory')}</span>
            </button>

            <button
              onClick={onOpenMappingDictionary}
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
              <span>Mapping</span>
            </button>

            <button
              onClick={onOpenRulesModal}
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Règles d'Affichage</span>
            </button>

            <button
              onClick={onOpenNewWizard}
              className="px-4 py-2 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createTemplate')}</span>
            </button>

            <label className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
              <span>{t('importTemplates')}</span>
              <input type="file" accept=".json,.zpl,.txt,application/json,text/plain" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={handleBackupDatabase}
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
              title={dashboardText('unencryptedDatabase')}
            >
              <Download className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
              <span>{dashboardText('databaseBackup')}</span>
            </button>

            <label
              className="px-3 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              title="Restaurer la base SQLite (JSON ou SQLite)"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
              <span>{dashboardText('databaseRestore')}</span>
              <input
                type="file"
                accept=".json,.sqlite,.db"
                onChange={handleRestoreDatabase}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDevTestSQLite}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Dev-only: Test SQLite template_save et template_get"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dev: Test SQLite</span>
            </button>
          </div>
        </div>

        {importError && (
          <div className="mx-8 mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-300" role="status">
            {importError}
          </div>
        )}

        {dbOpMessage && (
          <div className="mt-4 bg-[var(--surface-panel)] border border-[var(--action-primary-bg)]/50 text-[var(--content-primary)] text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md">
            <span>{dbOpMessage}</span>
            <button
              onClick={() => setDbOpMessage(null)}
              className="text-[var(--content-muted)] hover:text-[var(--content-primary)] font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {devTestResult && (
          <div className="mt-4 bg-[var(--surface-panel)] border border-amber-500/50 text-amber-300 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md">
            <span>{devTestResult}</span>
            <button
              onClick={() => setDevTestResult(null)}
              className="text-[var(--content-muted)] hover:text-[var(--content-primary)] font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-8 flex-1 flex flex-col space-y-6">
        {/* Search & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--content-primary)]">
              {t('savedTemplates')}
            </h2>
            <span className="bg-[var(--surface-raised)] text-[var(--content-secondary)] font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
              {filteredTemplates.length}
            </span>
          </div>

          {templates.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--content-muted)]" />
              <input
                type="text"
                placeholder={t('searchTemplates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--surface-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--content-primary)] placeholder-[var(--content-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
          )}
        </div>

        {/* Empty State or Templates Grid */}
        {templates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--surface-panel)] border border-dashed border-[var(--border-default)] rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--action-primary-bg)]/10 border border-[var(--action-primary-bg)]/30 flex items-center justify-center text-[var(--action-primary-bg)] mb-4">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-1">{t('noTemplates')}</h3>
            <p className="text-xs text-[var(--content-muted)] max-w-md mb-6">
              L'espace de travail est prêt. Créez votre premier gabarit d'étiquette sur-mesure (prix, promo, code-barres) ou importez un modèle existant.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenNewWizard}
                className="px-4 py-2 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t('createTemplate')}</span>
              </button>
              <label className="px-4 py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--content-primary)] border border-[var(--border-default)] rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-2xs">
                <Upload className="w-4 h-4 text-[var(--action-primary-bg)]" />
                <span>{t('importTemplates')}</span>
                <input type="file" accept=".json,.zpl,.txt,application/json,text/plain" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--surface-panel)] border border-dashed border-[var(--border-default)] rounded-2xl text-center">
            <Search className="w-8 h-8 text-[var(--content-muted)] mb-2" />
            <p className="text-xs text-[var(--content-muted)]">Aucun gabarit ne correspond à votre recherche "{searchTerm}".</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-xs text-[var(--action-primary-bg)] hover:underline font-semibold"
            >
              Effacer le filtre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-sm text-[var(--content-primary)] group-hover:text-[var(--action-primary-bg)] transition-colors truncate">
                      {template.name}
                    </h3>
                  </div>

                  {/* Dimensions & Computed Status */}
                  <div className="flex items-center justify-between mb-4 text-[11px] font-mono text-[var(--content-muted)]">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
                      {template.width_mm} × {template.height_mm} mm
                    </span>
                    <div className="flex items-center gap-1.5 font-sans">
                      {(() => {
                        const status = PreFlightEngine.computeTemplateStatus(template);
                        if (status === 'ready') {
                          return <span className="text-emerald-400 font-semibold text-[11px]">● {t('ready')}</span>;
                        }
                        if (status === 'warning') {
                          return <span className="text-amber-400 font-semibold text-[11px]">● {t('review')}</span>;
                        }
                        return <span className="text-[var(--content-muted)] font-semibold text-[11px]">● {t('draft')}</span>;
                      })()}
                    </div>
                  </div>

                  {/* Mini Preview Box */}
                  <div className="h-32 bg-[var(--canvas-pasteboard)] border border-[var(--border-subtle)] rounded-xl p-2 flex items-center justify-center overflow-hidden mb-4 relative">
                    <div className="scale-75 origin-center pointer-events-none">
                      <LabelRenderer template={template} scale={0.7} />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateTemplate(template)}
                      className="p-1.5 text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition"
                      title={t('duplicateTemplate')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExportTemplate(template)}
                      className="p-1.5 text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition"
                      title={t('exportJson')}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le gabarit "${template.name}" ?`)) {
                          onDeleteTemplate(template.id);
                        }
                      }}
                      className="p-1.5 text-[var(--content-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title={t('deleteTemplate')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectTemplateToEdit(template)}
                      className="px-2.5 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--content-primary)] text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow-2xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{t('edit')}</span>
                    </button>
                    <button
                      onClick={() => onSelectTemplateToGenerate(template)}
                      className="px-2.5 py-1.5 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>{t('printSheet')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PrintJobHistoryModal
        isOpen={showJobHistory}
        onClose={() => setShowJobHistory(false)}
      />
      <ZplSourceWorkbench isOpen={showZplWorkbench} onClose={() => setShowZplWorkbench(false)} />
    </div>
  );
};
