import { describe, expect, it } from 'bun:test'
import { textareaMultilineSource } from '../../test-utils/textarea-multiline-fixture'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe('native textarea multiline semantics', () => {
  it('defaults only textarea to multiline and preserves explicit native input props', async () => {
    const { root } = await translateHtmlToIR(`<section>
<textarea></textarea><input /><input data-native="TextInput" />
<input data-native="TextInput" multiline="true" /><input data-native="TextInput" multiline="false" />
<textarea multiline="false"></textarea>
</section>`)
    const fields = root.children.filter(child => typeof child !== 'string')
    expect(fields.map(field => field.type)).toEqual(Array(6).fill('TextInput'))
    expect(fields.map(field => field.props.multiline)).toEqual([true, undefined, undefined, true, false, false])
  })

  for (const platform of ['ios', 'android'] as const) {
    for (const minify of [false, true]) {
      it(`preserves newlines, retained identity, remounts and legacy inputs (${platform}, minify=${minify})`, async () => {
        const { code } = await compileNativeScreen(textareaMultilineSource, { minify })
        const phone = mountNativeScreen(code, 'Screen', { platform })
        const field = (id = 'notes') => phone.find(node => node.type === 'TextInput' && node.props.id === id)!
        const probe = phone.context.probe
        try {
          await phone.settle()
          const original = field()
          expect(original.props).toMatchObject({ multiline: true, value: '\nSeed\nSecond\n' })
          expect(field('lazy-notes').props.multiline).toBe(true)
          expect(original.events.onSubmitEditing).toBeFalsy()
          for (const id of ['legacy', 'plain', 'explicit-single']) {
            expect(field(id).props.multiline).not.toBe(true)
            expect(field(id).events.onSubmitEditing).toBeTruthy()
          }
          expect(field('explicit-multi').props.multiline).toBe(true)
          expect(field('explicit-multi').events.onSubmitEditing).toBeFalsy()

          const typed = '\n  First\nSecond  \n'
          phone.type(original, typed)
          await phone.settle()
          expect(probe.value()).toBe(typed)
          expect(probe.inputs).toEqual([typed])
          expect(field().props.value).toBe(typed)
          expect(field()).toBe(original)
          expect(probe.submits).toBe(0)
          const parent = '\nParent\n\nLast\n'
          probe.value.set(parent)
          await phone.settle()
          expect(field().props.value).toBe(parent)
          expect(field()).toBe(original)

          phone.type(field('lazy-notes'), '\n  Lazy\nlines  \n')
          expect(probe.lazy()).toBe('Saved')
          phone.press(field('lazy-notes'), 'onValueChange', { text: '\n  Lazy\nlines  \n' })
          await phone.settle()
          expect(probe.lazy()).toBe('Lazy\nlines')
          phone.type(field('legacy'), 'Legacy edit')
          phone.press(field('legacy'), 'onSubmitEditing', { text: 'Legacy edit', marker: 7 })
          await phone.settle()
          expect(probe.legacyInputs).toEqual(['Legacy edit'])
          expect(probe.legacySubmits).toEqual([['Legacy edit', 7]])

          probe.shown.set(false)
          await phone.settle()
          expect(field()).toBeUndefined()
          phone.type(original, 'Stale\ninput')
          expect(probe.value()).toBe(parent)
          const remount = 'Remount\n\nvalue\n'
          probe.value.set(remount)
          probe.shown.set(true)
          await phone.settle()
          const remounted = field()
          // A retained :if branch keeps its native identity across reinsertion.
          expect(remounted.id).toBe(original.id)
          expect(remounted.props).toMatchObject({ multiline: true, value: remount })
          expect(remounted.events.onSubmitEditing).toBeFalsy()
          phone.type(remounted, 'New\nedit')
          await phone.settle()
          expect(probe.value()).toBe('New\nedit')
          expect(field()).toBe(remounted)
          expect(probe.inputs).toEqual([typed, 'New\nedit'])
          expect(phone.mutationErrors).toEqual([])
          phone.unmount()
          const count = phone.messages.length
          probe.value.set('Disposed\nvalue')
          phone.type(remounted, 'Disposed\ninput')
          await phone.settle()
          expect(phone.messages).toHaveLength(count)
          const fresh = mountNativeScreen(code, 'Screen', { platform })
          try {
            await fresh.settle()
            const next = fresh.find(node => node.props.id === 'notes')!
            expect(next.props).toMatchObject({ multiline: true, value: '\nSeed\nSecond\n' })
            fresh.type(next, 'Fresh\nmount')
            await fresh.settle()
            expect(fresh.context.probe.value()).toBe('Fresh\nmount')
            expect(fresh.find(node => node.props.id === 'notes')).toBe(next)
            expect(fresh.mutationErrors).toEqual([])
          }
          finally { fresh.unmount() }
        }
        finally { phone.unmount() }
      }, 30_000)
    }
  }
})
