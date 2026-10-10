import type { BindingManifest, ManifestEntry } from '../../binding-manifest'
import type { STXDocument, STXNode } from '../compiler/ir'
import type { NativeHost, NativeNode } from './native-host'

export interface NativeBindingNode extends NativeNode {
  nodeType: 1
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
}

/** Match the browser's decoded getAttribute() value without pulling compiler code into the runtime bundle. */
function decodeBindingValue(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '\'')
    .replace(/&#x27;/gi, '\'')
    .replace(/&amp;/g, '&')
}

function createBindingNode(id: string, type: string, bindings: ManifestEntry['bindings'], connected = true): NativeBindingNode {
  // Browsers decode attribute entities before getAttribute(). Native binding
  // nodes must provide the same input to the shared signals runtime.
  const attributes = bindings.map(binding => ({
    name: binding.name,
    value: decodeBindingValue(binding.value),
  }))
  const node = {
    __stxId: id,
    nodeType: 1 as const,
    tagName: type.toUpperCase(),
    attributes,
    parentNode: null,
    parentElement: null,
    childNodes: [],
    children: [],
    nextSibling: null,
    nextElementSibling: null,
    namespaceURI: '',
    isConnected: true,
    hasAttribute(name: string) {
      return attributes.some(attribute => attribute.name === name)
    },
    getAttribute(name: string) {
      return attributes.find(attribute => attribute.name === name)?.value ?? null
    },
    setAttribute(name: string, value: unknown) {
      const existing = attributes.find(attribute => attribute.name === name)
      if (existing) existing.value = String(value)
      else attributes.push({ name, value: String(value) })
    },
    removeAttribute(name: string) {
      const index = attributes.findIndex(attribute => attribute.name === name)
      if (index !== -1) attributes.splice(index, 1)
    },
    contains(candidate: NativeBindingNode) {
      for (let current: NativeBindingNode | null = candidate; current; current = current.parentNode)
        if (current === node) return true
      return false
    },
    querySelector(selector: string) {
      return node.querySelectorAll(selector)[0] ?? null
    },
    querySelectorAll(selector: string) {
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
      node.childNodes.forEach(visit)
      return found
    },
  }
  node.isConnected = connected
  return node
}

/** Clone the DOM-shaped metadata while the host clones the native descriptor. */
export function cloneNativeBindingNode(source: NativeBindingNode, id: string): NativeBindingNode {
  const bindings = source.attributes.map(attribute => ({
    name: attribute.name,
    value: attribute.value,
    kind: 'attr' as const,
  }))
  return createBindingNode(id, source.tagName, bindings, false)
}

/** Build host handles and a manifest-id lookup from already translated IR. */
export function materializeNativeBindingTree(
  document: STXDocument,
  manifest: BindingManifest,
  host: NativeHost,
): NativeBindingTree {
  const entries = new Map(manifest.entries.map(entry => [entry.id, entry]))
  const nodes = new Map<number, NativeBindingNode>()
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
    const node = createBindingNode(id, source.type, runtimeBindings)
    source.id = id
    source.props.__stxId = id
    node.parentNode = parent
    node.parentElement = parent
    host.adopt(node, source.type, parent, source)
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

  return { root: visit(document.root, null), nodes }
}
