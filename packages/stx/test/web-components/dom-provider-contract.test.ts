import { expect, it } from 'bun:test'

it('keeps options off generic elements after the shared DOM setup', () => {
  expect('options' in HTMLElement.prototype).toBe(false)
  const element = document.createElement('div')
  expect('options' in element).toBe(false)
  expect(Reflect.set(element, 'options', { density: 'compact' })).toBe(true)
  expect(Reflect.get(element, 'options')).toEqual({ density: 'compact' })
})

it('uses the published provider for select and datalist option lookup', () => {
  for (const tag of ['select', 'datalist'] as const) {
    const element = document.createElement(tag)
    const option = document.createElement('option')
    element.appendChild(option)
    expect(Array.from(element.options)).toEqual([option])
    option.remove()
    expect(Array.from(element.options)).toEqual([])
    expect(Reflect.set(element, 'options', [])).toBe(false)
  }
})
