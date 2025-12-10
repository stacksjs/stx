/**
 * STX Native Primitives
 *
 * Platform-agnostic component definitions that map to native UI.
 * These are the building blocks for all STX Native apps.
 */

import type { STXStyle, STXEventType } from '../compiler/ir'

// ============================================================================
// Base Types
// ============================================================================

export interface BaseProps {
  /** Unique key for list rendering */
  key?: string
  /** Inline styles (merged with Headwind classes) */
  style?: STXStyle
  /** Headwind utility classes */
  class?: string
  /** Test ID for automation */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
  /** Accessibility hint */
  accessibilityHint?: string
  /** Accessibility role */
  accessibilityRole?: AccessibilityRole
}

export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'text'
  | 'adjustable'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar'

// ============================================================================
// Layout Components
// ============================================================================

export interface ViewProps extends BaseProps {
  /** Press handler */
  onPress?: () => void
  /** Long press handler */
  onLongPress?: () => void
  /** Layout change handler */
  onLayout?: (event: LayoutEvent) => void
  /** Pointer events behavior */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'
}

export interface ScrollViewProps extends ViewProps {
  /** Scroll horizontally */
  horizontal?: boolean
  /** Show scroll indicators */
  showsHorizontalScrollIndicator?: boolean
  showsVerticalScrollIndicator?: boolean
  /** Bounce at edges (iOS) */
  bounces?: boolean
  /** Scroll handler */
  onScroll?: (event: ScrollEvent) => void
  /** Scroll end handler */
  onScrollEndDrag?: () => void
  /** Momentum scroll end handler */
  onMomentumScrollEnd?: () => void
  /** Content container style */
  contentContainerStyle?: STXStyle
  /** Keyboard dismiss mode */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive'
  /** Refresh control */
  refreshControl?: RefreshControlProps
  /** Paging enabled */
  pagingEnabled?: boolean
  /** Scroll enabled */
  scrollEnabled?: boolean
}

export interface SafeAreaViewProps extends ViewProps {
  /** Edges to apply safe area insets */
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>
}

export interface KeyboardAvoidingViewProps extends ViewProps {
  /** Behavior when keyboard appears */
  behavior?: 'height' | 'position' | 'padding'
  /** Keyboard vertical offset */
  keyboardVerticalOffset?: number
}

// ============================================================================
// Text Components
// ============================================================================

export interface TextProps extends BaseProps {
  /** Number of lines before truncating */
  numberOfLines?: number
  /** Ellipsize mode */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  /** Selectable text */
  selectable?: boolean
  /** Press handler */
  onPress?: () => void
  /** Long press handler */
  onLongPress?: () => void
}

export interface TextInputProps extends BaseProps {
  /** Current value */
  value?: string
  /** Default value */
  defaultValue?: string
  /** Placeholder text */
  placeholder?: string
  /** Placeholder text color */
  placeholderTextColor?: string
  /** Value change handler */
  onChangeText?: (text: string) => void
  /** Focus handler */
  onFocus?: () => void
  /** Blur handler */
  onBlur?: () => void
  /** Submit handler */
  onSubmitEditing?: () => void
  /** Keyboard type */
  keyboardType?: KeyboardType
  /** Return key type */
  returnKeyType?: ReturnKeyType
  /** Auto capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  /** Auto correct */
  autoCorrect?: boolean
  /** Auto focus */
  autoFocus?: boolean
  /** Secure text entry (password) */
  secureTextEntry?: boolean
  /** Max length */
  maxLength?: number
  /** Multiline */
  multiline?: boolean
  /** Editable */
  editable?: boolean
  /** Selection color */
  selectionColor?: string
}

export type KeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad'
  | 'url'
  | 'web-search'
  | 'visible-password'

export type ReturnKeyType =
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send'
  | 'default'

// ============================================================================
// Interactive Components
// ============================================================================

export interface ButtonProps extends BaseProps {
  /** Button title */
  title?: string
  /** Press handler */
  onPress?: () => void
  /** Disabled state */
  disabled?: boolean
  /** Button color (iOS) */
  color?: string
}

export interface TouchableOpacityProps extends ViewProps {
  /** Active opacity when pressed */
  activeOpacity?: number
  /** Disabled state */
  disabled?: boolean
}

export interface TouchableHighlightProps extends ViewProps {
  /** Underlay color when pressed */
  underlayColor?: string
  /** Active opacity when pressed */
  activeOpacity?: number
  /** Disabled state */
  disabled?: boolean
  /** Show underlay handler */
  onShowUnderlay?: () => void
  /** Hide underlay handler */
  onHideUnderlay?: () => void
}

export interface PressableProps extends ViewProps {
  /** Disabled state */
  disabled?: boolean
  /** Press in handler */
  onPressIn?: () => void
  /** Press out handler */
  onPressOut?: () => void
  /** Hit slop (extend touch area) */
  hitSlop?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Press retention offset */
  pressRetentionOffset?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Android ripple config */
  android_ripple?: {
    color?: string
    borderless?: boolean
    radius?: number
  }
}

export interface SwitchProps extends BaseProps {
  /** Current value */
  value?: boolean
  /** Value change handler */
  onValueChange?: (value: boolean) => void
  /** Disabled state */
  disabled?: boolean
  /** Track color when on */
  trackColor?: { false?: string; true?: string }
  /** Thumb color */
  thumbColor?: string
  /** iOS background color */
  ios_backgroundColor?: string
}

export interface SliderProps extends BaseProps {
  /** Current value */
  value?: number
  /** Minimum value */
  minimumValue?: number
  /** Maximum value */
  maximumValue?: number
  /** Step */
  step?: number
  /** Value change handler */
  onValueChange?: (value: number) => void
  /** Sliding complete handler */
  onSlidingComplete?: (value: number) => void
  /** Disabled state */
  disabled?: boolean
  /** Minimum track tint color */
  minimumTrackTintColor?: string
  /** Maximum track tint color */
  maximumTrackTintColor?: string
  /** Thumb tint color */
  thumbTintColor?: string
}

// ============================================================================
// Media Components
// ============================================================================

export interface ImageProps extends BaseProps {
  /** Image source */
  source: ImageSource
  /** Resize mode */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat'
  /** Load handler */
  onLoad?: () => void
  /** Load start handler */
  onLoadStart?: () => void
  /** Load end handler */
  onLoadEnd?: () => void
  /** Error handler */
  onError?: (error: Error) => void
  /** Blur radius */
  blurRadius?: number
  /** Fade duration (Android) */
  fadeDuration?: number
  /** Default source (placeholder) */
  defaultSource?: ImageSource
}

export type ImageSource =
  | { uri: string; width?: number; height?: number; headers?: Record<string, string> }
  | number // require('./image.png')

export interface ImageBackgroundProps extends ImageProps {
  /** Image style */
  imageStyle?: STXStyle
}

// ============================================================================
// List Components
// ============================================================================

export interface FlatListProps<T> extends ScrollViewProps {
  /** Data array */
  data: T[]
  /** Render item function */
  renderItem: (info: { item: T; index: number }) => unknown
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string
  /** Item separator */
  ItemSeparatorComponent?: () => unknown
  /** List header */
  ListHeaderComponent?: () => unknown
  /** List footer */
  ListFooterComponent?: () => unknown
  /** Empty list component */
  ListEmptyComponent?: () => unknown
  /** Number of columns */
  numColumns?: number
  /** Initial number of items to render */
  initialNumToRender?: number
  /** Max items to render per batch */
  maxToRenderPerBatch?: number
  /** Window size (virtualization) */
  windowSize?: number
  /** End reached handler */
  onEndReached?: () => void
  /** End reached threshold */
  onEndReachedThreshold?: number
  /** Inverted list */
  inverted?: boolean
}

export interface SectionListProps<T> extends ScrollViewProps {
  /** Sections array */
  sections: Array<{ title?: string; data: T[] }>
  /** Render item function */
  renderItem: (info: { item: T; index: number; section: { title?: string; data: T[] } }) => unknown
  /** Render section header */
  renderSectionHeader?: (info: { section: { title?: string; data: T[] } }) => unknown
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string
}

// ============================================================================
// Overlay Components
// ============================================================================

export interface ModalProps extends BaseProps {
  /** Modal visible state */
  visible?: boolean
  /** Animation type */
  animationType?: 'none' | 'slide' | 'fade'
  /** Presentation style (iOS) */
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen'
  /** Transparent background */
  transparent?: boolean
  /** Request close handler (Android back button) */
  onRequestClose?: () => void
  /** Show handler */
  onShow?: () => void
  /** Dismiss handler */
  onDismiss?: () => void
  /** Status bar translucent (Android) */
  statusBarTranslucent?: boolean
}

export interface ActivityIndicatorProps extends BaseProps {
  /** Animating state */
  animating?: boolean
  /** Indicator color */
  color?: string
  /** Indicator size */
  size?: 'small' | 'large' | number
  /** Hide when not animating */
  hidesWhenStopped?: boolean
}

// ============================================================================
// Utility Components
// ============================================================================

export interface StatusBarProps {
  /** Bar style */
  barStyle?: 'default' | 'light-content' | 'dark-content'
  /** Background color (Android) */
  backgroundColor?: string
  /** Hidden state */
  hidden?: boolean
  /** Animated changes */
  animated?: boolean
  /** Translucent (Android) */
  translucent?: boolean
}

export interface RefreshControlProps {
  /** Refreshing state */
  refreshing: boolean
  /** Refresh handler */
  onRefresh: () => void
  /** Tint color */
  tintColor?: string
  /** Title (iOS) */
  title?: string
  /** Title color (iOS) */
  titleColor?: string
  /** Progress background color (Android) */
  progressBackgroundColor?: string
  /** Progress view offset (Android) */
  progressViewOffset?: number
}

// ============================================================================
// Event Types
// ============================================================================

export interface LayoutEvent {
  nativeEvent: {
    layout: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}

export interface ScrollEvent {
  nativeEvent: {
    contentOffset: { x: number; y: number }
    contentSize: { width: number; height: number }
    layoutMeasurement: { width: number; height: number }
  }
}

// ============================================================================
// Component Registry
// ============================================================================

/** Maps STX component names to native implementations */
export const ComponentRegistry = {
  // Layout
  View: 'View',
  ScrollView: 'ScrollView',
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',

  // Text
  Text: 'Text',
  TextInput: 'TextInput',

  // Interactive
  Button: 'Button',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  Pressable: 'Pressable',
  Switch: 'Switch',
  Slider: 'Slider',

  // Media
  Image: 'Image',
  ImageBackground: 'ImageBackground',

  // Lists
  FlatList: 'FlatList',
  SectionList: 'SectionList',

  // Overlay
  Modal: 'Modal',
  ActivityIndicator: 'ActivityIndicator',

  // Utility
  StatusBar: 'StatusBar',
  RefreshControl: 'RefreshControl',
} as const

export type ComponentName = keyof typeof ComponentRegistry
