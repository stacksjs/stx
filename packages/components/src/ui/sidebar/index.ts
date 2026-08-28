import type { SidebarItemData, SidebarSectionData } from './rows'
import type { SidebarSpaceChangeEvent, SidebarSpaceData } from './spaces'

export { default as Sidebar } from './Sidebar.stx'
export { default as SidebarFooter } from './SidebarFooter.stx'
export { default as SidebarHeader } from './SidebarHeader.stx'
export { default as SidebarItem } from './SidebarItem.stx'
export { default as SidebarPinned } from './SidebarPinned.stx'
export { default as SidebarSection } from './SidebarSection.stx'
export { default as SidebarSpace } from './SidebarSpace.stx'
export { default as SidebarSpaces } from './SidebarSpaces.stx'
export { default as SidebarSpaceSwitcher } from './SidebarSpaceSwitcher.stx'
export * from './rows'
export * from './spaces'
export * from './themes'

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
  /**
   * Arc-style spaces. Passing them replaces the single list with a swipeable
   * stack of scenes and defaults `theme` to `arc`. Mutually exclusive with
   * `sections` — a space carries its own.
   */
  spaces?: SidebarSpaceData[]
  /** Id of the space to open on. Defaults to the first. */
  space?: string
  /** Show the space switcher rail along the bottom. Defaults to true. */
  showSpaceSwitcher?: boolean
  /** Show a trailing "+" in the rail, emitting `spaceAdd`. */
  showSpaceAdd?: boolean
  spaceAddLabel?: string
  /** localStorage key that remembers the last space. */
  spacePersistKey?: string
  onSpaceChange?: (event: SidebarSpaceChangeEvent) => void
  onSpaceAdd?: () => void
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
  /**
   * Mirror the OS light/dark preference onto the root element's `dark` class.
   * Defaults to true.
   *
   * A native sidebar follows the system appearance and Crosswind's `dark:`
   * variants are class-based, so something has to write that class — but the
   * document's color scheme is the app's business, not a navigation pane's.
   * Set this to `false` in any app that owns its own light/dark control, or the
   * sidebar will quietly overwrite the choice when it mounts. (A `data-theme`
   * attribute on the root also stops it, re-checked on every change.)
   */
  followSystemAppearance?: boolean
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
  /**
   * Who draws the window controls.
   *
   * - `auto` — the default. Replicas in a browser, the platform's own inside a
   *   Craft window, decided by the host rather than by the author.
   * - `draw` — replicas, always. For a web page imitating macOS that has to
   *   look the same everywhere.
   * - `native` — the platform already drew them. Reserve the room and render
   *   nothing into it.
   * - `none` — no controls and no room.
   *
   * Inside a real window the platform draws its own controls whatever this
   * component does, so replicas there put SIX circles in the corner: three live
   * buttons from the window server and three that only look like them. `auto`
   * exists because the same markup renders on a docs page, where mock lights
   * are the point, and in an app, where they are a bug — it reads the host's
   * `--craft-window-controls-replicas` and `--craft-window-controls-width`,
   * which Craft publishes before the document is parsed.
   *
   * The reserved width comes from the host in every mode, `native` included:
   * a browser has no window buttons and a titlebar window keeps them above the
   * page, so an unpublished width means nothing to reserve.
   * `--stx-native-controls-width` covers a host that draws its own controls and
   * publishes nothing; it is the room after this header's own left padding.
   */
  windowControls?: 'auto' | 'draw' | 'native' | 'none'
  /** @deprecated Use `windowControls`. `true` means `auto`, `false` means `none`. */
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
