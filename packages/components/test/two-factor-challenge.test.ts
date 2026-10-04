/**
 * TwoFactorChallenge renders one input per code digit.
 *
 * It looped with `@for(i in Array(codeLength).keys())`. `@for` compiles to a
 * plain JavaScript `for`, and `for…in` over an array iterator visits nothing -
 * an iterator has no enumerable keys - so the challenge rendered no inputs at
 * all and nobody could type a code. `stx typecheck` had been reporting the
 * loop variable as undeclared the whole time.
 */
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const DIR = path.join(ROOT, 'src/ui/auth')

async function render(tag: string): Promise<string> {
  const html = await processDirectives(
    tag,
    {},
    path.join(ROOT, 'two-factor-audit.stx'),
    { componentsDir: DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

describe('TwoFactorChallenge', () => {
  it('renders an input for every digit of the default code', async () => {
    const html = await render('<TwoFactorChallenge />')
    const ids = [...html.matchAll(/id="(code-\d+)"/g)].map(match => match[1])
    expect(ids.length).toBeGreaterThan(0)
    expect(ids).toEqual(ids.map((_, i) => `code-${i}`))
  })

  it('follows codeLength', async () => {
    const html = await render('<TwoFactorChallenge :codeLength="4" />')
    expect([...html.matchAll(/id="code-\d+"/g)]).toHaveLength(4)
  })
})
