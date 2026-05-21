export { default as TabPanel } from './TabPanel.stx'
export { default as Tabs } from './Tabs.stx'

/**
 * Legacy prop API — pass `tabs` as an array of `{ label, content, icon? }`
 * where `content` is a HTML string. Kept for backward compatibility; prefer
 * the slot API below for any tab whose content needs to be a component tree.
 *
 * See stacksjs/stx#1703.
 */
export interface Tab {
  label: string
  content: string
  icon?: string
}

export interface TabsProps {
  /** Legacy: array of tab definitions with string content. */
  tabs?: Tab[]
  defaultTab?: number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'line' | 'pills' | 'enclosed'
  onChange?: (index: number, tab: Tab) => void
  className?: string
}

/**
 * Slot API — wrap each tab's content in a `<TabPanel label="…">`. The parent
 * `<Tabs>` discovers panels on mount via `[data-stx-tab-panel]` data
 * attributes, builds the tab list dynamically, and toggles each panel's
 * `hidden` attribute as the active tab changes.
 *
 * @example
 * ```html
 * <Tabs defaultTab="0" variant="pills">
 *   <TabPanel label="Drivers">
 *     <DriversTable :drivers="drivers()" />
 *   </TabPanel>
 *   <TabPanel label="Notifications" icon="bell">
 *     <NotificationsTable />
 *   </TabPanel>
 * </Tabs>
 * ```
 */
export interface TabPanelProps {
  label: string
  /** Optional icon HTML (rendered via `x-html`) for the tab button. */
  icon?: string
  className?: string
}
