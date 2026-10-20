import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'
import { slotPresenceProbe } from '../../test-utils/slot-presence-fixture'

afterEach(closeBrowser)

describe('component slot presence in runtime expressions (#2098)', () => {
  it('handles compound conditions, missing slots, nested instances and reactive updates', async () => {
    const app = await renderApp({
      'layouts/app.stx': layout(''),
      'components/Probe.stx': slotPresenceProbe,
      'pages/probe.stx': page('app', `<section id="provided"><Probe>
<template #actions><b>Action</b></template>
<section id="nested"><Probe /></section>
</Probe></section>
<section id="absent"><Probe /></section>`),
    }, { '/probe': 'pages/probe.stx' })
    try {
      const browser = await boot(app, '/probe')
      await settle()
      const root = (id: string) => browser.document.querySelector(`[id="${id}"] .probe`)!
      const has = (id: string, name: string) => [...root(id).children].some(el => el.classList.contains(name))
      for (const id of ['provided', 'nested', 'absent']) {
        const supplied = id === 'provided'
        expect(has(id, 'or')).toBe(supplied)
        expect(has(id, 'bracket')).toBe(supplied)
        expect(has(id, 'and')).toBe(false)
        expect(has(id, 'not')).toBe(false)
        expect(root(id).querySelector('.presence')?.textContent).toBe(supplied ? 'provided' : 'absent')
        root(id).querySelector('.toggle')!.dispatchEvent(new browser.window.Event('click', { bubbles: true }))
        await settle()
        expect(has(id, 'or')).toBe(true)
        expect(has(id, 'and')).toBe(supplied)
        expect(has(id, 'not')).toBe(!supplied)
        root(id).querySelector('.toggle')!.dispatchEvent(new browser.window.Event('click', { bubbles: true }))
        await settle()
        expect(has(id, 'or')).toBe(supplied)
      }
    }
    finally {
      await app.dispose()
    }
  })
})
