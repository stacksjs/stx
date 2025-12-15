/**
 * STX Native Intermediate Representation (IR)
 *
 * Defines the JSON format that STX templates compile to.
 * This IR is then consumed by platform-specific renderers
 * to create native UI components.
 */

// ============================================================================
// Core Types
// ============================================================================

export type STXComponentType =
  // Layout
  | 'View'
  | 'ScrollView'
  | 'SafeAreaView'
  | 'KeyboardAvoidingView'
  // Text
  | 'Text'
  | 'TextInput'
  // Interactive
  | 'Button'
  | 'TouchableOpacity'
  | 'TouchableHighlight'
  | 'Pressable'
  // Media
  | 'Image'
  | 'ImageBackground'
  // Lists
  | 'FlatList'
  | 'SectionList'
  // Form
  | 'Switch'
  | 'Slider'
  | 'Picker'
  | 'DatePicker'
  // Overlay
  | 'Modal'
  | 'ActivityIndicator'
  // Platform specific
  | 'StatusBar'
  | 'RefreshControl'

export interface STXNode {
  /** Component type (View, Text, Button, etc.) */
  type: STXComponentType | string

  /** Unique identifier for reconciliation */
  key?: string

  /** Component properties */
  props: Record<string, unknown>

  /** Compiled style object */
  style: STXStyle

  /** Event handlers (name -> handler function name) */
  events: Record<string, string>

  /** Child nodes or text content */
  children: (STXNode | string)[]

  /** Original Headwind classes (for debugging) */
  _classes?: string

  /** Source location (for debugging) */
  _source?: {
    file: string
    line: number
    column: number
  }
}

// ============================================================================
// Style Types (Maps to Yoga + Platform Styling)
// ============================================================================

export interface STXStyle {
  // Layout (Yoga Flexbox)
  display?: 'flex' | 'none'
  flex?: number
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | string
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around'

  // Positioning
  position?: 'relative' | 'absolute'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number

  // Dimensions
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string
  aspectRatio?: number

  // Spacing
  margin?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  marginHorizontal?: number | string
  marginVertical?: number | string

  padding?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string
  paddingHorizontal?: number | string
  paddingVertical?: number | string

  // Gap (Flexbox gap)
  gap?: number
  rowGap?: number
  columnGap?: number

  // Border
  borderWidth?: number
  borderTopWidth?: number
  borderRightWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  borderColor?: string
  borderTopColor?: string
  borderRightColor?: string
  borderBottomColor?: string
  borderLeftColor?: string
  borderRadius?: number
  borderTopLeftRadius?: number
  borderTopRightRadius?: number
  borderBottomLeftRadius?: number
  borderBottomRightRadius?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'

  // Background
  backgroundColor?: string
  backgroundImage?: string
  opacity?: number

  // Shadow (iOS)
  shadowColor?: string
  shadowOffset?: { width: number; height: number }
  shadowOpacity?: number
  shadowRadius?: number

  // Elevation (Android)
  elevation?: number

  // Text styling
  color?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle?: 'normal' | 'italic'
  fontFamily?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'auto' | 'left' | 'center' | 'right' | 'justify'
  textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through'
  textDecorationColor?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'

  // Image
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat'
  tintColor?: string

  // Transform
  transform?: Array<
    | { perspective: number }
    | { rotate: string }
    | { rotateX: string }
    | { rotateY: string }
    | { rotateZ: string }
    | { scale: number }
    | { scaleX: number }
    | { scaleY: number }
    | { translateX: number }
    | { translateY: number }
    | { skewX: string }
    | { skewY: string }
  >

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll'
}

// ============================================================================
// Event Types
// ============================================================================

export type STXEventType =
  // Touch events
  | 'onPress'
  | 'onPressIn'
  | 'onPressOut'
  | 'onLongPress'
  // Gesture events
  | 'onSwipe'
  | 'onPan'
  | 'onPinch'
  // Text input events
  | 'onChange'
  | 'onChangeText'
  | 'onFocus'
  | 'onBlur'
  | 'onSubmitEditing'
  // Scroll events
  | 'onScroll'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  // Layout events
  | 'onLayout'
  // List events
  | 'onEndReached'
  | 'onRefresh'

export interface STXEvent {
  type: STXEventType
  handler: string
  /** Native event data passed to handler */
  nativeEvent?: unknown
}

// ============================================================================
// Document Types
// ============================================================================

export interface STXDocument {
  /** Version of the IR format */
  version: '1.0.0'

  /** Root component tree */
  root: STXNode

  /** Script exports (state, functions) */
  script: {
    /** Exported variables (initial state) */
    exports: Record<string, unknown>
    /** Function names that can be called */
    functions: string[]
    /** Raw script code (for JS runtime) */
    code: string
  }

  /** Metadata */
  meta: {
    /** Source file path */
    source: string
    /** Compilation timestamp */
    compiledAt: number
    /** Headwind config used */
    headwindConfig?: string
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createNode(
  type: STXComponentType | string,
  props: Record<string, unknown> = {},
  style: STXStyle = {},
  events: Record<string, string> = {},
  children: (STXNode | string)[] = []
): STXNode {
  return { type, props, style, events, children }
}

export function createDocument(
  root: STXNode,
  script: STXDocument['script'],
  meta: Partial<STXDocument['meta']> = {}
): STXDocument {
  return {
    version: '1.0.0',
    root,
    script,
    meta: {
      source: meta.source || 'unknown',
      compiledAt: meta.compiledAt || Date.now(),
      headwindConfig: meta.headwindConfig,
    },
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/** Platform-specific style overrides */
export interface PlatformStyles {
  ios?: Partial<STXStyle>
  android?: Partial<STXStyle>
  web?: Partial<STXStyle>
}

/** Conditional style based on state */
export interface ConditionalStyle {
  condition: string // JavaScript expression
  style: STXStyle
}
