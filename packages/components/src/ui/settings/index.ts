export * from './core'
export { default as SettingsGroup } from './SettingsGroup.stx'
export { default as SettingsPane } from './SettingsPane.stx'
export { default as SettingsPaneHeader } from './SettingsPaneHeader.stx'
export { default as SettingsRow } from './SettingsRow.stx'
export { default as SettingsSidebarGroup } from './SettingsSidebarGroup.stx'
export { default as SettingsSidebarItem } from './SettingsSidebarItem.stx'
export { default as SettingsWindow } from './SettingsWindow.stx'
export * from './view'

/** The colour of an icon tile, in the sidebar or leading a row. */
export type SettingsTone = 'grey' | 'blue' | 'red' | 'orange' | 'yellow' | 'green' | 'indigo' | 'purple' | 'pink' | 'ink'

export interface SettingsWindowProps {
  /** The window's accessible name. Default `Settings`. */
  title?: string
  /** The pane to open on. Two-way with `v-model:pane`. Default: the stored one, then the first. */
  pane?: string
  /** Show the search field. Default on. */
  searchable?: boolean
  /** Default `Search`. */
  searchPlaceholder?: string
  /** Remembers the last pane in local storage under `stx:settings:<key>`. */
  storageKey?: string
  /** `window` fills a titlebar-less window and clears its buttons; `sheet` is a rounded panel inside another window. Default `window`. */
  presentation?: 'window' | 'sheet'
  /** Pixels. Default 226. */
  sidebarWidth?: number
  /** A CSS length. Default the viewport for a window, `min(640px, 90vh)` for a sheet. */
  height?: string
  id?: string
  className?: string
}

export interface SettingsSidebarGroupProps {
  /** A caption over the group. System Settings has none; leave it out to match. */
  label?: string
  className?: string
}

export interface SettingsSidebarItemProps {
  /** The id of the pane this row opens. */
  id: string
  label: string
  /** An Iconify class, drawn white in the tile: `i-f7-gear-alt-fill`. */
  icon?: string
  /** Default `grey`. */
  tone?: SettingsTone
  /** A count at the trailing edge. */
  badge?: string | number
  /** More words the search finds this row by. */
  keywords?: string
  className?: string
}

export interface SettingsPaneProps {
  /** What a sidebar item, a navigation row or `showPane()` names it by. */
  id: string
  /** Shown in the toolbar. */
  title: string
  /** More words the search finds this pane by. */
  keywords?: string
  /** The pane this one is reached from. A pane with a parent is not in the sidebar and has a way back. */
  parent?: string
  /** Render this pane visible before any script runs. Give it to the pane the window opens on. */
  active?: boolean
  className?: string
}

export interface SettingsGroupProps {
  /** A heading above the card. */
  header?: string
  /** A footnote under it. The `footer` slot takes markup, for a note with a link. */
  footer?: string
  id?: string
  className?: string
}

export interface SettingsRowProps {
  label: string
  /** A second line under the label. */
  description?: string
  /** An Iconify class for a leading tile. */
  icon?: string
  tone?: SettingsTone
  /** Names the setting, for `revealSetting(id)` and for its label's id. */
  setting?: string
  /** More words the search finds this row by. */
  keywords?: string
  /** A pane id. Makes this a navigation row: a chevron, and a press opens that pane. */
  to?: string
  /** Text at the trailing edge of a navigation row: the current value. */
  value?: string
  /** Let the label and description wrap, with the control aligned to the top. */
  multiline?: boolean
  /** Draw the label in the danger colour. */
  destructive?: boolean
  disabled?: boolean
  /** `stacked` puts the control under the label at full width. Default `inline`. */
  layout?: 'inline' | 'stacked'
  id?: string
  className?: string
}

export interface SettingsPaneHeaderProps {
  icon?: string
  tone?: SettingsTone
  title: string
  description?: string
  className?: string
}
