/**
 * A component inside `<template :for>` is told so, because nothing else says it.
 *
 * stx strips `<template>` wrappers during server processing, and a component
 * tag inside one renders its slot in a separate pass that no longer sees the
 * loop. What makes this expensive is that it half-works: the rows appear, and
 * plain elements inside them bind correctly, so the only symptom is a component
 * whose props and slot expressions resolve to nothing. In one dashboard every
 * table row's action buttons were invisible, unlabelled squares, and it was
 * read as "components break in nested loops" (stacksjs/stx#2179). Moving the
 * directive onto the element the loop repeats fixed it in one line.
 *
 * The warning is therefore scoped to exactly that combination: a component tag
 * inside a loop whose directive sits on a `<template>`. A loop on a real
 * element binds and must stay silent, and so must a `<template :for>` with no
 * component in it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { resetTemplateLoopWarnings } from '../../src/component-renderer'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

let warnings: string[] = []
const realWarn = console.warn

beforeEach(() => {
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  resetTemplateLoopWarnings()
  clearComponentCache()
})

afterEach(() => {
  console.warn = realWarn
})

async function render(markup: string): Promise<string> {
  const root = createTempDir('stx-template-loop-')
  await mkdir(join(root, 'components'), { recursive: true })
  await Bun.write(join(root, 'components', 'Btn.stx'), '<script client>\nconst label = useReactiveProp(\'ariaLabel\', \'\')\n</script><button :aria-label="label"><slot /></button>\n')
  const file = join(root, 'page.stx')
  const page = `<script client>\nconst actions = state([{ action: 'edit' }])\n</script>${markup}`
  await Bun.write(file, page)
  return processDirectives(page, {}, file, { root, componentsDir: join(root, 'components'), cache: false }, new Set())
}

const templateLoopWarnings = (): string[] => warnings.filter(line => line.includes('<template :for>'))

describe('a component inside a template loop', () => {
  it('is named, with the file and the spelling that works', async () => {
    await render('<template :for="action in actions()"><Btn :ariaLabel="action.action" /></template>')
    expect(templateLoopWarnings()).toHaveLength(1)
    expect(templateLoopWarnings()[0]).toContain('<Btn>')
    expect(templateLoopWarnings()[0]).toContain('page.stx')
    expect(templateLoopWarnings()[0]).toContain(':for')
  })

  it('is reported once per component and file, not once per render pass', async () => {
    await render('<template :for="action in actions()"><Btn :ariaLabel="action.action" /><Btn :ariaLabel="action.action" /></template>')
    expect(templateLoopWarnings()).toHaveLength(1)
  })

  it('says nothing when the loop is on the element it repeats', async () => {
    await render('<div :for="action in actions()"><Btn :ariaLabel="action.action" /></div>')
    expect(templateLoopWarnings()).toEqual([])
  })

  it('says nothing for a template loop that holds no component', async () => {
    await render('<template :for="action in actions()"><button :aria-label="action.action"></button></template>')
    expect(templateLoopWarnings()).toEqual([])
  })
})
