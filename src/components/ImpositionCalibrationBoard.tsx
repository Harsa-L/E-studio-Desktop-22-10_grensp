import React, { useState, useRef, useMemo } from 'react';
import {
  Compass,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Maximize2,
  Grid,
  Download,
  FolderOpen,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileCode,
  Layers,
  Settings2
} from 'lucide-react';
import {
  ImpositionConfig,
  ImpositionCalculation,
  BlueprintOverlayConfig,
  SlotNudgeOffset,
  ImpositionPreset,
  ProductRecord,
  LabelTemplate
} from '../types';
import { ImpositionCalculator } from '../utils/impositionCalculator';
import {
  BUILTIN_IMPOSITION_PRESETS,
  ImpositionPresetsManager,
} from '../utils/impositionPresets';

interface ImpositionCalibrationBoardProps {
  template: LabelTemplate;
  products: ProductRecord[];
  impositionConfig: ImpositionConfig;
  onUpdateImpositionConfig: (newConfig: ImpositionConfig) => void;
}

export const ImpositionCalibrationBoard: React.FC<ImpositionCalibrationBoardProps> = ({
  template,
  products,
  impositionConfig,
  onUpdateImpositionConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Selected slot index for micro-nudging
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [nudgeStepMm, setNudgeStepMm] = useState<number>(0.2); // 0.1, 0.2, 0.5, 1.0 mm

  // Blueprint overlay state initialized from config or defaults
  const [blueprint, setBlueprint] = useState<BlueprintOverlayConfig>(
    impositionConfig.blueprint_overlay || {
      image_url: null,
      opacity: 0.45,
      visible: true,
      scale_pct: 100,
      offset_x_mm: 0,
      offset_y_mm: 0,
      locked: true,
    }
  );

  // Slot nudges map
  const [slotNudges, setSlotNudges] = useState<SlotNudgeOffset>(
    impositionConfig.slot_nudges || {}
  );

  // Snap grid size (mm)
  const [snapGridMm, setSnapGridMm] = useState<number>(
    impositionConfig.snap_grid_mm || 0.5
  );

  // Calculate physical imposition grid
  const imposition: ImpositionCalculation = useMemo(() => {
    return ImpositionCalculator.calculate(
      template.width_mm,
      template.height_mm,
      template.outer_margins_mm,
      impositionConfig
    );
  }, [template, impositionConfig]);

  // Save changes to parent
  const syncToParent = (
    newBp = blueprint,
    newNudges = slotNudges,
    newSnap = snapGridMm
  ) => {
    onUpdateImpositionConfig({
      ...impositionConfig,
      blueprint_overlay: newBp,
      slot_nudges: newNudges,
      snap_grid_mm: newSnap,
    });
  };

  // Blueprint File Upload
  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const updated: BlueprintOverlayConfig = {
        ...blueprint,
        image_url: url,
        visible: true,
      };
      setBlueprint(updated);
      syncToParent(updated);
    };
    reader.readAsDataURL(file);
  };

  // Nudge individual slot
  const handleNudgeSlot = (dx: number, dy: number) => {
    if (selectedSlotIndex === null) return;
    const current = slotNudges[selectedSlotIndex] || { nudge_x_mm: 0, nudge_y_mm: 0 };
    const updatedNudges: SlotNudgeOffset = {
      ...slotNudges,
      [selectedSlotIndex]: {
        nudge_x_mm: parseFloat((current.nudge_x_mm + dx).toFixed(2)),
        nudge_y_mm: parseFloat((current.nudge_y_mm + dy).toFixed(2)),
      },
    };
    setSlotNudges(updatedNudges);
    syncToParent(blueprint, updatedNudges);
  };

  // Reset nudge for current slot
  const handleResetSlotNudge = () => {
    if (selectedSlotIndex === null) return;
    const updated = { ...slotNudges };
    delete updated[selectedSlotIndex];
    setSlotNudges(updated);
    syncToParent(blueprint, updated);
  };

  // Load a built-in preset
  const handleApplyPreset = (preset: ImpositionPreset) => {
    onUpdateImpositionConfig({
      ...preset.config,
      blueprint_overlay: preset.blueprint,
      slot_nudges: preset.slot_nudges,
      snap_grid_mm: preset.snap_grid_mm,
    });
    if (preset.blueprint) setBlueprint(preset.blueprint);
    if (preset.slot_nudges) setSlotNudges(preset.slot_nudges);
    if (preset.snap_grid_mm) setSnapGridMm(preset.snap_grid_mm);
  };

  // Export Decoupled Preset to JSON file
  const handleExportDecoupledPreset = () => {
    const currentPreset: ImpositionPreset = {
      id: `PRESET_CALIBRATED_${impositionConfig.page_size}_${Date.now()}`,
      name: `Preset Calibré ${impositionConfig.page_size} (${template.width_mm}x${template.height_mm}mm)`,
      description: 'Carte spatiale d\'imposition micro-calibrée découplée du catalogue produit.',
      config: impositionConfig,
      blueprint,
      slot_nudges: slotNudges,
      snap_grid_mm: snapGridMm,
    };
    ImpositionPresetsManager.downloadPresetFile(currentPreset);
  };

  // Import Decoupled Preset from JSON file
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const preset = ImpositionPresetsManager.parsePresetJson(text);
        handleApplyPreset(preset);
      } catch (err: any) {
        console.error(`Erreur d'importation JSON : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Canvas visual scaling
  const canvasScale = imposition.page_w_mm > 300 ? 1.4 : 1.75;

  return (
    <div className="flex-1 bg-[var(--surface-base)] text-[var(--content-primary)] flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="bg-[var(--surface-panel)] border-b border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--content-primary)]">
                Calibration d'Imposition sur Papier Pré-Imprimé
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                Blueprint Layer v2.0
              </span>
            </div>
            <p className="text-xs text-[var(--content-muted)]">
              Incrustation de calque d'arrière-plan, alignement millimétrique individuel de poses et export de presets découplés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => jsonImportRef.current?.click()}
            className="px-3 py-1.5 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--content-primary)] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
          >
            <FolderOpen className="w-4 h-4 text-[var(--content-muted)]" />
            <span>Importer Preset JSON</span>
          </button>
          <input
            ref={jsonImportRef}
            type="file"
            accept=".json"
            onChange={handleImportJsonFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportDecoupledPreset}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Preset Découplé (.json)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Drawer */}
        <div className="w-96 bg-[var(--surface-panel)] border-r border-[var(--border-subtle)] flex flex-col overflow-y-auto p-5 space-y-5 text-[var(--content-primary)]">
          {/* Preset Library Quick Switcher */}
          <div>
            <label className="block font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider mb-2">
              Bibliothèque de Presets d'Imposition
            </label>
            <div className="space-y-1.5">
              {BUILTIN_IMPOSITION_PRESETS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:border-amber-400 hover:bg-[var(--surface-hover)] cursor-pointer transition text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[var(--content-primary)] block truncate">{p.name}</span>
                    <span className="text-[10px] text-[var(--content-muted)] block truncate">{p.description}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-[var(--surface-raised)] text-[var(--content-secondary)] px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                    {p.config.page_size}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Blueprint Background Overlay Controls */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Calque Blueprint Arrière-Plan</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...blueprint, visible: !blueprint.visible };
                  setBlueprint(updated);
                  syncToParent(updated);
                }}
                className={`p-1 rounded transition ${
                  blueprint.visible ? 'text-amber-400 bg-amber-500/15' : 'text-[var(--content-muted)] hover:bg-[var(--surface-hover)]'
                }`}
                title="Afficher/Masquer le calque blueprint"
              >
                {blueprint.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-[var(--content-muted)] leading-tight">
              Chargez un scan ou tracé vectoriel du papier à en-tête / planche pré-perforée pour calibrer les marges et zones réservées.
            </p>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleBlueprintUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--content-primary)] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>{blueprint.image_url ? 'Changer l\'image blueprint' : 'Charger l\'image du papier pré-imprimé'}</span>
            </button>

            {blueprint.image_url && (
              <div className="space-y-3 pt-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--content-primary)] mb-1">
                    <span>Opacité du calque</span>
                    <span className="font-mono text-amber-400 tabular-nums">{Math.round(blueprint.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={blueprint.opacity}
                    onChange={(e) => {
                      const updated = { ...blueprint, opacity: parseFloat(e.target.value) };
                      setBlueprint(updated);
                      syncToParent(updated);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Scale & X/Y Offsets */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--content-muted)] font-medium block mb-0.5">Échelle (%)</span>
                    <input
                      type="number"
                      min="50"
                      max="200"
                      value={blueprint.scale_pct}
                      onChange={(e) => {
                        const updated = { ...blueprint, scale_pct: parseInt(e.target.value) || 100 };
                        setBlueprint(updated);
                        syncToParent(updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded text-xs font-mono tabular-nums text-[var(--content-primary)]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--content-muted)] font-medium block mb-0.5">Verrouiller</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...blueprint, locked: !blueprint.locked };
                        setBlueprint(updated);
                        syncToParent(updated);
                      }}
                      className={`w-full py-1 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1 ${
                        blueprint.locked
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] text-[var(--content-secondary)]'
                      }`}
                    >
                      {blueprint.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{blueprint.locked ? 'Verrouillé' : 'Libre'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Individual Slot Micro-Nudge & Alignment */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>Micro-Alignement de Pose (Nudge)</span>
              </label>
              {selectedSlotIndex !== null && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px] font-mono font-bold tabular-nums">
                  Pose #{selectedSlotIndex + 1}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[var(--content-muted)] leading-tight">
              Ajustez au dixième de millimètre le positionnement d'une étiquette spécifique pour compenser les tolérances du massicot ou de l'imprimante.
            </p>

            {/* Step size selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--content-secondary)]">Pas de déplacement :</span>
              <div className="flex rounded-lg border border-[var(--border-subtle)] p-0.5 bg-[var(--surface-raised)]">
                {[0.1, 0.2, 0.5, 1.0].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setNudgeStepMm(step)}
                    className={`px-2 py-0.5 text-[10px] font-mono tabular-nums rounded font-bold transition ${
                      nudgeStepMm === step
                        ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] shadow-xs'
                        : 'text-[var(--content-secondary)] hover:text-[var(--content-primary)]'
                    }`}
                  >
                    ±{step}mm
                  </button>
                ))}
              </div>
            </div>

            {/* D-Pad Nudge Controls */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl p-3 flex flex-col items-center space-y-1.5">
              <button
                type="button"
                onClick={() => handleNudgeSlot(0, -nudgeStepMm)}
                className="w-9 h-8 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg shadow-xs flex items-center justify-center text-[var(--content-primary)]"
                title="Déplacer vers le haut"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNudgeSlot(-nudgeStepMm, 0)}
                  className="w-9 h-8 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg shadow-xs flex items-center justify-center text-[var(--content-primary)]"
                  title="Déplacer vers la gauche"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-16 h-8 bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-lg flex items-center justify-center text-[10px] font-mono tabular-nums font-bold text-[var(--content-primary)]">
                  {selectedSlotIndex !== null && slotNudges[selectedSlotIndex]
                    ? `${slotNudges[selectedSlotIndex].nudge_x_mm > 0 ? '+' : ''}${slotNudges[selectedSlotIndex].nudge_x_mm} / ${slotNudges[selectedSlotIndex].nudge_y_mm > 0 ? '+' : ''}${slotNudges[selectedSlotIndex].nudge_y_mm}`
                    : '0.0 / 0.0'}
                </div>
                <button
                  type="button"
                  onClick={() => handleNudgeSlot(nudgeStepMm, 0)}
                  className="w-9 h-8 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg shadow-xs flex items-center justify-center text-[var(--content-primary)]"
                  title="Déplacer vers la droite"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleNudgeSlot(0, nudgeStepMm)}
                className="w-9 h-8 bg-[var(--surface-panel)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg shadow-xs flex items-center justify-center text-[var(--content-primary)]"
                title="Déplacer vers le bas"
              >
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetSlotNudge}
                className="text-[10px] font-semibold text-[var(--content-muted)] hover:text-[var(--content-primary)] flex items-center gap-1 pt-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser cette pose</span>
              </button>
            </div>
          </div>

          {/* Section 3: Precision Grid Snapping */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[var(--content-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-[var(--content-muted)]" />
                <span>Magnétisme de Grille (Grid Snapping)</span>
              </label>
              <span className="text-xs font-mono tabular-nums font-bold text-[var(--content-primary)]">{snapGridMm} mm</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.1, 0.5, 1.0, 5.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSnapGridMm(val);
                    syncToParent(blueprint, slotNudges, val);
                  }}
                  className={`py-1 rounded-lg border text-xs font-mono tabular-nums font-bold transition ${
                    snapGridMm === val
                      ? 'bg-[var(--action-primary)] text-[var(--action-primary-fg)] border-transparent'
                      : 'bg-[var(--surface-panel)] text-[var(--content-secondary)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {val} mm
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Positioning Board (Full Bleed Layout Canvas) */}
        <div className="flex-1 bg-[var(--canvas-pasteboard)] p-8 flex flex-col items-center justify-center overflow-auto select-none">
          <div className="mb-2 text-xs font-medium text-[var(--content-muted)] flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-amber-500" />
            <span className="tabular-nums font-mono">
              Planche Physique {impositionConfig.page_size} ({imposition.page_w_mm} × {imposition.page_h_mm} mm) • Cliquez sur une étiquette pour ajuster son micro-alignement
            </span>
          </div>

          {/* Physical Sheet Container */}
          <div
            className="bg-white shadow-2xl relative border border-slate-300 overflow-hidden"
            style={{
              width: `${imposition.page_w_mm * canvasScale}px`,
              height: `${imposition.page_h_mm * canvasScale}px`,
            }}
          >
            {/* Blueprint Background Overlay Image */}
            {blueprint.visible && blueprint.image_url && (
              <div
                className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                style={{
                  opacity: blueprint.opacity,
                  transform: `scale(${blueprint.scale_pct / 100}) translate(${blueprint.offset_x_mm}mm, ${blueprint.offset_y_mm}mm)`,
                  transformOrigin: 'top left',
                }}
              >
                <img
                  src={blueprint.image_url}
                  alt="Blueprint pre-printed background"
                  className="w-full h-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Grid Overlay Guides */}
            <div
              className="absolute inset-0 pointer-events-none z-1"
              style={{
                backgroundImage: `radial-gradient(#94a3b8 0.75px, transparent 0.75px)`,
                backgroundSize: `${snapGridMm * 5 * canvasScale}px ${snapGridMm * 5 * canvasScale}px`,
                opacity: 0.35,
              }}
            />

            {/* Slots Grid */}
            {Array.from({ length: imposition.total_per_page }).map((_, slotIdx) => {
              const prod = products[slotIdx];

              const nudge = slotNudges[slotIdx] || { nudge_x_mm: 0, nudge_y_mm: 0 };
              const { x_mm: finalX, y_mm: finalY } =
                ImpositionCalculator.getSlotPosition(imposition, {
                  ...impositionConfig,
                  slot_nudges: slotNudges,
                }, slotIdx);

              const isSelected = selectedSlotIndex === slotIdx;
              const hasNudge = nudge.nudge_x_mm !== 0 || nudge.nudge_y_mm !== 0;

              return (
                <div
                  key={slotIdx}
                  onClick={() => setSelectedSlotIndex(slotIdx)}
                  className={`absolute border flex flex-col justify-between p-1.5 cursor-pointer transition z-10 ${
                    isSelected
                      ? 'border-2 border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/70'
                      : hasNudge
                      ? 'border-amber-400 bg-amber-50/50'
                      : 'border-slate-300 bg-white/90 hover:border-slate-400'
                  }`}
                  style={{
                    left: `${finalX * canvasScale}px`,
                    top: `${finalY * canvasScale}px`,
                    width: `${template.width_mm * canvasScale}px`,
                    height: `${template.height_mm * canvasScale}px`,
                  }}
                  title={`Pose #${slotIdx + 1} • X: ${finalX.toFixed(1)}mm, Y: ${finalY.toFixed(1)}mm`}
                >
                  <div className="flex items-center justify-between text-[8px] font-bold">
                    <span className="truncate text-slate-800">
                      {prod ? prod.ITEMNAME : `Pose #${slotIdx + 1}`}
                    </span>
                    {hasNudge && (
                      <span className="text-[7px] font-mono tabular-nums text-amber-700 bg-amber-100 px-1 rounded">
                        Δ {nudge.nudge_x_mm}/{nudge.nudge_y_mm}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono tabular-nums">
                    <span>Pose #{slotIdx + 1}</span>
                    <span>{prod ? `${prod.SELLING_PRICE} €` : `${template.width_mm}x${template.height_mm}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
