import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const root = join(import.meta.dir, '../../../..')
async function render(props: string) {
  return processDirectives(`<Checkbox ${props} />`, { __stx_inject_css: false }, join(root, 'switch-fixture.stx'), {
    ...defaultConfig,
    root,
    componentsDir: join(root, 'packages/components/src/ui/checkbox'),
    cache: false,
  }, new Set())
}

it('renders a native switch on the real checkbox, preserving labels and form participation', async () => {
  const html = await render('id="login" name="login" label="Launch at login" appearance="switch" checked disabled')
  const input = html.match(/<input\b[^>]*>/)?.[0] ?? ''
  expect(input).toContain('id="login"')
  expect(input).toContain('type="checkbox"')
  expect(input).toContain('switch role="switch"')
  expect(input).toContain('name="login"')
  expect(input).toMatch(/\bchecked\b/)
  expect(input).toMatch(/\bdisabled\b/)
  expect(input).toContain('aria-label="Launch at login"')
  expect(html).toContain('for="login"')
  expect(input).not.toContain('appearance=')
})

it('keeps the ordinary checkbox appearance by default', async () => {
  const input = (await render('label="Consent"')).match(/<input\b[^>]*>/)?.[0] ?? ''
  expect(input).not.toContain('role="switch"')
  expect(input).not.toMatch(/\sswitch(?:\s|>)/)
  expect(input).toContain('rounded border-line-strong')
})
