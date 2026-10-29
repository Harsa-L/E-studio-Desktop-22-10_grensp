import React from 'react';
import { AppView, LabelTemplate } from '../types';
import {
  LayoutDashboard,
  Layers,
  Printer,
  ChevronRight,
  Settings2,
  BookOpen,
  Type,
  History,
  FileSpreadsheet,
  Keyboard,
  FilePlus2,
  FolderOpen,
  Save,
  SaveAll,
  Home,
  Bot,
  Languages,
  ExternalLink,
} from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../i18n/localization';

interface AppTopNavigationBarProps {
  currentView: AppView;
  activeTemplate: LabelTemplate | null;
  templates: LabelTemplate[];
  totalProductsCount: number;
  activeProjectName?: string;
  onNavigate: (view: AppView) => void;
  onOpenProjectFile: (file: File) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onOpenRulesModal: () => void;
  onOpenFontManager: () => void;
  onOpenAuditLogs: () => void;
  onOpenMappingDictionary: () => void;
  onOpenPreferences: () => void;
  onOpenShortcuts: () => void;
  onOpenMcpDrafts: () => void;
  onOpenInNewWindow: () => void;
  detachedWorkspacesSupported: boolean;
}

export const AppTopNavigationBar: React.FC<AppTopNavigationBarProps> = ({
  currentView,
  activeTemplate,
  templates,
  totalProductsCount,
  activeProjectName,
  onNavigate,
  onOpenProjectFile,
  onNewProject,
  onSaveProject,
  onSaveProjectAs,
  onOpenRulesModal,
  onOpenFontManager,
  onOpenAuditLogs,
  onOpenMappingDictionary,
  onOpenPreferences,
  onOpenShortcuts,
  onOpenMcpDrafts,
  onOpenInNewWindow,
  detachedWorkspacesSupported,
}) => {
  const { locale, setLocale, persistenceError, t } = useLocalization();
  const [toolsDropdownOpen, setToolsDropdownOpen] = React.useState(false);
  const [fileMenuOpen, setFileMenuOpen] = React.useState(false);
  const projectFileInput = React.useRef<HTMLInputElement>(null);

  // Global hotkeys Alt+1 .. Alt+4 & Escape for open menus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFileMenuOpen(false);
        setToolsDropdownOpen(false);
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          onNavigate('home');
        } else if (e.key === '2') {
          e.preventDefault();
          onNavigate('editor');
        } else if (e.key === '3') {
          e.preventDefault();
          onNavigate('generation');
        } else if (e.key === '4') {
          e.preventDefault();
          onNavigate('catalog');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <nav data-studio-shell className="bg-[var(--surface-panel)] text-[var(--content-primary)] border-b border-[var(--border-subtle)] shrink-0 select-none z-40 relative shadow-none">
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left Side: Brand Logo & Breadcrumb Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onNavigate('start')}
            className="flex items-center gap-2 text-left group hover:opacity-90 transition shrink-0 focus:outline-none"
            title={t('projectHome')}
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-[var(--content-primary)]">E-STUDIO</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[var(--action-primary-bg)]/20 text-[var(--action-primary-bg)] border border-[var(--action-primary-bg)]/30 uppercase tracking-widest">
                  DESKTOP
                </span>
              </div>
            </div>
          </button>

          <div className="relative">
            <button
              onClick={() => setFileMenuOpen((open) => !open)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition"
              aria-expanded={fileMenuOpen}
            >
              {t('file')}
            </button>
            {fileMenuOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Fermer le menu fichier" onClick={() => setFileMenuOpen(false)} />
                <div className="absolute left-0 top-9 z-50 w-60 rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-1.5 shadow-2xl text-[var(--content-primary)]">
                  {activeProjectName && <div className="truncate px-3 py-2 text-[11px] font-semibold text-[var(--content-muted)]">{activeProjectName}</div>}
                  <button onClick={() => { setFileMenuOpen(false); onNavigate('start'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]"><Home className="h-3.5 w-3.5" />{t('projectHome')}</button>
                  <button onClick={() => { setFileMenuOpen(false); onNewProject(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]"><FilePlus2 className="h-3.5 w-3.5" />{t('newProject')}</button>
                  <button onClick={() => { setFileMenuOpen(false); projectFileInput.current?.click(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]"><FolderOpen className="h-3.5 w-3.5" />{t('openProject')}</button>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <button disabled={!activeProjectName} onClick={() => { setFileMenuOpen(false); onSaveProject(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] disabled:opacity-40"><Save className="h-3.5 w-3.5" />{t('saveProject')}</button>
                  <button disabled={!activeProjectName} onClick={() => { setFileMenuOpen(false); onSaveProjectAs(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] disabled:opacity-40"><SaveAll className="h-3.5 w-3.5" />{t('saveProjectAs')}</button>
                </div>
              </>
            )}
          </div>

          {/* Breadcrumb Separator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--content-muted)] min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-[var(--content-muted)] shrink-0" />
            {currentView === 'home' && (
              <span className="font-semibold text-[var(--content-primary)]">{t('dashboard')}</span>
            )}

            {currentView === 'editor' && (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[var(--action-primary-bg)] transition truncate"
                >
                  {t('templates')}
                </button>
                <ChevronRight className="w-3 h-3 text-[var(--content-muted)] shrink-0" />
                <span className="font-semibold text-[var(--action-primary-bg)] truncate max-w-[140px] sm:max-w-[200px]">
                  {activeTemplate ? activeTemplate.name : t('visualDesigner')}
                </span>
              </>
            )}

            {currentView === 'generation' && (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[var(--action-primary-bg)] transition truncate"
                >
                  {t('production')}
                </button>
                <ChevronRight className="w-3 h-3 text-[var(--content-muted)] shrink-0" />
                <span className="font-semibold text-[var(--action-primary-bg)] truncate max-w-[140px] sm:max-w-[200px]">
                  {activeTemplate ? activeTemplate.name : 'Planches & Impression'}
                </span>
              </>
            )}

            {currentView === 'catalog' && (
              <span className="font-semibold text-emerald-400">{t('catalog')}</span>
            )}
          </div>
        </div>

        {currentView !== 'start' && (
          <>
        {/* Center: Module View Switcher */}
        <div className="flex h-12 items-stretch border-x border-[var(--border-subtle)]">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              currentView === 'home'
                ? 'border-[var(--action-primary-bg)] bg-[var(--surface-raised)] text-[var(--content-primary)]'
                : 'border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title={`${t('projectHome')} (Alt+1)`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t('dashboard')}</span>
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className={`px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              currentView === 'editor'
                ? 'border-[var(--action-primary-bg)] bg-[var(--surface-raised)] text-[var(--content-primary)]'
                : 'border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Concepteur Visuel de Gabarit (Alt+2)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Éditeur Gabarit</span>
          </button>

          <button
            onClick={() => onNavigate('generation')}
            className={`px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              currentView === 'generation'
                ? 'border-[var(--action-primary-bg)] bg-[var(--surface-raised)] text-[var(--content-primary)]'
                : 'border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Impression & Planches (Alt+3)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Production & Planche</span>
          </button>

          <button
            onClick={() => onNavigate('catalog')}
            className={`px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              currentView === 'catalog'
                ? 'border-emerald-500 bg-[var(--surface-raised)] text-[var(--content-primary)]'
                : 'border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Catalogue & Import Excel/CSV (Alt+4)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Catalogue</span>
            {totalProductsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                {totalProductsCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: Tools Dropdown Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {detachedWorkspacesSupported && (
            <button
              onClick={onOpenInNewWindow}
              className="p-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-md border border-[var(--border-subtle)] transition"
              title="Open this workspace in a new window"
              aria-label="Open this workspace in a new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg border border-[var(--border-subtle)] transition"
            title={t('keyboardShortcuts')}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={toolsDropdownOpen}
              aria-label={t('systemTools')}
              className="p-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg border border-[var(--border-subtle)] transition focus:outline-none"
              title={t('systemTools')}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {toolsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setToolsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-[var(--surface-panel)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-[var(--border-subtle)] text-[var(--content-primary)] animate-in fade-in-50 duration-100">
                  <label className="block px-2 pb-2">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--content-muted)]">
                      <Languages className="h-3.5 w-3.5" />{t('language')}
                    </span>
                    <select
                      value={locale}
                      onChange={(event) => setLocale(event.target.value as typeof locale)}
                      className="w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-input)] px-2 py-1.5 text-xs text-[var(--content-primary)]"
                    >
                      {SUPPORTED_LOCALES.map((code) => (
                        <option key={code} value={code}>
                          {LOCALE_LABELS[code]}
                        </option>
                      ))}
                    </select>
                    {persistenceError && <span role="alert" className="mt-1 block text-[10px] text-amber-300">{persistenceError}</span>}
                  </label>
                  <div className="pb-1.5">
                    <span className="px-2 py-1 text-[10px] font-bold text-[var(--content-muted)] uppercase tracking-wider block">
                      {t('dataAndDisplay')}
                    </span>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenMcpDrafts();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('aiDrafts')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenMappingDictionary();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('mappingDictionary')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenRulesModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t('omnichannelRules')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenFontManager();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('fonts')}</span>
                    </button>
                  </div>

                  <div className="pt-1.5">
                    <span className="px-2 py-1 text-[10px] font-bold text-[var(--content-muted)] uppercase tracking-wider block">
                      {t('securityAndAudit')}
                    </span>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenAuditLogs();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('auditLog')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenPreferences();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg flex items-center gap-2 transition"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
                      <span>{t('preferences')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
          </>
        )}
      </div>
      <input ref={projectFileInput} type="file" accept=".eproj,.zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onOpenProjectFile(file); event.currentTarget.value = ''; }} />
    </nav>
  );
};
