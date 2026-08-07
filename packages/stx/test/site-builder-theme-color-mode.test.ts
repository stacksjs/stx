import { describe, expect, it } from 'bun:test'
import { injectThemeBootstrap } from '../src/site-builder/theme'

/**
 * The site theme and `useColorMode` are two owners of the same `dark` class.
 *
 * `useColorMode` (and `useDark`, which wraps it) read `window.__STX_COLOR_MODE__`
 * for their storage key and initial mode, falling back to 'stx-color-mode' and
 * 'auto' when nothing sets it. Nothing set it.
 *
 * So a site that configured `site.theme` and then called `useDark()` anywhere
 * had the guard apply the configured theme pre-paint and useColorMode's
 * applyDOM strip the class again on the OS preference. The configured theme
 * lost on every load, including for visitors who had explicitly chosen one.
 *
 * A single `useDark()` at module scope in an auto-imported file was enough to
 * trigger it, with no call site in the app's own templates.
 */

const BASE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>t</title></head>
<body><main>x</main></body>
</html>`

function bootObject(html: string): Record<string, unknown> {
  const guard = html.match(/<script data-stx-theme-guard="1">([\s\S]*?)<\/script>/)
  if (!guard)
    throw new Error('theme guard not injected')

  const seed = guard[1].match(/window\.__STX_COLOR_MODE__=window\.__STX_COLOR_MODE__\|\|(\{.*?\});/)
  if (!seed)
    throw new Error('color-mode boot object not seeded by the guard')

  return JSON.parse(seed[1])
}

describe('theme bootstrap seeds the color-mode boot object', () => {
  it('hands useColorMode the same storage key the guard writes', () => {
    const html = injectThemeBootstrap(BASE_HTML, {
      theme: { default: 'dark', storageKey: 'erba-theme' },
    } as any)

    // One key, so neither system can read a value the other never wrote.
    expect(bootObject(html).storageKey).toBe('erba-theme')
    expect(html).toContain('"erba-theme"')
  })

  it('hands it the same default, so an unset preference resolves the same way', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark' } } as any)
    const boot = bootObject(html)

    // Previously this was 'auto' inside useColorMode: on a machine set to
    // light, a site configured dark rendered light.
    expect(boot.initialMode).toBe('dark')
    expect(boot.darkClass).toBe('dark')
  })

  it('carries an explicit light default through too', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'light' } } as any)
    expect(bootObject(html).initialMode).toBe('light')
  })

  it('passes auto through unchanged, which is the OS-preference case', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'auto' } } as any)
    expect(bootObject(html).initialMode).toBe('auto')
  })

  it('falls back to the guard defaults when theme is left empty', () => {
    const boot = bootObject(injectThemeBootstrap(BASE_HTML, { theme: {} } as any))

    expect(boot.storageKey).toBe('theme')
    expect(boot.initialMode).toBe('dark')
  })

  it('does not clobber a boot object the app set for itself', () => {
    // `||=` semantics: an app that configures useColorMode directly still wins.
    const guard = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark' } } as any)
    expect(guard).toContain('window.__STX_COLOR_MODE__=window.__STX_COLOR_MODE__||')
  })

  it('stays out of the way when theme is disabled', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: false } as any)
    expect(html).not.toContain('__STX_COLOR_MODE__')
  })
})
