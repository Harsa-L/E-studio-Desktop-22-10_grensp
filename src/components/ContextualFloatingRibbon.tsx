import React from 'react';
import { TemplateItem, LabelTemplate } from '../types';
import {
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  Plus,
  Minus,
  Crosshair,
  Sliders,
  Type,
  Maximize2,
} from 'lucide-react';
import { ContextTooltip } from '../context/TooltipContext';

interface ContextualFloatingRibbonProps {
  selectedItem: TemplateItem | null;
  selectedItemsCount: number;
  template: LabelTemplate;
  zoom: number;
  canvasContainerWidthPx?: number;
  onUpdateItem: (updatedItem: TemplateItem) => void;
  onDuplicateItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
  onCenterItem?: (itemId: string, axis: 'x' | 'y' | 'both') => void;
  onOpenInspectorDrawer?: () => void;
}

export const ContextualFloatingRibbon: React.FC<ContextualFloatingRibbonProps> = ({
  selectedItem,
  selectedItemsCount,
  template,
  zoom,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  onReorderItem,
  onCenterItem,
  onOpenInspectorDrawer,
}) => {
  if (!selectedItem || selectedItemsCount === 0) return null;

  const itemAny = selectedItem as any;
  const isTextLike =
    selectedItem.type === 'text' ||
    selectedItem.type === 'curved_text' ||
    selectedItem.type === 'price_block';
  const isLocked = !!selectedItem.locked;

  const handleFontSizeChange = (delta: number) => {
    if (selectedItem.type === 'text' || selectedItem.type === 'curved_text') {
      const currentSize = itemAny.font_size_pt || 10;
      const newSize = Math.max(4, Math.min(120, currentSize + delta));
      onUpdateItem({ ...selectedItem, font_size_pt: newSize } as any);
    } else if (selectedItem.type === 'price_block') {
      const pb = selectedItem as any;
      const currentInt = pb.integer_style?.font_size_pt || 28;
      const currentDec = pb.decimal_style?.font_size_pt || 14;
      const newInt = Math.max(8, Math.min(120, currentInt + delta * 2));
      const newDec = Math.max(6, Math.min(80, currentDec + delta));
      onUpdateItem({
        ...selectedItem,
        integer_style: { ...pb.integer_style, font_size_pt: newInt },
        decimal_style: { ...pb.decimal_style, font_size_pt: newDec },
      } as any);
    }
  };

  const handleToggleBold = () => {
    if (selectedItem.type === 'text' || selectedItem.type === 'curved_text') {
      const currentWeight = itemAny.font_weight || 'normal';
      onUpdateItem({
        ...selectedItem,
        font_weight: currentWeight === 'bold' || currentWeight === '800' ? 'normal' : 'bold',
      } as any);
    } else if (selectedItem.type === 'price_block') {
      const pb = selectedItem as any;
      const currentWeight = pb.integer_style?.font_weight || 'bold';
      const newWeight = currentWeight === 'bold' || currentWeight === '800' ? 'normal' : 'bold';
      onUpdateItem({
        ...selectedItem,
        integer_style: { ...pb.integer_style, font_weight: newWeight },
      } as any);
    }
  };

  const handleAlignChange = (alignment: 'left' | 'center' | 'right') => {
    if (selectedItem.type === 'text' || selectedItem.type === 'price_block') {
      onUpdateItem({ ...selectedItem, alignment });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedItem.type === 'text' || selectedItem.type === 'curved_text') {
      onUpdateItem({ ...selectedItem, text_color: color } as any);
    } else if (selectedItem.type === 'price_block') {
      const pb = selectedItem as any;
      onUpdateItem({
        ...selectedItem,
        integer_style: { ...pb.integer_style, text_color: color },
        decimal_style: { ...pb.decimal_style, text_color: color },
        currency_style: { ...pb.currency_style, text_color: color },
      } as any);
    } else if (selectedItem.type === 'shape' || selectedItem.type === 'ellipse') {
      onUpdateItem({ ...selectedItem, fill_color: color } as any);
    } else if (selectedItem.type === 'line') {
      onUpdateItem({ ...selectedItem, color });
    }
  };

  const handleCenter = (axis: 'x' | 'y') => {
    if (onCenterItem) {
      onCenterItem(selectedItem.id, axis);
      return;
    }
    if (axis === 'x') {
      const centeredX = Number(((template.width_mm - selectedItem.w_mm) / 2).toFixed(2));
      onUpdateItem({ ...selectedItem, x_mm: Math.max(0, centeredX) });
    } else {
      const centeredY = Number(((template.height_mm - selectedItem.h_mm) / 2).toFixed(2));
      onUpdateItem({ ...selectedItem, y_mm: Math.max(0, centeredY) });
    }
  };

  const quickColors = ['#0f172a', '#ffffff', '#dc2626', '#16a34a', '#2563eb', '#f59e0b'];

  const getFontSizeLabel = () => {
    if (selectedItem.type === 'price_block') {
      const pb = selectedItem as any;
      return `${pb.integer_style?.font_size_pt || 28}pt`;
    }
    return `${itemAny.font_size_pt || 10}pt`;
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-120px)] flex items-center gap-1.5 bg-[var(--surface-panel)] text-[var(--content-primary)] backdrop-blur-md border border-[var(--border-subtle)] rounded-2xl shadow-2xl px-3 py-1.5 text-xs select-none pointer-events-auto animate-in fade-in zoom-in-95 duration-150 overflow-x-auto"
    >
      {/* Type badge & dimensions */}
      <ContextTooltip
        title="Élément Sélectionné"
        content={`Type: ${selectedItem.type} | X: ${selectedItem.x_mm}mm, Y: ${selectedItem.y_mm}mm, L: ${selectedItem.w_mm}mm, H: ${selectedItem.h_mm}mm`}
        category="Informations Objet"
        placement="bottom"
      >
        <div className="flex items-center gap-1.5 bg-[var(--surface-raised)] px-2 py-1 rounded-lg border border-[var(--border-subtle)] font-mono text-[11px] shrink-0">
          <span className="px-1.5 py-0.5 bg-[var(--action-primary)] text-[var(--action-primary-fg)] font-bold text-[9px] rounded uppercase tracking-wider">
            {selectedItem.type.replace('_', ' ')}
          </span>
          <span className="text-[var(--content-secondary)] font-semibold text-[10px] tabular-nums">
            {selectedItem.w_mm}×{selectedItem.h_mm}mm
          </span>
        </div>
      </ContextTooltip>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5 shrink-0" />

      {/* Typography Tools */}
      {isTextLike && (
        <div className="flex items-center gap-1 shrink-0">
          <ContextTooltip title="Diminuer la Taille" content="-1 pt (Taille minimale 4pt)" category="Typographie" placement="bottom">
            <button
              onClick={() => handleFontSizeChange(-1)}
              className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </ContextTooltip>

          <span className="font-mono tabular-nums text-[11px] font-bold px-1.5 text-[var(--content-primary)] min-w-[32px] text-center">
            {getFontSizeLabel()}
          </span>

          <ContextTooltip title="Agrandir la Taille" content="+1 pt (Taille maximale 120pt)" category="Typographie" placement="bottom">
            <button
              onClick={() => handleFontSizeChange(1)}
              className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </ContextTooltip>

          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5" />

          {/* Bold */}
          <ContextTooltip title="Style Gras" content="Bascule le poids du texte entre normal et gras" category="Typographie" placement="bottom">
            <button
              onClick={handleToggleBold}
              className={`p-1 rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                itemAny.font_weight === 'bold' || itemAny.font_weight === '800'
                  ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] font-bold shadow-xs'
                  : 'hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
          </ContextTooltip>

          {/* Alignments */}
          {selectedItem.type === 'text' && (
            <div className="flex items-center bg-[var(--surface-raised)] rounded-lg p-0.5 border border-[var(--border-subtle)]">
              <ContextTooltip title="Aligner à Gauche" content="Alignement du texte à gauche du cadre" category="Typographie" placement="bottom">
                <button
                  onClick={() => handleAlignChange('left')}
                  className={`p-1 rounded transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${selectedItem.alignment === 'left' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'}`}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
              </ContextTooltip>
              <ContextTooltip title="Aligner au Centre" content="Alignement centré du texte" category="Typographie" placement="bottom">
                <button
                  onClick={() => handleAlignChange('center')}
                  className={`p-1 rounded transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${selectedItem.alignment === 'center' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'}`}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
              </ContextTooltip>
              <ContextTooltip title="Aligner à Droite" content="Alignement du texte à droite" category="Typographie" placement="bottom">
                <button
                  onClick={() => handleAlignChange('right')}
                  className={`p-1 rounded transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${selectedItem.alignment === 'right' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'}`}
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </ContextTooltip>
            </div>
          )}

          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5" />
        </div>
      )}

      {/* Quick Color Swatches */}
      <div className="flex items-center gap-1 px-1 shrink-0">
        {quickColors.map((c) => {
          const isSelectedColor =
            itemAny.text_color === c || itemAny.fill_color === c || itemAny.color === c;
          return (
            <ContextTooltip key={c} title={`Couleur Rapide ${c}`} content="Appliquer directement la couleur sélectionnée" category="Couleur" placement="bottom">
              <button
                onClick={() => handleColorChange(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border border-[var(--border-subtle)] hover:scale-125 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                  isSelectedColor ? 'ring-2 ring-[var(--action-focus-ring)] scale-110' : ''
                }`}
              />
            </ContextTooltip>
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5 shrink-0" />

      {/* Alignment / Centering */}
      <ContextTooltip title="Centrer sur l'Écran (X)" content="Aligne l'élément exactement au centre horizontal du gabarit" category="Disposition" placement="bottom">
        <button
          onClick={() => handleCenter('x')}
          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </ContextTooltip>

      {/* Reorder */}
      <ContextTooltip title="Monter d'un Calque" content="Avance l'élément d'un niveau dans la pile des objets" category="Calques" placement="bottom">
        <button
          onClick={() => onReorderItem(selectedItem.id, 'up')}
          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <MoveUp className="w-3.5 h-3.5" />
        </button>
      </ContextTooltip>

      <ContextTooltip title="Descendre d'un Calque" content="Recule l'élément d'un niveau dans la pile des objets" category="Calques" placement="bottom">
        <button
          onClick={() => onReorderItem(selectedItem.id, 'down')}
          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <MoveDown className="w-3.5 h-3.5" />
        </button>
      </ContextTooltip>

      {/* Lock */}
      <ContextTooltip
        title={isLocked ? 'Déverrouiller L\'Élément' : 'Verrouiller L\'Élément'}
        content="Verrouille la position et la taille pour empêcher toute modification accidentelle."
        category="Sécurité Objet"
        placement="bottom"
      >
        <button
          onClick={() => onUpdateItem({ ...selectedItem, locked: !isLocked })}
          className={`p-1 rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
            isLocked ? 'text-amber-400 bg-[var(--surface-raised)] font-bold' : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </ContextTooltip>

      {/* Duplicate */}
      <ContextTooltip title="Dupliquer L'Élément" content="Crée une copie identique de l'élément (+2mm décalage)" category="Actions Rapides" placement="bottom">
        <button
          onClick={() => onDuplicateItem(selectedItem.id)}
          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </ContextTooltip>

      {/* Delete */}
      <ContextTooltip title="Supprimer L'Élément" content="Supprime définitivement cet objet du gabarit" category="Actions Rapides" placement="bottom">
        <button
          onClick={() => onDeleteItem(selectedItem.id)}
          className="p-1 hover:bg-rose-500/20 text-[var(--content-secondary)] hover:text-rose-400 rounded-lg transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </ContextTooltip>

      {/* Open Full Inspector Drawer */}
      {onOpenInspectorDrawer && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5 shrink-0" />
          <ContextTooltip title="Tiroir Inspecteur Complet" content="Ouvre le panneau latéral complet des propriétés" category="Inspecteur" placement="bottom">
            <button
              onClick={onOpenInspectorDrawer}
              className="p-1 bg-[var(--action-primary)] hover:bg-[var(--action-hover)] text-[var(--action-primary-fg)] rounded-lg font-medium flex items-center gap-1.5 px-2 transition shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Inspecteur</span>
            </button>
          </ContextTooltip>
        </>
      )}
    </div>
  );
};
