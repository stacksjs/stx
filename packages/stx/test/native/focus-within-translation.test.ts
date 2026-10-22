import { expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

it('keeps ancestor-focus layers inactive initially and preserves unsupported authored names', async () => {
  const result = compileClassStyles('border-2 focus-within:border-4 dark:focus-within:bg-black focus-within:dark:text-white focus-within:ring-accent focus-within:truncate focus-visible:p-4', undefined, { focusWithin: true })
  expect(result.style).toEqual({ borderWidth: 2 })
  expect(result.focusWithin).toEqual({ style: { borderWidth: 4 }, dark: { backgroundColor: '#000000', color: '#ffffff' } })
  expect(result.unknown).toEqual(expect.arrayContaining(['focus-within:truncate', 'focus-visible:p-4']))
  expect(result.unknown).not.toContain('focus-within:ring-accent')
  expect(compileClassStyles('focus-within:p-4').unknown).toEqual(['focus-within:p-4'])
  const translated = await translateHtmlToIR('<div class="focus-within:border-4 focus-within:ring-2"><input /></div>')
  expect(translated.diagnostics.filter(d => d.kind === 'unknown-class').map(d => d.name)).toEqual([])
})

it('keeps direct focus and ancestor focus separate, including semantic dark overrides', () => {
  const result = compileClassStyles('focus:border-4 focus-within:border-accent', undefined, { focus: true, focusWithin: true })
  expect(result.focus?.style).toEqual({ borderWidth: 4 })
  expect(result.focusWithin?.style.borderColor).toBeTruthy()
  expect(result.focusWithin?.dark?.borderColor).toBeTruthy()
  expect(result.unknown).toEqual([])
  for (const name of ['focus-within:hover:p-4', 'dark:focus-within:dark:p-4', 'focus-within:focus:p-4'])
    expect(compileClassStyles(name, undefined, { focusWithin: true }).unknown).toContain(name)
})
