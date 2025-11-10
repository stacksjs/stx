export { default as Progress } from './Progress.stx'

export interface ProgressProps {
  value?: number
  max?: number
  variant?: 'linear' | 'circular'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  showLabel?: boolean
  indeterminate?: boolean
  className?: string
}
