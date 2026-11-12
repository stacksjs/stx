/**
 * What a preview is made of, before there is a frame. No DOM.
 *
 * The document that goes into the frame, the permissions the frame is given,
 * and the arithmetic of showing a phone-sized page in a box that is not
 * phone-sized.
 */

export type PreviewScheme = 'light' | 'dark' | 'auto'
export type ViewportName = 'fill' | 'phone' | 'tablet' | 'desktop' | 'custom'

export interface ViewportSize {
  width: number
  height: number
}

export interface ViewportPreset extends ViewportSize {
  name: Exclude<ViewportName, 'fill' | 'custom'>
  label: string
}

/** CSS pixels, portrait for the two that are held in a hand. */
export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  { name: 'phone', label: 'Phone', width: 390, height: 844 },
  { name: 'tablet', label: 'Tablet', width: 820, height: 1180 },
  { name: 'desktop', label: 'Desktop', width: 1280, height: 800 },
]

export interface ResolvedViewport {
  name: ViewportName
  /** Null for `fill`: the page gets whatever the box is. */
  size: ViewportSize | null
  landscape: boolean
}

function positive(value: unknown): number | null {
  const number = typeof value === 'string' ? Number.parseFloat(value) : value
  return typeof number === 'number' && Number.isFinite(number) && number > 0 ? Math.round(number) : null
}

/**
 * The viewport a name stands for.
 *
 * A width and a height given outright win over a name. `landscape` turns a
 * preset on its side; a desktop is already on its side and stays as it is.
 * A name nobody knows fills the box, which is the least surprising thing to do
 * with it.
 */
export function resolveViewport(name: unknown, options: { width?: unknown, height?: unknown, landscape?: boolean } = {}): ResolvedViewport {
  const width = positive(options.width)
  const height = positive(options.height)
  const landscape = Boolean(options.landscape)
  if (width && height)
    return { name: 'custom', size: { width, height }, landscape: false }

  const preset = VIEWPORT_PRESETS.find(entry => entry.name === name)
  if (!preset)
    return { name: 'fill', size: null, landscape: false }

  const turn = landscape && preset.height > preset.width
  return {
    name: preset.name,
    size: turn ? { width: preset.height, height: preset.width } : { width: preset.width, height: preset.height },
    landscape: turn,
  }
}

/**
 * How much to shrink a viewport so it fits a box, never enlarging it: a page
 * drawn larger than life would misreport what it looks like.
 */
export function fitScale(viewport: ViewportSize, available: ViewportSize, padding = 0): number {
  const width = available.width - padding * 2
  const height = available.height - padding * 2
  if (width <= 0 || height <= 0 || viewport.width <= 0 || viewport.height <= 0)
    return 1
  return Math.min(1, width / viewport.width, height / viewport.height)
}

/** `390 × 844`, with the scale when the page is shown smaller than life. */
export function describeViewport(viewport: ResolvedViewport, scale = 1): string {
  if (!viewport.size)
    return 'Fills the frame'
  const size = `${viewport.size.width} × ${viewport.size.height}`
  return scale < 0.995 ? `${size} at ${Math.round(scale * 100)}%` : size
}

export function normalizeScheme(value: unknown): PreviewScheme {
  return value === 'light' || value === 'dark' ? value : 'auto'
}

export interface SandboxOptions {
  /** Let the page's own scripts run. They run in an origin of their own and cannot reach the host. */
  scripts?: boolean
  /** Let a form in the page submit. */
  forms?: boolean
}

/**
 * Tokens that would give the page a way back to the host, and are never
 * granted whatever is asked for. `allow-same-origin` puts the page in the
 * host's origin, where its scripts can read the host's storage and DOM; the
 * navigation ones let it replace the host page; popups get a window the
 * sandbox does not cover.
 */
export const FORBIDDEN_SANDBOX_TOKENS: readonly string[] = [
  'allow-same-origin',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-top-navigation-to-custom-protocols',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-modals',
  'allow-downloads',
  'allow-pointer-lock',
  'allow-presentation',
  'allow-storage-access-by-user-activation',
]

/**
 * The frame's `sandbox` value. Empty is the strictest there is: no scripts, no
 * forms, an origin of its own. An empty string still has to be written as the
 * attribute, since a frame with no `sandbox` attribute is not sandboxed at all.
 */
export function sandboxValue(options: SandboxOptions = {}): string {
  const tokens: string[] = []
  if (options.scripts)
    tokens.push('allow-scripts')
  if (options.forms)
    tokens.push('allow-forms')
  return tokens.join(' ')
}

/** Whether a sandbox value keeps the page away from the host. */
export function isIsolatingSandbox(value: string): boolean {
  const tokens = value.toLowerCase().split(/\s+/).filter(Boolean)
  return !tokens.some(token => FORBIDDEN_SANDBOX_TOKENS.includes(token))
}

const HAS_DOCUMENT = /<!doctype\s|<html[\s>]/i
const HEAD_OPEN = /<head(?:\s[^>]*)?>/i
const HTML_OPEN = /<html(?:\s[^>]*)?>/i
const HAS_BASE = /<base[\s>]/i
const HAS_COLOR_SCHEME = /<meta[^>]+name\s*=\s*["']?color-scheme/i

export interface DocumentOptions {
  /** The title of a document built around a fragment. */
  title?: string
  /**
   * Write this scheme into the document, for an engine that does not hand a
   * frame's `color-scheme` to the page inside it. See `forceColorScheme`.
   */
  forceScheme?: 'light' | 'dark'
}

const SCHEME_FEATURE = /\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)/gi
const STYLE_OR_SCRIPT = /(<(style|script)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi
const MEDIA_ATTRIBUTE = /(\smedia\s*=\s*)("[^"]*"|'[^']*')/gi
/** Always true, and always false in any frame wide enough to show a page. */
const ALWAYS = '(min-width: 0px)'
const NEVER = '(max-width: 0px)'

/**
 * A document that answers for one colour scheme whatever the system prefers.
 *
 * Chromium hands a frame's `color-scheme` to its page; WebKit does not, so in
 * Safari and in a Craft window the page keeps the system's scheme and a
 * preview asked for `light` on a dark Mac was drawn dark (stacksjs/stx#2186).
 * Nothing set on the frame from outside reaches a sandboxed page there, so the
 * scheme is written into the page instead:
 *
 * - every `(prefers-color-scheme: …)` in a style sheet, a `media` attribute or
 *   a script is replaced by a condition that is always true or always false,
 *   so the page's own rules, and a `matchMedia` it calls, answer for the
 *   scheme asked for;
 * - the root is given that `color-scheme`, so the canvas, form controls,
 *   system colours and `light-dark()` follow it too.
 *
 * Text is left alone: a page that shows the words "prefers-color-scheme" to
 * its reader keeps them. A style sheet the page loads from elsewhere is not
 * rewritten, since only the markup is in hand.
 */
export function forceColorScheme(html: string, scheme: 'light' | 'dark'): string {
  const settle = (text: string): string => text.replace(SCHEME_FEATURE, (_, asked: string) => asked.toLowerCase() === scheme ? ALWAYS : NEVER)
  const rewritten = html
    .replace(STYLE_OR_SCRIPT, (_, open: string, _tag: string, body: string, close: string) => open + settle(body) + close)
    .replace(MEDIA_ATTRIBUTE, (_, name: string, value: string) => name + settle(value))
  const rule = `<style data-stx-preview-scheme>:root{color-scheme:${scheme} !important}</style>`
  if (HEAD_OPEN.test(rewritten))
    return rewritten.replace(HEAD_OPEN, match => match + rule)
  if (HTML_OPEN.test(rewritten))
    return rewritten.replace(HTML_OPEN, match => `${match}<head>${rule}</head>`)
  return rule + rewritten
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The document the frame is given.
 *
 * A fragment (`<h1>Hi</h1>`) is wrapped in a page that follows the colour
 * scheme, so bare markup is dark on a dark preview the way it would be in a
 * dark page. A whole document is left as its author wrote it: a mail that
 * declares no dark styles is shown light, which is what a mail client does
 * with it.
 *
 * Either way links open "in a new window", which the sandbox refuses, so a
 * click cannot navigate the preview away from what is being previewed.
 */
export function buildDocument(html: string | null | undefined, options: DocumentOptions = {}): string {
  const built = wrapDocument(html, options)
  return options.forceScheme ? forceColorScheme(built, options.forceScheme) : built
}

function wrapDocument(html: string | null | undefined, options: DocumentOptions): string {
  const source = html == null ? '' : String(html)
  const base = '<base target="_blank">'

  if (!HAS_DOCUMENT.test(source)) {
    const title = options.title ? `<title>${escapeHtml(options.title)}</title>` : ''
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark">${base}${title}</head><body>${source}</body></html>`
  }

  if (HAS_BASE.test(source))
    return source
  if (HEAD_OPEN.test(source))
    return source.replace(HEAD_OPEN, match => match + base)
  if (HTML_OPEN.test(source))
    return source.replace(HTML_OPEN, match => `${match}<head>${base}</head>`)
  return base + source
}

/** Whether a document says which colour schemes it supports. */
export function declaresColorScheme(html: string): boolean {
  return HAS_COLOR_SCHEME.test(html)
}

/** The preset after `name` in the toolbar's order, for the arrow keys. `fill` comes first. */
export function stepViewport(name: ViewportName, direction: 1 | -1): ViewportName {
  const order: ViewportName[] = ['fill', ...VIEWPORT_PRESETS.map(preset => preset.name)]
  const index = order.indexOf(name)
  return order[((index < 0 ? 0 : index) + direction + order.length) % order.length]
}
