/**
 * A screen's document and binding manifest as a route file carries them, and
 * back. Most of a document is the same few empty fields on every node
 * (`props: {}`, `events: {}`, `children: []`, `_inlineStyle: {}`,
 * `_styleSource: ''`), and most of a manifest names each binding's kind twice
 * (`{ name: ':if', value: 'open', kind: 'if' }`). HQ's 74 routes carried
 * 3.3 MB of documents and 1.2 MB of manifests that way.
 *
 * `compact*` runs in the compiler, `expand*` in the runtime prelude before the
 * screen is prepared, and an expanded value is the value compacted: a node
 * that never had one of the fields says so (`'~'`, a bit per field), and a
 * binding whose kind is not the one its name gives keeps it.
 */
import type { BindingManifest, Binding, ManifestEntry } from '../../binding-manifest'
import type { STXDocument, STXNode } from '../compiler/ir'

/** The fields a node is restored with when it leaves them out, in bit order. */
const NODE_DEFAULTS: ReadonlyArray<readonly [string, () => unknown]> = [
  ['props', () => ({})],
  ['style', () => ({})],
  ['events', () => ({})],
  ['children', () => []],
  ['_inlineStyle', () => ({})],
  ['_styleSource', () => ''],
]

/** The key that lists the default fields a node did not have. */
const ABSENT = '~'

const BOUND_KINDS = new Set(['text', 'html', 'show', 'if', 'for', 'model', 'class', 'style', 'ref'])

/** The kind a binding's name gives it, which a compact binding leaves out. */
export function kindOfBindingName(name: string): Binding['kind'] {
  if (name.startsWith('@')) return 'event'
  if (name.startsWith(':') && BOUND_KINDS.has(name.slice(1))) return name.slice(1) as Binding['kind']
  return 'attr'
}

function isEmpty(value: unknown, fallback: unknown): boolean {
  if (typeof fallback === 'string') return value === ''
  if (Array.isArray(fallback)) return Array.isArray(value) && value.length === 0
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value as object).length === 0
}

class NotCompactable extends Error {}

function compactNode(node: STXNode): Record<string, unknown> {
  const out: Record<string, unknown> = { ...node }
  if (Object.prototype.hasOwnProperty.call(out, ABSENT)) throw new NotCompactable()
  let absent = 0
  NODE_DEFAULTS.forEach(([key, make], bit) => {
    if (!Object.prototype.hasOwnProperty.call(out, key)) absent |= 1 << bit
    else if (isEmpty(out[key], make())) delete out[key]
  })
  if (Array.isArray(out.children)) out.children = (out.children as Array<STXNode | string>).map(child => typeof child === 'string' ? child : compactNode(child))
  if (absent) out[ABSENT] = absent
  return out
}

function expandNode(node: Record<string, unknown>): void {
  const absent = (node[ABSENT] as number | undefined) ?? 0
  delete node[ABSENT]
  for (let bit = 0; bit < NODE_DEFAULTS.length; bit++) {
    const [key, make] = NODE_DEFAULTS[bit]!
    if (!(absent & (1 << bit)) && !Object.prototype.hasOwnProperty.call(node, key)) node[key] = make()
  }
  const children = node.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object') expandNode(child as Record<string, unknown>)
    }
  }
}

/** The document without the fields every node has empty; null for one this form cannot hold. */
export function compactDocument(document: STXDocument): unknown {
  try { return { ...document, root: compactNode(document.root) } }
  catch (error) {
    if (error instanceof NotCompactable) return null
    throw error
  }
}

/** A compact document as the screen reads it. It is changed in place. */
export function expandDocument<T>(document: T): T {
  expandNode((document as { root: Record<string, unknown> }).root)
  return document
}

type CompactBinding = [name: string, value: string, kind?: string]
type CompactEntry = [id: number, bindings: CompactBinding[], template?: 1]

const BINDING_KEYS = ['kind', 'name', 'value'].join()

/**
 * Each entry as `[id, bindings, template?]`, each binding as `[name, value, kind?]`;
 * null for a manifest with anything else in it, which goes as it is.
 */
export function compactManifest(manifest: BindingManifest): unknown {
  if (Object.keys(manifest).some(key => key !== 'entries')) return null
  const entries: CompactEntry[] = []
  for (const entry of manifest.entries) {
    if (Object.keys(entry).some(key => key !== 'id' && key !== 'bindings' && !(key === 'template' && entry.template === true))) return null
    const bindings: CompactBinding[] = []
    for (const binding of entry.bindings) {
      if (Object.keys(binding).sort().join() !== BINDING_KEYS || typeof binding.value !== 'string') return null
      bindings.push(binding.kind === kindOfBindingName(binding.name) ? [binding.name, binding.value] : [binding.name, binding.value, binding.kind])
    }
    entries.push(entry.template ? [entry.id, bindings, 1] : [entry.id, bindings])
  }
  return entries
}

/** A compact manifest as the screen reads it. */
export function expandManifest(compact: unknown): BindingManifest {
  return {
    entries: (compact as CompactEntry[]).map((item) => {
      const entry: ManifestEntry = {
        id: item[0],
        bindings: item[1].map(binding => ({ name: binding[0], value: binding[1], kind: (binding[2] ?? kindOfBindingName(binding[0])) as Binding['kind'] })),
      }
      if (item[2]) entry.template = true
      return entry
    }),
  }
}
