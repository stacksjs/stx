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
