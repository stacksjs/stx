export { default as Tooltip } from './Tooltip.stx'

export interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  show?: boolean
  disabled?: boolean
  className?: string
}
