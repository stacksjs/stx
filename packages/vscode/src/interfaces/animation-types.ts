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
