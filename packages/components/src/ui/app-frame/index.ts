export { default as AddressField } from './AddressField.stx'
export { default as CommandBar } from './CommandBar.stx'
export { default as ContentCard } from './ContentCard.stx'
export { default as FloatingPanel } from './FloatingPanel.stx'
export { default as SidebarDivider } from './SidebarDivider.stx'
export { default as SidebarRow } from './SidebarRow.stx'
export { default as SpaceSwitcher } from './SpaceSwitcher.stx'
export { default as TileGrid } from './TileGrid.stx'

/** What one sidebar row shows: `<SidebarRow :item="..." />`. */
export interface SidebarRowItem {
  label: string
  /** A picture for the leading box (a favicon); wins over `symbol` and `emoji`. */
  image?: string
  /** A system symbol name (`folder.fill`, `plus`). */
  symbol?: string
  emoji?: string
  /** The open row, drawn as a white card. */
  active?: boolean
  /** A heading row (a folder): the label in semibold. */
  strong?: boolean
  /** A quiet row (New Tab): the label at half strength. */
  muted?: boolean
  /** Nesting level; each one indents 16pt. */
  depth?: number
  /** Offers a close button (on hover with a pointer, always on touch). */
  closable?: boolean
  closeSymbol?: string
  /** Edits the label in place; the row emits `rename` with the new text. */
  editing?: boolean
  /** A ring for a drop about to land here. */
  highlighted?: boolean
  dragData?: string
  dragUrl?: string
  /** A folder takes drops inside it. */
  dropInside?: boolean
  testId?: string
}

/** Shared by every row: `<SidebarRow :theme="..." />`. */
export interface SidebarRowTheme {
  tint?: string
  activeBackground?: string
  hoverBackground?: string
  /** No hovering pointer: 44pt rows with their buttons always shown. */
  touch?: boolean
}

/** One tile of a `<TileGrid :items="..." />`. */
export interface TileGridItem {
  id: string
  label?: string
  image?: string
  symbol?: string
  emoji?: string
  active?: boolean
  dragData?: string
  dragUrl?: string
  testId?: string
}

/** One icon of a `<SpaceSwitcher :items="..." />`. */
export interface SpaceSwitcherItem {
  id: string
  label?: string
  symbol?: string
  emoji?: string
  testId?: string
}

/** One result of a `<CommandBar :results="..." />`. */
export interface CommandBarResult {
  key: string
  title: string
  /** Right-aligned, quieter: "Switch to Tab", a shortcut, a kind. */
  detail?: string
  image?: string
  symbol?: string
}

/** Where a `<FloatingPanel>` sits, in points from the window's edges. */
export interface FloatingPanelPlace {
  left?: number
  right?: number
  top?: number
  bottom?: number
}
