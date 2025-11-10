export { default as Popover } from './Popover.stx'
export { default as PopoverButton } from './PopoverButton.stx'
export { default as PopoverPanel } from './PopoverPanel.stx'

export interface PopoverProps {
  className?: string
  as?: string
}

export interface PopoverButtonProps {
  className?: string
  as?: string
  disabled?: boolean
  onClick?: (e: Event) => void
}

export interface PopoverPanelProps {
  className?: string
  as?: string
  static?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}
