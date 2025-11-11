// CSS Animation helpers

export interface CSSAnimationOptions {
  duration?: string
  timing?: string
  delay?: string
  iteration?: string
  direction?: string
  fill?: string
  playState?: string
}

// Generate CSS animation string
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

// Apply animation to element
export function applyAnimation(
  element: HTMLElement,
  animationName: string,
  options: CSSAnimationOptions = {},
): void {
  element.style.animation = cssAnimation(animationName, options)
}

// Remove animation from element
export function removeAnimation(element: HTMLElement): void {
  element.style.animation = ''
}

// Wait for animation to complete
export function waitForAnimation(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd)
      resolve()
    }

    element.addEventListener('animationend', handleAnimationEnd)
  })
}

// Stagger animations for multiple elements
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

// Sequence animations
export async function sequenceAnimations(
  element: HTMLElement,
  animations: Array<{ name: string; options?: CSSAnimationOptions }>,
): Promise<void> {
  for (const animation of animations) {
    applyAnimation(element, animation.name, animation.options)
    await waitForAnimation(element)
  }
}

// Predefined CSS animation classes (for use with Tailwind/headwind)
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

// Utility to add animation class with auto-removal
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

// Create custom CSS keyframes dynamically
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
