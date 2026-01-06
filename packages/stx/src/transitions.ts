/**
 * STX Transitions
 *
 * Vue-inspired transition system for enter/leave animations.
 * Supports CSS transitions, CSS animations, and JavaScript hooks.
 *
 * @module transitions
 *
 * @example
 * ```html
 * @transition(name: 'fade')
 *   @if (visible)
 *     <div class="modal">Content</div>
 *   @endif
 * @endtransition
 * ```
 *
 * CSS classes applied:
 * - `.fade-enter-from` - Starting state for enter
 * - `.fade-enter-active` - Active state during enter
 * - `.fade-enter-to` - Ending state for enter
 * - `.fade-leave-from` - Starting state for leave
 * - `.fade-leave-active` - Active state during leave
 * - `.fade-leave-to` - Ending state for leave
 */

// =============================================================================
// Types
// =============================================================================

export interface TransitionOptions {
  /** Transition name (used for CSS class prefix) */
  name?: string
  /** Duration in milliseconds */
  duration?: number | { enter: number; leave: number }
  /** CSS transition timing function */
  easing?: string
  /** Transition mode: 'in-out' or 'out-in' */
  mode?: 'in-out' | 'out-in' | 'default'
  /** Use CSS animations instead of transitions */
  css?: boolean
  /** Custom enter class */
  enterClass?: string
  /** Custom enter-active class */
  enterActiveClass?: string
  /** Custom enter-to class */
  enterToClass?: string
  /** Custom leave class */
  leaveClass?: string
  /** Custom leave-active class */
  leaveActiveClass?: string
  /** Custom leave-to class */
  leaveToClass?: string
  /** JavaScript hooks */
  onBeforeEnter?: (el: Element) => void
  onEnter?: (el: Element, done: () => void) => void
  onAfterEnter?: (el: Element) => void
  onEnterCancelled?: (el: Element) => void
  onBeforeLeave?: (el: Element) => void
  onLeave?: (el: Element, done: () => void) => void
  onAfterLeave?: (el: Element) => void
  onLeaveCancelled?: (el: Element) => void
}

export interface TransitionState {
  isEntering: boolean
  isLeaving: boolean
  isCancelled: boolean
}

// =============================================================================
// Transition Class Names
// =============================================================================

function getTransitionClasses(name: string, options: TransitionOptions = {}) {
  return {
    enterFrom: options.enterClass || `${name}-enter-from`,
    enterActive: options.enterActiveClass || `${name}-enter-active`,
    enterTo: options.enterToClass || `${name}-enter-to`,
    leaveFrom: options.leaveClass || `${name}-leave-from`,
    leaveActive: options.leaveActiveClass || `${name}-leave-active`,
    leaveTo: options.leaveToClass || `${name}-leave-to`,
  }
}

// =============================================================================
// Transition Helpers
// =============================================================================

/**
 * Get the duration of a CSS transition/animation on an element.
 */
function getTransitionDuration(el: Element): number {
  const style = getComputedStyle(el)
  const transitionDuration = style.transitionDuration || '0s'
  const animationDuration = style.animationDuration || '0s'

  const parseDuration = (str: string): number => {
    const match = str.match(/^([\d.]+)(s|ms)?$/)
    if (!match) return 0
    const value = parseFloat(match[1])
    const unit = match[2] || 's'
    return unit === 'ms' ? value : value * 1000
  }

  return Math.max(parseDuration(transitionDuration), parseDuration(animationDuration))
}

/**
 * Wait for a transition/animation to complete.
 */
function whenTransitionEnds(el: Element, expectedDuration?: number): Promise<void> {
  return new Promise((resolve) => {
    const duration = expectedDuration ?? getTransitionDuration(el)

    if (duration === 0) {
      resolve()
      return
    }

    let resolved = false
    const done = () => {
      if (resolved) return
      resolved = true
      el.removeEventListener('transitionend', onEnd)
      el.removeEventListener('animationend', onEnd)
      resolve()
    }

    const onEnd = (e: Event) => {
      if (e.target === el) done()
    }

    el.addEventListener('transitionend', onEnd)
    el.addEventListener('animationend', onEnd)

    // Fallback timeout
    setTimeout(done, duration + 50)
  })
}

/**
 * Force a reflow to ensure CSS changes are applied.
 */
function forceReflow(el: Element): void {
  // Reading offsetHeight forces a reflow
  void (el as HTMLElement).offsetHeight
}

// =============================================================================
// Enter Transition
// =============================================================================

/**
 * Perform an enter transition on an element.
 */
export async function performEnter(
  el: Element,
  options: TransitionOptions = {},
): Promise<void> {
  const name = options.name || 'stx'
  const classes = getTransitionClasses(name, options)
  const duration = typeof options.duration === 'object'
    ? options.duration.enter
    : options.duration

  // Before enter hook
  options.onBeforeEnter?.(el)

  // Add initial classes
  el.classList.add(classes.enterFrom)
  el.classList.add(classes.enterActive)

  // Force reflow
  forceReflow(el)

  // Start transition
  el.classList.remove(classes.enterFrom)
  el.classList.add(classes.enterTo)

  // JavaScript hook with done callback
  if (options.onEnter) {
    await new Promise<void>((resolve) => {
      options.onEnter!(el, resolve)
    })
  } else {
    await whenTransitionEnds(el, duration)
  }

  // Cleanup
  el.classList.remove(classes.enterActive)
  el.classList.remove(classes.enterTo)

  // After enter hook
  options.onAfterEnter?.(el)
}

/**
 * Perform a leave transition on an element.
 */
export async function performLeave(
  el: Element,
  options: TransitionOptions = {},
): Promise<void> {
  const name = options.name || 'stx'
  const classes = getTransitionClasses(name, options)
  const duration = typeof options.duration === 'object'
    ? options.duration.leave
    : options.duration

  // Before leave hook
  options.onBeforeLeave?.(el)

  // Add initial classes
  el.classList.add(classes.leaveFrom)
  el.classList.add(classes.leaveActive)

  // Force reflow
  forceReflow(el)

  // Start transition
  el.classList.remove(classes.leaveFrom)
  el.classList.add(classes.leaveTo)

  // JavaScript hook with done callback
  if (options.onLeave) {
    await new Promise<void>((resolve) => {
      options.onLeave!(el, resolve)
    })
  } else {
    await whenTransitionEnds(el, duration)
  }

  // Cleanup
  el.classList.remove(classes.leaveActive)
  el.classList.remove(classes.leaveTo)

  // After leave hook
  options.onAfterLeave?.(el)
}

// =============================================================================
// Transition Directive Processing
// =============================================================================

/**
 * Process @transition directives in templates.
 *
 * Syntax:
 *   @transition(name: 'fade')
 *   @transition(name: 'slide', duration: 300)
 *   @transition(name: 'fade', mode: 'out-in')
 */
export function processTransitionDirectives(
  template: string,
  _context: Record<string, unknown> = {},
  _filePath?: string,
): string {
  // Match @transition(options) ... @endtransition
  const transitionRegex = /@transition\s*\(([^)]*)\)([\s\S]*?)@endtransition/gi

  return template.replace(transitionRegex, (_match, optionsStr: string, content: string) => {
    // Parse options
    const options = parseTransitionOptions(optionsStr)
    const name = options.name || 'stx'
    const duration = options.duration || 300

    // Generate unique ID for this transition
    const transitionId = `stx-transition-${Math.random().toString(36).slice(2, 9)}`

    // Wrap content with transition container
    return `
<div
  class="stx-transition-wrapper"
  data-transition="${name}"
  data-transition-id="${transitionId}"
  data-transition-duration="${duration}"
  ${options.mode ? `data-transition-mode="${options.mode}"` : ''}
>
  ${content.trim()}
</div>
<script>
(function() {
  const wrapper = document.querySelector('[data-transition-id="${transitionId}"]');
  if (!wrapper) return;

  const name = '${name}';
  const duration = ${duration};

  // Observe for child changes to trigger transitions
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          window.STX?.transition?.enter(node, { name: name, duration: duration });
        }
      });
      mutation.removedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Leave transition handled before removal
        }
      });
    });
  });

  observer.observe(wrapper, { childList: true });

  // Initial enter transition for existing children
  Array.from(wrapper.children).forEach(function(child) {
    window.STX?.transition?.enter(child, { name: name, duration: duration });
  });
})();
</script>
`
  })
}

/**
 * Parse transition options from directive string.
 */
function parseTransitionOptions(optionsStr: string): TransitionOptions {
  const options: TransitionOptions = {}

  // Match key: 'value' or key: value patterns
  const keyValueRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+)|(\w+))/g
  let match

  while ((match = keyValueRegex.exec(optionsStr)) !== null) {
    const key = match[1]
    const value = match[2] || match[3] || match[4] || match[5]

    switch (key) {
      case 'name':
        options.name = value
        break
      case 'duration':
        options.duration = parseInt(value, 10)
        break
      case 'mode':
        options.mode = value as 'in-out' | 'out-in' | 'default'
        break
      case 'easing':
        options.easing = value
        break
    }
  }

  return options
}

// =============================================================================
// Built-in Transition Presets
// =============================================================================

/**
 * Generate CSS for common transition presets.
 */
export function generateTransitionCSS(): string {
  return `
/* STX Transition Presets */

/* Fade */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Slide Up */
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Slide Down */
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Slide Left */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-left-enter-active,
.slide-left-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-left-enter-to,
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Slide Right */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Scale */
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.scale-enter-active,
.scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.scale-enter-to,
.scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Scale Up (grow) */
.scale-up-enter-from,
.scale-up-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
.scale-up-enter-active,
.scale-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.scale-up-enter-to,
.scale-up-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Bounce */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Flip */
.flip-enter-from,
.flip-leave-to {
  opacity: 0;
  transform: perspective(400px) rotateY(90deg);
}
.flip-enter-active,
.flip-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.flip-enter-to,
.flip-leave-from {
  opacity: 1;
  transform: perspective(400px) rotateY(0);
}

/* Zoom */
.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0);
}
.zoom-enter-active,
.zoom-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.zoom-enter-to,
.zoom-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Collapse (height) */
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.3s ease, max-height 0.3s ease;
  overflow: hidden;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1000px;
}
`
}

// =============================================================================
// Client Runtime
// =============================================================================

/**
 * Generate the client-side transition runtime.
 */
export function generateTransitionRuntime(): string {
  return `
// STX Transition Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  window.STX.transition = {
    // Perform enter transition
    enter: function(el, options) {
      options = options || {};
      const name = options.name || 'stx';
      const duration = options.duration || 300;

      const classes = {
        enterFrom: name + '-enter-from',
        enterActive: name + '-enter-active',
        enterTo: name + '-enter-to'
      };

      // Add initial classes
      el.classList.add(classes.enterFrom);
      el.classList.add(classes.enterActive);

      // Force reflow
      void el.offsetHeight;

      // Start transition
      el.classList.remove(classes.enterFrom);
      el.classList.add(classes.enterTo);

      // Cleanup after transition
      setTimeout(function() {
        el.classList.remove(classes.enterActive);
        el.classList.remove(classes.enterTo);
      }, duration + 50);

      return el;
    },

    // Perform leave transition
    leave: function(el, options) {
      return new Promise(function(resolve) {
        options = options || {};
        const name = options.name || 'stx';
        const duration = options.duration || 300;

        const classes = {
          leaveFrom: name + '-leave-from',
          leaveActive: name + '-leave-active',
          leaveTo: name + '-leave-to'
        };

        // Add initial classes
        el.classList.add(classes.leaveFrom);
        el.classList.add(classes.leaveActive);

        // Force reflow
        void el.offsetHeight;

        // Start transition
        el.classList.remove(classes.leaveFrom);
        el.classList.add(classes.leaveTo);

        // Cleanup and resolve after transition
        setTimeout(function() {
          el.classList.remove(classes.leaveActive);
          el.classList.remove(classes.leaveTo);
          resolve(el);
        }, duration + 50);
      });
    },

    // Toggle with transition
    toggle: function(el, show, options) {
      if (show) {
        el.style.display = '';
        return this.enter(el, options);
      } else {
        return this.leave(el, options).then(function() {
          el.style.display = 'none';
          return el;
        });
      }
    }
  };

  console.log('[stx] Transition runtime initialized');
})();
`
}

// =============================================================================
// Directive Attribute Processing
// =============================================================================

/**
 * Process @transition attribute on elements.
 *
 * Usage:
 *   <div @transition.fade="visible">Content</div>
 *   <div @transition.slide-up.300="isOpen">Content</div>
 */
export function processTransitionAttributes(template: string): string {
  // Match @transition.name or @transition.name.duration
  const attrRegex = /@transition\.([a-z-]+)(?:\.(\d+))?="([^"]+)"/gi

  return template.replace(attrRegex, (_, name: string, duration: string, condition: string) => {
    const dur = duration || '300'
    const transitionId = `stx-t-${Math.random().toString(36).slice(2, 7)}`

    return `data-stx-transition="${name}" data-stx-transition-duration="${dur}" data-stx-transition-condition="${condition}" data-stx-transition-id="${transitionId}"`
  })
}
