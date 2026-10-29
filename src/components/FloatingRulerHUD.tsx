import React, { useState, useEffect, useRef } from 'react';
import { Ruler, GripVertical, RotateCcw, X, Anchor } from 'lucide-react';
import { useTooltip, ContextTooltip } from '../context/TooltipContext';

interface FloatingRulerHUDProps {
  width_mm: number;
  height_mm: number;
  mousePosMm: { x_mm: number; y_mm: number } | null;
}

export const FloatingRulerHUD: React.FC<FloatingRulerHUDProps> = ({
  width_mm,
  height_mm,
  mousePosMm,
}) => {
  const { uiPreferences, updateUIPreferences, rulerSettings, updateRulerSettings } = useTooltip();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; hudX: number; hudY: number } | null>(null);

  const hudPos = uiPreferences?.hudPosition;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const hudEl = (e.currentTarget as HTMLElement).closest('.floating-hud-capsule') as HTMLElement;
    const rect = hudEl ? hudEl.getBoundingClientRect() : { left: window.innerWidth / 2 - 140, top: 68 };

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      hudX: hudPos ? hudPos.x : rect.left,
      hudY: hudPos ? hudPos.y : rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 280, dragStartRef.current.hudX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.hudY + dy));

      updateUIPreferences({ hudPosition: { x: newX, y: newY } });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateUIPreferences]);

  if (!rulerSettings?.showHud) return null;

  const style: React.CSSProperties = hudPos
    ? {
        position: 'fixed',
        left: `${hudPos.x}px`,
        top: `${hudPos.y}px`,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '68px', // Placed just under the top tools ribbon
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
      };

  return (
    <div
      className={`floating-hud-capsule bg-[var(--surface-panel)] text-[var(--content-primary)] backdrop-blur-md border border-[var(--border-subtle)] rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-3 text-xs font-mono tabular-nums select-none transition-all ${
        isDragging ? 'ring-2 ring-[var(--action-focus-ring)] cursor-grabbing scale-102' : ''
      }`}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Drag Handle */}
      <ContextTooltip title="Déplacer le HUD" content="Glisser-déposer pour placer le HUD n'importe où. Il s'ancrera automatiquement à cet endroit." category="HUD Règle">
        <button
          onMouseDown={handleMouseDown}
          className="p-1 text-[var(--content-muted)] hover:text-[var(--action-primary)] hover:bg-[var(--surface-hover)] rounded cursor-grab active:cursor-grabbing transition focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </ContextTooltip>

      <div className="flex items-center gap-1.5 text-[var(--action-primary)] font-bold">
        <Ruler className="w-3.5 h-3.5" />
        <span>HUD Règle</span>
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      <div className="flex items-center gap-2 text-[11px] text-[var(--content-secondary)]">
        <span>Taille: <strong className="text-[var(--content-primary)] tabular-nums">{width_mm} × {height_mm} mm</strong></span>
        {mousePosMm && (
          <span className="text-[var(--action-primary)] tabular-nums">
            Pos: <strong>X: {mousePosMm.x_mm}mm</strong>, <strong>Y: {mousePosMm.y_mm}mm</strong>
          </span>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      {/* Anchor Status & Reset Controls */}
      <div className="flex items-center gap-1.5">
        {hudPos ? (
          <ContextTooltip title="HUD Ancré à Position Personnalisée" content="Cliquez pour réinitialiser la position sous le ruban haut" category="HUD Règle">
            <button
              onClick={() => updateUIPreferences({ hudPosition: null })}
              className="p-1 px-2 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--content-primary)] rounded-lg transition flex items-center gap-1 text-[10px] border border-[var(--border-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
            >
              <Anchor className="w-3 h-3 text-[var(--action-primary)]" />
              <span>Ancré</span>
              <RotateCcw className="w-3 h-3 ml-0.5" />
            </button>
          </ContextTooltip>
        ) : (
          <span className="text-[10px] text-[var(--content-muted)] px-2 py-0.5 bg-[var(--surface-raised)] rounded-md border border-[var(--border-subtle)]">
            Sous Ruban
          </span>
        )}

        {/* Disable HUD Button */}
        <ContextTooltip title="Désactiver le HUD Flottant" content="Desactive uniquement le HUD. Les autres règles restent actives." category="HUD Règle">
          <button
            onClick={() => updateRulerSettings({ showHud: false })}
            className="p-1 hover:bg-rose-500/20 text-[var(--content-muted)] hover:text-rose-400 rounded-lg transition ml-0.5 focus-visible:ring-2 focus-visible:ring-[var(--action-focus-ring)] focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </ContextTooltip>
      </div>
    </div>
  );
};
