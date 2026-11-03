import type { BindingManifest, ManifestEntry } from '../../binding-manifest'
import type { STXDocument, STXNode } from '../compiler/ir'
import { authoredAccessibilityProps } from '../accessibility'
import { authoredTextEntryProps } from '../text-entry'
import type { NativeHost, NativeNode } from './native-host'

export interface NativeBindingNode extends NativeNode {
  nodeType: 1
  className: string
  classList: { add: (...tokens: string[]) => void, remove: (...tokens: string[]) => void }
  tagName: string
  attributes: Array<{ name: string, value: string }>
  parentNode: NativeBindingNode | null
  parentElement: NativeBindingNode | null
  childNodes: NativeNode[]
  children: NativeNode[]
  readonly nextSibling: NativeNode | null
  readonly nextElementSibling: NativeBindingNode | null
  namespaceURI: string
  isConnected: boolean
  readonly content?: NativeBindingNode
  hasAttribute: (name: string) => boolean
  getAttribute: (name: string) => string | null
  setAttribute: (name: string, value: unknown) => void
  removeAttribute: (name: string) => void
  contains: (node: NativeBindingNode) => boolean
  querySelector: (selector: string) => NativeBindingNode | null
  querySelectorAll: (selector: string) => NativeBindingNode[]
}

export interface NativeBindingTree {
  root: NativeBindingNode
  nodes: Map<number, NativeBindingNode>
  scopes: Map<string, NativeBindingNode>
}

/** Match the browser's decoded getAttribute() value without pulling compiler code into the runtime bundle. */
function decodeBindingValue(value: string): string {
  // Nearly every value holds no entity: six replaces each was most of a node's start.
  if (!value.includes('&')) return value
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '\'')
    .replace(/&#x27;/gi, '\'')
    .replace(/&amp;/g, '&')
}

/**
 * A native node as the shared signals runtime sees it: the DOM element subset
 * it reads and writes. A class, so a screen's hundreds of nodes share their
 * methods; an object literal per node made a dozen closures and accessors for
 * each, which an interpreted engine paid for on every mount. A native host
 * extends it once per screen with its position methods (`measure`,
 * `nextSibling`, ...), so even those cost a node nothing.
 */
export class BindingElement {
  __stxId: string
  __stxScope: string | undefined = undefined
  nodeType = 1 as const
  tagName: string
  attributes: Array<{ name: string, value: string }>
  parentNode: NativeBindingNode | null = null
  parentElement: NativeBindingNode | null = null
  childNodes: NativeNode[] = []
  children: NativeNode[] = []
  __stxOwner: NativeNode | null = null
  namespaceURI = ''
  isConnected = true
  // The runtime asks a node for its attributes by name constantly (a binding's
  // scope, a component's props); a list scanned per question was a fair share
  // of mounting a screen of rows.
  private readonly byName: Map<string, { name: string, value: string }>
  private readonly onClassChange: ((value: string) => void) | undefined
  private classTokens: { add: (...tokens: string[]) => void, remove: (...tokens: string[]) => void } | undefined

  constructor(id: string, type: string, attributes: Array<{ name: string, value: string }>, onClassChange?: (value: string) => void) {
    this.__stxId = id
    this.tagName = type === 'TextInput' ? 'INPUT' : type === 'Picker' ? 'SELECT' : type.toUpperCase()
    this.attributes = attributes
    this.byName = new Map(attributes.map(attribute => [attribute.name, attribute]))
    this.onClassChange = onClassChange
  }

  // Accessors, not fields, so a host's subclass can answer from its tree.
  get nextSibling(): NativeNode | null { return null }
  get nextElementSibling(): NativeBindingNode | null { return null }

  /** A class write a host has to carry to the native view. */
  protected classChanged(value: string): void { this.onClassChange?.(value) }

  get className(): string { return this.getAttribute('class') ?? '' }
  set className(value: string) { this.setAttribute('class', value) }

  get classList(): { add: (...tokens: string[]) => void, remove: (...tokens: string[]) => void } {
    const element = this
    return this.classTokens ??= {
      add(...tokens: string[]) { element.className = [...new Set([...element.className.split(/\s+/).filter(Boolean), ...tokens])].join(' ') },
      remove(...tokens: string[]) { element.className = element.className.split(/\s+/).filter(token => token && !tokens.includes(token)).join(' ') },
    }
  }

  // Native templates are recorded descriptors, not physical containers.
  // bindFor clones their children into the real parent on either target.
  get content(): NativeBindingNode | undefined { return this.tagName === 'TEMPLATE' ? this as unknown as NativeBindingNode : undefined }

  hasAttribute(name: string): boolean {
    return this.byName.has(name)
  }

  getAttribute(name: string): string | null {
    return this.byName.get(name)?.value ?? null
  }

  setAttribute(name: string, value: unknown): void {
    if (name === 'data-stx-scope') this.__stxScope = String(value)
    const existing = this.byName.get(name)
    if (existing) existing.value = String(value)
    else {
      const attribute = { name, value: String(value) }
      this.attributes.push(attribute)
      this.byName.set(name, attribute)
    }
    if (name === 'class') this.classChanged(String(value))
  }

  removeAttribute(name: string): void {
    if (name === 'data-stx-scope') this.__stxScope = undefined
    const existing = this.byName.get(name)
    if (existing) {
      this.attributes.splice(this.attributes.indexOf(existing), 1)
      this.byName.delete(name)
    }
    if (name === 'class') this.classChanged('')
  }

  contains(candidate: NativeBindingNode): boolean {
    for (let current: NativeBindingNode | null = candidate; current; current = current.parentNode)
      if ((current as unknown) === this) return true
    return false
  }

  querySelector(selector: string): NativeBindingNode | null {
    return this.querySelectorAll(selector)[0] ?? null
  }

  querySelectorAll(selector: string): NativeBindingNode[] {
    const found: NativeBindingNode[] = []
    const attribute = /^\[([^\]]+)\]$/.exec(selector)?.[1]
    const visit = (candidate: NativeNode): void => {
      const element = candidate as NativeBindingNode
      if (element.nodeType === 1) {
        if (selector === '*' || (attribute && element.hasAttribute(attribute)))
          found.push(element)
        element.childNodes.forEach(visit)
      }
    }
    this.childNodes.forEach(visit)
    return found
  }
}

export type BindingElementClass = new (id: string, type: string, attributes: Array<{ name: string, value: string }>, onClassChange?: (value: string) => void) => BindingElement

function createBindingNode(id: string, type: string, bindings: ManifestEntry['bindings'], connected = true, classes = '', onClassChange?: (value: string) => void, Element: BindingElementClass = BindingElement): NativeBindingNode {
  // Browsers decode attribute entities before getAttribute(). Native binding
  // nodes must provide the same input to the shared signals runtime.
  const attributes = bindings.map(binding => ({
    name: binding.name,
    value: decodeBindingValue(binding.value),
  }))
  if (classes && !attributes.some(attribute => attribute.name === 'class')) attributes.push({ name: 'class', value: classes })
  const node = new Element(id, type, attributes, onClassChange) as unknown as NativeBindingNode
  node.isConnected = connected
  return node
}

/** Clone the DOM-shaped metadata while the host clones the native descriptor. */
export function cloneNativeBindingNode(source: NativeBindingNode, id: string, onClassChange?: (value: string) => void, Element?: BindingElementClass): NativeBindingNode {
  const bindings = source.attributes.map(attribute => ({
    name: attribute.name,
    value: attribute.value,
    kind: 'attr' as const,
  }))
  return createBindingNode(id, source.tagName, bindings, false, source.className, onClassChange, Element)
}

/** The same, with the attributes a caller chose (a loop row's, less what it binds itself). */
export function cloneNativeBindingNodeWith(source: NativeBindingNode, id: string, attributes: Array<{ name: string, value: string }>, Element?: BindingElementClass): NativeBindingNode {
  const copies = new Array<{ name: string, value: string }>(attributes.length)
  for (let i = 0; i < attributes.length; i++) copies[i] = { name: attributes[i]!.name, value: attributes[i]!.value }
  const node = new (Element ?? BindingElement)(id, source.tagName, copies) as unknown as NativeBindingNode
  node.isConnected = false
  return node
}

/** Build host handles and a manifest-id lookup from already translated IR. */
export function materializeNativeBindingTree(
  document: STXDocument,
  manifest: BindingManifest,
  host: NativeHost,
): NativeBindingTree {
  const entries = new Map(manifest.entries.map(entry => [entry.id, entry]))
  const nodes = new Map<number, NativeBindingNode>()
  const scopes = new Map<string, NativeBindingNode>()
  let sequence = 0

  function visit(source: STXNode, parent: NativeBindingNode | null): NativeBindingNode {
    const id = `n${sequence++}`
    const entry = source.bindingId === undefined ? undefined : entries.get(source.bindingId)
    const runtimeBindings = [...(entry?.bindings ?? [])]
    for (const [name, value] of Object.entries(source.bindings ?? {})) {
      if (!runtimeBindings.some(binding => binding.name.replace(/^[:@]/, '') === name)) {
        runtimeBindings.push({ name: `:${name}`, value, kind: 'attr' })
      }
    }
    // A host's own element class carries class writes to it with no closure per node.
    const node = host.bindingElement
      ? createBindingNode(id, source.type, runtimeBindings, true, source._classes, undefined, host.bindingElement)
      : createBindingNode(id, source.type, runtimeBindings, true, source._classes, value => host.setAttribute(node, 'class', value))
    if (source.type === 'Checkbox' && source.props.type === 'checkbox') node.tagName = 'INPUT'
    if (source.props['data-stx-native-template']) node.tagName = 'TEMPLATE'
    // Static component metadata owns parent prop/event scopes too. The
    // manifest only records dynamic bindings, not these companion attributes.
    for (const [name, value] of Object.entries(authoredTextEntryProps(authoredAccessibilityProps(source.props, source._accessibilitySource), source._textEntrySource))) {
      if (value === undefined || value === null || name === '__stxId') continue
      node.setAttribute(name, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
    source.id = id
    source.props.__stxId = id
    node.parentNode = parent
    node.parentElement = parent
    host.adopt(node, source.type, parent, source)
    const scopeId = source.props['data-stx-scope']
    if (typeof scopeId === 'string') {
      node.setAttribute('data-stx-scope', scopeId)
      scopes.set(scopeId, node)
      const serializedProps = source.props['data-stx-props']
      if (serializedProps !== undefined) {
        node.setAttribute('data-stx-props', typeof serializedProps === 'string'
          ? serializedProps
          : JSON.stringify(serializedProps))
      }
    }
    if (source.bindingId !== undefined) {
      node.setAttribute('data-stx-b', source.bindingId)
      nodes.set(source.bindingId, node)
    }
    for (const child of source.children) {
      if (typeof child === 'string') continue
      const childNode = visit(child, node)
      node.childNodes.push(childNode)
      node.children.push(childNode)
    }
    return node
  }

  return { root: visit(document.root, null), nodes, scopes }
}
