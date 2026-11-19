export { default as Tooltip } from './Tooltip.stx'

export interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  /** Toggle a dedicated help trigger on activation instead of hover/focus. */
  pressToToggle?: boolean
  show?: boolean
  disabled?: boolean
  className?: string
}
