export { default as Navigator } from './Navigator.stx'

export interface NavigatorItem {
  id?: string
  label: string
  href?: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}

export interface NavigatorProps {
  items: NavigatorItem[]
  active?: string // ID or href of active item
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline' | 'sidebar'
  size?: 'sm' | 'md' | 'lg'
  onNavigate?: (item: NavigatorItem) => void
  className?: string
}
