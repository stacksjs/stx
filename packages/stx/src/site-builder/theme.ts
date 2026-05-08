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

// The FOUC guard owns the unmediated theme-color meta end-to-end:
//   - Reads stored / default / OS preference to pick light vs dark.
//   - Creates the unmediated meta if missing and PREPENDS it to <head>
//     so it wins HTML's first-match priority over any media-queried
//     alternates the framework also ships for the (sub-millisecond)
//     window before this script runs.
//   - On SPA hops it re-asserts BOTH the content AND the position of
//     the meta on `stx:navigate` and `popstate`. Re-prepending (not
//     just updating content) defends against any future code path —
//     router-side mutations, third-party scripts, view-transition
//     snapshot quirks — that might reorder head children and let a
//     media-queried sibling win the first-match-wins ordering, which
//     would briefly tint the URL bar to the OS preference instead of
//     the stored selection.
const FOUC_SCRIPT = (defaultTheme: string, storageKey: string, lightColor: string, darkColor: string) => `(function(){function read(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);return t===null?(${JSON.stringify(defaultTheme)}==='dark'||(${JSON.stringify(defaultTheme)}==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches)):t==='dark'}catch(e){return ${JSON.stringify(defaultTheme)}==='dark'}}function apply(){var isDark=read();var html=document.documentElement;html.classList[isDark?'add':'remove']('dark');var color=isDark?${JSON.stringify(darkColor)}:${JSON.stringify(lightColor)};if(!document.head)return;var tc=document.querySelector('meta[name="theme-color"]:not([media])');if(!tc){tc=document.createElement('meta');tc.setAttribute('name','theme-color');tc.setAttribute('data-stx-theme-meta','1')}tc.setAttribute('content',color);if(tc!==document.head.firstChild){document.head.insertBefore(tc,document.head.firstChild)}}apply();window.addEventListener('stx:navigate',apply);window.addEventListener('popstate',apply)})();`

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

  // 2) Browser-chrome color sync. Two static meta tags + a JS-managed
  //    one work together:
  //   - <meta name="color-scheme"> tells the UA we render correctly in
  //     either mode (no automatic form-control inversion).
  //   - <meta name="theme-color" media="..."> per mode handles the
  //     sub-millisecond window before the FOUC guard runs, mapping URL
  //     bar tint to the OS preference.
  //   - The unmediated <meta name="theme-color"> is the source of
  //     truth post-paint. The FOUC guard CREATES it (not the static
  //     HTML) and prepends it so first-match-wins picks the JS value
  //     even though media-queried metas are technically present. We
  //     skip a static unmediated meta on purpose: setting it at build
  //     time means baking in the *default* theme's color, which causes
  //     a one-frame chrome flash for users whose stored preference is
  //     the other theme — the URL bar tints from the build-time
  //     default to the JS-set user value as the guard runs.
  if (!html.includes('data-stx-theme-meta') && /<head\b[^>]*>/i.test(html)) {
    const metas = [
      `<meta name="color-scheme" content="dark light" data-stx-theme-meta="1">`,
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
