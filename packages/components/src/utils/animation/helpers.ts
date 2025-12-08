/**
 * CSS Animation helper utilities
 *
 * @example
 * ```ts
 * import { applyAnimation, staggerAnimation } from '@stacksjs/components'
 *
 * // Apply animation
 * applyAnimation(element, 'fade-in', { duration: '300ms' })
 *
 * // Stagger multiple elements
 * staggerAnimation(elements, 'slide-in', { stagger: 100 })
 * ```
 */

/**
 * CSS animation configuration options
 */
export interface CSSAnimationOptions {
  /** Animation duration (e.g., '300ms', '1s') */
  duration?: string
  /** Timing function (e.g., 'ease', 'linear', 'cubic-bezier(...)') */
  timing?: string
  /** Delay before animation (e.g., '100ms') */
  delay?: string
  /** Number of iterations (e.g., '1', 'infinite') */
  iteration?: string
  /** Animation direction */
  direction?: string
  /** Fill mode */
  fill?: string
  /** Play state */
  playState?: string
}

/**
 * Generate CSS animation string
 *
 * @param name - Animation name
 * @param options - Animation options
 * @returns CSS animation string
 */
export function cssAnimation(name: string, options: CSSAnimationOptions = {}): string {
  const {
    duration = '1s',
    timing = 'ease',
    delay = '0s',
    iteration = '1',
    direction = 'normal',
    fill = 'both',
    playState = 'running',
  } = options

  return `${name} ${duration} ${timing} ${delay} ${iteration} ${direction} ${fill} ${playState}`
}

/**
 * Apply CSS animation to an element
 *
 * @param element - Target element
 * @param animationName - Name of CSS animation
 * @param options - Animation options
 */
export function applyAnimation(
  element: HTMLElement,
  animationName: string,
  options: CSSAnimationOptions = {},
): void {
  element.style.animation = cssAnimation(animationName, options)
}

/**
 * Remove animation from an element
 *
 * @param element - Target element
 */
export function removeAnimation(element: HTMLElement): void {
  element.style.animation = ''
}

/**
 * Wait for animation to complete
 *
 * @param element - Target element
 * @returns Promise that resolves when animation ends
 */
export function waitForAnimation(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd)
      resolve()
    }

    element.addEventListener('animationend', handleAnimationEnd)
  })
}

/**
 * Stagger animations across multiple elements
 *
 * @param elements - Array of elements to animate
 * @param animationName - Name of CSS animation
 * @param options - Animation options with stagger delay in ms
 */
export function staggerAnimation(
  elements: HTMLElement[],
  animationName: string,
  options: CSSAnimationOptions & { stagger?: number } = {},
): void {
  const { stagger = 100, ...animationOptions } = options

  elements.forEach((element, index) => {
    const delay = `${index * stagger}ms`
    applyAnimation(element, animationName, {
      ...animationOptions,
      delay,
    })
  })
}

/**
 * Run animations in sequence
 *
 * @param element - Target element
 * @param animations - Array of animations to run in order
 * @returns Promise that resolves when all animations complete
 */
export async function sequenceAnimations(
  element: HTMLElement,
  animations: Array<{ name: string, options?: CSSAnimationOptions }>,
): Promise<void> {
  for (const animation of animations) {
    applyAnimation(element, animation.name, animation.options)
    await waitForAnimation(element)
  }
}

/**
 * Predefined CSS animation class names (compatible with Tailwind/headwind)
 */
export const AnimationClasses = {
  // Fade
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',

  // Slide
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',

  // Zoom
  zoomIn: 'animate-zoom-in',
  zoomOut: 'animate-zoom-out',

  // Bounce
  bounce: 'animate-bounce',

  // Spin
  spin: 'animate-spin',

  // Ping
  ping: 'animate-ping',

  // Pulse
  pulse: 'animate-pulse',
} as const

/**
 * Add animation class with automatic removal
 *
 * @param element - Target element
 * @param animationClass - CSS class name
 * @param duration - Duration in milliseconds before removing class
 * @returns Promise that resolves when animation completes
 */
export function animateWithClass(
  element: HTMLElement,
  animationClass: string,
  duration = 1000,
): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add(animationClass)

    setTimeout(() => {
      element.classList.remove(animationClass)
      resolve()
    }, duration)
  })
}

/**
 * Create custom CSS @keyframes rule dynamically
 *
 * @param name - Animation name
 * @param frames - Keyframe definitions (percentage -> styles)
 *
 * @example
 * ```ts
 * createKeyframes('custom-fade', {
 *   '0%': { opacity: '0' },
 *   '100%': { opacity: '1' }
 * })
 * ```
 */
export function createKeyframes(name: string, frames: Record<string, Record<string, string>>): void {
  const keyframesRule = `
    @keyframes ${name} {
      ${Object.entries(frames)
        .map(([percentage, styles]) => {
          const styleString = Object.entries(styles)
            .map(([prop, value]) => `${prop}: ${value};`)
            .join(' ')
          return `${percentage} { ${styleString} }`
        })
        .join('\n')}
    }
  `

  const styleSheet = document.createElement('style')
  styleSheet.textContent = keyframesRule
  document.head.appendChild(styleSheet)
}
