import { SVG_PROP_NAMES } from './compiler/svg'

/** Native prop names whose exact spelling is part of the host protocol. */
const NATIVE_PROP_NAMES = [
  // A drawing's attributes: `viewbox` from the HTML parser, `stroke-width`
  // from a template, both read as one spelling by the renderers.
  ...SVG_PROP_NAMES,
  'accessibilityHint', 'accessibilityLabel', 'accessibilityRole', 'accessibilityState', 'accessibilityValue',
  'activeOpacity', 'alwaysBounceHorizontal', 'alwaysBounceVertical', 'animationType', 'autoCapitalize',
  'autoComplete', 'autoCorrect', 'autoFocus', 'contentContainerStyle', 'currentTime', 'defaultSource', 'defaultValue',
  'ellipsizeMode', 'hidesWhenStopped', 'hitSlop', 'imageStyle', 'initialNumToRender',
  'ios_backgroundColor', 'keyboardDismissMode', 'keyboardShouldPersistTaps', 'keyboardType',
  'keyboardVerticalOffset', 'keyExtractor', 'listRole', 'maxLength', 'maximumDate', 'maximumTrackTintColor', 'maximumValue',
  'maxToRenderPerBatch', 'minimumDate', 'minimumTrackTintColor', 'minimumValue', 'minuteInterval', 'numberOfLines',
  'numColumns', 'onEndReachedThreshold', 'pagingEnabled', 'passwordRules', 'placeholderTextColor', 'pointerEvents',
  'presentationStyle', 'nonModal', 'dismissOnOutsideTap',
  'pressRetentionOffset', 'progressBackgroundColor', 'progressViewOffset', 'refreshControl', 'resizeMode',
  'returnKeyType', 'scrollEnabled', 'scrollTarget', 'secureTextEntry', 'selectedValue', 'selectionColor',
  'showsHorizontalScrollIndicator', 'showsVerticalScrollIndicator',
  'stickyHeaderIndices', 'testID', 'textContentType', 'thumbColor', 'thumbTintColor', 'titleColor', 'trackColor',
  'underlayColor', 'windowSize',
  'initialRegion', 'tileOverlay', 'edgePadding', 'fitToBounds', 'showsUserLocation', 'zoomEnabled', 'rotateEnabled', 'pitchEnabled', 'mapType', 'strokeColor', 'pinColor',
  'showsCompass', 'showsScale', 'cameraPitch', 'cameraHeading',
  'autoScrollBottom', 'scrollKey',
  // A video floating in Picture in Picture, and one element across an
  // animated change (craft.animation.next).
  'pictureInPicture', 'transitionID',
]

/**
 * Native props that are booleans, where an attribute written bare means true
 * as it does in HTML. HTML hands a bare attribute over as an empty string, so
 * `<video controls>` or a folded `:multiline="true"` reached the host as "".
 */
export const NATIVE_BOOLEAN_PROPS = new Set([
  'alwaysBounceHorizontal', 'alwaysBounceVertical', 'animating', 'autoCorrect', 'autoFocus', 'autoplay', 'autoPlay', 'bounces', 'controls', 'disabled',
  'editable', 'hidesWhenStopped', 'horizontal', 'loop', 'multiline', 'muted', 'pagingEnabled', 'paused',
  'refreshing', 'scrollEnabled', 'secureTextEntry', 'selectTextOnFocus', 'showsHorizontalScrollIndicator',
  'showsVerticalScrollIndicator', 'transparent', 'visible', 'nonModal', 'dismissOnOutsideTap',
  'fitToBounds', 'showsUserLocation', 'zoomEnabled', 'rotateEnabled', 'pitchEnabled', 'showsCompass', 'showsScale',
  'pictureInPicture',
])

const nativePropNames = new Map(
  NATIVE_PROP_NAMES.map(name => [normaliseKey(name), name]),
)

function normaliseKey(name: string): string {
  return name.replace(/[-_]/g, '').toLowerCase()
}

/** Restore a native protocol prop after HTML lowercasing or kebab-case binding emission. */
export function nativePropName(name: string): string {
  return nativePropNames.get(normaliseKey(name)) ?? name
}
