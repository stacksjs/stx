import { describe, expect, test } from 'bun:test'
import { Window } from 'very-happy-dom'
import { portalElement } from '../src/utils/element-portal'

describe('owned element portals', () => {
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
