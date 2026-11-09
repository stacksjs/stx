import { describe, expect, it } from 'bun:test'
import { processMemoDirective } from '../src/misc-directives'
import { scopeOnRootElement } from '../src/utils'
import './fixtures/html-leading-trivia.mjs'

describe('root selection after leading HTML trivia', () => {
  const prefix = ' \n<!-- real -->\n\x00STX_HTML_COMMENT_12\x00\t'

  it('preserves the prefix when memoizing its actual root', () => {
    expect(processMemoDirective(`@memo([])${prefix}<span>root</span>@endmemo`))
      .toBe(`${prefix}<span data-stx-memo="[]">root</span>`)
  })

  it('scopes a constrained root without changing its comments or children', () => {
    expect(scopeOnRootElement(`${prefix}<span>root<span>child</span></span>`, ' data-stx-scope="root"'))
      .toBe(`${prefix}<span data-stx-scope="root">root<span>child</span></span>`)
  })

  it('does not consume content between a closed comment and a later root', () => {
    expect(scopeOnRootElement('<!-- first -->text --><span>root</span>', ' data-stx-scope="wrong"'))
      .toBeNull()
  })

  it('does not move scope past a malformed masked comment', () => {
    expect(scopeOnRootElement('\x00STX_HTML_COMMENT_nope\x00<span>root</span>', ' data-stx-scope="wrong"'))
      .toBeNull()
  })
})
