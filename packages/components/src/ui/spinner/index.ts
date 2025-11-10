export { default as Spinner } from './Spinner.stx'

export interface SpinnerProps {
  variant?: 'circle' | 'dots' | 'bars' | 'ring'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'white' | 'gray'
  label?: string
  className?: string
}
