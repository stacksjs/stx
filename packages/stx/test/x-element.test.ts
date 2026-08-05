import { describe, expect, it } from 'bun:test'
import {
  generateXElementRuntime,
  hasXElementDirectives,
  processXElementDirectives,
} from '../src/x-element'

const runtimeMarker = 'data-stx-x-element-runtime'

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}

describe('x-element runtime injection', () => {
  it('mounts only when the template declares an x-data scope', () => {
    expect(hasXElementDirectives('<div x-data="{ open: false }"></div>')).toBe(true)
    expect(hasXElementDirectives('<input x-model="name">')).toBe(false)
    expect(hasXElementDirectives('<span x-text="name"></span>')).toBe(false)
    expect(hasXElementDirectives('<button :disabled="loading"></button>')).toBe(false)
  })

  it('does not burden signals-only bindings with the XElement runtime', () => {
    const output = processXElementDirectives('<input x-model="query"><p :class="tone"></p>')

    expect(output).not.toContain(runtimeMarker)
    expect(output).not.toContain('class XElement')
  })

  it('marks the generated runtime so document assembly can identify it', () => {
    const runtime = generateXElementRuntime()

    expect(runtime).toContain(`<script data-stx-scoped ${runtimeMarker}`)
    // The runtime re-runs on SPA navigation to init newly swapped [x-data]
    // content, and now says so rather than relying on the router's sniff (#1828).
    expect(runtime).toContain('data-stx-run="always"')
  })

  it('keeps exactly one runtime when processed components are assembled', () => {
    const first = processXElementDirectives('<section x-data="{ first: true }"></section>')
    const second = processXElementDirectives('<section x-data="{ second: true }"></section>')
    const page = processXElementDirectives(`<html><body>${first}${second}</body></html>`)

    expect(occurrences(page, runtimeMarker)).toBe(1)
    expect(occurrences(page, 'class XElement')).toBe(1)
    expect(page.indexOf(runtimeMarker)).toBeLessThan(page.indexOf('</body>'))
  })

  it('is idempotent for an already processed document', () => {
    const once = processXElementDirectives('<html><body><main x-data="{ ready: true }"></main></body></html>')
    const twice = processXElementDirectives(once)

    expect(twice).toBe(once)
  })
})
