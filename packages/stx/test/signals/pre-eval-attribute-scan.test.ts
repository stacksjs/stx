import { describe, expect, it, mock } from 'bun:test'

mock.module('@stacksjs/ts-i18n', () => ({ loadLocale: async () => ({}) }))

const { preEvalLiteralReactiveIfs } = await import('../../src/signal-processing')

describe('literal conditional attribute scanning', () => {
  it('preserves an attribute-rich native form with runtime-only conditions within a bounded process', async () => {
    // A shared Nutrition view expands TextInput into these ordinary input tags
    // before inApp is decided by the client. Quoted class/handler values
    // must not make the absence of a literal attribute expensive to establish.
    const field = `<input
      data-stx-native-host-root
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
      type="text"
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
\x20\x20\x20\x20\x20\x20
      id="nutrition-name"
      class="block w-full border-0 rounded-control shadow-sm ring-1 ring-inset transition-colors duration-200 focus:ring-2 focus:ring-inset px-control-x py-control-y text-control ring-line-strong text-fg placeholder-fg-soft focus:ring-accent bg-field"

\x20\x20\x20\x20\x20\x20
      value="Breakfast bowl"
      :value="inputValue()"
      placeholder="Meal name"
\x20\x20\x20\x20\x20\x20
      :disabled="isDisabled()"
\x20\x20\x20\x20\x20\x20
      :readonly="isReadonly()"
\x20\x20\x20\x20\x20\x20
      maxlength="120"
      @input="onInput($event)"
      @change="onChange($event)"
      @focus="onFocus($event)"
      @blur="onBlur($event)"
      aria-invalid="false"
      :aria-invalid="isError() ? 'true' : 'false'"
      :class="{ 'ring-danger-line text-danger-fg placeholder-danger focus:ring-danger-focus': isError(), 'ring-line-strong text-fg placeholder-fg-soft focus:ring-accent': !isError(), 'opacity-50 cursor-not-allowed': isDisabled(), 'bg-surface': isDisabled() || isReadonly(), 'bg-field': !isDisabled() && !isReadonly(), 'cursor-default': !isDisabled() && isReadonly() }"
\x20\x20\x20\x20\x20\x20
    />`
    const input = `<section :if="inApp">${field.repeat(16)}</section><section :if="!inApp"><NutritionWebsite /></section>`
    const source = new URL('../../src/signal-processing.ts', import.meta.url).href
    const script = `
import { mock } from 'bun:test'
mock.module('@stacksjs/ts-i18n', () => ({ loadLocale: async () => ({}) }))
const { preEvalLiteralReactiveIfs } = await import(${JSON.stringify(source)})
const input = ${JSON.stringify(input)}
// Component and page pipelines repeat this prepass during ordinary SSR.
for (let pass = 0; pass < 128; pass++) {
  if (preEvalLiteralReactiveIfs(input) !== input) throw new Error('Runtime-only branches or attributes changed')
}
`
    const child = Bun.spawn([process.execPath, '--eval', script], { stdout: 'pipe', stderr: 'pipe' })
    let timedOut = false
    // This watchdog lives in a different process: a blocked regex cannot stop
    // the deadline itself from running, unlike a timeout around an inline call.
    const watchdog = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, 5000)
    try {
      const [code, stdout, stderr] = await Promise.all([
        child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
      ])
      expect(timedOut, 'Attribute scanning exceeded its independent five-second watchdog').toBe(false)
      expect(code, stderr || stdout).toBe(0)
    }
    finally {
      clearTimeout(watchdog)
      if (child.exitCode === null) child.kill('SIGKILL')
      await child.exited
    }
  }, 10_000)

  it('keeps surrounding attributes and whitespace byte for byte when stripping a literal', () => {
    const input = `<Widget\n data-note='left > right'\t:if = "true"\n disabled data-json='{"x":"<tag>"}' />`
    expect(preEvalLiteralReactiveIfs(input)).toBe(`<Widget\n data-note='left > right'\n disabled data-json='{"x":"<tag>"}' />`)
  })

  it('does not read conditional-looking text inside another attribute', () => {
    const input = `<div data-example='<span :if="false">example</span>' :if="inApp">kept</div>`
    expect(preEvalLiteralReactiveIfs(input)).toBe(input)
  })

  it('keeps a runtime conditional ahead of another literal binding for the client', () => {
    const input = '<input :if="inApp" :show="false" value="kept" />'
    expect(preEvalLiteralReactiveIfs(input)).toBe(input)
  })

  it('defers an opening tag whose server-side attribute directives are unresolved', () => {
    // Select's first-paint options must survive until the server loop has
    // resolved selected/disabled attributes. The runtime later removes these
    // fallback options when its live list takes over.
    const input = `<option x-no-cloak x-if="false" value="{{ option.value }}" @if(option.value === String(value))selected@endif>{{ option.label }}</option>`
    expect(preEvalLiteralReactiveIfs(input)).toBe(input)
  })

  it('keeps unsupported quote forms, casing and lookalike attribute names unchanged', () => {
    const input = `<p :if='false'>single</p><p :if=false>bare</p><p :IF="false">upper</p><p :if-more="false">other</p>`
    expect(preEvalLiteralReactiveIfs(input)).toBe(input)
  })

  it('does not confuse a quoted greater-than with the end of a void or custom tag', () => {
    expect(preEvalLiteralReactiveIfs('<input data-note="x > y" :show="false" />after')).toBe('after')
    expect(preEvalLiteralReactiveIfs('<my-field data-note="x > y" :if="false"><b>gone</b></my-field>after')).toBe('after')
  })

  it('still defers sibling else chains and handles nested literal elements', () => {
    const chain = '<p data-note="x > y" :if="true">A</p> text <!-- gap --> <p :else>B</p>'
    expect(preEvalLiteralReactiveIfs(chain)).toBe(chain)
    expect(preEvalLiteralReactiveIfs('<div :if="true"><span :if="false">gone</span>kept</div>')).toBe('<div>kept</div>')
  })

  it('leaves script/style bodies and incomplete quoted attributes alone', () => {
    const input = `<script>const s = '<p :if="false">text</p>'</script><style>p::after { content: '<i :show="false">'; }</style><div data-note="unfinished :if='false' >`
    expect(preEvalLiteralReactiveIfs(input)).toBe(input)
  })
})
