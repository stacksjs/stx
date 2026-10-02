export { default as EmptyState } from './EmptyState.stx'

export interface EmptyStateProps {
  title?: string
  description?: string
  /** Raw SVG markup. For a component icon, compose with `variant="bare"`. */
  icon?: string
  /** `panel` draws the bordered card, `bare` suits something already in one. */
  variant?: 'panel' | 'bare'
  align?: 'center' | 'left'
  as?: string
  className?: string
}
