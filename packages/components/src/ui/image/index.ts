export { default as Image } from './Image.stx'

export interface ImageProps {
  src: string
  srcSet?: string
  srcset?: string
  sources?: Array<{ srcset: string, type?: string, media?: string, sizes?: string }>
  loading?: 'lazy' | 'eager'
  decorative?: boolean
  placeholderColor?: string
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  position?: string
  class?: string
  sizes?: string
  webpSrc?: string
  webpSrcSet?: string
  /** Required unless decorative is true. */
  alt?: string
  width?: number | string
  height?: number | string
  /** Native lazy loading. Ignored when `priority` is set. Defaults to true. */
  lazy?: boolean
  /** The one image above the fold: loads eagerly, at high priority. */
  priority?: boolean
  decoding?: 'async' | 'sync' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  /**
   * A CSS value painted *behind* the image while it arrives — a colour, a
   * gradient, or `url("data:image/...")` for a low-quality preview.
   */
  placeholder?: string
  /** Only when you want one: an unset ratio lets your own CSS decide. */
  aspectRatio?: number | string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  rounded?: boolean | 'full' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  zoomOnHover?: boolean
  className?: string
}
