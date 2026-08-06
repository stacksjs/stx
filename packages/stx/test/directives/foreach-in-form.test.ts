/**
 * `@foreach(item in items)` — the spelling the docs show — actually loops
 * (stacksjs/stx#1842).
 *
 * Two forms are documented. Blade's `items as item` worked; the JS-natural
 * `item in items`, which `docs/SCRIPT_VARIABLES.md` shows and which matches the
 * `:for="item in items"` client directive, did not.
 *
 * It failed silently, and that is the part that cost the reporter time. An
 * unrecognised binding was skipped with `continue`, so the directive text
 * survived into the built page and every `{{ }}` inside it resolved against a
 * variable that never existed. The page shipped
 * `data-variant-row="{{ p.id }}"` — a literal no selector matches and no
 * binding resolves — after a build that reported success.
 *
 * The report reads as two bugs, "the loop is not expanded" and "`{{ }}` is not
 * interpolated inside attributes". It is one: interpolation inside attributes
 * was never broken, as the `as` form demonstrates. The braces survived because
 * the loop never ran.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { parseLoopBinding } from '../../src/loops'
import { processDirectives } from '../../src/process'

const base = {
  ...defaultConfig,
  componentsDir: '/tmp',
  partialsDir: '/tmp',
  layoutsDir: '/tmp',
  autoShell: false,
} as never

function render(template: string, context: Record<string, unknown> = {}): Promise<string> {
  return processDirectives(template, context, '/app/page.stx', base, new Set<string>())
}

const ITEMS = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]

describe('the in form loops', () => {
  it('expands over a context variable', async () => {
    const out = await render('<section>@foreach(p in items)<div>{{ p.label }}</div>@endforeach</section>', { items: ITEMS })

    expect(out).toContain('<div>A</div>')
    expect(out).toContain('<div>B</div>')
  })

  it('expands over a <script server> variable', async () => {
    const out = await render(`<script server>
const items = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
</script>
<section>@foreach(p in items)<div>{{ p.label }}</div>@endforeach</section>`)

    expect(out).toContain('<div>A</div>')
    expect(out).toContain('<div>B</div>')
  })

  it('interpolates into attributes, which was never the separate bug', async () => {
    // The reported symptom: `data-variant-row="{{ p.id }}"` shipping literally.
    const out = await render('<section>@foreach(p in items)<div data-row="{{ p.id }}"></div>@endforeach</section>', { items: ITEMS })

    expect(out).toContain('data-row="a"')
    expect(out).toContain('data-row="b"')
    expect(out).not.toContain('{{')
  })

  it('leaves no directive text in the output', async () => {
    const out = await render('<section>@foreach(p in items)<i>{{ p.id }}</i>@endforeach</section>', { items: ITEMS })

    expect(out).not.toContain('@foreach')
    expect(out).not.toContain('@endforeach')
  })

  it('supports the parenthesised index binding', async () => {
    // Vue's `(item, index)`, which maps onto the comma form the item parser
    // already understood.
    const out = await render('<section>@foreach((p, i) in items)<i>{{ i }}:{{ p.id }}</i>@endforeach</section>', { items: ITEMS })

    expect(out).toContain('0:a')
    expect(out).toContain('1:b')
  })
})

describe('the as form is unchanged', () => {
  it('still expands', async () => {
    const out = await render('<section>@foreach(items as p)<div data-row="{{ p.id }}">{{ p.label }}</div>@endforeach</section>', { items: ITEMS })

    expect(out).toContain('data-row="a"')
    expect(out).toContain('<div data-row="b">B</div>')
  })

  it('still supports the index arrow', async () => {
    const out = await render('<section>@foreach(items as i => p)<i>{{ i }}:{{ p.id }}</i>@endforeach</section>', { items: ITEMS })

    expect(out).toContain('0:a')
  })
})

describe('a collection that is not server data', () => {
  it('says so at build time instead of only in a comment', async () => {
    // A plain <script> is CLIENT-side, so its const is not in scope here. The
    // inline comment is only visible to someone already reading built HTML —
    // which is how the reporter found it, after a successful build.
    const warnings: string[] = []
    const original = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(String(args[0])) }
    try {
      await render(`<script>
const items = [{ id: 'a' }]
</script>
<section>@foreach(p in items)<i>{{ p.id }}</i>@endforeach</section>`)
    }
    finally {
      console.warn = original
    }

    const message = warnings.find(w => w.includes('@foreach'))
    expect(message).toBeDefined()
    expect(message).toContain('script server')
  })
})

describe('parseLoopBinding', () => {
  it('reads both spellings, with the operands the right way round', () => {
    expect(parseLoopBinding('items as p')).toEqual({ arrayExpr: 'items', itemVar: 'p' })
    expect(parseLoopBinding('p in items')).toEqual({ arrayExpr: 'items', itemVar: 'p' })
  })

  it('unwraps a parenthesised binding', () => {
    expect(parseLoopBinding('(p, i) in items')).toEqual({ arrayExpr: 'items', itemVar: 'p, i' })
  })

  it('keeps the index arrow in the as form', () => {
    expect(parseLoopBinding('items as i => p')).toEqual({ arrayExpr: 'items', itemVar: 'i => p' })
  })

  it('handles an expression on either side', () => {
    expect(parseLoopBinding('p in user.posts')).toEqual({ arrayExpr: 'user.posts', itemVar: 'p' })
    expect(parseLoopBinding('Object.keys(o) as k')).toEqual({ arrayExpr: 'Object.keys(o)', itemVar: 'k' })
  })

  it('rejects what is not a binding, so prose is left alone', () => {
    // The skip path exists so text like "@foreach (Blade-style)" is not
    // mistaken for a directive.
    expect(parseLoopBinding('Blade-style')).toBeNull()
    expect(parseLoopBinding('')).toBeNull()
  })
})
