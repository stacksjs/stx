/**
 * Native sidebar: a real macOS source list (NSOutlineView in a split view),
 * the way Mail, Finder and Notes draw theirs, beside the page.
 *
 * It is not a styled `<nav>`. Selection, keyboard navigation, the sidebar
 * material, collapsing and resizing all come from AppKit, and the window's
 * content becomes a split view: the sidebar on the left, the page on the
 * right. One sidebar per window.
 *
 * ```ts
 * if (sidebar.available()) {
 *   const nav = sidebar.create({
 *     selected: 'inbox',
 *     sections: [
 *       { id: 'mail', items: [{ id: 'inbox', label: 'Inbox', icon: 'tray', badge: 12 }] },
 *       { id: 'sources', header: 'Sources', items: [{ id: 'imessage', label: 'iMessage', icon: 'message' }] },
 *     ],
 *   })!
 *   nav.onSelect(id => show(id))
 *   // Later, as counts change: only the rows whose badge moved are redrawn.
 *   nav.update(nextSections)
 * }
 * ```
 *
 * `available()` is true only in a Craft window whose runtime reports picks
 * back to the page (Craft 0.0.112 and later); older runtimes could draw a
 * sidebar but never said which row was chosen. Keep an HTML sidebar for
 * everywhere else.
 */
import { hasBridge } from './_bridge'

export interface SidebarItem {
  id: string
  label: string
  /** SF Symbol name, e.g. `'tray'`, `'archivebox'`. */
  icon?: string
  /** A count or short text, right-aligned like Mail's. `0`, `''` and null draw nothing. */
  badge?: string | number | null
}

export interface SidebarSection {
  id: string
  /** The section's heading; omit for a section without one. */
  header?: string
  items: SidebarItem[]
}

export interface SidebarOptions {
  sections: SidebarSection[]
  /** The item selected to begin with. */
  selected?: string
  id?: string
}

export interface SidebarHandle {
  readonly id: string
  /**
   * Show these sections. When only badges changed, the affected rows are
   * updated in place; anything else rebuilds the list, keeping the selection.
   */
  update: (sections: SidebarSection[]) => void
  /** Change one row's label, icon or badge. */
  updateItem: (itemId: string, changes: Partial<Omit<SidebarItem, 'id'>>) => void
  /** Select a row without it counting as the person's pick. */
  select: (itemId: string) => void
  /** The person picked a row. Returns an unsubscribe function. */
  onSelect: (callback: (itemId: string) => void) => () => void
  /** Remove the sidebar and give the page the whole window again. */
  destroy: () => void
}

export interface SidebarAPI {
  available: () => boolean
  /** Null outside a Craft window that supports it. */
  create: (options: SidebarOptions) => SidebarHandle | null
}

interface NativeHandle {
  id: string
  setSections: (sections: unknown[]) => unknown
  updateItem: (itemId: string, changes: Record<string, unknown>) => unknown
  setSelectedItem: (itemId: string) => unknown
  onSelect: (callback: (itemId: string) => void) => unknown
  destroy: () => void
}

function badgeText(badge: SidebarItem['badge']): string {
  if (badge === null || badge === undefined || badge === 0)
    return ''
  return String(badge)
}

/**
 * The payload shape `createSidebar` takes.
 *
 * Named structurally rather than imported: craft-native's entry re-exports a
 * fixed list of type names and `CraftSidebarSection` is not one of them, so
 * there is nothing to import and `declare module` would declare a second
 * interface rather than merge. Assignment is structural either way, and a
 * named shape keeps a typo in the payload an error, which
 * `Record<string, unknown>` did not.
 */
interface NativeSidebarSection {
  id: string
  header?: string
  items: Array<{ id: string, label: string, icon?: string, badge?: string }>
}

function toNative(sections: SidebarSection[]): NativeSidebarSection[] {
  return sections.map(section => ({
    id: section.id,
    header: section.header,
    items: section.items.map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      badge: badgeText(item.badge) || undefined,
    })),
  }))
}

/** Everything but the badges: when this is unchanged, badges can be patched in place. */
function shape(sections: SidebarSection[]): string {
  return JSON.stringify(sections.map(s => [s.id, s.header ?? '', s.items.map(i => [i.id, i.label, i.icon ?? ''])]))
}

function badges(sections: SidebarSection[]): Map<string, string> {
  return new Map(sections.flatMap(s => s.items.map(i => [i.id, badgeText(i.badge)] as const)))
}

export const sidebar: SidebarAPI = {
  available() {
    // `_emitSidebarSelect` is how the runtime reports picks; a runtime
    // without it can draw a sidebar the page would never hear from.
    return hasBridge('nativeUI') && typeof window.craft?.nativeUI?._emitSidebarSelect === 'function'
  },

  create(options) {
    if (!sidebar.available())
      return null
    // Read once into a local so the narrowing holds: `available()` above
    // already proves the namespace is there, but TS cannot see through it.
    const nativeUI = window.craft?.nativeUI
    if (!nativeUI)
      return null
    const native = nativeUI.createSidebar({
      id: options.id,
      sections: toNative(options.sections),
      selected: options.selected,
    }) as NativeHandle

    let current = options.sections
    const listeners = new Set<(itemId: string) => void>()
    native.onSelect((itemId) => {
      for (const listener of [...listeners])
        listener(itemId)
    })

    return {
      id: native.id,
      update(sections) {
        if (shape(sections) === shape(current)) {
          const before = badges(current)
          for (const [itemId, badge] of badges(sections)) {
            if (before.get(itemId) !== badge)
              native.updateItem(itemId, { badge })
          }
        }
        else {
          native.setSections(toNative(sections))
        }
        current = sections
      },
      updateItem(itemId, changes) {
        native.updateItem(itemId, {
          ...(changes.label !== undefined ? { label: changes.label } : {}),
          ...(changes.icon !== undefined ? { icon: changes.icon } : {}),
          ...('badge' in changes ? { badge: badgeText(changes.badge) } : {}),
        })
        current = current.map(s => ({ ...s, items: s.items.map(i => (i.id === itemId ? { ...i, ...changes } : i)) }))
      },
      select(itemId) {
        native.setSelectedItem(itemId)
      },
      onSelect(callback) {
        listeners.add(callback)
        return () => listeners.delete(callback)
      },
      destroy() {
        listeners.clear()
        native.destroy()
      },
    }
  },
}
