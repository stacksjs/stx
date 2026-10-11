import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { Window } from 'very-happy-dom'
import { portalElement } from '../src/utils/element-portal'

function tooltipLifecycle() {
  const component = readFileSync(`${import.meta.dir}/../src/ui/tooltip/Tooltip.stx`, 'utf8')
  const script = component.match(/<script client>([\s\S]*?)<\/script>/)?.[1]
  const start = script?.indexOf('let restorePanel = null') ?? -1
  if (!script || start === -1)
    throw new Error('Tooltip portal lifecycle is missing')
  const mounts: Array<() => void> = []
  const destroys: Array<() => void> = []
  const ticks: Array<() => void> = []
  const panelRef: { value: HTMLElement | null } = { value: null }
  new Function('panelRef', 'describeTrigger', 'nextTick', 'portalElement', 'onMount', 'onDestroy', script.slice(start))(
    panelRef,
    () => {},
    (callback: () => void) => ticks.push(callback),
    portalElement,
    (callback: () => void) => mounts.push(callback),
    (callback: () => void) => destroys.push(callback),
  )
  return { panelRef, mount: () => mounts.forEach(callback => callback()), destroy: () => destroys.forEach(callback => callback()), flush: () => ticks.splice(0).forEach(callback => callback()) }
}

describe('owned element portals', () => {
  test('waits for hydration to populate the tooltip ref and cleans up on owner removal', () => {
    const document = new Window().document
    document.body.innerHTML = '<main style="overflow:hidden"><span id="panel">Help</span><button>Trigger</button></main>'
    const panel = document.querySelector('#panel')!
    const owner = panel.parentElement!
    const lifecycle = tooltipLifecycle()
    lifecycle.mount()
    expect(panel.parentElement).toBe(owner)
    lifecycle.panelRef.value = panel as unknown as HTMLElement
    lifecycle.flush()
    expect(panel.parentElement).toBe(document.body)
    expect(document.body.querySelector('#panel')).toBe(panel)
    owner.remove()
    lifecycle.destroy()
    expect(document.body.querySelector('#panel')).toBeNull()
  })

  test('does not portal a tooltip detached before the hydration tick', () => {
    const document = new Window().document
    document.body.innerHTML = '<main><span id="panel">Help</span></main>'
    const panel = document.querySelector('#panel')!
    const lifecycle = tooltipLifecycle()
    lifecycle.mount()
    lifecycle.panelRef.value = panel as unknown as HTMLElement
    panel.remove()
    lifecycle.flush()
    lifecycle.destroy()
    expect(panel.parentElement).toBeNull()
    expect(document.body.querySelector('#panel')).toBeNull()
  })

  test('keeps the same node and restores its original position', () => {
    const document = new Window().document
    document.body.innerHTML = '<main><span id="panel">Help</span><button>Trigger</button></main>'
    const panel = document.querySelector('#panel')!
    const source = panel.parentNode!
    const restore = portalElement(panel as unknown as HTMLElement, document.body as unknown as HTMLElement)
    expect(document.body.lastElementChild).toBe(panel)
    restore()
    expect(source.firstChild).toBe(panel)
  })
  test('removes a body portal if its original owner has gone', () => {
    const document = new Window().document
    document.body.innerHTML = '<main><span id="panel">Help</span></main>'
    const panel = document.querySelector('#panel')!
    const source = panel.parentElement!
    const restore = portalElement(panel as unknown as HTMLElement, document.body as unknown as HTMLElement)
    source.remove()
    restore()
    expect(document.body.querySelector('#panel')).toBeNull()
  })
})
