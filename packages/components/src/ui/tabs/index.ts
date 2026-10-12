export { default as Tab } from './Tab.stx'
export { default as TabList } from './TabList.stx'
export { default as TabPanel } from './TabPanel.stx'
export { default as Tabs } from './Tabs.stx'

/**
 * Legacy prop API — pass `tabs` as an array of `{ label, content, icon? }`
 * where `content` is a HTML string. Kept for backward compatibility; prefer
 * the slot API below for any tab whose content needs to be a component tree.
 *
 * See stacksjs/stx#1703.
 */
/** One tab of the legacy prop API. Named apart from the `<Tab>` component. */
export interface TabDefinition {
  label: string
  content: string
  icon?: string
}

export interface TabsProps {
  /** Legacy: array of tab definitions with string content. */
  tabs?: TabDefinition[]
  defaultTab?: number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'line' | 'pills' | 'enclosed'
  onChange?: (index: number, tab: TabDefinition) => void
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

/**
 * A tab strip whose selection and panels belong to the page: `<TabList>` with
 * `<Tab>` children (or any `role="tab"` element with `data-value`). The list
 * keeps one tab stop, the arrow keys, Home and End, and `aria-selected`; the
 * page keeps its panels, behind its own `:if`. See stacksjs/stx#2058.
 *
 * @example
 * ```html
 * <TabList v-model:value="tab" label="Store sections">
 *   <Tab value="products" controls="products-panel">Products</Tab>
 *   <Tab value="sales" controls="sales-panel">Sales</Tab>
 * </TabList>
 * ```
 */
export interface TabListProps {
  value?: string
  label?: string
  labelledby?: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'line' | 'pills' | 'none'
  className?: string
}

export interface TabProps {
  value: string
  controls?: string
  disabled?: boolean
  variant?: 'line' | 'pills' | 'none'
  className?: string
}
