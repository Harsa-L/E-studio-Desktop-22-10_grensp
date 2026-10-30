import React, { useState, useMemo } from 'react';
import { ProductRecord } from '../types';
import { Layers, Sparkles, Tag, RefreshCw } from 'lucide-react';
import { ContextTooltip } from '../context/TooltipContext';

interface ProductClusteringSidebarProps {
  products: ProductRecord[];
  onApplySubstitution: (productIds: string[], substitutionText: string) => void;
  onFilterProducts?: (filtered: ProductRecord[]) => void;
  onClose?: () => void;
}

export const ProductClusteringSidebar: React.FC<ProductClusteringSidebarProps> = ({
  products,
  onApplySubstitution,
  onClose,
}) => {
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [customSubstitution, setCustomSubstitution] = useState('Toutes tailles & parfums disponibles');
  const [presetSubstitution, setPresetSubstitution] = useState('all_sizes');

  // Intelligent Semantic Clustering
  const clusters = useMemo(() => {
    const map = new Map<string, ProductRecord[]>();

    products.forEach((p) => {
      // Heuristic extraction of semantic root name
      const cleanName = (p.ITEMNAME || '')
        .replace(/\b(\d+(\.\d+)?\s*(g|kg|l|cl|ml|cm|m|mm|pack|pcs|u|x\d+))\b/gi, '')
        .replace(/\b(s|m|l|xl|xxl|rouge|bleu|vert|jaune|noir|blanc|vanille|chocolat|fraise)\b/gi, '')
        .replace(/[-–—/()]/g, ' ')
        .trim();

      const root = cleanName.length > 3 ? cleanName.split(/\s+/).slice(0, 3).join(' ') : (p.BRAND_INFO || 'Divers');
      if (!map.has(root)) {
        map.set(root, []);
      }
      map.get(root)!.push(p);
    });

    return Array.from(map.entries())
      .filter(([_, items]) => items.length > 1)
      .map(([root, items]) => ({
        root,
        count: items.length,
        items,
        brands: Array.from(new Set(items.map(i => i.BRAND_INFO).filter(Boolean))),
      }));
  }, [products]);

  const activeCluster = clusters.find(c => c.root === selectedClusterKey);

  const handleApplyToActiveCluster = () => {
    if (!activeCluster) return;
    const textToApply = presetSubstitution === 'custom'
      ? customSubstitution
      : presetSubstitution === 'all_sizes'
      ? 'Toutes tailles disponibles'
      : presetSubstitution === 'assorted_flavors'
      ? 'Assortiment de parfums au choix'
      : 'Modèles & coloris assortis';

    const ids = activeCluster.items.map(i => i.id);
    onApplySubstitution(ids, textToApply);
  };

  return (
    <aside className="w-80 bg-[var(--surface-panel)] border-l border-[var(--border-subtle)] flex flex-col h-full shadow-lg z-20 shrink-0 text-[var(--content-primary)]">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--action-primary)]" />
          <h2 className="text-xs font-bold text-[var(--content-primary)] uppercase tracking-wider">
            Clustering Produits & Assortiments
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--content-muted)] hover:text-[var(--content-primary)] text-xs font-semibold p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Cluster List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[11px] text-[var(--content-muted)] font-medium mb-1">
          <span className="font-mono tabular-nums font-bold">{clusters.length}</span> groupes sémantiques identifiés automatiquement :
        </div>

        {clusters.length === 0 ? (
          <div className="text-xs text-[var(--content-muted)] italic text-center py-6">
            Aucun groupe de variantes détecté dans la base actuelle.
          </div>
        ) : (
          clusters.map((cluster) => {
            const isSelected = selectedClusterKey === cluster.root;
            return (
              <div
                key={cluster.root}
                onClick={() => setSelectedClusterKey(cluster.root)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--surface-raised)] border-[var(--action-primary)] ring-1 ring-[var(--action-primary)]'
                    : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-[var(--content-primary)]">
                  <span className="truncate">{cluster.root}</span>
                  <span className="px-1.5 py-0.5 bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--action-primary)] rounded-full text-[10px] font-bold font-mono tabular-nums">
                    {cluster.count} var.
                  </span>
                </div>
                {cluster.brands.length > 0 && (
                  <div className="text-[10px] text-[var(--content-muted)] mt-1 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-[var(--content-muted)]" />
                    <span>{cluster.brands.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Footer for Selected Cluster */}
      {activeCluster && (
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-2.5">
          <div className="text-xs font-bold text-[var(--content-primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--action-primary)]" />
            <span>Substitution Dynamique (<span className="font-mono tabular-nums">{activeCluster.count}</span> art.)</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] text-[var(--content-secondary)] font-medium">Modèle de libellé :</label>
            <select
              value={presetSubstitution}
              onChange={(e) => setPresetSubstitution(e.target.value)}
              className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--content-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
            >
              <option value="all_sizes">"Toutes tailles disponibles"</option>
              <option value="assorted_flavors">"Assortiment de parfums au choix"</option>
              <option value="assorted_colors">"Modèles & coloris assortis"</option>
              <option value="custom">Libellé personnalisé...</option>
            </select>

            {presetSubstitution === 'custom' && (
              <input
                type="text"
                value={customSubstitution}
                onChange={(e) => setCustomSubstitution(e.target.value)}
                placeholder="Texte de remplacement..."
                className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--content-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] mt-1"
              />
            )}
          </div>

          <ContextTooltip
            title="Appliquer la substitution"
            content="Remplace la désignation détaillée de ces produits par le libellé d'assortiment sélectionné"
            category="Édition"
          >
            <button
              onClick={handleApplyToActiveCluster}
              className="w-full py-1.5 bg-[var(--action-primary)] hover:opacity-90 text-[var(--action-primary-fg)] rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Appliquer au groupe</span>
            </button>
          </ContextTooltip>
        </div>
      )}
    </aside>
  );
};
