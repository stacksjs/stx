/**
 * Light / dark theme bootstrapping for static stx sites.
 *
 * Three things have to land on every page for theme toggling to work
 * without a flash of unstyled content (FOUC):
 *
 *   1. A class on `<html>` that the very first paint can read so
 *      Tailwind's `dark:` variants apply correctly.
 *   2. A pre-paint inline script that overrides that class from
 *      `localStorage` (or `prefers-color-scheme`) before any layout
 *      runs.
 *   3. A click handler bound to any element with `id="theme-toggle"`
 *      that flips the class and persists the choice.
 *
 * stx's bun-plugin classifies plain `<script>` tags as server-side and
 * strips them at build time, so callers can't ship the FOUC guard from
 * a `.stx` template. This helper runs after stx finishes processing so
 * the inline scripts survive into the final HTML.
 */

import type { SiteConfig } from './types'

export interface ThemeOptions {
  /** Default theme on first visit. Falls back to 'auto' (system preference). */
  default?: 'dark' | 'light' | 'auto'
  /** localStorage key. Default: "theme". */
  storageKey?: string
  /**
   * `theme-color` meta tag values per mode. The framework injects both
   * variants and keeps the active one in sync as the theme flips, so
   * the browser chrome (Safari URL bar, Chrome on Android, PWAs)
   * tints to match the page instead of flashing during navigation.
   */
  colors?: { light?: string, dark?: string }
}

const FOUC_SCRIPT = (defaultTheme: string, storageKey: string, lightColor: string, darkColor: string) => `(function(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);var html=document.documentElement;var isDark=t===null?(${JSON.stringify(defaultTheme)}==='dark'||(${JSON.stringify(defaultTheme)}==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches)):t==='dark';html.classList[isDark?'add':'remove']('dark');var tc=document.querySelector('meta[name="theme-color"]:not([media])');if(tc)tc.setAttribute('content',isDark?${JSON.stringify(darkColor)}:${JSON.stringify(lightColor)})}catch(e){}})();`

const TOGGLE_HANDLER = (storageKey: string, lightColor: string, darkColor: string) => `document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('#theme-toggle');if(!t)return;var html=document.documentElement;var isDark=html.classList.toggle('dark');try{localStorage.setItem(${JSON.stringify(storageKey)},isDark?'dark':'light')}catch(e){}var tc=document.querySelector('meta[name="theme-color"]:not([media])');if(tc)tc.setAttribute('content',isDark?${JSON.stringify(darkColor)}:${JSON.stringify(lightColor)})});`

/**
 * Inject the theme bootstrap (FOUC guard + class) and the toggle
 * handler. Skips no-op if the markers are already present so rebuilds
 * stay idempotent.
 */
export function injectThemeBootstrap(html: string, site: SiteConfig): string {
  if (site.theme === false) return html

  const opts: ThemeOptions = (typeof site.theme === 'object' && site.theme !== null) ? site.theme : {}
  const defaultTheme = opts.default ?? 'dark'
  const storageKey = opts.storageKey ?? 'theme'
  const lightColor = opts.colors?.light ?? '#ffffff'
  const darkColor = opts.colors?.dark ?? '#000000'

  // 1) Add class="dark" (or "light") to <html> for the initial paint
  if (defaultTheme === 'dark') {
    if (!/<html\b[^>]*\bclass=/.test(html))
      html = html.replace(/<html\b([^>]*)>/i, '<html$1 class="dark">')
    else if (!/<html\b[^>]*\bclass="[^"]*\bdark\b/.test(html))
      html = html.replace(/<html\b([^>]*\bclass=")([^"]*)(")/i, '<html$1$2 dark$3')
  }

  // 2) Browser-chrome color sync. Three meta tags work together:
  //   - <meta name="color-scheme">  tells the UA we render correctly in
  //     either mode (no automatic form-control inversion).
  //   - <meta name="theme-color" media="..."> per mode lets the UA pick
  //     the right tint when JS hasn't run yet (initial paint).
  //   - The unmediated <meta name="theme-color"> is the live one — the
  //     FOUC guard + toggle handler keep its content in sync with the
  //     class on <html>, which is what user toggles flip. Without this,
  //     the URL bar flashed white on every nav in dark mode.
  if (!html.includes('data-stx-theme-meta') && /<head\b[^>]*>/i.test(html)) {
    const initialColor = defaultTheme === 'dark' ? darkColor : lightColor
    const metas = [
      `<meta name="color-scheme" content="dark light" data-stx-theme-meta="1">`,
      `<meta name="theme-color" content="${initialColor}" data-stx-theme-meta="1">`,
      `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${lightColor}" data-stx-theme-meta="1">`,
      `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${darkColor}" data-stx-theme-meta="1">`,
    ].join('\n  ')
    html = html.replace(/<head\b([^>]*)>/i, `<head$1>\n  ${metas}`)
  }

  // 3) FOUC guard as the first thing in <head> (after the meta tags so
  // the JS update has the unmediated <meta name="theme-color"> to find)
  if (!html.includes('__stxThemeGuard') && /<head\b[^>]*>/i.test(html)) {
    const guard = `<script data-stx-theme-guard="1">${FOUC_SCRIPT(defaultTheme, storageKey, lightColor, darkColor)};window.__stxThemeGuard=1;</script>`
    html = html.replace(/<head\b([^>]*)>/i, `<head$1>\n  ${guard}`)
  }

  // 4) Toggle click handler before </body>
  if (!html.includes('__stxThemeToggle') && /<\/body>/i.test(html)) {
    const handler = `<script data-stx-theme-toggle="1">${TOGGLE_HANDLER(storageKey, lightColor, darkColor)};window.__stxThemeToggle=1;</script>`
    html = html.replace(/<\/body>/i, `${handler}\n</body>`)
  }

  return html
}
