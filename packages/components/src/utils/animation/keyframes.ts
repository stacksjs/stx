/**
 * Keyframe animation utilities using Web Animations API
 *
 * @example
 * ```ts
 * import { animate, KeyframeAnimations } from '@stacksjs/components'
 *
 * // Use predefined animation
 * animate(element, 'fadeIn', { duration: 500 })
 *
 * // Custom keyframes
 * createKeyframeAnimation(element, [
 *   { offset: 0, opacity: 0, transform: 'scale(0.5)' },
 *   { offset: 1, opacity: 1, transform: 'scale(1)' }
 * ], { duration: 300 })
 * ```
 */

/**
 * Single keyframe definition
 */
export interface Keyframe {
  /** Keyframe position (0 to 1) */
  offset: number
  /** CSS properties to animate */
  [property: string]: any
}

/**
 * Animation configuration options
 */
export interface AnimationOptions {
  /** Animation duration in milliseconds */
  duration?: number
  /** Easing function (CSS easing string) */
  easing?: string
  /** Delay before animation starts in milliseconds */
  delay?: number
  /** Number of iterations (Infinity for infinite) */
  iterations?: number
  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  /** Fill mode */
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * Create a keyframe animation using Web Animations API
 *
 * @param element - Target HTML element
 * @param keyframes - Array of keyframe definitions
 * @param options - Animation options
 * @returns Animation instance or null if not supported
 */
export function createKeyframeAnimation(
  element: HTMLElement,
  keyframes: readonly Keyframe[] | Keyframe[],
  options: AnimationOptions = {},
): Animation | null {
  if (typeof element.animate !== 'function') {
    console.warn('Web Animations API not supported')
    return null
  }

  const {
    duration = 1000,
    easing = 'ease',
    delay = 0,
    iterations = 1,
    direction = 'normal',
    fill = 'both',
  } = options

  return element.animate([...keyframes], {
    duration,
    easing,
    delay,
    iterations,
    direction,
    fill,
  })
}

/**
 * Predefined keyframe animation presets
 *
 * Available animations:
 * - fadeIn/fadeOut
 * - slideInUp/Down/Left/Right, slideOutUp/Down/Left/Right
 * - zoomIn/Out
 * - rotate, bounce, pulse, shake, swing
 * - flip, rubberBand, heartbeat
 */
export const KeyframeAnimations = {
  fadeIn: [
    { offset: 0, opacity: 0 },
    { offset: 1, opacity: 1 },
  ],
  fadeOut: [
    { offset: 0, opacity: 1 },
    { offset: 1, opacity: 0 },
  ],
  slideInUp: [
    { offset: 0, transform: 'translateY(100%)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
  slideInDown: [
    { offset: 0, transform: 'translateY(-100%)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
  slideInLeft: [
    { offset: 0, transform: 'translateX(-100%)', opacity: 0 },
    { offset: 1, transform: 'translateX(0)', opacity: 1 },
  ],
  slideInRight: [
    { offset: 0, transform: 'translateX(100%)', opacity: 0 },
    { offset: 1, transform: 'translateX(0)', opacity: 1 },
  ],
  slideOutUp: [
    { offset: 0, transform: 'translateY(0)', opacity: 1 },
    { offset: 1, transform: 'translateY(-100%)', opacity: 0 },
  ],
  slideOutDown: [
    { offset: 0, transform: 'translateY(0)', opacity: 1 },
    { offset: 1, transform: 'translateY(100%)', opacity: 0 },
  ],
  slideOutLeft: [
    { offset: 0, transform: 'translateX(0)', opacity: 1 },
    { offset: 1, transform: 'translateX(-100%)', opacity: 0 },
  ],
  slideOutRight: [
    { offset: 0, transform: 'translateX(0)', opacity: 1 },
    { offset: 1, transform: 'translateX(100%)', opacity: 0 },
  ],
  zoomIn: [
    { offset: 0, transform: 'scale(0)', opacity: 0 },
    { offset: 0.5, opacity: 1 },
    { offset: 1, transform: 'scale(1)' },
  ],
  zoomOut: [
    { offset: 0, transform: 'scale(1)', opacity: 1 },
    { offset: 0.5, opacity: 1 },
    { offset: 1, transform: 'scale(0)', opacity: 0 },
  ],
  rotate: [
    { offset: 0, transform: 'rotate(0deg)' },
    { offset: 1, transform: 'rotate(360deg)' },
  ],
  bounce: [
    { offset: 0, transform: 'translateY(0)' },
    { offset: 0.2, transform: 'translateY(0)' },
    { offset: 0.4, transform: 'translateY(-30px)' },
    { offset: 0.43, transform: 'translateY(-30px)' },
    { offset: 0.53, transform: 'translateY(0)' },
    { offset: 0.7, transform: 'translateY(-15px)' },
    { offset: 0.8, transform: 'translateY(0)' },
    { offset: 0.9, transform: 'translateY(-4px)' },
    { offset: 1, transform: 'translateY(0)' },
  ],
  pulse: [
    { offset: 0, transform: 'scale(1)' },
    { offset: 0.5, transform: 'scale(1.05)' },
    { offset: 1, transform: 'scale(1)' },
  ],
  shake: [
    { offset: 0, transform: 'translateX(0)' },
    { offset: 0.1, transform: 'translateX(-10px)' },
    { offset: 0.2, transform: 'translateX(10px)' },
    { offset: 0.3, transform: 'translateX(-10px)' },
    { offset: 0.4, transform: 'translateX(10px)' },
    { offset: 0.5, transform: 'translateX(-10px)' },
    { offset: 0.6, transform: 'translateX(10px)' },
    { offset: 0.7, transform: 'translateX(-10px)' },
    { offset: 0.8, transform: 'translateX(10px)' },
    { offset: 0.9, transform: 'translateX(-10px)' },
    { offset: 1, transform: 'translateX(0)' },
  ],
  swing: [
    { offset: 0, transform: 'rotate(0deg)' },
    { offset: 0.2, transform: 'rotate(15deg)' },
    { offset: 0.4, transform: 'rotate(-10deg)' },
    { offset: 0.6, transform: 'rotate(5deg)' },
    { offset: 0.8, transform: 'rotate(-5deg)' },
    { offset: 1, transform: 'rotate(0deg)' },
  ],
  flip: [
    { offset: 0, transform: 'perspective(400px) rotateY(0)', animationTimingFunction: 'ease-out' },
    { offset: 0.4, transform: 'perspective(400px) translateZ(150px) rotateY(170deg)', animationTimingFunction: 'ease-out' },
    { offset: 0.5, transform: 'perspective(400px) translateZ(150px) rotateY(190deg)', animationTimingFunction: 'ease-in' },
    { offset: 0.8, transform: 'perspective(400px) rotateY(360deg)', animationTimingFunction: 'ease-in' },
    { offset: 1, transform: 'perspective(400px)', animationTimingFunction: 'ease-in' },
  ],
  rubberBand: [
    { offset: 0, transform: 'scale(1)' },
    { offset: 0.3, transform: 'scaleX(1.25) scaleY(0.75)' },
    { offset: 0.4, transform: 'scaleX(0.75) scaleY(1.25)' },
    { offset: 0.5, transform: 'scaleX(1.15) scaleY(0.85)' },
    { offset: 0.65, transform: 'scaleX(0.95) scaleY(1.05)' },
    { offset: 0.75, transform: 'scaleX(1.05) scaleY(0.95)' },
    { offset: 1, transform: 'scale(1)' },
  ],
  heartbeat: [
    { offset: 0, transform: 'scale(1)' },
    { offset: 0.14, transform: 'scale(1.3)' },
    { offset: 0.28, transform: 'scale(1)' },
    { offset: 0.42, transform: 'scale(1.3)' },
    { offset: 0.7, transform: 'scale(1)' },
  ],
} as const

/**
 * Type for predefined animation names
 */
export type KeyframeAnimationName = keyof typeof KeyframeAnimations

/**
 * Animate an element with a predefined animation
 *
 * @param element - Target HTML element
 * @param animationName - Name of predefined animation
 * @param options - Animation options
 * @returns Animation instance or null if not supported
 */
export function animate(
  element: HTMLElement,
  animationName: KeyframeAnimationName,
  options: AnimationOptions = {},
): Animation | null {
  return createKeyframeAnimation(element, KeyframeAnimations[animationName], options)
}
