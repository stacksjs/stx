/**
 * Declarative pre-paint appearance bootstrapping.
 *
 * Client composables apply appearance reactively after mount, but that is too
 * late for the first paint. This directive emits a compiler-owned synchronous
 * script at the directive location so persisted root attributes and the dark
 * class are present before the browser parses the application shell.
 *
 * @example
 * ```stx
 * @appearanceBootstrap({
 *   storageKey: 'app-appearance',
 *   appearance: {
 *     key: 'sidebarStyle',
 *     attribute: 'appearance',
 *     allowed: ['macos', 'arc'],
 *     default: 'macos',
 *   },
 *   colorMode: {
 *     key: 'colorMode',
 *     attribute: 'color-mode',
 *     default: 'system',
 *   },
 * })
 * ```
 */

import { safeEvaluate } from './safe-evaluator'

export interface AppearanceBootstrapValue {
  /** Property read from the persisted JSON object. */
  key: string
  /** Root data attribute name without the `data-` prefix. */
  attribute: string
  /** Persisted values accepted by the bootstrap. */
  allowed: string[]
  /** Value used when storage is absent, malformed, or outside the allowlist. */
  default: string
}

export interface ColorModeBootstrapValue {
  /** Property read from the persisted JSON object. */
  key: string
  /** Root data attribute name without the `data-` prefix. */
  attribute: string
  /** Mode used when storage is absent or malformed. */
  default: 'light' | 'dark' | 'system'
}

export interface AppearanceBootstrapOptions {
  /**
   * localStorage key holding the persisted preference.
   *
   * Read as a JSON object, and also as a bare `'light'` / `'dark'` /
   * `'system'` string, which is what `useColorMode` writes under its own
   * `storageKey` and the overwhelmingly common shape in existing apps.
   */
  storageKey: string
  /**
   * A second axis beside colour mode, such as a sidebar style.
   *
   * Optional: colour mode is the common case and this is the specialised one,
   * so an app that themes only light/dark leaves it out rather than inventing
   * a single-valued axis to satisfy the normalizer and then carrying a
   * meaningless `data-*` attribute on every page (stacksjs/stx#2050).
   */
  appearance?: AppearanceBootstrapValue
  colorMode: ColorModeBootstrapValue
  /**
   * Leave an attribute alone when it already carries a concrete value, and
   * resolve to that instead of to what is stored. @default false
   *
   * For a page whose theme is not the visitor's to choose: stamped
   * server-side during render, it has to outrank whatever they stored from
   * their own browsing. Without this the bootstrap resolved purely from
   * storage and stamped unconditionally (stacksjs/stx#2050).
   *
   * `system` is not concrete: it is an instruction to resolve rather than an
   * answer, so the stored preference still wins for it. For the appearance
   * axis, concrete means a value in `allowed`.
   */
  respectExisting?: boolean
}

/** The normalized form, where an absent `appearance` is explicitly null. */
interface NormalizedOptions {
  storageKey: string
  appearance: AppearanceBootstrapValue | null
  colorMode: ColorModeBootstrapValue
  respectExisting: boolean
}

const DATA_ATTRIBUTE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const PROPERTY_PATTERN = /^[A-Za-z_$][\w$]*$/
const COLOR_MODES = new Set(['light', 'dark', 'system'])

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`@appearanceBootstrap ${label} must be a non-empty string`)
}

function normalizeOptions(value: unknown): NormalizedOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('@appearanceBootstrap expects an options object')

  const input = value as Record<string, unknown>
  const appearance = input.appearance as Record<string, unknown> | undefined
  const colorMode = input.colorMode as Record<string, unknown> | undefined

  assertString(input.storageKey, 'storageKey')
  // `appearance` absent is the colour-mode-only case and is allowed. Present
  // but not an object is still a mistake worth naming.
  if (appearance !== undefined && (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)))
    throw new Error('@appearanceBootstrap appearance must be an object when given')
  if (!colorMode || typeof colorMode !== 'object' || Array.isArray(colorMode))
    throw new Error('@appearanceBootstrap colorMode must be an object')

  assertString(colorMode.key, 'colorMode.key')
  assertString(colorMode.attribute, 'colorMode.attribute')
  assertString(colorMode.default, 'colorMode.default')

  if (!PROPERTY_PATTERN.test(colorMode.key))
    throw new Error('@appearanceBootstrap preference keys must be JavaScript property names')
  if (!DATA_ATTRIBUTE_PATTERN.test(colorMode.attribute))
    throw new Error('@appearanceBootstrap attributes must be lowercase data attribute names')
  if (!COLOR_MODES.has(colorMode.default))
    throw new Error('@appearanceBootstrap colorMode.default must be light, dark, or system')

  let normalizedAppearance: AppearanceBootstrapValue | null = null
  if (appearance) {
    assertString(appearance.key, 'appearance.key')
    assertString(appearance.attribute, 'appearance.attribute')
    assertString(appearance.default, 'appearance.default')

    if (!PROPERTY_PATTERN.test(appearance.key))
      throw new Error('@appearanceBootstrap preference keys must be JavaScript property names')
    if (!DATA_ATTRIBUTE_PATTERN.test(appearance.attribute))
      throw new Error('@appearanceBootstrap attributes must be lowercase data attribute names')
    if (!Array.isArray(appearance.allowed) || appearance.allowed.length === 0 || appearance.allowed.some(item => typeof item !== 'string' || item.length === 0))
      throw new Error('@appearanceBootstrap appearance.allowed must contain one or more strings')
    if (!(appearance.allowed as string[]).includes(appearance.default))
      throw new Error('@appearanceBootstrap appearance.default must be in appearance.allowed')

    normalizedAppearance = {
      key: appearance.key,
      attribute: appearance.attribute,
      allowed: [...new Set(appearance.allowed as string[])],
      default: appearance.default,
    }
  }

  return {
    storageKey: input.storageKey,
    appearance: normalizedAppearance,
    colorMode: {
      key: colorMode.key,
      attribute: colorMode.attribute,
      default: colorMode.default as ColorModeBootstrapValue['default'],
    },
    respectExisting: input.respectExisting === true,
  }
}

function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * The pre-paint script, and the runtime that shares its rules.
 *
 * The directive existed to settle appearance before the first frame, and it
 * did that and stopped there. Everything *after* the first frame — the
 * settings control that changes the mode, persisting the choice, following the
 * system while the mode is `system` — was left to each application, which then
 * wrote a second implementation of the same rules by hand.
 *
 * Two implementations of one contract do not stay in step, and the way they
 * come apart is silent. `data-theme` is the proof: this script sets it, an
 * application's own `setColorMode` usually does not, so every runtime change
 * left the attribute describing the mode the page loaded in rather than the
 * one it is in.
 *
 * So the script publishes what it already knows how to do. `apply` is the
 * body of the bootstrap, reused rather than restated; `setColorMode` and
 * `setAppearance` write the same persisted object this script reads and then
 * call it; `watchSystem` re-applies on a `prefers-color-scheme` change while —
 * and only while — the stored mode is `system`.
 *
 * Every change dispatches `stx:appearance` on `window`, carrying the resolved
 * state. Applications with something outside the document to keep in step — a
 * native window whose material AppKit resolves against the *window's*
 * appearance, say — have one event to listen to instead of a wrapper around
 * every call site.
 *
 * Kept in one synchronous script rather than split into a module: the pre-paint
 * half must not wait for a fetch, and a runtime that arrived later would be
 * missing exactly when a settings panel binds to it.
 */
function generateBootstrap(options: NormalizedOptions): string {
  const config = serializeForScript(options)

  // Three things the emitted script does that are worth reading slowly, all
  // from stacksjs/stx#2050:
  //
  // `read` accepts a bare "dark" as well as a JSON object. A theme key holding
  // a bare string is the common shape in existing apps and is what
  // useColorMode writes under its own storageKey. JSON.parse throws on it, the
  // old catch swallowed the throw by design, and the resolver then fell to the
  // default -- so migrating a hand-written guard to this directive silently
  // discarded the stored preference of every existing user, with nothing to
  // warn that the formats disagreed.
  //
  // `write` puts back the shape it found. Reading a bare string and writing an
  // object would convert the app's storage out from under its own other
  // readers, which is the silent data loss #1788 was about. Only safe without
  // an appearance axis, since a bare string cannot carry one.
  //
  // `config.appearance` may be null, the colour-mode-only case, in which case
  // no second attribute is stamped and setAppearance is a no-op.
  //
  // `forced` is captured ONCE, before the first apply, and never re-read.
  // apply() stamps both attributes, so a later call -- from watchSystem or
  // from a settings control -- would otherwise read this script's own stamp
  // back as a server-forced value and pin the theme permanently.
  return `<script data-stx-scoped data-stx-appearance-bootstrap>(function(){"use strict";const config=${config};const root=document.documentElement;const MODES=["light","dark","system"];let format="json";const forced=(function(){const found={colorMode:null,appearance:null};if(!config.respectExisting)return found;try{const mode=root.getAttribute("data-"+config.colorMode.attribute);if(mode==="light"||mode==="dark")found.colorMode=mode;if(config.appearance){const name=root.getAttribute("data-"+config.appearance.attribute);if(config.appearance.allowed.includes(name))found.appearance=name}}catch{}return found}());function read(){let stored={};try{const raw=localStorage.getItem(config.storageKey);if(raw){let parsed=null;try{parsed=JSON.parse(raw)}catch{parsed=raw}if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){stored=parsed;format="json"}else if(typeof parsed==="string"&&MODES.includes(parsed)){stored={};stored[config.colorMode.key]=parsed;format="string"}}}catch{}return stored}function write(stored){try{if(format==="string"&&!config.appearance)localStorage.setItem(config.storageKey,stored[config.colorMode.key]);else localStorage.setItem(config.storageKey,JSON.stringify(stored))}catch{}}function resolve(){const stored=read();const state={colorMode:forced.colorMode||(MODES.includes(stored[config.colorMode.key])?stored[config.colorMode.key]:config.colorMode.default)};if(config.appearance)state.appearance=forced.appearance||(config.appearance.allowed.includes(stored[config.appearance.key])?stored[config.appearance.key]:config.appearance.default);return state}function prefersDark(){try{return matchMedia("(prefers-color-scheme: dark)").matches}catch{return false}}function apply(){const state=resolve();const dark=state.colorMode==="dark"||(state.colorMode==="system"&&prefersDark());if(config.appearance)root.setAttribute("data-"+config.appearance.attribute,state.appearance);root.setAttribute("data-"+config.colorMode.attribute,state.colorMode);root.classList.toggle("dark",dark);root.dataset.theme=dark?"dark":"light";state.dark=dark;try{window.dispatchEvent(new CustomEvent("stx:appearance",{detail:state}))}catch{}return state}function store(key,allowed,value){if(allowed.includes(value)){const stored=read();stored[key]=value;write(stored)}return apply()}window.__stxAppearance={config:config,forced:forced,read:read,resolve:resolve,apply:apply,setColorMode:function(mode){return store(config.colorMode.key,MODES,mode)},setAppearance:function(name){return config.appearance?store(config.appearance.key,config.appearance.allowed,name):apply()},watchSystem:function(){try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){if(resolve().colorMode==="system")apply()})}catch{}}};apply()}());</script>`
}

function findClosingParenthesis(source: string, openIndex: number): number {
  let depth = 1
  let quote: string | null = null
  let escaped = false

  for (let index = openIndex + 1; index < source.length; index++) {
    const character = source[index]

    if (escaped) {
      escaped = false
      continue
    }
    if (quote) {
      if (character === '\\')
        escaped = true
      else if (character === quote)
        quote = null
      continue
    }
    if (character === '"' || character === '\'' || character === '`') {
      quote = character
      continue
    }
    if (character === '(')
      depth++
    else if (character === ')' && --depth === 0)
      return index
  }

  return -1
}

/**
 * Transform every `@appearanceBootstrap({...})` directive in a template.
 */
export function processAppearanceBootstrapDirective(
  template: string,
  context: Record<string, unknown>,
): string {
  let output = template
  const pattern = /@appearanceBootstrap\s*\(/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(output)) !== null) {
    const openIndex = match.index + match[0].length - 1
    const closeIndex = findClosingParenthesis(output, openIndex)
    if (closeIndex === -1)
      throw new Error('@appearanceBootstrap has an unclosed options object')

    const expression = output.slice(openIndex + 1, closeIndex).trim()
    const evaluated = safeEvaluate(`(${expression})`, context)
    const replacement = generateBootstrap(normalizeOptions(evaluated))

    output = output.slice(0, match.index) + replacement + output.slice(closeIndex + 1)
    pattern.lastIndex = match.index + replacement.length
  }

  return output
}
