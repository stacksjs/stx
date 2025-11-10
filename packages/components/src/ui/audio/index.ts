export { default as Audio } from './Audio.stx'

export interface AudioProps {
  src: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  className?: string
  showWaveform?: boolean
  title?: string
}
