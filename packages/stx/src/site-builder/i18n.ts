/**
 * Multi-locale builds for static stx sites.
 *
 * One source of `pages/*.stx` produces one copy of each page per
 * locale — the default locale lives at `/`, others at `/<code>/`. The
 * framework emits the right `<html lang>`, `og:locale`, canonical
 * URL, and per-page `<link rel="alternate" hreflang>` so search
 * engines can crawl every locale independently.
 *
 * Templates author content in the default locale; translation tokens
 * `{t:key}` get rewritten per locale during the post-process pass.
 * The token syntax sidesteps stx's own `{{ ... }}` templating so the
 * marker survives compilation. Translations themselves can come from
 * inline `i18n.translations[locale]` tables in `site.config.ts` or
 * from `translations/<locale>.{json,yaml}` files on disk; both
 * sources merge with inline winning on key conflicts.
 *
 * A locale-specific bootstrap script also rewires any unprefixed
 * in-page links so SPA navigation stays inside the current locale.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import type { SiteConfig, SiteI18nOptions } from './types'

export interface ResolvedI18n {
  locales: string[]
  defaultLocale: string
  labels: Record<string, string>
  translations: Record<string, Record<string, string>>
  pickerSelector: string
}

/**
 * Resolve i18n config into the runtime shape used by the build.
 *
 * Translations are merged from two sources, in priority order:
 *   1. `i18n.translations[<locale>]` — inline strings from `site.config.ts`
 *   2. `<translationsDir>/<locale>.<format>` on disk — JSON or YAML files
 *
 * Inline strings win on key conflicts, so config-level overrides don't
 * require editing the shared translation files. Missing locales/files
 * are silently tolerated; the file loader returns `{}` for anything it
 * can't read so the default locale's table can still serve as a
 * fallback at translate-time.
 */
export function resolveI18n(site: SiteConfig, projectRoot: string = process.cwd()): ResolvedI18n | null {
  const i18n = site.i18n
  if (!i18n || !Array.isArray(i18n.locales) || i18n.locales.length === 0)
    return null
  const defaultLocale = i18n.defaultLocale ?? i18n.locales[0]
  const translations = mergeTranslations(i18n, projectRoot)
  return {
    locales: i18n.locales,
    defaultLocale,
    labels: i18n.labels ?? Object.fromEntries(i18n.locales.map(c => [c, c.toUpperCase()])),
    translations,
    pickerSelector: i18n.pickerSelector ?? '#lang-picker',
  }
}

function mergeTranslations(i18n: SiteI18nOptions, projectRoot: string): Record<string, Record<string, string>> {
  const inline = i18n.translations ?? {}
  const out: Record<string, Record<string, string>> = {}
  const dir = i18n.translationsDir
  const dirAbs = dir === false ? null : resolve(projectRoot, (typeof dir === 'string' && dir) ? dir : 'translations')
  const format = i18n.format ?? 'json'

  for (const locale of i18n.locales) {
    const fromFile = dirAbs ? loadFromFile(dirAbs, locale, format) : {}
    out[locale] = { ...fromFile, ...(inline[locale] ?? {}) }
  }
  return out
}

function loadFromFile(dir: string, locale: string, format: 'json' | 'yaml' | 'yml'): Record<string, string> {
  const candidates = format === 'json'
    ? [`${locale}.json`]
    : [`${locale}.${format}`, `${locale}.${format === 'yaml' ? 'yml' : 'yaml'}`]
  for (const name of candidates) {
    const file = join(dir, name)
    if (!existsSync(file)) continue
    try {
      const raw = readFileSync(file, 'utf8')
      const data = format === 'json' ? JSON.parse(raw) : parseSimpleYaml(raw)
      return flatten(data)
    }
    catch {
      // Tolerate parse errors per-file so one broken locale doesn't
      // tank the build for the rest. The translate fallback chain
      // (default-locale → key) covers the gap visibly enough that
      // missing strings get noticed in dev.
      continue
    }
  }
  return {}
}

/**
 * Flatten a nested translation object into dotted keys.
 * `{ nav: { home: 'Home' } }` → `{ 'nav.home': 'Home' }`. Mirrors the
 * stx `@translate('nav.home')` convention so JSON/YAML files can be
 * authored as nested trees and still match flat lookup keys.
 */
function flatten(obj: any, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (!obj || typeof obj !== 'object') return out
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else if (typeof v === 'string') out[key] = v
    else if (typeof v === 'number' || typeof v === 'boolean') out[key] = String(v)
  }
  return out
}

/**
 * Minimal YAML parser — handles the `key: value` and `key:` + nested
 * indentation patterns that translation files actually use. Mirrors
 * the parser stx's main i18n.ts ships so behavior stays consistent
 * across the two i18n entry points.
 */
function parseSimpleYaml(content: string): Record<string, any> {
  const result: Record<string, any> = {}
  const stack: Array<{ obj: Record<string, any>, indent: number }> = [{ obj: result, indent: -1 }]
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trimEnd()
    if (!line.trim()) continue
    const indent = line.search(/\S/)
    if (indent === -1) continue
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
    const currentObj = stack[stack.length - 1].obj
    const match = line.match(/^(\s*)(\S[^:]*):\s*(.*)$/)
    if (!match) continue
    const [, , key, rawValue] = match
    const trimmedKey = key.trim()
    const trimmedValue = rawValue.trim()
    if (trimmedValue === '') {
      currentObj[trimmedKey] = {}
      stack.push({ obj: currentObj[trimmedKey], indent })
    }
    else {
      currentObj[trimmedKey] = unquote(trimmedValue)
    }
  }
  return result
}

function unquote(v: string): string {
  if ((v.startsWith('\'') && v.endsWith('\'')) || (v.startsWith('"') && v.endsWith('"')))
    return v.slice(1, -1)
  return v
}

/**
 * Translate a key for a locale, falling back to the default locale's
 * value, then to the key itself. The fallback chain keeps prototypes
 * shippable even when only a subset of strings is translated.
 */
export function translate(
  i18n: ResolvedI18n,
  locale: string,
  key: string,
): string {
  const local = i18n.translations[locale]?.[key]
  if (typeof local === 'string') return local
  const fallback = i18n.translations[i18n.defaultLocale]?.[key]
  if (typeof fallback === 'string') return fallback
  return key
}

/**
 * Replace `{t:key}` and `{t!:key}` markers in HTML with the translated
 * string for the given locale. The key syntax sidesteps stx's
 * `{{ ... }}` templating (which evaluates as JS at build time and
 * would render `t(...)` calls as empty when no `t` binding exists
 * in scope).
 *
 * Two variants:
 *   - `{t:key}`  — value is HTML-escaped before substitution. Default
 *     for ordinary text. Safe for any translator-supplied string.
 *   - `{t!:key}` — value is substituted *raw*, without escaping. Use
 *     this when the translation needs inline markup (e.g. `<strong>`,
 *     `<a>`, `<br>`) so different languages can place emphasis where
 *     their grammar requires. Translation values for these keys live
 *     in the project's own translation files, so the trust boundary
 *     is the same as the page template itself.
 *
 * Keys may use letters, digits, `_`, `.`, `-`. Anything that doesn't
 * match the pattern is left alone — runs after stx has finished its
 * own templating pass.
 */
export function applyTranslations(
  html: string,
  i18n: ResolvedI18n,
  locale: string,
): string {
  return html.replace(
    /\{t(!?):([a-zA-Z][\w.-]*)\}/g,
    (_match, raw, key) => {
      const value = translate(i18n, locale, key)
      return raw === '!' ? value : escapeHtml(value)
    },
  )
}

/**
 * URL path for a built page in the given locale.
 *
 * - `/` stays `/` for the default locale; for non-default locales it
 *   becomes `/<code>/` (with the trailing slash). The slash matters
 *   because most static hosts (S3+CloudFront, GitHub Pages, etc.)
 *   only serve the directory's `index.html` when the URL ends in `/`
 *   — `/de` 404s, `/de/` resolves. Linking with the slash avoids a
 *   client-side redirect dance and lets SPA hops succeed without
 *   falling back to a full page load.
 * - `/about` becomes `/<code>/about` for non-default locales (no
 *   trailing slash — those map to `<code>/about.html`).
 * - `/404.html` keeps its filename and lives under the locale prefix.
 */
export function localizePath(path: string, locale: string, defaultLocale: string): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}/`
  if (path === '/404.html') return `/${locale}/404.html`
  return `/${locale}${path}`
}

/**
 * Reverse of `localizePath`: strip a locale prefix off a path so we
 * can compute the equivalent path in another locale.
 */
export function stripLocalePrefix(path: string, locales: string[]): { locale: string | null, path: string } {
  for (const loc of locales) {
    if (path === `/${loc}` || path === `/${loc}/`)
      return { locale: loc, path: '/' }
    if (path.startsWith(`/${loc}/`))
      return { locale: loc, path: path.slice(loc.length + 1) }
  }
  return { locale: null, path }
}

/**
 * `<link rel="alternate" hreflang>` block + `<link rel="canonical">`
 * for the page being rendered. Search engines treat each as the
 * authoritative copy for its locale.
 */
export function buildAlternateLinks(
  siteUrl: string,
  pagePath: string,
  i18n: ResolvedI18n,
): string {
  const base = siteUrl.replace(/\/$/, '')
  const lines: string[] = []
  for (const loc of i18n.locales) {
    const url = `${base}${localizePath(pagePath, loc, i18n.defaultLocale)}`
    lines.push(`<link rel="alternate" hreflang="${escapeAttr(loc)}" href="${escapeAttr(url)}">`)
  }
  // x-default points at the default locale per Google's spec.
  const def = `${base}${localizePath(pagePath, i18n.defaultLocale, i18n.defaultLocale)}`
  lines.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttr(def)}">`)
  return lines.join('\n  ')
}

/**
 * Inline script that wires up the language picker.
 *
 * Per-page logic: each `<button data-lang="…">` inside the configured
 * picker selector navigates to the equivalent path in the chosen
 * locale, using the locale list shipped in `window.__stxI18n`. Marks
 * the active button with `aria-current="true"` for styling.
 */
export function buildLangPickerScript(
  i18n: ResolvedI18n,
  currentLocale: string,
): string {
  const data = JSON.stringify({
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
    current: currentLocale,
    pickerSelector: i18n.pickerSelector,
  })
  // The router's container-only swap leaves <nav>/<footer> at the
  // previous locale's text. For SPA hops between locales to swap
  // those too, the destination's `<meta name="stx-layout-group">`
  // must differ from the current one — that's the router's signal
  // for "full body swap." We inject a per-locale group meta at build
  // time (see post-process in bun-plugin-stx/serve.ts and the static
  // build pipeline), and the router picks it up automatically. So
  // here we can keep the click handler on the SPA path with no
  // special-casing.
  return `<script data-stx-lang-picker="1">window.__stxI18n=${data};(function(){function cfg(){return window.__stxI18n}function localeFromPath(p){var d=cfg();for(var i=0;i<d.locales.length;i++){var c=d.locales[i];if(p==='/'+c||p==='/'+c+'/')return c;if(p.indexOf('/'+c+'/')===0)return c}return d.defaultLocale}function localePathFor(loc,p){var d=cfg();var stripped=p;for(var i=0;i<d.locales.length;i++){var c=d.locales[i];if(p==='/'+c||p==='/'+c+'/'){stripped='/';break}if(p.indexOf('/'+c+'/')===0){stripped=p.slice(c.length+1);break}}if(loc===d.defaultLocale)return stripped;if(stripped==='/')return '/'+loc+'/';return '/'+loc+stripped}cfg().localizeHref=function(href){try{var u=new URL(href,location.origin);if(u.origin!==location.origin)return href;return localePathFor(localeFromPath(location.pathname),u.pathname)+(u.search||'')+(u.hash||'')}catch(_){return href}};function syncFromUrl(){var d=cfg();var loc=localeFromPath(location.pathname);d.current=loc;var picker=document.querySelector(d.pickerSelector);if(picker){var btns=picker.querySelectorAll('[data-lang]');for(var i=0;i<btns.length;i++){var b=btns[i];if(b.getAttribute('data-lang')===loc)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')}}if(document.documentElement.lang!==loc)document.documentElement.lang=loc}function onLangClick(e){var d=cfg();var btn=e.target&&e.target.closest&&e.target.closest('[data-lang]');if(!btn)return;var picker=document.querySelector(d.pickerSelector);if(!picker||!picker.contains(btn))return;e.preventDefault();e.stopPropagation();var loc=btn.getAttribute('data-lang');if(!loc||loc===localeFromPath(location.pathname))return;var dest=localePathFor(loc,location.pathname);var r=window.__stxRouter;if(r&&r.navigate)r.navigate(dest,true,true);else location.assign(dest)}syncFromUrl();if(window.__stxLangPickerBound){document.removeEventListener('click',window.__stxLangPickerClick,true);window.removeEventListener('stx:navigate',window.__stxLangPickerSync);window.removeEventListener('popstate',window.__stxLangPickerSync)}window.__stxLangPickerClick=onLangClick;window.__stxLangPickerSync=syncFromUrl;window.__stxLangPickerBound=1;document.addEventListener('click',onLangClick,true);window.addEventListener('stx:navigate',syncFromUrl);window.addEventListener('popstate',syncFromUrl)})();</script>`
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type { SiteI18nOptions }
