/**
 * Tinker results as tree nodes.
 *
 * `@stacksjs/tinker` describes any runtime value as a bounded, JSON-safe tree
 * of tagged nodes (`serialize.ts` in that package). This turns one of those
 * into the generic nodes `./core` shows. The type below is a structural copy,
 * so this package needs no dependency on that one and a value from any
 * version that keeps the shape is accepted.
 */
import type { TreeNode, TreeOpenKind } from './core'

export interface TinkerStackFrame {
  function?: string
  file?: string
  line?: number
  column?: number
}

export interface TinkerErrorValue {
  t: 'error'
  name: string
  message: string
  stack?: string
  frames?: TinkerStackFrame[]
  cause?: TinkerValue
  entries?: Array<[string, TinkerValue]>
}

export interface TinkerModelValue {
  t: 'model'
  id: number
  model: string
  table?: string
  primaryKey?: string
  key?: TinkerValue
  attributes: Array<[string, TinkerValue]>
  hidden?: string[]
  loaded?: Array<[string, TinkerValue]>
  relations?: Array<{ kind: string, model: string, name?: string }>
  more?: number
}

export interface TinkerHtmlValue {
  t: 'html'
  kind: 'mail' | 'view' | 'html'
  title?: string
  html: string
  text?: string
  truncated?: number
}

export type TinkerValue =
| { t: 'undefined' }
| { t: 'null' }
| { t: 'boolean', v: boolean }
| { t: 'number', v: number | 'NaN' | 'Infinity' | '-Infinity' | '-0' }
| { t: 'bigint', v: string }
| { t: 'string', v: string, truncated?: number }
| { t: 'symbol', v: string }
| { t: 'function', name: string, kind: 'function' | 'async' | 'class' | 'generator' }
| { t: 'date', v: string | null }
| { t: 'regexp', v: string }
| { t: 'url', v: string }
| { t: 'promise' }
| { t: 'bytes', ctor: string, length: number, hex: string }
| { t: 'array', id: number, ctor?: string, length: number, items: TinkerValue[], more?: number }
| { t: 'object', id: number, ctor?: string, entries: Array<[string, TinkerValue]>, more?: number }
| { t: 'map', id: number, size: number, entries: Array<[TinkerValue, TinkerValue]>, more?: number }
| { t: 'set', id: number, size: number, items: TinkerValue[], more?: number }
| TinkerModelValue
| TinkerHtmlValue
| { t: 'ref', id: number }
| { t: 'cut', reason: 'depth' | 'nodes', ctor?: string }
| TinkerErrorValue

export interface FromTinkerOptions {
  /**
   * Put in front of every node id. Two results shown in one tree both number
   * their objects from one, so each needs its own prefix for a cycle to point
   * at the right node. Default `t`.
   */
  idPrefix?: string
}

/** What the tree's `meta` holds for a model node. */
export interface TinkerModelMeta {
  model: string
  table?: string
  primaryKey?: string
  hidden: string[]
  relations: Array<{ kind: string, model: string, name?: string }>
}

/** What the tree's `meta` holds for rendered markup. */
export interface TinkerHtmlMeta {
  kind: TinkerHtmlValue['kind']
  title?: string
  text?: string
  truncated?: number
}

const CONTAINERS = new Set(['array', 'object', 'map', 'set', 'model', 'error'])
const STRING_PREVIEW = 120
const SUMMARY_KEYS = 5

function isRecordLike(value: TinkerValue): boolean {
  return value.t === 'object' || value.t === 'model'
}

/** Whether a value reads as rows: a list whose members are objects or models. */
function isTabular(items: TinkerValue[]): boolean {
  return items.length > 0 && items.slice(0, 20).every(isRecordLike)
}

function hasNestedContainer(values: TinkerValue[]): boolean {
  return values.some(value => CONTAINERS.has(value.t))
}

function quoted(text: string, truncated?: number): string {
  const shown = text.length > STRING_PREVIEW ? `${text.slice(0, STRING_PREVIEW)}…` : text
  return truncated ? `${JSON.stringify(shown)} (${truncated} more characters)` : JSON.stringify(shown)
}

function frameLocation(frame: TinkerStackFrame): string {
  if (!frame.file)
    return ''
  return [frame.file, frame.line, frame.column].filter(part => part !== undefined).join(':')
}

/**
 * Turn a tinker value into a tree node.
 *
 * Every container keeps the serializer's object id (prefixed), which is what a
 * `ref` names, so following a cycle in the tree lands on the right node.
 */
export function fromTinkerValue(value: TinkerValue, label?: string, options: FromTinkerOptions = {}): TreeNode {
  const prefix = options.idPrefix ?? 't'
  const idOf = (id: number): string => `${prefix}${id}`

  const named = (node: TreeNode, name: string | undefined): TreeNode => {
    if (name !== undefined)
      node.label = name
    return node
  }

  const short = (inner: TinkerValue): string => walk(inner, undefined).preview ?? inner.t

  const open = (node: TreeNode, kinds: TreeOpenKind[]): TreeNode => {
    if (kinds.length > 0)
      node.openable = kinds.length === 1 ? kinds[0] : kinds
    return node
  }

  function walk(current: TinkerValue, name: string | undefined): TreeNode {
    switch (current.t) {
      case 'undefined':
      return named({ kind: 'undefined', value: undefined, preview: 'undefined' }, name)
      case 'null':
      return named({ kind: 'null', value: null, preview: 'null' }, name)
      case 'boolean':
      return named({ kind: 'boolean', value: current.v, preview: String(current.v) }, name)
      case 'number': {
        const number = typeof current.v === 'number' ? current.v : (current.v === '-0' ? -0 : Number(current.v))
        return named({ kind: 'number', value: number, preview: String(current.v) }, name)
      }
      case 'bigint':
      return named({ kind: 'bigint', value: current.v, preview: `${current.v}n` }, name)
      case 'string':
      return named({ kind: 'string', value: current.v, preview: quoted(current.v, current.truncated) }, name)
      case 'symbol':
      return named({ kind: 'symbol', preview: `Symbol(${current.v})` }, name)
      case 'function': {
        const preview = current.kind === 'class'
          ? `class ${current.name}`
          : `${current.kind === 'async' ? 'async ' : ''}ƒ${current.kind === 'generator' ? '*' : ''} ${current.name}()`
        return named({ kind: 'function', preview }, name)
      }
      case 'date':
      return named({ kind: 'date', value: current.v, preview: current.v ?? 'Invalid Date' }, name)
      case 'regexp':
      return named({ kind: 'regexp', value: current.v, preview: current.v }, name)
      case 'url':
      return named({ kind: 'url', value: current.v, preview: current.v }, name)
      case 'promise':
      return named({ kind: 'promise', preview: 'Promise' }, name)
      case 'bytes': {
        const cut = current.length * 2 > current.hex.length
        return named({ kind: 'bytes', value: current.hex, preview: `${current.ctor}(${current.length}) <${current.hex}${cut ? '…' : ''}>` }, name)
      }
      case 'ref':
      return named({ kind: 'ref', ref: idOf(current.id), preview: '[Circular]' }, name)
      case 'cut':
      return named({ kind: 'cut', preview: `${current.ctor ?? 'Object'} … (${current.reason === 'depth' ? 'too deep to show' : 'result too large to show'})` }, name)

      case 'array': {
        const node: TreeNode = {
          id: idOf(current.id),
          kind: 'array',
          preview: `${current.ctor ?? 'Array'}(${current.length})`,
          children: current.items.map((item, index) => walk(item, String(index))),
        }
        if (current.more)
          node.more = current.more
        return named(open(node, isTabular(current.items) ? ['table'] : []), name)
      }

      case 'set': {
        const node: TreeNode = {
          id: idOf(current.id),
          kind: 'set',
          preview: `Set(${current.size})`,
          children: current.items.map((item, index) => walk(item, String(index))),
        }
        if (current.more)
          node.more = current.more
        return named(open(node, isTabular(current.items) ? ['table'] : []), name)
      }

      case 'object': {
        const keys = current.entries.slice(0, SUMMARY_KEYS).map(([key]) => key).join(', ')
        const total = current.entries.length + (current.more ?? 0)
        const body = total === 0 ? '{}' : `{${keys}${total > SUMMARY_KEYS ? ', …' : ''}}`
        const node: TreeNode = {
          id: idOf(current.id),
          kind: 'object',
          preview: current.ctor && current.ctor !== 'Object' ? `${current.ctor} ${body}` : body,
          children: current.entries.map(([key, inner]) => walk(inner, key)),
        }
        if (current.more)
          node.more = current.more
        return named(open(node, hasNestedContainer(current.entries.map(entry => entry[1])) ? ['graph'] : []), name)
      }

      case 'map': {
        const node: TreeNode = {
          id: idOf(current.id),
          kind: 'map',
          preview: `Map(${current.size})`,
          children: current.entries.map(([key, inner], index) => {
            // A scalar key names its entry. A key that is itself a container
            // has to be shown, so the entry holds both sides.
            if (!CONTAINERS.has(key.t)) {
              const child = walk(inner, short(key))
              child.key = key.t === 'string' ? key.v : short(key)
              return child
            }
            return { kind: 'entry', label: String(index), key: index, preview: `${short(key)} => ${short(inner)}`, children: [walk(key, 'key'), walk(inner, 'value')] }
          }),
        }
        if (current.more)
          node.more = current.more
        return named(open(node, hasNestedContainer(current.entries.map(entry => entry[1])) ? ['graph'] : []), name)
      }

      case 'model': {
        const children = current.attributes.map(([key, inner]) => walk(inner, key))
        for (const [relation, inner] of current.loaded ?? []) {
          const child = walk(inner, relation)
          child.meta = child.meta ?? { relation: true }
          children.push(child)
        }
        if (current.hidden?.length) {
          children.push({
            kind: 'hidden',
            label: '[hidden]',
            key: '[hidden]',
            preview: current.hidden.join(', '),
            children: current.hidden.map((hidden, index) => ({ kind: 'hidden', label: String(index), value: hidden, preview: hidden })),
          })
        }
        if (current.relations?.length) {
          children.push({
            kind: 'relations',
            label: '[relations]',
            key: '[relations]',
            preview: `${current.relations.length} declared`,
            children: current.relations.map(relation => ({
              kind: 'relation',
              label: relation.name ?? relation.model,
              value: relation,
              preview: `${relation.kind} ${relation.model}`,
            })),
          })
        }

        const meta: TinkerModelMeta = { model: current.model, hidden: current.hidden ?? [], relations: current.relations ?? [] }
        if (current.table)
          meta.table = current.table
        if (current.primaryKey)
          meta.primaryKey = current.primaryKey
        const node: TreeNode = {
          id: idOf(current.id),
          kind: 'model',
          preview: current.key ? `${current.model} #${short(current.key).replace(/^"|"$/g, '')}` : current.model,
          children,
          meta,
        }
        if (current.more)
          node.more = current.more
        return named(open(node, ['graph']), name)
      }

      case 'html': {
        const meta: TinkerHtmlMeta = { kind: current.kind }
        if (current.title)
          meta.title = current.title
        if (current.text)
          meta.text = current.text
        if (current.truncated)
          meta.truncated = current.truncated
        const cut = current.truncated ? `, ${current.truncated} more cut` : ''
        const title = current.title ? `: ${current.title}` : ''
        return named(open({ kind: 'html', value: current.html, preview: `${current.kind}${title} (${current.html.length} characters${cut})`, meta }, ['preview']), name)
      }

      case 'error': {
        const children: TreeNode[] = [{ kind: 'string', label: 'message', value: current.message, preview: quoted(current.message) }]
        if (current.frames?.length) {
          children.push({
            kind: 'stack',
            label: 'stack',
            preview: `${current.frames.length} frames`,
            value: current.stack,
            children: current.frames.map((frame, index) => ({
              kind: 'frame',
              label: String(index),
              value: frame,
              preview: [frame.function, frameLocation(frame)].filter(Boolean).join(' at ') || '(unknown)',
              meta: frame,
            })),
          })
        }
        else if (current.stack) {
          children.push({ kind: 'string', label: 'stack', value: current.stack, preview: quoted(current.stack) })
        }
        if (current.cause)
          children.push(walk(current.cause, 'cause'))
        for (const [key, inner] of current.entries ?? [])
          children.push(walk(inner, key))
        return named({ kind: 'error', preview: current.message ? `${current.name}: ${current.message}` : current.name, children }, name)
      }
    }

    // A tag this version does not know: show that it is there instead of dropping it.
    return named({ kind: 'unknown', preview: String((current as { t?: unknown }).t ?? 'unknown') }, name)
  }

  return walk(value, label)
}
