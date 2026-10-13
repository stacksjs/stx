/**
 * A page's top-level :if and :for keep working after the router moves the page
 * into its first retained screen.
 *
 * With tab links on the page the router keeps screens, and on start it adopts
 * the page the app opened with into <div data-stx-screen> by MOVING the routed
 * container's children (adoptInitial). The runtime had already bound the
 * page, and :if and :for remembered the parent they were bound under: the
 * container. The first time a top-level condition changed they inserted into
 * the container before a placeholder that now lived in the screen, and the
 * browser threw "insertBefore: the node before which the new node is to be
 * inserted is not a child of this node". A phone check-in page went blank on
 * a failed check-in; apps worked around it by wrapping every page in one root.
 *
 * Structural directives now insert wherever their placeholder is, the way the
 * if/else chain always has, and the router hands the screen what the runtime
 * keeps on the container for hidden top-level nodes.
 */
import { afterEach, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { Browser, SpaApp } from './spa-harness'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

setDefaultTimeout(60_000)

const TABS = `<nav>
  <a href="/home" data-stx-link data-stx-nav="tab" data-stx-transition="none">Home</a>
  <a href="/check-in" data-stx-link data-stx-nav="tab" data-stx-transition="none">Check in</a>
</nav>`

const FILES = {
  'layouts/app.stx': layout(TABS),
  'components/Header.stx': `<header data-header>{{ title }}</header>`,
  'pages/home.stx': page('app', `<p id="home">home</p>`),
  // The shape of a phone check-in page: a header, then sibling conditionals at
  // the top level of the section, one of them a <template :if>, and a :for.
  'pages/check-in.stx': page('app', `<script client>
const phase = state('checking')
const offer = state(false)
const reasons = state([])
window.PAGE = { phase, offer, reasons }
</script>
<Header title="Check in"></Header>
<div :if="phase === 'checking'" data-checking>Checking</div>
<div :if="phase !== 'checking'" data-card>{{ phase === 'done' ? 'In' : 'Not checked in' }}</div>
<div :if="phase === 'failed' && offer" data-offer>Visiting with an aggregator?</div>
<p :for="reason in reasons" :key="reason" data-reason>{{ reason }}</p>
<button :if="phase === 'failed'" type="button" data-retry>Try again</button>
<template :if="phase === 'done'"><a href="/home" data-done>Done</a><span data-done-note>See you</span></template>`),
}

const ROUTES = { '/home': 'pages/home.stx', '/check-in': 'pages/check-in.stx' }
const QUIET = { navDuration: 0, revalidate: false, prefetchVisible: false }

let app: SpaApp | null = null

afterEach(() => {
  closeBrowser()
})

async function open(at: string): Promise<{ browser: Browser, errors: string[] }> {
  app = app || await renderApp(FILES, ROUTES)
  const errors: string[] = []
  const browser = await boot(app, at, { history: true, globals: { STX_ROUTER_OPTIONS: QUIET } })
  // Effect errors are reported through console.error, not thrown.
  const original = browser.window.console.error
  browser.window.console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' '))
    original?.apply(browser.window.console, args)
  }
  await settle()
  return { browser, errors }
}

function screen(browser: Browser): any {
  return browser.document.querySelector('[data-stx-screen][data-stx-content]')
}

/** Which of the page's parts are on screen, in document order. */
function parts(browser: Browser): string[] {
  const root = screen(browser)
  return Array.from(root.querySelectorAll('[data-header],[data-checking],[data-card],[data-offer],[data-reason],[data-retry],[data-done],[data-done-note]'))
    .map((el: any) => el.getAttributeNames().find((n: string) => n.startsWith('data-')))
}

async function set(browser: Browser, name: string, value: unknown): Promise<void> {
  browser.window.PAGE[name].set(value)
  await settle()
}

describe('top-level conditionals in the first retained screen', () => {
  it('the first page is adopted into a screen with its bindings live', async () => {
    const { browser } = await open('/check-in')
    const main = browser.document.querySelector('main')
    expect(screen(browser)?.parentNode).toBe(main)
    expect(parts(browser)).toEqual(['data-header', 'data-checking'])
  })

  it('shows and hides sibling :if elements in place when the page\'s state changes', async () => {
    const { browser, errors } = await open('/check-in')
    await set(browser, 'phase', 'failed')
    expect(parts(browser)).toEqual(['data-header', 'data-card', 'data-retry'])
    await set(browser, 'offer', true)
    expect(parts(browser)).toEqual(['data-header', 'data-card', 'data-offer', 'data-retry'])
    expect(screen(browser).querySelector('[data-card]').textContent.trim()).toBe('Not checked in')

    await set(browser, 'phase', 'checking')
    expect(parts(browser)).toEqual(['data-header', 'data-checking'])
    expect(errors).toEqual([])
  })

  it('inserts a top-level <template :if> branch and :for rows into the screen', async () => {
    const { browser, errors } = await open('/check-in')
    await set(browser, 'reasons', ['Membership paused', 'Outside opening hours'])
    await set(browser, 'phase', 'done')
    expect(parts(browser)).toEqual(['data-header', 'data-card', 'data-reason', 'data-reason', 'data-done', 'data-done-note'])
    expect(screen(browser).querySelector('[data-card]').textContent.trim()).toBe('In')

    await set(browser, 'reasons', ['Outside opening hours'])
    await set(browser, 'phase', 'failed')
    expect(parts(browser)).toEqual(['data-header', 'data-card', 'data-reason', 'data-retry'])
    // Nothing went into the container outside the screen.
    const main = browser.document.querySelector('main')
    expect(Array.from(main.children).every((child: any) => child.hasAttribute('data-stx-screen'))).toBe(true)
    expect(errors).toEqual([])
  })

  it('keeps the hidden top-level nodes registered on the screen, not the container', async () => {
    const { browser } = await open('/check-in')
    const main = browser.document.querySelector('main')
    const held = screen(browser).__stx_detached_if
    expect(main.__stx_detached_if ?? null).toBeNull()
    expect(held && Array.from(held).some((node: any) => node.hasAttribute?.('data-retry'))).toBe(true)

    await set(browser, 'phase', 'failed')
    expect(Array.from(screen(browser).__stx_detached_if).some((node: any) => node.hasAttribute?.('data-retry'))).toBe(false)
  })

  it('a page reached by navigation binds inside its own screen as before', async () => {
    const { browser, errors } = await open('/home')
    await browser.navigate('/check-in')
    await settle()
    expect(parts(browser)).toEqual(['data-header', 'data-checking'])
    await set(browser, 'phase', 'failed')
    expect(parts(browser)).toEqual(['data-header', 'data-card', 'data-retry'])
    expect(errors).toEqual([])
  })
})
