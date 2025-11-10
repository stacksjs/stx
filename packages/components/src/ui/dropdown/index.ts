export { default as Dropdown } from './Dropdown.stx'
export { default as DropdownButton } from './DropdownButton.stx'
export { default as DropdownItems } from './DropdownItems.stx'
export { default as DropdownItem } from './DropdownItem.stx'

export interface DropdownProps {
  className?: string
  as?: string
}

export interface DropdownButtonProps {
  className?: string
  as?: string
  disabled?: boolean
  onClick?: (e: Event) => void
}

export interface DropdownItemsProps {
  className?: string
  as?: string
  static?: boolean
}

export interface DropdownItemProps {
  className?: string
  as?: string
  disabled?: boolean
  onClick?: (e: Event) => void
}
