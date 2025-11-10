export { default as Transition } from './Transition.stx'

export interface TransitionProps {
  show?: boolean
  enter?: string
  enterFrom?: string
  enterTo?: string
  leave?: string
  leaveFrom?: string
  leaveTo?: string
  className?: string
  as?: string
}
