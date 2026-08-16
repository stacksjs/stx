/**
 * Server-side template injection: a value is data, never a template.
 *
 * The render pipeline runs more than one expression pass over composed output -
 * a loop body is processed per iteration and the finished page again, a section
 * is spliced into its layout, an include into its parent. So whatever one pass
 * emits, the next one reads.
 *
 * Before `escapeHtmlValue` existed, that meant any value carrying `{{ }}` was
 * evaluated on the second pass, against the page's own scope. Reproduced in a
 * real application first: a repository description of `probe {{ 6*7 }} here`
 * rendered as `probe 42 here`, and one of `{{ ownerHandle }}` printed the
 * view's own local variable. Every field a person can type into was a vector -
 * descriptions, issue titles, branch names.
 *
 * The tests below are written against the two passes rather than the primitive,
 * because one pass was always safe and that is precisely why the hole survived.
 */
import { describe, expect, it } from 'bun:test'
import { escapeHtmlValue, processExpressions } from '../../src/expressions'
import { processLoops } from '../../src/loops'

describe('a value carrying template syntax', () => {
  it('survives a second expression pass without being evaluated', () => {
    const once = processExpressions('<p>{{ description }}</p>', { description: 'probe {{ 6*7 }} here' }, 'probe.stx')
    const twice = processExpressions(once, { description: 'probe {{ 6*7 }} here' }, 'probe.stx')

    expect(twice).not.toContain('42')
    // The reader still sees the braces: character references, joined by a
    // zero-width word joiner so the client runtime cannot read the decoded text
    // as a mustache either.
    expect(twice).toContain('&#123;&#8288;&#123;')
  })

  it('cannot read the page scope on the second pass', () => {
    const context = { description: '{{ secret }}', secret: 'sk-live-000' }

    const once = processExpressions('<p>{{ description }}</p>', context, 'probe.stx')
    const twice = processExpressions(once, context, 'probe.stx')

    expect(twice).not.toContain('sk-live-000')
  })

  it('is inert when a loop emits it and the outer pass runs over the page', async () => {
    // The exact shape that was exploitable: `@foreach` processes each row, and
    // `process.ts` then processes the whole composed output.
    const context: any = { rows: [{ text: 'probe {{ 6*7 }} end' }], secret: 'sk-live-000' }

    const afterLoop = String(await processLoops('@foreach (rows as row)<p>{{ row.text }}</p>@endforeach', context, 'probe.stx'))
    const afterPage = processExpressions(afterLoop, context, 'probe.stx')

    expect(afterPage).not.toContain('42')
  })

  it('cannot reach a value the loop did not have, either', async () => {
    const context: any = { rows: [{ text: '{{ secret }}' }], secret: 'sk-live-000' }

    const afterLoop = String(await processLoops('@foreach (rows as row)<p>{{ row.text }}</p>@endforeach', context, 'probe.stx'))
    const afterPage = processExpressions(afterLoop, context, 'probe.stx')

    expect(afterPage).not.toContain('sk-live-000')
  })
})

describe('escaping a value', () => {
  it('escapes markup, and the braces that open template syntax', () => {
    // The closing braces are left alone deliberately: without an opening `{{`
    // they are inert, and every brace this does not touch is output that stays
    // byte for byte what it was.
    expect(escapeHtmlValue('<b>{{ x }}</b>')).toBe('&lt;b&gt;&#123;&#8288;&#123; x }}&lt;/b&gt;')
  })

  it('encodes the whole run, so a triple brace cannot leave a double behind', () => {
    expect(escapeHtmlValue('{{{ x }}}')).toBe('&#123;&#8288;&#123;&#8288;&#123; x }}}')
  })

  it('and the raw form too', () => {
    expect(escapeHtmlValue('{!! x !!}')).toBe('&#123;&#8288;!! x !!}')
  })

  /*
   * The half the references alone did not cover.
   *
   * A browser decodes `&#123;&#123;` back to `{{`, and the client runtime binds
   * by scanning text for mustaches - so the value was evaluated again in the
   * visitor's browser, turning a stored description into cross-site scripting.
   * The joiner is zero-width and non-breaking: the reader sees `{{ x }}` and
   * no scanner does.
   */
  it('separates the braces in the DOM the browser will build', () => {
    const decoded = escapeHtmlValue('{{ x }}')
      .replace(/&#123;/g, '{')
      .replace(/&#8288;/g, '\u2060')

    expect(decoded).not.toMatch(/\{\{/)
    expect(decoded.replace(/\u2060/g, '')).toBe('{{ x }}')
  })

  it('leaves ordinary text alone', () => {
    expect(escapeHtmlValue('a normal description')).toBe('a normal description')
  })

  it('leaves a lone brace exactly as it was, so JSON is untouched', () => {
    // A security fix should not rewrite everybody's output as the price. A
    // JSON value carries no `{{`, so nothing here needs encoding at all.
    expect(escapeHtmlValue('{\"a\":1}')).toBe('{&quot;a&quot;:1}')
  })
})
