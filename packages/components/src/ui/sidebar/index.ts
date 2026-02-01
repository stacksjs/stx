export { default as Sidebar } from './Sidebar.stx'
export { default as SidebarSection } from './SidebarSection.stx'
export { default as SidebarItem } from './SidebarItem.stx'
export { default as SidebarHeader } from './SidebarHeader.stx'
export { default as SidebarFooter } from './SidebarFooter.stx'

// Types
export interface SidebarItem {
  id: string
  label: string
  icon?: string
  href?: string
  badge?: string | number
  active?: boolean
  disabled?: boolean
}

export interface SidebarSection {
  id: string
  label: string
  icon?: string
  items: SidebarItem[]
  expanded?: boolean
  collapsible?: boolean
}

export interface SidebarProps {
  /** Array of sidebar sections with their items */
  sections?: SidebarSection[]
  /** Whether the sidebar is collapsed */
  collapsed?: boolean
  /** Whether the sidebar can be collapsed */
  collapsible?: boolean
  /** Width of the expanded sidebar in pixels */
  width?: number
  /** Minimum width when collapsed in pixels */
  minWidth?: number
  /** Visual style variant */
  variant?: 'tahoe' | 'vibrancy' | 'solid' | 'transparent'
  /** Position of the sidebar */
  position?: 'left' | 'right'
  /** Whether to show border */
  bordered?: boolean
  /** Additional CSS classes */
  className?: string
  /** Callback when collapse state changes */
  onCollapse?: (collapsed: boolean) => void
  /** Callback when a section is toggled */
  onSectionToggle?: (sectionId: string) => void
  /** Callback when an item is clicked */
  onItemClick?: (item: SidebarItem, event: Event) => void
}

export interface SidebarSectionProps {
  id: string
  label: string
  icon?: string
  items: SidebarItem[]
  expanded?: boolean
  collapsible?: boolean
  showLabel?: boolean
  onToggle?: (id: string) => void
  onItemClick?: (item: SidebarItem, event: Event) => void
}

export interface SidebarItemProps {
  id: string
  label: string
  icon?: string
  href?: string
  badge?: string | number
  active?: boolean
  disabled?: boolean
  indent?: boolean
  onClick?: (event: Event) => void
}

export interface SidebarHeaderProps {
  title?: string
  subtitle?: string
  logo?: string
  logoIcon?: string
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  collapsed?: boolean
  onSearch?: (value: string) => void
}

export interface SidebarFooterProps {
  showSettings?: boolean
  showThemeToggle?: boolean
  settingsHref?: string
  settingsLabel?: string
  collapsed?: boolean
  actions?: Array<{
    label: string
    icon?: string
    href?: string
    onClick?: () => void
  }>
  onThemeToggle?: () => void
}

/**
 * Native Sidebar Configuration
 *
 * Used to configure the native macOS sidebar when running with Craft's --native-sidebar flag.
 * The sidebar uses NSOutlineView with vibrancy for a true Tahoe-style appearance.
 */
export interface NativeSidebarConfig {
  /** Header configuration */
  header?: {
    title?: string
    subtitle?: string
    icon?: string // SF Symbol name (e.g., 'house.fill', 'message.fill')
  }
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Array of sidebar sections */
  sections: NativeSidebarSection[]
  /** Minimum width when collapsed */
  minWidth?: number
  /** Maximum width */
  maxWidth?: number
  /** Whether the sidebar can be collapsed */
  canCollapse?: boolean
}

export interface NativeSidebarSection {
  /** Unique section ID */
  id: string
  /** Section title (shown as header) */
  title: string
  /** Whether section is collapsible */
  collapsible?: boolean
  /** Whether section starts collapsed */
  collapsed?: boolean
  /** Items in this section */
  items: NativeSidebarItem[]
}

export interface NativeSidebarItem {
  /** Unique item ID */
  id: string
  /** Display label */
  label: string
  /** SF Symbol icon name (e.g., 'tray.fill', 'envelope.badge.fill') */
  icon?: string
  /** Badge count or text */
  badge?: string | number
  /** Tint color for the icon (hex) */
  tintColor?: string
  /** Whether this item is selected */
  selected?: boolean
  /** Whether this item is disabled */
  disabled?: boolean
  /** Nested children items */
  children?: NativeSidebarItem[]
  /** Custom data to pass to selection handler */
  data?: Record<string, unknown>
}

/**
 * Craft sidebar selection event
 * Passed to window.craft._sidebarSelectHandler when user clicks a sidebar item
 */
export interface SidebarSelectEvent {
  /** ID of the selected item */
  itemId: string
  /** The full item object */
  item: NativeSidebarItem
  /** Parent section ID */
  sectionId?: string
}
