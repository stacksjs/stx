/**
 * Tests for the stx-strict footgun linter (stacksjs/stx#1744, Phase 1).
 *
 * Lint false-positives erode trust, so every rule is tested for what it must
 * flag AND a battery of look-alikes it must NOT flag.
 *
 * `strict-lint.ts` has no package imports, so this file needs no module mocks.
 */
import { describe, expect, it } from 'bun:test'
import type { StxStrictRuleId } from '../src/strict-lint'
import { lintStxStrict } from '../src/strict-lint'

function ids(src: string, opts = {}): StxStrictRuleId[] {
  return lintStxStrict(src, opts).map(d => d.ruleId)
}
function count(src: string, rule: StxStrictRuleId, opts = {}): number {
  return lintStxStrict(src, opts).filter(d => d.ruleId === rule).length
}

describe('stx/no-bare-function-ref-in-event', () => {
  const R = 'stx/no-bare-function-ref-in-event'

  it('flags @click="handler" (no parens)', () => {
    expect(count('<button @click="toggleLike">x</button>', R)).toBe(1)
  })

  it('flags a bare member path @submit="form.handleSubmit"', () => {
    expect(count('<form @submit="form.handleSubmit"></form>', R)).toBe(1)
  })

  it('flags handlers with modifiers @click.stop.prevent="open"', () => {
    expect(count('<a @click.stop.prevent="open">x</a>', R)).toBe(1)
  })

  it('does NOT flag a called handler @click="toggleLike()"', () => {
    expect(count('<button @click="toggleLike()">x</button>', R)).toBe(0)
  })

  it('does NOT flag a called member @submit="form.handleSubmit()"', () => {
    expect(count('<form @submit="form.handleSubmit()"></form>', R)).toBe(0)
  })

  it('does NOT flag inline statements / expressions', () => {
    expect(count('<button @click="count++">x</button>', R)).toBe(0)
    expect(count('<button @click="open = true">x</button>', R)).toBe(0)
    expect(count('<button @click="() => doThing()">x</button>', R)).toBe(0)
    expect(count('<input @input="onInput($event)" />', R)).toBe(0)
  })

  it('does NOT flag stx directives (@if/@for/@show are not events)', () => {
    expect(count('<div @if="isAdmin">x</div>', R)).toBe(0)
    expect(count('<div @show="visible">x</div>', R)).toBe(0)
    expect(count('<li @for="item in items">x</li>', R)).toBe(0)
  })

  it('does NOT flag bare refs inside <script> bodies', () => {
    expect(count('<script>const x = "@click=\\"foo\\""</script>', R)).toBe(0)
  })
})

describe('stx/no-view-level-script-client', () => {
  const R = 'stx/no-view-level-script-client'

  it('flags <script client> in a view file', () => {
    expect(count('<script client>const x = 1</script>', R, { filePath: 'resources/views/home.stx' })).toBe(1)
  })

  it('flags <script client> when fileKind is forced to view', () => {
    expect(count('<script client>x</script>', R, { fileKind: 'view' })).toBe(1)
  })

  it('does NOT flag <script client> in a component file', () => {
    expect(count('<script client>x</script>', R, { filePath: 'resources/components/Card.stx' })).toBe(0)
  })

  it('does NOT flag a plain <script> (server) in a view', () => {
    expect(count('<script>const x = 1</script>', R, { fileKind: 'view' })).toBe(0)
  })

  it('does NOT mistake data-client / a client substring for the attribute', () => {
    expect(count('<script data-client="x">y</script>', R, { fileKind: 'view' })).toBe(0)
  })
})

describe('stx/store-value-imports-must-be-local', () => {
  const R = 'stx/store-value-imports-must-be-local'
  const STORE = 'resources/stores/cart.ts'

  it('flags a bare-specifier value import in a store file', () => {
    expect(count(`import { debounce } from 'lodash-es'`, R, { filePath: STORE })).toBe(1)
  })

  it('flags an alias/package value import', () => {
    expect(count(`import { helper } from '@stacksjs/utils'`, R, { filePath: STORE })).toBe(1)
  })

  it('flags a relative import that escapes the stores dir', () => {
    expect(count(`import { x } from '../../helpers/x'`, R, { filePath: STORE })).toBe(1)
  })

  it('does NOT flag a relative import that stays inside the stores dir', () => {
    expect(count(`import { other } from './other-store'`, R, { filePath: STORE })).toBe(0)
  })

  it('does NOT flag `import type` (erased, safe)', () => {
    expect(count(`import type { Foo } from 'somewhere'`, R, { filePath: STORE })).toBe(0)
  })

  it('does NOT run outside resources/stores/', () => {
    expect(count(`import { debounce } from 'lodash-es'`, R, { filePath: 'resources/views/home.stx' })).toBe(0)
  })
})

describe('stx/no-signal-call-in-for-iteration-var', () => {
  const R = 'stx/no-signal-call-in-for-iteration-var'

  it('flags calling the loop var: :for="item in items()" then {{ item() }}', () => {
    expect(count('<li :for="item in items()">{{ item() }}</li>', R)).toBe(1)
  })

  it('flags the Blade form "items as item" with item()', () => {
    expect(count('<li :for="items as item">{{ item() }}</li>', R)).toBe(1)
  })

  it('flags the parenthesized form (item, idx)', () => {
    expect(count('<li :for="(item, idx) in items()">{{ item() }}</li>', R)).toBe(1)
  })

  it('does NOT flag calling a METHOD on the loop var: item.toUpperCase()', () => {
    expect(count('<li :for="item in items()">{{ item.name.toUpperCase() }}</li>', R)).toBe(0)
  })

  it('does NOT flag using the loop var directly', () => {
    expect(count('<li :for="item in items()">{{ item.name }}</li>', R)).toBe(0)
  })

  it('does NOT flag a same-named call OUTSIDE the loop body', () => {
    // `item()` after the loop element closes is a different `item`, not the loop var.
    expect(count('<li :for="item in items()">{{ item.id }}</li><p>{{ item() }}</p>', R)).toBe(0)
  })
})

describe('stx/no-backticks-in-html-comments', () => {
  const R = 'stx/no-backticks-in-html-comments'

  it('flags a backtick inside an HTML comment', () => {
    expect(count('<!-- use `code` here -->', R)).toBe(1)
  })

  it('does NOT flag a backtick-free comment', () => {
    expect(count('<!-- a normal comment -->', R)).toBe(0)
  })

  it('does NOT flag backticks in real markup outside comments', () => {
    expect(count('<script>const x = `template`</script>', R)).toBe(0)
  })
})

describe('stx-strict — adversarial FP/FN review regressions (stacksjs/stx#1744)', () => {
  it('R1: flags colon-namespaced events (@update:modelValue="handler")', () => {
    expect(count('<MyComp @update:modelValue="handler" />', 'stx/no-bare-function-ref-in-event')).toBe(1)
  })

  it('R1: @model:foo is still treated as the model directive (not flagged)', () => {
    expect(count('<input @model:foo="x" />', 'stx/no-bare-function-ref-in-event')).toBe(0)
  })

  it('R3: flags value re-exports (export { x } from "outside")', () => {
    expect(count(`export { debounce } from 'lodash-es'`, 'stx/store-value-imports-must-be-local', { filePath: 'resources/stores/cart.ts' })).toBe(1)
  })

  it('R3: does NOT flag `export type { T } from ...`', () => {
    expect(count(`export type { T } from 'somewhere'`, 'stx/store-value-imports-must-be-local', { filePath: 'resources/stores/cart.ts' })).toBe(0)
  })

  it('R4: flags calling the SECOND destructured var (item, idx) => idx()', () => {
    expect(count('<li :for="(item, idx) in items()">{{ idx() }}</li>', 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: flags the Blade "items as (item, idx)" second var', () => {
    expect(count('<li :for="items as (item, idx)">{{ idx() }}</li>', 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: a `$` loop var is regex-escaped, not treated as an anchor', () => {
    expect(count('<div :for="$ in xs">{{ $() }}</div>', 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: nested same-named :for does NOT double-report the inner call', () => {
    const html = '<div :for="item in items"><span :for="item in item.children">{{ item() }}</span></div>'
    expect(count(html, 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: flags a loop-var call in an attribute on the :for element itself (:key="item()")', () => {
    expect(count('<li :for="item in items" :key="item()"></li>', 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: flags a loop-var call in an @event on a self-closing :for element', () => {
    expect(count('<input :for="item in items" @change="item()" />', 'stx/no-signal-call-in-for-iteration-var')).toBe(1)
  })

  it('R4: does NOT match the iterable (items()) as a call of var "item"', () => {
    expect(count('<li :for="item in items()">{{ item.name }}</li>', 'stx/no-signal-call-in-for-iteration-var')).toBe(0)
  })
})

describe('lintStxStrict — composition + options', () => {
  it('reports multiple rules in one pass, sorted by position', () => {
    const src = [
      '<!-- `bad` -->',
      '<button @click="save">x</button>',
    ].join('\n')
    const found = ids(src, { fileKind: 'view' })
    expect(found).toContain('stx/no-backticks-in-html-comments')
    expect(found).toContain('stx/no-bare-function-ref-in-event')
    // sorted by line: comment (line 1) before the button (line 2)
    const lines = lintStxStrict(src, { fileKind: 'view' }).map(d => d.line)
    expect(lines).toEqual([...lines].sort((a, b) => a - b))
  })

  it('respects rule toggles', () => {
    const src = '<button @click="save">x</button>'
    expect(count(src, 'stx/no-bare-function-ref-in-event', { rules: { 'stx/no-bare-function-ref-in-event': false } })).toBe(0)
  })

  it('reports accurate 1-based line/column', () => {
    const src = 'line1\n<button @click="save">x</button>'
    const d = lintStxStrict(src).find(x => x.ruleId === 'stx/no-bare-function-ref-in-event')!
    expect(d.line).toBe(2)
    // column points at the value `save`
    expect(src.split('\n')[1].slice(d.column - 1)).toStartWith('save')
  })

  it('a clean view produces no diagnostics', () => {
    const src = '<button @click="save()">{{ title }}</button><div :for="x in xs()">{{ x.name }}</div>'
    expect(lintStxStrict(src, { fileKind: 'view' })).toHaveLength(0)
  })
})
