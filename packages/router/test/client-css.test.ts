/**
 * Regression tests for the router's injected CSS — progress bar styles and
 * the default View Transitions fade+slide. The CSS lives inside a string
 * literal in getRouterScript(), so these tests lock in the shape so the
 * framework can't accidentally drop transitions or defaults.
 */

import { describe, expect, it } from 'bun:test'
import { getRouterScript } from '../src/client'

describe('getRouterScript — injected CSS defaults', () => {
  const script = getRouterScript()

  it('always includes the progress-bar CSS', () => {
    // Progress bar is opt-out via { progress: false }, but the CSS is always
    // emitted so the fixed-position + transitions exist at runtime.
    expect(script).toContain('#stx-router-progress')
    expect(script).toContain('position:fixed')
    expect(script).toContain('transform:scaleX(0)')
  })

  it('ships the default View Transitions fade+slide CSS', () => {
    // Framework-default transition keyframes — apps get smooth SPA fades
    // for free the moment they ship the router (no extra CSS needed).
    expect(script).toContain('::view-transition-old(root)')
    expect(script).toContain('::view-transition-new(root)')
    expect(script).toContain('stx-r-fade-out')
    expect(script).toContain('stx-r-fade-in')
    expect(script).toContain('@keyframes stx-r-fade-out')
    expect(script).toContain('@keyframes stx-r-fade-in')
  })

  it('respects prefers-reduced-motion', () => {
    // Framework-level accessibility: users who opted into reduced motion
    // get instant swaps, no slide.
    expect(script).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('exposes viewTransitionDuration + viewTransitionEasing for app override', () => {
    // These read from the config at runtime, so apps can tune the fade.
    expect(script).toContain('viewTransitionDuration')
    expect(script).toContain('viewTransitionEasing')
    // And sane defaults when unset
    expect(script).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
  })

  it('guards the view-transition CSS behind viewTransitions:true AND browser support', () => {
    // The runtime check prevents dead CSS on browsers without the API,
    // and respects opt-out via { viewTransitions: false }.
    expect(script).toMatch(/o\.viewTransitions\s*&&\s*['"]startViewTransition['"]\s+in\s+document/)
  })

  it('progress-bar color and height come from the config', () => {
    // Apps set progressColor + progressHeight via stx.config.ts or
    // window.__stxRouterConfig. Defaults are defined in the IIFE.
    expect(script).toContain('progressColor')
    expect(script).toContain('progressHeight')
    expect(script).toMatch(/progressColor:\s*['"]#78dce8['"]/)
    expect(script).toMatch(/progressHeight:\s*['"]2px['"]/)
  })

  it('ID-guards the injected style tag so SPA navs don\'t duplicate it', () => {
    expect(script).toContain("getElementById('stx-r-css')")
  })
})
