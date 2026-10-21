/* eslint-disable style/max-statements-per-line */
/**
 * STX Native Primitives
 *
 * Platform-agnostic component definitions that map to native UI.
 * These are the building blocks for all STX Native apps.
 */

import type { STXStyle } from '../compiler/ir'

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
  /** Accessibility value announced by the native host. */
  accessibilityValue?: string | number
  /** Accessibility state exposed to assistive technologies. */
  accessibilityState?: AccessibilityState
  /** Accessibility role */
  accessibilityRole?: AccessibilityRole
  /** Native list chrome slot for keyed FlatList/SectionList children. */
  listRole?: 'header' | 'item' | 'separator' | 'empty' | 'footer'
  /**
   * One element across an animated change (`craft.animation.next`): a view
   * leaving and a view arriving with the same id move and scale as one, from
   * the old place to the new.
   */
  transitionID?: string
}

export interface AccessibilityState {
  disabled?: boolean
  selected?: boolean
  checked?: boolean
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
  | 'list'
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
  /** DOM-compatible press alias accepted by the maintained native hosts. */
  onClick?: () => void
  /** Long press handler */
  onLongPress?: () => void
  /** Layout change handler */
  onLayout?: (event: LayoutEvent) => void
}

export interface ScrollViewProps extends ViewProps {
  /** Scroll horizontally */
  horizontal?: boolean
  /** Show scroll indicators */
  showsHorizontalScrollIndicator?: boolean
  showsVerticalScrollIndicator?: boolean
  /** Bounce at edges (iOS) */
  bounces?: boolean
  /** Keep the scroll view's horizontal edge bounce enabled. */
  alwaysBounceHorizontal?: boolean
  /** Keep the scroll view's vertical edge bounce enabled. */
  alwaysBounceVertical?: boolean
  /** Scroll handler */
  onScroll?: (event: ScrollEvent) => void
  /** User began dragging the scroll host. */
  onScrollBeginDrag?: (event: ScrollEvent) => void
  /** Scroll end handler */
  onScrollEndDrag?: (event: ScrollEvent) => void
  /** Momentum scrolling began after a drag. */
  onMomentumScrollBegin?: (event: ScrollEvent) => void
  /** Momentum scroll end handler */
  onMomentumScrollEnd?: (event: ScrollEvent) => void
  /** Content container style */
  contentContainerStyle?: STXStyle
  /** Keyboard dismiss mode */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive'
  /** How taps interact with the keyboard while the scroll view is focused. */
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never'
  /** Refresh control */
  refreshControl?: RefreshControlProps
  /** Content children (by index) that stay at the top once scrolled to, each pushed up by the next (Craft iOS) */
  stickyHeaderIndices?: number[]
  /**
   * Scrolls the view with this `testID` to the top of the visible area, below
   * a sticky header, whenever the value changes; a new `key` scrolls to the
   * same view again (Craft iOS).
   */
  scrollTarget?: string | { id: string, key?: string | number, animated?: boolean } | null
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
  /** DOM-compatible press alias accepted by the maintained native hosts. */
  onClick?: () => void
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
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (text: string) => void
  /** Focus handler */
  onFocus?: () => void
  /** Blur handler */
  onBlur?: () => void
  /** Submit handler */
  onSubmitEditing?: () => void
  /** End-editing handler */
  onEndEditing?: () => void
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
  /** Number of visible lines for multiline inputs */
  numberOfLines?: number
  /** Editable */
  editable?: boolean
  /** Selection color */
  selectionColor?: string
  /**
   * What the field holds, for the system's autofill: `username`, `password`,
   * `newPassword`, `oneTimeCode`, `emailAddress`, `telephoneNumber`, `name`
   * and the rest of UITextContentType's names. HTML's `autocomplete` words
   * (`current-password`, `email`, `tel`) are read the same way.
   */
  textContentType?: string
  /** HTML's spelling of `textContentType` (`current-password`, `one-time-code`). */
  autoComplete?: string
  /** The rules a suggested strong password follows (`minlength: 12; required: digit;`). */
  passwordRules?: string
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
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'

export type ReturnKeyType =
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send'
  | 'join'
  | 'route'
  | 'continue'
  | 'emergency-call'
  | 'default'

// ============================================================================
// Interactive Components
// ============================================================================

export interface ButtonProps extends BaseProps {
  /** Button title */
  title?: string
  /** Press handler */
  onPress?: () => void
  /** DOM-compatible press alias accepted by the maintained native hosts. */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
  /** Button color (iOS) */
  color?: string
}

/** An underlined navigation action. Craft resolves `href`/`to` in the host. */
export interface LinkProps extends BaseProps {
  href?: string
  to?: string
  title?: string
  onPress?: () => void
  /** DOM-compatible press alias accepted by the maintained native hosts. */
  onClick?: () => void
  disabled?: boolean
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
}

export interface SwitchProps extends BaseProps {
  /** Current value */
  value?: boolean
  /** Value change handler */
  onValueChange?: (value: boolean) => void
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (value: boolean) => void
  /** Disabled state */
  disabled?: boolean
  /** Track color when on */
  trackColor?: { false?: string; true?: string }
  /** Thumb color */
  thumbColor?: string
  /** iOS background color */
  ios_backgroundColor?: string
}

/** A checkbox: the platform's own (UIButton with a checkmark, Android's CheckBox). */
export interface CheckboxProps extends BaseProps {
  /** Checked or not (`checked` is read too). */
  value?: boolean
  checked?: boolean
  /** Neither: a parent of mixed choices. */
  indeterminate?: boolean
  /** The words beside the box (the children are used when it is unset). */
  label?: string
  /** Value change handler */
  onValueChange?: (value: boolean) => void
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (value: boolean) => void
  /** Disabled state */
  disabled?: boolean
  /** The box's tint */
  color?: string
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
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (value: number) => void
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

export interface PickerOption {
  /** Label shown to the user */
  label: string
  /** Stable value delivered by onValueChange */
  value: string | number
}

export interface PickerProps extends BaseProps {
  /** Options shown by the native picker */
  items: PickerOption[]
  /** Currently selected option value */
  selectedValue?: string | number
  /** Selection change handler */
  onValueChange?: (value: string | number, index: number) => void
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (value: string | number, index: number) => void
  /** Disable user interaction */
  disabled?: boolean
}

/** A value as `<input type="date|time|datetime-local">` writes it. */
export interface DatePickerChange {
  /** `2026-10-12` for a date, `07:30` for a time, `2026-10-12T07:30` for both, in local time. */
  value: string
  /** The same moment as an ISO 8601 string in UTC. */
  iso: string
  /** Milliseconds since 1970. */
  timestamp: number
}

export interface DatePickerProps extends BaseProps {
  /** What is picked. Defaults to `date`. */
  mode?: 'date' | 'time' | 'datetime'
  /** The picked value: `2026-10-12`, `07:30`, `2026-10-12T07:30`, a full ISO string or milliseconds. */
  value?: string | number
  /** The earliest value that can be picked, written the same way. */
  minimumDate?: string | number
  /** The latest value that can be picked, written the same way. */
  maximumDate?: string | number
  /** Minutes between the times offered (`5` offers 07:25 and 07:30). */
  minuteInterval?: number
  /** `compact` (the default) shows a button that opens a calendar or clock; `inline` and `wheels` show them in place. */
  display?: 'compact' | 'inline' | 'wheels'
  /** A change, as `@change` hears it. */
  onValueChange?: (event: DatePickerChange) => void
  /** DOM-compatible change alias accepted by native hosts. */
  onChange?: (event: DatePickerChange) => void
  disabled?: boolean
}

// ============================================================================
// Media Components
// ============================================================================

/** Iconify or SF Symbol rendered by the platform's native icon view. */
export interface IconProps extends BaseProps {
  name?: string
  symbol?: string
  color?: string
}

export interface ImageProps extends BaseProps {
  /** Image source */
  source: ImageSource
  /** Alternative text used as the native accessibility label fallback. */
  alt?: string
  /** Resize mode */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center'
  /** Load handler */
  onLoad?: () => void
  /** Load start handler */
  onLoadStart?: () => void
  /** Load end handler */
  onLoadEnd?: () => void
  /** Error handler; native failures carry the host message in nativeEvent.error. */
  onError?: (event: ImageErrorEvent) => void
  /** Default source (placeholder) */
  defaultSource?: ImageSource
}

export interface ImageErrorEvent {
  nativeEvent: {
    error: {
      message: string
    }
  }
}

/** A video drawn by the platform's player (AVPlayer on iOS). */
export interface VideoProps extends BaseProps {
  /** A URL, or `{ uri }`. `src` is read the same way. */
  source?: string | { uri: string }
  src?: string
  /** The system's playback controls. */
  controls?: boolean
  /** React-style alias for `autoplay`, accepted by both native hosts. */
  autoPlay?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  /** Controlled playback position in seconds. */
  currentTime?: number
  /** Paused while true, playing (when `autoplay` is set) once false again. */
  paused?: boolean
  resizeMode?: 'contain' | 'cover' | 'stretch'
  /** `@load`: the duration is known, in seconds. */
  onLoad?: (event: { duration: number }) => void
  /** `@loadstart`: the source began loading. */
  onLoadStart?: () => void
  /** `@loadend`: the source became ready for playback. */
  onLoadEnd?: () => void
  /** `@play` and `@pause`, from the controls as well as from props. */
  onPlay?: () => void
  onPause?: () => void
  /** `@ended`: it played to the end (each time round, when looping). */
  onEnd?: () => void
  /** `@timeupdate`: about every half second while playing, in seconds. */
  onProgress?: (event: { currentTime: number, duration: number }) => void
  /** `@error`: the video could not be loaded or played. */
  onError?: (event: { message: string }) => void
  /**
   * Carries on in a floating window (Picture in Picture) when the app goes
   * to the background while it plays, and comes back into its place with
   * the app. A video with sound plays mixed with the person's music.
   */
  pictureInPicture?: boolean
  /** `@enterpictureinpicture` and `@leavepictureinpicture` (iOS). */
  onPictureInPictureStart?: () => void
  onPictureInPictureStop?: () => void
}

export type ImageSource =
  | { uri: string; width?: number; height?: number; headers?: Record<string, string> }
  | string

export interface ImageBackgroundProps extends ImageProps {
  /** Image style */
  imageStyle?: STXStyle
}

// ============================================================================
// Map Components
// ============================================================================

export interface MapCoordinate {
  latitude: number
  longitude: number
}

export interface MapTileOverlay {
  /** HTTPS raster template containing {z}, {x}, and {y}. */
  urlTemplate: string
  /** Provider credit kept visible by the native host. */
  attribution: string
}

export interface MapEdgePadding {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface MapRegion {
  center: MapCoordinate
  span: { latitudeDelta: number; longitudeDelta: number }
}

/** A keyed polyline overlay for large map collections. */
export interface MapPolylineOverlay {
  id: string
  geometry: number[]
  strokeColor?: string
  strokeWidth?: number
}

/** A keyed marker overlay for large map collections. */
export interface MapMarkerOverlay {
  id: string
  geometry: number[]
  title?: string
  pinColor?: string
  bearing?: number
}

export interface MapProps extends BaseProps {
  /** Explicit camera region; omit it to let fitToBounds choose the camera. */
  region?: MapRegion
  /** Initial region for maps without recorded overlay geometry. */
  initialRegion?: MapRegion
  /**
   * A named basemap, drawn the best way each host can: on iOS Apple's vector
   * map (real terrain from iOS 16) for standard, satellite and hybrid, and
   * topography with contours over a muted Apple map for outdoors; on Android
   * a vector style for standard and the same topography and imagery. Its
   * tiles are cached on the device, and its credit is shown. Prefer it to
   * `mapType` and `tileOverlay`, which it replaces when set.
   */
  basemap?: 'standard' | 'outdoors' | 'satellite' | 'hybrid'
  /** A native raster basemap of your own; credit remains visible on the map. */
  tileOverlay?: MapTileOverlay
  /** Logical points reserved for floating controls when fitting overlays. */
  edgePadding?: MapEdgePadding
  /** Fit the camera to all marker and polyline overlay geometry. */
  fitToBounds?: boolean
  /** Show the user dot only when the app already has location permission. */
  showsUserLocation?: boolean
  scrollEnabled?: boolean
  zoomEnabled?: boolean
  rotateEnabled?: boolean
  /** Enable native two-finger tilt gestures. Programmatic cameraPitch is independent. */
  pitchEnabled?: boolean
  mapType?: 'standard' | 'satellite' | 'hybrid'
  showsCompass?: boolean
  showsScale?: boolean
  /** Camera tilt in degrees, 0 through 60. */
  cameraPitch?: number
  /** Clockwise camera heading from north. */
  cameraHeading?: number
  /** Keyed overlays for large collections; child nodes remain supported. */
  polylines?: MapPolylineOverlay[]
  markers?: MapMarkerOverlay[]
  onPress?: (event: { nativeEvent: MapCoordinate }) => void
  /** Completed user camera gestures; programmatic camera changes do not echo. */
  onRegionChangeComplete?: (event: { nativeEvent: MapRegion & { heading: number, pitch: number } }) => void
  onMarkerPress?: (event: { nativeEvent: { id: string } }) => void
}

export interface MapPolylineProps extends BaseProps {
  /** Flat [latitude, longitude, ...] coordinate pairs. */
  geometry: number[]
  strokeColor?: string
  strokeWidth?: number
}

export interface MapPolygonProps extends BaseProps {
  /** Flat [latitude, longitude, ...] coordinate pairs; the host closes the ring. */
  geometry: number[]
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
}

export interface MapMarkerProps extends BaseProps {
  /** Flat [latitude, longitude] coordinate pair. */
  geometry: number[]
  id: string
  title?: string
  /** CSS color for a place pin or the position selected on an elevation profile. */
  pinColor?: string
  /** Route-direction arrow, clockwise from north; absent uses a place marker. */
  bearing?: number
  onPress?: (event: { nativeEvent: { id: string } }) => void
  onMarkerPress?: (event: { nativeEvent: { id: string } }) => void
}

// ============================================================================
// List Components
// ============================================================================

export interface FlatListProps<T> extends ScrollViewProps {
  /** Data-driven rows are not part of the current keyed child protocol. */
  /** Number of columns in the keyed child tree. */
  numColumns?: number
  /** Top-level pull-to-refresh handler for the mounted keyed rows. */
  onRefresh?: () => void
  /** Controlled pull-to-refresh state for the mounted keyed rows. */
  refreshing?: boolean
  /** End reached handler for the mounted keyed rows. */
  onEndReached?: () => void
  /** End reached threshold */
  onEndReachedThreshold?: number
  /** Render rows in reverse order along the scroll axis. */
  inverted?: boolean
}

export interface SectionListProps<T> extends ScrollViewProps {
  /** Section data is deferred until the versioned list-data protocol exists. */
}

// ============================================================================
// Overlay Components
// ============================================================================

export interface ModalProps extends BaseProps {
  /** Modal visible state */
  visible?: boolean
  /** Keep the popup interactive without blocking the screen behind it. */
  nonModal?: boolean
  /** When non-modal, consume an outside tap and call onRequestClose. */
  dismissOnOutsideTap?: boolean
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
  /** Hidden state */
  hidden?: boolean
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
  Link: 'Link',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  Pressable: 'Pressable',
  Switch: 'Switch',
  Checkbox: 'Checkbox',
  Slider: 'Slider',
  Picker: 'Picker',
  DatePicker: 'DatePicker',

  // Media
  Icon: 'Icon',
  Image: 'Image',
  ImageBackground: 'ImageBackground',
  Video: 'Video',
  Map: 'Map',
  MapPolyline: 'MapPolyline',
  MapPolygon: 'MapPolygon',
  MapMarker: 'MapMarker',

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
