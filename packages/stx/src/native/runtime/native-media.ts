/**
 * `matchMedia` for a native screen, where there is no CSS engine to ask.
 *
 * The answers come from what the host tells the screen: its width and height
 * (the bridge's `viewportWidth`, then VIEWPORT), its appearance (APPEARANCE),
 * whether it has a pointer (a Mac), and reduced motion. So the same component
 * reads `useMediaQuery('(min-width: 768px)')` on the web, on a phone, on a
 * tablet and in a Mac window, and gets the answer the `md:` classes get.
 *
 * The media features a layout decides on are understood: width and height
 * (`min-`/`max-`, px, em and rem), orientation, `prefers-color-scheme`,
 * `prefers-reduced-motion`, `hover`, `pointer` and their `any-` forms, media
 * types, `and`, `not`, `only` and comma lists. A feature it does not know
 * never matches, as a browser treats one it does not support.
 */

export interface NativeMediaState {
  /** Points; 0 is unknown, which is read as a phone, as the `sm:` classes read it. */
  width: number
  height: number
  colorScheme: 'light' | 'dark'
  reducedMotion: boolean
  /** A pointer that hovers (a Mac), rather than a finger. */
  pointer: boolean
}

export interface NativeMediaQueryList {
  readonly media: string
  readonly matches: boolean
  onchange: ((event: { matches: boolean, media: string }) => void) | null
  addEventListener: (type: string, listener: (event: { matches: boolean, media: string }) => void) => void
  removeEventListener: (type: string, listener: (event: { matches: boolean, media: string }) => void) => void
  addListener: (listener: (event: { matches: boolean, media: string }) => void) => void
  removeListener: (listener: (event: { matches: boolean, media: string }) => void) => void
}

export interface NativeMedia {
  matchMedia: (query: string) => NativeMediaQueryList
  /** The host's latest word on any of these; lists whose answer flipped tell their listeners. */
  update: (changes: Partial<NativeMediaState>) => void
  readonly state: Readonly<NativeMediaState>
}

function length(value: string): number | null {
  const match = /^(-?\d*\.?\d+)(px|em|rem)?$/.exec(value.trim())
  if (!match) return null
  const amount = Number(match[1])
  return match[2] === 'em' || match[2] === 'rem' ? amount * 16 : amount
}

/** Whether one parenthesised feature (`min-width: 768px`, `hover`) holds. */
function feature(text: string, state: NativeMediaState): boolean {
  const [rawName, rawValue] = text.split(':', 2) as [string, string | undefined]
  const name = rawName.trim().toLowerCase()
  const value = rawValue?.trim().toLowerCase()
  const size = (dimension: 'width' | 'height', bound: 'min' | 'max' | null): boolean => {
    const actual = dimension === 'width' ? state.width : state.height
    if (value === undefined) return actual > 0
    const wanted = length(value)
    if (wanted === null) return false
    if (bound === 'min') return actual >= wanted
    if (bound === 'max') return actual <= wanted
    return actual === wanted
  }
  switch (name) {
    case 'width': return size('width', null)
    case 'min-width': return size('width', 'min')
    case 'max-width': return size('width', 'max')
    case 'height': return size('height', null)
    case 'min-height': return size('height', 'min')
    case 'max-height': return size('height', 'max')
    case 'orientation': {
      const landscape = state.width > state.height && state.height > 0
      return value === (landscape ? 'landscape' : 'portrait')
    }
    case 'prefers-color-scheme': return value === state.colorScheme
    case 'prefers-reduced-motion': return value === undefined ? state.reducedMotion : value === (state.reducedMotion ? 'reduce' : 'no-preference')
    case 'hover':
    case 'any-hover': return value === undefined ? state.pointer : value === (state.pointer ? 'hover' : 'none')
    case 'pointer':
    case 'any-pointer': return value === undefined ? true : value === (state.pointer ? 'fine' : 'coarse')
    default: return false
  }
}

/** Whether a whole media query holds: a comma list of `[not|only] [type] [and (feature)]...`. */
export function evaluateMediaQuery(query: string, state: NativeMediaState): boolean {
  return query.split(',').some((part) => {
    let text = part.trim().toLowerCase()
    if (!text) return false
    let negate = false
    if (text.startsWith('not ')) { negate = true; text = text.slice(4).trim() }
    else if (text.startsWith('only ')) text = text.slice(5).trim()
    const terms = text.split(/\s+and\s+/)
    const holds = terms.every((term) => {
      const trimmed = term.trim()
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) return feature(trimmed.slice(1, -1), state)
      // A media type: a screen is a screen, never print.
      return trimmed === 'all' || trimmed === 'screen'
    })
    return negate ? !holds : holds
  })
}

export function createNativeMedia(initial: Partial<NativeMediaState> = {}): NativeMedia {
  const state: NativeMediaState = {
    width: Math.max(0, Number(initial.width) || 0),
    height: Math.max(0, Number(initial.height) || 0),
    colorScheme: initial.colorScheme === 'dark' ? 'dark' : 'light',
    reducedMotion: initial.reducedMotion === true,
    pointer: initial.pointer === true,
  }
  // Only lists something listens to are kept, so a component's read-once query costs nothing later.
  const watched = new Set<{ list: NativeMediaQueryList, matches: boolean, listeners: Set<(event: { matches: boolean, media: string }) => void> }>()

  function matchMedia(query: string): NativeMediaQueryList {
    const media = String(query)
    const entry = { list: null as unknown as NativeMediaQueryList, matches: evaluateMediaQuery(media, state), listeners: new Set<(event: { matches: boolean, media: string }) => void>() }
    const listen = (listener: (event: { matches: boolean, media: string }) => void): void => {
      if (typeof listener !== 'function') return
      entry.listeners.add(listener)
      watched.add(entry)
    }
    const forget = (listener: (event: { matches: boolean, media: string }) => void): void => {
      entry.listeners.delete(listener)
      if (!entry.listeners.size && !entry.list.onchange) watched.delete(entry)
    }
    let onchange: NativeMediaQueryList['onchange'] = null
    entry.list = {
      media,
      get matches() { return evaluateMediaQuery(media, state) },
      get onchange() { return onchange },
      set onchange(value) {
        onchange = typeof value === 'function' ? value : null
        if (onchange) watched.add(entry)
        else if (!entry.listeners.size) watched.delete(entry)
      },
      addEventListener: (type, listener) => { if (type === 'change') listen(listener) },
      removeEventListener: (type, listener) => { if (type === 'change') forget(listener) },
      addListener: listen,
      removeListener: forget,
    }
    return entry.list
  }

  function update(changes: Partial<NativeMediaState>): void {
    if (changes.width !== undefined && Number.isFinite(changes.width)) state.width = Math.max(0, changes.width)
    if (changes.height !== undefined && Number.isFinite(changes.height)) state.height = Math.max(0, changes.height)
    if (changes.colorScheme === 'light' || changes.colorScheme === 'dark') state.colorScheme = changes.colorScheme
    if (typeof changes.reducedMotion === 'boolean') state.reducedMotion = changes.reducedMotion
    if (typeof changes.pointer === 'boolean') state.pointer = changes.pointer
    for (const entry of [...watched]) {
      const matches = evaluateMediaQuery(entry.list.media, state)
      if (matches === entry.matches) continue
      entry.matches = matches
      const event = { matches, media: entry.list.media }
      entry.list.onchange?.(event)
      for (const listener of [...entry.listeners]) listener(event)
    }
  }

  return { matchMedia, update, state }
}
