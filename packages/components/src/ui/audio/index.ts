import type { MediaDrm } from '../video'

export { default as Audio } from './Audio.stx'

export interface AudioProps {
  src: string
  sources?: Array<{ src: string, type?: string }>
  drm?: MediaDrm
  tracks?: Array<{ src: string, kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata', srclang?: string, label?: string, default?: boolean }>
  artist?: string
  artwork?: string
  waveform?: string
  crossorigin?: 'anonymous' | 'use-credentials'
  class?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  className?: string
  showWaveform?: boolean
  title?: string
}
