/**
 * A substituted VALUE is data, and a later pass must not read it as a directive.
 *
 * Expression passes run again over component expansion and over loop bodies, so
 * whatever a value contains gets a second look. `{{` in a value was already
 * neutralised; `@` was not, so `@if(true)X@endif` in a loop item had its X
 * rendered, and the same value in a server-evaluated component prop reached the
 * page as markup. A bare `@endif` needs no parentheses to matter either: inside
 * a conditional it closes the block it sits in.
 *
 * The `@` is emitted as `&#64;`, which the browser decodes, so what a reader
 * sees does not change -- these tests decode it the same way before asserting
 * the text survived.
 *
 * The rules live in one place (template-syntax-escape.ts) because two modules
 * escape values and they have to agree: expressions.ts for template output and
 * server-components.ts for its own substitution.
 */
import { describe, expect, it } from 'bun:test'
import { neutralizeTemplateSyntax } from '../../src/template-syntax-escape'
import { processDirectives } from '../../src/process'

const render = async (template: string, context: Record<string, unknown>): Promise<string> =>
  (await processDirectives(template, context, '/tmp/directive-in-value.stx', {}, new Set<string>())).trim()

/** What the browser does with the reference before anything reads the text. */
const decodeCharRefs = (html: string): string => html.replace(/&#64;/g, '@').replace(/&#123;/g, '{').replace(/&#8288;/g, '')

describe('directive text in a value is not run', () => {
  it('leaves a directive in a loop item as text', async () => {
    const out = await render(
      '@foreach(items as i)<p>{{ i }}</p>@endforeach',
      { items: ['@if(true)X@endif'] },
    )
    // Before: the @if was evaluated and the row rendered just <p>X</p>.
    expect(out).not.toBe('<p>X</p>')
    expect(decodeCharRefs(out)).toBe('<p>@if(true)X@endif</p>')
  })

  it('leaves a directive in a server-evaluated component prop as text', async () => {
    const { mkdirSync, mkdtempSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const path = (await import('node:path')).default

    const dir = mkdtempSync(path.join(tmpdir(), 'stx-directive-prop-'))
    mkdirSync(path.join(dir, 'components'), { recursive: true })
    writeFileSync(path.join(dir, 'components', 'Card.stx'), '<div>[{{ t }}]</div>')

    const out = (await processDirectives(
      '<Card :t="value" />',
      { value: '@if(1)INJ@endif' },
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
      new Set<string>(),
    )).replace(/<link[^>]*>/g, '').trim()

    expect(out).not.toContain('[INJ]')
    expect(decodeCharRefs(out)).toBe('<div>[@if(1)INJ@endif]</div>')
  })

  it('does not let a value close the block it sits in', async () => {
    const out = await render('@if(true)[{{ v }}]@endif', { v: 'X@endif' })
    expect(decodeCharRefs(out)).toBe('[X@endif]')
  })

  it('neutralises a directive that lands in an attribute value', async () => {
    const out = await render('<div data-x="{{ v }}"></div>', { v: '@if(1)Y@endif' })
    expect(decodeCharRefs(out)).toBe('<div data-x="@if(1)Y@endif"></div>')
  })

  it('leaves ordinary text with an @ in it alone', async () => {
    expect(await render('<p>{{ v }}</p>', { v: 'first@example.com' })).toBe('<p>first@example.com</p>')
    expect(await render('<p>{{ v }}</p>', { v: 'ping @someone soon' })).toBe('<p>ping @someone soon</p>')
    expect(await render('<p>{{ v }}</p>', { v: '5 @ 3 each' })).toBe('<p>5 @ 3 each</p>')
  })
})

describe('neutralizeTemplateSyntax', () => {
  it('encodes a directive call and the block keywords', () => {
    expect(neutralizeTemplateSyntax('@if(x)')).toBe('&#64;if(x)')
    expect(neutralizeTemplateSyntax('@foreach (a as b)')).toBe('&#64;foreach (a as b)')
    for (const keyword of ['@endif', '@endforeach', '@else', '@elseif', '@empty', '@case', '@default', '@break', '@continue', '@fallback'])
      expect(neutralizeTemplateSyntax(keyword)).toBe(`&#64;${keyword.slice(1)}`)
  })

  it('encodes a keyword that follows a word character, which used to slip through', () => {
    expect(neutralizeTemplateSyntax('X@endif')).toBe('X&#64;endif')
  })

  it('leaves an @ that begins nothing directive-shaped', () => {
    for (const text of ['first@example.com', 'ping @someone', '5 @ 3', 'a@b', '@'])
      expect(neutralizeTemplateSyntax(text)).toBe(text)
  })

  it('still breaks mustache runs and the raw form', () => {
    expect(neutralizeTemplateSyntax('{{ x }}')).toBe('&#123;&#8288;&#123; x }}')
    expect(neutralizeTemplateSyntax('{!! x !!}')).toBe('&#123;&#8288;!! x !!}')
  })

  it('is idempotent enough to survive a second pass', () => {
    // The output holds no `@` before a directive name and no brace run, so
    // running it again changes nothing.
    const once = neutralizeTemplateSyntax('@if(true){{ x }}@endif')
    expect(neutralizeTemplateSyntax(once)).toBe(once)
  })
})
