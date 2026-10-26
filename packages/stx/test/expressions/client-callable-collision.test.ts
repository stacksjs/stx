import { afterAll, describe, expect, it, mock } from 'bun:test'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { processExpressions } from '../../src/expressions'
import { createTempDir } from '../../src/temp-dir'

const directory = createTempDir('stx-client-callable-')
afterAll(() => rmSync(directory, { recursive: true, force: true }))

const expressions = [
  'report()?.status',
  '(report())?.status',
  "'Status: ' + report()?.status",
  "true ? report()?.status : 'none'",
  '`Status: ${report()?.status}`',
  'String(report()?.status)',
]

describe('client signals own all reads before SSR evaluation (#2119)', () => {
  for (const expression of expressions) {
    it.each(['page', 'component'])('%s preserves ' + expression, async (kind) => {
      const reporter = mock(() => ({ status: 'SERVER' }))
      const source = `<script client>const report = state(null)</script><p>{{ ${expression} }}</p>`
      const component = `ReportProbe${expressions.indexOf(expression)}`
      await Bun.write(path.join(directory, `${component}.stx`), source)
      const out = await processDirectives(kind === 'component' ? `<${component} />` : source,
        { report: reporter }, path.join(directory, 'page.stx'),
        { ...defaultConfig, componentsDir: directory }, new Set())
      expect(reporter).not.toHaveBeenCalled()
      expect(out).toContain(`{{ ${expression} }}`)
    })
  }

  it.each(['{{{ (report())?.status }}}', '{!! (report())?.status !!}'])('protects raw interpolation %s too', (interpolation) => {
    const reporter = mock(() => ({ status: 'SERVER' }))
    const out = processExpressions(`<script client>const report = state(null)</script><p>${interpolation}</p>`, { report: reporter })
    expect(reporter).not.toHaveBeenCalled()
    expect(out).toContain(interpolation)
  })

  it('does not fall through to a callable global absent from the server context', () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'report')
    const reporter = mock(() => ({ status: 'GLOBAL' }))
    Object.defineProperty(globalThis, 'report', { configurable: true, value: reporter })
    try {
      const out = processExpressions(`<script client>const report = state(null)</script><p>{{ 'Status: ' + report()?.status }}</p>`, {})
      expect(out).toContain("{{ 'Status: ' + report()?.status }}")
      expect(reporter).not.toHaveBeenCalled()
    }
    finally {
      if (previous) Object.defineProperty(globalThis, 'report', previous)
      else Reflect.deleteProperty(globalThis, 'report')
    }
  })

  it('does not confuse property names, literal text, or keys with signal reads', () => {
    const source = `<p>{{ model.report() }}</p><p>{{ 'report()' }}</p><p>{{ ({ report: 'key' }).report }}</p>`
    const out = processExpressions(source, { __stx_client_signal_names: ['report'], model: { report: () => 'property' } })
    expect(out).toContain('<p>property</p><p>report()</p><p>key</p>')
  })

  it('leaves explicit server calls operational', async () => {
    const reporter = mock(() => 'logged')
    const out = await processDirectives('<p>{{ report() }}</p>', { report: reporter }, path.join(directory, 'server.stx'), defaultConfig, new Set())
    expect(out).toContain('logged')
    expect(reporter).toHaveBeenCalledTimes(1)
  })
})
