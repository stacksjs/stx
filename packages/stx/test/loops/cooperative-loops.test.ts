import { expect, it } from 'bun:test'
import { processLoops, processLoopsAsync } from '../../src/loops'

it('preserves nested scopes, escaping and loop controls across cooperative turns', async () => {
  const template = '@foreach(groups as group)@foreach(group.items as item)@continue(item === 0)@break(item === 3)<p title="{{ group.name }}">{{ viewer }}:{{ item }}</p>@endforeach@endforeach'
  const context = { viewer: '<alice>', groups: [{ name: 'A&', items: [0, 1, 2, 3, 4] }, { name: 'B', items: [0, 1, 2] }] }
  const expected = '<p title="A&amp;">&lt;alice&gt;:1</p><p title="A&amp;">&lt;alice&gt;:2</p><p title="B">&lt;alice&gt;:1</p><p title="B">&lt;alice&gt;:2</p>'
  expect(processLoops(template, context, 'nested.stx')).toBe(expected)
  expect(await processLoopsAsync(template, context, 'nested.stx')).toBe(expected)
})

it('preserves empty branches and destructured bindings in both entry points', async () => {
  const template = '@forelse(empty as item){{ item }}@empty<p>No rows</p>@endforelse@foreach(rows as { id: key, name })<b>{{ key }}:{{ name }}</b>@endforeach'
  const context = { empty: [], rows: [{ id: 1, name: 'First' }, { id: 2, name: 'Last' }] }
  const expected = '<p>No rows</p><b>1:First</b><b>2:Last</b>'
  expect(processLoops(template, context, 'bindings.stx')).toBe(expected)
  expect(await processLoopsAsync(template, context, 'bindings.stx')).toBe(expected)
})
