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
    <div className="flex-1 overflow-y-auto bg-[#111318] text-slate-100">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-9 flex items-end justify-between gap-6">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">E-Studio Desktop</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Vos projets</h1>
            <p className="mt-2 text-sm text-slate-400">Créez un projet ou reprenez votre travail.</p>
          </div>
          <div className="hidden text-right text-xs text-slate-500 sm:block">
            <div>{projects.length} projet{projects.length === 1 ? '' : 's'} dans la bibliothèque locale</div>
            <div className="mt-1">Les projets peuvent aussi être importés ou exportés en fichier .eproj</div>
          </div>
        </header>

        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setShowNewProject(true)}
            className="group flex min-h-36 items-center gap-5 rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-left transition hover:border-blue-500/70 hover:bg-slate-900"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 group-hover:bg-blue-600/25">
              <FilePlus2 className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-white">Nouveau projet</span>
              <span className="mt-1 block text-sm text-slate-400">Un espace de travail distinct pour vos gabarits et données.</span>
            </span>
          </button>

          <label className="group flex min-h-36 cursor-pointer items-center gap-5 rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-left transition hover:border-emerald-500/70 hover:bg-slate-900">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <FolderOpen className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-white">Ouvrir un projet</span>
              <span className="mt-1 block text-sm text-slate-400">Ouvrez un fichier .eproj ou une archive ZIP portable.</span>
            </span>
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
          <form onSubmit={createProject} className="mb-10 flex flex-wrap items-end gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <label className="min-w-64 flex-1 text-sm font-medium text-slate-300">
              Nom du projet
              <input
                autoFocus
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="Ex. Étiquettes magasin"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </label>
            <button type="submit" disabled={!newProjectName.trim()} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              Créer
            </button>
            <button type="button" onClick={() => setShowNewProject(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white">
              Annuler
            </button>
          </form>
        )}

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Récents</h2>
              <p className="mt-1 text-xs text-slate-500">Les projets ouverts récemment apparaissent en premier.</p>
            </div>
            <label className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 sm:w-64">
              <Search className="h-4 w-4 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un projet" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
              <Clock3 className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-300">{projects.length ? 'Aucun projet ne correspond à cette recherche.' : 'Aucun projet récent'}</p>
              {!projects.length && <p className="mt-1 text-xs text-slate-500">Créez un projet ou ouvrez un fichier .eproj pour commencer.</p>}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
              {filteredProjects.map((project) => (
                <div key={project.id} className="group flex items-center gap-4 border-b border-slate-800 px-4 py-4 last:border-b-0 hover:bg-slate-800/50">
                  <button onClick={() => onOpenProject(project)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-100">{project.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {project.templates.length} gabarit{project.templates.length === 1 ? '' : 's'} · {project.data_sources.length} source{project.data_sources.length === 1 ? '' : 's'} · {formatProjectDate(project.last_opened_at || project.updated_at)}
                      </span>
                    </span>
                  </button>
                  <button onClick={() => onOpenProject(project)} className="hidden rounded-md px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10 sm:block">Ouvrir</button>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-700 hover:text-white" aria-label={`Actions pour ${project.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === project.id && (
                      <>
                        <button className="fixed inset-0 z-10 cursor-default" aria-label="Fermer le menu" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl">
                          <button onClick={() => { const name = window.prompt('Renommer le projet', project.name); if (name?.trim()) onRenameProject(project.id, name.trim()); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"><Pencil className="h-3.5 w-3.5" />Renommer</button>
                          <button onClick={() => { onDuplicateProject(project); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"><Copy className="h-3.5 w-3.5" />Dupliquer</button>
                          <button onClick={() => { onExportProject(project, 'eproj'); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"><Upload className="h-3.5 w-3.5" />Exporter .eproj</button>
                          <button onClick={() => { onExportProject(project, 'zip'); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"><Upload className="h-3.5 w-3.5" />Exporter ZIP</button>
                          <button onClick={() => { if (window.confirm(`Supprimer le projet « ${project.name} » ?`)) onDeleteProject(project.id); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Supprimer</button>
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
