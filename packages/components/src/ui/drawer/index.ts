export { default as Drawer } from './Drawer.stx'

export interface DrawerProps {
  open?: boolean
  onClose?: () => void
  position?: 'right' | 'left' | 'top' | 'bottom'
  title?: string
  className?: string
}
