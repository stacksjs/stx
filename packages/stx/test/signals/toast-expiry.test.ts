import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { SIGNALS_TOAST_RUNTIME } from '../../src/client/signals-toast-runtime'

function runtime() {
  let now = 0
  let id = 0
  const tasks = new Map<number, { at: number, run: () => void }>()
  const schedule = (run: () => void, delay: number) => {
    tasks.set(++id, { at: now + delay, run })
    return id
  }
  const toast = new Function('document', 'performance', 'setTimeout', 'clearTimeout', `${SIGNALS_TOAST_RUNTIME}; return toast`)(document, { now: () => now }, schedule, (id: number) => tasks.delete(id))
  return {
    toast,
    tasks,
    advance(ms: number) {
      const end = now + ms
      for (;;) {
        const next = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
        if (!next) break
        tasks.delete(next[0])
        now = next[1].at
        next[1].run()
      }
      now = end
    },
  }
}

beforeEach(() => { document.body.innerHTML = '<div id="stx-toast-container"></div><button id="outside">Outside</button>' })
const current = () => document.body.querySelector('[data-stx-toast]:not([data-stx-toast-exiting])') as HTMLElement

describe('toast expiry accounting (#2222)', () => {
  it('resumes the unspent duration across repeated pauses, rather than restarting it', () => {
    const clock = runtime()
    clock.toast.info('Message', { duration: 1000 })
    const el = current()
    clock.advance(400)
    el.dispatchEvent(new MouseEvent('mouseenter'))
    clock.advance(5000)
    el.dispatchEvent(new MouseEvent('mouseleave'))
    clock.advance(200)
    el.dispatchEvent(new MouseEvent('mouseenter'))
    clock.advance(5000)
    el.dispatchEvent(new MouseEvent('mouseleave'))
    clock.advance(399)
    expect(current()).toBe(el)
    clock.advance(1)
    expect(el.hasAttribute('data-stx-toast-exiting')).toBe(true)
    clock.advance(300)
    expect(el.isConnected).toBe(false)
    expect(clock.tasks.size).toBe(0)
  })

  it('cancels expiry when dismissed, including while paused', () => {
    for (const pause of [false, true]) {
      const clock = runtime()
      const id = clock.toast.info('Dismiss', { duration: 1000 })
      const el = current()
      if (pause) el.dispatchEvent(new MouseEvent('mouseenter'))
      clock.toast.dismiss(id)
      expect(clock.tasks.size).toBe(1) // Only the exit animation remains.
      clock.advance(300)
      expect(el.isConnected).toBe(false)
      expect(clock.tasks.size).toBe(0)
      el.dispatchEvent(new MouseEvent('mouseleave'))
      expect(clock.tasks.size).toBe(0)
    }
  })

  it('disposes a keyed replacement and keeps its new expiry independent', () => {
    const clock = runtime()
    clock.toast.info('Old', { id: 'task', duration: 1000 })
    const old = current()
    old.dispatchEvent(new MouseEvent('mouseenter'))
    clock.toast.success('New', { id: 'task', duration: 200 })
    const replacement = current()
    expect(old.isConnected).toBe(false)
    expect(replacement.textContent).toContain('New')
    expect(clock.tasks.size).toBe(1)
    old.dispatchEvent(new MouseEvent('mouseleave'))
    expect(clock.tasks.size).toBe(1)
    clock.advance(500)
    expect(replacement.isConnected).toBe(false)
    expect(clock.tasks.size).toBe(0)
  })

  it('evicts an old toast without looping over its outgoing animation', () => {
    document.getElementById('stx-toast-container')!.setAttribute('data-stx-toast-max', '1')
    const clock = runtime()
    clock.toast.info('Old', { duration: 1000 })
    const old = current()
    clock.toast.success('New', { duration: 0 })
    expect(current().textContent).toContain('New')
    expect(old.hasAttribute('data-stx-toast-exiting')).toBe(true)
    expect(clock.tasks.size).toBe(1)
    clock.advance(300)
    expect(old.isConnected).toBe(false)
    expect(clock.tasks.size).toBe(0)
    expect(current().textContent).toContain('New')
  })
})

describe('toast actions and progress', () => {
  it('runs undo once and returns focus after dismissing', () => {
    const clock = runtime()
    const opener = document.getElementById('outside')!
    opener.focus()
    const undo = mock(() => {})
    clock.toast.success('Removed', { actions: [{ label: 'Undo', onClick: undo }] })
    const toast = current()
    const button = toast.querySelector<HTMLButtonElement>('button[data-stx-toast-action]')!
    expect(button.textContent).toBe('Undo')
    button.focus()
    button.click()
    button.click()
    expect(undo).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(opener)
    clock.advance(300)
    expect(toast.isConnected).toBe(false)
  })

  it('can copy repeatedly and pauses expiry while the button has focus', () => {
    const clock = runtime()
    const copy = mock(() => {})
    clock.toast.success('Published', { duration: 500, actions: [{ label: 'Copy link', onClick: copy, dismiss: false }] })
    const toast = current()
    const button = toast.querySelector<HTMLButtonElement>('button[data-stx-toast-action]')!
    button.focus()
    clock.advance(1000)
    button.click()
    button.click()
    expect(copy).toHaveBeenCalledTimes(2)
    expect(current()).toBe(toast)
    document.getElementById('outside')!.focus()
    clock.advance(800)
    expect(toast.isConnected).toBe(false)
  })

  it('renders HTTP links as native anchors', () => {
    const clock = runtime()
    clock.toast.success('Published', { actions: [
      { label: 'Open post', href: 'https://example.com/posts/1', target: '_blank' },
      { label: 'Unavailable', href: 'about:blank' },
    ] })
    const links = current().querySelectorAll<HTMLAnchorElement>('a[data-stx-toast-action]')
    expect(links).toHaveLength(1)
    expect(links[0]!.textContent).toBe('Open post')
    expect(links[0]!.href).toBe('https://example.com/posts/1')
    expect(links[0]!.target).toBe('_blank')
    expect(links[0]!.rel).toBe('noopener noreferrer')
  })

  it('replaces persistent polite progress with an assertive error', () => {
    const clock = runtime()
    clock.toast.info('Publishing…', { id: 'publish', loading: true, duration: 0 })
    const progress = current()
    expect(progress.getAttribute('role')).toBe('status')
    expect(progress.querySelector('[data-stx-toast-loading][aria-hidden=true]')).not.toBeNull()
    clock.advance(10000)
    expect(current()).toBe(progress)
    clock.toast.error('Publishing failed', { id: 'publish' })
    expect(current().getAttribute('role')).toBe('alert')
    expect(current().querySelector('[data-stx-toast-loading]')).toBeNull()
    expect(progress.isConnected).toBe(false)
  })
})
