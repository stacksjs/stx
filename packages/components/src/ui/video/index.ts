export { default as Video } from './Video.stx'

export interface VideoProps {
  src: string
  poster?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  width?: number | string
  height?: number | string
  aspectRatio?: '16/9' | '4/3' | '1/1' | string
  className?: string
  title?: string
}
