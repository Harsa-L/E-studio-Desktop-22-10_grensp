import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TooltipProvider } from '../context/TooltipContext';
import { MappingDictionaryProvider } from '../context/MappingDictionaryContext';
import { AppProviders } from './providers/AppProviders';
import { AppTopNavigationBar } from '../components/AppTopNavigationBar';
import { HomeDashboard } from '../components/HomeDashboard';
import { TemplateEditor } from '../components/TemplateEditor';
import { GenerationWorkspace } from '../components/GenerationWorkspace';
import { CatalogManagementStudio } from '../components/CatalogManagementStudio';
import { OmniChannelStudioModal } from '../components/OmniChannelStudioModal';
import { NewGabaritWizard } from '../components/NewGabaritWizard';
import { AuditTrailModal } from '../components/AuditTrailModal';
import { FontManagerModal } from '../components/FontManagerModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { MappingDictionaryModal } from '../components/MappingDictionaryModal';
import { AccessibilityPreferencesModal } from '../components/AccessibilityPreferencesModal';
import { McpDraftReviewModal } from '../components/McpDraftReviewModal';
import { ProjectStartScreen } from '../components/ProjectStartScreen';
import { LabelProject, LabelTemplate, ProductRecord } from '../types';
import { catalogRepository } from '../services/catalogRepository';
import { navigationService, AppView } from '../services/navigationService';
import { AuditLogService } from '../services/auditLogService';
import { sanitizeNonPriceElement } from '../utils/pricingEngine';
import { api } from '../services/api';
import { projectFileService } from '../services/projectFileService';
import { desktopFileService } from '../services/desktopFileService';

function MainWorkspace() {
  const [currentView, setCurrentView] = useState<AppView>('start');
  // Project templates are loaded from the local project library on launch.
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(null);
  const [projects, setProjects] = useState<LabelProject[]>([]);
  const [activeProject, setActiveProject] = useState<LabelProject | null>(null);
  const [newProjectRequested, setNewProjectRequested] = useState(false);
  const [generationProducts, setGenerationProducts] = useState<ProductRecord[] | undefined>(undefined);
  const [generationBatchName, setGenerationBatchName] = useState<string | undefined>(undefined);

  // Catalog products count
  const [productsCount, setProductsCount] = useState<number>(() => catalogRepository.getProducts().length);

  // Modals state
  const [isNewWizardOpen, setIsNewWizardOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);
  const [isMappingDictOpen, setIsMappingDictOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isMcpDraftReviewOpen, setIsMcpDraftReviewOpen] = useState(false);
  const navigationInitialized = useRef(false);

  const makeProject = (name: string, templates: LabelTemplate[] = []): LabelProject => {
    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      name,
      created_at: now,
      updated_at: now,
      templates,
      data_sources: [],
    };
  };

  const loadProjects = useCallback(async () => {
    try {
      const projectList = await api.projectList();
      if (projectList.length > 0) {
        const recent = projectList[0];
        const opened = await api.projectSave({ ...recent, last_opened_at: new Date().toISOString() });
        const sortedProjects = [opened, ...projectList.slice(1)];
        setProjects(sortedProjects);
        setActiveProject(opened);
        setTemplates(opened.templates || []);
        setActiveTemplate(opened.templates?.[0] || null);
        return;
      }

      const summaries = await api.templateList();
      const legacyTemplates = (await Promise.all(
        summaries.map(async (summary) => {
          try {
            return await api.templateGet(summary.id);
          } catch {
            return null;
          }
        })
      )).filter((template): template is LabelTemplate => template !== null);
      if (legacyTemplates.length > 0) {
        const legacyProject = await api.projectSave(makeProject('Projet importé', legacyTemplates));
        setProjects([legacyProject]);
        setActiveProject(legacyProject);
        setTemplates(legacyTemplates);
        setActiveTemplate(legacyTemplates[0] || null);
      } else {
        setProjects([]);
        setActiveProject(null);
        setTemplates([]);
        setActiveTemplate(null);
      }
    } catch (err) {
      console.error('Failed to load the local project library', err);
    }
  }, []);

  const loadTemplates = async () => {
    try {
      const summaries = await api.templateList();
      const fullDocs = await Promise.all(
        summaries.map(async (s) => {
          try {
            return await api.templateGet(s.id);
          } catch {
            return null;
          }
        })
      );
      const validDocs = fullDocs.filter((d): d is LabelTemplate => d !== null);
      setTemplates(validDocs);
      if (validDocs.length > 0) {
        setActiveTemplate((prev) => prev || validDocs[0]);
      }
      if (activeProject && validDocs.length === 0 && activeProject.templates?.length) {
        setTemplates(activeProject.templates);
      }
    } catch (err) {
      console.warn('Failed to load templates from SQLite', err);
    }
  };

  // Load the local project library on launch.
  useEffect(() => {
    void loadProjects();
  }, []);

  // Subscribe to Navigation Service
  useEffect(() => {
    if (!navigationInitialized.current) {
      navigationInitialized.current = true;
      if (navigationService.getCurrentRoute().view === 'home') {
        navigationService.navigateTo('start', {}, true);
      }
    }
    const unsub = navigationService.subscribe((route) => {
      setCurrentView(route.view);
      const targetId = route.params.templateId || route.params.template;
      if (targetId) {
        const found = templates.find((t) => t.id === targetId || t.name === targetId);
        if (found) setActiveTemplate(found);
      }
    });
    return () => unsub();
  }, [templates]);

  // Subscribe to Catalog Repository changes
  useEffect(() => {
    const unsub = catalogRepository.subscribe((products) => {
      setProductsCount(products.length);
    });
    return () => unsub();
  }, []);

  // Navigation handlers
  const handleNavigate = (view: AppView, params: Record<string, string> = {}) => {
    navigationService.navigateTo(view, params);
  };

  const handleSelectTemplateToEdit = (template: LabelTemplate) => {
    setActiveTemplate(template);
    navigationService.navigateTo('editor', { template: template.id });
  };

  const handleSelectTemplateToGenerate = (
    template: LabelTemplate,
    customProducts?: ProductRecord[],
    batchName?: string
  ) => {
    setActiveTemplate(template);
    setGenerationProducts(customProducts);
    setGenerationBatchName(batchName);
    navigationService.navigateTo('generation', { template: template.id });
  };

  const syncProjectSnapshot = useCallback(async (nextTemplates: LabelTemplate[] = templates) => {
    if (!activeProject) return;
    const nextProject: LabelProject = {
      ...activeProject,
      templates: nextTemplates,
    };
    const savedProject = await api.projectSave(nextProject);
    setActiveProject(savedProject);
    setProjects((prev) => {
      const existingIndex = prev.findIndex((project) => project.id === savedProject.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = savedProject;
        return next;
      }
      return [savedProject, ...prev];
    });
  }, [activeProject, templates]);

  const handleStartNewProject = () => {
    setNewProjectRequested(true);
    navigationService.navigateTo('start');
  };

  const handleCreateProject = async (name: string) => {
    const newProject = { ...makeProject(name), last_opened_at: new Date().toISOString() };
    const saved = await api.projectSave(newProject);
    setProjects((prev) => [saved, ...prev]);
    setActiveProject(saved);
    setTemplates(saved.templates || []);
    setActiveTemplate(null);
    navigationService.navigateTo('home');
  };

  const handleOpenProject = async (project: LabelProject) => {
    const storedProject = await api.projectGet(project.id);
    const loadedProject = await api.projectSave({ ...storedProject, last_opened_at: new Date().toISOString() });
    setActiveProject(loadedProject);
    setProjects((prev) => [loadedProject, ...prev.filter((item) => item.id !== loadedProject.id)]);
    const nextTemplates = loadedProject.templates || [];
    setTemplates(nextTemplates);
    setActiveTemplate(nextTemplates[0] || null);
    navigationService.navigateTo('home');
  };

  const handleRenameProject = async (projectId: string, nextName: string) => {
    const target = projects.find((project) => project.id === projectId);
    if (!target) return;
    const name = nextName.trim();
    if (!name) return;
    const updated = { ...target, name };
    const saved = await api.projectSave(updated);
    setProjects((prev) => prev.map((project) => (project.id === saved.id ? saved : project)));
    if (activeProject?.id === saved.id) setActiveProject(saved);
  };

  const handleDuplicateProject = async (project: LabelProject) => {
    const copyName = `${project.name} - Copie`;
    const duplicated = {
      ...makeProject(copyName),
      last_opened_at: new Date().toISOString(),
      templates: JSON.parse(JSON.stringify(project.templates || [])) as LabelTemplate[],
      data_sources: JSON.parse(JSON.stringify(project.data_sources || [])),
    };
    const saved = await api.projectSave(duplicated);
    setProjects((prev) => [saved, ...prev]);
    setActiveProject(saved);
    setTemplates(saved.templates || []);
    setActiveTemplate((saved.templates || [])[0] || null);
    navigationService.navigateTo('home');
  };

  const handleDeleteProject = async (projectId: string) => {
    const target = projects.find((project) => project.id === projectId);
    if (!target) return;
    await api.projectDelete(projectId);
    const remaining = projects.filter((project) => project.id !== projectId);
    setProjects(remaining);
    if (activeProject?.id === projectId) {
      const fallback = remaining[0] || null;
      setActiveProject(fallback);
      setTemplates(fallback?.templates || []);
      setActiveTemplate(fallback?.templates?.[0] || null);
      if (!fallback) navigationService.navigateTo('start');
    }
  };

  const handleSaveProject = async () => {
    await syncProjectSnapshot(templates);
  };

  const handleSaveProjectArchive = async (project: LabelProject, format: 'eproj' | 'zip' = 'eproj') => {
    const safeName = (project.name || 'projet').trim().replace(/[^a-z0-9-_]+/gi, '_').toLowerCase() || 'projet';
    const password = window.prompt(`Mot de passe optionnel pour .${format} (8+ caractères, vide = non chiffré)`, '');
    if (password === null) return;
    const snapshot = {
      ...project,
      templates: project.id === activeProject?.id ? templates : project.templates,
    };
    if (format === 'zip') {
      const contents = await projectFileService.exportZip(snapshot, password.trim() ? password.trim() : undefined);
      await desktopFileService.saveBinary(`${safeName}.zip`, contents, [
        { name: 'Archive de projet E-Studio', extensions: ['zip'] },
      ]);
    } else {
      const contents = await projectFileService.exportEproj(snapshot, password.trim() ? password.trim() : undefined);
      await desktopFileService.saveText(`${safeName}.eproj`, contents, [
        { name: 'Projet E-Studio', extensions: ['eproj'] },
      ]);
    }
  };

  const handleImportProjectArchive = async (file: File) => {
    const password = window.prompt('Mot de passe du projet si chiffré', '');
    if (password === null) return;
    const trimmedPassword = password && password.trim() ? password.trim() : undefined;
    const content = new Uint8Array(await file.arrayBuffer());
    const imported = file.name.toLowerCase().endsWith('.zip')
      ? await projectFileService.importZip(content, trimmedPassword)
      : await projectFileService.importEproj(new TextDecoder().decode(content), trimmedPassword);
    const projectToSave = projects.some((project) => project.id === imported.id)
      ? {
          ...imported,
          id: makeProject(imported.name).id,
          name: `${imported.name} - Copie`,
        }
      : imported;
    const saved = await api.projectSave({ ...projectToSave, last_opened_at: new Date().toISOString() });
    setProjects((prev) => [saved, ...prev.filter((project) => project.id !== saved.id)]);
    setActiveProject(saved);
    setTemplates(saved.templates || []);
    setActiveTemplate((saved.templates || [])[0] || null);
    navigationService.navigateTo('home');
  };

  const runProjectAction = (action: () => Promise<unknown>) => {
    void action().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Project operation failed', error);
      window.alert(`Project operation failed: ${message}`);
    });
  };

  const handleSaveTemplate = async (updated: LabelTemplate) => {
    const now = new Date().toISOString();
    const sanitized: LabelTemplate = {
      ...updated,
      id: updated.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`),
      revision: (updated.revision || 0) + 1,
      created_at: updated.created_at || now,
      updated_at: now,
      items: (updated.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    const savedDoc = await api.templateSave(sanitized);
    const nextTemplates = (() => {
      const existingIndex = templates.findIndex((t) => t.id === savedDoc.id);
      if (existingIndex >= 0) {
        const next = [...templates];
        next[existingIndex] = savedDoc;
        return next;
      }
      return [savedDoc, ...templates];
    })();
    setTemplates(nextTemplates);
    setActiveTemplate(savedDoc);
    await syncProjectSnapshot(nextTemplates);
    AuditLogService.append({
      action: 'MODIFICATION_GABARIT',
      template_name: savedDoc.name,
      details: `Gabarit sauvegardé : ${savedDoc.name} (Rev ${savedDoc.revision}, ${savedDoc.items.length} éléments)`,
    });
  };

  const handleDuplicateTemplate = async (template: LabelTemplate) => {
    const copyId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const copyName = `${template.name} - Copie`;
    const now = new Date().toISOString();
    const duplicated: LabelTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      id: copyId,
      name: copyName,
      revision: 1,
      created_at: now,
      updated_at: now,
      items: JSON.parse(JSON.stringify(template.items || [])).map((it: any) => sanitizeNonPriceElement(it)),
    };
    try {
      const savedDoc = await api.templateSave(duplicated);
      const nextTemplates = [savedDoc, ...templates];
      setTemplates(nextTemplates);
      setActiveTemplate(savedDoc);
      await syncProjectSnapshot(nextTemplates);
      AuditLogService.append({
        action: 'DUPLICATION_GABARIT',
        template_name: copyName,
        details: `Gabarit dupliqué depuis : ${template.name} (${template.id})`,
      });
    } catch (err) {
      console.error('Failed to duplicate template in SQLite', err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const toDelete = templates.find((t) => t.id === templateId || t.name === templateId);
    const realId = toDelete?.id || templateId;
    try {
      await api.templateDelete(realId);
      const nextTemplates = templates.filter((t) => t.id !== realId && t.name !== realId);
      setTemplates(nextTemplates);
      if (activeTemplate?.id === realId || activeTemplate?.name === realId) {
        setActiveTemplate(nextTemplates[0] || null);
      }
      await syncProjectSnapshot(nextTemplates);
      AuditLogService.append({
        action: 'SUPPRESSION_GABARIT',
        template_name: toDelete?.name || templateId,
        details: `Gabarit supprimé : ${toDelete?.name || templateId}`,
      });
    } catch (err) {
      console.error('Failed to delete template from SQLite', err);
    }
  };

  const handleImportTemplate = async (imported: LabelTemplate): Promise<LabelTemplate> => {
    const now = new Date().toISOString();
    const sanitized: LabelTemplate = {
      ...imported,
      id: imported.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`),
      revision: imported.revision || 1,
      created_at: imported.created_at || now,
      updated_at: now,
      items: (imported.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    try {
      const savedDoc = await api.templateSave(sanitized);
      const nextTemplates = [savedDoc, ...templates.filter((t) => t.id !== savedDoc.id)];
      setTemplates(nextTemplates);
      setActiveTemplate(savedDoc);
      await syncProjectSnapshot(nextTemplates);
      AuditLogService.append({
        action: 'IMPORT_GABARIT',
        template_name: savedDoc.name,
        details: `Gabarit importé : ${savedDoc.name} (${savedDoc.id})`,
      });
      return savedDoc;
    } catch (err) {
      console.error('Failed to import template into SQLite', err);
      throw err;
    }
  };

  const handleCreateNewTemplate = async (newTemplate: LabelTemplate) => {
    const now = new Date().toISOString();
    const sanitized: LabelTemplate = {
      ...newTemplate,
      id: newTemplate.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`),
      revision: 1,
      created_at: newTemplate.created_at || now,
      updated_at: now,
      items: (newTemplate.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    try {
      const savedDoc = await api.templateSave(sanitized);
      const nextTemplates = [savedDoc, ...templates];
      setTemplates(nextTemplates);
      setActiveTemplate(savedDoc);
      await syncProjectSnapshot(nextTemplates);
      setIsNewWizardOpen(false);
      navigationService.navigateTo('editor', { template: savedDoc.id });
      AuditLogService.append({
        action: 'CREATION_GABARIT',
        template_name: savedDoc.name,
        details: `Nouveau gabarit créé : ${savedDoc.name} (${savedDoc.width_mm}x${savedDoc.height_mm}mm)`,
      });
    } catch (err) {
      console.error('Failed to create template in SQLite', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <AppTopNavigationBar
        currentView={currentView}
        activeTemplate={activeTemplate}
        templates={templates}
        totalProductsCount={productsCount}
        activeProjectName={activeProject?.name}
        onNavigate={handleNavigate}
        onOpenProjectFile={(file) => runProjectAction(() => handleImportProjectArchive(file))}
        onNewProject={handleStartNewProject}
        onSaveProject={() => runProjectAction(handleSaveProject)}
        onSaveProjectAs={() => activeProject && runProjectAction(() => handleSaveProjectArchive(activeProject))}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenFontManager={() => setIsFontManagerOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenMappingDictionary={() => setIsMappingDictOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenMcpDrafts={() => setIsMcpDraftReviewOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {currentView === 'start' && (
          <ProjectStartScreen
            projects={projects}
            newProjectRequested={newProjectRequested}
            onNewProjectRequestHandled={() => setNewProjectRequested(false)}
            onCreateProject={(name) => runProjectAction(() => handleCreateProject(name))}
            onOpenProject={(project) => runProjectAction(() => handleOpenProject(project))}
            onOpenProjectFile={(file) => runProjectAction(() => handleImportProjectArchive(file))}
            onRenameProject={(projectId, name) => runProjectAction(() => handleRenameProject(projectId, name))}
            onDuplicateProject={(project) => runProjectAction(() => handleDuplicateProject(project))}
            onDeleteProject={(projectId) => runProjectAction(() => handleDeleteProject(projectId))}
            onExportProject={(project, format) => runProjectAction(() => handleSaveProjectArchive(project, format))}
          />
        )}

        {currentView === 'home' && (
          <HomeDashboard
            templates={templates}
            onSelectTemplateToEdit={handleSelectTemplateToEdit}
            onSelectTemplateToGenerate={(t) => handleSelectTemplateToGenerate(t)}
            onOpenNewWizard={() => setIsNewWizardOpen(true)}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onImportTemplate={handleImportTemplate}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
            onOpenFontManager={() => setIsFontManagerOpen(true)}
            onOpenMappingDictionary={() => setIsMappingDictOpen(true)}
            onOpenCatalog={() => handleNavigate('catalog')}
            onRefreshTemplates={loadTemplates}
          />
        )}

        {currentView === 'editor' && (
          <TemplateEditor
            initialTemplate={activeTemplate || {
              id: 'tpl_default_new',
              revision: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              schema_version: 1,
              name: 'Nouveau Gabarit',
              width_mm: 100,
              height_mm: 50,
              inner_margins_mm: { top: 2, bottom: 2, left: 2, right: 2 },
              outer_margins_mm: { top: 1, bottom: 1, left: 1, right: 1 },
              bg_color: '#FFFFFF',
              bg_opacity: 1,
              items: [],
            }}
            onSaveTemplate={handleSaveTemplate}
            onBackToHome={() => handleNavigate('home')}
            onOpenGeneration={(t) => handleSelectTemplateToGenerate(t)}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        )}

        {currentView === 'generation' && (
          <GenerationWorkspace
            template={activeTemplate || {
              id: 'tpl_default_std',
              revision: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              schema_version: 1,
              name: 'Gabarit Standard',
              width_mm: 100,
              height_mm: 50,
              inner_margins_mm: { top: 2, bottom: 2, left: 2, right: 2 },
              outer_margins_mm: { top: 1, bottom: 1, left: 1, right: 1 },
              bg_color: '#FFFFFF',
              bg_opacity: 1,
              items: [],
            }}
            onBack={() => handleNavigate('home')}
            initialProducts={generationProducts}
            initialBatchName={generationBatchName}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogManagementStudio
            onBack={() => handleNavigate('home')}
            templates={templates}
            onGenerateFromDatabase={(selectedItems) => {
              if (templates.length === 0) {
                handleNavigate('home');
                return;
              }
              const defaultTemplate = activeTemplate || templates[0];
              handleSelectTemplateToGenerate(defaultTemplate, selectedItems, 'Sélection Catalogue');
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <NewGabaritWizard
        isOpen={isNewWizardOpen}
        onClose={() => setIsNewWizardOpen(false)}
        onCreate={handleCreateNewTemplate}
      />

      <OmniChannelStudioModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        currentTemplateName={activeTemplate?.name}
      />

      <AuditTrailModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <FontManagerModal
        isOpen={isFontManagerOpen}
        onClose={() => setIsFontManagerOpen(false)}
      />

      <MappingDictionaryModal
        isOpen={isMappingDictOpen}
        onClose={() => setIsMappingDictOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AccessibilityPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      <McpDraftReviewModal
        isOpen={isMcpDraftReviewOpen}
        onClose={() => setIsMcpDraftReviewOpen(false)}
        onApprove={async (draft) => {
          const saved = await handleImportTemplate(draft);
          navigationService.navigateTo('editor', { template: saved.id });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <TooltipProvider>
        <MappingDictionaryProvider>
          <MainWorkspace />
        </MappingDictionaryProvider>
      </TooltipProvider>
    </AppProviders>
  );
}
