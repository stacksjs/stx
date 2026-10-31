import { SVG_PROP_NAMES } from './compiler/svg'

/** Native prop names whose exact spelling is part of the host protocol. */
const NATIVE_PROP_NAMES = [
  // A drawing's attributes: `viewbox` from the HTML parser, `stroke-width`
  // from a template, both read as one spelling by the renderers.
  ...SVG_PROP_NAMES,
  'accessibilityHint', 'accessibilityLabel', 'accessibilityRole', 'accessibilityState', 'accessibilityValue',
  'barStyle', 'activeOpacity', 'alwaysBounceHorizontal', 'alwaysBounceVertical', 'animationType', 'autoCapitalize',
  'autoComplete', 'autoCorrect', 'autoFocus', 'contentContainerStyle', 'currentTime', 'defaultSource', 'defaultValue',
  'ellipsizeMode', 'hidesWhenStopped', 'hitSlop', 'imageStyle', 'initialNumToRender',
  'ios_backgroundColor', 'keyboardDismissMode', 'keyboardShouldPersistTaps', 'keyboardType',
  'keyboardVerticalOffset', 'keyExtractor', 'listRole', 'maxLength', 'mostRecentEventCount', 'maximumDate', 'maximumTrackTintColor', 'maximumValue',
  'maxToRenderPerBatch', 'minimumDate', 'minimumTrackTintColor', 'minimumValue', 'minuteInterval', 'numberOfLines',
  'numColumns', 'objectFit', 'objectPosition', 'onEndReachedThreshold', 'pageIndex', 'pagingEnabled', 'passwordRules', 'placeholderTextColor', 'pointerEvents',
  'presentationStyle', 'sheetDetents', 'selectedDetent', 'grabberVisible', 'tintColor', 'clearButtonMode', 'nonModal', 'dismissOnOutsideTap',
  'pressRetentionOffset', 'progressBackgroundColor', 'progressViewOffset', 'refreshControl', 'resizeMode',
  'returnKeyType', 'scrollEnabled', 'scrollTarget', 'secureTextEntry', 'selectedValue', 'selectionColor',
  'showsHorizontalScrollIndicator', 'showsVerticalScrollIndicator',
  'stickyHeaderIndices', 'testID', 'textContentType', 'thumbColor', 'thumbTintColor', 'titleColor', 'trackColor',
  'underlayColor', 'windowSize',
  'initialRegion', 'tileOverlay', 'edgePadding', 'fitToBounds', 'showsUserLocation', 'zoomEnabled', 'rotateEnabled', 'pitchEnabled', 'mapType', 'fillColor', 'strokeColor', 'pinColor',
  'showsCompass', 'showsScale', 'cameraPitch', 'cameraHeading',
  'autoScrollBottom', 'scrollKey',
  // An inline completion drawn after the caret of a multi-line TextInput.
  'ghostText',
  // A Sidebar's row height and label size.
  'rowHeight', 'labelFontSize',
  // A video floating in Picture in Picture, and one element across an
  // animated change (craft.animation.next).
  'pictureInPicture', 'transitionID',
  // Drag and drop on a pointer host: what a drag carries (`dragData`, any JSON),
  // the URL another app receives (`dragURL`), the kinds a drop target accepts
  // (`dropTypes`), and whether it reports `inside` as well as before and after.
  'dragData', 'dragURL', 'dropTypes', 'dropInside',
]

/**
 * Native props that are booleans, where an attribute written bare means true
 * as it does in HTML. HTML hands a bare attribute over as an empty string, so
 * `<video controls>` or a folded `:multiline="true"` reached the host as "".
 */
export const NATIVE_BOOLEAN_PROPS = new Set([
  'alwaysBounceHorizontal', 'alwaysBounceVertical', 'animating', 'autoCorrect', 'autoFocus', 'autoplay', 'autoPlay', 'bounces', 'controls', 'disabled', 'draggable', 'dropInside',
  'editable', 'hidesWhenStopped', 'horizontal', 'loop', 'multiline', 'muted', 'pagingEnabled', 'paused',
  'refreshing', 'scrollEnabled', 'secureTextEntry', 'selectTextOnFocus', 'showsHorizontalScrollIndicator',
  'showsVerticalScrollIndicator', 'transparent', 'visible', 'nonModal', 'dismissOnOutsideTap',
  'fitToBounds', 'showsUserLocation', 'zoomEnabled', 'rotateEnabled', 'pitchEnabled', 'showsCompass', 'showsScale',
  'pictureInPicture', 'grabberVisible',
])

const nativePropNames = new Map(
  NATIVE_PROP_NAMES.map(name => [normaliseKey(name), name]),
)

function normaliseKey(name: string): string {
  return name.replace(/[-_]/g, '').toLowerCase()
}

/** Restore a native protocol prop after HTML lowercasing or kebab-case binding emission. */
export function nativePropName(name: string, type?: string): string {
  // HTML media uses src; the native media contract uses source. Keep this
  // type-specific so metadata on views and legacy source values are unchanged.
  if ((type === 'Image' || type === 'Video') && name.toLowerCase() === 'src') return 'source'
  return nativePropNames.get(normaliseKey(name)) ?? name
}
