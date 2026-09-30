/**
 * Where every binding on a page is, worked out once on the server instead of
 * by walking the tree in every browser (stacksjs/stx#1984).
 *
 * The runtime finds its work by recursing over `childNodes` and reading each
 * element's attributes -- `processElement`, 606 lines of it. That is affordable
 * on the DOM, where the nodes are already there and attributes are free to
 * read. It is the wrong shape for a native host, where the tree is a view
 * hierarchy with no attributes to inspect and no selector to match, and it is
 * work repeated on every client for an answer the compiler already had.
 *
 * So: the server renders as it always did, this pass reads the output once and
 * records what carries a binding, and the runtime is handed the list.
 *
 * **The classification is not reimplemented here.** It comes from the same
 * tables the generated runtime embeds (`runtime-globals.ts`), because two
 * copies of "what counts as a binding" disagree eventually, and the way they
 * disagree is a binding that silently never binds. What this module cannot
 * share -- the order the runtime checks things in -- is pinned by a test that
 * compares this manifest against the bindings the runtime actually consumes.
 *
 * **What a manifest cannot cover**: rows a `:for` clones at runtime do not
 * exist when this runs. Their template does, and its entry is marked, so a
 * clone is bound from the template's entry rather than by walking the clone.
 * That is the same split SolidJS and React Native make -- compile the template,
 * bind per instance -- and it is why this is a manifest of the static tree
 * rather than of every node that will ever exist.
 */
import { RUNTIME_HANDLED_X_ATTRS, isRuntimeEventName, RUNTIME_DIRECTIVE_NAMES } from './runtime-globals'

/** One binding: the attribute that declared it and the expression it carries. */
export interface Binding {
  /** The attribute name as written, e.g. `:text`, `@click.stop`, `x-href`. */
  name: string
  /** Its value, the expression the runtime evaluates. */
  value: string
  /** Which binder consumes it. */
  kind: 'text' | 'html' | 'show' | 'if' | 'for' | 'model' | 'class' | 'style' | 'ref' | 'event' | 'attr'
}

/** One element that carries at least one binding. */
export interface ManifestEntry {
  /** The id stamped onto the element, and the key the runtime resolves it by. */
  id: number
  /** Present when this element is a `:for` row template, whose clones bind from this entry. */
  template?: boolean
  bindings: Binding[]
}

export interface BindingManifest {
  entries: ManifestEntry[]
}

/** The attribute that carries a manifest id on the rendered element. */
export const MANIFEST_ID_ATTR = 'data-stx-b'

const DIRECTIVE_SET = new Set(RUNTIME_DIRECTIVE_NAMES)
const HANDLED_X = new Set(RUNTIME_HANDLED_X_ATTRS)

/** The binder an attribute routes to, or null when it is not a binding at all. */
export function classifyAttribute(name: string): Binding['kind'] | null {
  if (name === 'ref' || name === 'data-stx-ref') return 'ref'

  if (name.startsWith('::')) return null // escaped: a literal colon attribute

  if (name.startsWith('@bind:') || name.startsWith('x-bind:')) return 'attr'

  if (name.startsWith('@') || name.startsWith(':')) {
    const bare = name.slice(1).split('.')[0]
    if (DIRECTIVE_SET.has(bare)) return bare === 'if' ? 'if' : bare as Binding['kind']
    if (bare === 'for' || bare === 'else' || bare === 'else-if' || bare === 'elseif') return 'for'
    if (isRuntimeEventName(bare)) return 'event'
    return 'attr'
  }

  if (name.startsWith('x-')) {
    const bare = name.split('.')[0]
    if (!HANDLED_X.has(bare)) return 'attr'
    const suffix = bare.slice(2)
    if (suffix === 'cloak' || suffix === 'data' || suffix === 'bind') return null
    if (suffix === 'tooltip' || suffix === 'tooltip-position') return null
    return DIRECTIVE_SET.has(suffix) ? (suffix === 'if' ? 'if' : suffix as Binding['kind']) : 'attr'
  }

  return null
}

/** Every binding on one element's attribute list. */
export function bindingsOf(attributes: Iterable<[string, string]>): Binding[] {
  const out: Binding[] = []
  for (const [name, value] of attributes) {
    const kind = classifyAttribute(name)
    if (kind) out.push({ name, value, kind })
  }
  return out
}

const TAG = /<([a-z][\w-]*)((?:\s+[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/gi
const ATTR = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

/**
 * Read a rendered page and record where its bindings are, stamping each
 * binding-bearing element so the runtime can find it without searching.
 *
 * Works on the rendered output rather than the template on purpose: by then
 * every server directive has run, components are expanded and slots are filled,
 * so what is left is exactly the set of bindings that will reach a client. It
 * is also the same input shape stx-native's translator takes, which keeps one
 * definition of "a binding" across both.
 */
export function extractBindingManifest(html: string): { html: string, manifest: BindingManifest } {
  const entries: ManifestEntry[] = []
  let id = 0

  const stamped = html.replace(TAG, (tag, tagName: string, attrText: string) => {
    if (!attrText || !/[:@]|x-/.test(attrText)) return tag

    const pairs: Array<[string, string]> = []
    ATTR.lastIndex = 0
    for (let m = ATTR.exec(attrText); m; m = ATTR.exec(attrText))
      pairs.push([m[1], m[2] ?? m[3] ?? m[4] ?? ''])

    const bindings = bindingsOf(pairs)
    if (!bindings.length) return tag

    const entry: ManifestEntry = { id: id++, bindings }
    if (bindings.some(b => b.kind === 'for')) entry.template = true
    entries.push(entry)

    const selfClosing = tag.endsWith('/>')
    const head = tag.slice(0, selfClosing ? -2 : -1).trimEnd()
    return `${head} ${MANIFEST_ID_ATTR}="${entry.id}"${selfClosing ? '/>' : '>'}`
  })

  return { html: stamped, manifest: { entries } }
}
