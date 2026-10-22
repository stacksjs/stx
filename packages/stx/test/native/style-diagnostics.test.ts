import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

describe('native unsupported style diagnostics (#2090)', () => {
  it('reports unsupported variants and retains the authored dark class name', () => {
    // Width variants are layers and pointer-only variants mean nothing on a
    // touch screen: neither is reported. A class nothing understands still is.
    const result = compileClassStyles('p-4 md:p-8 hover:bg-red-500 dark:rounded-missing dark:focus:border-wobble max-md:p-2')
    expect(result.style).toEqual({ padding: 16 })
    expect(result.responsive).toEqual([{ min: 768, style: { padding: 32 } }])
    expect(result.unknown).toEqual(expect.arrayContaining(['dark:rounded-missing', 'dark:focus:border-wobble', 'max-md:p-2']))
    expect(result.unknown).not.toContain('md:p-8')
    expect(result.unknown).not.toContain('hover:bg-red-500')
    expect(compileClassStyles('truncate line-clamp-3 dark:p-8').unknown).toEqual([])
    expect(compileClassStyles('ring-primary dark:ring-primary dark:line-clamp-2').unknown).toEqual(['ring-primary', 'dark:ring-primary', 'dark:line-clamp-2'])
  })

  for (const minify of [false, true]) {
    it(`reports computed classes without process and avoids repeated warnings (minify=${minify})`, async () => {
      const root = createTempDir('stx-style-diagnostics-')
      const file = join(root, 'Screen.stx')
      await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
      await Bun.write(file, `<script client>
const classes = state('p-4')
window.probe = { classes }
</script>
<div testID="target" :class="classes"></div>
<div class="max-md:p-8 dark:rounded-missing"></div>`)
      const result = await compileSharedScreenBundle(file, { root, minify })
      expect(result.diagnostics).toContainEqual({ level: 'warning', message: 'unknown-class: div: max-md:p-8' })
      expect(result.diagnostics).toContainEqual({ level: 'warning', message: 'unknown-class: div: dark:rounded-missing' })
      const warnings: string[] = []
      const phone = mountNativeScreen(result.code, 'Screen', { globals: {
        console: { ...console, warn: (message: string) => warnings.push(message) },
      } })
      try {
        await phone.settle()
        expect(phone.context.process).toBeUndefined()
        const target = phone.byTestID('target')!
        const warning = `[STX Native] unknown-class: ${target.id}: rounded-missing`
        expect(warnings.filter(message => message.includes(`: ${target.id}:`))).toEqual([])
        phone.context.probe.classes.set('p-8 rounded-missing max-md:p-12 dark:rounded-other')
        await phone.settle()
        expect(phone.byTestID('target')!.style.padding).toBe(32)
        expect(warnings).toContain(warning)
        expect(warnings).toContain(`[STX Native] unknown-class: ${target.id}: max-md:p-12`)
        expect(warnings).toContain(`[STX Native] unknown-class: ${target.id}: dark:rounded-other`)
        phone.appearance('dark')
        phone.context.probe.classes.set('p-4 rounded-missing max-md:p-12 dark:rounded-other')
        await phone.settle()
        expect(warnings.filter(message => message === warning)).toHaveLength(1)
        phone.context.probe.classes.set('p-4')
        await phone.settle()
        phone.context.probe.classes.set({ 'rounded-missing': true, 'rounded-inactive': false })
        await phone.settle()
        expect(warnings.filter(message => message === warning)).toHaveLength(2)
        expect(warnings.some(message => message.includes('rounded-inactive'))).toBe(false)
        phone.context.probe.classes.set(['p-4', false, 'rounded-missing'])
        await phone.settle()
        expect(phone.byTestID('target')!.style.padding).toBe(16)
        expect(warnings.filter(message => message === warning)).toHaveLength(2)
      }
      finally {
        phone.unmount()
      }
    }, 30_000)
  }
})
