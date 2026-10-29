import {
  THEME_DEFINITIONS,
  THEME_PRESETS,
  DENSITY_PRESETS,
  type ThemeId,
  type ThemeMode,
  type DensityMode,
  type SemanticColorTokens,
} from '../../theme/themeEngine';

export const designTokens = {
  // Palette and Themes
  definitions: THEME_DEFINITIONS,
  presets: THEME_PRESETS,
  density: DENSITY_PRESETS,

  // Fallback Raw Color Tokens (aligned with Graphite Studio)
  color: {
    brand: '#6ea8fe',
    brandHover: '#8bb9ff',
    brandPressed: '#4d8deb',
    brandStrong: '#245fd6',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#7db7ff',
    neutral: '#aab3c2',
    background: '#111318',
    surface: '#191c23',
    surfaceRaised: '#232833',
    surfaceHover: '#2b3444',
    surfaceInput: '#111318',
    border: '#343b49',
    borderSubtle: '#2b3039',
    borderStrong: '#596578',
    text: '#f0f3f8',
    textSecondary: '#aab3c2',
    muted: '#8c96a6',
    selection: '#78a9ff',
  },

  // Desktop Spacing Scale (4px increments)
  spacing: {
    none: '0px',
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
    huge: '40px',
    giant: '48px',
  },

  // Desktop Component Radii
  radius: {
    none: '0px',
    xs: '3px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },

  // Typography Scales
  typography: {
    fontUi: 'Inter, "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontDocument: 'Arial, Helvetica, sans-serif',
    fontMono: '"JetBrains Mono", SFMono-Regular, Consolas, monospace',
    fontSize: {
      xxs: '10px',
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '22px',
      title: '28px',
    },
  },

  // Canvas Rulers, Guides, & Overlays
  canvas: {
    pasteboardDark: '#282d37',
    pasteboardLight: '#e6e9ef',
    pageDefault: '#ffffff',
    guideSnap: '#36cfc9',
    guideAlignment: '#ff7a59',
    printBleed: '#d946ef',
    printTrim: '#f97316',
    printSafeArea: '#22c55e',
    selectionStroke: '#78a9ff',
    selectionHandleStroke: '#245fd6',
  },

  // Motion & Easing
  motion: {
    fast: '90ms cubic-bezier(0.2, 0, 0, 1)',
    ui: '150ms cubic-bezier(0.2, 0, 0, 1)',
    panel: '200ms cubic-bezier(0.2, 0, 0, 1)',
  },

  // Elevations & Shadows
  shadow: {
    subtle: '0 2px 6px rgb(0 0 0 / 12%)',
    menu: '0 8px 24px rgb(0 0 0 / 22%), 0 2px 6px rgb(0 0 0 / 8%)',
    dialog: '0 20px 60px rgb(0 0 0 / 32%), 0 4px 16px rgb(0 0 0 / 12%)',
  },
};

export type { ThemeId, ThemeMode, DensityMode, SemanticColorTokens };
