import type { ClassStyles } from './headwind-to-style'
import { classStyleKey, compileClassStyles, seedClassStyles } from './headwind-to-style'
import type { STXNode } from './ir'
import type { NativeStyleVariables } from './style-variables'
import { createStyleVariables } from './style-variables'
import type { NativeStylesheetRules } from './stylesheet-rules'

/**
 * The screen's class lists, compiled by the build and shipped with it.
 *
 * A native screen compiled every class list it used as it mounted: in an
 * interpreted engine that was about a tenth of the browser's start, for lists
 * the build had already read. The table holds each static list as each runtime
 * caller asks for it (as `adopt` reads it, and against the screen's theme in
 * each appearance, with and without a pointer), deduplicated, and the runtime
 * seeds its cache from it. A list the build could not see (a `:class` value,
 * classes forwarded from a caller) is still compiled when it appears.
 */
export interface NativeClassTable {
  /** Each distinct compiled result once. */
  entries: ClassStyles[]
  /** `classStyleKey` to an index in `entries`, for lists read without variables or rules. */
  plain: Record<string, number>
  /** The same against the theme's variables and the page's rules, per appearance. */
  light: Record<string, number>
  dark: Record<string, number>
}

export function buildClassTable(root: STXNode): NativeClassTable | undefined {
  // Each list, and whether a text input wears it (its focus styles count).
  const lists = new Map<string, boolean>()
  const visit = (node: STXNode | string): void => {
    if (typeof node === 'string') return
    if (node._classes) lists.set(node._classes, lists.get(node._classes) === true || node.type === 'TextInput')
    for (const child of node.children) visit(child)
  }
  visit(root)
  if (!lists.size) return undefined

  const entries: ClassStyles[] = []
  const indexOf = new Map<string, number>()
  const store = (compiled: ClassStyles): number => {
    const text = JSON.stringify(compiled)
    let index = indexOf.get(text)
    if (index === undefined) {
      index = entries.push(compiled) - 1
      indexOf.set(text, index)
    }
    return index
  }
  const table: NativeClassTable = { entries, plain: {}, light: {}, dark: {} }
  for (const list of lists.keys()) table.plain[classStyleKey(list)] = store(compileClassStyles(list))

  const rules = root._stylesheetRules
  for (const scheme of ['light', 'dark'] as const) {
    const variables = createStyleVariables(root._stylesheetTheme?.[scheme] ?? []).computed()
    for (const [list, focus] of lists) {
      // As the host joins a node's classes with the ones forwarded to it: none, here.
      const classes = `${list} `
      for (const options of [
        { focus, focusWithin: true, appearance: scheme, pointer: false },
        { focus, focusWithin: true, appearance: scheme, pointer: true },
        { focus, focusWithin: true },
      ]) table[scheme][classStyleKey(classes, options)] = store(compileClassStyles(classes, variables, { ...options, rules }))
    }
  }
  return table
}

/** Seed the class cache from a shipped table: the plain lists, and `scheme`'s against `variables`. */
export function seedClassTable(table: NativeClassTable, scheme: 'light' | 'dark', variables: NativeStyleVariables, rules: NativeStylesheetRules | undefined, plain = true): void {
  const pick = (keys: Record<string, number>) => Object.entries(keys).map(([key, index]) => [key, table.entries[index]!] as [string, ClassStyles])
  if (plain) seedClassStyles(undefined, undefined, pick(table.plain))
  seedClassStyles(variables, rules, pick(table[scheme]))
}
