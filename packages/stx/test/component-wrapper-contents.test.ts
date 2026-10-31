/**
 * A component's wrapper generates no box of its own.
 *
 * Every component with client script is wrapped in
 * `<div data-stx-component-wrapper>` to carry its scope. As a grid or flex item
 * the wrapper took the track and broke `grid-template-columns` and
 * `.parent > .child` selectors, so an app had to add its own
 * `[data-stx-component-wrapper] { display: contents }`. The rule now ships in
 * the same head style as the cloak, and in the runtime's late injection for a
 * page that arrives without one. A deferred island is the exception: its
 * visibility trigger observes the wrapper, and an element with no box never
 * intersects.
 */
import { describe, expect, it } from 'bun:test'
import { CLOAK_STYLE, COMPONENT_WRAPPER_RULE, generateDocumentShell } from '../src/document-shell'
import { SIGNALS_CLOAK_RUNTIME } from '../src/client/signals-bootstrap-runtime'

describe('component wrapper', () => {
  it('ships display: contents in the head style, and the cloak is still there', () => {
    const html = generateDocumentShell('<main>hi</main>', { title: 'T' })
    expect(html).toContain('[data-stx-component-wrapper]:not([stx-hydrate]){display:contents}')
    expect(html).toContain('[x-cloak]{display:none !important}')
    expect(CLOAK_STYLE).toContain(COMPONENT_WRAPPER_RULE)
  })

  it('ships it in the runtime\'s late injection too', () => {
    expect(SIGNALS_CLOAK_RUNTIME).toContain('[data-stx-component-wrapper]:not([stx-hydrate]) { display: contents; }')
  })

  it('leaves a deferred island boxed, so its trigger can see it', () => {
    expect(COMPONENT_WRAPPER_RULE).toContain(':not([stx-hydrate])')
  })
})
