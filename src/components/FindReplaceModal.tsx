import React, { useState, useMemo } from 'react';
import {
  TemplateItem,
  TextItemProperties,
  BarcodeItemProperties,
  QRCodeItemProperties,
  TierPriceItemProperties,
  ShapeItemProperties,
  LineItemProperties,
  RestrictedAreaItemProperties,
} from '../types';
import { Search, Replace, ArrowRight, ArrowLeft, Check, X, FileText, Type, Palette } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TemplateItem[];
  selectedItemIds?: string[];
  onUpdateMultipleItems: (updatedItems: TemplateItem[]) => void;
  onSelectItems: (ids: string[]) => void;
}

type SearchTargetType = 'text' | 'font' | 'color';

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateMultipleItems,
  onSelectItems,
}) => {
  const [searchTarget, setSearchTarget] = useState<SearchTargetType>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const matchingItems = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = matchCase ? searchQuery : searchQuery.toLowerCase();

    return items.filter((item) => {
      if (searchTarget === 'text') {
        const textFields: string[] = [];
        if ('text' in item && typeof (item as TextItemProperties).text === 'string') {
          textFields.push((item as TextItemProperties).text);
        }
        if ('code' in item && typeof (item as BarcodeItemProperties).code === 'string') {
          textFields.push((item as BarcodeItemProperties).code);
        }
        if ('content' in item && typeof (item as QRCodeItemProperties).content === 'string') {
          textFields.push((item as QRCodeItemProperties).content);
        }
        if ('prefix_text' in item && typeof (item as TierPriceItemProperties).prefix_text === 'string') {
          textFields.push((item as TierPriceItemProperties).prefix_text);
        }
        if ('unit_label' in item && typeof (item as TierPriceItemProperties).unit_label === 'string') {
          textFields.push((item as TierPriceItemProperties).unit_label);
        }
        if ('label' in item && typeof (item as RestrictedAreaItemProperties).label === 'string') {
          textFields.push((item as RestrictedAreaItemProperties).label || '');
        }

        return textFields.some((val) => {
          const targetStr = matchCase ? val : val.toLowerCase();
          return targetStr.includes(query);
        });
      }

      if (searchTarget === 'font') {
        if ('font_family' in item && typeof (item as TextItemProperties).font_family === 'string') {
          const font = (item as TextItemProperties).font_family;
          const targetStr = matchCase ? font : font.toLowerCase();
          return targetStr.includes(query);
        }
      }

      if (searchTarget === 'color') {
        const colorFields: (string | undefined)[] = [
          (item as TextItemProperties).text_color,
          (item as ShapeItemProperties).fill_color,
          (item as ShapeItemProperties).border_color,
          (item as LineItemProperties).color,
          (item as BarcodeItemProperties).bar_color,
          (item as QRCodeItemProperties).module_color,
          (item as QRCodeItemProperties).background_color,
          (item as RestrictedAreaItemProperties).zone_color,
        ];
        return colorFields.some((c) => {
          if (!c) return false;
          const targetStr = matchCase ? c : c.toLowerCase();
          return targetStr.includes(query);
        });
      }

      return false;
    });
  }, [items, searchQuery, searchTarget, matchCase]);

  const handleNext = () => {
    if (matchingItems.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingItems.length;
    setCurrentMatchIndex(nextIdx);
    onSelectItems([matchingItems[nextIdx].id]);
  };

  const handlePrev = () => {
    if (matchingItems.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchingItems.length) % matchingItems.length;
    setCurrentMatchIndex(prevIdx);
    onSelectItems([matchingItems[prevIdx].id]);
  };

  const performReplaceOnItem = (item: TemplateItem): TemplateItem => {
    const updated = { ...item } as any;

    if (searchTarget === 'text') {
      const replaceRegex = new RegExp(
        searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );

      if ('text' in updated && typeof updated.text === 'string') {
        updated.text = updated.text.replace(replaceRegex, replaceQuery);
      }
      if ('code' in updated && typeof updated.code === 'string') {
        updated.code = updated.code.replace(replaceRegex, replaceQuery);
      }
      if ('content' in updated && typeof updated.content === 'string') {
        updated.content = updated.content.replace(replaceRegex, replaceQuery);
      }
      if ('prefix_text' in updated && typeof updated.prefix_text === 'string') {
        updated.prefix_text = updated.prefix_text.replace(replaceRegex, replaceQuery);
      }
      if ('unit_label' in updated && typeof updated.unit_label === 'string') {
        updated.unit_label = updated.unit_label.replace(replaceRegex, replaceQuery);
      }
      if ('label' in updated && typeof updated.label === 'string') {
        updated.label = updated.label.replace(replaceRegex, replaceQuery);
      }
    }

    if (searchTarget === 'font') {
      if ('font_family' in updated) {
        updated.font_family = replaceQuery;
      }
    }

    if (searchTarget === 'color') {
      const isMatch = (val?: string) => {
        if (!val) return false;
        return matchCase
          ? val === searchQuery
          : val.toLowerCase() === searchQuery.toLowerCase();
      };

      if (isMatch(updated.text_color)) updated.text_color = replaceQuery;
      if (isMatch(updated.fill_color)) updated.fill_color = replaceQuery;
      if (isMatch(updated.border_color)) updated.border_color = replaceQuery;
      if (isMatch(updated.color)) updated.color = replaceQuery;
      if (isMatch(updated.bar_color)) updated.bar_color = replaceQuery;
      if (isMatch(updated.module_color)) updated.module_color = replaceQuery;
      if (isMatch(updated.background_color)) updated.background_color = replaceQuery;
      if (isMatch(updated.zone_color)) updated.zone_color = replaceQuery;
    }

    return updated;
  };

  const handleReplaceCurrent = () => {
    if (matchingItems.length === 0) return;
    const targetItem = matchingItems[currentMatchIndex] || matchingItems[0];
    const updated = performReplaceOnItem(targetItem);
    onUpdateMultipleItems([updated]);

    setFeedback(`1 élément mis à jour`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleReplaceAll = () => {
    if (matchingItems.length === 0) return;
    const updatedItems = matchingItems.map((item) => performReplaceOnItem(item));
    onUpdateMultipleItems(updatedItems);

    setFeedback(`${updatedItems.length} élément(s) remplacé(s)`);
    setTimeout(() => setFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-replace-title"
      className="fixed inset-0 bg-[var(--scrim,rgba(0,0,0,0.6))] backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
    >
      <div className="bg-[var(--surface-panel)] rounded-xl shadow-2xl border border-[var(--border-default)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 text-[var(--content-primary)]">
        {/* Header */}
        <div className="px-5 py-4 bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--action-primary-bg)]" />
            <h2 id="find-replace-title" className="text-sm font-bold text-[var(--content-primary)]">Rechercher & Remplacer Globale</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 text-[var(--content-muted)] hover:text-[var(--content-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Target type switcher */}
          <div>
            <label className="text-xs font-semibold text-[var(--content-secondary)] mb-1.5 block">Cible de la recherche</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-raised)] rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setSearchTarget('text')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition ${
                  searchTarget === 'text'
                    ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] shadow-2xs font-bold'
                    : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Textes</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTarget('font')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition ${
                  searchTarget === 'font'
                    ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] shadow-2xs font-bold'
                    : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Polices</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTarget('color')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition ${
                  searchTarget === 'color'
                    ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)] shadow-2xs font-bold'
                    : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Couleurs</span>
              </button>
            </div>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-xs font-semibold text-[var(--content-primary)] block mb-1">
              {searchTarget === 'text' && 'Texte à rechercher'}
              {searchTarget === 'font' && 'Nom de la police originale (ex: Arial)'}
              {searchTarget === 'color' && 'Code couleur Hex d\'origine (ex: #000000)'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              placeholder={
                searchTarget === 'text'
                  ? 'ex: FCFA ou Libellé'
                  : searchTarget === 'font'
                  ? 'ex: Arial, Inter'
                  : 'ex: #000000'
              }
              className="w-full px-3 py-2 bg-[var(--surface-input)] border border-[var(--border-default)] text-[var(--content-primary)] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[var(--focus-ring)] outline-none"
            />
          </div>

          {/* Replace Query */}
          <div>
            <label className="text-xs font-semibold text-[var(--content-primary)] block mb-1">
              Remplacer par
            </label>
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder={
                searchTarget === 'text'
                  ? 'ex: EUR ou Nouveau Nom'
                  : searchTarget === 'font'
                  ? 'ex: Plus Jakarta Sans'
                  : 'ex: #0f172a'
              }
              className="w-full px-3 py-2 bg-[var(--surface-input)] border border-[var(--border-default)] text-[var(--content-primary)] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[var(--focus-ring)] outline-none"
            />
          </div>

          {/* Options & Matches Count */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--content-secondary)]">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded text-[var(--action-primary-bg)] focus:ring-[var(--focus-ring)]"
              />
              <span>Respecter la casse (Match Case)</span>
            </label>

            <span className="text-xs font-bold text-[var(--action-primary-bg)] bg-[var(--action-primary-bg)]/10 px-2.5 py-1 rounded-full border border-[var(--action-primary-bg)]/30 font-mono">
              {matchingItems.length > 0
                ? `${currentMatchIndex + 1} / ${matchingItems.length} résultat(s)`
                : '0 résultat'}
            </span>
          </div>

          {feedback && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={matchingItems.length === 0}
                className="p-2 border border-[var(--border-default)] rounded-lg text-[var(--content-primary)] bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition shadow-2xs"
                title="Résultat précédent"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={matchingItems.length === 0}
                className="p-2 border border-[var(--border-default)] rounded-lg text-[var(--content-primary)] bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition shadow-2xs"
                title="Résultat suivant"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplaceCurrent}
                disabled={matchingItems.length === 0}
                className="px-3 py-2 border border-[var(--border-default)] bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] text-[var(--content-primary)] font-semibold text-xs rounded-lg disabled:opacity-40 transition shadow-2xs"
              >
                Remplacer
              </button>
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={matchingItems.length === 0}
                className="px-4 py-2 bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-fg)] font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-40 transition"
              >
                <Replace className="w-3.5 h-3.5" />
                <span>Tout Remplacer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
