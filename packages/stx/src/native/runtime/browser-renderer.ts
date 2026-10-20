import type { NativeMutationOperation, NativeMutationPayload } from '../bridge/protocol'
import { LUCIDE_TO_SF } from '../compiler/icons'
import type { STXNode } from '../compiler/ir'

const SYMBOL_TO_ICON = Object.fromEntries(Object.entries(LUCIDE_TO_SF).map(([name, symbol]) => [symbol, name]))
const SVG_NS = 'http://www.w3.org/2000/svg'
const SVG: Record<string, string> = { Svg: 'svg', G: 'g', Path: 'path', Line: 'line', Rect: 'rect', Circle: 'circle', Ellipse: 'ellipse', Polyline: 'polyline', Polygon: 'polygon', SvgText: 'text' }
const TAGS: Record<string, string> = { View: 'div', SafeAreaView: 'div', ScrollView: 'div', KeyboardAvoidingView: 'div', Text: 'span', TextInput: 'input', Button: 'button', Link: 'a', TouchableOpacity: 'button', TouchableHighlight: 'button', Pressable: 'button', Icon: 'span', Image: 'img', ImageBackground: 'div', Video: 'video', FlatList: 'div', SectionList: 'div', Switch: 'input', Checkbox: 'input', Slider: 'input', Picker: 'select', DatePicker: 'input', Modal: 'dialog', ActivityIndicator: 'progress', StatusBar: 'div', RefreshControl: 'progress', Sidebar: 'aside', SplitView: 'div' }
const CONTAINERS = new Set(['View', 'SafeAreaView', 'ScrollView', 'KeyboardAvoidingView', 'FlatList', 'SectionList', 'Sidebar', 'SplitView', 'ImageBackground'])
const UNITLESS = new Set(['opacity', 'flex', 'flexGrow', 'flexShrink', 'fontWeight', 'zIndex', 'aspectRatio', 'order'])
const SVG_PROPS: Record<string, string> = { viewBox: 'viewBox', fillRule: 'fill-rule', clipRule: 'clip-rule', strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', strokeDasharray: 'stroke-dasharray', strokeDashoffset: 'stroke-dashoffset', fillOpacity: 'fill-opacity', strokeOpacity: 'stroke-opacity', textAnchor: 'text-anchor' }

interface RecordNode {
  element: HTMLElement | SVGElement
  type: string
  props: Record<string, unknown>
  style: Record<string, unknown>
  events: Record<string, string>
  children: string[]
  parent: string | null
  dispose: Array<() => void>
  layoutObserver?: ResizeObserver
  layoutObservedParent?: Element
  text?: string
}

export interface BrowserRendererOptions {
  /** Iconify bodies, indexed by Iconify class, bare name or platform symbol. */
  icons?: Record<string, { body: string, width?: number, height?: number }>
  event: (handlerId: string, payload: Record<string, unknown>) => void
  resolveMedia?: (url: string) => Promise<string>
}

/** Real browser controls for the same view descriptors and mutations as Craft. */
export class BrowserScreenRenderer {
  readonly nodes = new Map<string, RecordNode>()
  private revision = 0
  private root: string | null = null

  constructor(readonly container: HTMLElement, private readonly options: BrowserRendererOptions) {}

  render(tree: STXNode): void {
    const ids = new Set<string>()
    const validate = (node: STXNode): void => {
      if (!node.id || ids.has(node.id)) throw new Error('Screen node ids must be unique and non-empty')
      ids.add(node.id)
      this.tag(node.type)
      if (node.type === 'Icon') this.icon(node.props)
      for (const child of node.children) if (typeof child !== 'string') validate(child)
    }
    validate(tree)
    this.dispose()
    const create = (node: STXNode, parent: string | null): HTMLElement | SVGElement => {
      if (!node.id) throw new Error('A portable screen node needs an id')
      const record = this.create(node.id, node.type, node.props, { ...node.style }, node.events)
      record.parent = parent
      this.syncLayoutObserver(record)
      for (const child of node.children) {
        if (typeof child === 'string') {
          record.text = (record.text ?? '') + child
          record.element.append(this.container.ownerDocument.createTextNode(child))
        }
        else {
          record.element.append(create(child, node.id))
          record.children.push(child.id!)
        }
      }
      this.buttonLabel(record)
      return record.element
    }
    this.container.replaceChildren(create(tree, null))
    this.root = tree.id!
    this.revision = 0
  }

  mutate(batch: NativeMutationPayload): void {
    if (batch.version !== 1 || batch.baseRevision !== this.revision || batch.revision !== this.revision + 1)
      throw new Error('REVISION_MISMATCH')
    this.validate(batch.operations)
    for (const operation of batch.operations) {
      if (operation.op === 'createNode') {
        const record = this.create(operation.id, operation.node.type, operation.node.props ?? {}, operation.node.style ?? {}, operation.node.events ?? {})
        if (operation.node.children) {
          record.text = operation.node.children.join('')
          record.element.textContent = record.text
          this.buttonLabel(record)
        }
      }
      else if (operation.op === 'updateNode') {
        const record = this.nodes.get(operation.id)!
        Object.assign(record.props, operation.patch.props)
        Object.assign(record.style, operation.patch.style)
        Object.assign(record.events, operation.patch.events)
        if (operation.patch.children) {
          record.text = operation.patch.children.join('')
          record.element.textContent = record.text
        }
        this.update(record)
      }
      else if (operation.op === 'removeNode') this.remove(operation.id)
      else {
        const parent = this.nodes.get(operation.parentId)!
        const child = this.nodes.get(operation.childId)!
        if (child.parent) {
          const old = this.nodes.get(child.parent)!
          old.children = old.children.filter(id => id !== operation.childId)
        }
        parent.children.splice(operation.index, 0, operation.childId)
        child.parent = operation.parentId
        this.syncLayoutObserver(child)
        const before = parent.children[operation.index + 1]
        parent.element.insertBefore(child.element, before ? this.nodes.get(before)!.element : null)
      }
    }
    this.revision = batch.revision
  }

  private validate(operations: NativeMutationOperation[]): void {
    const parents = new Map([...this.nodes].map(([id, node]) => [id, node.parent]))
    const children = new Map([...this.nodes].map(([id, node]) => [id, [...node.children]]))
    const descriptors = new Map([...this.nodes].map(([id, node]) => [id, { type: node.type, props: { ...node.props } }]))
    const remove = (id: string): void => {
      for (const child of children.get(id) ?? []) remove(child)
      parents.delete(id)
      children.delete(id)
    }
    for (const operation of operations) {
      if (operation.op === 'createNode') {
        if (parents.has(operation.id) || !this.tag(operation.node.type)) throw new Error(`Invalid create: ${operation.id}`)
        const props = operation.node.props ?? {}
        if (operation.node.type === 'Icon') this.icon(props)
        descriptors.set(operation.id, { type: operation.node.type, props: { ...props } })
        parents.set(operation.id, null)
        children.set(operation.id, [])
      }
      else if (operation.op === 'insertChild' || operation.op === 'moveChild') {
        if (!parents.has(operation.parentId) || !parents.has(operation.childId)) throw new Error('Missing mutation node')
        let ancestor: string | null = operation.parentId
        while (ancestor) {
          if (ancestor === operation.childId) throw new Error('A screen tree cannot contain a cycle')
          ancestor = parents.get(ancestor) ?? null
        }
        const old = parents.get(operation.childId)
        if (old) children.set(old, children.get(old)!.filter(id => id !== operation.childId))
        const list = children.get(operation.parentId)!
        if (!Number.isInteger(operation.index) || operation.index < 0 || operation.index > list.length) throw new Error('Invalid child index')
        list.splice(operation.index, 0, operation.childId)
        parents.set(operation.childId, operation.parentId)
      }
      else {
        if (!parents.has(operation.id)) throw new Error(`Unknown mutation node: ${operation.id}`)
        if (operation.op === 'removeNode') {
          if (operation.id === this.root) throw new Error('Cannot remove the screen root')
          const parent = parents.get(operation.id)
          if (parent) children.set(parent, children.get(parent)!.filter(id => id !== operation.id))
          remove(operation.id)
        }
        else {
          if (operation.patch.children && children.get(operation.id)!.length) throw new Error('Cannot replace structural children with text')
          const descriptor = descriptors.get(operation.id)!
          Object.assign(descriptor.props, operation.patch.props)
          if (descriptor.type === 'Icon') this.icon(descriptor.props)
        }
      }
    }
  }

  private tag(type: string): string {
    const tag = SVG[type] ?? TAGS[type]
    if (!tag) throw new Error(`Unsupported browser primitive: ${type}`)
    return tag
  }

  private create(id: string, type: string, props: Record<string, unknown>, style: Record<string, unknown>, events: Record<string, string>): RecordNode {
    const doc = this.container.ownerDocument
    const tag = type === 'TextInput' && props.multiline ? 'textarea' : this.tag(type)
    const element = SVG[type] ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag)
    const record: RecordNode = { element, type, props: { ...props }, style: { ...style }, events: { ...events }, parent: null, children: [], dispose: [] }
    this.nodes.set(id, record)
    element.setAttribute('data-stx-node', id)
    element.setAttribute('data-stx-primitive', type)
    this.events(record)
    this.update(record)
    return record
  }

  private disabled(record: RecordNode): boolean {
    const state = record.props.accessibilityState as Record<string, unknown> | undefined
    return Boolean(record.props.disabled || state?.disabled)
  }

  private fire(record: RecordNode, name: string, payload: Record<string, unknown> = {}): void {
    if (this.disabled(record) && ['onPress', 'onLongPress', 'onPressIn', 'onPressOut', 'onChangeText', 'onValueChange', 'onSlidingComplete', 'onSubmitEditing'].includes(name)) return
    if (record.props.editable === false && ['onChangeText', 'onValueChange', 'onSubmitEditing'].includes(name)) return
    const handler = record.events[name]
    if (handler) this.options.event(handler, payload)
  }

  private events(record: RecordNode): void {
    const element = record.element
    const listen = (name: string, listener: EventListener): void => {
      element.addEventListener(name, listener)
      record.dispose.push(() => element.removeEventListener(name, listener))
    }
    listen('click', (event) => {
      if (this.disabled(record) || record.props.editable === false) {
        if (this.disabled(record) && element.tagName.toLowerCase() === 'a') event.preventDefault()
        return
      }
      // Native events do not bubble through other pressable controls.
      if ((event.target as Element)?.closest('[data-stx-pressable]') !== element && element.hasAttribute('data-stx-pressable')) return
      this.fire(record, 'onPress')
    })
    listen('input', () => {
      const input = element as HTMLInputElement
      if (record.type === 'Slider') this.fire(record, 'onValueChange', { value: Number(input.value) })
      else this.fire(record, 'onChangeText', { text: input.value, value: input.value })
    })
    listen('change', () => {
      const input = element as HTMLInputElement
      const value = record.type === 'Switch' || record.type === 'Checkbox' ? input.checked : record.type === 'Slider' ? Number(input.value) : input.value
      this.fire(record, 'onValueChange', { value, text: input.value })
      if (record.type === 'Slider') this.fire(record, 'onSlidingComplete', { value })
    })
    listen('focus', () => this.fire(record, 'onFocus'))
    listen('blur', () => { this.fire(record, 'onBlur'); this.fire(record, 'onEndEditing', { text: (element as HTMLInputElement).value }) })
    listen('keydown', (event) => {
      const key = (event as KeyboardEvent).key
      if (record.events.onPress && !['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase()) && (key === ' ' || key === 'Enter') && (event.target as Element)?.closest('[data-stx-pressable]') === element) {
        event.preventDefault()
        this.fire(record, 'onPress')
        return
      }
      if (key === 'Enter' && !record.props.multiline) this.fire(record, 'onSubmitEditing', { text: (element as HTMLInputElement).value })
    })
    listen('contextmenu', (event) => { if (record.events.onLongPress) { event.preventDefault(); this.fire(record, 'onLongPress') } })
    listen('pointerdown', () => this.fire(record, 'onPressIn'))
    listen('pointerup', () => this.fire(record, 'onPressOut'))
    listen('cancel', (event) => { if (record.events.onRequestClose) { event.preventDefault(); this.fire(record, 'onRequestClose') } })
    listen('close', () => this.fire(record, 'onDismiss'))
    listen('scroll', () => this.fire(record, 'onScroll', { contentOffset: { x: element.scrollLeft, y: element.scrollTop }, layoutMeasurement: { width: element.clientWidth, height: element.clientHeight }, contentSize: { width: element.scrollWidth, height: element.scrollHeight } }))
    const videoEvents: Record<string, string> = { play: 'onPlay', pause: 'onPause', ended: 'onEnd', timeupdate: 'onProgress', loadedmetadata: 'onLoad', loadstart: 'onLoadStart', loadeddata: 'onLoadEnd', error: 'onError', enterpictureinpicture: 'onPictureInPictureStart', leavepictureinpicture: 'onPictureInPictureStop' }
    if (record.type === 'Video') {
      for (const [name, native] of Object.entries(videoEvents)) listen(name, () => {
        const video = element as HTMLVideoElement
        this.fire(record, native, { currentTime: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0, position: video.currentTime, error: video.error?.message })
      })
    }
    if (record.type === 'ScrollView') {
      let start: number | null = null
      listen('touchstart', (event) => { start = element.scrollTop <= 0 ? (event as TouchEvent).touches[0]?.clientY ?? null : null })
      listen('touchend', (event) => {
        const end = (event as TouchEvent).changedTouches[0]?.clientY
        if (start !== null && end !== undefined && end - start > 80 && !record.props.refreshing) this.fire(record, 'onRefresh')
        start = null
      })
    }
  }

  private buttonLabel(record: RecordNode): void {
    if (record.type !== 'Button' || record.children.length !== 0) return
    const title = typeof record.props.title === 'string' ? record.props.title : record.text ?? ''
    if (record.element.textContent !== title) record.element.textContent = title
  }

  private update(record: RecordNode): void {
    const { element, props, type, style } = record
    const css = element.style
    css.cssText = ''
    css.boxSizing = 'border-box'
    css.borderStyle = 'solid'
    css.borderWidth = '0'
    if (CONTAINERS.has(type)) { css.display = 'flex'; css.flexDirection = 'column'; css.minWidth = '0'; css.flexShrink = '0' }
    if (type === 'Text') { css.display = 'block'; css.whiteSpace = 'pre-wrap'; css.flexShrink = '1'; css.minWidth = '0'; css.overflowWrap = 'anywhere' }
    if (['Button', 'Link', 'TouchableOpacity', 'TouchableHighlight', 'Pressable'].includes(type)) { css.display = 'flex'; css.flexDirection = 'column'; css.alignItems = 'stretch'; css.font = 'inherit'; css.color = 'inherit'; css.background = 'transparent'; css.border = '0'; css.padding = '0'; css.textAlign = 'inherit'; css.cursor = 'pointer' }
    if (type === 'ScrollView') {
      css.flex = '1 1 auto'; css.minHeight = '0'; css.flexDirection = props.horizontal ? 'row' : 'column'
      // One axis, as a native scroller has: a sideways row of chips must not
      // also scroll up and down inside the page.
      if (props.horizontal) { css.overflowX = 'auto'; css.overflowY = 'hidden'; css.overscrollBehaviorX = 'contain' }
      else { css.overflowY = 'auto'; css.overscrollBehaviorY = 'contain' }
      // The indicator props a host honours. Without this a chip row drew a
      // scrollbar under itself that the phone never shows.
      const hidden = props.horizontal ? props.showsHorizontalScrollIndicator === false : props.showsVerticalScrollIndicator === false
      if (hidden) css.setProperty('scrollbar-width', 'none')
    }
    if (type === 'Image') { css.objectFit = String(props.resizeMode ?? 'cover'); css.display = 'block' }
    if (type === 'TextInput') { css.font = 'inherit'; css.color = 'inherit'; css.background = 'transparent'; css.border = '0'; css.minWidth = '0'; css.minHeight = '32px'; css.outlineOffset = '2px' }
    if (type === 'Icon') { css.display = 'inline-block'; css.width = '20px'; css.height = '20px'; css.flexShrink = '0' }
    this.style(css, style)
    if (props.contentContainerStyle && typeof props.contentContainerStyle === 'object') this.style(css, props.contentContainerStyle as Record<string, unknown>)
    if (type === 'SafeAreaView') {
      const authored = { ...style, ...(props.contentContainerStyle && typeof props.contentContainerStyle === 'object' ? props.contentContainerStyle as Record<string, unknown> : {}) }
      this.applySafeAreaPadding(css, props.edges, authored)
    }
    if (props.testID != null) element.setAttribute('data-testid', String(props.testID))
    if (props.accessibilityLabel != null || (type === 'TextInput' && props.placeholder)) element.setAttribute('aria-label', String(props.accessibilityLabel ?? props.placeholder))
    else element.removeAttribute('aria-label')
    if (props.accessibilityHint != null) element.setAttribute('aria-description', String(props.accessibilityHint))
    else element.removeAttribute('aria-description')
    if (type === 'Link') {
      const destination = ['href', 'to'].map(name => props[name]).find(value => typeof value === 'string' && value.trim() !== '')
      if (destination) element.setAttribute('href', String(destination))
      else element.removeAttribute('href')
    }
    const accessibilityState = props.accessibilityState as Record<string, unknown> | undefined
    for (const key of ['selected', 'checked', 'disabled', 'busy', 'expanded']) {
      const value = key === 'disabled' && (props.disabled != null || accessibilityState?.disabled != null) ? this.disabled(record) : accessibilityState?.[key]
      if (value == null) element.removeAttribute(`aria-${key}`)
      else element.setAttribute(`aria-${key}`, String(value))
    }
    const linked = ['Link', 'TouchableOpacity', 'TouchableHighlight', 'Pressable'].includes(type)
      && ['href', 'to'].some(name => typeof props[name] === 'string' && props[name].trim() !== '')
    const role = props.accessibilityRole ?? (linked ? 'link' : undefined)
    if (role && role !== 'none') element.setAttribute('role', String(role === 'header' ? 'heading' : role))
    else element.removeAttribute('role')
    if (record.events.onPress || ['Button', 'Link', 'TouchableOpacity', 'TouchableHighlight', 'Pressable'].includes(type)) {
      element.setAttribute('data-stx-pressable', '')
      if (!['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase())) { element.setAttribute('role', String(role || 'button')); element.setAttribute('tabindex', this.disabled(record) ? '-1' : '0') }
    }
    if (['Switch', 'Checkbox', 'Slider', 'TextInput', 'DatePicker', 'Button', 'Picker'].includes(type)) (element as HTMLInputElement).disabled = this.disabled(record)
    if (type === 'Switch' || type === 'Checkbox') { const input = element as HTMLInputElement; input.type = 'checkbox'; input.checked = Boolean(props.value ?? props.checked); input.setAttribute('role', type === 'Switch' ? 'switch' : 'checkbox') }
    if (type === 'Slider') { const input = element as HTMLInputElement; input.type = 'range'; input.min = String(props.minimumValue ?? 0); input.max = String(props.maximumValue ?? 1); input.step = String(props.step ?? 'any'); input.value = String(props.value ?? 0) }
    if (type === 'TextInput' || type === 'DatePicker') {
      const input = element as HTMLInputElement
      if (type === 'DatePicker') {
        input.type = props.mode === 'time' ? 'time' : props.mode === 'datetime' ? 'datetime-local' : 'date'
        input.min = String(props.minimumDate ?? props.min ?? '')
        input.max = String(props.maximumDate ?? props.max ?? '')
        if (props.mode === 'time') input.step = String(Number(props.minuteInterval ?? 1) * 60)
      }
      else if (!props.multiline) input.type = props.secureTextEntry ? 'password' : props.keyboardType === 'email-address' ? 'email' : 'text'
      const inputMode = props.keyboardType === 'decimal-pad' ? 'decimal' : props.keyboardType === 'number-pad' || props.keyboardType === 'numeric' ? 'numeric' : props.keyboardType === 'phone-pad' ? 'tel' : ''
      if (inputMode) input.inputMode = inputMode
      const value = props.value == null ? '' : String(props.value)
      if (input.value !== value) input.value = value
      input.placeholder = String(props.placeholder ?? '')
      input.readOnly = props.editable === false
      if (props.maxLength != null) input.maxLength = Number(props.maxLength)
      if (props.autoComplete) input.autocomplete = String(props.autoComplete) as AutoFill
    }
    this.buttonLabel(record)
    if (type === 'Picker') {
      const select = element as HTMLSelectElement
      const options = (Array.isArray(props.items) ? props.items : Array.isArray(props.options) ? props.options : []) as Array<{ value: unknown, label?: unknown }>
      const signature = JSON.stringify(options)
      if (select.dataset.options !== signature) { select.replaceChildren(...options.map(option => { const node = element.ownerDocument.createElement('option'); node.value = String(option.value); node.textContent = String(option.label ?? option.value); return node })); select.dataset.options = signature }
      select.value = String(props.selectedValue ?? props.value ?? '')
    }
    if (type === 'Image' || type === 'Video' || type === 'ImageBackground') {
      const source = props.source ?? props.src
      const url = typeof source === 'string' ? source : source && typeof source === 'object' ? String((source as { uri?: string }).uri ?? '') : ''
      if (type === 'ImageBackground') css.backgroundImage = `url(${JSON.stringify(url)})`
      if (url !== element.getAttribute('data-source')) {
        element.setAttribute('data-source', url)
        const apply = (resolved: string): void => { if (!this.nodes.has(element.getAttribute('data-stx-node') ?? '') || element.getAttribute('data-source') !== url) return; if (type === 'ImageBackground') css.backgroundImage = `url(${JSON.stringify(resolved)})`; else (element as HTMLImageElement).src = resolved }
        apply(url)
        if (url && this.options.resolveMedia) void this.options.resolveMedia(url).then(apply).catch(() => {})
      }
    }
    if (type === 'Image') (element as HTMLImageElement).alt = String(props.accessibilityLabel ?? '')
    if (type === 'Video') { const video = element as HTMLVideoElement; video.controls = props.controls !== false; video.autoplay = Boolean(props.autoplay ?? props.autoPlay); video.poster = String(props.poster ?? ''); video.disablePictureInPicture = props.pictureInPicture === false; css.objectFit = props.resizeMode === 'contain' ? 'contain' : 'cover'; video.loop = Boolean(props.repeat ?? props.loop); video.muted = Boolean(props.muted); video.playsInline = true; if (typeof props.currentTime === 'number' && Math.abs(video.currentTime - props.currentTime) > 0.5) video.currentTime = props.currentTime; if (props.paused === true && !video.paused) video.pause(); if ((props.paused === false || (props.paused === undefined && video.autoplay)) && video.paused && video.src) void video.play().catch(() => {}) }
    if (type === 'Modal') {
      const dialog = element as HTMLDialogElement
      css.position = 'fixed'; css.inset = '0'; css.maxWidth = '100%'; css.maxHeight = '100%'; css.width = '100%'; css.height = '100%'; css.padding = '0'; css.margin = '0'; css.border = '0'
      const visible = Boolean(props.visible)
      if (!visible) { if (dialog.open) dialog.close(); css.display = 'none' }
      else queueMicrotask(() => { if (!dialog.isConnected || !record.props.visible) return; css.display = 'flex'; css.flexDirection = 'column'; if (!dialog.open) { dialog.showModal(); this.fire(record, 'onShow') } })
    }
    if (type === 'ActivityIndicator' || type === 'RefreshControl') { element.setAttribute('aria-label', String(props.accessibilityLabel ?? 'Loading')); css.width = '24px'; css.height = '24px' }
    if (type === 'StatusBar') css.display = 'none'
    if (type === 'Icon') {
      const icon = this.icon(props)
      css.backgroundColor = 'currentColor'
      const data = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${icon.width ?? 24} ${icon.height ?? 24}">${icon.body}</svg>`
      css.mask = `url("data:image/svg+xml,${encodeURIComponent(data)}") center / contain no-repeat`
      css.webkitMask = css.mask
      element.setAttribute('aria-hidden', props.accessibilityLabel ? 'false' : 'true')
    }
    if (type === 'Text' && props.numberOfLines) { css.overflow = 'hidden'; css.display = '-webkit-box'; css.webkitBoxOrient = 'vertical'; css.webkitLineClamp = String(props.numberOfLines) }
    if (SVG[type]) for (const [key, value] of Object.entries(props)) { if (['geometry', 'testID', 'accessibilityLabel'].includes(key)) continue; const name = SVG_PROPS[key] ?? key; if (value == null) element.removeAttribute(name); else element.setAttribute(name, Array.isArray(value) ? value.join(' ') : String(value)) }
    if (props.scrollTarget && typeof props.scrollTarget === 'object') { const target = props.scrollTarget as { id?: string, key?: unknown, animated?: boolean }; const signature = JSON.stringify(target); if (element.getAttribute('data-scroll-target') !== signature) { element.setAttribute('data-scroll-target', signature); queueMicrotask(() => { for (const candidate of this.nodes.values()) if (candidate.props.testID === target.id) candidate.element.scrollIntoView?.({ behavior: target.animated === false ? 'instant' : 'smooth', block: 'start' }) }) } }
    this.syncLayoutObserver(record)
  }

  private syncLayoutObserver(record: RecordNode): void {
    const wantsLayout = Boolean(record.events.onLayout)
    if (!wantsLayout) {
      record.layoutObserver?.disconnect()
      record.layoutObserver = undefined
      record.layoutObservedParent = undefined
      return
    }
    const parent = record.parent ? this.nodes.get(record.parent)?.element : this.container
    if (record.layoutObserver && record.layoutObservedParent === parent) return
    record.layoutObserver?.disconnect()
    record.layoutObserver = undefined
    record.layoutObservedParent = undefined
    const ResizeObserverConstructor = record.element.ownerDocument.defaultView?.ResizeObserver
    if (!ResizeObserverConstructor) return
    const observer = new ResizeObserverConstructor(() => {
      if (!this.nodes.has(record.element.getAttribute('data-stx-node') ?? '') || !record.events.onLayout) return
      const rect = record.element.getBoundingClientRect()
      const parentRect = (record.parent ? this.nodes.get(record.parent)?.element : this.container)?.getBoundingClientRect()
      this.fire(record, 'onLayout', {
        layout: {
          x: rect.left - (parentRect?.left ?? 0),
          y: rect.top - (parentRect?.top ?? 0),
          width: rect.width,
          height: rect.height,
        },
      })
    })
    observer.observe(record.element)
    if (parent && parent !== record.element) observer.observe(parent)
    record.layoutObserver = observer
    record.layoutObservedParent = parent
  }

  private applySafeAreaPadding(css: CSSStyleDeclaration, rawEdges: unknown, authored: Record<string, unknown>): void {
    const valid = new Set(['top', 'right', 'bottom', 'left'])
    const edges = Array.isArray(rawEdges) ? new Set(rawEdges.filter(edge => typeof edge === 'string' && valid.has(edge))) : valid
    const length = (value: unknown): string | undefined => value == null ? undefined : typeof value === 'number' ? `${value}px` : String(value)
    const shorthand = length(authored.padding)?.trim().split(/\s+/).filter(Boolean) ?? []
    const shorthandValues = shorthand.length === 1 ? [shorthand[0], shorthand[0], shorthand[0], shorthand[0]] : shorthand.length === 2 ? [shorthand[0], shorthand[1], shorthand[0], shorthand[1]] : shorthand.length === 3 ? [shorthand[0], shorthand[1], shorthand[2], shorthand[1]] : shorthand.length >= 4 ? shorthand.slice(0, 4) : []
    const shorthandByEdge: Record<string, string | undefined> = { top: shorthandValues[0], right: shorthandValues[1], bottom: shorthandValues[2], left: shorthandValues[3] }
    for (const edge of valid) {
      const property = `padding${edge[0].toUpperCase()}${edge.slice(1)}` as 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
      const axis = edge === 'top' || edge === 'bottom' ? authored.paddingVertical : authored.paddingHorizontal
      const authoredValue = length(authored[property]) ?? length(axis) ?? shorthandByEdge[edge] ?? (css[property] || '0px')
      css[property] = edges.has(edge) ? `calc(env(safe-area-inset-${edge}, 0px) + ${authoredValue})` : authoredValue
    }
  }

  private icon(props: Record<string, unknown>): { body: string, width?: number, height?: number } {
    const name = String(props.iconify ?? props.name ?? props.symbol ?? '')
    const find = (key: string) => this.options.icons?.[SYMBOL_TO_ICON[key]!] ?? this.options.icons?.[key] ?? this.options.icons?.[key.replace(/^i-lucide-/, '')]
    // A platform symbol's filled variant ("heart.fill") draws its outline's
    // glyph when the set has no filled one: Iconify's line sets do not.
    const icon = find(name) ?? this.options.icons?.[String(props.symbol)] ?? (name.endsWith('.fill') ? find(name.slice(0, -'.fill'.length)) : undefined)
    if (!icon) throw new Error(`No browser icon registered for ${name}`)
    return icon
  }

  private style(css: CSSStyleDeclaration, values: Record<string, unknown>): void {
    const set = (key: string, value: unknown): void => {
      const property = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      if (value == null) css.removeProperty(property)
      else css.setProperty(property, typeof value === 'number' && !UNITLESS.has(key) ? `${value}px` : String(value))
    }
    for (const [key, value] of Object.entries(values)) {
      if (key.endsWith('Horizontal')) { const base = key.slice(0, -10); set(`${base}Left`, value); set(`${base}Right`, value) }
      else if (key.endsWith('Vertical')) { const base = key.slice(0, -8); set(`${base}Top`, value); set(`${base}Bottom`, value) }
      else if (key === 'gridColumns') css.gridTemplateColumns = value ? `repeat(${value}, minmax(0, 1fr))` : ''
      // Native zero flex retains intrinsic size; CSS numeric zero instead sets a zero basis.
      else if (key === 'flex' && value === 0) set(key, '0 0 auto')
      else if (key === 'transform' && Array.isArray(value)) css.transform = value.flatMap(step => Object.entries(step as Record<string, unknown>).map(([name, amount]) => `${name}(${amount}${typeof amount === 'number' && (name.startsWith('translate') || name === 'perspective') ? 'px' : ''})`)).join(' ')
      else if (key.startsWith('shadow') || key === 'elevation' || key.startsWith('gradient') || key === 'resizeMode' || key === 'tintColor') continue
      else set(key, value)
    }
    if (values.gradientFrom && values.gradientTo) css.backgroundImage = `linear-gradient(${String(values.gradientDirection || 'to-b').replace(/^to-/, 'to ').replace('br', 'bottom right').replace('bl', 'bottom left').replace(/^to b$/, 'to bottom').replace(/^to r$/, 'to right').replace(/^to l$/, 'to left').replace(/^to t$/, 'to top')}, ${[values.gradientFrom, values.gradientVia, values.gradientTo].filter(Boolean).join(', ')})`
    if (values.shadowColor || values.shadowRadius) { const offset = values.shadowOffset as { width?: number, height?: number } | undefined; css.boxShadow = `${offset?.width ?? 0}px ${offset?.height ?? 0}px ${values.shadowRadius ?? 0}px ${values.shadowColor ?? 'transparent'}` }
  }

  private remove(id: string): void {
    const record = this.nodes.get(id)
    if (!record) return
    for (const child of [...record.children]) this.remove(child)
    for (const dispose of record.dispose) dispose()
    if (record.type === 'Video') { (record.element as HTMLVideoElement).pause(); (record.element as HTMLVideoElement).removeAttribute('src') }
    record.element.remove()
    if (record.parent) { const parent = this.nodes.get(record.parent); if (parent) parent.children = parent.children.filter(child => child !== id) }
    this.nodes.delete(id)
  }

  dispose(): void {
    for (const id of [...this.nodes.keys()]) this.remove(id)
    this.container.replaceChildren()
    this.root = null
    this.revision = 0
  }
}
