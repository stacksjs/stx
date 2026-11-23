import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { type BrowserPage, openBrowserPage } from './support/browser-page'

let page: BrowserPage
beforeAll(async () => {
  page = await openBrowserPage({ name: 'toast-timing', body: '<script client>const active = state(true); window.toastReady = active</script><StxToast /><button id="outside">Outside</button>', ready: 'window.toastReady && window.stx && document.getElementById("stx-toast-container")' })
}, 90_000)
afterAll(() => page?.close())

const WAIT = 'return (async () => { const wait = ms => new Promise(done => setTimeout(done, ms));'

describe('toast expiry while a reader interacts (#2222)', () => {
  it('pauses on hover and resumes when the pointer leaves', async () => {
    const result = await page.json(`${WAIT}
const id = stx.toast.info('Read this message', { duration: 180 });
const toast = document.getElementById('stx-toast-' + id);
toast.dispatchEvent(new MouseEvent('mouseenter'));
await wait(550);
const held = toast.isConnected;
toast.dispatchEvent(new MouseEvent('mouseleave'));
return { held, role: toast.getAttribute('role'), live: toast.getAttribute('aria-live'), id }; })()`)
    expect(result.held).toBe(true)
    expect(result.role).toBe('alert')
    expect(result.live).toBe('assertive')
    expect(await page.until(`!document.getElementById('stx-toast-${result.id}')`)).toBe(true)
  })

  it('keeps keyboard focus and hover independent, including focus moves within a toast', async () => {
    const result = await page.json(`${WAIT}
const id = stx.toast.error('Keep the close button reachable', { duration: 180 });
const toast = document.getElementById('stx-toast-' + id);
const close = toast.querySelector('button');
const second = document.createElement('button'); second.textContent = 'Another action'; toast.appendChild(second);
toast.dispatchEvent(new MouseEvent('mouseenter')); close.focus();
toast.dispatchEvent(new MouseEvent('mouseleave'));
await wait(550);
const focused = toast.isConnected && document.activeElement === close;
second.focus(); await wait(550);
const internal = toast.isConnected && document.activeElement === second;
document.getElementById('outside').focus();
return { focused, internal, id }; })()`)
    expect(result.focused).toBe(true)
    expect(result.internal).toBe(true)
    expect(await page.until(`!document.getElementById('stx-toast-${result.id}')`)).toBe(true)
    expect(await page.errors()).toEqual([])
  })

  it('supports persistent and explicitly dismissed toasts while hovered', async () => {
    const result = await page.json(`${WAIT}
const id = stx.toast.success('Persistent', { duration: 0 });
const toast = document.getElementById('stx-toast-' + id);
toast.dispatchEvent(new MouseEvent('mouseenter')); toast.querySelector('button').focus();
await wait(350);
const held = toast.isConnected;
toast.querySelector('button').click();
return { held, id }; })()`)
    expect(result.held).toBe(true)
    expect(await page.until(`!document.getElementById('stx-toast-${result.id}')`)).toBe(true)
  })
})
