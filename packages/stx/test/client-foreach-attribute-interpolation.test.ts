import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { bindLoopInterpolations } from '../src/signal-processing'
import { buildStaticSite } from '../src/site-builder/build'

setDefaultTimeout(60000)

/**
 * A `{{ }}` inside a JS string of a reactive attribute in a client `@foreach`
 * is evaluated in the loop's scope (stacksjs/stx#2140).
 */
describe('bindLoopInterpolations', () => {
  test('turns a placeholder inside a string of a reactive attribute into an expression', () => {
    expect(bindLoopInterpolations(`<button :class="tool() === '{{ item.id }}' ? 'on' : 'off'" @click="pick('{{ item.id }}')">x</button>`))
      .toBe('<button :class="tool() === `${item.id}` ? \'on\' : \'off\'" @click="pick(`${item.id}`)">x</button>')
  })

  test('keeps text around the placeholder and leaves plain attributes and text alone', () => {
    expect(bindLoopInterpolations(`<a :href="'/rooms/{{ room.code }}/join'" title="{{ room.name }}">{{ room.name }}</a>`))
      .toBe('<a :href="`/rooms/${room.code}/join`" title="{{ room.name }}">{{ room.name }}</a>')
  })
})

describe('buildStaticSite: client @foreach', () => {
  let cwd = ''
  let dir = ''
  let counter = 0

  beforeEach(async () => {
    cwd = process.cwd()
    dir = path.join(import.meta.dir, `temp-foreach-attrs-${++counter}`)
    await fs.promises.mkdir(path.join(dir, 'views'), { recursive: true })
    await Bun.write(path.join(dir, 'views/index.stx'), `<script client>
const tools = [{ id: 'woodcutter', label: 'Woodcutter' }]
const tool = state('')
function pick(kind: string): void { tool.set(kind) }
</script>
<!DOCTYPE html><html><head><title>t</title></head><body>
@foreach (tools as item)
<button type="button" :class="tool() === '{{ item.id }}' ? 'on' : 'off'" @click="pick('{{ item.id }}')">{{ item.label }}</button>
@endforeach
</body></html>
`)
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  test('the lowered loop reads the loop variable in its handler and class binding', async () => {
    await buildStaticSite({ name: 'Test', url: 'https://example.com', pagesDir: 'views', outDir: 'dist' } as any)
    const html = await fs.promises.readFile(path.join(dir, 'dist/index.html'), 'utf8')
    const button = html.match(/<button[^>]*@for="item in tools"[^>]*>/)?.[0] ?? ''
    expect(button).toContain('@click="pick(`${item.id}`)"')
    expect(button).toContain('tool() === `${item.id}`')
    expect(button).not.toContain('{{ item.id }}')
  })
})
