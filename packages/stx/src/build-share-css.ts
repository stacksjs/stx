/**
 * One generated stylesheet shared across a static build's pages, plus a small
 * one per page (stacksjs/stx#2230).
 *
 * Each page's utility stylesheet is generated from that page alone, so every
 * page carries its own copy of the design tokens, the preflight and every
 * utility it happens to share with the others. `externalizeSharedAssets`
 * content-hashes each sheet, which collapses only byte-identical ones: on
 * Postline the 12 sheets shared a 27.5 KB prefix and were all different.
 *
 * This splits them. A top-level rule that enough pages carry goes into one
 * shared sheet, which every page links first; what is left stays on the page,
 * in a sheet right after it. The browser caches the shared sheet once, and a
 * navigation downloads only the next page's remainder.
 *
 * Order is the hard part. The generator emits rules in one canonical order and
 * the cascade depends on it: `md:p-8` beats `p-4` at that width because it
 * comes later. Pulling shared rules into an earlier sheet moves them before
 * every rule the page kept, so a page rule that canonically came before a
 * shared one would now come after it and win. The page sheet therefore repeats
 * each shared rule that follows one of its own and touches a property one of
 * them touched, and does so transitively, so the last occurrence of any two
 * rules that can compete is still in canonical order. Property overlap is read
 * conservatively (a shorthand and its longhands are one family, `all` is
 * everything): a false overlap costs a repeated rule, never a wrong cascade.
 *
 * Nothing is split when it cannot be done safely: fewer than two pages, a page
 * whose shared rules disagree with another page's about their order, or an
 * `@import`/`@charset`, which must lead its sheet.
 *
 * @module build-share-css
 */

import fs from 'node:fs'
import path from 'node:path'
import { EXTERNALIZED_ASSET_DIR } from './build-externalize'

/** The inline generated stylesheet a rendered page carries. */
const GENERATED_STYLE = /<style\b([^>]*\bdata-css=(?:"generated"|'generated')[^>]*)>([\s\S]*?)<\/style>/gi

export interface ShareCssResult {
  /** Pages whose generated stylesheet was split. */
  pages: number
  /** The shared sheet's file name under `_stx/`, when one was written. */
  shared?: string
  /** Its size. */
  sharedBytes: number
  /** Generated CSS bytes the pages carried before. */
  bytesBefore: number
  /** What the pages carry now, shared sheet excluded. */
  bytesAfter: number
}

export interface SharedCssPlan {
  /** The shared rules, in canonical order. */
  shared: string[]
  /** Each page's own rules, with the shared rules it has to repeat, in canonical order. */
  pages: string[][]
}

/**
 * A stylesheet's top-level statements, in order: each rule, each at-rule block,
 * and each `@layer a, b;`-style statement, trimmed. A top-level comment is kept
 * with the statement after it.
 */
export function splitTopLevelCss(css: string): string[] {
  const chunks: string[] = []
  let start = 0
  let depth = 0
  let i = 0
  const push = (end: number): void => {
    const chunk = css.slice(start, end).trim()
    if (chunk)
      chunks.push(chunk)
    start = end
  }
  while (i < css.length) {
    const char = css[i]!
    if (char === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2)
      i = close < 0 ? css.length : close + 2
      continue
    }
    if (char === '"' || char === '\'') {
      i++
      while (i < css.length && css[i] !== char) i += css[i] === '\\' ? 2 : 1
      i++
      continue
    }
    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) {
        i++
        push(i)
        continue
      }
    }
    else if (char === ';' && depth === 0) {
      i++
      push(i)
      continue
    }
    i++
  }
  push(css.length)
  return chunks
}

/**
 * The property families a statement declares. A shorthand and the longhands it
 * sets are one family, so `p-4` (padding) and `px-2` (padding-left/right) are
 * seen to compete; a custom property is its own family. `all` resets every
 * property and is returned as `*`.
 */
export function propertyFamilies(chunk: string): Set<string> {
  const families = new Set<string>()
  for (const match of chunk.matchAll(/[{;]\s*(--[\w-]+|-?[a-z][a-z-]*)\s*:/gi)) {
    const property = match[1]!.toLowerCase()
    if (property.startsWith('--')) {
      families.add(property)
      continue
    }
    const plain = property.replace(/^-(?:webkit|moz|ms|o)-/, '')
    if (plain === 'all') families.add('*')
    else if (/^(?:top|right|bottom|left|inset)(?:-|$)/.test(plain)) families.add('inset')
    else if (/^(?:gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/.test(plain)) families.add('gap')
    else if (/^(?:place|align|justify)-/.test(plain)) families.add('align')
    else if (plain === 'line-height') families.add('font')
    else if (/^columns?(?:-|$)/.test(plain)) families.add('column')
    else families.add(plain.split('-')[0]!)
  }
  return families
}

function overlaps(a: Set<string>, b: Set<string>): boolean {
  if (a.has('*') ? b.size > 0 : b.has('*') && a.size > 0)
    return true
  for (const family of a) {
    if (b.has(family))
      return true
  }
  return false
}

/** The fewest pages a rule must be on to be shared: two, or a quarter of the site. */
export function sharedThreshold(pageCount: number): number {
  return Math.max(2, Math.ceil(pageCount / 4))
}

/**
 * Which rules to share and what each page keeps, or null when the sheets
 * cannot be split without changing what any page looks like.
 */
export function planSharedCss(sheets: readonly string[][], threshold = sharedThreshold(sheets.length)): SharedCssPlan | null {
  if (sheets.length < 2)
    return null
  if (sheets.some(sheet => sheet.some(chunk => /^@(?:import|charset)\b/i.test(chunk))))
    return null

  const pagesWith = new Map<string, number>()
  for (const sheet of sheets) {
    for (const chunk of new Set(sheet))
      pagesWith.set(chunk, (pagesWith.get(chunk) ?? 0) + 1)
  }
  const isShared = (chunk: string): boolean => (pagesWith.get(chunk) ?? 0) >= threshold
  if (![...pagesWith.keys()].some(isShared))
    return null

  // One order for the shared sheet that every page agrees with: the pages'
  // shared rules merged, refusing when two pages order a pair differently.
  const shared = mergeOrders(sheets.map(sheet => sheet.filter(isShared)))
  if (!shared)
    return null

  const families = new Map<string, Set<string>>()
  const familiesOf = (chunk: string): Set<string> => {
    let found = families.get(chunk)
    if (!found) families.set(chunk, found = propertyFamilies(chunk))
    return found
  }

  const pages = sheets.map((sheet) => {
    const kept: string[] = []
    // Families of the rules this sheet holds so far. A shared rule that touches
    // one of them must come after them again, here, or it would lose to them.
    const held = new Set<string>()
    for (const chunk of sheet) {
      const own = familiesOf(chunk)
      if (isShared(chunk) && !overlaps(own, held))
        continue
      kept.push(chunk)
      for (const family of own) held.add(family)
    }
    return kept
  })

  return { shared, pages }
}

/**
 * Merge sequences that each list some of the same items into one order all of
 * them respect, or null if two disagree. Ties go to the item seen first.
 */
function mergeOrders(sequences: readonly string[][]): string[] | null {
  const after = new Map<string, Set<string>>()
  const incoming = new Map<string, number>()
  const firstSeen = new Map<string, number>()
  for (const sequence of sequences) {
    sequence.forEach((item, index) => {
      if (!firstSeen.has(item)) firstSeen.set(item, firstSeen.size)
      if (!incoming.has(item)) incoming.set(item, 0)
      if (index === 0) return
      const before = sequence[index - 1]!
      let next = after.get(before)
      if (!next) after.set(before, next = new Set())
      if (!next.has(item)) {
        next.add(item)
        incoming.set(item, incoming.get(item)! + 1)
      }
    })
  }
  const ready = [...incoming].filter(([, count]) => count === 0).map(([item]) => item)
  const order: string[] = []
  while (ready.length) {
    ready.sort((a, b) => firstSeen.get(a)! - firstSeen.get(b)!)
    const item = ready.shift()!
    order.push(item)
    for (const next of after.get(item) ?? []) {
      const left = incoming.get(next)! - 1
      incoming.set(next, left)
      if (left === 0) ready.push(next)
    }
  }
  return order.length === incoming.size ? order : null
}

function contentHash(source: string): string {
  return Bun.hash(source).toString(16).slice(0, 8)
}

function listHtmlFiles(dir: string): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && full.endsWith('.html')) found.push(full)
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  return found
}

/**
 * Split the generated stylesheet of every page under `outDir`: write the shared
 * sheet to `_stx/` and link it in place of each page's inline sheet, followed by
 * what the page keeps (which `externalizeSharedAssets` then lifts into a file of
 * its own). Pages are left as they are when no safe split exists.
 *
 * Runs before `externalizeSharedAssets`; a page whose generated sheet is
 * already a link has nothing to split and is skipped.
 */
export function shareGeneratedCss(outDir: string, basePath = `/${EXTERNALIZED_ASSET_DIR}`): ShareCssResult {
  const result: ShareCssResult = { pages: 0, sharedBytes: 0, bytesBefore: 0, bytesAfter: 0 }
  const pages: Array<{ file: string, html: string, body: string, chunks: string[] }> = []
  for (const file of listHtmlFiles(outDir)) {
    const html = fs.readFileSync(file, 'utf8')
    const styles = [...html.matchAll(GENERATED_STYLE)]
    // One inline sheet, or the page is not one this pass understands.
    if (styles.length !== 1 || /(?:^|\s)stx-inline(?:\s|=|$)/i.test(styles[0]![1]!) || !styles[0]![2]!.trim())
      continue
    pages.push({ file, html, body: styles[0]![2]!, chunks: splitTopLevelCss(styles[0]![2]!) })
  }

  const plan = planSharedCss(pages.map(page => page.chunks))
  if (!plan)
    return result

  const sharedCss = `${plan.shared.join('\n\n')}\n`
  const shared = `css.${contentHash(sharedCss)}.css`
  const assetDir = path.join(outDir, EXTERNALIZED_ASSET_DIR)
  fs.mkdirSync(assetDir, { recursive: true })
  fs.writeFileSync(path.join(assetDir, shared), sharedCss)
  result.shared = shared
  result.sharedBytes = sharedCss.length

  const link = `<link data-css="generated" rel="stylesheet" href="${basePath}/${shared}">`
  pages.forEach((page, index) => {
    const kept = plan.pages[index]!
    const remainder = kept.length ? `${kept.join('\n\n')}\n` : ''
    // The shared sheet where the page's sheet was, and what the page keeps
    // right after it: authored styles around them keep their places.
    const html = page.html.replace(GENERATED_STYLE, (_whole, attrs: string) =>
      remainder ? `${link}<style${attrs}>${remainder}</style>` : link)
    fs.writeFileSync(page.file, html)
    result.pages++
    result.bytesBefore += page.body.length
    result.bytesAfter += remainder.length
  })
  return result
}
