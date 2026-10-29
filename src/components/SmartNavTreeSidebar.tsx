import React, { useState } from 'react';
import { LabelTemplate, TemplateItem, ProductRecord } from '../types';
import { catalogRepository as databaseService } from '../services/catalogRepository';
import {
  Layers,
  Database,
  Sliders,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Type,
  Square,
  Circle,
  Barcode,
  QrCode,
  Image as ImageIcon,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Tag,
  Search,
  Sparkles,
} from 'lucide-react';
import { ContextTooltip } from '../context/TooltipContext';

interface SmartNavTreeSidebarProps {
  template: LabelTemplate;
  selectedItemIds: string[];
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onUpdateItem: (itemId: string, patch: Partial<TemplateItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
  onAddNewItem: (itemType: string, customField?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function getItemTitle(item: TemplateItem): string {
  if (item.type === 'text') return item.text || 'Texte';
  if (item.type === 'curved_text') return item.text || 'Texte courbé';
  if (item.type === 'barcode') return item.binding_key ? `Barcode: ${item.binding_key}` : `EAN (${item.code})`;
  if (item.type === 'qrcode') return item.binding_key ? `QR: ${item.binding_key}` : 'QR Code';
  if (item.type === 'price_block') return `Prix: ${item.binding_key}`;
  if (item.type === 'pictogram') return `Picto: ${item.pictogram_type}`;
  if (item.type === 'restricted_area') return `Zone: ${item.label}`;
  if (item.binding_key) return `{{${item.binding_key}}}`;
  return item.type;
}

export const SmartNavTreeSidebar: React.FC<SmartNavTreeSidebarProps> = ({
  template,
  selectedItemIds,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onReorderItem,
  onAddNewItem,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'data' | 'rules'>('layers');
  const [searchTerm, setSearchTerm] = useState('');

  const sampleProduct: ProductRecord = databaseService.getProducts()[0] || ({} as ProductRecord);

  // Available data catalog fields
  const dataCatalogFields = [
    { key: 'ITEMNAME', label: 'Désignation Produit', sample: sampleProduct.ITEMNAME || 'Café Pur Arabica 250g', type: 'text' },
    { key: 'REGPRICE', label: 'Prix Normal (€)', sample: sampleProduct.REGPRICE ? `${sampleProduct.REGPRICE} €` : '4.50 €', type: 'price' },
    { key: 'DISCPRICE', label: 'Prix Promotionnel (€)', sample: sampleProduct.DISCPRICE ? `${sampleProduct.DISCPRICE} €` : '3.20 €', type: 'price' },
    { key: 'UNIT_PRICE_TEXT', label: 'Prix / Unité (Kilo/Litre)', sample: sampleProduct.UNIT_PRICE_TEXT || '12.80 €/kg', type: 'text' },
    { key: 'PROMOTEXT', label: 'Texte Promotion / Avantage', sample: sampleProduct.PROMOTEXT || '-30% Immédiat', type: 'text' },
    { key: 'BARCODE', label: 'Code-Barres EAN13', sample: sampleProduct.BARCODE || '3250390123456', type: 'barcode' },
    { key: 'QR_CODE_URL', label: 'QR Code Traçabilité / Web', sample: 'https://monmagasin.fr/p/12345', type: 'qrcode' },
    { key: 'ORIGIN', label: 'Origine / Provenance', sample: sampleProduct.ORIGIN || 'France', type: 'text' },
    { key: 'BRAND_INFO', label: 'Marque / Producteur', sample: sampleProduct.BRAND_INFO || 'BioTerroir', type: 'text' },
    { key: 'ECO_TAX', label: 'Éco-Participation', sample: sampleProduct.ECO_TAX ? `${sampleProduct.ECO_TAX} €` : '0.15 €', type: 'text' },
    { key: 'NUTRISCORE', label: 'Nutri-Score', sample: 'A', type: 'badge' },
    { key: 'ENERGY_CLASS', label: 'Classe Énergétique', sample: 'A+++', type: 'badge' },
  ];

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'curved_text':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'price_block':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'barcode':
        return <Barcode className="w-3.5 h-3.5 text-purple-400" />;
      case 'qrcode':
        return <QrCode className="w-3.5 h-3.5 text-indigo-400" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-amber-400" />;
      case 'ellipse':
        return <Circle className="w-3.5 h-3.5 text-amber-300" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredItems = (template.items || []).filter((it) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const title = getItemTitle(it).toLowerCase();
    return title.includes(term) || it.type.toLowerCase().includes(term);
  });

  const filteredDataFields = dataCatalogFields.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return f.key.toLowerCase().includes(term) || f.label.toLowerCase().includes(term);
  });

  // Collapsed Minimalist Dock
  if (isCollapsed) {
    return (
      <aside className="designer-tree w-12 bg-[var(--surface-panel)] border-r border-[var(--border-subtle)] flex flex-col items-center py-3 select-none shrink-0 z-20 transition-all duration-300">
        <ContextTooltip title="Déplier le panneau latéral" content="Afficher l'arborescence des calques, le catalogue de données et les règles" category="Navigation">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] rounded-lg mb-4 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            aria-label="Expand Navigation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </ContextTooltip>

        <div className="flex flex-col gap-2 w-full px-1.5">
          <ContextTooltip title="Calques & Objets" content={`${template.items.length} éléments sur le gabarit`} category="Navigation">
            <button
              onClick={() => {
                setActiveTab('layers');
                onToggleCollapse();
              }}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                activeTab === 'layers' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </ContextTooltip>

          <ContextTooltip title="Catalogue de Données" content="Champs dynamiques liés au produit" category="Données">
            <button
              onClick={() => {
                setActiveTab('data');
                onToggleCollapse();
              }}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                activeTab === 'data' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]'
              }`}
            >
              <Database className="w-4 h-4" />
            </button>
          </ContextTooltip>

          <ContextTooltip title="Règles TCA" content="Conditions d'affichage & promotions" category="Règles">
            <button
              onClick={() => {
                setActiveTab('rules');
                onToggleCollapse();
              }}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                activeTab === 'rules' ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)]' : 'text-[var(--content-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--content-primary)]'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </ContextTooltip>
        </div>

        {/* Quick Add floating trigger */}
        <div className="mt-auto flex flex-col gap-1.5 w-full px-1.5">
          <ContextTooltip title="Ajouter Texte" content="Insérer un nouveau champ texte" category="Ajout">
            <button
              onClick={() => onAddNewItem('text')}
              className="w-full py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--action-primary)] text-[var(--content-secondary)] hover:text-[var(--action-primary-fg)] flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </ContextTooltip>
        </div>
      </aside>
    );
  }

  // Expanded Smart Tree & Catalog Sidebar
  return (
    <aside className="designer-tree w-72 bg-[var(--surface-panel)] border-r border-[var(--border-subtle)] flex flex-col text-[var(--content-primary)] select-none shrink-0 z-20 transition-all duration-300 shadow-none">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--action-primary)] animate-pulse" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[var(--content-primary)]">Structure</h2>
          </div>
          <ContextTooltip title="Replier le panneau" content="Gagner plus d'espace sur le canevas (Raccourci: [ )" category="Navigation">
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
              aria-label="Collapse Navigation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </ContextTooltip>
        </div>

        {/* Navigation Tabs */}
        <div role="tablist" aria-label="Sections du panneau latéral" className="grid grid-cols-3 gap-1 bg-[var(--surface-raised)] p-0.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)]">
          <button
            role="tab"
            aria-selected={activeTab === 'layers'}
            id="tab-layers"
            aria-controls="panel-layers"
            onClick={() => setActiveTab('layers')}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              activeTab === 'layers'
                ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] shadow-xs font-bold'
                : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Calques</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'data'}
            id="tab-data"
            aria-controls="panel-data"
            onClick={() => setActiveTab('data')}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              activeTab === 'data'
                ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] shadow-xs font-bold'
                : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Données</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'rules'}
            id="tab-rules"
            aria-controls="panel-rules"
            onClick={() => setActiveTab('rules')}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              activeTab === 'rules'
                ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] shadow-xs font-bold'
                : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Règles</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--content-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'layers' ? 'Filtrer les calques...' : 'Chercher un champ...'}
            aria-label={activeTab === 'layers' ? 'Filtrer les calques' : 'Chercher un champ dans le catalogue'}
            className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-3 py-1 text-xs text-[var(--content-primary)] placeholder-[var(--content-muted)] focus:outline-none focus:border-[var(--action-primary)] transition"
          />
        </div>
      </div>

      {/* Tab 1: Calques & Arborescence */}
      {activeTab === 'layers' && (
        <div
          id="panel-layers"
          role="tree"
          aria-label="Arborescence des calques du gabarit"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-[var(--content-muted)] text-xs italic">
              Aucun élément trouvé
            </div>
          ) : (
            // Display items in reverse rendering order (top layer first)
            [...filteredItems].reverse().map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isLocked = !!item.locked;

              return (
                <div
                  key={item.id}
                  role="treeitem"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectItem(item.id, e.shiftKey || e.metaKey || e.ctrlKey);
                    }
                  }}
                  onClick={(e) => onSelectItem(item.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  className={`group px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-1.5 cursor-pointer transition border focus:outline-none focus:ring-1 focus:ring-[var(--action-focus-ring)] ${
                    isSelected
                      ? 'bg-[var(--action-primary)]/15 border-[var(--action-primary)] text-[var(--content-primary)] shadow-xs'
                      : 'bg-[var(--surface-raised)]/40 border-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="p-1 rounded bg-[var(--surface-base)] shrink-0">
                      {getItemIcon(item.type)}
                    </span>
                    <div className="truncate min-w-0">
                      <div className="font-semibold text-xs truncate leading-tight text-[var(--content-primary)]">
                        {getItemTitle(item)}
                      </div>
                      <div className="text-[10px] text-[var(--content-muted)] truncate font-mono tabular-nums">
                        {item.type} • {item.x_mm}×{item.y_mm} mm
                      </div>
                    </div>
                  </div>

                  {/* Layer Quick Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateItem(item.id, { locked: !isLocked });
                      }}
                      className={`p-1 rounded hover:bg-[var(--surface-hover)] transition focus-visible:ring-1 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
                        isLocked ? 'text-amber-400' : 'text-[var(--content-muted)] hover:text-[var(--content-primary)]'
                      }`}
                      title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
                      aria-label={isLocked ? `Déverrouiller le calque ${getItemTitle(item)}` : `Verrouiller le calque ${getItemTitle(item)}`}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderItem(item.id, 'up');
                      }}
                      className="p-1 rounded text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] transition focus-visible:ring-1 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
                      title="Monter le calque"
                      aria-label="Monter le calque"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderItem(item.id, 'down');
                      }}
                      className="p-1 rounded text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] transition focus-visible:ring-1 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
                      title="Descendre le calque"
                      aria-label="Descendre le calque"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateItem(item.id);
                      }}
                      className="p-1 rounded text-[var(--content-muted)] hover:text-[var(--content-primary)] hover:bg-[var(--surface-hover)] transition focus-visible:ring-1 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
                      title="Dupliquer"
                      aria-label="Dupliquer le calque"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-1 rounded text-[var(--content-muted)] hover:text-rose-400 hover:bg-rose-500/20 transition focus-visible:ring-1 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
                      title="Supprimer"
                      aria-label="Supprimer le calque"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Catalogue de Données Dynamiques */}
      {activeTab === 'data' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <div className="p-2 rounded bg-[var(--action-primary)]/10 border border-[var(--action-primary)]/20 text-[11px] text-[var(--action-primary)] mb-2">
            Cliquez sur un champ pour l'insérer instantanément sur le gabarit.
          </div>

          {filteredDataFields.map((field) => (
            <div
              key={field.key}
              onClick={() => onAddNewItem(field.type, field.key)}
              className="p-2 rounded-lg bg-[var(--surface-raised)]/40 hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] cursor-pointer transition flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--action-primary)] font-bold bg-[var(--surface-base)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">
                    {field.key}
                  </span>
                  <span className="text-xs font-semibold text-[var(--content-primary)] truncate">{field.label}</span>
                </div>
                <div className="text-[10px] text-[var(--content-muted)] mt-0.5 truncate italic">
                  Ex: {field.sample}
                </div>
              </div>

              <button
                type="button"
                className="p-1 bg-[var(--action-primary)]/80 group-hover:bg-[var(--action-primary)] text-[var(--action-primary-fg)] rounded opacity-0 group-hover:opacity-100 transition shrink-0"
                title="Insérer ce champ"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Règles TCA & Conditions d'affichage */}
      {activeTab === 'rules' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--content-primary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Condition Promo Active
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                Auto
              </span>
            </div>
            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">
              Affiche le prix barré et le badge promotionnel uniquement si <code className="text-[var(--action-primary)]">DISCPRICE &gt; 0</code>.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--content-primary)] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Origine & Traçabilité
              </span>
              <span className="text-[10px] bg-[var(--action-primary)]/15 text-[var(--action-primary)] border border-[var(--action-primary)]/20 px-1.5 py-0.5 rounded font-mono">
                TCA-2
              </span>
            </div>
            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">
              Positionne automatiquement le pictogramme drapeau selon la valeur du champ <code className="text-[var(--action-primary)]">ORIGIN</code>.
            </p>
          </div>
        </div>
      )}

      {/* Footer Add Tool */}
      <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/60 flex items-center justify-between text-xs">
        <span className="text-[var(--content-muted)] text-[11px] tabular-nums">
          {template.items.length} élément{template.items.length > 1 ? 's' : ''}
        </span>
        <button
          onClick={() => onAddNewItem('text')}
          className="px-2 py-1 bg-[var(--action-primary)] hover:bg-[var(--action-hover)] text-[var(--action-primary-fg)] font-semibold rounded-md flex items-center gap-1 text-[11px] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>
    </aside>
  );
};
