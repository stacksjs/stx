import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const options = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  layoutsDir: '/tmp',
  autoShell: false,
} as never

describe('component props inside reactive loops', () => {
  it('keeps compound row expressions in the browser-owned loop scope', async () => {
    const html = await processDirectives(
      `<ul><li :for="platform in integrations"><Image x-src="platform.logo" x-alt="platform.name + ' logo'" width="64" height="64" /></li></ul>`,
      { platform: {} },
      '/app/page.stx',
      options,
      new Set<string>(),
    )

    expect(html).toContain(':src="platform.logo"')
    expect(html).toContain(':alt="platform.name + \' logo\'"')
    expect(html).not.toContain('alt="undefined logo"')
  })
})

describe('component props built from client values', () => {
  it('binds an expression naming a client signal rather than baking its server result', async () => {
    const html = await processDirectives(
      `<Image x-src="cover" x-alt="remainingLabel + ' left'" width="64" height="64" />`,
      { cover: '/a.png' },
      '/app/page.stx',
      options,
      new Set<string>(),
    )

    expect(html).toContain(':alt="remainingLabel + \' left\'"')
    expect(html).not.toContain('undefined left')
    // A value the server has, and globals, still render on the server.
    expect(html).toContain('src="/a.png"')
  })
})
