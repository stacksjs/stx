export { default as Radio } from './Radio.stx'

export interface RadioProps {
  checked?: boolean
  onChange?: (value: string, checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
  error?: boolean
  required?: boolean
  value?: string
  name?: string
  className?: string
}
