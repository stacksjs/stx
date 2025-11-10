export { default as Notification } from './Notification.stx'

export interface NotificationProps {
  show?: boolean
  title?: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'
  duration?: number
  onClose?: () => void
  className?: string
}
