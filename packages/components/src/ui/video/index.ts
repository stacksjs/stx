export { default as Video } from './Video.stx'

/** License endpoints for already encrypted media. */
export interface MediaDrm {
  widevine?: { url: string, headers?: Record<string, string> }
  playready?: { url: string, headers?: Record<string, string> }
  fairplay?: { url: string, certificateUrl: string, headers?: Record<string, string> }
}

export interface VideoProps {
  src: string
  poster?: string
  drm?: MediaDrm
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
