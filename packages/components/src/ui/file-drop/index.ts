export { default as FileDrop } from './FileDrop.stx'

export interface FileDropProps {
  /** The picked file, owned by the page. */
  file?: File | Blob | null
  /** The input's accept list. Default: MP4, MOV and WebM video. */
  accept?: string
  disabled?: boolean
  /** '' when nothing is on its way; anything else shows the bar. */
  stage?: string
  /** What `stage` is, in the page's words. */
  stageLabel?: string
  /** 0 to 100 across the whole trip. */
  progress?: number
  /** Work going on that cannot say how far yet: the bar pulses and announces no value. */
  indeterminate?: boolean
  label?: string
  activeLabel?: string
  hint?: string
  chooseLabel?: string
  removeLabel?: string
  previewLabel?: string
  hidePreviewLabel?: string
  progressLabel?: string
  testId?: string
}
