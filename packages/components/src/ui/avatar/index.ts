export { default as Avatar } from './Avatar.stx'

export interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'away' | 'busy' | ''
  onError?: (event: Event) => void
  className?: string
}
