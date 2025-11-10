export { default as Breadcrumb } from './Breadcrumb.stx'

export interface BreadcrumbItem {
  label: string
  href: string
  icon?: string
  collapsed?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: '/' | '>' | 'arrow' | string
  maxItems?: number
  className?: string
}
