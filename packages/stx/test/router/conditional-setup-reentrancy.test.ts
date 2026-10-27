import { afterAll, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

it.each(['single', 'chain'])('%s: mounts a conditional component once when setup reconciles a forwarded prop', async (shape) => {
  const app = await renderApp({
    'layouts/default.stx': layout('<header>chrome</header>'),
    'components/Picker.stx': `<script>
interface Props { rhythm?: string }
const { rhythm = 'gentle' } = defineProps<Props>()
</script>
<script client>
window.PICKER_SETUPS = (window.PICKER_SETUPS || 0) + 1
if (window.PICKER_SETUPS > 4) throw new Error('Conditional setup reentered')
const selectedProp = useReactiveProp('rhythm', 'gentle')
const selected = state(selectedProp())
effect(() => { selected.set(selectedProp()) })
</script>
<div data-picker>{{ selected }}</div>`,
    'views/picker.stx': page('default', `<script client>
const shown = state(false)
const rhythm = state('advanced')
window.SHOW_PICKER = value => shown.set(value)
</script>
<template :if="shown"><Picker :rhythm="rhythm" /></template>${shape === 'chain' ? '<template :else><span>Hidden</span></template>' : ''}`),
  }, { '/picker': 'views/picker.stx' })
  try {
    const browser = await boot(app, '/picker')
    browser.window.SHOW_PICKER(true)
    await settle()
    expect(browser.window.PICKER_SETUPS).toBe(1)
    expect(browser.document.querySelectorAll('[data-picker]').length).toBe(1)
    expect(browser.document.querySelector('[data-picker]')?.textContent).toBe('advanced')
    expect(browser.errors).toEqual([])
    browser.window.SHOW_PICKER(false)
    await settle()
    browser.window.SHOW_PICKER(true)
    await settle()
    expect(browser.window.PICKER_SETUPS).toBe(2)
    expect(browser.document.querySelectorAll('[data-picker]').length).toBe(1)
    expect(browser.errors).toEqual([])
  }
  finally { await app.dispose() }
})
