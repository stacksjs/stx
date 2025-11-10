export { default as Switch } from './Switch.stx'

export interface SwitchProps {
  checked?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onChange?: (checked: boolean) => void
  label?: string
}
