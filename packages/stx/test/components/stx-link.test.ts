import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const COMPONENT_PATH = path.resolve(import.meta.dir, '../../src/components/StxLink.stx')

describe('StxLink Component', () => {
  let componentSource: string

  beforeAll(async () => {
    componentSource = await Bun.file(COMPONENT_PATH).text()
  })

  it('should exist as a component file', () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true)
  })

  it('should render a <stx-link> custom element', () => {
    expect(componentSource).toContain('<stx-link')
    expect(componentSource).toContain('</stx-link>')
  })

  it('should use "to" prop for static links', () => {
    expect(componentSource).toContain("to='{{ to }}'")
  })

  it('should support dynamic :to binding', () => {
    expect(componentSource).toContain(':to=')
    expect(componentSource).toContain('__bindTo')
  })

  it('should support configurable active class', () => {
    expect(componentSource).toContain("active-class='{{ activeClass || ")
  })

  it('should support configurable exact-active class', () => {
    expect(componentSource).toContain("exact-active-class='{{ exactActiveClass || ")
  })

  it('should conditionally add prefetch attribute', () => {
    expect(componentSource).toContain('prefetch')
    expect(componentSource).toContain("@if(typeof prefetch !== 'undefined' && prefetch)")
  })

  it('should support slot for link content', () => {
    expect(componentSource).toContain('{!! slot !!}')
  })

  it('should support className prop', () => {
    expect(componentSource).toContain('class=')
    expect(componentSource).toContain('className')
  })
})
