/**
 * Easing functions for smooth animations
 *
 * All easing functions follow the signature:
 * @param t - Current time (0 to duration)
 * @param b - Start value
 * @param c - Change in value (end - start)
 * @param d - Duration
 * @returns Current value at time t
 *
 * @example
 * ```ts
 * import { Easing } from '@stacksjs/components'
 *
 * const value = Easing.easeInOutCubic(currentTime, startValue, changeInValue, duration)
 * ```
 */

/**
 * Easing function type signature
 */
export type EasingFunction = (t: number, b: number, c: number, d: number) => number

/**
 * Linear easing - no acceleration
 */
export const linear: EasingFunction = (t, b, c, d) => {
  return (c * t) / d + b
}

/**
 * Quadratic ease-in - accelerating from zero velocity
 */
export const easeInQuad: EasingFunction = (t, b, c, d) => {
  t /= d
  return c * t * t + b
}

/**
 * Quadratic ease-out - decelerating to zero velocity
 */
export const easeOutQuad: EasingFunction = (t, b, c, d) => {
  t /= d
  return -c * t * (t - 2) + b
}

/**
 * Quadratic ease-in-out - acceleration until halfway, then deceleration
 */
export const easeInOutQuad: EasingFunction = (t, b, c, d) => {
  t /= d / 2
  if (t < 1)
    return (c / 2) * t * t + b
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}

// Cubic
export const easeInCubic: EasingFunction = (t, b, c, d) => {
  t /= d
  return c * t * t * t + b
}

export const easeOutCubic: EasingFunction = (t, b, c, d) => {
  t /= d
  t--
  return c * (t * t * t + 1) + b
}

export const easeInOutCubic: EasingFunction = (t, b, c, d) => {
  t /= d / 2
  if (t < 1)
    return (c / 2) * t * t * t + b
  t -= 2
  return (c / 2) * (t * t * t + 2) + b
}

// Quartic
export const easeInQuart: EasingFunction = (t, b, c, d) => {
  t /= d
  return c * t * t * t * t + b
}

export const easeOutQuart: EasingFunction = (t, b, c, d) => {
  t /= d
  t--
  return -c * (t * t * t * t - 1) + b
}

export const easeInOutQuart: EasingFunction = (t, b, c, d) => {
  t /= d / 2
  if (t < 1)
    return (c / 2) * t * t * t * t + b
  t -= 2
  return (-c / 2) * (t * t * t * t - 2) + b
}

// Quintic
export const easeInQuint: EasingFunction = (t, b, c, d) => {
  t /= d
  return c * t * t * t * t * t + b
}

export const easeOutQuint: EasingFunction = (t, b, c, d) => {
  t /= d
  t--
  return c * (t * t * t * t * t + 1) + b
}

export const easeInOutQuint: EasingFunction = (t, b, c, d) => {
  t /= d / 2
  if (t < 1)
    return (c / 2) * t * t * t * t * t + b
  t -= 2
  return (c / 2) * (t * t * t * t * t + 2) + b
}

// Sinusoidal
export const easeInSine: EasingFunction = (t, b, c, d) => {
  return -c * Math.cos((t / d) * (Math.PI / 2)) + c + b
}

export const easeOutSine: EasingFunction = (t, b, c, d) => {
  return c * Math.sin((t / d) * (Math.PI / 2)) + b
}

export const easeInOutSine: EasingFunction = (t, b, c, d) => {
  return (-c / 2) * (Math.cos((Math.PI * t) / d) - 1) + b
}

// Exponential
export const easeInExpo: EasingFunction = (t, b, c, d) => {
  return t === 0 ? b : c * 2 ** (10 * (t / d - 1)) + b
}

export const easeOutExpo: EasingFunction = (t, b, c, d) => {
  return t === d ? b + c : c * (-(2 ** ((-10 * t) / d)) + 1) + b
}

export const easeInOutExpo: EasingFunction = (t, b, c, d) => {
  if (t === 0)
    return b
  if (t === d)
    return b + c
  t /= d / 2
  if (t < 1)
    return (c / 2) * 2 ** (10 * (t - 1)) + b
  t--
  return (c / 2) * (-(2 ** (-10 * t)) + 2) + b
}

// Circular
export const easeInCirc: EasingFunction = (t, b, c, d) => {
  t /= d
  return -c * (Math.sqrt(1 - t * t) - 1) + b
}

export const easeOutCirc: EasingFunction = (t, b, c, d) => {
  t /= d
  t--
  return c * Math.sqrt(1 - t * t) + b
}

export const easeInOutCirc: EasingFunction = (t, b, c, d) => {
  t /= d / 2
  if (t < 1)
    return (-c / 2) * (Math.sqrt(1 - t * t) - 1) + b
  t -= 2
  return (c / 2) * (Math.sqrt(1 - t * t) + 1) + b
}

// Elastic
export const easeInElastic: EasingFunction = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0)
    return b
  t /= d
  if (t === 1)
    return b + c
  if (!p)
    p = d * 0.3
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  }
  else {
    s = (p / (2 * Math.PI)) * Math.asin(c / a)
  }
  t -= 1
  return -(a * 2 ** (10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p)) + b
}

export const easeOutElastic: EasingFunction = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0)
    return b
  t /= d
  if (t === 1)
    return b + c
  if (!p)
    p = d * 0.3
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  }
  else {
    s = (p / (2 * Math.PI)) * Math.asin(c / a)
  }
  return a * 2 ** (-10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p) + c + b
}

export const easeInOutElastic: EasingFunction = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0)
    return b
  t /= d / 2
  if (t === 2)
    return b + c
  if (!p)
    p = d * (0.3 * 1.5)
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  }
  else {
    s = (p / (2 * Math.PI)) * Math.asin(c / a)
  }
  if (t < 1) {
    t -= 1
    return -0.5 * (a * 2 ** (10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p)) + b
  }
  t -= 1
  return a * 2 ** (-10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p) * 0.5 + c + b
}

// Back
export const easeInBack: EasingFunction = (t, b, c, d) => {
  const s = 1.70158
  t /= d
  return c * t * t * ((s + 1) * t - s) + b
}

export const easeOutBack: EasingFunction = (t, b, c, d) => {
  const s = 1.70158
  t /= d
  t--
  return c * (t * t * ((s + 1) * t + s) + 1) + b
}

export const easeInOutBack: EasingFunction = (t, b, c, d) => {
  let s = 1.70158
  t /= d / 2
  if (t < 1) {
    s *= 1.525
    return (c / 2) * (t * t * ((s + 1) * t - s)) + b
  }
  t -= 2
  s *= 1.525
  return (c / 2) * (t * t * ((s + 1) * t + s) + 2) + b
}

// Bounce
export const easeOutBounce: EasingFunction = (t, b, c, d) => {
  t /= d
  if (t < 1 / 2.75) {
    return c * (7.5625 * t * t) + b
  }
  else if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return c * (7.5625 * t * t + 0.75) + b
  }
  else if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return c * (7.5625 * t * t + 0.9375) + b
  }
  else {
    t -= 2.625 / 2.75
    return c * (7.5625 * t * t + 0.984375) + b
  }
}

export const easeInBounce: EasingFunction = (t, b, c, d) => {
  return c - easeOutBounce(d - t, 0, c, d) + b
}

export const easeInOutBounce: EasingFunction = (t, b, c, d) => {
  if (t < d / 2)
    return easeInBounce(t * 2, 0, c, d) * 0.5 + b
  return easeOutBounce(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b
}

/**
 * Object containing all easing functions
 *
 * Available easings: Linear, Quad, Cubic, Quart, Quint, Sine, Expo, Circ, Elastic, Back, Bounce
 * Each with In, Out, InOut variants (except Linear)
 */
export const Easing = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
} as const
