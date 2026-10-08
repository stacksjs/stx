/**
 * A component can contain another instance of itself through its slot.
 *
 * It could not: `<Box><Box>deep</Box></Box>` rendered as
 * `[Circular component reference: box]`, with no error and no warning -- a
 * text marker where the content should have been.
 *
 * The recursion guard is keyed by component name and cloned per branch, so
 * sibling uses are fine and a component whose own template references itself
 * is caught. Slot content was being counted as part of the component's own
 * subtree, which it is not: it is the caller's markup, handed over. The outer
 * Box is not an ancestor of the inner one in any sense that matters.
 *
 * The shapes this broke are the most ordinary ones there are -- a Card inside
 * a Card, a list inside a list, a layout View inside a View -- which is the
 * reason it is worth a file of its own rather than a line in another.
 */

import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const options = {
  ...defaultConfig,
  componentsDir: path.resolve(__dirname, '../fixtures/self-nesting'),
} as StxOptions

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', options, new Set<string>())
}

describe('a component inside itself', () => {
  it('nests one level', async () => {
    const html = await render('<Box><Box><em>deep</em></Box></Box>')
    expect(html).not.toContain('Circular component reference')
    expect(html).toContain('<div class="box"><div class="box"><em>deep</em></div></div>')
  })

  it('nests three levels', async () => {
    const html = await render('<Box><Box><Box><em>d</em></Box></Box></Box>')
    expect((html.match(/class="box"/g) ?? []).length).toBe(3)
    expect(html).toContain('<em>d</em>')
  })

  it('keeps each instance its own props', async () => {
    const html = await render('<Titled heading="Outer"><Titled heading="Inner"><p>body</p></Titled></Titled>')
    expect(html).not.toContain('Circular component reference')
    expect(html).toContain('<h3>Outer</h3>')
    expect(html).toContain('<h3>Inner</h3>')
    expect(html).toContain('<p>body</p>')
  })

  it('still nests a different component in between', async () => {
    const html = await render('<Box><Titled heading="Mid"><Box><em>x</em></Box></Titled></Box>')
    expect(html).not.toContain('Circular component reference')
    expect((html.match(/class="box"/g) ?? []).length).toBe(2)
    expect(html).toContain('<h3>Mid</h3>')
  })
})

describe('what the guard is actually for', () => {
  it('still catches a component whose own template references itself', async () => {
    const html = await render('<Recursive />')
    expect(html).toContain('Circular component reference: recursive')
  })

  it('still catches that even when the self-reference carries slot content', async () => {
    // The tag is in the component's OWN template, so it is a real cycle --
    // the distinction the fix turns on.
    const html = await render('<SelfSlot />')
    expect(html).toContain('Circular component reference: self-slot')
  })
})
