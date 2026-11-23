/**
 * `x-model` inside `<template :if>`, in a real browser (stacksjs/stx#2215).
 *
 * Reported from Postline's campaign planner: the form's fields came up empty
 * when the panel opened, so the page set each field's value by hand two
 * ticks later. This is that page's sequence: the values set, then the panel
 * opened; the panel swapped for another and back; the values changed while
 * it is open; and a field the user typed in, set again from the page.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../stx/test-utils/browser-timeout'
import type { BrowserPage } from './support/browser-page'
import { openBrowserPage } from './support/browser-page'

allowForARealBrowser()

const BODY = `<script client>
const panelMode = state('none')
const campaignName = state('')
const campaignTone = state('clear')
const campaignStart = state('')
const campaignGoal = state('')
window.probe = { panelMode, campaignName, campaignTone, campaignStart, campaignGoal }
</script>
<div class="panels">
  <section x-show="panelMode() === 'planner'">planner</section>
  <template :if="panelMode() === 'campaign'">
  <section>
    <form @submit="$event.preventDefault()">
      <label><span>Name</span><input id="name" required x-model="campaignName"></label>
      <label><span>Goal</span><textarea id="goal" rows="4" x-model="campaignGoal"></textarea></label>
      <label><span>Tone</span><select id="tone" x-model="campaignTone"><option value="clear">Clear</option><option value="technical">Technical</option></select></label>
      <div><label><span>Start</span><input id="start" type="date" x-model="campaignStart"></label></div>
    </form>
  </section>
  </template>
  <template :if="panelMode() === 'post'">
  <section><input id="post" x-model="campaignName"></section>
  </template>
</div>`

/** The four fields' values, now or after a task. */
const READ = `const v = id => { const el = document.getElementById(id); return el ? el.value : null }
const fields = () => [v('name'), v('goal'), v('tone'), v('start')]
const afterTask = () => new Promise(done => setTimeout(() => done(fields()), 0))`

let page: BrowserPage

beforeAll(async () => {
  page = await openBrowserPage({ name: 'x-model-conditional-template', body: BODY, ready: 'window.probe' })
}, 90_000)

afterAll(() => page?.close())

describe('x-model inside a template :if', () => {
  it('shows the values set before the panel opened, in the same turn', async () => {
    const values = await page.json(`${READ}
probe.campaignName.set('Launch'); probe.campaignGoal.set('Grow'); probe.campaignTone.set('technical'); probe.campaignStart.set('2026-12-01')
probe.panelMode.set('campaign')
return fields()`)
    expect(values).toEqual(['Launch', 'Grow', 'technical', '2026-12-01'])
  })

  it('shows the current values when the panel comes back', async () => {
    const values = await page.json(`${READ}
probe.panelMode.set('post')
return new Promise(done => setTimeout(() => {
  probe.campaignName.set('Second'); probe.campaignTone.set('clear')
  probe.panelMode.set('campaign')
  done(afterTask())
}, 50))`)
    expect(values).toEqual(['Second', 'Grow', 'clear', '2026-12-01'])
  })

  it('follows values the page sets while the panel is open', async () => {
    const values = await page.json(`${READ}
probe.campaignName.set('Preset'); probe.campaignGoal.set('Preset goal'); probe.campaignTone.set('technical'); probe.campaignStart.set('2027-01-02')
return afterTask()`)
    expect(values).toEqual(['Preset', 'Preset goal', 'technical', '2027-01-02'])
  })

  it('takes a value from the page after the user typed in the field', async () => {
    const values = await page.json(`${READ}
const name = document.getElementById('name')
name.value = 'typed'
name.dispatchEvent(new Event('input', { bubbles: true }))
const heard = probe.campaignName()
probe.campaignName.set('Preset again')
return afterTask().then(now => [heard, now[0]])`)
    expect(values).toEqual(['typed', 'Preset again'])
    expect(await page.errors()).toEqual([])
  })
})
