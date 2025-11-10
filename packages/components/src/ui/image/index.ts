export { default as Image } from './Image.stx'

export interface ImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  lazy?: boolean
  placeholder?: string
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
  aspectRatio?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  rounded?: boolean | 'full' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}
