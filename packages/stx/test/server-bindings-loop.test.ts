import { describe, expect, it } from 'bun:test'
import { processServerBindings } from '../src/server-bindings'

describe('server bindings inside reactive loops', () => {
  const context = {
    row: {},
    pathFor: (id: unknown) => `/rows/${String(id)}`,
  }

  it('preserves bindings nested in a template loop for the browser scope', () => {
    const template = '<template :for="row in rows()"><a :href="pathFor(row.id)">View</a></template>'

    expect(processServerBindings(template, context)).toBe(template)
  })

  it('preserves bindings on an element loop itself', () => {
    const template = '<a :for="row in rows()" :href="pathFor(row.id)">View</a>'

    expect(processServerBindings(template, context)).toBe(template)
  })

  it('still resolves ordinary server bindings outside reactive loops', () => {
    const template = '<a :href="pathFor(42)">View</a>'

    expect(processServerBindings(template, context)).toBe('<a href="/rows/42">View</a>')
  })
})
