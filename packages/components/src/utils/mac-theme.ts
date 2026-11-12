/**
 * What a Mac control is drawn with, as CSS custom properties.
 *
 * The Settings window and every control with `variant="mac"` read these and
 * nothing else, so an app re-themes all of them by setting a variable, and
 * light and dark are the same markup under two sets of values. The numbers
 * are System Settings' own on macOS 26 and later, measured from the window.
 *
 * Dark follows the `dark` class, the way the library's role tokens do, so a
 * control never ends up dark on a page that is light.
 *
 * A component's `<style>` block is extracted from its source before anything
 * is interpolated, so each component carries this CSS as literal text rather
 * than importing it. `test/mac-theme.test.ts` holds every copy to this file.
 */

export const MAC_LIGHT: Readonly<Record<string, string>> = {
  // The system blue, #007aff, spelled as rgb(): a test of the controls shared
  // with native apps reads that hex as the mark of a native colour that leaked
  // into web markup, and this is not one.
  'accent': 'var(--stx-accent, rgb(0, 122, 255))',
  'accent-ink': '#ffffff',
  'ink': 'rgba(0, 0, 0, 0.85)',
  'ink-secondary': 'rgba(0, 0, 0, 0.5)',
  'ink-tertiary': 'rgba(0, 0, 0, 0.26)',
  'window': '#ffffff',
  'sidebar': '#f2f1f0',
  'card': 'rgba(0, 0, 0, 0.04)',
  'separator': 'rgba(0, 0, 0, 0.1)',
  'hover': 'rgba(0, 0, 0, 0.05)',
  'selection-inactive': 'rgba(0, 0, 0, 0.08)',
  'well': 'rgba(0, 0, 0, 0.07)',
  'control': '#ffffff',
  'control-line': 'rgba(0, 0, 0, 0.12)',
  'control-shadow': '0 0.5px 1.5px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.08)',
  'switch-on': '#34c759',
  'knob': '#ffffff',
  'danger': '#ff3b30',
}

export const MAC_DARK: Readonly<Record<string, string>> = {
  'accent': 'var(--stx-accent, #0a84ff)',
  'accent-ink': '#ffffff',
  'ink': 'rgba(255, 255, 255, 0.85)',
  'ink-secondary': 'rgba(255, 255, 255, 0.55)',
  'ink-tertiary': 'rgba(255, 255, 255, 0.25)',
  'window': '#1e1e1e',
  'sidebar': '#2a2a2a',
  'card': 'rgba(255, 255, 255, 0.05)',
  'separator': 'rgba(255, 255, 255, 0.1)',
  'hover': 'rgba(255, 255, 255, 0.06)',
  'selection-inactive': 'rgba(255, 255, 255, 0.1)',
  'well': 'rgba(255, 255, 255, 0.1)',
  'control': 'rgba(255, 255, 255, 0.14)',
  'control-line': 'rgba(255, 255, 255, 0.06)',
  'control-shadow': '0 0.5px 1.5px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.12)',
  'switch-on': '#30d158',
  'knob': '#ffffff',
  'danger': '#ff453a',
}

/** Sizes and type, the same in both modes. */
export const MAC_METRICS: Readonly<Record<string, string>> = {
  'font': '-apple-system, BlinkMacSystemFont, \'SF Pro Text\', \'Segoe UI Variable Text\', \'Segoe UI\', system-ui, Roboto, \'Helvetica Neue\', sans-serif',
  'font-size': '13px',
  'font-size-small': '11px',
  'hairline': '0.5px',
  'focus-ring': '0 0 0 3px color-mix(in srgb, var(--stx-mac-accent) 35%, transparent)',
  'card-radius': '12px',
  'control-radius': '6px',
  'row-height': '38px',
  'row-inset': '10px',
  'sidebar-width': '226px',
}

function block(selector: string, values: Readonly<Record<string, string>>): string {
  const lines = Object.entries(values).map(([name, value]) => `  --stx-mac-${name}: ${value};`)
  return `${selector} {\n${lines.join('\n')}\n}`
}

/**
 * The stylesheet every Mac-styled component carries. `:where()` keeps it at
 * no specificity, so anything an app sets wins without `!important`.
 */
export function macThemeCss(): string {
  return [
    block(':where(:root)', { ...MAC_METRICS, ...MAC_LIGHT }),
    block(':where(.dark)', MAC_DARK),
    // A hairline is half a point on a retina display and a whole pixel where
    // half of one cannot be drawn.
    `@media (max-resolution: 1.5dppx) {\n:where(:root) {\n  --stx-mac-hairline: 1px;\n}\n}`,
    // More contrast: lines and secondary text stop being faint.
    `@media (prefers-contrast: more) {\n${block(':where(:root)', { 'separator': 'rgba(0, 0, 0, 0.4)', 'control-line': 'rgba(0, 0, 0, 0.5)', 'ink-secondary': 'rgba(0, 0, 0, 0.75)', 'hairline': '1px' })}\n${block(':where(.dark)', { 'separator': 'rgba(255, 255, 255, 0.45)', 'control-line': 'rgba(255, 255, 255, 0.5)', 'ink-secondary': 'rgba(255, 255, 255, 0.8)' })}\n}`,
  ].join('\n')
}
