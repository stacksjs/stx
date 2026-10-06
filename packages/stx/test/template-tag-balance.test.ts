/**
 * Tests for the dev-mode template tag-balance check (stacksjs/stx#1769).
 *
 * A dropped closing tag (e.g. a missing </div>) is auto-closed at EOF and
 * silently re-parents the following siblings inside the unclosed element,
 * blanking the page with no error at any layer. These verify the coarse
 * open/close count catches that while staying false-positive-free on void
 * elements, optional-close elements, self-closing components, and tags that
 * appear inside scripts/styles/comments/interpolations/attributes.
 */
import { describe, expect, it, spyOn } from 'bun:test'
import { processDirectives } from '../src/process'
import { findUnbalancedTags, warnUnbalancedTags } from '../src/template-tag-balance'

describe('findUnbalancedTags (#1769)', () => {
  it('flags a dropped closing tag', () => {
    const issues = findUnbalancedTags(`<div><div x-show="a"><p>A</p><div x-show="b"><p>B</p></div></div>`)
    expect(issues).toHaveLength(1)
    expect(issues[0].tag).toBe('div')
    expect(issues[0].opened).toBe(3)
    expect(issues[0].closed).toBe(2)
    expect(issues[0].firstOpenLine).toBe(1)
  })

  it('is silent for balanced markup', () => {
    expect(findUnbalancedTags(`<div><section><p>hi</p></section></div>`)).toEqual([])
  })

  it('ignores void elements', () => {
    expect(findUnbalancedTags(`<div><br><img src="x"><input></div>`)).toEqual([])
  })

  it('ignores self-closing components', () => {
    expect(findUnbalancedTags(`<div><Icon name="x" /><Foo-Bar /></div>`)).toEqual([])
  })

  it('ignores optional-close elements (li / td / p)', () => {
    expect(findUnbalancedTags(`<ul><li>a<li>b</ul><table><tr><td>x<td>y</table>`)).toEqual([])
  })

  it('ignores tags inside scripts, styles, and comments', () => {
    expect(findUnbalancedTags(`<div><script>if(a<b){}</script><style>.x>.y{}</style><!-- <div> --></div>`)).toEqual([])
  })

  it('ignores > inside attributes and {{ }} interpolations', () => {
    expect(findUnbalancedTags(`<div title="a > b">{{ a > b }}<span>x</span></div>`)).toEqual([])
    expect(findUnbalancedTags(`<div title='a > b'><span>x</span></div>`)).toEqual([])
  })

  it('does not treat apostrophes in text as attribute quotes', () => {
    const template = `<main><article><p>browser's <strong>own</strong> vendor's sync.</p><a href="/policy">GitHub's policy</a></article></main>`
    expect(findUnbalancedTags(template)).toEqual([])
  })

  it('flags an unbalanced component tag (case preserved)', () => {
    const issues = findUnbalancedTags(`<div><StxLink to="/a"><span>x</span></div>`)
    expect(issues.some(i => i.tag === 'StxLink' && i.opened === 1 && i.closed === 0)).toBe(true)
  })

  it('flags a stray closing tag', () => {
    const issues = findUnbalancedTags(`<div><span>x</span></div></div>`)
    expect(issues[0].tag).toBe('div')
    expect(issues[0].closed).toBeGreaterThan(issues[0].opened)
  })

  /*
   * stacksjs/stx#2039: a `<` outside markup must not start a tag match.
   *
   * It was reported as a well-formed 579-line page warning about two stray
   * `</div>`, with three openings dropped from the count and only one of their
   * closers -- which read as false `@if` branches being stripped before
   * counting. This check cannot do that: it runs on the raw template before
   * any processing. The real cause is that `<` followed by a letter began a
   * tag match that ran to the next `>`, which belonged to the following REAL
   * opening tag, consuming it:
   *
   *     <limit)\n<div class="wrap">   was counted once, as <limit>
   *
   * One open vanished per swallow and a close only when the consumed span
   * held one, which is exactly the asymmetry that was measured.
   *
   * The cost of this shape of bug is that it trains people to ignore the
   * warning -- the one thing that would catch a genuinely malformed page --
   * so the cases below check both halves: silent on the comparison, and still
   * loud when the same file is actually unbalanced.
   */
  it('does not let a < comparison outside markup swallow a tag', () => {
    const balanced = '@if (count<limit)\n<div class="wrap">\n  <div class="inner">x</div>\n</div>\n@endif\n'

    expect(findUnbalancedTags(balanced)).toEqual([])
  })

  it('still reports a real imbalance in a file that also has one', () => {
    const broken = '@if (count<limit)\n<div class="wrap">\n@endif\n'
    const issue = findUnbalancedTags(broken).find(i => i.tag === 'div')

    expect(issue).toMatchObject({ tag: 'div', opened: 1, closed: 0 })
  })

  it('counts the tag that follows the comparison, not a phantom one', () => {
    // The phantom was named after whatever followed the `<`, so a report could
    // name a tag that does not exist in the file at all.
    const issues = findUnbalancedTags('@if (a<b)\n<section>x</section>\n')

    expect(issues.map(i => i.tag)).toEqual([])
  })

  it('keeps accurate line numbers past neutralised regions', () => {
    const tpl = `<div>\n<script>\n<div>\n</script>\n<section>\n<div>\n</div>\n<span>x</span>`
    const issues = findUnbalancedTags(tpl)
    // the <div> inside <script> is ignored; the outer <div> on line 1 is unclosed
    expect(issues.find(i => i.tag === 'div')?.firstOpenLine).toBe(1)
  })
})

describe('warnUnbalancedTags (#1769)', () => {
  it('warns with a helpful, file-labelled message', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    warnUnbalancedTags(`<div><div x-show="a"><p>A</p></div>`, '/x/SettingsTab.stx')
    const msg = warn.mock.calls.map(c => c.join(' ')).join('\n')
    expect(msg).toContain('SettingsTab.stx')
    expect(msg).toContain('<div>')
    expect(msg).toMatch(/opened/)
    warn.mockRestore()
  })

  it('does not throw and stays silent on balanced input', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => warnUnbalancedTags(`<div><p>ok</p></div>`, '/x/Ok.stx')).not.toThrow()
    expect(warn.mock.calls.some(c => c.join(' ').includes('opened'))).toBe(false)
    warn.mockRestore()
  })
})

describe('processDirectives tag-balance integration (#1769)', () => {
  it('warns in debug mode when a top-level template drops a </div>', async () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    const tpl = `<div><div x-show="a"><p>A</p><div x-show="b"><p>B</p></div></div>`
    await processDirectives(tpl, { props: {} }, '/proj/TabPanelWidget.stx', { debug: true } as any, new Set())
    const balMsg = warn.mock.calls.map(c => c.join(' ')).filter(l => l.includes('opened')).join('\n')
    expect(balMsg).toContain('TabPanelWidget.stx')
    warn.mockRestore()
  })

  it('does not emit a balance warning when debug is off', async () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    const tpl = `<section><div x-show="a"><p>A</p><div><p>B</p></div></section>`
    await processDirectives(tpl, { props: {} }, '/proj/NoDebugWidget.stx', { debug: false } as any, new Set())
    const balMsg = warn.mock.calls.map(c => c.join(' ')).filter(l => l.includes('opened')).join('\n')
    expect(balMsg).toBe('')
    warn.mockRestore()
  })
})
