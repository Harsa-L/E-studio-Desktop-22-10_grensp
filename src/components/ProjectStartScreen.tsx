import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Copy,
  FilePlus2,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { LabelProject } from '../types';

interface ProjectStartScreenProps {
  projects: LabelProject[];
  newProjectRequested?: boolean;
  onNewProjectRequestHandled?: () => void;
  onCreateProject: (name: string) => void;
  onOpenProject: (project: LabelProject) => void;
  onOpenProjectFile: (file: File) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onDuplicateProject: (project: LabelProject) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProject: (project: LabelProject, format: 'eproj' | 'zip') => void;
}

function formatProjectDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date inconnue'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export const ProjectStartScreen: React.FC<ProjectStartScreenProps> = ({
  projects,
  newProjectRequested = false,
  onNewProjectRequestHandled,
  onCreateProject,
  onOpenProject,
  onOpenProjectFile,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onExportProject,
}) => {
  const [search, setSearch] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  useEffect(() => {
    if (newProjectRequested) {
      setShowNewProject(true);
      onNewProjectRequestHandled?.();
    }
  }, [newProjectRequested, onNewProjectRequestHandled]);
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(search.trim().toLowerCase())),
    [projects, search]
  );

  const createProject = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    onCreateProject(name);
    setNewProjectName('');
    setShowNewProject(false);
  };

  return (
    <div data-studio-workspace="projects" className="flex-1 overflow-y-auto bg-[var(--surface-base)] text-[var(--content-primary)]">
      <div className="w-full px-6 py-5">
        <header className="mb-5 flex items-center justify-between gap-6 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--action-primary)]">E-Studio Desktop</div>
            <h1 className="text-xl font-semibold text-[var(--content-primary)]">Projets récents</h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--content-secondary)]">
            <span className="tabular-nums">{projects.length} projet{projects.length === 1 ? '' : 's'} local{projects.length === 1 ? '' : 'aux'}</span>
            <span className="hidden lg:inline text-[var(--content-muted)]">Bibliothèque de travail</span>
          </div>
        </header>

        <section className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewProject(true)}
            className="group flex h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-left text-sm transition hover:border-[var(--action-primary)] hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--action-primary)]">
              <FilePlus2 className="h-4 w-4" />
            </span>
            <span className="font-semibold text-[var(--content-primary)]">Nouveau projet</span>
          </button>

          <label className="group flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-left text-sm transition hover:border-emerald-500 hover:bg-[var(--surface-hover)] focus-within:ring-2 focus-within:ring-[var(--action-focus-ring)]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-emerald-400">
              <FolderOpen className="h-4 w-4" />
            </span>
            <span className="font-semibold text-[var(--content-primary)]">Ouvrir un projet</span>
            <input
              type="file"
              accept=".eproj,.zip"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onOpenProjectFile(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </section>

        {showNewProject && (
          <form onSubmit={createProject} className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-[var(--action-primary)]/30 bg-[var(--action-primary)]/5 p-4">
            <label className="min-w-64 flex-1 text-sm font-medium text-[var(--content-secondary)]">
              Nom du projet
              <input
                autoFocus
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="Ex. Étiquettes magasin"
                className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2.5 text-sm text-[var(--content-primary)] outline-none focus:border-[var(--action-primary)] transition"
              />
            </label>
            <button type="submit" disabled={!newProjectName.trim()} className="rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--action-primary-fg)] transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none">
              Créer
            </button>
            <button type="button" onClick={() => setShowNewProject(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none">
              Annuler
            </button>
          </form>
        )}

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--content-primary)]">Nom · Gabarits · Sources · Dernière ouverture</h2>
            </div>
            <label className="flex w-full items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 sm:w-64 focus-within:border-[var(--action-primary)] transition">
              <Search className="h-4 w-4 text-[var(--content-muted)]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un projet" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--content-primary)] outline-none placeholder:text-[var(--content-muted)]" />
            </label>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--border-subtle)] px-6 py-12 text-center bg-[var(--surface-panel)]">
              <Clock3 className="mx-auto h-8 w-8 text-[var(--content-muted)]" />
              <p className="mt-3 text-sm font-medium text-[var(--content-secondary)]">{projects.length ? 'Aucun projet ne correspond à cette recherche.' : 'Aucun projet récent'}</p>
              {!projects.length && <p className="mt-1 text-xs text-[var(--content-muted)]">Créez un projet ou ouvrez un fichier .eproj pour commencer.</p>}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--surface-panel)]">
              {filteredProjects.map((project) => (
                <div key={project.id} className="group flex min-h-14 items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-2 last:border-b-0 hover:bg-[var(--surface-hover)] transition">
                  <button onClick={() => onOpenProject(project)} className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none rounded">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-raised)] text-[var(--action-primary)]">
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--content-primary)]">{project.name}</span>
                      <span className="mt-1 block text-xs text-[var(--content-muted)] tabular-nums">
                        {project.templates.length} gabarit{project.templates.length === 1 ? '' : 's'} · {project.data_sources.length} source{project.data_sources.length === 1 ? '' : 's'} · {formatProjectDate(project.last_opened_at || project.updated_at)}
                      </span>
                    </span>
                  </button>
                  <button onClick={() => onOpenProject(project)} className="hidden rounded-md px-3 py-2 text-xs font-semibold text-[var(--action-primary)] hover:bg-[var(--action-primary)]/10 sm:block transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none">Ouvrir</button>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)} className="rounded-md p-2 text-[var(--content-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none" aria-label={`Actions pour ${project.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === project.id && (
                      <>
                        <button className="fixed inset-0 z-10 cursor-default" aria-label="Fermer le menu" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-1 shadow-xl">
                          <button onClick={() => { const name = window.prompt('Renommer le projet', project.name); if (name?.trim()) onRenameProject(project.id, name.trim()); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition"><Pencil className="h-3.5 w-3.5" />Renommer</button>
                          <button onClick={() => { onDuplicateProject(project); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition"><Copy className="h-3.5 w-3.5" />Dupliquer</button>
                          <button onClick={() => { onExportProject(project, 'eproj'); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition"><Upload className="h-3.5 w-3.5" />Exporter .eproj</button>
                          <button onClick={() => { onExportProject(project, 'zip'); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)] transition"><Upload className="h-3.5 w-3.5" />Exporter ZIP</button>
                          <button onClick={() => { if (window.confirm(`Supprimer le projet « ${project.name} » ?`)) onDeleteProject(project.id); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition"><Trash2 className="h-3.5 w-3.5" />Supprimer</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
