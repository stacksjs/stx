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
import { ACCESSIBILITY_FIELDS, projectAccessibility } from '../accessibility'
import { applyStaticTextEntry } from '../text-entry'
import { NATIVE_EVENT_NAMES as EVENT_NAMES } from '../event-names'
import { NATIVE_BOOLEAN_PROPS, nativePropName } from '../prop-names'
import { mapToNativeComponent } from './component-mapping'
import { resolveIconName } from './icons'
import { extractStylesheetRules, type NativeStylesheetRules } from './stylesheet-rules'
import { applyNativeLayoutDefaults, type NativeStyleContext, parseNativeStyle } from './inline-style'
import { createStyleVariables, type NativeStyleVariables } from './style-variables'
import { extractStylesheetTheme } from './stylesheet-theme'
import { applySvgAnimation, parseViewBox, SVG_DROPPED, SVG_NODE_TYPES, SVG_TYPES, svgGeometry } from './svg'
import { compileClassStyles } from './headwind-to-style'
import { createDocument, createNode } from './ir'

/** Events a browser raises from a keyboard, mouse, pointer or the page itself: nothing native produces them. */
const BROWSER_ONLY_EVENTS = /^(?:key(?:down|up|press)|mouse[a-z]+|pointer[a-z]+|dbl(?:click)?|contextmenu|wheel|drag[a-z]*|drop|copy|cut|paste|beforeinput|compositionstart|compositionupdate|compositionend|animation[a-z]+|transition[a-z]+|resize|hashchange|popstate|beforeunload|unload|visibilitychange|selectionchange|selectstart|auxclick)$/

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
  /** A static utility class has no native style translation. */
  | 'unknown-class'
  /** A value the IR's field cannot hold, so emitting it would brick the screen. */
  | 'non-numeric-style'
  /** A legacy virtual-list prop has no meaning in the shared-runtime tree. */
  | 'unsupported-list-prop'
  /** A control with no supported native interaction contract. */
  | 'unsupported-control'
  /** A theme declaration cannot be evaluated faithfully on the native target. */
  | 'unsupported-theme-rule'
  | 'unsupported-style-rule'

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
 * Every event name at least one renderer dispatches on.
 *
 * Pinned against the renderers by `html-to-ir.test.ts`: a handler mapped to a
 * name outside this set is reported rather than quietly attached to nothing.
 */
export const NATIVE_EVENTS = new Set([
  'onBlur',
  'onChange',
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
  'onPictureInPictureStart',
  'onPictureInPictureStop',
  'onPlay',
  'onPress',
  'onPressIn',
  'onPressOut',
  'onProgress',
  'onRequestClose',
  'onRegionChangeComplete',
  'onRefresh',
  'onScroll',
  'onScrollBeginDrag',
  'onScrollEndDrag',
  'onShow',
  'onSlidingComplete',
  'onSubmitEditing',
  'onValueChange',
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
  'Button', 'Link', 'TouchableOpacity', 'TouchableHighlight', 'Pressable',
  'Icon', 'Image', 'ImageBackground', 'Video',
  'Map', 'MapPolyline', 'MapPolygon', 'MapMarker',
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
 * Host-owned slot metadata such as `listRole`, and host-specific layout props
 * such as `numColumns`, remain valid and are not in this set.
 */
const SHARED_RUNTIME_UNSUPPORTED_LIST_PROPS = new Map<string, string>([
  ['data', 'data'],
  ['sections', 'sections'],
  ['renderitem', 'renderItem'],
  ['rendersectionheader', 'renderSectionHeader'],
  ['keyextractor', 'keyExtractor'],
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


interface Frame {
  tag: string
  node: STXNode
  variables?: NativeStyleVariables
  /** Explicit low-level primitives keep their requested native representation. */
  declaredNative?: boolean
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
  /** Which of `bindings` are `{{ }}` the server left. */
  templated: string[]
}

/**
 * The binding a `{{ }}`-templated string makes, or null when it has none.
 *
 * The server evaluates what it can of a web view's mustaches and leaves the
 * rest (a client signal, a call the device answers) for the browser's
 * runtime, which binds them in the page's text. A native screen has no text
 * nodes for that runtime to find, so a leftover mustache is a binding here,
 * the `:text` or `:placeholder` an author could have written: a single one is
 * its expression, words around it are joined in, and null or undefined reads
 * as nothing, as the browser shows it.
 */
export function mustacheBinding(text: string): string | null {
  if (!text.includes('{{'))
    return null
  const parts: string[] = []
  let last = 0
  for (const match of text.matchAll(/\{\{([\s\S]+?)\}\}/g)) {
    if (match.index > last)
      parts.push(JSON.stringify(text.slice(last, match.index)))
    parts.push(`(${match[1].trim()})`)
    last = match.index + match[0].length
  }
  if (!parts.some(part => part.startsWith('(')))
    return null
  if (last < text.length)
    parts.push(JSON.stringify(text.slice(last)))
  if (parts.length === 1)
    return parts[0].slice(1, -1)
  return `[${parts.join(', ')}].map(__stxPart => __stxPart == null ? '' : __stxPart).join('')`
}

function readAttributes(
  tag: string,
  attributes: Array<[string, string]>,
  diagnostics: TranslationDiagnostic[],
  styleContext: NativeStyleContext & { rules?: NativeStylesheetRules } = {},
): Attributes {
  let variables = styleContext.inheritedVariables
  const props: Record<string, unknown> = {}
  const events: Record<string, string> = {}
  const bindings: Record<string, string> = {}
  const fromMustaches: string[] = []
  let classes = ''
  let inline: STXStyle = {}

  for (const [rawName, value] of attributes) {
    const name = rawName.toLowerCase()

    if (name === 'class' || name === 'classname') {
      classes = classes ? `${classes} ${value}` : value
      continue
    }

    if (name === 'style') {
      inline = { ...inline, ...inlineStyle(tag, value, diagnostics, { ...styleContext, onVariables(value) {
        variables = value
        styleContext.onVariables?.(value)
      } }) }
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
        // A component's own event (`emit('done')` heard as `@done`) reaches its
        // listener through the shared runtime on every host. Only a browser
        // event a native screen never produces is worth a warning.
        if (BROWSER_ONLY_EVENTS.test(base) || /\./.test(spelling)) diagnostics.push({ kind: 'unread-event', tag, name: rawName })
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
    const templated = mustacheBinding(decoded)
    if (templated) {
      bindings[name] = templated
      fromMustaches.push(name)
      continue
    }
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

  // Both maintained hosts report focus/blur for text inputs, not arbitrary
  // pressable views. Keep unsupported variants diagnostic on other controls.
  const focus = props['data-native']
    ? props['data-native'] === 'TextInput'
    : tag === 'textarea' || (tag === 'input' && !['checkbox', 'radio', 'hidden'].includes(String(props.type ?? 'text').toLowerCase()))
  const compiledClasses = classes ? compileClassStyles(classes, variables, { focus, focusWithin: true, rules: styleContext.rules }) : undefined
  for (const name of new Set(compiledClasses?.unknown ?? []))
    diagnostics.push({ kind: 'unknown-class', tag, name })
  const style = applyNativeLayoutDefaults({ ...compiledClasses?.style, ...inline })
  return { props, style, events, bindings, classes, inline, templated: fromMustaches }
}

function inlineStyle(tag: string, css: string, diagnostics: TranslationDiagnostic[], context: NativeStyleContext): STXStyle {
  return parseNativeStyle(decodeEntities(css), diagnostic => diagnostics.push({ ...diagnostic, tag }), context)
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

  // A composed HTML button needs a real child container: native Button is a
  // leaf control, so inserting a conditional label/icon under it is invalid.
  // Pressable owns the same press interaction while retaining native children.
  if (frame.tag === 'button' && node.type === 'Button' && !frame.declaredNative && elements.length > 0) {
    node.type = 'Pressable'
    node.props.role ??= 'button'
    node.children = node.children.flatMap(child => typeof child === 'string'
      ? (child.trim() ? [createNode('Text', {}, {}, {}, [child.trim()])] : [])
      : [child])
    return node
  }

  // Template indentation is not part of a native control's visible or
  // accessible label. Composed buttons retain their child tree above.
  if (node.type === 'Button' && elements.length === 0) {
    node.children = text ? [text] : []
    return node
  }

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
    // A label/span can wrap a real control or drawing. Flattening such a
    // subtree removes its handlers and geometry, not merely text emphasis.
    // A span styled as a flex or grid box is a layout too: a title over a
    // subtitle inside a button is a column of two labels, and flattening it
    // read "TitleSubtitle" on one line (inline content cannot hold a <div>).
    const boxed = /(?:^|\s)(?:inline-)?(?:flex|grid)(?:\s|$)/.test(node._classes ?? '')
    if (boxed || elements.some(child => child.type !== 'Text')) {
      node.type = 'View'
      node.children = node.children.map(child => typeof child === 'string'
        ? createNode('Text', {}, {}, {}, [child])
        : child)
      return node
    }
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
  const stylesheetTheme = await extractStylesheetTheme(html, name => diagnostics.push({ kind: 'unsupported-theme-rule', tag: 'style', name }))
  const stylesheetVariables = createStyleVariables(stylesheetTheme.light).computed()
  // A page carries the app's whole stylesheet: report a rule natives cannot
  // read only when something on this page has one of the classes it styles.
  const usedClasses = new Set([...html.matchAll(/\sclass(?:name)?\s*=\s*"([^"]*)"/gi)].flatMap(match => match[1]!.split(/\s+/)))
  const stylesheetRules = await extractStylesheetRules(html, (name, classes) => {
    if (!classes.length || classes.some(name => usedClasses.has(name))) diagnostics.push({ kind: 'unsupported-style-rule', tag: 'style', name })
  })
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
    const preserveVariables = (node: STXNode): void => {
      // HTML's declarations already participate in the document cascade,
      // including stylesheet !important and aliases resolved on that element.
      if (frame.tag !== 'html' && frame.node._styleSource)
        node._styleAncestors = [frame.node._styleSource, ...node._styleAncestors ?? []]
    }
    if (frame.node.bindings && Object.keys(frame.node.bindings).length > 0) {
      const children = frame.node.children
      const elements = children.filter((child): child is STXNode => typeof child !== 'string')
      const target = elements.length === 1 && elements.length === children.length
        ? elements[0]
        : createNode('View', {}, {}, {}, children)
      target.bindings = { ...frame.node.bindings, ...target.bindings }
      if (target.bindingId === undefined && frame.node.bindingId !== undefined)
        target.bindingId = frame.node.bindingId
      preserveVariables(target)
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
      preserveVariables(child)
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
    let variables = parentFrame?.variables ?? stylesheetVariables
    const { props, style, events, bindings, classes, inline, templated } = dropped || inheritedDrop
      ? { props: {}, style: {}, events: {}, bindings: {}, classes: '', inline: {}, templated: [] }
      : readAttributes(tag, attributes, diagnostics, { inheritedVariables: variables, onVariables: value => { variables = value }, rules: stylesheetRules })
    if (tag === 'html') variables = stylesheetVariables

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
      // `<i class="i-lucide-sun">` is how a web view draws an icon: the class
      // is a CSS mask the page fills. Natively it is an Icon, not empty text.
      if ((tag === 'i' || tag === 'span') && /(?:^|\s)i-[a-z0-9]+-[a-z0-9-]+(?:\s|$)/.test(classes)) type = 'Icon'
      if (tag === 'input') {
        const inputType = String(props.type ?? 'text').toLowerCase()
        if (inputType === 'checkbox') {
          type = 'Checkbox'
          props.formValue = props.value ?? 'on'
          props.checked = props.checked === '' || props.checked === true || props.checked === 'true'
          props.value = props.checked
        }
        else if (inputType === 'hidden') {
          type = 'View'
          style.display = 'none'
          inline.display = 'none'
        }
        else if (inputType === 'radio') {
          type = 'View'
          props.accessibilityRole = 'radio'
          diagnostics.push({ kind: 'unsupported-control', tag, name: 'input:radio' })
        }
      }
    }

    if (!inheritedDrop && type === tag && !NATIVE_TYPES.has(type) && !DROP_SUBTREE.has(tag) && !UNWRAP.has(tag) && !seenUnmapped.has(tag)) {
      seenUnmapped.add(tag)
      diagnostics.push({ kind: 'unmapped-tag', tag })
    }
    if ((dropped || BOX_ONLY.has(tag)) && !seenUnmapped.has(`drop:${tag}`)) {
      seenUnmapped.add(`drop:${tag}`)
      diagnostics.push({ kind: 'dropped-subtree', tag })
    }

    // A box that scrolls sideways on the web (a row of chips wider than the
    // phone) is a horizontal ScrollView natively: a View clips it instead.
    if (type === 'View' && /(?:^|\s)overflow-x-(?:auto|scroll)(?:\s|$)/.test(classes)) {
      type = 'ScrollView'
      props.horizontal = true
      props.showsHorizontalScrollIndicator ??= false
    }
    else if (type === 'View' && /(?:^|\s)overflow-y-(?:auto|scroll)(?:\s|$)/.test(classes)) {
      type = 'ScrollView'
    }

    // Forms are views, but their ownership must survive translation so the
    // host can collect controls and implement submit/reset default actions.
    if (tag === 'form') props['data-stx-form'] = true
    if (tag === 'button' && props.type === undefined) props.type = 'submit'

    // HTML media uses src; the native hosts read source.
    if ((type === 'Video' || type === 'Image') && props.source === undefined && props.src !== undefined) {
      props.source = props.src
      delete props.src
    }
    if (type === 'Icon') {
      const icon = compileClassStyles(classes).icon
      const resolved = resolveIconName(String(props.symbol || props.name || icon || ''), Boolean(props.symbol))
      props.symbol = resolved.symbol
      if (resolved.iconify) props.iconify = resolved.iconify
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
    node._styleSource = decodeEntities(attributes.find(([name]) => name === 'style')?.[1] ?? '')
    const bindingId = props['data-stx-b']
    if (typeof bindingId === 'number' && Number.isInteger(bindingId))
      node.bindingId = bindingId
    delete props['data-stx-b']
    if (classes)
      node._classes = classes
    if (Object.keys(bindings).length > 0)
      node.bindings = bindings
    if (templated.length > 0)
      node._templated = templated
    if (typeof props.key === 'string') {
      node.key = props.key
      delete props.key
    }

    // Native Video owns playback and controls: HTML fallback/skin children
    // must not become a second player or unknown native views. Keep the
    // Video's own bindings and events, but discard its browser-only subtree.
    // A script or stylesheet is not a view at all, so its node is discarded
    // rather than attached as a `script` type --
    // which is what the first version of this did, putting 89 `link` nodes and
    // 52 `script` nodes into the library's trees.
    return {
      tag,
      node,
      variables,
      declaredNative: typeof declared === 'string' && NATIVE_TYPES.has(declared),
      dropped: dropped || inheritedDrop || BOX_ONLY.has(tag) || type === 'Video',
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
    let variables = parent?.variables ?? stylesheetVariables
    const { props, style, events, bindings, classes, inline, templated } = readAttributes(tag, attributes, diagnostics, { inheritedVariables: variables, onVariables: value => { variables = value }, rules: stylesheetRules })
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
    if (type === 'Animate') applySvgAnimation(props)
    const node = createNode(type, props, style, events)
    node._inlineStyle = inline
    node._styleSource = decodeEntities(attributes.find(([name]) => name === 'style')?.[1] ?? '')
    const bindingId = props['data-stx-b']
    if (typeof bindingId === 'number' && Number.isInteger(bindingId))
      node.bindingId = bindingId
    delete props['data-stx-b']
    if (classes)
      node._classes = classes
    if (Object.keys(bindings).length > 0)
      node.bindings = bindings
    if (templated.length > 0)
      node._templated = templated
    if (typeof props.key === 'string') {
      node.key = props.key
      delete props.key
    }
    return { tag, node, variables, svg: true, dropped: false, discard: false, unwrap: false }
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

  if (stylesheetTheme.light.length || stylesheetTheme.dark.length) root._stylesheetTheme = stylesheetTheme
  if (Object.keys(stylesheetRules).length) root._stylesheetRules = stylesheetRules

  const project = (node: STXNode): void => {
    bindMustaches(node)
    const projected = projectAccessibility(node.props)
    if (Object.keys(projected).length) {
      node._accessibilitySource = Object.fromEntries(ACCESSIBILITY_FIELDS.filter(name => name in node.props).map(name => [name, node.props[name]]))
      Object.assign(node.props, projected)
    }
    applyStaticTextEntry(node)
    for (const child of node.children) {
      if (typeof child !== 'string') project(child)
    }
  }
  project(root)

  return { root, diagnostics }
}

/**
 * Words a server left as `{{ }}` (see `mustacheBinding`) become the node's
 * `text` binding: a Text's, and a link's or touchable's, whose words are its
 * children as a label's are. A button labelled that way gets a Text to hold
 * them, since a native Button draws a fixed title.
 */
function bindMustaches(node: STXNode): void {
  if (node.bindings?.text || node.children.length === 0 || !node.children.every(child => typeof child === 'string'))
    return
  const expression = mustacheBinding(node.children.join(''))
  if (!expression)
    return
  if (node.type !== 'Button') {
    node.bindings = { ...node.bindings, text: expression }
    node._templated = [...(node._templated ?? []), 'text']
    node.children = []
  }
  else {
    node.type = 'Pressable'
    node.props.role ??= 'button'
    const label = createNode('Text', {}, {}, {}, [])
    label.bindings = { text: expression }
    label._templated = ['text']
    node.children = [label]
  }
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
