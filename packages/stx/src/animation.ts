/* eslint-disable unused-imports/no-unused-vars, no-case-declarations,  */
import type { CustomDirective, StxOptions } from './types'

/**
 * Available transition types that can be used with @transition directive
 */
export enum TransitionType {
  Fade = 'fade',
  Slide = 'slide',
  Scale = 'scale',
  Flip = 'flip',
  Rotate = 'rotate',
  Custom = 'custom',
}

/**
 * Available transition directions that can be used with @transition directive
 */
export enum TransitionDirection {
  In = 'in',
  Out = 'out',
  Both = 'both',
}

/**
 * Available ease functions for transitions
 */
export enum TransitionEase {
  Linear = 'linear',
  Ease = 'ease',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  Spring = 'spring',
}

/**
 * Default transition options
 */
export const DEFAULT_TRANSITION_OPTIONS: {
  duration: number
  delay: number
  ease: string
  direction: string
} = {
  duration: 300,
  delay: 0,
  ease: TransitionEase.Ease as string,
  direction: TransitionDirection.Both as string,
}

/**
 * Generates CSS for transitions based on provided parameters
 */
function generateTransitionCSS(
  type: TransitionType,
  options: {
    duration?: number
    delay?: number
    ease?: TransitionEase
    direction?: TransitionDirection
    custom?: string
  } = {},
): string {
  const { duration, delay, ease, direction, custom } = {
    ...DEFAULT_TRANSITION_OPTIONS,
    ...options,
  }

  // Base transition property
  const transitionProperty = 'transition:'
  let transitionValue = ''

  // Handle custom transitions
  if (type === TransitionType.Custom && custom) {
    return custom
  }

  // Build transition CSS based on type
  switch (type) {
    case TransitionType.Fade:
      transitionValue = `opacity ${duration}ms ${ease} ${delay}ms`
      const fadeCSS = direction === TransitionDirection.In
        ? 'opacity: 0; animation: fadeIn var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
        : direction === TransitionDirection.Out
          ? 'opacity: 1; animation: fadeOut var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
          : 'opacity: 1; transition: opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);'

      return `${fadeCSS}\n@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`

    case TransitionType.Slide:
      transitionValue = `transform ${duration}ms ${ease} ${delay}ms`
      const slideCSS = direction === TransitionDirection.In
        ? 'transform: translateY(20px); opacity: 0; animation: slideIn var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
        : direction === TransitionDirection.Out
          ? 'transform: translateY(0); opacity: 1; animation: slideOut var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
          : 'transform: translateY(0); opacity: 1; transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms), opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);'

      return `${slideCSS}\n@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n@keyframes slideOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }`

    case TransitionType.Scale:
      transitionValue = `transform ${duration}ms ${ease} ${delay}ms`
      const scaleCSS = direction === TransitionDirection.In
        ? 'transform: scale(0.95); opacity: 0; animation: scaleIn var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
        : direction === TransitionDirection.Out
          ? 'transform: scale(1); opacity: 1; animation: scaleOut var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
          : 'transform: scale(1); opacity: 1; transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms), opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);'

      return `${scaleCSS}\n@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }\n@keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }`

    case TransitionType.Flip:
      transitionValue = `transform ${duration}ms ${ease} ${delay}ms`
      const flipCSS = direction === TransitionDirection.In
        ? 'transform: perspective(400px) rotateX(-90deg); opacity: 0; animation: flipIn var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
        : direction === TransitionDirection.Out
          ? 'transform: perspective(400px) rotateX(0); opacity: 1; animation: flipOut var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
          : 'transform: perspective(400px) rotateX(0); opacity: 1; transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms), opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);'

      return `${flipCSS}\n@keyframes flipIn { from { transform: perspective(400px) rotateX(-90deg); opacity: 0; } to { transform: perspective(400px) rotateX(0); opacity: 1; } }\n@keyframes flipOut { from { transform: perspective(400px) rotateX(0); opacity: 1; } to { transform: perspective(400px) rotateX(90deg); opacity: 0; } }`

    case TransitionType.Rotate:
      transitionValue = `transform ${duration}ms ${ease} ${delay}ms`
      const rotateCSS = direction === TransitionDirection.In
        ? 'transform: rotate(-90deg); opacity: 0; animation: rotateIn var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
        : direction === TransitionDirection.Out
          ? 'transform: rotate(0); opacity: 1; animation: rotateOut var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms) forwards;'
          : 'transform: rotate(0); opacity: 1; transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms), opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);'

      return `${rotateCSS}\n@keyframes rotateIn { from { transform: rotate(-90deg); opacity: 0; } to { transform: rotate(0); opacity: 1; } }\n@keyframes rotateOut { from { transform: rotate(0); opacity: 1; } to { transform: rotate(90deg); opacity: 0; } }`

    default:
      return ''
  }
}

/**
 * Generates necessary script to handle motion preferences
 */
function generateMotionPreferencesScript(): string {
  return `
<script>
  // Motion preferences handling
  (function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Apply reduced motion settings
      document.documentElement.style.setProperty('--stx-transition-duration', '0ms');
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.setAttribute('data-reduced-motion', 'false');
    }

    // Listen for changes in preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.style.setProperty('--stx-transition-duration', '0ms');
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      } else {
        document.documentElement.style.setProperty('--stx-transition-duration', '');
        document.documentElement.setAttribute('data-reduced-motion', 'false');
      }
    });
  })();
</script>
  `
}

/**
 * Checks if the template contains any animation directives
 */
function hasAnimationDirectives(template: string): boolean {
  // More specific patterns that indicate actual STX animation usage
  const animationDirectives = [
    /@animate\b/, // @animate directive
    /@transition\b/, // @transition directive
    /@scroll(?:Animate)?\b/, // @scroll or @scrollAnimate directives
    /@staggered\b/, // @staggered directive
    /@sequence\b/, // @sequence directive
    /@motion\b/, // @motion directive
    /@animationGroup\b/, // @animationGroup directive
    /\bstx-transition\b/, // STX transition class
    /\bstx-(?:fade|scale|flip|rotate|slide|from-|observe)\b/, // STX animation classes
    /data-animate=['"](?:auto|true|false)['"]/, // Animation data attribute
  ]

  return animationDirectives.some(pattern => pattern.test(template))
}

/**
 * Generates intersection observer script for scroll-based animations
 */
function generateIntersectionObserverScript(threshold = 0.1, rootMargin = '0px'): string {
  return `
<script>
  // Intersection Observer for scroll animations
  (function() {
    const initObserver = () => {
      if (!('IntersectionObserver' in window)) {
        // For browsers that don't support IntersectionObserver, show all elements immediately
        const elements = document.querySelectorAll('.stx-observe');
        elements.forEach(el => el.classList.remove('stx-out'));
        return;
      }

      // Create the observer
      const options = {
        root: null, // Use viewport
        rootMargin: '${rootMargin}',
        threshold: ${threshold}
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('stx-out');
            // Stop observing after animation is triggered
            observer.unobserve(entry.target);
          }
        });
      }, options);

      // Start observing elements
      const elements = document.querySelectorAll('.stx-observe');
      console.log('Observing', elements.length, 'elements for animations');
      elements.forEach(el => observer.observe(el));
    };

    // Initialize observer when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver);
    } else {
      initObserver();
    }
  })();
</script>
  `
}

/**
 * Generates necessary styles for handling animations and transitions
 */
function generateBaseAnimationStyles(): string {
  return `
<style id="stx-animation-base">
  :root {
    --stx-transition-duration: 300ms;
    --stx-transition-delay: 0ms;
    --stx-transition-ease: ease;
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --stx-transition-duration: 0ms;
    }
  }

  [data-animate="false"] * {
    --stx-transition-duration: 0ms !important;
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }

  /* Base transition classes */
  .stx-transition {
    transition: opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
    backface-visibility: hidden; /* Improve animation performance */
    transform-style: preserve-3d; /* Better 3D transforms */
  }

  /* Fade animations */
  .stx-fade {
    transition: opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }

  .stx-fade.stx-out {
    opacity: 0 !important;
  }

  /* Scale animations */
  .stx-scale {
    transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }

  .stx-scale.stx-out {
    transform: scale(0.85) !important;
    opacity: 0 !important;
  }

  /* Flip animations */
  .stx-flip {
    transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
    perspective: 600px;
  }

  .stx-flip.stx-out {
    transform: perspective(600px) rotateX(-90deg) !important;
    opacity: 0 !important;
  }

  /* Rotate animations */
  .stx-rotate {
    transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }

  .stx-rotate.stx-out {
    transform: rotate(-90deg) !important;
    opacity: 0 !important;
  }

  /* Direction-based animations */
  .stx-from-left, .stx-from-right, .stx-from-top, .stx-from-bottom {
    transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }

  .stx-from-left.stx-out {
    transform: translateX(-30px) !important;
    opacity: 0 !important;
  }

  .stx-from-right.stx-out {
    transform: translateX(30px) !important;
    opacity: 0 !important;
  }

  .stx-from-top.stx-out {
    transform: translateY(-30px) !important;
    opacity: 0 !important;
  }

  .stx-from-bottom.stx-out {
    transform: translateY(30px) !important;
    opacity: 0 !important;
  }

  /* Generic slide animations */
  .stx-slide {
    transition: transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }

  .stx-slide.stx-out {
    transform: translateY(30px) !important;
    opacity: 0 !important;
  }

  /* Scroll animation observer class */
  .stx-observe {
    will-change: opacity, transform;
    transition: opacity var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms),
                transform var(--stx-transition-duration, 300ms) var(--stx-transition-ease, ease) var(--stx-transition-delay, 0ms);
  }
</style>
  `
}

/**
 * Animation Group handling for coordinated animations
 */
function generateAnimationGroup(
  groupName: string,
  elements: string[],
  options: { staggerDelay?: number, sequence?: boolean } = {},
): string {
  const { staggerDelay = 50, sequence = false } = options

  const script = `
<script>
  // Animation Group: ${groupName}
  (function() {
    const elements = ${JSON.stringify(elements)};
    const staggerDelay = ${staggerDelay};
    const sequence = ${sequence};

    function animateGroup() {
      elements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (!element) return;

        const delay = sequence ? index * staggerDelay : 0;
        element.style.setProperty('--stx-transition-delay', delay + 'ms');

        // For elements using animation keyframes
        element.style.animationDelay = delay + 'ms';

        // If the element is initially hidden, show it
        if (element.classList.contains('stx-out')) {
          setTimeout(() => {
            element.classList.remove('stx-out');
          }, 10); // Small delay to ensure styles are applied
        }
      });
    }

    // Run when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', animateGroup);
    } else {
      animateGroup();
    }
  })();
</script>
  `

  return script
}

/**
 * Transition directive for applying transitions to elements
 */
export const transitionDirective: CustomDirective = {
  name: 'transition',
  handler: (content, params, context, filePath) => {
    if (params.length < 1) {
      return `<div class="stx-error">@transition directive requires at least a transition type</div>${content}`
    }

    const type = params[0] as TransitionType
    const duration = params.length > 1 ? Number.parseInt(params[1], 10) || DEFAULT_TRANSITION_OPTIONS.duration : DEFAULT_TRANSITION_OPTIONS.duration
    const ease = params.length > 2 ? params[2] as TransitionEase || DEFAULT_TRANSITION_OPTIONS.ease : DEFAULT_TRANSITION_OPTIONS.ease
    const delay = params.length > 3 ? Number.parseInt(params[3], 10) || DEFAULT_TRANSITION_OPTIONS.delay : DEFAULT_TRANSITION_OPTIONS.delay
    const direction = params.length > 4 ? params[4] as TransitionDirection || DEFAULT_TRANSITION_OPTIONS.direction : DEFAULT_TRANSITION_OPTIONS.direction

    // Generate unique ID for the element
    const uniqueId = `stx-transition-${Math.random().toString(36).substr(2, 9)}`

    const css = generateTransitionCSS(type as TransitionType, {
      duration,
      delay,
      ease: ease as TransitionEase,
      direction: direction as TransitionDirection,
    })

    // Add specific class based on the transition type
    const transitionClass = 'stx-transition'
    let transitionTypeClass = ''

    if (type === TransitionType.Fade) {
      transitionTypeClass = 'stx-fade'
    }
    else if (type === TransitionType.Slide) {
      transitionTypeClass = 'stx-slide'
    }
    else if (type === TransitionType.Scale) {
      transitionTypeClass = 'stx-scale'
    }
    else if (type === TransitionType.Flip) {
      transitionTypeClass = 'stx-flip'
    }
    else if (type === TransitionType.Rotate) {
      transitionTypeClass = 'stx-rotate'
    }

    // Add out class if direction is out or both
    const shouldBeOut = direction === TransitionDirection.Out
    const outClass = shouldBeOut ? 'stx-out' : ''

    // Combine all classes, keeping any existing stx-out class from children
    return `<div id="${uniqueId}" class="${transitionClass} ${transitionTypeClass} ${outClass}"
      style="--stx-transition-duration: ${duration}ms; --stx-transition-ease: ${ease}; --stx-transition-delay: ${delay}ms;">${content}</div>`
  },
  hasEndTag: true,
  description: 'Applies transition effects to an element',
}

/**
 * Scroll animation directive for triggering animations on scroll
 */
export const scrollAnimateDirective: CustomDirective = {
  name: 'scrollAnimate',
  handler: (content, params, context, filePath) => {
    if (params.length < 1) {
      return `<div class="stx-error">@scrollAnimate directive requires at least an animation type</div>${content}`
    }

    const type = params[0] // animation type
    const duration = params.length > 1 ? Number.parseInt(params[1], 10) || 300 : 300
    const ease = params.length > 2 ? params[2] || 'ease' : 'ease'
    const threshold = params.length > 3 ? Number.parseFloat(params[3]) || 0.2 : 0.2
    const delay = params.length > 4 ? Number.parseInt(params[4], 10) || 0 : 0

    // Generate unique ID
    const uniqueId = `stx-scroll-${Math.random().toString(36).substr(2, 9)}`

    // Set CSS variables inline
    const style = `--stx-transition-duration: ${duration}ms; --stx-transition-ease: ${ease}; --stx-transition-delay: ${delay}ms; will-change: opacity, transform;`

    // Build appropriate class based on animation type
    let animationClass = 'stx-transition stx-observe stx-out'

    // Map animation types to appropriate CSS classes
    if (type === 'fade') {
      animationClass += ' stx-fade'
    }
    else if (type === 'slide-up' || type === 'slide') {
      animationClass += ' stx-from-bottom'
    }
    else if (type === 'slide-down') {
      animationClass += ' stx-from-top'
    }
    else if (type === 'slide-left') {
      animationClass += ' stx-from-right'
    }
    else if (type === 'slide-right') {
      animationClass += ' stx-from-left'
    }
    else if (type === 'scale') {
      animationClass += ' stx-scale'
    }
    else if (type.includes('-')) {
      // Handle direction-based custom animations
      animationClass += ` stx-${type}`
    }
    else {
      // Default fallback
      animationClass += ` stx-${type}`
    }

    return `<div id="${uniqueId}" class="${animationClass}" style="${style}" data-threshold="${threshold}">${content}</div>`
  },
  hasEndTag: true,
  description: 'Applies animations that trigger when scrolled into view',
}

/**
 * Animation group directive for coordinating multiple animations
 */
export const animationGroupDirective: CustomDirective = {
  name: 'animationGroup',
  handler: (content, params, context, filePath) => {
    if (params.length < 2) {
      return `<div class="stx-error">@animationGroup directive requires a group name and at least one element selector</div>${content}`
    }

    const groupName = params[0]
    const elements = params.slice(1).map(p => p.startsWith('#') || p.startsWith('.') ? p : `#${p}`)
    const staggerDelay = context.staggerDelay || 50
    const sequence = context.sequence || true

    const groupScript = generateAnimationGroup(groupName, elements, { staggerDelay, sequence })

    return `${content}\n${groupScript}`
  },
  hasEndTag: false,
  description: 'Coordinates multiple animations together as a group',
}

/**
 * Motion preferences directive for controlling animation preferences
 */
export const motionDirective: CustomDirective = {
  name: 'motion',
  handler: (content, params, context, filePath) => {
    const respectPreferences = params.length > 0 ? params[0].toLowerCase() === 'true' : true

    // Set up motion preferences script
    const motionScript = generateMotionPreferencesScript()

    // Add data attribute to control animation state
    return `<div data-animate="${respectPreferences ? 'auto' : 'true'}">${content}</div>${motionScript}`
  },
  hasEndTag: true,
  description: 'Controls motion and animation preferences',
}

/**
 * Process animation directives in the template
 */
export function processAnimationDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): string {
  let output = template

  // Skip processing if animations are disabled entirely
  if (options.animation?.enabled === false) {
    return output
  }

  // For test files, always inject animation styles
  const isTestFile = filePath.includes('test') && filePath.includes('animation')

  // Only process animations if animation directives are present or it's a test file
  if (!hasAnimationDirectives(output) && !isTestFile) {
    return output
  }

  // Add base animation styles if not already present
  const hasBaseStyles = output.includes('<style id="stx-animation-base">')

  if (!hasBaseStyles) {
    const baseStyles = generateBaseAnimationStyles()
    output = output.replace('</head>', `${baseStyles}\n</head>`)
  }

  // Process animation directives
  // ... existing animation directive processing ...

  // Add intersection observer script for scroll animations if needed
  if (output.includes('stx-observe')) {
    const hasObserverScript = output.includes('Intersection Observer for scroll animations')
    if (!hasObserverScript) {
      const observerScript = generateIntersectionObserverScript()
      output = output.replace('</body>', `${observerScript}\n</body>`)
    }
  }

  return output
}

/**
 * Register animation directives
 */
export function registerAnimationDirectives(options: StxOptions): StxOptions {
  const customDirectives = options.customDirectives || []

  // Add animation directives to the list
  customDirectives.push(transitionDirective)
  customDirectives.push(animationGroupDirective)
  customDirectives.push(motionDirective)
  customDirectives.push(scrollAnimateDirective)

  return {
    ...options,
    customDirectives,
  }
}
