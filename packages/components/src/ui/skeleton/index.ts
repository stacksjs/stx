export { default as Skeleton } from './Skeleton.stx'

export interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'thumbnail' | 'button' | 'card' | 'rect'
  count?: number
  width?: string | number
  height?: string | number
  circle?: boolean
  animate?: boolean
  className?: string
}
