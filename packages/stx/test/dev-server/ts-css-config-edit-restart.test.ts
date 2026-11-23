/**
 * An edit to the css config reaches the stylesheet after a restart
 * (stacksjs/stx#2223).
 *
 * Reported against the dev server: after a preflight and a theme font were
 * added to `config/css.ts`, three restarts kept serving the stylesheet from
 * before, until the cache folders were deleted. A `html, body { … }` preflight
 * was also seen missing beside a `:root { … }` one in the same string.
 *
 * The on-disk cache is keyed on a fingerprint of the resolved config, so each
 * process here generates the page's CSS with a cache already holding the last
 * one's: the edit has to show up, and both preflight selectors with it.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { createTempDir } from '../../src/temp-dir'

const app = createTempDir('stx-css-edit-')
const generator = path.join(app, 'generate.ts')
const engine = path.resolve(import.meta.dir, '../../src/dev-server/ts-css.ts')

afterAll(() => fs.rmSync(app, { recursive: true, force: true }))

function writeConfig(word: string): void {
  fs.mkdirSync(path.join(app, 'config'), { recursive: true })
  fs.writeFileSync(path.join(app, 'config', 'css.ts'), `export default {
  preflights: [{ getCSS: () => ':root { --probe: ${word}; } html, body { --both: ${word}; }' }],
  theme: { extend: { fontFamily: { probe: ['Probe${word}'] } } },
}
`)
}

/** The page's CSS, from a process of its own: a restart. */
async function generateInNewProcess(): Promise<string> {
  const proc = Bun.spawn(['bun', generator, app], { cwd: app, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, STACKS_DEV_QUIET: '1' } })
  const [out] = await Promise.all([new Response(proc.stdout).text(), proc.exited])
  return out
}

describe('a css config edit between two dev server processes', () => {
  it('is in the stylesheet the second one serves', async () => {
    fs.writeFileSync(generator, `import { generateCss } from ${JSON.stringify(engine)}
process.stdout.write(await generateCss('<div class="font-probe p-1"></div>', process.argv[2]))
`)
    writeConfig('one')
    const before = await generateInNewProcess()
    expect(before).toContain('--probe: one')
    expect(before).toContain('--both: one')
    expect(before).toContain('Probeone')
    // The first process left its stylesheet in the app's cache.
    const cached = fs.readdirSync(path.join(app, '.stx', 'cache')).filter(name => name.startsWith('cw-'))
    expect(cached.length).toBeGreaterThan(0)

    writeConfig('two')
    const after = await generateInNewProcess()
    expect(after).toContain('--probe: two')
    expect(after).toContain('--both: two')
    expect(after).toContain('Probetwo')
    expect(after).not.toContain('Probeone')
  }, 60_000)
})
