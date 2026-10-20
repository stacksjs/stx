import { describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

describe('scoped slot typechecking (#2096)', () => {
  it('binds slot locals lexically in every expression form', async () => {
    const dir = createTempDir('stx-check-slots-')
    const file = path.join(dir, 'page.stx')
    const source = `<script client>
const row = 'caller'
function edit(value: unknown) {}
</script>
<Table>
  <template #cell="{ row, index: position }">
    <p x-text="row.name" :title="row.name" :if="row.active" @click="edit(row)">{{ row.name }} {{ position }}</p>
    <Table><template v-slot:cell="cellProps">
      <p>{{ cellProps.row.name }} {{ row.name }}</p>
    </template></Table>
    <p>{{ cellProps.row }}</p>
    <p>{{ misspelled.name }}</p>
  </template>
  <template #actions='{
    row: item
  }'><p>{{ item.name }}</p></template>
  <template #footer="cellProps"><p>{{ cellProps.total }}</p></template>
</Table>
<p>{{ position }} {{ item }} {{ cellProps }} {{ row.nonexistent }}</p>`
    await Bun.write(file, source)
    try {
      const result = await typecheckStxFiles([file])
      const errors = result.diagnostics.filter(d => d.category === 'error')
      expect(errors.map(d => d.expression)).toEqual([
        'cellProps.row',
        'misspelled.name',
        'position',
        'item',
        'cellProps',
        'row.nonexistent',
      ])
      expect(errors.every(d => d.blockKind === 'template')).toBe(true)
      expect(errors.at(-1)?.code).toBe(2339)
      expect(errors.at(-1)?.line).toBe(source.split('\n').length)
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('also binds props and typed event handlers on components inside slots', async () => {
    const dir = createTempDir('stx-check-slot-contract-')
    const file = path.join(dir, 'page.stx')
    try {
      await Bun.write(path.join(dir, 'components/Action.stx'), `<script client>
const props = defineProps<{ label: string }>()
const emit = defineEmits<{ select: [value: string] }>()
</script><button></button>`)
      await Bun.write(file, `<script client>
function edit(row: unknown, value: string) {}
</script>
<Table><template #cell="{ row }">
  <Action :label="row.name" @select="edit(row, $event)" />
  <Action :label="123" />
</template></Table>`)
      const result = await typecheckStxFiles([file])
      expect(result.failure).toBeUndefined()
      const errors = result.diagnostics.filter(d => d.category === 'error')
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(6)
      expect(errors[0].message).toContain('string')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
