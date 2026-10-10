import { afterAll, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processDirectives } from '../src/process'
import type { StxOptions } from '../src/types'

const root = mkdtempSync(join(tmpdir(), 'stx-client-props-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))
let number = 0
async function script(content: string) {
  const folder = join(root, String(number++))
  const components = join(folder, 'components')
  mkdirSync(components, { recursive: true })
  writeFileSync(join(components, 'Probe.stx'), `<script client>${content}</script><p :text="result"></p>`)
  const html = await processDirectives('<Probe coach="true" />', {}, join(folder, 'index.stx'), { componentsDir: components, root: folder } as StxOptions, new Set())
  const code = [...html.matchAll(/<script\b[^>]*data-stx-scoped[^>]*>([\s\S]*?)<\/script>/g)].find(match => match[1]?.includes('received'))?.[1]
  if (!code) throw new Error('Scoped client script was not emitted')
  return code
}
function run(code: string, props: unknown, cached = false) {
  const parent = { coach: 'parent', private: 'parent data' }
  const parentElement = {}
  const element = { getAttribute: () => typeof props === 'string' ? props : JSON.stringify(props), ...(cached ? { __stx_props: props } : {}) }
  const host: any = { __STX_CURRENT_PROPS__: parent, __STX_CURRENT_ELEMENT__: parentElement }
  host.stx = { _scopes: {}, state: (value: unknown) => () => value, defineProps: () => host.__STX_CURRENT_PROPS__ }
  const execute = () => new Function('window', 'document', code)(host, { querySelector: () => element })
  return { host, parent, parentElement, execute }
}

test('scoped client setup reads its own serialized props and restores its parent context', async () => {
  const code = await script('const received = defineProps(); const result = state(received.coach)')
  const context = run(code, { coach: 'true', nested: { value: 3 } })
  context.execute()
  const scope: any = Object.values(context.host.stx._scopes)[0]
  expect(scope.received).toEqual({ coach: 'true', nested: { value: 3 } })
  expect(scope.result()).toBe('true')
  expect(context.host.__STX_CURRENT_PROPS__).toBe(context.parent)
  expect(context.host.__STX_CURRENT_ELEMENT__).toBe(context.parentElement)
})
test('current bound props win; missing or malformed serialized props do not inherit the parent', async () => {
  const code = await script('const received = defineProps(); const result = state(received.coach)')
  const bound = run(code, { coach: true }, true)
  bound.execute()
  expect((Object.values(bound.host.stx._scopes)[0] as any).received.coach).toBe(true)
  for (const value of ['invalid JSON', null, []]) {
    const context = run(code, value)
    context.execute()
    expect((Object.values(context.host.stx._scopes)[0] as any).received).toEqual({})
    expect(context.host.__STX_CURRENT_PROPS__).toBe(context.parent)
  }
})
test('setup failure restores both context globals', async () => {
  const code = await script("const received = defineProps(); const result = state(''); throw new Error('failed setup')")
  const context = run(code, { coach: true })
  expect(context.execute).toThrow('failed setup')
  expect(context.host.__STX_CURRENT_PROPS__).toBe(context.parent)
  expect(context.host.__STX_CURRENT_ELEMENT__).toBe(context.parentElement)
})
