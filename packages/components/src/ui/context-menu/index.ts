import type { MenuItem } from './core'

export { default as ContextMenu } from './ContextMenu.stx'
export * from './core'
export * from './view'

export interface ContextMenuProps {
  /** The items, or a function that builds them for the element the menu was opened on. */
  items?: MenuItem[] | ((target: Element | null) => MenuItem[] | null | undefined)
  /** The accessible name of the menu. Default `Context menu`. */
  label?: string
  /** A right click gets the browser's own menu. */
  disabled?: boolean
  id?: string
  className?: string
}
