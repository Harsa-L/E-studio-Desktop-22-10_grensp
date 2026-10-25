import { describe, expect, it, vi } from 'vitest';
import {
  applyCustomThemeTokens,
  applyThemeTokens,
  createCustomTheme,
  DENSITY_PRESETS,
  resolveThemeTokens,
  resolveCustomThemeTokens,
  parseCustomThemeJson,
  serializeCustomTheme,
  THEME_PRESETS,
  type DensityMode,
  type ThemeMode,
} from '../theme/themeEngine';

describe('theme engine', () => {
  it('resolves the semantic colors for every theme preset', () => {
    (Object.keys(THEME_PRESETS) as ThemeMode[]).forEach((mode) => {
      const tokens = resolveThemeTokens(mode);
      const preset = THEME_PRESETS[mode];

      expect(tokens).toMatchObject({
        '--studio-chrome': preset.shell,
        '--studio-paper': preset.paper,
        '--studio-workbench': preset.workbench,
        '--studio-ink': preset.ink,
        '--studio-accent': preset.accent,
      });
    });
  });

  it('resolves spacing and control sizes for every density preset', () => {
    (Object.keys(DENSITY_PRESETS) as DensityMode[]).forEach((density) => {
      const tokens = resolveThemeTokens('graphite', density);
      const preset = DENSITY_PRESETS[density];

      expect(tokens).toMatchObject({
        '--studio-spacing': preset.spacing,
        '--studio-panel-padding': preset.panelPadding,
        '--studio-input-height': preset.inputHeight,
        '--studio-font-scale': String(preset.fontScale),
      });
    });
  });

  it('applies E Ink as a light browser color scheme with the selected density', () => {
    const setProperty = vi.fn();
    const element = {
      style: { setProperty, colorScheme: '' },
      dataset: {} as Record<string, string>,
    } as unknown as HTMLElement;

    applyThemeTokens(element, 'eink_high_contrast', 'compact');

    expect(element.dataset).toMatchObject({ theme: 'eink_high_contrast', density: 'compact' });
    expect(element.style.colorScheme).toBe('light');
    expect(setProperty).toHaveBeenCalledWith('--studio-input-height', '30px');
  });

  it('round-trips a custom theme through the versioned JSON format', () => {
    const theme = createCustomTheme('Workshop', 'dark');
    theme.colors.accent = '#c65038';

    expect(parseCustomThemeJson(serializeCustomTheme(theme))).toEqual(theme);
    expect(resolveCustomThemeTokens(theme, 'comfortable')).toMatchObject({
      '--studio-accent': '#c65038',
      '--studio-input-height': '38px',
      '--studio-paper': theme.colors.paper,
    });
  });

  it('rejects malformed or unsafe custom theme colors', () => {
    const theme = createCustomTheme('Invalid');
    theme.colors.paper = 'url(javascript:alert(1))';

    expect(() => parseCustomThemeJson(JSON.stringify(theme))).toThrow(/version 1/);
  });

  it('rejects oversized theme JSON before parsing', () => {
    expect(() => parseCustomThemeJson(' '.repeat(65537))).toThrow(/smaller than 64 KB/);
  });

  it('applies custom tokens while retaining the base mode and theme identity', () => {
    const theme = createCustomTheme('Custom graphite', 'graphite');
    const element = {
      style: { setProperty: vi.fn(), colorScheme: '' },
      dataset: {} as Record<string, string>,
    } as unknown as HTMLElement;

    applyCustomThemeTokens(element, theme, 'compact');

    expect(element.dataset).toMatchObject({ theme: 'graphite', themeId: theme.id, density: 'compact' });
    expect(element.style.colorScheme).toBe('light');
  });
});