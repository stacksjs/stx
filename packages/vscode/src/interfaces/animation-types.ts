/**
 * Types for STX Animation System
 */

/**
 * Available transition types that can be used with @transition directive
 */
export enum TransitionType {
  /**
   * Smooth opacity transitions
   */
  Fade = 'fade',

  /**
   * Elegant sliding movements
   */
  Slide = 'slide',

  /**
   * Size scaling effects
   */
  Scale = 'scale',

  /**
   * 3D flipping animations
   */
  Flip = 'flip',

  /**
   * Rotation-based animations
   */
  Rotate = 'rotate',

  /**
   * Custom animation (requires additional CSS)
   */
  Custom = 'custom',
}

/**
 * Available transition directions that can be used with @transition directive
 */
export enum TransitionDirection {
  /**
   * Element transitions in (appears)
   */
  In = 'in',

  /**
   * Element transitions out (disappears)
   */
  Out = 'out',

  /**
   * Element transitions both in and out
   */
  Both = 'both',
}

/**
 * Available transition easing functions
 */
export enum TransitionEase {
  /**
   * Linear timing function (constant speed)
   */
  Linear = 'linear',

  /**
   * Default easing function (slight acceleration and deceleration)
   */
  Ease = 'ease',

  /**
   * Starts slowly, then speeds up
   */
  EaseIn = 'ease-in',

  /**
   * Starts quickly, then slows down
   */
  EaseOut = 'ease-out',

  /**
   * Starts slowly, speeds up in the middle, then slows down at the end
   */
  EaseInOut = 'ease-in-out',
}

/**
 * Animation types and configurations for STX
 */

export type AnimationType = 'fade' | 'slide' | 'scale' | 'flip' | 'rotate' | 'custom'

export type AnimationTiming = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'

export type AnimationDirection = 'in' | 'out' | 'both'

export interface AnimationConfig {
  /** The type of animation to apply */
  type: AnimationType
  /** Duration of the animation in milliseconds */
  duration?: number
  /** Timing function for the animation */
  timing?: AnimationTiming
  /** Delay before animation starts in milliseconds */
  delay?: number
  /** Direction of the animation */
  direction?: AnimationDirection
}

export interface TransitionCallbacks {
  /** Whether to remove the element from DOM after animation */
  removeOnComplete?: boolean
  /** Callback when animation starts */
  onStart?: () => void
  /** Callback when animation ends */
  onComplete?: () => void
}

export interface MotionConfig {
  /** Whether animations should be enabled */
  enabled: boolean
  /** Default duration for animations in milliseconds */
  defaultDuration?: number
  /** Default timing function */
  defaultTiming?: AnimationTiming
  /** Whether to respect user's reduced motion preference */
  respectReducedMotion?: boolean
}

export interface AnimationGroupConfig {
  /** Name of the animation group */
  name: string
  /** Selectors for elements in the group */
  selectors: string[]
  /** Delay between each element's animation */
  stagger?: number
  /** Base animation configuration */
  animation: AnimationConfig
}

/**
 * Configuration options for transitions
 */
export interface TransitionOptions {
  /**
   * Duration of the transition in milliseconds
   * @default 300
   */
  duration?: number

  /**
   * Delay before the transition starts in milliseconds
   * @default 0
   */
  delay?: number

  /**
   * Easing function to use for the transition
   * @default TransitionEase.Ease
   */
  ease?: TransitionEase | string

  /**
   * Direction of the transition
   * @default TransitionDirection.Both
   */
  direction?: TransitionDirection | string
}

/**
 * Default transition options
 */
export const DEFAULT_TRANSITION_OPTIONS: TransitionOptions = {
  duration: 300,
  delay: 0,
  ease: TransitionEase.Ease,
  direction: TransitionDirection.Both,
}
