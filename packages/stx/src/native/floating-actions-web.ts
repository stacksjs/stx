/**
 * `<FloatingActions>` on a web page.
 *
 * In an app the host draws the group (Liquid Glass on iOS 26, a Material
 * surface on Android). A page in a browser has no host, and the component used
 * to draw nothing there, so every app wrote its own round buttons for the
 * website and they drifted from the app's: two separate circles side by side
 * where the app has one capsule. This draws the same group from the same
 * actions: one capsule of glass at the trailing edge, a symbol each, the last
 * one's badge, a short menu where an action offers one.
 *
 * Its look is one stylesheet of `:where()` rules, which weigh nothing: any
 * class the page puts on the group, the badge or the menu (`class`,
 * `badgeClass`, `menuClass`) wins over it, so an app styles them in its own
 * utility classes and brand tokens. Where it sits and what it is made of can
 * also be said as custom properties on `:root`:
 *
 *   --stx-floating-actions-bottom      distance from the bottom edge; a page
 *                                      with a tab bar clears it here
 *   --stx-floating-actions-inset-end   distance from the trailing edge
 *   --stx-floating-actions-color       the symbols
 *   --stx-floating-actions-tint        an action that is on, and the badge
 *   --stx-floating-actions-background  the glass
 *   --stx-floating-actions-z           its layer
 */
import type { NativeFloatingAction, NativeFloatingActionsLayout } from './floating-actions'
import { floatingActions } from './floating-actions'

/** The page's own classes for the parts it draws. */
export interface FloatingActionsWebClasses {
  /** The group: where it shows (`flex md:hidden`), its colour and surface. */
  group?: string
  /** The last action's badge. */
  badge?: string
  /** An action's menu. */
  menu?: string
}

export interface FloatingActionsWeb {
  /** Draw these actions, replacing what was drawn. None takes the group away. */
  update: (actions: ReadonlyArray<NativeFloatingAction | null | undefined | false>, layout?: NativeFloatingActionsLayout, classes?: string | FloatingActionsWebClasses) => void
  /** Take the group out of the page, with its menu and listeners. */
  dispose: () => void
  /** The group as it is in the page now, or null while there are no actions. */
  readonly element: HTMLElement | null
}

const GLASS = 'background:var(--stx-floating-actions-background,color-mix(in srgb,Canvas 78%,transparent));backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);box-shadow:inset 0 0 0 .5px color-mix(in srgb,currentColor 18%,transparent),0 8px 24px rgba(0,0,0,.18)'
const TINT = 'var(--stx-floating-actions-tint,#007aff)'
const G = '[data-floating-actions-web'
const A = ':where([data-floating-action])'
/**
 * Every rule inside `:where()`, so none outweighs a class. One control as the
 * hosts draw it: 48 across, symbols 55 apart, no divider; the first and last
 * symbols at the centres of the capsule's round ends (24 from each), as Maps
 * places them. A round surface each when they are kept separate.
 */
export const FLOATING_ACTIONS_CSS = [
  `:where(${G}]){position:fixed;z-index:var(--stx-floating-actions-z,40);inset-inline-end:var(--stx-floating-actions-inset-end,16px);bottom:var(--stx-floating-actions-bottom,calc(16px + env(safe-area-inset-bottom)));display:flex;flex-direction:column;color:var(--stx-floating-actions-color,CanvasText)}`,
  `:where(${G}="horizontal"],${G}="separate"]){flex-direction:row}`,
  `:where(${G}="separate"]){gap:10px}`,
  `:where(${G}="vertical"],${G}="horizontal"]){border-radius:24px;${GLASS}}`,
  `${A}{position:relative;display:flex;align-items:center;justify-content:center;min-width:48px;height:48px;flex-shrink:0;margin:0;padding:0;border:0;border-radius:24px;background:transparent;color:inherit;font:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}`,
  `:where(${G}="vertical"]) ${A}{height:55px}`,
  `:where(${G}="horizontal"]) ${A}{min-width:55px}`,
  `:where(${G}="separate"]) ${A}{${GLASS}}`,
  `:where(${G}="vertical"]) :where([data-floating-action][data-first]){margin-top:-3.5px}`,
  `:where(${G}="vertical"]) :where([data-floating-action][data-last]){margin-bottom:-3.5px}`,
  `:where(${G}="horizontal"]) :where([data-floating-action][data-first]){margin-inline-start:-3.5px}`,
  `:where(${G}="horizontal"]) :where([data-floating-action][data-last]){margin-inline-end:-3.5px}`,
  `:where([data-floating-action][data-on]){color:${TINT}}`,
  `:where([data-floating-action-symbol]){display:block;width:24px;height:24px;flex-shrink:0}`,
  `:where([data-floating-action-name]){font-size:12px;font-weight:600;line-height:1;padding:0 6px;white-space:nowrap}`,
  `:where([data-floating-action-badge]){position:absolute;top:4px;inset-inline-end:2px;display:flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:${TINT};color:#fff;font-size:11px;font-weight:600;line-height:1}`,
  `:where([data-floating-actions-menu]){position:absolute;inset-inline-end:0;bottom:calc(100% + 8px);display:flex;flex-direction:column;width:max-content;min-width:200px;max-width:min(280px,calc(100vw - 32px));padding:6px;border-radius:18px;color:inherit;${GLASS}}`,
  `:where([data-floating-actions-choice]){display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:12px;color:inherit;text-decoration:none;font-size:16px;line-height:20px}`,
  `:where([data-floating-actions-choice]) :where([data-floating-action-symbol]){width:20px;height:20px}`,
].join('\n')

function badgeText(badge: NativeFloatingAction['badge']): string | null {
  if (typeof badge === 'number') return badge > 99 ? '99+' : badge > 0 ? String(Math.floor(badge)) : null
  return badge ? String(badge).slice(0, 8) : null
}

/** A place of this site only: a path, never another origin or a script. */
function sitePath(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

export function mountFloatingActionsWeb(doc: Document = document): FloatingActionsWeb {
  let group: HTMLElement | null = null
  let closeMenu: (() => void) | null = null
  let classes: FloatingActionsWebClasses = {}

  // Once a page, however many groups it has had.
  const rules = (): void => {
    if (doc.querySelector('style[data-floating-actions-style]')) return
    const style = doc.createElement('style')
    style.setAttribute('data-floating-actions-style', '')
    style.textContent = FLOATING_ACTIONS_CSS
    ;(doc.head || doc.body).append(style)
  }

  const symbol = (icon: string | undefined, label: string): HTMLElement => {
    const mark = doc.createElement('span')
    mark.setAttribute('aria-hidden', 'true')
    if (icon) {
      mark.setAttribute('data-floating-action-symbol', '')
      mark.className = icon
    }
    else {
      // No picture for the web was given: its name, rather than an empty circle.
      mark.setAttribute('data-floating-action-name', '')
      mark.textContent = label
    }
    return mark
  }

  const openMenu = (button: HTMLButtonElement, action: NativeFloatingAction): void => {
    closeMenu?.()
    const choices = (action.menu || []).slice(0, 12).filter(choice => choice.title && sitePath(choice.path, '') !== '')
    if (!choices.length || !group) return
    const menu = doc.createElement('div')
    menu.setAttribute('data-floating-actions-menu', '')
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', button.getAttribute('aria-label') || action.label)
    if (classes.menu) menu.className = classes.menu
    for (const choice of choices) {
      const link = doc.createElement('a')
      link.setAttribute('role', 'menuitem')
      link.href = sitePath(choice.href, choice.path)
      link.setAttribute('data-floating-actions-choice', choice.path)
      if (choice.icon) link.append(symbol(choice.icon, choice.title))
      const title = doc.createElement('span')
      title.textContent = choice.title
      link.append(title)
      link.addEventListener('click', () => closeMenu?.())
      menu.append(link)
    }
    const view = doc.defaultView
    const outside = (event: Event): void => {
      const target = event.target as Node | null
      if (target && (menu.contains(target) || button.contains(target))) return
      closeMenu?.()
    }
    const keys = (event: Event): void => {
      const key = (event as KeyboardEvent).key
      if (key === 'Escape') {
        closeMenu?.()
        button.focus()
        return
      }
      if (key !== 'ArrowDown' && key !== 'ArrowUp') return
      event.preventDefault()
      const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      const at = items.indexOf(doc.activeElement as HTMLElement)
      items[(at + (key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus()
    }
    closeMenu = () => {
      closeMenu = null
      menu.remove()
      button.setAttribute('aria-expanded', 'false')
      view?.removeEventListener('pointerdown', outside, true)
      view?.removeEventListener('keydown', keys, true)
    }
    group.append(menu)
    button.setAttribute('aria-expanded', 'true')
    view?.addEventListener('pointerdown', outside, true)
    view?.addEventListener('keydown', keys, true)
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }

  const clear = (): void => {
    closeMenu?.()
    group?.remove()
    group = null
  }

  return {
    get element() { return group },
    update(actions, layout = 'vertical', given = '') {
      // The same rules as the app's: a list the host would refuse is refused here.
      const accessory = floatingActions(actions, layout)
      clear()
      if (!accessory) return
      classes = typeof given === 'string' ? { group: given } : given || {}
      rules()
      const list = (actions as ReadonlyArray<NativeFloatingAction | null | undefined | false>).filter(Boolean) as NativeFloatingAction[]
      group = doc.createElement('div')
      group.setAttribute('data-floating-actions-web', layout)
      group.setAttribute('role', 'group')
      group.setAttribute('aria-label', accessory.accessibilityLabel || accessory.title)
      if (classes.group) group.className = classes.group
      const here = doc.defaultView?.location?.pathname?.replace(/\/$/, '') || '/'
      list.forEach((action, index) => {
        const href = sitePath(action.href, action.path)
        const offers = Boolean(action.menu?.length)
        const control = doc.createElement(offers ? 'button' : 'a') as HTMLButtonElement | HTMLAnchorElement
        const badge = index === list.length - 1 ? badgeText(action.badge) : null
        control.setAttribute('data-floating-action', action.path)
        if (index === 0) control.setAttribute('data-first', '')
        if (index === list.length - 1) control.setAttribute('data-last', '')
        control.setAttribute('aria-label', `${action.accessibilityLabel || action.label}${badge ? `, ${badge}` : ''}`)
        control.title = action.label
        const current = href.split('?')[0]!.replace(/\/$/, '') === here
        // On: the tint, as the hosts draw an action whose screen is showing.
        if (action.active || current) control.setAttribute('data-on', '')
        if (offers) {
          const button = control as HTMLButtonElement
          button.type = 'button'
          button.setAttribute('aria-haspopup', 'menu')
          button.setAttribute('aria-expanded', 'false')
          if (action.active) button.setAttribute('aria-pressed', 'true')
          button.addEventListener('click', () => { if (closeMenu) closeMenu(); else openMenu(button, action) })
        }
        else {
          (control as HTMLAnchorElement).href = href
          if (current) control.setAttribute('aria-current', 'page')
        }
        control.append(symbol(action.icon, action.label))
        if (badge) {
          const count = doc.createElement('span')
          count.setAttribute('data-floating-action-badge', '')
          count.setAttribute('aria-hidden', 'true')
          if (classes.badge) count.className = classes.badge
          count.textContent = badge
          control.append(count)
        }
        group!.append(control)
      })
      doc.body.append(group)
    },
    dispose: clear,
  }
}
