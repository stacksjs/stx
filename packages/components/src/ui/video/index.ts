export { default as Video } from './Video.stx'

export interface VideoProps {
  src: string
  poster?: string
  /** The player's accessible name. Follows a binding. */
  label?: string
  sources?: Array<{ src: string, type?: string }>
  tracks?: Array<{ src: string, kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata', srclang?: string, label?: string, default?: boolean }>
  playsinline?: boolean
  crossorigin?: 'anonymous' | 'use-credentials'
  controlslist?: string
  disablePictureInPicture?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  width?: number | string
  height?: number | string
  aspectRatio?: '16/9' | '4/3' | '1/1' | string | number
  className?: string
  title?: string
}
