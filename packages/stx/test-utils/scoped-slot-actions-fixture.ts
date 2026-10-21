// Unlike a text-only slot, this projection renders a component with its own
// setup scope inside the table's client loop. See #2101.
export const scopedActionsTable = `<script client>
const rows = useReactiveProp('data', [])
const visibleRows = derived(() => rows())
</script>
<section><slot name="toolbar" /><table><tbody>
<template :for="row in visibleRows()" :key="row.id"><tr>
<td>{{ row.name }}</td>
<td :if="$slots.actions"><slot name="actions" :row="row" /></td>
</tr></template>
</tbody></table></section>`

export function scopedActionsCaller(actions = true): string {
  return `<script client>
const rows = state(Array.from({ length: 50 }, (_, id) => ({ id, name: 'row-' + id })))
const visibleRows = derived(() => rows())
window.actionsRows = rows
window.editedRows = []
function edit(row) { window.editedRows.push(row.id) }
</script>
<Table :data="visibleRows()">
${actions ? '<template #actions="{ row }"><Button variant="ghost" size="sm" @click="edit(row)">Edit</Button></template>' : ''}
<template #toolbar><span>toolbar-control</span></template>
</Table>`
}
