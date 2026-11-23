/**
 * Classes a touch host ignores on purpose are named, not dropped silently
 * (stacksjs/ts-css#38: "reject unsupported styles truthfully").
 *
 * `hover:`, `transition`, `cursor-*` and a focus ring are the browser's own
 * behaviour. Native has nothing to draw for them, and a shared view is
 * expected to carry them, so they are not unknown classes: the build names
 * the ones a screen writes, once per screen.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileClassStyles, ignoredOnTouch } from '../../src/native/compiler/utilities-to-style'
import type { TranslationDiagnostic } from '../../src/native/compiler/html-to-ir'
import { compileScreenSource } from '../../src/native/compiler/render-screen'

const compile = (markup: string) => compileScreenSource(markup, path.join(import.meta.dir, 'WebOnly.stx'))
const webOnly = (diagnostics: TranslationDiagnostic[]) => diagnostics.filter(item => item.kind === 'web-only-class')

describe('web-only classes', () => {
  it('should name what a touch host drops, and nothing it draws', () => {
    expect(ignoredOnTouch('p-4 hover:bg-red-500 transition cursor-pointer md:p-2 dark:hover:bg-black focus:ring-2 select-none')).toEqual([
      'hover:bg-red-500',
      'transition',
      'cursor-pointer',
      'dark:hover:bg-black',
      'focus:ring-2',
      'select-none',
    ])
  })

  /** Exactly what the compiler drops: the list is built by the same checks. */
  it('should agree with what the compiler keeps', () => {
    const classes = 'p-4 hover:bg-red-500 transition cursor-pointer'
    const compiled = compileClassStyles(classes)
    expect(compiled.style).toEqual({ padding: 16 })
    expect(compiled.unknown).toEqual([])
    expect(ignoredOnTouch(classes)).toEqual(['hover:bg-red-500', 'transition', 'cursor-pointer'])
  })

  /** Focus styles on a control that is not a text input stay unknown, as before. */
  it('should leave an unsupported focus style to the unknown-class report', () => {
    expect(ignoredOnTouch('focus:bg-red-500')).toEqual([])
    expect(compileClassStyles('focus:bg-red-500').unknown).toEqual(['focus:bg-red-500'])
  })

  it('should report a screen\'s own web-only classes once, together', async () => {
    const { diagnostics } = await compile(`<View class="p-4 hover:bg-slate-100 cursor-pointer">
<Text class="transition hover:bg-slate-100">One</Text>
<Text class="text-sm">Two</Text>
</View>`)
    expect(webOnly(diagnostics)).toEqual([{ kind: 'web-only-class', tag: 'class', name: 'cursor-pointer hover:bg-slate-100 transition' }])
    expect(diagnostics.filter(item => item.kind === 'unknown-class')).toEqual([])
  })

  it('should include what a bound :class can produce', async () => {
    const { diagnostics } = await compile(`<script client>
const on = state(false)
</script>
<View :class="on() ? 'opacity-50 duration-200' : 'opacity-100'"></View>`)
    expect(webOnly(diagnostics)).toEqual([{ kind: 'web-only-class', tag: 'class', name: 'duration-200' }])
  })

  it('should say nothing for a screen that writes none', async () => {
    const { diagnostics } = await compile(`<View class="p-4 bg-white dark:bg-black"><Text class="text-sm">Plain</Text></View>`)
    expect(webOnly(diagnostics)).toEqual([])
  })
})
