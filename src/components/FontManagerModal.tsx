import React, { useState } from 'react';
import { CustomFont } from '../types';
import { getLoadedFonts, saveCustomFont, removeCustomFont, registerFontFromFile } from '../utils/fontManager';
import { Type, Plus, Trash2, X, Upload } from 'lucide-react';

interface FontManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFontAdded?: (font: CustomFont) => void;
}

export const FontManagerModal: React.FC<FontManagerModalProps> = ({
  isOpen,
  onClose,
  onFontAdded,
}) => {
  const [fonts, setFonts] = useState<CustomFont[]>(() => getLoadedFonts());
  const [fontName, setFontName] = useState('');
  const [fontUrl, setFontUrl] = useState('');
  const [category, setCategory] = useState<'sans-serif' | 'serif' | 'display' | 'monospace'>('sans-serif');
  const [previewText, setPreviewText] = useState('12.99 € - PRIX PROMO 2+1 OFFERT');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const font = await registerFontFromFile(files[i]);
        if (onFontAdded) onFontAdded(font);
      }
      setFonts(getLoadedFonts());
    } catch (err: any) {
      setError(`Erreur lors de l'importation de la police : ${err.message || 'Fichier invalide'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddFont = () => {
    if (!fontName.trim()) {
      setError('Veuillez saisir un nom de police.');
      return;
    }

    const newFont: CustomFont = {
      id: `font_${Date.now()}`,
      name: fontName.trim(),
      family: fontName.trim(),
      url: fontUrl.trim() || undefined,
      category,
      source: 'custom_upload',
    };

    saveCustomFont(newFont);
    setFonts(getLoadedFonts());
    if (onFontAdded) onFontAdded(newFont);

    setFontName('');
    setFontUrl('');
    setError(null);
  };

  const handleDeleteFont = (id: string) => {
    removeCustomFont(id);
    setFonts(getLoadedFonts());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="font-manager-title"
      className="fixed inset-0 z-50 bg-[var(--scrim,rgba(0,0,0,0.6))] backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[var(--surface-panel)] rounded-2xl shadow-2xl max-w-2xl w-full border border-[var(--border-default)] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] text-[var(--content-primary)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] flex items-center justify-center shadow-xs">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 id="font-manager-title" className="font-bold text-[var(--content-primary)] text-sm">Gestionnaire de Polices Typographiques</h2>
              <p className="text-[11px] text-[var(--content-muted)]">Ajoutez des polices web ou personnalisées pour vos étiquettes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-[var(--content-muted)] hover:text-[var(--content-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Add Font Section */}
          <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="font-bold text-[var(--content-primary)] text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
              <span>Ajouter une nouvelle typographie</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--content-secondary)] mb-1">Nom de la police *</label>
                <input
                  type="text"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  placeholder="Ex: Montserrat, Oswald..."
                  className="w-full px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-xs bg-[var(--surface-input)] text-[var(--content-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--content-secondary)] mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-xs bg-[var(--surface-input)] text-[var(--content-primary)]"
                >
                  <option value="sans-serif">Sans-Serif (Linéale)</option>
                  <option value="serif">Serif (À empattement)</option>
                  <option value="display">Display (Titrages / Impact)</option>
                  <option value="monospace">Monospace (Code / Prix)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--content-secondary)] mb-1">URL Webfont (optionnel)</label>
                <input
                  type="url"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://fonts.gstatic.com/..."
                  className="w-full px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-xs bg-[var(--surface-input)] text-[var(--content-primary)]"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-rose-400 text-[11px] font-medium">{error}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="px-3 py-1.5 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--content-primary)] rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[var(--action-primary-bg)]" />
                <span>{isUploading ? 'Chargement...' : 'Téléverser un fichier TTF / WOFF2'}</span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleAddFont}
                className="px-3.5 py-1.5 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] rounded-lg text-xs font-bold transition shadow-xs"
              >
                Enregistrer la police
              </button>
            </div>
          </div>

          {/* Preview Text Customizer */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--content-muted)] font-medium">Texte d'aperçu :</span>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="flex-1 px-2.5 py-1 border border-[var(--border-default)] rounded-lg text-xs bg-[var(--surface-input)] text-[var(--content-primary)]"
            />
          </div>

          {/* Loaded Fonts List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--content-muted)]">
              Polices Typographiques Actives ({fonts.length})
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {fonts.map((f) => (
                <div
                  key={f.id}
                  className="p-3 border border-[var(--border-subtle)] rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--content-primary)] text-xs">{f.name}</span>
                      <span className="px-1.5 py-0.2 bg-[var(--surface-panel)] text-[var(--content-muted)] border border-[var(--border-subtle)] rounded text-[9px] uppercase font-mono">
                        {f.category}
                      </span>
                      {f.source === 'builtin' ? (
                        <span className="text-[9px] text-[var(--content-muted)] italic">Système</span>
                      ) : (
                        <span className="text-[9px] text-[var(--action-primary-bg)] font-semibold">Personnalisée</span>
                      )}
                    </div>
                    <div
                      className="text-base text-[var(--content-primary)] truncate"
                      style={{ fontFamily: f.family }}
                    >
                      {previewText}
                    </div>
                  </div>

                  {f.source !== 'builtin' && (
                    <button
                      onClick={() => handleDeleteFont(f.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                      title="Supprimer la police"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] font-semibold rounded-lg text-xs transition shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
