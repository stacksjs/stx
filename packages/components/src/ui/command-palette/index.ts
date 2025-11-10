export { default as CommandPalette } from './CommandPalette.stx'
export { default as CommandPaletteItem } from './CommandPaletteItem.stx'

export interface CommandPaletteProps {
  open?: boolean
  onClose?: () => void
  query?: string
  onQueryChange?: (query: string) => void
  className?: string
}

export interface CommandPaletteItemProps {
  className?: string
  onClick?: () => void
}
