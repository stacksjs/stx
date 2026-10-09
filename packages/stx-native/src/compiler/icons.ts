/**
 * Iconify names to SF Symbols, for `<Icon>` on a native screen.
 *
 * A web screen draws `i-lucide-sun` from Iconify's CSS. A native screen has no
 * CSS icons, so the compiler (and the runtime, for a class that only exists at
 * runtime) maps the name to the SF Symbol that means the same thing, and the
 * host draws it as a tinted `UIImageView`.
 *
 * The table is lucide first, because that is the collection HQ uses. Entries
 * pick the closest symbol in meaning, not in shape: `footprints` is a run, so
 * it is `figure.run`. Anything missing falls back to `circle` and the compiler
 * says which name it did not know.
 */

/** The symbol drawn for a name the table does not have. */
export const FALLBACK_SYMBOL = 'circle'

/** lucide name (without the `i-lucide-` prefix) to SF Symbol name. */
export const LUCIDE_TO_SF: Record<string, string> = {
  'activity': 'waveform.path.ecg',
  'alarm-clock': 'alarm',
  'alert-circle': 'exclamationmark.circle',
  'alert-triangle': 'exclamationmark.triangle',
  'archive': 'archivebox',
  'arrow-down': 'arrow.down',
  'arrow-left': 'arrow.left',
  'arrow-right': 'arrow.right',
  'arrow-up': 'arrow.up',
  'arrow-up-right': 'arrow.up.right',
  'at-sign': 'at',
  'audio-lines': 'waveform',
  'award': 'rosette',
  'badge-check': 'checkmark.seal',
  'bar-chart': 'chart.bar',
  'bar-chart-2': 'chart.bar',
  'bar-chart-3': 'chart.bar',
  'battery': 'battery.100',
  'bed': 'bed.double',
  'bell': 'bell',
  'bell-off': 'bell.slash',
  'bike': 'figure.outdoor.cycle',
  'bluetooth': 'antenna.radiowaves.left.and.right',
  'book': 'book',
  'book-open': 'book',
  'bookmark': 'bookmark',
  'brain': 'brain',
  'calendar': 'calendar',
  'calendar-check': 'calendar.badge.checkmark',
  'calendar-clock': 'calendar.badge.clock',
  'calendar-days': 'calendar',
  'calendar-plus': 'calendar.badge.plus',
  'calendar-range': 'calendar',
  'calendar-sync': 'arrow.triangle.2.circlepath',
  'camera': 'camera',
  'chart-bar': 'chart.bar',
  'chart-line': 'chart.xyaxis.line',
  'check': 'checkmark',
  'check-circle': 'checkmark.circle',
  'check-circle-2': 'checkmark.circle',
  'chevron-down': 'chevron.down',
  'chevron-left': 'chevron.left',
  'chevron-right': 'chevron.right',
  'chevron-up': 'chevron.up',
  'circle': 'circle',
  'circle-alert': 'exclamationmark.circle',
  'circle-check': 'checkmark.circle',
  'circle-check-big': 'checkmark.circle',
  'circle-help': 'questionmark.circle',
  'circle-play': 'play.circle',
  'circle-plus': 'plus.circle',
  'circle-user': 'person.crop.circle',
  'circle-x': 'xmark.circle',
  'clapperboard': 'film',
  'clipboard': 'clipboard',
  'clipboard-list': 'list.clipboard',
  'clock': 'clock',
  'cloud': 'cloud',
  'cloud-off': 'icloud.slash',
  'coffee': 'cup.and.saucer',
  'copy': 'doc.on.doc',
  'credit-card': 'creditcard',
  'download': 'arrow.down.circle',
  'droplet': 'drop',
  'droplets': 'drop',
  'dumbbell': 'dumbbell',
  'edit': 'pencil',
  'external-link': 'arrow.up.right.square',
  'eye': 'eye',
  'eye-off': 'eye.slash',
  'file': 'doc',
  'file-text': 'doc.text',
  'filter': 'line.3.horizontal.decrease',
  'flag': 'flag',
  'flame': 'flame',
  'footprints': 'figure.run',
  'gauge': 'gauge',
  'gift': 'gift',
  'globe': 'globe',
  'graduation-cap': 'graduationcap',
  'grip-vertical': 'line.3.horizontal',
  'heart': 'heart',
  'heart-pulse': 'heart.text.square',
  'help-circle': 'questionmark.circle',
  'history': 'clock.arrow.circlepath',
  'home': 'house',
  'house': 'house',
  'image': 'photo',
  'inbox': 'tray',
  'info': 'info.circle',
  'layers': 'square.3.layers.3d',
  'layout-grid': 'square.grid.2x2',
  'library': 'books.vertical',
  'link': 'link',
  'list': 'list.bullet',
  'list-checks': 'checklist',
  'loader': 'arrow.triangle.2.circlepath',
  'loader-2': 'arrow.triangle.2.circlepath',
  'loader-circle': 'arrow.triangle.2.circlepath',
  'lock': 'lock',
  'log-in': 'arrow.right.to.line',
  'log-out': 'rectangle.portrait.and.arrow.right',
  'mail': 'envelope',
  'map': 'map',
  'map-pin': 'mappin.and.ellipse',
  'medal': 'medal',
  'menu': 'line.3.horizontal',
  'message-circle': 'bubble.left',
  'message-square': 'text.bubble',
  'message-square-quote': 'quote.bubble',
  'mic': 'mic',
  'minus': 'minus',
  'moon': 'moon',
  'more-horizontal': 'ellipsis',
  'more-vertical': 'ellipsis',
  'mountain': 'mountain.2',
  'music': 'music.note',
  'package': 'shippingbox',
  'pause': 'pause',
  'pause-circle': 'pause.circle',
  'pencil': 'pencil',
  'person-standing': 'figure.walk',
  'phone': 'phone',
  'play': 'play.fill',
  'plug': 'powerplug',
  'plus': 'plus',
  'plus-circle': 'plus.circle',
  'refresh-cw': 'arrow.clockwise',
  'repeat': 'repeat',
  'rotate-ccw': 'arrow.counterclockwise',
  'route': 'point.topleft.down.to.point.bottomright.curvepath',
  'ruler': 'ruler',
  'sailboat': 'sailboat',
  'satellite': 'antenna.radiowaves.left.and.right',
  'save': 'square.and.arrow.down',
  'scale': 'scalemass',
  'search': 'magnifyingglass',
  'send': 'paperplane',
  'settings': 'gearshape',
  'settings-2': 'slider.horizontal.3',
  'share': 'square.and.arrow.up',
  'share-2': 'square.and.arrow.up',
  'shield': 'shield',
  'shield-check': 'checkmark.shield',
  'shopping-bag': 'bag',
  'shopping-cart': 'cart',
  'skip-back': 'backward.end',
  'skip-forward': 'forward.end',
  'sliders': 'slider.horizontal.3',
  'sliders-horizontal': 'slider.horizontal.3',
  'smartphone': 'iphone',
  'snowflake': 'snowflake',
  'sparkles': 'sparkles',
  'square': 'square',
  'star': 'star',
  'stopwatch': 'stopwatch',
  'store': 'storefront',
  'sun': 'sun.max',
  'sunrise': 'sunrise',
  'sunset': 'sunset',
  'tag': 'tag',
  'target': 'scope',
  'thermometer': 'thermometer.medium',
  'thumbs-up': 'hand.thumbsup',
  'timer': 'timer',
  'trash': 'trash',
  'trash-2': 'trash',
  'trending-down': 'chart.line.downtrend.xyaxis',
  'trending-up': 'chart.line.uptrend.xyaxis',
  'trophy': 'trophy',
  'unlink': 'personalhotspot.slash',
  'upload': 'arrow.up.circle',
  'user': 'person',
  'user-plus': 'person.badge.plus',
  'user-round': 'person',
  'users': 'person.2',
  'video': 'video',
  'volume-2': 'speaker.wave.2',
  'watch': 'applewatch',
  'waves': 'figure.pool.swim',
  'weight': 'scalemass',
  'wifi': 'wifi',
  'wifi-off': 'wifi.slash',
  'wind': 'wind',
  'x': 'xmark',
  'x-circle': 'xmark.circle',
  'zap': 'bolt',
}

export interface IconResolution {
  symbol: string
  /** The Iconify name the symbol came from, when it came from one. */
  iconify?: string
  /** False when the name was not in the table and the fallback was used. */
  known: boolean
}

/**
 * Resolve whatever a screen wrote to an SF Symbol.
 *
 * Accepts `i-lucide-sun`, `lucide:sun`, a bare lucide name (`sun`, as HQ's web
 * `<Icon name="sun">` takes it) and an SF Symbol name (anything with a dot, or
 * passed as `symbol`), which is used as is.
 */
export function resolveIconName(name: string | null | undefined, asSymbol = false): IconResolution {
  const value = String(name ?? '').trim()
  if (!value)
    return { symbol: FALLBACK_SYMBOL, known: false }
  if (asSymbol)
    return { symbol: value, known: true }
  const prefixed = /^i-([a-z0-9]+)-(.+)$/.exec(value) ?? /^([a-z0-9]+):(.+)$/.exec(value)
  const collection = prefixed ? prefixed[1] : 'lucide'
  const icon = prefixed ? prefixed[2] : value
  if (collection === 'lucide') {
    const symbol = LUCIDE_TO_SF[icon]
    if (symbol)
      return { symbol, iconify: `i-lucide-${icon}`, known: true }
    if (!prefixed && value.includes('.'))
      return { symbol: value, known: true }
  }
  return { symbol: FALLBACK_SYMBOL, iconify: prefixed ? value : `i-lucide-${icon}`, known: false }
}

/** The first Iconify class in a class list (`i-lucide-sun w-5 h-5`), if any. */
export function iconClassIn(classes: string): string | undefined {
  return classes.split(/\s+/).find(name => /^i-[a-z0-9]+-[a-z0-9-]+$/.test(name))
}
