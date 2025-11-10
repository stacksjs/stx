export { default as Card } from './Card.stx'

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'default' | 'lg'
  hover?: boolean
  clickable?: boolean
  image?: string
  imageAlt?: string
  imagePosition?: 'top' | 'bottom'
  onClick?: (event: Event) => void
  className?: string
}
