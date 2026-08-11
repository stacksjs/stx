/**
 * `import x from 'y'` binds the default export, not the namespace (#1910).
 *
 * `convertToCommonJS` rewrote it to `const x = await import('y')`, which binds
 * the module NAMESPACE. Every property read off it was `undefined` — no throw,
 * no warning — so a config module read as entirely empty and whatever it gated
 * quietly turned itself off. The named-import branch beside it was correct all
 * along, which is why this survived.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { renderTemplate } from '../../src/render'

const dir = `${import.meta.dir}/.tmp-default-import`

// The modules the fixtures import outlive each render, so they are cleared once
// at the end rather than per case. Without this the directory survives the run
// and turns up as untracked files in the repository.
afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function renderWith(script: string): Promise<string> {
  await Bun.write(`${dir}/mod.ts`, `export default { github: { clientId: 'GH_ID' } }\n`)
  await Bun.write(`${dir}/cjs-mod.ts`, `module.exports = { plain: 'NO_DEFAULT' }\n`)
  const page = `${dir}/page-${crypto.randomUUID()}.stx`
  await Bun.write(page, `<script server>\n${script}\n</script>\n<p>{{ out }}</p>`)

  try {
    const html = await renderTemplate(page, { context: {} } as any)
    return (html.match(/<p>([^<]*)<\/p>/) ?? [])[1] ?? ''
  }
  finally {
    await Bun.file(page).delete().catch(() => {})
  }
}

describe('a default import in a server block', () => {
  it('reads the default export, not the namespace', async () => {
    expect(await renderWith(`import services from './mod'
const out = services?.github?.clientId ?? 'UNDEFINED'`)).toBe('GH_ID')
  })

  it('agrees with the hand-written spelling', async () => {
    // The two forms have to mean the same thing, or the documented one is a
    // trap for anyone who writes it.
    const statik = await renderWith(`import services from './mod'
const out = services?.github?.clientId ?? 'UNDEFINED'`)
    const manual = await renderWith(`const services = (await import('./mod')).default
const out = services?.github?.clientId ?? 'UNDEFINED'`)

    expect(statik).toBe(manual)
  })

  it('reads a CommonJS module too', async () => {
    /*
     * Measured rather than assumed: Bun synthesises `.default` for a CJS module
     * as well, set to its `module.exports`. An earlier version of the fix
     * carried a `?? namespace` fallback for the case where it does not, and
     * this test passed with or without it — the branch was unreachable, so the
     * test was asserting nothing. The fallback is gone; this pins that the
     * plain form still reads a CJS module correctly.
     */
    expect(await renderWith(`import cjs from './cjs-mod'
const out = cjs?.plain ?? 'UNDEFINED'`)).toBe('NO_DEFAULT')
  })

  it('leaves a named import working', async () => {
    await Bun.write(`${dir}/named.ts`, `export const token = 'NAMED_OK'\n`)

    expect(await renderWith(`import { token } from './named'
const out = token`)).toBe('NAMED_OK')
  })
})
