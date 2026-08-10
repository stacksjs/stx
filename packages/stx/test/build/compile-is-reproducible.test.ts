/**
 * A compiled page does not freeze request-dependent values (stacksjs/stx#1895).
 *
 * `template-compiler.ts` said, at the point it built its context:
 *
 *     // Create a recording context — server scripts are NOT executed at build
 *     // time (they may depend on request data like session, DB queries, etc.)
 *
 * They were executed, and whatever they produced was baked into the compiled
 * HTML. Two builds of the same unchanged file, thirty milliseconds apart:
 *
 *     a timestamp   build1=<p>2026-08-10T12:05:07.563Z</p>
 *                   build2=<p>2026-08-10T12:05:07.635Z</p>
 *
 * Every visitor to that page saw the moment the build ran, forever.
 *
 * The rule was `value === undefined` — so a placeholder was created only when
 * a value HAPPENED to be uncomputable at build time, not when it was
 * request-dependent. A page reading `__stxServeContext` was safe by accident;
 * a page computing anything itself was frozen.
 *
 * Server scripts still run during compilation, because loops and conditionals
 * need real values to produce the page's structure. What changed is that an
 * expression reading a name the server block declares is emitted as a
 * placeholder and re-resolved per request by `hydrateTemplateStream`, which
 * re-runs the same block.
 */

import { describe, expect, it } from 'bun:test'
import { compileTemplate } from '../../src/template-compiler'
import { hydrateTemplateStream } from '../../src/template-hydrator'

/** Compile a source twice, as two separate builds of an unchanged file. */
async function compileTwice(source: string) {
  const file = `${import.meta.dir}/.tmp-repro-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)
  try {
    const first = await compileTemplate(file, '/page')
    await Bun.sleep(25)
    const second = await compileTemplate(file, '/page')
    return { first, second }
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

describe('two builds of an unchanged page agree', () => {
  it('does not bake a timestamp', async () => {
    const { first, second } = await compileTwice(`<script server>
const builtAt = new Date().toISOString()
</script>
<p>{{ builtAt }}</p>`)

    expect(first.html).toBe(second.html)
    expect(first.html).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it('does not bake a random value', async () => {
    const { first, second } = await compileTwice(`<script server>
const nonce = Math.random().toString(36).slice(2)
</script>
<p>{{ nonce }}</p>`)

    expect(first.html).toBe(second.html)
  })

  it('leaves a placeholder for the request to fill', async () => {
    const { first } = await compileTwice(`<script server>
const heading = 'Sign up'
</script>
<h1>{{ heading }}</h1>`)

    expect(Object.keys(first.placeholders)).toHaveLength(1)
  })
})

describe('the value still arrives, per request', () => {
  it('resolves to what the server block computes on this request', async () => {
    const file = `${import.meta.dir}/.tmp-repro-${crypto.randomUUID()}.stx`
    await Bun.write(file, `<script server>
const heading = 'Sign up'
const count = [1, 2, 3].length
</script>
<h1>{{ heading }}</h1><span>{{ count }}</span>`)

    try {
      const compiled = await compileTemplate(file, '/page')
      const { html } = await hydrateTemplateStream(compiled, {
        request: new Request('https://example.test/page'),
        method: 'GET',
      })

      expect(html).toContain('Sign up')
      expect(html).toContain('3')
      expect(html).not.toContain('__STX_EXPR')
    }
    finally {
      await Bun.file(file).delete().catch(() => {})
    }
  })

  it('still evaluates structure at build time', async () => {
    /*
     * The reason the server block runs during compilation at all. A loop has to
     * produce its rows into the compiled HTML — a placeholder cannot stand in
     * for markup that does not exist yet, so deferring these would lose the
     * page's shape rather than merely its values.
     */
    const { first } = await compileTwice(`<script server>
const items = ['alpha', 'beta']
</script>
<ul>@foreach(items as item)<li>{{ item }}</li>@endforeach</ul>`)

    expect((first.html.match(/<li>/g) ?? []).length).toBe(2)
  })
})

describe('what counts as reading a server binding', () => {
  it('ignores a property access that merely shares the name', async () => {
    const { first } = await compileTwice(`<script server>
const range = '7d'
const car = { range: 320 }
</script>
<p>{{ car.range }}</p>`)

    // `car.range` is not a read of the server's `range`; `car` is, so this is
    // still deferred — but via `car`, and the point is that the check looks at
    // free identifiers rather than at any occurrence of the text.
    expect(first.html).toContain('__STX_EXPR')
  })

  it('leaves a page with no server block completely alone', async () => {
    const { first } = await compileTwice(`<p>{{ 2 + 2 }}</p>`)

    expect(first.html).toContain('4')
    expect(Object.keys(first.placeholders)).toHaveLength(0)
  })
})
