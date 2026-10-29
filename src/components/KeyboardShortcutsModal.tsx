import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Édition & Historique',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], label: 'Annuler la dernière action' },
        { keys: ['Ctrl', 'Y'], label: 'Rétablir l\'action annulée' },
        { keys: ['Ctrl', 'F'], label: 'Rechercher & Remplacer global' },
        { keys: ['Ctrl', 'D'], label: 'Dupliquer les éléments sélectionnés' },
        { keys: ['Suppr'], label: 'Supprimer la sélection' },
      ],
    },
    {
      title: 'Sélection & Style',
      shortcuts: [
        { keys: ['Ctrl', 'A'], label: 'Tout sélectionner sur le canevas' },
        { keys: ['Shift', 'Clic'], label: 'Sélection multiple personnalisée' },
        { keys: ['Ctrl', 'Alt', 'C'], label: 'Copier le style de l\'élément' },
        { keys: ['Ctrl', 'Alt', 'V'], label: 'Appliquer le style copié' },
        { keys: ['Ctrl', 'G'], label: 'Verrouiller / Déverrouiller la sélection' },
      ],
    },
    {
      title: 'Positionnement & Alignement',
      shortcuts: [
        { keys: ['Flèches'], label: 'Déplacement précis (1 px ≈ 0.26 mm)' },
        { keys: ['Shift', 'Flèches'], label: 'Déplacement rapide (10 px ≈ 2.65 mm)' },
        { keys: ['Alt', 'Flèches'], label: 'Micro-ajustement (0.10 mm)' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 bg-[var(--scrim,rgba(0,0,0,0.6))] backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
    >
      <div className="bg-[var(--surface-panel)] rounded-2xl shadow-2xl border border-[var(--border-default)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 text-[var(--content-primary)]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-sm font-bold text-[var(--content-primary)]">Raccourcis Clavier Pro</h2>
              <p className="text-[11px] text-[var(--content-muted)]">Guide de productivité studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--content-muted)]">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-xs transition border border-[var(--border-subtle)]"
                  >
                    <span className="text-[var(--content-primary)]">{sc.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--surface-input)] text-[var(--content-primary)] border border-[var(--border-default)] rounded shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] flex justify-between items-center text-xs">
          <span className="text-[11px] text-[var(--content-muted)]">Astuce : Utilisez Échap pour fermer ce volet</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] font-semibold rounded-lg transition shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
