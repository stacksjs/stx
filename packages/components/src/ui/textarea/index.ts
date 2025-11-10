export { default as Textarea } from './Textarea.stx'

export interface TextareaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
  autoResize?: boolean
  maxRows?: number
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  maxLength?: number
  showCount?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  className?: string
}
