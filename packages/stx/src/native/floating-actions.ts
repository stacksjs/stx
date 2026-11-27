import type { NativeAccessoryMenuItem, NativeTabAccessory } from './runtime/craft'

/**
 * One floating action: a round control over the screen that opens a path of
 * the app, or a short menu of them. Named for what it does (`label`), drawn
 * as a symbol.
 */
export interface NativeFloatingAction {
  /** The path of the app it opens (`/messages`). */
  path: string
  /** Its name: read by VoiceOver and TalkBack, never drawn. */
  label: string
  /** An SF Symbol name; filled symbols (`message.fill`) carry the weight of the system's own controls. */
  symbol: string
  /** Read in place of `label` when the name alone is not enough. */
  accessibilityLabel?: string
  /**
   * Read after the name in place of the badge, on the last action (the one
   * with the badge). `''` reads nothing there, for a name that already says
   * the count ("Add, 3 unread messages"); left out, the badge is read.
   */
  accessibilityValue?: string
  /**
   * On: drawn in the app's tint, filled where its symbol has a fill, and
   * announced as selected. For a mode the action switched, as Maps' location
   * arrow is blue while tracking. An action is already drawn this way while
   * the screen at its `path` is showing.
   */
  active?: boolean
  /** An unread count or a short word. A number past 99 reads `99+`; zero and empty show nothing. Only the last action carries one. */
  badge?: string | number | null
  /** Destinations it offers instead of opening `path`. Any action but the last may carry one, and the one action `beside` the tab bar. */
  menu?: NativeFloatingActionChoice[]
  /**
   * Its picture on a web page: an icon class (`i-lucide-plus`). A browser has
   * no SF Symbols, so `<FloatingActions>` draws this there; an action without
   * one is drawn as its name. A host never sees it.
   */
  icon?: string
  /** Where it goes on a web page, when the website's path is not the app's (`/messages` for `/m/messages`). */
  href?: string
}

/** One destination of an action's menu, with what a web page draws and opens for it. */
export interface NativeFloatingActionChoice extends Omit<NativeAccessoryMenuItem, 'badge'> {
  /** Drawn at the item's trailing end. A number past 99 reads `99+`; zero and empty show nothing. */
  badge?: string | number | null
  /** Its picture on a web page: an icon class. */
  icon?: string
  /** Where it goes on a web page, when that is not `path`. */
  href?: string
}

/**
 * `vertical` and `horizontal` join the actions in one capsule of glass, as the
 * map controls in Maps are joined; `separate` keeps a round control each.
 * `beside` is one round action next to the tab bar, which narrows for it; that
 * action may carry a badge and a menu at once.
 */
export type NativeFloatingActionsLayout = 'vertical' | 'horizontal' | 'separate' | 'beside'

const LAYOUTS: ReadonlySet<string> = new Set(['vertical', 'horizontal', 'separate', 'beside'])

/** The most actions one group holds. */
export const MAX_FLOATING_ACTIONS = 3

function badgeText(badge: NativeFloatingAction['badge']): string | null {
  if (typeof badge === 'number') return badge > 99 ? '99+' : badge > 0 ? String(Math.floor(badge)) : null
  return badge ? String(badge).slice(0, 8) : null
}

/** A menu as the host is sent it: what only a web page uses stays out. */
function hostMenu(owner: string, menu: readonly NativeFloatingActionChoice[]): NativeAccessoryMenuItem[] {
  return menu.map((choice) => {
    if (choice.presentation !== undefined && choice.presentation !== 'cover') throw new TypeError(`floatingActions: ${owner}'s menu item ${choice.path} has an unknown presentation "${String(choice.presentation)}"`)
    const badge = badgeText(choice.badge)
    return {
      path: choice.path,
      title: choice.title,
      ...(choice.symbol ? { symbol: choice.symbol } : {}),
      ...(choice.accessibilityLabel ? { accessibilityLabel: choice.accessibilityLabel } : {}),
      ...(badge ? { badge } : {}),
      ...(choice.presentation ? { presentation: choice.presentation } : {}),
    }
  })
}

/**
 * The floating actions of a screen, or of the whole app, in the order they
 * read: top to bottom in a vertical group, leading to trailing otherwise.
 *
 * It answers with the `tabAccessory` a host draws them from, for
 * `craft.navigation.setChrome` (every screen) and `setOptions` (one screen);
 * no actions answers `null`, which takes the group away.
 *
 * ```ts
 * craft.navigation.setChrome({
 *   tabAccessory: floatingActions([
 *     { path: '/add', label: 'Add', symbol: 'plus', menu: [{ path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' }] },
 *     { path: '/messages', label: 'Messages', symbol: 'message.fill', badge: unread },
 *   ]),
 * })
 * ```
 *
 * The host's group has one primary action, the last: it alone shows a badge,
 * and it always opens its path. A badge or a menu anywhere else is a mistake
 * in the list rather than something to draw differently, so it is refused.
 *
 * `beside` is the exception, and holds exactly one action: a round control next
 * to the tab bar (which narrows for it) that may carry a badge and a menu at
 * once, as an Add button whose menu holds the quick-add destinations.
 *
 * ```ts
 * craft.navigation.setChrome({
 *   tabAccessory: floatingActions([
 *     { path: '/add', label: 'Add', symbol: 'plus', badge: unread, menu: [
 *       { path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' },
 *       { path: '/chat', title: 'Chat', symbol: 'message', badge: unread, presentation: 'cover' },
 *     ] },
 *   ], 'beside'),
 * })
 * ```
 */
export function floatingActions(actions: ReadonlyArray<NativeFloatingAction | null | undefined | false>, layout: NativeFloatingActionsLayout = 'vertical'): NativeTabAccessory | null {
  if (!Array.isArray(actions)) throw new TypeError('floatingActions needs a list of actions')
  if (!LAYOUTS.has(layout)) throw new TypeError(`floatingActions: unknown layout "${String(layout)}"`)
  const list = actions.filter(Boolean) as NativeFloatingAction[]
  if (!list.length) return null
  if (list.length > MAX_FLOATING_ACTIONS) throw new TypeError(`floatingActions holds at most ${MAX_FLOATING_ACTIONS} actions, got ${list.length}`)
  const seen = new Set<string>()
  for (const action of list) {
    if (typeof action.path !== 'string' || !action.path.startsWith('/') || action.path.startsWith('//')) throw new TypeError(`floatingActions: "${String(action.path)}" is not a path of the app`)
    if (!action.label || !action.symbol) throw new TypeError(`floatingActions: ${action.path} needs a label and a symbol`)
    if (seen.has(action.path)) throw new TypeError(`floatingActions: ${action.path} is listed twice`)
    seen.add(action.path)
  }
  const primary = list[list.length - 1]
  if (layout === 'beside') {
    if (list.length !== 1) throw new TypeError(`floatingActions: 'beside' holds one action, got ${list.length}`)
    const badge = badgeText(primary.badge)
    return {
      layout: 'beside',
      path: primary.path,
      title: primary.label,
      symbol: primary.symbol,
      ...(primary.accessibilityLabel ? { accessibilityLabel: primary.accessibilityLabel } : {}),
      // Kept when empty: '' is the instruction to read nothing in the badge's place.
      ...(primary.accessibilityValue !== undefined ? { accessibilityValue: String(primary.accessibilityValue) } : {}),
      ...(primary.active ? { selected: true } : {}),
      badge,
      ...(primary.menu?.length ? { menu: hostMenu(primary.path, primary.menu) } : {}),
    }
  }
  if (primary.menu?.length) throw new TypeError(`floatingActions: the last action (${primary.path}) opens its path; put the menu on an earlier one`)
  const companions = list.slice(0, -1).map((action) => {
    if (badgeText(action.badge)) throw new TypeError(`floatingActions: only the last action shows a badge, not ${action.path}`)
    return {
      path: action.path,
      title: action.label,
      symbol: action.symbol,
      ...(action.accessibilityLabel ? { accessibilityLabel: action.accessibilityLabel } : {}),
      ...(action.active ? { selected: true } : {}),
      // What only a web page uses stays out of what the host is sent.
      ...(action.menu?.length ? { menu: hostMenu(action.path, action.menu) } : {}),
    }
  })
  return {
    path: primary.path,
    title: primary.label,
    symbol: primary.symbol,
    ...(primary.accessibilityLabel ? { accessibilityLabel: primary.accessibilityLabel } : {}),
    ...(primary.accessibilityValue !== undefined ? { accessibilityValue: String(primary.accessibilityValue) } : {}),
    ...(primary.active ? { selected: true } : {}),
    badge: badgeText(primary.badge),
    ...(layout === 'separate' ? { iconOnly: true } : { layout }),
    companions,
  }
}
