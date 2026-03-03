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

  it('should render an <a> tag', () => {
    expect(componentSource).toContain('<a')
    expect(componentSource).toContain('</a>')
  })

  it('should use "to" prop as href', () => {
    expect(componentSource).toContain('href="{{ to }}"')
  })

  it('should include data-stx-link attribute', () => {
    expect(componentSource).toContain('data-stx-link')
  })

  it('should support configurable active class', () => {
    expect(componentSource).toContain('data-stx-active-class="{{ activeClass || \'active\' }}"')
  })

  it('should support configurable exact-active class', () => {
    expect(componentSource).toContain('data-stx-exact-active-class="{{ exactActiveClass || \'exact-active\' }}"')
  })

  it('should conditionally add prefetch attribute', () => {
    expect(componentSource).toContain('data-stx-prefetch')
    expect(componentSource).toContain('@if(prefetch)')
  })

  it('should support slot for link content', () => {
    expect(componentSource).toContain('{{ slot }}')
  })

  it('should support className prop', () => {
    expect(componentSource).toContain('class="{{ className || \'\' }}"')
  })
})
