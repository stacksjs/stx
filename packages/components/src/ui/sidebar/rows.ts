/**
 * The shapes a sidebar's rows are described with.
 *
 * These live apart from `index.ts` because both the barrel and `spaces.ts`
 * need them: a space carries sections exactly like a plain sidebar does. With
 * the definitions in the barrel, the leaf had to import from it and the two
 * modules formed a cycle — legal for types, but it drags the whole public
 * surface into any program that touches one small module.
 *
 * `index.ts` re-exports everything here, so this split is invisible to callers.
 *
 * @module
 */

/**
 * One navigation row.
 *
 * ```ts
 * { id: 'icloud', label: 'iCloud', icon: 'i-f7-tray', iconColor: 'blue', count: 248, active: true }
 * ```
 */
export interface SidebarItemData {
  id: string
  label: string
  /** Iconify utility class, e.g. `i-f7-tray`. F7 icons mirror SF Symbols. */
  icon?: string
  /** macOS system color name (`"blue"`, `"red"`, `"yellow"`, …) or any CSS color. */
  iconColor?: string
  /** Image URL rendered instead of an icon (album art, avatars). */
  image?: string
  href?: string
  /** Right-aligned count — rendered as plain gray text like native macOS. */
  count?: string | number
  /** @deprecated Use `count`. */
  badge?: string | number
  active?: boolean
  disabled?: boolean
  /** Nested rows, indented and collapsible under this one. */
  children?: SidebarItemData[]
  /** Show a disclosure chevron even without children. */
  expandable?: boolean
  /** Initial disclosure state when the item has children. Defaults to true. */
  expanded?: boolean
}

/** A titled group of rows (e.g. "Favorites"). Untitled when `label` is empty. */
export interface SidebarSectionData {
  id: string
  label?: string
  items: SidebarItemData[]
  /** Section headers collapse their group on click. Defaults to true. */
  collapsible?: boolean
  /** Initial collapse state. Defaults to false (expanded). */
  collapsed?: boolean
}
