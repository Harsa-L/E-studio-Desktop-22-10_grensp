import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  FileSpreadsheet,
  CheckCircle2,
  Settings2,
  Sliders,
  Sparkles,
  Download,
  Eye,
  Layers,
  Zap,
  Tag,
  Maximize2
} from 'lucide-react';
import { ProductRecord, LabelTemplate, MultiSlotTemplate } from '../types';
import {
  DataDrivenTemplateEngine,
  BUILTIN_ASSIGNMENT_RULES,
} from '../utils/dataDrivenTemplateEngine';

interface MultiSlotSignageStudioProps {
  products: ProductRecord[];
  templates: LabelTemplate[];
  onUpdateProduct: (product: ProductRecord) => void;
  onSelectTemplateForCanvas: (template: LabelTemplate) => void;
}

// Built-in multi-slot templates (Dual dump bin, Tri-slot banner, Quad pallet)
const BUILTIN_MULTI_SLOT_TEMPLATES: MultiSlotTemplate[] = [
  {
    id: 'multi_dual_dump_bin',
    name: 'Panneau Bac Promo Double (A4 Paysage - 2 Slots)',
    page_size: 'A4',
    orientation: 'landscape',
    width_mm: 297,
    height_mm: 210,
    banner_title: 'OFFRES FLASH BAC SOLDEUR • QUANTITÉS LIMITÉES',
    banner_bg: '#dc2626',
    slots: [
      {
        id: 'slot_1',
        name: 'Emplacement Gauche (Slot #1)',
        x_mm: 12,
        y_mm: 25,
        w_mm: 132,
        h_mm: 170,
        highlight_color: '#f8fafc',
      },
      {
        id: 'slot_2',
        name: 'Emplacement Droite (Slot #2)',
        x_mm: 152,
        y_mm: 25,
        w_mm: 132,
        h_mm: 170,
        highlight_color: '#f8fafc',
      },
    ],
  },
  {
    id: 'multi_tri_island_banner',
    name: 'Banderole Îlot Central Tri-Produits (A3 Paysage - 3 Slots)',
    page_size: 'A3',
    orientation: 'landscape',
    width_mm: 420,
    height_mm: 297,
    banner_title: 'SÉLECTION TERROIR & DÉGUSTATION DU CHEF',
    banner_bg: '#0284c7',
    slots: [
      {
        id: 'slot_1',
        name: 'Slot #1 (Entrée)',
        x_mm: 15,
        y_mm: 35,
        w_mm: 120,
        h_mm: 245,
        highlight_color: '#ffffff',
      },
      {
        id: 'slot_2',
        name: 'Slot #2 (Plat)',
        x_mm: 150,
        y_mm: 35,
        w_mm: 120,
        h_mm: 245,
        highlight_color: '#ffffff',
      },
      {
        id: 'slot_3',
        name: 'Slot #3 (Dessert)',
        x_mm: 285,
        y_mm: 35,
        w_mm: 120,
        h_mm: 245,
        highlight_color: '#ffffff',
      },
    ],
  },
  {
    id: 'multi_quad_pallet',
    name: 'Signalétique Tête de Gondole 4 Quarts (A4 Portrait - 4 Slots)',
    page_size: 'A4',
    orientation: 'portrait',
    width_mm: 210,
    height_mm: 297,
    banner_title: 'PROMOTIONS RAYON FRAIS',
    banner_bg: '#059669',
    slots: [
      { id: 'slot_1', name: 'Haut Gauche', x_mm: 10, y_mm: 25, w_mm: 90, h_mm: 128, highlight_color: '#f8fafc' },
      { id: 'slot_2', name: 'Haut Droite', x_mm: 110, y_mm: 25, w_mm: 90, h_mm: 128, highlight_color: '#f8fafc' },
      { id: 'slot_3', name: 'Bas Gauche', x_mm: 10, y_mm: 160, w_mm: 90, h_mm: 128, highlight_color: '#f8fafc' },
      { id: 'slot_4', name: 'Bas Droite', x_mm: 110, y_mm: 160, w_mm: 90, h_mm: 128, highlight_color: '#f8fafc' },
    ],
  },
];

export const MultiSlotSignageStudio: React.FC<MultiSlotSignageStudioProps> = ({
  products,
  templates,
  onUpdateProduct,
  onSelectTemplateForCanvas,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'multi_slot' | 'rules_assignment'>('multi_slot');

  // Selected Multi-slot layout template
  const [selectedMultiTemplate, setSelectedMultiTemplate] = useState<MultiSlotTemplate>(
    BUILTIN_MULTI_SLOT_TEMPLATES[0]
  );

  // Slot to Product assignments: { [slot_id: string]: product_id }
  const [slotBindings, setSlotBindings] = useState<{ [slot_id: string]: string }>({
    slot_1: products[0]?.id || '',
    slot_2: products[1]?.id || '',
    slot_3: products[2]?.id || '',
    slot_4: products[3]?.id || '',
  });

  // Assign product to slot
  const handleAssignProductToSlot = (slotId: string, productId: string) => {
    setSlotBindings((prev) => ({
      ...prev,
      [slotId]: productId,
    }));
  };

  // Automated template assignments per product
  const templateResolutionResults = useMemo(() => {
    return products.map((prod) => {
      const res = DataDrivenTemplateEngine.resolveTemplateForProduct(prod, templates);
      return {
        product: prod,
        ...res,
      };
    });
  }, [products, templates]);

  // Scale factor for preview canvas
  const previewScale = selectedMultiTemplate.page_size === 'A3' ? 1.6 : 2.2;

  return (
    <div className="flex-1 bg-[var(--surface-base)] text-[var(--content-primary)] flex flex-col overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[var(--surface-panel)] border-b border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--content-primary)]">
                Gabarits Multi-Articles & Attribution par Règles Métier
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                Multi-Slot Engine
              </span>
            </div>
            <p className="text-xs text-[var(--content-muted)]">
              Signalétique multi-emplacements (bacs soldeurs, îlots) et attribution automatique de gabarits selon les attributs produits
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex rounded-xl border border-[var(--border-subtle)] p-1 bg-[var(--surface-raised)]">
          <button
            type="button"
            onClick={() => setActiveSubTab('multi_slot')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              activeSubTab === 'multi_slot'
                ? 'bg-[var(--surface-panel)] shadow-xs text-emerald-400'
                : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Signalétique Multi-Slots (Bac Soldeur)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('rules_assignment')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none ${
              activeSubTab === 'rules_assignment'
                ? 'bg-[var(--surface-panel)] shadow-xs text-[var(--action-primary)]'
                : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Règles d'Attribution Automatique ({BUILTIN_ASSIGNMENT_RULES.length})</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Multi-Slot Signage */}
      {activeSubTab === 'multi_slot' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Configuration & Slot Bindings */}
          <div className="w-96 bg-[var(--surface-panel)] border-r border-[var(--border-subtle)] flex flex-col overflow-y-auto p-5 space-y-5 text-[var(--content-primary)]">
            <div>
              <label className="block font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider mb-2">
                Gabarit Multi-Slots Sélectionné
              </label>
              <div className="space-y-2">
                {BUILTIN_MULTI_SLOT_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedMultiTemplate(tpl)}
                    className={`p-3 rounded-xl border cursor-pointer transition text-xs ${
                      selectedMultiTemplate.id === tpl.id
                        ? 'bg-emerald-500/10 border-emerald-500 font-bold text-emerald-400'
                        : 'bg-[var(--surface-raised)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[var(--content-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tpl.name}</span>
                      <span className="font-mono text-[10px] bg-[var(--surface-panel)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] tabular-nums">
                        {tpl.slots.length} Slots
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner Header Config */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <label className="block font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider">
                Bandeau Supérieur (En-tête Îlot)
              </label>
              <input
                type="text"
                value={selectedMultiTemplate.banner_title || ''}
                onChange={(e) =>
                  setSelectedMultiTemplate({
                    ...selectedMultiTemplate,
                    banner_title: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--content-primary)] focus:border-[var(--action-focus-ring)] focus:outline-none"
              />
            </div>

            {/* Per-Slot Product Selector Grid */}
            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider">
                  Affectation des Articles par Emplacement
                </label>
              </div>

              {selectedMultiTemplate.slots.map((slot, sIdx) => {
                const boundProdId = slotBindings[slot.id];
                const boundProd = products.find((p) => p.id === boundProdId);

                return (
                  <div
                    key={slot.id}
                    className="p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--content-primary)] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold tabular-nums">
                          {sIdx + 1}
                        </span>
                        {slot.name}
                      </span>
                      <span className="text-[10px] text-[var(--content-muted)] font-mono tabular-nums">
                        {slot.w_mm}x{slot.h_mm} mm
                      </span>
                    </div>

                    <select
                      value={boundProdId || ''}
                      onChange={(e) => handleAssignProductToSlot(slot.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--content-primary)] focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Emplacement Vide --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.ITEMNAME} ({p.SELLING_PRICE} €)
                        </option>
                      ))}
                    </select>

                    {boundProd && (
                      <div className="p-2 bg-[var(--surface-panel)] rounded-lg border border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--content-secondary)] truncate">{boundProd.PARTNO || 'SKU'}</span>
                        <span className="font-bold text-emerald-400 tabular-nums font-mono">{boundProd.SELLING_PRICE} €</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Interactive Sheet Canvas Live Preview */}
          <div className="flex-1 bg-[var(--canvas-pasteboard)] p-8 flex flex-col items-center justify-center overflow-auto">
            <div className="mb-2 text-xs font-medium text-[var(--content-muted)] flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="font-mono tabular-nums">
                Aperçu de la Feuille Physique Composite ({selectedMultiTemplate.page_size} • {selectedMultiTemplate.width_mm} × {selectedMultiTemplate.height_mm} mm)
              </span>
            </div>

            {/* Composite Sheet Container */}
            <div
              className="bg-white shadow-2xl relative border border-slate-300 select-none overflow-hidden"
              style={{
                width: `${selectedMultiTemplate.width_mm * previewScale}px`,
                height: `${selectedMultiTemplate.height_mm * previewScale}px`,
              }}
            >
              {/* Top Banner */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center text-white font-extrabold uppercase tracking-wider px-4"
                style={{
                  height: `${20 * previewScale}px`,
                  backgroundColor: selectedMultiTemplate.banner_bg || '#dc2626',
                  fontSize: `${11 * (previewScale / 2)}px`,
                }}
              >
                {selectedMultiTemplate.banner_title}
              </div>

              {/* Render Slots */}
              {selectedMultiTemplate.slots.map((slot, idx) => {
                const boundProdId = slotBindings[slot.id];
                const prod = products.find((p) => p.id === boundProdId);

                return (
                  <div
                    key={slot.id}
                    className="absolute border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs transition"
                    style={{
                      left: `${slot.x_mm * previewScale}px`,
                      top: `${slot.y_mm * previewScale}px`,
                      width: `${slot.w_mm * previewScale}px`,
                      height: `${slot.h_mm * previewScale}px`,
                      backgroundColor: slot.highlight_color || '#ffffff',
                    }}
                  >
                    {prod ? (
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              SLOT #{idx + 1} • {prod.STORE_NAME || 'SUPERMARCHÉ'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {prod.CATEGORY_NAME || 'PRODUIT'}
                            </span>
                          </div>
                          <h4
                            className="font-extrabold text-slate-900 mt-2 line-clamp-2"
                            style={{ fontSize: `${12 * (previewScale / 2)}px` }}
                          >
                            {prod.custom_name_override || prod.ITEMNAME}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {prod.ITEMDESCRIPTION || 'Qualité supérieure certifiée'}
                          </p>
                        </div>

                        {/* Price & Barcode Zone */}
                        <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                          <div>
                            <div className="font-mono text-[9px] text-slate-400">
                              EAN: {prod.PRODUCT_SCAN || '—'}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {prod.UNIT_PRICE_TEXT || `${prod.SELLING_PRICE} € / unité`}
                            </div>
                          </div>
                          <div className="text-right">
                            {prod.PROMOPRICE ? (
                              <div>
                                <span className="text-[10px] line-through text-slate-400 mr-1.5 font-bold tabular-nums">
                                  {prod.SELLING_PRICE} €
                                </span>
                                <span
                                  className="font-black text-rose-600 font-mono tabular-nums"
                                  style={{ fontSize: `${20 * (previewScale / 2)}px` }}
                                >
                                  {prod.PROMOPRICE} €
                                </span>
                              </div>
                            ) : (
                              <span
                                className="font-black text-slate-900 font-mono tabular-nums"
                                style={{ fontSize: `${20 * (previewScale / 2)}px` }}
                              >
                                {prod.SELLING_PRICE} €
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                        <span className="text-xs font-bold">Emplacement #{idx + 1} Vide</span>
                        <span className="text-[10px]">Sélectionnez un article dans le panneau gauche</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Data-Driven Rules Assignment */}
      {activeSubTab === 'rules_assignment' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rules Summary Card */}
          <div className="bg-[var(--surface-panel)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--action-primary)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--content-primary)]">
                    Règles d'Attribution Automatiques de Gabarits (Data-Driven Assignment)
                  </h3>
                  <p className="text-xs text-[var(--content-muted)]">
                    Le système évalue les caractéristiques de chaque article (promotion, paliers de prix, département marée) pour assigner le bon gabarit sans intervention humaine
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUILTIN_ASSIGNMENT_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--content-primary)]">{rule.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono text-[10px] font-bold tabular-nums">
                      Prio: {rule.priority}
                    </span>
                  </div>
                  <p className="text-[var(--content-secondary)] text-[11px]">{rule.description}</p>
                  <div className="pt-2 border-t border-[var(--border-subtle)] font-semibold text-[var(--action-primary)] text-[11px]">
                    Gabarit cible: {rule.targetTemplateName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Assignment Table with Overrides */}
          <div className="bg-[var(--surface-panel)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--content-muted)]" />
                <h3 className="text-sm font-bold text-[var(--content-primary)] tabular-nums">
                  Résolution & Dérogations Manuelles par Article ({products.length})
                </h3>
              </div>
            </div>

            <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[var(--surface-raised)] text-[var(--content-muted)] font-semibold border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3">Critères Détectés</th>
                    <th className="p-3">Règle Résolue</th>
                    <th className="p-3">Gabarit Assigné</th>
                    <th className="p-3">Forcer Dérogation (Override)</th>
                    <th className="p-3">Copies Forcées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {templateResolutionResults.map((row) => {
                    const p = row.product;
                    const hasPromo = !!p.PROMOPRICE || !!p.DISCOUNT_PCT;
                    const hasTiers = (p.price_tiers && p.price_tiers.length > 1) || (p.TIERS && p.TIERS.length > 0);
                    const isSeafood = (p.DEPT_NAME || '').toLowerCase().includes('marée') || (p.CATEGORY_NAME || '').toLowerCase().includes('poisson');

                    return (
                      <tr key={p.id} className="hover:bg-[var(--surface-hover)] transition">
                        <td className="p-3">
                          <span className="font-bold text-[var(--content-primary)] block">{p.ITEMNAME}</span>
                          <span className="text-[10px] text-[var(--content-muted)] font-mono tabular-nums">
                            {p.PARTNO || p.id} • {p.SELLING_PRICE} €
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {hasPromo && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                                Promo
                              </span>
                            )}
                            {hasTiers && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px] font-bold">
                                Paliers Dégressifs
                              </span>
                            )}
                            {isSeafood && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 text-[10px] font-bold">
                                Marée / Pêche
                              </span>
                            )}
                            {!hasPromo && !hasTiers && !isSeafood && (
                              <span className="text-[var(--content-muted)] text-[10px]">Standard</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-[var(--content-secondary)]">{row.appliedRuleName}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-[var(--action-primary)] bg-[var(--action-primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--action-primary)]/20">
                            {row.matchedTemplate.name}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={p.assigned_template || ''}
                            onChange={(e) => {
                              onUpdateProduct({
                                ...p,
                                assigned_template: e.target.value || undefined,
                              });
                            }}
                            className="px-2 py-1 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--content-primary)] focus:border-[var(--action-focus-ring)] focus:outline-none"
                          >
                            <option value="">Automatique (Règle Métier)</option>
                            {templates.map((tpl) => (
                              <option key={tpl.name} value={tpl.name}>
                                Forcer: {tpl.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            placeholder="1"
                            value={p.forced_copies || ''}
                            onChange={(e) => {
                              onUpdateProduct({
                                ...p,
                                forced_copies: parseInt(e.target.value) || undefined,
                              });
                            }}
                            className="w-16 px-2 py-1 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-lg text-xs font-mono font-bold tabular-nums text-[var(--content-primary)] focus:border-[var(--action-focus-ring)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
