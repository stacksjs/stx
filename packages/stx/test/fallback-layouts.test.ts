// A framework ships default layouts; an app overrides the ones it cares about.
//
// Without a fallback, an app that defines one layout has to vendor every other
// layout it uses, and a page extending a framework layout renders with NO
// layout at all. That failure is a 200 with an empty body - the sections have
// nowhere to render into - which is far harder to diagnose than a 404, and is
// exactly how a whole staff dashboard shipped blank to production.

import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveTemplatePath } from '../src/utils'

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'stx-layouts-'))
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, body)
  }
  return root
}

describe('fallbackLayoutsDir', () => {
  test('finds a layout the app does not define', async () => {
    const root = tree({
      'app/layouts/marketing.stx': '<html></html>',
      'defaults/layouts/default.stx': '<html>framework</html>',
      'app/views/page.stx': '@extends(\'layouts/default\')',
    })

    const resolved = await resolveTemplatePath('layouts/default', join(root, 'app/views/page.stx'), {
      layoutsDir: join(root, 'app/layouts'),
      fallbackLayoutsDir: join(root, 'defaults/layouts'),
    } as never)

    expect(resolved).toBe(join(root, 'defaults/layouts/default.stx'))
  })

  test('the app still wins for a layout it does define', async () => {
    // The point of shipping defaults is that they can be overridden. If the
    // fallback won, an app could never replace a framework layout.
    const root = tree({
      'app/layouts/default.stx': '<html>app</html>',
      'defaults/layouts/default.stx': '<html>framework</html>',
      'app/views/page.stx': '@extends(\'layouts/default\')',
    })

    const resolved = await resolveTemplatePath('layouts/default', join(root, 'app/views/page.stx'), {
      layoutsDir: join(root, 'app/layouts'),
      fallbackLayoutsDir: join(root, 'defaults/layouts'),
    } as never)

    expect(resolved).toBe(join(root, 'app/layouts/default.stx'))
  })

  test('resolves a nested layout name', async () => {
    const root = tree({
      'app/layouts/marketing.stx': '<html></html>',
      'defaults/layouts/dashboard/default.stx': '<html>dashboard</html>',
      'app/views/page.stx': '@extends(\'layouts/dashboard/default\')',
    })

    const resolved = await resolveTemplatePath('layouts/dashboard/default', join(root, 'app/views/page.stx'), {
      layoutsDir: join(root, 'app/layouts'),
      fallbackLayoutsDir: join(root, 'defaults/layouts'),
    } as never)

    expect(resolved).toBe(join(root, 'defaults/layouts/dashboard/default.stx'))
  })

  test('stays null when neither directory has it', async () => {
    const root = tree({
      'app/layouts/marketing.stx': '<html></html>',
      'defaults/layouts/default.stx': '<html></html>',
      'app/views/page.stx': '@extends(\'layouts/nope\')',
    })

    const resolved = await resolveTemplatePath('layouts/nope', join(root, 'app/views/page.stx'), {
      layoutsDir: join(root, 'app/layouts'),
      fallbackLayoutsDir: join(root, 'defaults/layouts'),
    } as never)

    expect(resolved).toBeNull()
  })

  test('changes nothing when no fallback is configured', async () => {
    const root = tree({
      'app/layouts/marketing.stx': '<html></html>',
      'app/views/page.stx': '@extends(\'layouts/default\')',
    })

    const resolved = await resolveTemplatePath('layouts/default', join(root, 'app/views/page.stx'), {
      layoutsDir: join(root, 'app/layouts'),
    } as never)

    expect(resolved).toBeNull()
  })
})
