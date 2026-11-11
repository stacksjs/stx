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
   * On: drawn in the app's tint, filled where its symbol has a fill, and
   * announced as selected. For a mode the action switched, as Maps' location
   * arrow is blue while tracking. An action is already drawn this way while
   * the screen at its `path` is showing.
   */
  active?: boolean
  /** An unread count or a short word. A number past 99 reads `99+`; zero and empty show nothing. Only the last action carries one. */
  badge?: string | number | null
  /** Destinations it offers instead of opening `path`. Any action but the last may carry one. */
  menu?: NativeAccessoryMenuItem[]
}

/**
 * `vertical` and `horizontal` join the actions in one capsule of glass, as the
 * map controls in Maps are joined; `separate` keeps a round control each.
 */
export type NativeFloatingActionsLayout = 'vertical' | 'horizontal' | 'separate'

/** The most actions one group holds. */
export const MAX_FLOATING_ACTIONS = 3

function badgeText(badge: NativeFloatingAction['badge']): string | null {
  if (typeof badge === 'number') return badge > 99 ? '99+' : badge > 0 ? String(Math.floor(badge)) : null
  return badge ? String(badge).slice(0, 8) : null
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
 */
export function floatingActions(actions: ReadonlyArray<NativeFloatingAction | null | undefined | false>, layout: NativeFloatingActionsLayout = 'vertical'): NativeTabAccessory | null {
  if (!Array.isArray(actions)) throw new TypeError('floatingActions needs a list of actions')
  if (layout !== 'vertical' && layout !== 'horizontal' && layout !== 'separate') throw new TypeError(`floatingActions: unknown layout "${String(layout)}"`)
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
  if (primary.menu?.length) throw new TypeError(`floatingActions: the last action (${primary.path}) opens its path; put the menu on an earlier one`)
  const companions = list.slice(0, -1).map((action) => {
    if (badgeText(action.badge)) throw new TypeError(`floatingActions: only the last action shows a badge, not ${action.path}`)
    return {
      path: action.path,
      title: action.label,
      symbol: action.symbol,
      ...(action.accessibilityLabel ? { accessibilityLabel: action.accessibilityLabel } : {}),
      ...(action.active ? { selected: true } : {}),
      ...(action.menu?.length ? { menu: action.menu.map(choice => ({ ...choice })) } : {}),
    }
  })
  return {
    path: primary.path,
    title: primary.label,
    symbol: primary.symbol,
    ...(primary.accessibilityLabel ? { accessibilityLabel: primary.accessibilityLabel } : {}),
    ...(primary.active ? { selected: true } : {}),
    badge: badgeText(primary.badge),
    ...(layout === 'separate' ? { iconOnly: true } : { layout }),
    companions,
  }
}
