/**
 * stx's rendered output to native view IR (stacksjs/stx#1983).
 *
 * `parser.ts` has its own lexer and parser for `.stx`, and it cannot read a
 * real stx template: of the three components the issue sampled, one throws and
 * two produce a single Text node holding raw template source. Directives,
 * server scripts, component composition and slots are most of what an stx
 * component is, and none of them are handled there.
 *
 * None of that needs reimplementing. stx's own pipeline already produces the
 * right input, because its rendered HTML keeps client bindings intact on
 * purpose -- `:show`, `x-text`, `@click` survive into the document so the
 * signals runtime can bind them. That output is a tag tree carrying class
 * strings and bindings, which is exactly what the native IR wants. So the
 * translator's input is rendered HTML, and directives are handled by the
 * pipeline that has thousands of tests behind it instead of by a second
 * parser with none.
 *
 * The tree is built with `HTMLRewriter` -- Bun's own HTML tokenizer -- rather
 * than a hand-written one, since replacing one bespoke parser with another
 * would miss the point.
 *
 * Nothing here fails silently. Every tag dropped, event discarded and style
 * property not understood comes back as a diagnostic, because the one failure
 * mode this target cannot afford is the one the old parser had: producing a
 * plausible tree that renders as the wrong screen.
 */
import type { STXDocument, STXNode, STXStyle } from './ir'
import { NATIVE_BOOLEAN_PROPS, nativePropName } from '../prop-names'
import { mapToNativeComponent } from './component-mapping'
import { resolveIconName } from './icons'
import { parseViewBox, SVG_DROPPED, SVG_NODE_TYPES, SVG_TYPES, svgGeometry } from './svg'
import { compileClassStyles } from './headwind-to-style'
import { createDocument, createNode } from './ir'

export type TranslationDiagnosticKind =
  /** The tag has no native type, so its subtree would be dropped on the device. */
  | 'unmapped-tag'
  /** Deliberately not translated: a script, a stylesheet, an icon's path data. */
  | 'dropped-subtree'
  /** Inline markup inside a Text node, kept as words with its emphasis lost. */
  | 'flattened-text'
  /** A handler no renderer reads, so wiring it would be a no-op on the device. */
  | 'unread-event'
  /** An inline CSS property the IR has no field for. */
  | 'unknown-style'
  /** A value the IR's field cannot hold, so emitting it would brick the screen. */
  | 'non-numeric-style'
  /** A legacy virtual-list prop has no meaning in the shared-runtime tree. */
  | 'unsupported-list-prop'

export interface TranslationDiagnostic {
  kind: TranslationDiagnosticKind
  /** The tag the diagnostic is about. */
  tag: string
  /** The attribute, property or event name, when the kind has one. */
  name?: string
}

export interface TranslationResult {
  root: STXNode
  diagnostics: TranslationDiagnostic[]
}

export interface TranslateOptions {
  /** Source path, recorded in the document meta. */
  source?: string
}

/**
 * Tags whose entire subtree is deliberately not translated: scripts and styles
 * are not views. (`svg` used to be here, keeping its box and dropping its
 * shapes; it is now drawn - see `svg.ts`.)
 */
const DROP_SUBTREE = new Set(['script', 'style', 'head', 'meta', 'link', 'title', 'base', 'noscript'])

/**
 * Elements that are not views but whose children are.
 *
 * `template` is the one that matters: stx strips it as an SFC wrapper, and a
 * native screen written as `<script>...</script><template>...</template>`
 * leaves it in the rendered output. Dropping it took the entire screen with
 * it -- which is how this was found, by the CLI's own fixtures translating to
 * nothing. `body` and `html` are here for a whole rendered document.
 */
const UNWRAP = new Set(['template', 'body', 'html', 'main', 'fragment'])

/** Nothing is mapped to a bare box any more; kept for the shape of `open`. */
const BOX_ONLY = new Set<string>()

/**
 * Web event name to the native name, as the renderers spell it.
 *
 * `parseAttributes` in `parser.ts` turns `@click` into `onClick`, and no
 * renderer reads `onClick` -- a tapped button does nothing on either platform.
 * The names below are the ones the renderers actually dispatch on.
 */
const EVENT_NAMES: Record<string, string> = {
  click: 'onPress',
  press: 'onPress',
  'press-in': 'onPressIn',
  pressin: 'onPressIn',
  'press-out': 'onPressOut',
  pressout: 'onPressOut',
  longpress: 'onLongPress',
  contextmenu: 'onLongPress',
  input: 'onChangeText',
  change: 'onValueChange',
  'value-change': 'onValueChange',
  valuechange: 'onValueChange',
  focus: 'onFocus',
  focusin: 'onFocus',
  blur: 'onBlur',
  focusout: 'onBlur',
  submit: 'onSubmitEditing',
  'submit-editing': 'onSubmitEditing',
  submitediting: 'onSubmitEditing',
  'end-editing': 'onEndEditing',
  endediting: 'onEndEditing',
  scroll: 'onScroll',
  // A drag starting and ending, and the deceleration after it: a pager reads
  // where a swipe came to rest from 'momentum-scroll-end', once per swipe.
  'scroll-begin-drag': 'onScrollBeginDrag',
  scrollbegindrag: 'onScrollBeginDrag',
  'scroll-end-drag': 'onScrollEndDrag',
  scrollenddrag: 'onScrollEndDrag',
  'momentum-scroll-begin': 'onMomentumScrollBegin',
  momentumscrollbegin: 'onMomentumScrollBegin',
  'momentum-scroll-end': 'onMomentumScrollEnd',
  momentumscrollend: 'onMomentumScrollEnd',
  refresh: 'onRefresh',
  layout: 'onLayout',
  'end-reached': 'onEndReached',
  endreached: 'onEndReached',
  close: 'onRequestClose',
  'request-close': 'onRequestClose',
  requestclose: 'onRequestClose',
  show: 'onShow',
  dismiss: 'onDismiss',
  'sliding-complete': 'onSlidingComplete',
  slidingcomplete: 'onSlidingComplete',
  'load-start': 'onLoadStart',
  loadstart: 'onLoadStart',
  load: 'onLoad',
  'load-end': 'onLoadEnd',
  loadend: 'onLoadEnd',
  error: 'onError',
  // A video's playback, in the web's names.
  play: 'onPlay',
  playing: 'onPlay',
  pause: 'onPause',
  ended: 'onEnd',
  end: 'onEnd',
  timeupdate: 'onProgress',
  progress: 'onProgress',
  loadedmetadata: 'onLoad',
}

/**
 * Every event name at least one renderer dispatches on.
 *
 * Pinned against the renderers by `html-to-ir.test.ts`: a handler mapped to a
 * name outside this set is reported rather than quietly attached to nothing.
 */
export const NATIVE_EVENTS = new Set([
  'onBlur',
  'onChangeText',
  'onDismiss',
  'onEnd',
  'onEndEditing',
  'onEndReached',
  'onError',
  'onFocus',
  'onLayout',
  'onLoad',
  'onLoadEnd',
  'onLoadStart',
  'onLongPress',
  'onMomentumScrollBegin',
  'onMomentumScrollEnd',
  'onPause',
  'onPlay',
  'onPress',
  'onPressIn',
  'onPressOut',
  'onProgress',
  'onRequestClose',
  'onRefresh',
  'onScroll',
  'onScrollBeginDrag',
  'onScrollEndDrag',
  'onShow',
  'onSlidingComplete',
  'onSubmitEditing',
  'onValueChange',
])

/** Every property `STXStyle` declares, for inline `style=""` translation. */
const STYLE_KEYS = new Set([
  'display', 'gridColumns', 'gridTemplateColumns', 'gridAutoRows',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexDirection', 'flexWrap',
  'justifyContent', 'alignItems', 'alignSelf', 'alignContent', 'position', 'top', 'right',
  'bottom', 'left', 'zIndex', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
  'maxHeight', 'aspectRatio', 'margin', 'marginTop', 'marginRight', 'marginBottom',
  'marginLeft', 'marginHorizontal', 'marginVertical', 'padding', 'paddingTop',
  'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingHorizontal', 'paddingVertical',
  'gap', 'rowGap', 'columnGap', 'borderWidth', 'borderTopWidth', 'borderRightWidth',
  'borderBottomWidth', 'borderLeftWidth', 'borderColor', 'borderTopColor',
  'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius',
  'borderBottomRightRadius', 'borderStyle', 'backgroundColor', 'backgroundImage',
  'opacity', 'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation',
  'color', 'fontSize', 'fontWeight', 'fontStyle', 'fontFamily', 'lineHeight',
  'letterSpacing', 'textAlign', 'textDecorationLine', 'textDecorationColor',
  'textTransform', 'resizeMode', 'tintColor', 'transform', 'overflow',
  'fill', 'stroke', 'strokeWidth',
  'gradientDirection', 'gradientFrom', 'gradientVia', 'gradientTo',
])

/**
 * Style properties the IR declares as a bare number.
 *
 * Emitting a string into one of these is not a dropped property, it is a
 * dropped screen: iOS reads them as `CGFloat?`, and Swift's synthesised
 * decoder fails the WHOLE document on a type mismatch. Verified against the
 * renderer's own structs -- `{"style":{"bottom":"max(env(...), 12px)"}}`
 * returns typeMismatch and nothing renders. `null` is harmless by comparison.
 */
const NUMERIC_STYLE_KEYS = new Set([
  'gridColumns', 'gridAutoRows', 'flex', 'flexGrow', 'flexShrink', 'zIndex', 'aspectRatio',
  'gap', 'rowGap', 'columnGap',
  'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius',
  'borderBottomRightRadius', 'opacity', 'shadowOpacity', 'shadowRadius', 'elevation',
  'fontSize', 'lineHeight', 'letterSpacing', 'strokeWidth',
])

/**
 * Properties the IR declares as `number | string`, where the string form is a
 * percentage and nothing else. A CSS function like `max(env(...), 12px)` is
 * not a dimension any renderer can read, so it is reported and dropped.
 */
const DIMENSION_STYLE_KEYS = new Set([
  'top', 'right', 'bottom', 'left', 'width', 'height', 'minWidth', 'maxWidth',
  'minHeight', 'maxHeight', 'flexBasis',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginHorizontal', 'marginVertical',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingHorizontal', 'paddingVertical',
])

/**
 * Every component type the IR declares, for `data-native` to name.
 *
 * Pinned against `ir.ts` by the test. A native screen written with the
 * primitive tags renders through stx like any other template -- the primitive
 * is an ordinary component that emits the closest HTML tag -- and the tag
 * alone cannot say which native type it came from, since `TouchableOpacity`,
 * `Pressable` and `TouchableHighlight` all emit a div. So the primitive states
 * its type and the translator takes its word for it, against this list.
 */
const NATIVE_TYPES = new Set([
  'Sidebar', 'SplitView',
  'View', 'ScrollView', 'SafeAreaView', 'KeyboardAvoidingView',
  'Text', 'TextInput',
  'Button', 'TouchableOpacity', 'TouchableHighlight', 'Pressable',
  'Icon', 'Image', 'ImageBackground', 'Video',
  'FlatList', 'SectionList',
  'Switch', 'Checkbox', 'Slider', 'Picker', 'DatePicker',
  'Modal', 'ActivityIndicator',
  'StatusBar', 'RefreshControl',
  ...SVG_NODE_TYPES,
])

/**
 * Props from the retired native-only list expander. The shared runtime owns
 * rows through keyed `:for`, so forwarding these props would look successful
 * while leaving the host with no row template (or no reactive update path).
 * Host-specific layout props such as `numColumns` remain valid and are not in
 * this set.
 */
const SHARED_RUNTIME_UNSUPPORTED_LIST_PROPS = new Map<string, string>([
  ['data', 'data'],
  ['sections', 'sections'],
  ['renderitem', 'renderItem'],
  ['rendersectionheader', 'renderSectionHeader'],
  ['keyextractor', 'keyExtractor'],
  ['listrole', 'listRole'],
])

/** A container type: it lays children out and does not render text itself. */
const CONTAINER_TYPES = new Set(['View', 'SafeAreaView', 'ScrollView', 'KeyboardAvoidingView'])

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
  '#39': '\'',
  '#x27': '\'',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (whole, name: string) => {
    const direct = ENTITIES[name.toLowerCase()]
    if (direct !== undefined)
      return direct
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X'
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return whole
  })
}

function camelCase(property: string): string {
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

/** `12px` to 12, `1.5rem` to 24, `1.5` to 1.5, anything else left as a string. */
function styleValue(raw: string): string | number {
  const pixels = /^(-?[\d.]+)px$/.exec(raw)
  if (pixels)
    return Number.parseFloat(pixels[1])
  const relative = /^(-?[\d.]+)r?em$/.exec(raw)
  if (relative)
    return Number.parseFloat(relative[1]) * 16
  if (/^-?[\d.]+$/.test(raw))
    return Number.parseFloat(raw)
  return raw
}

interface Frame {
  tag: string
  node: STXNode
  /** Inside an `<svg>`: tags are shapes, and text belongs to `SvgText`. */
  svg?: boolean
  /** Inside a dropped subtree: children and text are discarded. */
  dropped: boolean
  /** The node itself is not part of the tree. Discarded on close. */
  discard: boolean
  /** The node is not a view but its children are: they rise to the parent. */
  unwrap: boolean
}

interface Attributes {
  props: Record<string, unknown>
  style: STXStyle
  events: Record<string, string>
  bindings: Record<string, string>
  classes: string
  inline: STXStyle
}

function readAttributes(
  tag: string,
  attributes: Array<[string, string]>,
  diagnostics: TranslationDiagnostic[],
): Attributes {
  const props: Record<string, unknown> = {}
  const events: Record<string, string> = {}
  const bindings: Record<string, string> = {}
  let classes = ''
  let inline: STXStyle = {}

  for (const [rawName, value] of attributes) {
    const name = rawName.toLowerCase()

    if (name === 'class' || name === 'classname') {
      classes = classes ? `${classes} ${value}` : value
      continue
    }

    if (name === 'style') {
      inline = { ...inline, ...inlineStyle(tag, value, diagnostics) }
      continue
    }

    // A client binding, kept verbatim. `:text` and `x-text` are the same
    // binding in two spellings, so both normalise to `text`.
    if (name.startsWith(':') || (name.startsWith('x-') && name !== 'x-cloak')) {
      bindings[name.startsWith(':') ? name.slice(1) : name.slice(2)] = decodeEntities(value)
      continue
    }
    if (name === 'x-cloak')
      continue

    if (name.startsWith('@') || name.startsWith('v-on:')) {
      const spelling = name.startsWith('@') ? name.slice(1) : name.slice(5)
      // `@keydown.enter` -- the modifier is a DOM concept with no native form.
      const [base] = spelling.split('.')
      const native = EVENT_NAMES[base] ?? (base.startsWith('on') ? base : '')
      if (!native || !NATIVE_EVENTS.has(native)) {
        diagnostics.push({ kind: 'unread-event', tag, name: rawName })
        continue
      }
      events[native] = decodeEntities(value)
      continue
    }

    if (name === 'key') {
      props.key = value
      continue
    }

    const decoded = decodeEntities(value)
    const prop = nativePropName(rawName)
    if (decoded === '' && NATIVE_BOOLEAN_PROPS.has(prop)) {
      props[prop] = true
      continue
    }
    try {
      props[prop] = JSON.parse(decoded)
    }
    catch {
      props[prop] = decoded
    }
  }

  const style = { ...(classes ? compileClassStyles(classes).style : {}), ...inline }
  return { props, style, events, bindings, classes, inline }
}

/**
 * The style properties whose value is a structure, as the IR declares them:
 * an offset is `{ width, height }` and a transform a list of one-key steps.
 * Kept whole from a `style={{...}}` object; every other property is a number
 * or a string.
 */
function structuredStyle(property: string, value: unknown): unknown {
  if (property === 'shadowOffset') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    const { width, height } = value as Record<string, unknown>
    return typeof width === 'number' && typeof height === 'number' ? { width, height } : undefined
  }
  if (property === 'transform') {
    if (!Array.isArray(value)) return undefined
    const steps = value.filter((step): step is Record<string, unknown> => Boolean(step) && typeof step === 'object' && !Array.isArray(step) && Object.keys(step).length === 1)
      .filter(step => ['number', 'string'].includes(typeof Object.values(step)[0]))
    return steps.length ? steps : undefined
  }
  return undefined
}

/** Whether this property's field can hold this string at all. */
function holdsString(property: string, value: string): boolean {
  if (NUMERIC_STYLE_KEYS.has(property))
    return false
  if (DIMENSION_STYLE_KEYS.has(property))
    return /^-?[\d.]+%$/.test(value)
  return true
}

function inlineStyle(tag: string, css: string, diagnostics: TranslationDiagnostic[]): STXStyle {
  const style: Record<string, unknown> = {}
  const decoded = decodeEntities(css)
  try {
    const object = JSON.parse(decoded)
    if (object && typeof object === 'object' && !Array.isArray(object)) {
      for (const [rawProperty, rawValue] of Object.entries(object)) {
        const property = STYLE_KEYS.has(rawProperty)
          ? rawProperty
          : camelCase(rawProperty.trim().toLowerCase())
        if (!STYLE_KEYS.has(property)) {
          diagnostics.push({ kind: 'unknown-style', tag, name: property })
          continue
        }
        if (rawValue === null || rawValue === undefined)
          continue
        const translated = typeof rawValue === 'string' ? styleValue(rawValue) : rawValue
        if (typeof translated === 'object') {
          // A shadow's offset and a transform: kept as the structure the
          // hosts read, which used to be dropped here with every other object.
          const kept = structuredStyle(property, translated)
          if (kept === undefined)
            diagnostics.push({ kind: 'non-numeric-style', tag, name: property })
          else style[property] = kept
          continue
        }
        if (typeof translated !== 'string' && typeof translated !== 'number')
          continue
        if (typeof translated === 'string' && !holdsString(property, translated)) {
          diagnostics.push({ kind: 'non-numeric-style', tag, name: property })
          continue
        }
        style[property] = translated
      }
      return style as STXStyle
    }
  }
  catch {
    // CSS declarations are handled below.
  }

  for (const declaration of decoded.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1)
      continue
    const property = camelCase(declaration.slice(0, colon).trim().toLowerCase())
    const value = declaration.slice(colon + 1).trim()
    if (!property || !value)
      continue
    if (!STYLE_KEYS.has(property)) {
      diagnostics.push({ kind: 'unknown-style', tag, name: property })
      continue
    }

    const translated = styleValue(value)
    if (typeof translated === 'string' && !holdsString(property, translated)) {
      diagnostics.push({ kind: 'non-numeric-style', tag, name: property })
      continue
    }
    style[property] = translated
  }
  return style as STXStyle
}

/** Every word in a subtree, in order, with the markup between them gone. */
function flattenText(node: STXNode): string {
  return node.children
    .map(child => (typeof child === 'string' ? child : flattenText(child)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Settle a finished node against what the renderers can actually draw.
 *
 * Two corrections, both of which decide whether words reach the screen:
 *
 * - A container whose children are only text becomes a Text. The iOS renderer
 *   says it outright -- "View doesn't render text directly" -- so a `div`
 *   holding a label would keep its box and lose its label.
 * - A Text with element children keeps the words and drops the markup, since
 *   the renderers' Text path reads string children only. `<p>a <b>b</b></p>`
 *   renders "a b" rather than "a".
 * - A Text whose words are a `text` attribute gets them as its content, where
 *   a `:text` binding puts them. That is `<Text text="Apple Health" />`, and
 *   `:text="'Apple Health'"` too: stx folds a constant binding into a plain
 *   attribute before it gets here, and a renderer draws no `text` prop.
 */
function settle(frame: Frame, diagnostics: TranslationDiagnostic[]): STXNode {
  const node = frame.node
  const elements = node.children.filter((child): child is STXNode => typeof child !== 'string')
  const text = node.children.filter(child => typeof child === 'string').join('').trim()

  // A drawing holds shapes; the whitespace between them is not a label.
  if (node.type === 'Svg' || node.type === 'G') {
    node.children = elements
    return node
  }
  if (node.type === 'SvgText') {
    const flattened = flattenText(node)
    node.children = flattened ? [flattened] : []
    return node
  }

  if (CONTAINER_TYPES.has(node.type) && elements.length === 0 && text) {
    node.type = 'Text'
    node.children = [text]
    return node
  }

  if (node.type === 'Text' && !text && elements.length === 0 && typeof node.props.text === 'string') {
    node.children = node.props.text ? [node.props.text] : []
    delete node.props.text
    return node
  }

  if (node.type === 'Text' && elements.length > 0) {
    const flattened = flattenText(node)
    diagnostics.push({ kind: 'flattened-text', tag: frame.tag })
    node.children = flattened ? [flattened] : []
    return node
  }

  if (CONTAINER_TYPES.has(node.type) && elements.length > 0)
    node.children = elements

  return node
}

/**
 * Translate stx's rendered HTML into the native view IR.
 *
 * The input is a rendered document or fragment, not a `.stx` template: run it
 * through stx first so directives, server scripts and components are already
 * resolved, with the client bindings left in place.
 */
export async function translateHtmlToIR(
  html: string,
  options: TranslateOptions = {},
): Promise<TranslationResult> {
  const diagnostics: TranslationDiagnostic[] = []
  const roots: STXNode[] = []
  const stack: Frame[] = []
  const seenUnmapped = new Set<string>()

  function attach(node: STXNode): void {
    const parent = stack[stack.length - 1]
    if (!parent)
      roots.push(node)
    else if (!parent.dropped)
      parent.node.children.push(node)
  }

  /** A wrapper's children take its place. */
  function hoist(frame: Frame): void {
    if (frame.node.bindings && Object.keys(frame.node.bindings).length > 0) {
      const children = frame.node.children
      const elements = children.filter((child): child is STXNode => typeof child !== 'string')
      const target = elements.length === 1 && elements.length === children.length
        ? elements[0]
        : createNode('View', {}, {}, {}, children)
      target.bindings = { ...frame.node.bindings, ...target.bindings }
      if (target.bindingId === undefined && frame.node.bindingId !== undefined)
        target.bindingId = frame.node.bindingId
      attach(target)
      return
    }

    const parent = stack[stack.length - 1]
    for (const child of frame.node.children) {
      if (typeof child === 'string') {
        if (parent && !parent.dropped)
          parent.node.children.push(child)
        continue
      }
      if (!parent)
        roots.push(child)
      else if (!parent.dropped)
        parent.node.children.push(child)
    }
  }

  function open(tag: string, attributes: Array<[string, string]>): Frame {
    const parentFrame = stack[stack.length - 1]
    if (tag === 'svg' || parentFrame?.svg)
      return openSvg(tag, attributes, parentFrame)
    const dropped = DROP_SUBTREE.has(tag) && !BOX_ONLY.has(tag)
    const inheritedDrop = stack[stack.length - 1]?.dropped ?? false
    const { props, style, events, bindings, classes, inline } = dropped || inheritedDrop
      ? { props: {}, style: {}, events: {}, bindings: {}, classes: '', inline: {} }
      : readAttributes(tag, attributes, diagnostics)

    // A primitive component names its own native type, since the HTML tag it
    // emits cannot carry the distinction.
    const declared = props['data-native']
    let type: string
    if (typeof declared === 'string' && NATIVE_TYPES.has(declared)) {
      type = declared
      delete props['data-native']
    }
    else {
      type = BOX_ONLY.has(tag) ? 'View' : mapToNativeComponent(tag)
    }

    if (type === tag && !NATIVE_TYPES.has(type) && !DROP_SUBTREE.has(tag) && !UNWRAP.has(tag) && !seenUnmapped.has(tag)) {
      seenUnmapped.add(tag)
      diagnostics.push({ kind: 'unmapped-tag', tag })
    }
    if ((dropped || BOX_ONLY.has(tag)) && !seenUnmapped.has(`drop:${tag}`)) {
      seenUnmapped.add(`drop:${tag}`)
      diagnostics.push({ kind: 'dropped-subtree', tag })
    }

    // `<video src>` as the web writes it: the host reads `source`.
    if (type === 'Video' && props.source === undefined && props.src !== undefined) {
      props.source = props.src
      delete props.src
    }
    if (type === 'Icon') {
      const icon = compileClassStyles(classes).icon
      props.symbol = resolveIconName(String(props.symbol || props.name || icon || ''), Boolean(props.symbol)).symbol
    }
    if (type === 'FlatList' || type === 'SectionList') {
      const names = new Set([...Object.keys(props), ...Object.keys(bindings)].map(name => name.toLowerCase()))
      for (const [lowerName, publicName] of SHARED_RUNTIME_UNSUPPORTED_LIST_PROPS) {
        if (names.has(lowerName))
          diagnostics.push({ kind: 'unsupported-list-prop', tag: type, name: publicName })
      }
    }
    const node = createNode(type, props, style, events)
    node._inlineStyle = inline
    const bindingId = props['data-stx-b']
    if (typeof bindingId === 'number' && Number.isInteger(bindingId))
      node.bindingId = bindingId
    delete props['data-stx-b']
    if (classes)
      node._classes = classes
    if (Object.keys(bindings).length > 0)
      node.bindings = bindings
    if (typeof props.key === 'string') {
      node.key = props.key
      delete props.key
    }

    // `svg` keeps its box and drops its geometry, so it opens as dropped even
    // though the node itself is kept. A script or a stylesheet is not a view at
    // all, so its node is discarded rather than attached as a `script` type --
    // which is what the first version of this did, putting 89 `link` nodes and
    // 52 `script` nodes into the library's trees.
    return {
      tag,
      node,
      dropped: dropped || inheritedDrop || BOX_ONLY.has(tag),
      discard: dropped || inheritedDrop,
      unwrap: UNWRAP.has(tag),
    }
  }

  /**
   * An element of a vector drawing (`svg.ts`). Its tag names a shape, not a
   * view; what is not drawn yet (gradients, clips, definitions) is dropped
   * with its subtree and reported rather than drawn wrong.
   */
  function openSvg(tag: string, attributes: Array<[string, string]>, parent: Frame | undefined): Frame {
    const inheritedDrop = parent?.dropped ?? false
    const type = SVG_TYPES[tag]
    if (inheritedDrop || !type) {
      if (!inheritedDrop && !seenUnmapped.has(`drop:${tag}`)) {
        seenUnmapped.add(`drop:${tag}`)
        diagnostics.push({ kind: SVG_DROPPED.has(tag) ? 'dropped-subtree' : 'unmapped-tag', tag })
      }
      return { tag, node: createNode('G', {}, {}, {}), svg: true, dropped: true, discard: true, unwrap: false }
    }
    const { props, style, events, bindings, classes, inline } = readAttributes(tag, attributes, diagnostics)
    if (type === 'Svg') {
      const viewBox = parseViewBox(props.viewBox)
      if (viewBox) props.viewBox = viewBox
      else delete props.viewBox
      // `width="24"` on the element is its size when no class gave one.
      for (const axis of ['width', 'height'] as const) {
        if (typeof props[axis] === 'number' && style[axis] === undefined)
          style[axis] = props[axis] as number
        delete props[axis]
      }
    }
    if (typeof props.strokeDasharray === 'string' || typeof props.strokeDasharray === 'number') {
      const dashes = String(props.strokeDasharray).split(/[\s,]+/).map(Number).filter(Number.isFinite)
      props.strokeDasharray = dashes
    }
    const geometry = svgGeometry(type, props)
    if (geometry) props.geometry = geometry
    const node = createNode(type, props, style, events)
    node._inlineStyle = inline
    const bindingId = props['data-stx-b']
    if (typeof bindingId === 'number' && Number.isInteger(bindingId))
      node.bindingId = bindingId
    delete props['data-stx-b']
    if (classes)
      node._classes = classes
    if (Object.keys(bindings).length > 0)
      node.bindings = bindings
    if (typeof props.key === 'string') {
      node.key = props.key
      delete props.key
    }
    return { tag, node, svg: true, dropped: false, discard: false, unwrap: false }
  }

  await new HTMLRewriter()
    .on('*', {
      element(element) {
        const tag = element.tagName.toLowerCase()
        const frame = open(tag, [...element.attributes] as Array<[string, string]>)
        let hasEndTag = true
        try {
          element.onEndTag(() => {
            stack.pop()
            if (frame.discard)
              return
            if (frame.unwrap)
              hoist(frame)
            else
              attach(settle(frame, diagnostics))
          })
        }
        catch {
          // A void element: no end tag will arrive, so it closes here.
          hasEndTag = false
        }
        if (hasEndTag)
          stack.push(frame)
        else if (!frame.discard)
          attach(frame.node)
      },
      text(chunk) {
        const frame = stack[stack.length - 1]
        if (!frame || frame.dropped)
          return
        const text = decodeEntities(chunk.text).replace(/\s+/g, ' ')
        if (!text.trim())
          return
        frame.node.children.push(text)
      },
    })
    .transform(new Response(html))
    .text()

  if (roots.length === 0)
    throw new Error(`No element to translate in the rendered output of ${options.source ?? 'unknown'}`)

  const root = roots.length === 1
    ? roots[0]
    : createNode('View', {}, {}, {}, roots)

  return { root, diagnostics }
}

/** The same translation, wrapped in an `STXDocument` for the renderers. */
export async function translateHtmlToDocument(
  html: string,
  options: TranslateOptions & { script?: STXDocument['script'] } = {},
): Promise<{ document: STXDocument, diagnostics: TranslationDiagnostic[] }> {
  const { root, diagnostics } = await translateHtmlToIR(html, options)
  const script = options.script ?? { exports: {}, functions: [], code: '' }
  return {
    document: createDocument(root, script, { source: options.source ?? 'unknown' }),
    diagnostics,
  }
}
