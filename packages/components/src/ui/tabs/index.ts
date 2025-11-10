export { default as Tabs } from './Tabs.stx'

export interface Tab {
  label: string
  content: string
  icon?: string
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'line' | 'pills' | 'enclosed'
  onChange?: (index: number, tab: Tab) => void
  className?: string
}
