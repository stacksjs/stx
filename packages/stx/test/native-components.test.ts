import { afterAll, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = mkdtempSync(join(tmpdir(), 'stx-native-components-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

test.skipIf(process.platform !== 'darwin')('native packaging resolves installed component packages before rendering', async () => {
  mkdirSync(join(root, 'src'))
  mkdirSync(join(root, 'node_modules/@stacksjs'), { recursive: true })
  symlinkSync(resolve(import.meta.dir, '../../components'), join(root, 'node_modules/@stacksjs/components'))
  await Bun.write(join(root, 'src/app.stx'), '<html><head></head><body><Checkbox id="login" label="Launch at login" appearance="switch" /></body></html>')
  const source = join(import.meta.dir, '../src/native-build.ts')
  const child = Bun.spawn([process.execPath, '--eval', `
    import { buildNative } from ${JSON.stringify(source)};
    const result = await buildNative({ input: 'src/app.stx', name: 'Controls', output: 'dist', target: 'macos', craftPath: '/usr/bin/true', bundleStyle: 'launcher' });
    if (!result.success) throw new Error(result.error);
  `], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()])
  expect(code, stderr).toBe(0)
  const html = await Bun.file(join(root, 'dist/Controls.app/Contents/Resources/index.html')).text()
  expect(html).toContain('id="login"')
  expect(html).toContain('switch role="switch"')
  expect(html).not.toContain('could not be resolved')
}, 30000)
