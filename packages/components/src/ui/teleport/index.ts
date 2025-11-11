export { default as Teleport } from './Teleport.stx'

export interface TeleportProps {
  to?: string | HTMLElement
  disabled?: boolean
  defer?: boolean
}
