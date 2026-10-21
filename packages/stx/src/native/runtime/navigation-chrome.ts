/**
 * The app's chrome merged into one screen's bar (`craft.navigation.setChrome`).
 *
 * Every app with a tab bar ends up wanting the same few buttons on every
 * screen - the account, a calendar, a map - and each one wrote it as a
 * wrapper around `setOptions` that every screen had to install, remembering
 * which ids were its own, which screens to leave bare, and that a tab badge
 * update must not resend the toolbar (iOS rebuilds the buttons and their
 * images, mid-scroll). This is that wrapper, once, in the runtime the screens
 * already share.
 *
 * Pure: the bridge hands it the screen's own buttons and the chrome, and sends
 * what it returns.
 */

import type { NativeChromeButton, NativeNavigationButton, NativeNavigationChrome, NativeTabItemOptions } from './craft'

export type ButtonSide = 'leftButtons' | 'rightButtons'

/** Where the screen is, as `craft.route` says. */
export interface ChromeRoute {
  name: string
  path?: string
}

/** `/m/calendar?week=2` and `https://app.test/m/calendar` are both `/m/calendar`. */
export function chromePath(value: string | undefined): string {
  if (!value) return ''
  let path = value.trim()
  const scheme = path.indexOf('://')
  if (scheme >= 0) {
    const slash = path.indexOf('/', scheme + 3)
    path = slash >= 0 ? path.slice(slash) : '/'
  }
  const end = path.search(/[?#]/)
  if (end >= 0) path = path.slice(0, end)
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

/** Whether a chrome button belongs on this screen. */
export function showsChromeButton(button: NativeChromeButton, route: ChromeRoute): boolean {
  if (button.hideOn?.includes(route.name)) return false
  if (button.open && route.path && chromePath(button.open) === chromePath(route.path)) return false
  return true
}

/**
 * The buttons one side of the bar shows: the screen's own, then the chrome's.
 *
 * A screen button with a chrome button's id gives way to it, so a screen that
 * still draws its own account button does not end up with two.
 */
export function mergeChromeButtons(
  own: readonly NativeNavigationButton[],
  chrome: NativeNavigationChrome | null,
  side: ButtonSide,
  route: ChromeRoute,
): NativeChromeButton[] {
  if (!chrome || chrome.bare?.includes(route.name)) return [...own]
  const shared = (chrome[side] ?? []).filter(button => button && button.id != null && showsChromeButton(button, route))
  const taken = new Set((chrome.leftButtons ?? []).concat(chrome.rightButtons ?? []).map(button => String(button?.id)))
  return [...own.filter(button => !taken.has(String(button?.id))), ...shared]
}

/** What the host is shown for a button: no callbacks, and nothing chrome-only. */
export function hostButton(button: NativeChromeButton): NativeNavigationButton {
  const { onPress, open, hideOn, ...rest } = button
  return rest
}

/** The key two sends compare by, so an unchanged bar is not sent again. */
export function buttonsKey(buttons: readonly NativeChromeButton[]): string {
  return JSON.stringify(buttons.map(hostButton))
}

/** The tab items of `chrome` that differ from what was last sent for each tab. */
export function changedTabItems(chrome: NativeNavigationChrome | null, sent: Map<string, string>): NativeTabItemOptions[] {
  const changed: NativeTabItemOptions[] = []
  for (const item of chrome?.tabItems ?? []) {
    if (!item?.id) continue
    const key = JSON.stringify(item)
    if (sent.get(item.id) === key) continue
    sent.set(item.id, key)
    changed.push(item)
  }
  return changed
}
