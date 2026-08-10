/**
 * A toast can carry a title and a semantic id (stacksjs/stx#1913).
 *
 * Trying to delete a real app's 193-line hand-rolled toast and adopt this one
 * failed on five things. These are the two the reporter identified as
 * unblocking the most, and neither changes the existing signature:
 *
 *   toast.success('Post published.', { title: 'Published', id: 'publish' })
 *   toast.dismiss('publish')
 *
 * The id is the sharper one. A persistent "Publishing..." toast and the call
 * that clears it on completion live in different functions, so the numeric
 * handle had to be threaded between them by hand — which is the state
 * management the primitive exists to remove.
 *
 * Actions, dedupe and a loading state are deliberately NOT here; see the note
 * on the issue about where this primitive's boundary is.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

const toasts = (): HTMLElement[] =>
  [...document.querySelectorAll('[data-stx-toast]')] as HTMLElement[]

describe('toast title and semantic id', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  beforeEach(() => {
    document.body.innerHTML = '<div id="stx-toast-container"></div>'
  })

  it('renders a title above the message', () => {
    window.stx.toast.success('Post published.', { title: 'Published' })
    const el = toasts()[0]

    expect(el.querySelector('[data-stx-toast-title]')?.textContent).toBe('Published')
    expect(el.textContent).toContain('Post published.')
  })

  it('leaves an untitled toast exactly as it was', () => {
    // The wrapper only appears when there is a title, so the existing shape and
    // every existing call site render unchanged.
    window.stx.toast.info('Just a message')
    const el = toasts()[0]

    expect(el.querySelector('[data-stx-toast-title]')).toBeNull()
    expect(el.textContent).toContain('Just a message')
  })

  it('replaces a toast that shares its id, rather than stacking', () => {
    window.stx.toast.info('Publishing...', { id: 'publish', duration: 0 })
    window.stx.toast.success('Published.', { id: 'publish' })

    expect(toasts()).toHaveLength(1)
    expect(toasts()[0].textContent).toContain('Published.')
  })

  it('does not disturb a toast with a different id', () => {
    window.stx.toast.info('Publishing...', { id: 'publish', duration: 0 })
    window.stx.toast.info('Scanning...', { id: 'scan', duration: 0 })

    expect(toasts()).toHaveLength(2)
  })

  it('dismisses by semantic id from another call site', async () => {
    // The whole point: the dismissing code never saw the numeric handle.
    // A dismissal animates out over 300ms, unlike a keyed replacement.
    window.stx.toast.info('Publishing...', { id: 'publish', duration: 0 })
    window.stx.toast.dismiss('publish')
    await Bun.sleep(350)

    expect(toasts()).toHaveLength(0)
  })

  it('still dismisses by the numeric handle', async () => {
    const handle = window.stx.toast.info('Hello', { duration: 0 })
    window.stx.toast.dismiss(handle)
    await Bun.sleep(350)

    expect(toasts()).toHaveLength(0)
  })

  it('leaves unkeyed toasts alone when a keyed one is added', () => {
    window.stx.toast.info('Plain one', { duration: 0 })
    window.stx.toast.info('Keyed', { id: 'publish', duration: 0 })

    expect(toasts()).toHaveLength(2)
  })
})
