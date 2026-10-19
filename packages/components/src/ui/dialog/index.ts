export { default as Dialog } from './Dialog.stx'
export { default as DialogBackdrop } from './DialogBackdrop.stx'
export { default as DialogDescription } from './DialogDescription.stx'
export { default as DialogPanel } from './DialogPanel.stx'
export { default as DialogTitle } from './DialogTitle.stx'

export interface DialogProps {
  open?: boolean
  onClose?: (value: boolean) => void
  className?: string
  as?: string
}

export interface DialogBackdropProps {
  className?: string
  as?: string
}

export interface DialogPanelProps {
  className?: string
  as?: string
  /** `sheet`: a bottom sheet on a phone with a grabber, a centred card from `sm` up. */
  variant?: 'center' | 'sheet'
}

export interface DialogTitleProps {
  className?: string
  as?: string
}

export interface DialogDescriptionProps {
  className?: string
  as?: string
}
