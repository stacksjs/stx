export { default as ThemeToggle } from './ThemeToggle.stx'

export interface ThemeToggleProps {
  /** `group` shows light / dark / system; `button` cycles through them. */
  variant?: 'group' | 'button'
  lightLabel?: string
  darkLabel?: string
  systemLabel?: string
  /** Defaults to true for `group`, false for `button`. */
  showLabels?: boolean
  className?: string
  onChange?: (state: { preference: 'light' | 'dark' | 'auto', mode: 'light' | 'dark' }) => void
}
