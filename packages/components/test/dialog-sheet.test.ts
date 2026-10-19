/**
 * A dialog presented as a sheet on a phone: anchored to the bottom edge with
 * a grabber and the home indicator's inset, the centred card from `sm` up.
 */
import { describe, expect, it } from 'bun:test'
import { render } from './utils/render-component'

describe('DialogPanel variant="sheet"', () => {
  it('anchors to the bottom on a phone and centres from sm up', async () => {
    const html = await render('<DialogPanel variant="sheet"><p>Unfollow?</p></DialogPanel>')
    expect(html).toContain('items-end')
    expect(html).toContain('sm:items-center')
    expect(html).toContain('rounded-t-panel')
    expect(html).toContain('env(safe-area-inset-bottom)')
    expect(html).toMatch(/aria-hidden="true"[^>]*sm:hidden/)
  })

  it('keeps the centred card by default', async () => {
    const html = await render('<DialogPanel><p>Confirm</p></DialogPanel>')
    expect(html).toContain('items-center justify-center p-4')
    expect(html).not.toContain('rounded-t-panel')
    expect(html).not.toContain('safe-area-inset-bottom')
  })
})
