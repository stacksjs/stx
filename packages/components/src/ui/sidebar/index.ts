export { default as Sidebar } from './Sidebar.stx'
export { default as SidebarFooter } from './SidebarFooter.stx'
export { default as SidebarHeader } from './SidebarHeader.stx'
export { default as SidebarItem } from './SidebarItem.stx'
export { default as SidebarSection } from './SidebarSection.stx'
export * from './themes'

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

/**
 * Sidebar themes. `macos` recreates the sidebar of the latest macOS
 * (Tahoe, macOS 26/27) — translucent material, Liquid Glass edge shimmer,
 * 30px rows with 9px-radius highlights and plain gray counts. `tahoe`,
 * `macos-tahoe` and `macos-latest` are aliases of `macos`. The remaining
 * names are legacy looks kept for backwards compatibility.
 */
type MacOSSidebarTheme = 'macos' | 'macos-tahoe' | 'macos-latest' | 'tahoe'
type LegacySidebarTheme = 'vibrancy' | 'solid' | 'transparent' | 'workspace' | 'desktop'
export type SidebarThemeChoice = MacOSSidebarTheme | LegacySidebarTheme

export interface SidebarProps {
  /** Sections with their items. Omit to compose children via the default slot. */
  sections?: SidebarSectionData[]
  /** Visual theme. Defaults to `macos`. */
  theme?: SidebarThemeChoice
  /** @deprecated Use `theme`. */
  variant?: SidebarThemeChoice
  /** Expanded width in pixels. Defaults to 250 (native macOS default). */
  width?: number
  position?: 'left' | 'right'
  /** Layout placement for app shells. Defaults to `fixed`. */
  placement?: 'fixed' | 'sticky' | 'static'
  bordered?: boolean
  /** Whether the sidebar starts collapsed. */
  collapsed?: boolean
  collapsible?: boolean
  /** `hidden` slides away entirely (macOS); `rail` keeps a compact strip. */
  collapseMode?: 'hidden' | 'rail'
  /** Rail width when `collapseMode` is `rail`. */
  minWidth?: number
  /** localStorage key that persists collapse state. */
  persistKey?: string
  /** App-shell selector whose width CSS variable tracks the sidebar. */
  shellSelector?: string
  widthVar?: string
  collapsedClass?: string
  className?: string
  onCollapse?: (collapsed: boolean) => void
  onSectionToggle?: (sectionId: string) => void
  onItemToggle?: (event: { id: string, expanded: boolean }) => void
  onItemClick?: (item: SidebarItemData, event: Event) => void
}

export interface SidebarSectionProps {
  id: string
  label?: string
  items: SidebarItemData[]
  collapsible?: boolean
  collapsed?: boolean
  theme?: SidebarThemeChoice
}

export interface SidebarItemProps extends SidebarItemData {
  /** Nesting depth — set by SidebarSection when flattening the tree. */
  depth?: number
  /** Slash-joined ancestor ids — set by SidebarSection. */
  parents?: string
  theme?: SidebarThemeChoice
}

/** A floating toolbar or footer action button. */
export interface SidebarActionData {
  id: string
  /** Iconify utility class. */
  icon: string
  /** Accessible label. */
  label: string
}

export interface SidebarHeaderProps {
  theme?: SidebarThemeChoice
  /** Render traffic lights (wired to Craft's window API when present). */
  showWindowControls?: boolean
  /** Floating Liquid Glass toolbar buttons on the right. */
  actions?: SidebarActionData[]
  showSearch?: boolean
  searchPlaceholder?: string
  /** Legacy (non-macos) header content. */
  title?: string
  subtitle?: string
  logo?: string
  onAction?: (actionId: string) => void
  onSearch?: (value: string) => void
  onWindowControl?: (action: 'close' | 'minimize' | 'zoom') => void
}

export interface SidebarFooterProps {
  theme?: SidebarThemeChoice
  /** Account row, like Music's profile footer. */
  avatar?: string
  name?: string
  detail?: string
  actions?: SidebarActionData[]
  onProfileClick?: () => void
  onAction?: (actionId: string) => void
}
