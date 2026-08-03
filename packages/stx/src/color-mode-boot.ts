/**
 * Pre-paint color-mode bootstrap (stacksjs/stx#1794).
 *
 * `useColorMode` is part of the client signals runtime: it reads localStorage
 * at call time, after the runtime bundle has loaded and hydration has begun.
 * That is too late. Applying the theme post-hydration guarantees a flash of the
 * wrong theme on every cold load for every user whose stored preference differs
 * from the default — which is why apps hand-write a render-blocking snippet in
 * `<head>` and why `useColorMode` could not replace it.
 *
 * This module emits that snippet from the *same* option surface `useColorMode`
 * takes, so the duplication collapses into one declaration in `stx.config.ts`:
 *
 * ```ts
 * // stx.config.ts
 * export default {
 *   app: {
 *     colorMode: { storageKey: 'theme', attribute: 'data-theme' },
 *   },
 * }
 * ```
 *
 * The generated script is deliberately render-blocking, is injected as the
 * first thing inside `<head>` (above any stylesheet), and touches the root
 * element synchronously.
 *
 * ## Staying in lockstep with useColorMode
 *
 * The boot script must apply *exactly* what `useColorMode` will apply on
 * hydration. If they disagree the flash comes back — the boot script would set
 * one thing and hydration would immediately undo it, which is worse than not
 * having a boot script at all. So this mirrors the runtime's `applyDOM` and
 * preference reading precisely:
 *
 *   - `attribute` and `darkClass` both apply when both are configured, and
 *     `darkClass: null` opts out of the class (stacksjs/stx#1788)
 *   - the accepted vocabulary is `light | dark | auto | system`, with
 *     `'system'` an alias for `'auto'` (also #1788)
 *
 * `test/directives/color-mode-boot.test.ts` pins both sides to the same
 * expectations so drift fails the suite rather than shipping a flash. This
 * script never writes to storage — reading is all it needs, and a write here
 * would race the composable's own persistence.
 *
 * The script publishes its resolved configuration on `window.__STX_COLOR_MODE__`
 * so a bare `useColorMode()` call picks up the app's configured storage key and
 * attribute without the options having to be repeated at the call site.
 *
 * @module color-mode-boot
 */

/** Marker attribute — makes injection idempotent and findable by tests. */
export const COLOR_MODE_BOOT_MARKER = 'data-stx-color-mode-boot'

/** The global the boot script publishes its resolved config on. */
export const COLOR_MODE_BOOT_GLOBAL = '__STX_COLOR_MODE__'

export type ColorModeBootMode = 'light' | 'dark' | 'auto' | 'system'

/** Spelling written to storage for "follow the system". */
export type ColorModeBootAutoValue = 'auto' | 'system'

/**
 * Pre-paint options. A strict subset of `ColorModeOptions` — only the fields
 * that affect what lands on the root element before paint. `disableTransitions`
 * is deliberately absent: nothing has painted yet, so there is no transition to
 * suppress, and forcing a reflow in the critical path would only cost time.
 */
export interface ColorModeBootConfig {
  /** localStorage key holding the preference. @default 'stx-color-mode' */
  storageKey?: string
  /**
   * Mode used when nothing valid is stored. @default 'auto'
   * `'system'` is accepted as an alias for `'auto'`.
   */
  initialMode?: ColorModeBootMode
  /**
   * Class applied to `<html>` when dark. @default 'dark'
   * Pass `null` to opt out — the attribute alone then carries the mode.
   */
  darkClass?: string | null
  /**
   * Attribute set to the resolved mode on `<html>`, e.g. `'data-theme'`.
   * Applied *alongside* `darkClass`, mirroring `useColorMode` (#1788).
   */
  attribute?: string | null
  /**
   * Spelling `useColorMode` writes back for "follow the system". Published to
   * the client so the composable doesn't convert an app's existing `'system'`
   * key to `'auto'`. @default whatever is stored, else 'auto'
   */
  autoValue?: ColorModeBootAutoValue
}

interface ResolvedBootConfig {
  storageKey: string
  initialMode: 'light' | 'dark' | 'auto'
  darkClass: string | null
  attribute: string | null
  autoValue: ColorModeBootAutoValue | null
}

const MODES = new Set<string>(['light', 'dark', 'auto', 'system'])
const AUTO_VALUES = new Set<string>(['auto', 'system'])
// Deliberately narrow: these values are interpolated into an inline <script>,
// and into setAttribute/classList calls. Anything outside these shapes is a
// configuration mistake worth failing loudly on rather than escaping around.
const ATTRIBUTE_PATTERN = /^[a-z][\w:-]*$/i
const CLASS_PATTERN = /^[\w-]+$/

function resolveConfig(options: ColorModeBootConfig): ResolvedBootConfig {
  const storageKey = options.storageKey ?? 'stx-color-mode'
  const rawInitial = options.initialMode ?? 'auto'
  // `=== undefined`, not `??` — an explicit null is an opt-out, not an absence.
  const darkClass = options.darkClass === undefined ? 'dark' : options.darkClass
  const attribute = options.attribute ?? null
  const autoValue = options.autoValue ?? null

  if (typeof storageKey !== 'string' || storageKey.length === 0)
    throw new Error('colorMode.storageKey must be a non-empty string')
  if (!MODES.has(rawInitial))
    throw new Error(`colorMode.initialMode must be one of light, dark, auto, system — got ${JSON.stringify(rawInitial)}`)
  if (darkClass !== null && (typeof darkClass !== 'string' || !CLASS_PATTERN.test(darkClass)))
    throw new Error(`colorMode.darkClass must be a single CSS class name, or null to opt out — got ${JSON.stringify(darkClass)}`)
  if (attribute !== null && (typeof attribute !== 'string' || !ATTRIBUTE_PATTERN.test(attribute)))
    throw new Error(`colorMode.attribute must be a valid HTML attribute name — got ${JSON.stringify(attribute)}`)
  if (autoValue !== null && !AUTO_VALUES.has(autoValue))
    throw new Error(`colorMode.autoValue must be 'auto' or 'system' — got ${JSON.stringify(autoValue)}`)
  if (darkClass === null && attribute === null)
    throw new Error('colorMode needs at least one of darkClass or attribute — with both null nothing would mark the mode on <html>')

  // Normalised for the script: 'system' is an input spelling, not a distinct
  // mode. The spelling survives via autoValue, which is what gets written back.
  const initialMode = rawInitial === 'system' ? 'auto' : rawInitial

  return { storageKey, initialMode, darkClass, attribute, autoValue }
}

/**
 * JSON, escaped for embedding inside a `<script>` element.
 *
 * Even with the validation above this stays — `storageKey` is free-form, and a
 * key containing `</script>` would otherwise terminate the element early.
 */
function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Build the synchronous pre-paint `<script>`.
 *
 * Every storage access is wrapped: a sandboxed origin or disabled storage must
 * degrade to the default mode, never throw. A throw here is unusually costly
 * because the script sits above the application shell — an uncaught error would
 * block the rest of the document.
 */
export function generateColorModeBootScript(options: ColorModeBootConfig = {}): string {
  const config = resolveConfig(options)
  const c = serializeForScript(config)

  // `a` carries the spelling actually found in storage so the composable writes
  // the same one back — an app persisting 'system' must not have it converted.
  const body = `(function(){"use strict";var c=${c};var p=c.initialMode;var a=c.autoValue;try{var v=localStorage.getItem(c.storageKey);if(v==="light"||v==="dark"){p=v}else if(v==="auto"||v==="system"){p="auto";if(!a)a=v}}catch(e){}var m=p;if(p==="auto"){try{m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){m="light"}}var r=document.documentElement;if(c.attribute)r.setAttribute(c.attribute,m);if(c.darkClass){if(m==="dark")r.classList.add(c.darkClass);else r.classList.remove(c.darkClass)}try{window.${COLOR_MODE_BOOT_GLOBAL}={storageKey:c.storageKey,initialMode:c.initialMode,darkClass:c.darkClass,attribute:c.attribute,autoValue:a||"auto",preference:p,mode:m}}catch(e){}}());`

  return `<script ${COLOR_MODE_BOOT_MARKER}>${body}</script>`
}

/**
 * Insert the boot script as the first thing in `<head>`.
 *
 * Placement matters twice over: the script must run before the browser paints,
 * and a stylesheet `<link>` above it would block its execution (CSS blocks JS),
 * delaying the very thing it exists to make early.
 *
 * `<meta charset>` is stepped over when it leads the head, so the encoding
 * declaration keeps its place at the top of the document.
 *
 * Idempotent — a document that already carries the marker is returned
 * unchanged, so this is safe on paths that run it more than once.
 */
export function injectColorModeBootScript(html: string, options: ColorModeBootConfig = {}): string {
  if (html.includes(COLOR_MODE_BOOT_MARKER))
    return html

  const headOpen = /<head\b[^>]*>/i.exec(html)
  if (!headOpen)
    return html

  let insertAt = headOpen.index + headOpen[0].length

  // Keep <meta charset> first — the spec wants it inside the first 1024 bytes,
  // and pushing it down behind this script erodes that budget for no reason.
  const afterHead = html.slice(insertAt)
  const charset = /^\s*<meta\b[^>]*\bcharset\b[^>]*>/i.exec(afterHead)
  if (charset)
    insertAt += charset[0].length

  const script = generateColorModeBootScript(options)
  return `${html.slice(0, insertAt)}\n  ${script}${html.slice(insertAt)}`
}
