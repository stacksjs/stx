/** Native prop names whose camel-case spelling is part of the host protocol. */
const NATIVE_PROP_NAMES = [
  'accessibilityHint', 'accessibilityLabel', 'accessibilityRole', 'accessibilityState', 'accessibilityValue',
  'activeOpacity', 'alwaysBounceHorizontal', 'alwaysBounceVertical', 'animationType', 'autoCapitalize',
  'autoCorrect', 'autoFocus', 'blurRadius', 'contentContainerStyle', 'defaultSource', 'defaultValue',
  'ellipsizeMode', 'fadeDuration', 'hidesWhenStopped', 'hitSlop', 'imageStyle', 'initialNumToRender',
  'iosBackgroundColor', 'keyboardDismissMode', 'keyboardShouldPersistTaps', 'keyboardType',
  'keyboardVerticalOffset', 'keyExtractor', 'maxLength', 'maximumTrackTintColor', 'maximumValue',
  'maxToRenderPerBatch', 'minimumTrackTintColor', 'minimumValue', 'numberOfLines', 'numColumns',
  'onEndReachedThreshold', 'pagingEnabled', 'placeholderTextColor', 'pointerEvents', 'presentationStyle',
  'pressRetentionOffset', 'progressBackgroundColor', 'progressViewOffset', 'refreshControl', 'resizeMode',
  'returnKeyType', 'scrollEnabled', 'scrollTarget', 'secureTextEntry', 'selectedValue', 'selectionColor',
  'showsHorizontalScrollIndicator', 'showsVerticalScrollIndicator', 'statusBarTranslucent',
  'stickyHeaderIndices', 'testID', 'thumbColor', 'thumbTintColor', 'titleColor', 'trackColor',
  'underlayColor', 'windowSize',
] as const

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
