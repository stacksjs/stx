export { default as Switch } from './Switch.stx'

export interface SwitchProps {
  checked?: boolean
  disabled?: boolean
  /** `'mini'` is the Mac look's small switch (26x15); elsewhere it reads as `'md'`. */
  size?: 'sm' | 'md' | 'lg' | 'mini'
  /** `'mac'` draws the System Settings capsule switch from the `--stx-mac-*` tokens. */
  variant?: 'mac'
  className?: string
  onChange?: (checked: boolean) => void
  label?: string
}
