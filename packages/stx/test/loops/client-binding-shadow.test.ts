import { expect, it } from 'bun:test'
import { processLoops } from '../../src/loops'

it('keeps a client class binding live when server state has the same name', () => {
  const html = processLoops(`<script client>const selected = state(2)</script>
@foreach(rows as row)<button :class="{ on: selected === {{ row }} }"></button>@endforeach`, { rows: [1, 2], selected: 0 }, 'fixture.stx')
  expect(html).toContain(':class="{ on: selected === 1 }"')
  expect(html).toContain(':class="{ on: selected === 2 }"')
  expect(html).not.toContain('__stx_class')
})

for (const [binding, rows] of [
  ['row', [2, 3]],
  ['index => row', [2, 3]],
  ['row, index', [2, 3]],
  ['[row]', [[2], [3]]],
  ['{ id: row }', [{ id: 2 }, { id: 3 }]],
] as const) {
  it(`lets the server iteration binding ${binding} shadow an outer client signal`, () => {
    const html = processLoops(`<script client>const row = state(0)</script>
@foreach(rows as ${binding})<Row :value="row" />@endforeach`, { rows }, 'fixture.stx')
    expect(html).toContain('__stx_value="Mg=="')
    expect(html).toContain('__stx_value="Mw=="')
    expect(html).not.toContain(':value="row"')
  })
}
