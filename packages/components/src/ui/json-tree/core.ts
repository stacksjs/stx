/**
 * The model of a value inspector. No DOM.
 *
 * A value is described as a tree of nodes, each saying what kind of thing it
 * is, what to call it and how to show it on one line. The shape is generic on
 * purpose: nothing here knows which serializer produced the description, so
 * the same tree shows a tinker result, a parsed JSON document or a debugger
 * frame. `./tinker` adapts one such serializer; `fromValue` below describes a
 * plain JavaScript value.
 *
 * The model turns that tree into the list of rows currently visible, which is
 * what a virtualized view draws. Only expanded containers are walked, so the
 * cost of every operation follows what is on show, not what exists.
 */

/** The ways a node can be opened outside the tree. Any other string is the host's own. */
export type TreeOpenKind = 'table' | 'graph' | 'preview' | (string & {})

export interface TreeNode {
  /**
   * A stable name for the node. Left out, the row is named by its position.
   * Needed only for a node that a `ref` points at, or that the host addresses.
   */
  id?: string
  /** What the value is: `object`, `array`, `string`, `number`, `error`, ... Styles the row. */
  kind: string
  /** What the parent calls it: a property name, an index, a map key. */
  label?: string
  /**
   * The segment this node adds to a copied path. Left out, it is the index
   * under an array or a set and the label under anything else.
   */
  key?: string | number
  /** The value on one line. Left out, one is made from `value` or the children. */
  preview?: string
  /** The value itself, for a scalar. What copy puts on the clipboard. */
  value?: unknown
  children?: TreeNode[]
  /** How many children exist beyond the ones in `children`. Shown as a row that asks for them. */
  more?: number
  /** The `id` of the node this one points back to, for a cycle. */
  ref?: string
  /** Where else this node can be shown. The view draws a button for each. */
  openable?: TreeOpenKind | TreeOpenKind[]
  /** Anything the host wants to find again on the node. Never read here. */
  meta?: unknown
}

/** One visible line of the tree. */
export interface TreeRow {
  id: string
  /** The node, or for a "more" row the node whose children are missing. */
  node: TreeNode
  /** Zero for a root. */
  depth: number
  /** The path segment this row adds. */
  key: string | number
  /** The index of the parent row, or -1 for a root. */
  parent: number
  expandable: boolean
  expanded: boolean
  /** One-based position among its siblings, and how many siblings there are. */
  posInSet: number
  setSize: number
  /** The row standing for children that were not sent. */
  isMore: boolean
}

export type TreePath = Array<string | number>

export interface TreeModelOptions {
  /** Containers nearer the root than this start expanded. Default 1: the root is open, its children closed. */
  depth?: number
}

const INDEXED = new Set(['array', 'set'])
const IDENTIFIER = /^[A-Z_$][\w$]*$/i

/** Whether a node's children are numbered rather than named. */
export function isIndexed(node: TreeNode): boolean {
  return INDEXED.has(node.kind)
}

/** Whether a node can be opened to show something under it. */
export function isExpandable(node: TreeNode): boolean {
  return node.ref === undefined && ((node.children !== undefined && node.children.length > 0) || (node.more ?? 0) > 0)
}

/**
 * A path as JavaScript would write it: `$.users[0]["first name"]`.
 *
 * `$` is the value itself. A name that is a plain identifier is dotted, a
 * number is an index, and anything else is quoted in brackets.
 */
export function formatPath(path: readonly (string | number)[], root = '$'): string {
  let text = root
  for (const segment of path) {
    if (typeof segment === 'number')
      text += `[${segment}]`
    else if (IDENTIFIER.test(segment))
      text += `.${segment}`
    else
      text += `[${JSON.stringify(segment)}]`
  }
  return text
}

/**
 * The plain value a node describes, as far as the description goes.
 *
 * A container becomes an array or an object of what is present: children that
 * were never sent (`more`) are simply not there, and nothing is put in their
 * place, so the result is always the honest JSON of what the tree holds. A
 * cycle becomes the text `[Circular]`. A scalar is its `value` when it has
 * one and its preview otherwise.
 */
export function nodeToPlain(node: TreeNode): unknown {
  if (node.ref !== undefined)
    return '[Circular]'

  if (node.children) {
    if (isIndexed(node))
      return node.children.map(child => nodeToPlain(child))

    const object: Record<string, unknown> = {}
    node.children.forEach((child, index) => {
      object[child.key !== undefined ? String(child.key) : (child.label ?? String(index))] = nodeToPlain(child)
    })
    return object
  }

  if ('value' in node) {
    const value = node.value
    if (typeof value === 'bigint')
      return value.toString()
    if (typeof value === 'number' && !Number.isFinite(value))
      return String(value)
    if (typeof value === 'function' || typeof value === 'symbol')
      return node.preview ?? String(value)
    return value
  }
  return node.preview ?? null
}

/** The node as indented JSON. `undefined`, which JSON has no word for, is the text `undefined`. */
export function nodeToJson(node: TreeNode, indent = 2): string {
  const plain = nodeToPlain(node)
  return plain === undefined ? 'undefined' : JSON.stringify(plain, null, indent)
}

const PREVIEW_LIMIT = 80

/** One line for a node that did not bring its own. */
export function previewOf(node: TreeNode): string {
  if (node.preview !== undefined)
    return node.preview
  if (node.ref !== undefined)
    return '[Circular]'

  if (node.children || node.more) {
    const count = (node.children?.length ?? 0) + (node.more ?? 0)
    if (isIndexed(node))
      return `${node.kind === 'set' ? 'Set' : 'Array'}(${count})`
    return count === 0 ? '{}' : `{${count}}`
  }

  if ('value' in node) {
    const value = node.value
    if (typeof value === 'string')
      return JSON.stringify(value.length > PREVIEW_LIMIT ? `${value.slice(0, PREVIEW_LIMIT)}…` : value)
    if (typeof value === 'bigint')
      return `${value}n`
    return String(value)
  }
  return node.kind
}

export interface FromValueOptions {
  /** Entries kept per container. The rest are counted in `more`. Default 1000. */
  maxItems?: number
  /** Levels described. Deeper containers are shown closed and empty. Default 32. */
  maxDepth?: number
}

/**
 * Describe a plain JavaScript value: what `JSON.parse` returns, or any object
 * graph. Cycles become `ref` nodes rather than a loop.
 */
export function fromValue(value: unknown, label?: string, options: FromValueOptions = {}): TreeNode {
  const maxItems = options.maxItems ?? 1000
  const maxDepth = options.maxDepth ?? 32
  const seen = new Map<object, string>()
  let nextId = 1

  const named = (node: TreeNode, name: string | undefined): TreeNode => {
    if (name !== undefined)
      node.label = name
    return node
  }

  const walk = (current: unknown, name: string | undefined, depth: number): TreeNode => {
    if (current === null)
      return named({ kind: 'null', value: null, preview: 'null' }, name)

    switch (typeof current) {
      case 'undefined':
        return named({ kind: 'undefined', value: undefined, preview: 'undefined' }, name)
      case 'string':
      case 'number':
      case 'boolean':
      case 'bigint':
        return named({ kind: typeof current, value: current }, name)
      case 'symbol':
        return named({ kind: 'symbol', preview: current.toString() }, name)
      case 'function':
        return named({ kind: 'function', preview: `ƒ ${current.name || '(anonymous)'}()` }, name)
    }

    const object = current as object
    const known = seen.get(object)
    if (known !== undefined)
      return named({ kind: 'ref', ref: known }, name)

    if (object instanceof Date)
      return named({ kind: 'date', value: Number.isNaN(object.getTime()) ? null : object.toISOString(), preview: Number.isNaN(object.getTime()) ? 'Invalid Date' : object.toISOString() }, name)
    if (object instanceof RegExp)
      return named({ kind: 'regexp', value: object.toString(), preview: object.toString() }, name)

    const id = `v${nextId++}`
    seen.set(object, id)
    const array = Array.isArray(object)
    const set = object instanceof Set
    const map = object instanceof Map
    const node: TreeNode = named({ id, kind: array ? 'array' : set ? 'set' : map ? 'map' : 'object', children: [] }, name)
    if (depth >= maxDepth) {
      node.preview = array ? 'Array' : 'Object'
      delete node.children
      return node
    }

    const children = node.children as TreeNode[]
    let total = 0
    if (array || set) {
      for (const item of object as Iterable<unknown>) {
        if (total < maxItems)
          children.push(walk(item, String(total), depth + 1))
        total++
      }
    }
    else if (map) {
      for (const [key, inner] of object as Map<unknown, unknown>) {
        if (total < maxItems)
          children.push(walk(inner, typeof key === 'string' ? key : previewOf(walk(key, undefined, maxDepth)), depth + 1))
        total++
      }
    }
    else {
      for (const key of Object.keys(object)) {
        if (total < maxItems)
          children.push(walk((object as Record<string, unknown>)[key], key, depth + 1))
        total++
      }
      const ctor = object.constructor?.name
      if (ctor && ctor !== 'Object')
        node.preview = `${ctor} {${total}}`
    }
    if (total > children.length)
      node.more = total - children.length
    if (map)
      node.preview = `Map(${total})`
    return node
  }

  return walk(value, label, 0)
}

/** What a key does to a tree: where the cursor goes, and whether the rows changed. */
export interface TreeMove {
  index: number
  /** True when rows were expanded or collapsed, so the view must redraw them all. */
  changed: boolean
}

/**
 * The visible rows of a tree, and what is expanded.
 */
export class TreeModel {
  /** The visible rows, top to bottom. Replaced, never edited, when the tree changes. */
  rows: TreeRow[] = []
  /** Goes up every time `rows` is rebuilt. */
  version = 0

  private roots: TreeNode[] = []
  private depth: number
  /** Rows the user opened below the default depth, and closed above it. */
  private readonly opened = new Set<string>()
  private readonly closed = new Set<string>()
  private index: Map<string, number> | null = null

  constructor(value?: TreeNode | TreeNode[] | null, options: TreeModelOptions = {}) {
    this.depth = options.depth ?? 1
    this.setValue(value)
  }

  /** Show another value. Forgets what was expanded. */
  setValue(value: TreeNode | TreeNode[] | null | undefined): void {
    this.roots = value == null ? [] : (Array.isArray(value) ? value : [value])
    this.opened.clear()
    this.closed.clear()
    this.flatten()
  }

  /** Change the default depth, forgetting what was expanded by hand. */
  setDepth(depth: number): void {
    this.depth = depth
    this.opened.clear()
    this.closed.clear()
    this.flatten()
  }

  /** The value on show, as the list of its roots. */
  getRoots(): readonly TreeNode[] {
    return this.roots
  }

  /** The index of a row among the visible ones, or -1. */
  indexOf(id: string): number {
    if (!this.index) {
      this.index = new Map()
      for (let i = 0; i < this.rows.length; i++)
        this.index.set(this.rows[i].id, i)
    }
    return this.index.get(id) ?? -1
  }

  /** The path from the value to a row, one segment per ancestor. */
  pathOf(index: number): TreePath {
    const path: TreePath = []
    // With several roots each is addressed by its position; a single root is `$` itself.
    for (let at = index; at >= 0; at = this.rows[at].parent) {
      const row = this.rows[at]
      if (row.isMore)
        continue
      if (row.parent !== -1 || this.roots.length > 1)
        path.push(row.key)
    }
    return path.reverse()
  }

  isExpanded(id: string, depth: number): boolean {
    return this.opened.has(id) || (depth < this.depth && !this.closed.has(id))
  }

  expand(id: string): boolean {
    return this.set(id, true)
  }

  collapse(id: string): boolean {
    return this.set(id, false)
  }

  toggle(id: string): boolean {
    const index = this.indexOf(id)
    if (index === -1)
      return false
    return this.set(id, !this.rows[index].expanded)
  }

  /** Expand a row and everything under it, or the whole tree when no row is named. */
  expandAll(id?: string): void {
    const open = (node: TreeNode, rowId: string, depth: number): void => {
      if (!isExpandable(node))
        return
      if (depth >= this.depth)
        this.opened.add(rowId)
      this.closed.delete(rowId)
      node.children?.forEach((child, index) => open(child, child.id ?? `${rowId}.${index}`, depth + 1))
    }

    if (id === undefined) {
      this.roots.forEach((root, index) => open(root, root.id ?? String(index), 0))
    }
    else {
      const found = this.find(id)
      if (!found)
        return
      open(found.node, id, found.ancestors.length)
    }
    this.flatten()
  }

  /** Close everything, the roots included. */
  collapseAll(): void {
    this.opened.clear()
    this.closed.clear()
    const close = (node: TreeNode, rowId: string, depth: number): void => {
      if (depth >= this.depth || !isExpandable(node))
        return
      this.closed.add(rowId)
      node.children?.forEach((child, index) => close(child, child.id ?? `${rowId}.${index}`, depth + 1))
    }
    this.roots.forEach((root, index) => close(root, root.id ?? String(index), 0))
    this.flatten()
  }

  /**
   * Make a row visible by expanding everything above it, wherever it is in the
   * tree. Returns its index, or -1 when no node has that id. This is how a
   * cycle is followed back to the node it points at.
   */
  reveal(id: string): number {
    const found = this.find(id)
    if (!found)
      return -1
    found.ancestors.forEach((ancestor, depth) => {
      this.closed.delete(ancestor)
      if (depth >= this.depth)
        this.opened.add(ancestor)
    })
    this.flatten()
    return this.indexOf(id)
  }

  /**
   * Add children that were asked for through a "more" row. `more` is how many
   * are still missing afterwards.
   */
  appendChildren(id: string, nodes: TreeNode[], more = 0): boolean {
    const found = this.find(id)
    if (!found)
      return false
    const node = found.node
    node.children = [...(node.children ?? []), ...nodes]
    if (more > 0)
      node.more = more
    else
      delete node.more
    this.flatten()
    return true
  }

  /**
   * What a navigation key does from a row. The keys are the ones the WAI-ARIA
   * tree pattern names; anything else leaves the cursor where it is.
   */
  move(index: number, key: string, pageSize = 10): TreeMove {
    const last = this.rows.length - 1
    if (last < 0)
      return { index: -1, changed: false }
    const at = Math.min(Math.max(index, 0), last)
    const row = this.rows[at]
    const still = (next: number): TreeMove => ({ index: Math.min(Math.max(next, 0), last), changed: false })

    switch (key) {
      case 'ArrowDown':
        return still(index < 0 ? 0 : at + 1)
      case 'ArrowUp':
        return still(at - 1)
      case 'Home':
        return still(0)
      case 'End':
        return still(last)
      case 'PageDown':
        return still(at + pageSize)
      case 'PageUp':
        return still(at - pageSize)
      case 'ArrowRight':
        if (!row.expandable || row.isMore)
          return still(at)
        if (!row.expanded)
          return { index: at, changed: this.expand(row.id) }
        return still(at + 1)
      case 'ArrowLeft':
        if (row.expanded && !row.isMore)
          return { index: at, changed: this.collapse(row.id) }
        return still(row.parent === -1 ? at : row.parent)
      case '*': {
        // Every sibling at once, the row itself included.
        let changed = false
        const parent = row.parent
        const siblings = this.rows.filter(candidate => candidate.parent === parent && candidate.depth === row.depth && candidate.expandable && !candidate.expanded && !candidate.isMore)
        for (const sibling of siblings) {
          this.mark(sibling.id, sibling.depth, true)
          changed = true
        }
        if (changed)
          this.flatten()
        return { index: this.indexOf(row.id), changed }
      }
    }
    return still(at)
  }

  /**
   * The next row whose label starts with what was typed. A single character
   * moves on from the current row, so pressing it again cycles; a longer run
   * stays on the current row while it still matches.
   */
  typeahead(index: number, text: string): number {
    const needle = text.toLowerCase()
    const count = this.rows.length
    if (needle === '' || count === 0)
      return -1
    const from = needle.length === 1 ? index + 1 : Math.max(index, 0)
    for (let offset = 0; offset < count; offset++) {
      const at = (from + offset + count) % count
      const row = this.rows[at]
      if (!row.isMore && (row.node.label ?? '').toLowerCase().startsWith(needle))
        return at
    }
    return -1
  }

  private set(id: string, expanded: boolean): boolean {
    const index = this.indexOf(id)
    if (index === -1)
      return false
    const row = this.rows[index]
    if (!row.expandable || row.isMore || row.expanded === expanded)
      return false
    this.mark(id, row.depth, expanded)
    this.flatten()
    return true
  }

  private mark(id: string, depth: number, expanded: boolean): void {
    if (expanded) {
      this.closed.delete(id)
      if (depth >= this.depth)
        this.opened.add(id)
    }
    else {
      this.opened.delete(id)
      if (depth < this.depth)
        this.closed.add(id)
    }
  }

  /** Find a node anywhere in the tree by row id, with the ids of the rows above it. */
  private find(id: string): { node: TreeNode, ancestors: string[] } | null {
    const stack: Array<{ node: TreeNode, id: string, ancestors: string[] }> = []
    for (let index = this.roots.length - 1; index >= 0; index--)
      stack.push({ node: this.roots[index], id: this.roots[index].id ?? String(index), ancestors: [] })

    while (stack.length > 0) {
      const current = stack.pop() as { node: TreeNode, id: string, ancestors: string[] }
      if (current.id === id)
        return { node: current.node, ancestors: current.ancestors }
      const children = current.node.children
      if (!children || current.node.ref !== undefined)
        continue
      const ancestors = [...current.ancestors, current.id]
      for (let index = children.length - 1; index >= 0; index--)
        stack.push({ node: children[index], id: children[index].id ?? `${current.id}.${index}`, ancestors })
    }
    return null
  }

  /** Rebuild the visible rows. Walks expanded containers only. */
  private flatten(): void {
    const rows: TreeRow[] = []

    const visit = (node: TreeNode, id: string, depth: number, parent: number, key: string | number, posInSet: number, setSize: number): void => {
      const expandable = isExpandable(node)
      const expanded = expandable && this.isExpanded(id, depth)
      const at = rows.length
      rows.push({ id, node, depth, key, parent, expandable, expanded, posInSet, setSize, isMore: false })
      if (!expanded)
        return

      const children = node.children ?? []
      const more = node.more ?? 0
      const indexed = isIndexed(node)
      const size = children.length + (more > 0 ? 1 : 0)
      for (let index = 0; index < children.length; index++) {
        const child = children[index]
        visit(child, child.id ?? `${id}.${index}`, depth + 1, at, child.key ?? (indexed ? index : (child.label ?? index)), index + 1, size)
      }
      if (more > 0)
        rows.push({ id: `${id}.+`, node, depth: depth + 1, key: '', parent: at, expandable: false, expanded: false, posInSet: size, setSize: size, isMore: true })
    }

    this.roots.forEach((root, index) => visit(root, root.id ?? String(index), 0, -1, root.key ?? index, index + 1, this.roots.length))
    this.rows = rows
    this.index = null
    this.version++
  }
}
