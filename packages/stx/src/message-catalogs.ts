/**
 * Message catalogs a language at a time.
 *
 * An app whose messages live in files of their own per language,
 * `<dir>/<language>/<area>.ts` (default export: plain data), can have its
 * pages ship the language they are drawn in instead of every language. The
 * native compiler does this for route files (`compileNativeBundle`'s
 * `messages`); this is the same for web pages (the `messages` option).
 *
 * In a web page's bundles (its module registry, its stores, its composables)
 * every message module stands in for its messages by a stub: an object kept
 * on `globalThis.__stxMessages` under `stx-messages:<language>:<area>`, which
 * the module's importers hold. The page then carries one more script ahead
 * of those bundles, filling the objects of its own language and the fallback
 * language for the areas its bundles import. A page in English therefore
 * parses no German at all.
 *
 * Another language comes with the page drawn in it: the router loads that
 * page's messages script (a module bundle like the registry) before it swaps
 * the page in, and the objects every importer already holds fill in place.
 * Until then, code reading another language finds that language's areas
 * empty, the same as a catalog missing a key: the app's fallback answers.
 *
 * @module message-catalogs
 */

import { existsSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// The separator is not a word character, so the repetition cannot backtrack.
// eslint-disable-next-line no-super-linear-backtracking
const MESSAGE_AREA = /^[\w-]+(?:\/[\w-]+)*$/
const MESSAGE_LANGUAGE = /^[\w-]+$/

/** Where an app keeps its messages, a directory per language. */
export interface MessageCatalogsOptions {
  /** The directory (relative to the project root) holding a directory per language. */
  dir: string
  /** The languages, each a directory of `dir`. */
  languages: string[]
}

/** The web pages' `messages` option. */
export interface PageMessagesOptions extends MessageCatalogsOptions {
  /**
   * The language a page in another language also ships, because the app
   * falls back to it for a message that language lacks. Defaults to the
   * first of `languages`.
   */
  fallback?: string
}

export interface CollectedMessages {
  /** Each message module, by absolute path: its language and area. */
  files: Map<string, { language: string, area: string }>
  /** Each language's messages, as JSON text, by area. */
  data: Map<string, Map<string, string>>
}

/** Read every language's message modules, at build time. */
export async function collectMessageCatalogs(root: string, options: MessageCatalogsOptions): Promise<CollectedMessages> {
  const dir = path.resolve(root, options.dir)
  if (!options.languages?.length) throw new Error('messages.languages must name at least one language')
  const files: CollectedMessages['files'] = new Map()
  const data: CollectedMessages['data'] = new Map()
  for (const language of options.languages) {
    if (!MESSAGE_LANGUAGE.test(language)) throw new Error(`messages: "${language}" is not a language directory name`)
    const base = path.join(dir, language)
    if (!existsSync(base)) throw new Error(`messages: ${path.relative(root, base)} does not exist`)
    const areas = new Map<string, string>()
    for (const relative of [...new Bun.Glob('**/*.{ts,js,mjs,json}').scanSync({ cwd: base })].sort()) {
      if (/\.(?:test|spec|d)\.[^.]+$/.test(relative)) continue
      const area = relative.replace(/\.[^./]+$/, '').split(path.sep).join('/')
      if (!MESSAGE_AREA.test(area)) throw new Error(`messages: ${language}/${relative} is not an area name`)
      if (areas.has(area)) throw new Error(`messages: ${language}/${area} is defined twice`)
      const file = path.join(base, relative)
      const module = await import(file) as Record<string, unknown>
      const others = Object.keys(module).filter(name => name !== 'default')
      // The route files see the default export alone.
      if (others.length) throw new Error(`messages: ${language}/${relative} exports ${others.join(', ')}; a message module exports its messages as default, and nothing else`)
      const value = module.default
      const json = value !== null && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : undefined
      if (json === undefined || !Bun.deepEquals(JSON.parse(json), value, true))
        throw new Error(`messages: ${language}/${relative} must export plain data (an object JSON can hold) as default`)
      areas.set(area, json)
      files.set(file, { language, area })
    }
    data.set(language, areas)
  }
  return { files, data }
}

/** The key a language's area is kept under, which is also what marks a stub in built code. */
function messagesKey(language: string, area: string): string {
  return `stx-messages:${language}:${area}`
}

/** A message module in a web page's bundles: the object its language's messages fill. */
function pageMessagesStub(language: string, area: string): string {
  const key = JSON.stringify(messagesKey(language, area))
  return `var kept = globalThis.__stxMessages || (globalThis.__stxMessages = {});\nexport default kept[${key}] || (kept[${key}] = {});`
}

/** A collection, with the stub for every message module (by path as written and as Bun resolves it). */
export interface PageMessages extends CollectedMessages {
  stubs: Map<string, string>
  languages: string[]
  fallback: string
}

const collected = new Map<string, { signature: string, messages: PageMessages }>()

/**
 * A file's path as written and as Bun may resolve it, the keys a module
 * substitute is found by. macOS's /var and /tmp are links into /private, and
 * a project there is named either way depending on who resolved it.
 */
export function pathSpellings(file: string): string[] {
  const names = [file]
  try { names.push(realpathSync(file)) }
  catch {}
  for (const named of [...names]) {
    if (named.startsWith('/private/')) names.push(named.slice('/private'.length))
  }
  return [...new Set(names)]
}

/**
 * Whether web pages ship messages a language at a time: with the `messages`
 * option, in production. `STX_PAGE_MESSAGES=0` turns it off; `=1` turns it
 * on outside production too (a development server re-reads a catalog only
 * when it restarts, so it is off there by default).
 */
export function pageMessagesEnabled(options: { messages?: PageMessagesOptions }, env: Record<string, string | undefined> = process.env): boolean {
  if (!options.messages || env.STX_PAGE_MESSAGES === '0') return false
  return env.STX_PAGE_MESSAGES === '1' || env.NODE_ENV === 'production'
}

/** The app's message catalogs, read once per version of the language directories. */
export async function loadPageMessages(root: string, options: PageMessagesOptions): Promise<PageMessages> {
  const dir = path.resolve(root, options.dir)
  // The directories' own times change when a file is added or removed; an
  // edited file is caught by its own (a production server never sees either).
  const signature = options.languages.map((language) => {
    try { return `${language}:${statSync(path.join(dir, language)).mtimeMs}` }
    catch { return `${language}:-` }
  }).join('|')
  const cacheKey = `${dir}\0${options.languages.join(',')}\0${options.fallback ?? ''}`
  const cached = collected.get(cacheKey)
  if (cached && cached.signature === signature) return cached.messages
  const catalogs = await collectMessageCatalogs(root, options)
  const stubs = new Map<string, string>()
  for (const [file, { language, area }] of catalogs.files) {
    const stub = pageMessagesStub(language, area)
    for (const named of pathSpellings(file)) stubs.set(named, stub)
  }
  const fallback = options.fallback ?? options.languages[0]!
  if (!options.languages.includes(fallback)) throw new Error(`messages.fallback "${fallback}" is not one of messages.languages`)
  const messages = { ...catalogs, stubs, languages: [...options.languages], fallback }
  collected.set(cacheKey, { signature, messages })
  return messages
}

/** The areas built code imports messages for (its stubs' keys), whatever the language. */
export function messageAreasIn(...codes: Array<string | null | undefined>): Set<string> {
  const areas = new Set<string>()
  for (const code of codes) {
    if (!code || !code.includes('stx-messages:')) continue
    for (const match of code.matchAll(/stx-messages:[\w-]+:([\w/-]+)/g))
      areas.add(match[1]!)
  }
  return areas
}

/**
 * The languages a page ships: the one `<html lang>` names and the fallback.
 * Every language when the page names none of them, since nothing then says
 * which one its scripts will read.
 */
export function pageLanguages(html: string, messages: Pick<PageMessages, 'languages' | 'fallback'>): string[] {
  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0] ?? ''
  const lang = /\slang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(htmlTag)
  const value = (lang ? (lang[1] ?? lang[2] ?? lang[3] ?? '') : '').trim().toLowerCase()
  const known = new Map(messages.languages.map(language => [language.toLowerCase(), language]))
  const language = known.get(value) ?? known.get(value.split(/[-_]/)[0] ?? '')
  if (!language) return [...messages.languages]
  return [...new Set([language, messages.fallback])]
}

/**
 * The script that fills a page's messages: each language's areas, as JSON
 * (parsed faster than the same object as code). Each area is filled once per
 * document, into the object its importers hold. Null when there is nothing
 * to fill.
 */
const scripts = new WeakMap<PageMessages, Map<string, string | null>>()
export function pageMessagesScript(messages: PageMessages, languages: string[], areas: Iterable<string>): string | null {
  const wanted = [...areas].sort()
  // Pages share their sets: built once per set, per version of the catalogs.
  let built = scripts.get(messages)
  if (!built) scripts.set(messages, built = new Map())
  const key = `${languages.join(',')}\0${wanted.join(',')}`
  if (built.has(key)) return built.get(key)!
  const code = buildPageMessagesScript(messages, languages, wanted)
  built.set(key, code)
  return code
}

function buildPageMessagesScript(messages: PageMessages, languages: string[], wanted: string[]): string | null {
  const puts: string[] = []
  for (const language of languages) {
    const catalog = messages.data.get(language)
    if (!catalog) continue
    for (const area of wanted) {
      const json = catalog.get(area)
      if (json !== undefined) puts.push(`put(${JSON.stringify(messagesKey(language, area))},${JSON.stringify(json)})`)
    }
  }
  if (puts.length === 0) return null
  return `;(function(){var kept=globalThis.__stxMessages||(globalThis.__stxMessages={}),filled=globalThis.__stxMessagesFilled||(globalThis.__stxMessagesFilled={});function put(key,json){if(filled[key])return;filled[key]=1;var into=kept[key]||(kept[key]={}),data=JSON.parse(json);for(var name in data)into[name]=data[name]}\n${puts.join(';\n')};\n})();`
}
