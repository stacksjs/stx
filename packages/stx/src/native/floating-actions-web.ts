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
 * Where it sits and what it is made of are the page's to say, as custom
 * properties on any ancestor (or `:root`):
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

export interface FloatingActionsWeb {
  /** Draw these actions, replacing what was drawn. None takes the group away. */
  update: (actions: ReadonlyArray<NativeFloatingAction | null | undefined | false>, layout?: NativeFloatingActionsLayout, className?: string) => void
  /** Take the group out of the page, with its menu and listeners. */
  dispose: () => void
  /** The group as it is in the page now, or null while there are no actions. */
  readonly element: HTMLElement | null
}

const GLASS = 'background:var(--stx-floating-actions-background,color-mix(in srgb,Canvas 78%,transparent));backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);box-shadow:inset 0 0 0 .5px color-mix(in srgb,currentColor 18%,transparent),0 8px 24px rgba(0,0,0,.18)'
const TINT = 'var(--stx-floating-actions-tint,#007aff)'

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

  const symbol = (icon: string | undefined, label: string, size: number): HTMLElement => {
    const mark = doc.createElement('span')
    mark.setAttribute('aria-hidden', 'true')
    if (icon) {
      mark.className = icon
      mark.style.cssText = `display:block;width:${size}px;height:${size}px;flex-shrink:0`
    }
    else {
      // No picture for the web was given: its name, rather than an empty circle.
      mark.textContent = label
      mark.style.cssText = 'font-size:12px;font-weight:600;line-height:1;padding:0 6px;white-space:nowrap'
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
    menu.style.cssText = `position:absolute;inset-inline-end:0;bottom:calc(100% + 8px);display:flex;flex-direction:column;width:max-content;min-width:200px;max-width:min(280px,calc(100vw - 32px));padding:6px;border-radius:18px;color:inherit;${GLASS}`
    for (const choice of choices) {
      const link = doc.createElement('a')
      link.setAttribute('role', 'menuitem')
      link.href = sitePath(choice.href, choice.path)
      link.setAttribute('data-floating-actions-choice', choice.path)
      link.style.cssText = 'display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:12px;color:inherit;text-decoration:none;font-size:16px;line-height:20px'
      if (choice.icon) link.append(symbol(choice.icon, choice.title, 20))
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
    update(actions, layout = 'vertical', className = '') {
      // The same rules as the app's: a list the host would refuse is refused here.
      const accessory = floatingActions(actions, layout)
      clear()
      if (!accessory) return
      const list = (actions as ReadonlyArray<NativeFloatingAction | null | undefined | false>).filter(Boolean) as NativeFloatingAction[]
      const joined = layout !== 'separate'
      const vertical = layout === 'vertical'
      group = doc.createElement('div')
      group.setAttribute('data-floating-actions-web', layout)
      group.setAttribute('role', 'group')
      group.setAttribute('aria-label', accessory.accessibilityLabel || accessory.title)
      if (className) group.className = className
      // `display` is left to the class where one is given, so a page can show
      // the group at some widths only (`hidden max-md:flex`).
      group.style.cssText = `position:fixed;z-index:var(--stx-floating-actions-z,40);inset-inline-end:var(--stx-floating-actions-inset-end,16px);bottom:var(--stx-floating-actions-bottom,calc(16px + env(safe-area-inset-bottom)));${className ? '' : 'display:flex;'}flex-direction:${vertical ? 'column' : 'row'};gap:${joined ? 0 : 10}px;color:var(--stx-floating-actions-color,CanvasText);${joined ? `border-radius:24px;${GLASS}` : ''}`
      const here = doc.defaultView?.location?.pathname?.replace(/\/$/, '') || '/'
      list.forEach((action, index) => {
        const href = sitePath(action.href, action.path)
        const offers = Boolean(action.menu?.length)
        const control = doc.createElement(offers ? 'button' : 'a') as HTMLButtonElement | HTMLAnchorElement
        const badge = index === list.length - 1 ? badgeText(action.badge) : null
        control.setAttribute('data-floating-action', action.path)
        control.setAttribute('aria-label', `${action.accessibilityLabel || action.label}${badge ? `, ${badge}` : ''}`)
        control.title = action.label
        // One control as the hosts draw it: 48 across, symbols 55 apart, no
        // divider; a round one of its own when they are kept separate.
        const width = joined ? (vertical ? 48 : 55) : 48
        const height = joined ? (vertical ? 55 : 48) : 48
        control.style.cssText = `position:relative;display:flex;align-items:center;justify-content:center;min-width:${width}px;height:${height}px;flex-shrink:0;margin:0;padding:0;border:0;border-radius:24px;color:inherit;font:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;${joined ? 'background:transparent' : GLASS}`
        const current = href.split('?')[0]!.replace(/\/$/, '') === here
        if (action.active || current) control.style.color = TINT
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
        control.append(symbol(action.icon, action.label, 24))
        if (badge) {
          const count = doc.createElement('span')
          count.setAttribute('data-floating-action-badge', '')
          count.setAttribute('aria-hidden', 'true')
          count.textContent = badge
          count.style.cssText = `position:absolute;top:4px;inset-inline-end:2px;display:flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:${TINT};color:#fff;font-size:11px;font-weight:600;line-height:1`
          control.append(count)
        }
        group!.append(control)
      })
      if (joined) {
        // The first and last symbols sit at the centres of the capsule's
        // round ends (24 from each), as Maps places them and the hosts do.
        const first = group.firstElementChild as HTMLElement | null
        const last = group.lastElementChild as HTMLElement | null
        if (first) first.style[vertical ? 'marginTop' : 'marginInlineStart'] = '-3.5px'
        if (last) last.style[vertical ? 'marginBottom' : 'marginInlineEnd'] = '-3.5px'
      }
      doc.body.append(group)
    },
    dispose: clear,
  }
}
