export { default as Transition } from './Transition.stx'

export interface TransitionProps {
  show?: boolean
  enter?: string
  enterFrom?: string
  enterTo?: string
  leave?: string
  leaveFrom?: string
  leaveTo?: string
  appear?: boolean
  appearFrom?: string
  appearTo?: string
  mode?: 'in-out' | 'out-in' | 'default'
  duration?: number
  delay?: number
  preset?: 'fade' | 'slide' | 'slideLeft' | 'slideRight' | 'scale' | 'rotate' | 'zoom' | ''
  onBeforeEnter?: () => void
  onEnter?: () => void
  onAfterEnter?: () => void
  onBeforeLeave?: () => void
  onLeave?: () => void
  onAfterLeave?: () => void
  className?: string
}
