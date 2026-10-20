export const scopedSlotTable = `<script client>
const rows = state([])
const columns = state([{ key: 'name', slotted: true }])
window.slotTableRows = rows
window.slotTableColumns = columns
onMount(() => rows.set(Array.from({ length: 50 }, (_, id) => ({ id, name: 'row-' + id }))))
</script>
<table><tbody>
<template :for="row in rows()" :key="row.id"><tr>
  <template :for="column in columns()" :key="column.key"><td>
    <template :if="column.slotted">
      <slot name="cell" :row="row" :column="column" :value="row[column.key]" />
    </template>
    <template :else><span x-text="row[column.key]"></span></template>
  </td></template>
</tr></template>
</tbody></table>`

export const scopedSlotTableCaller = `<Probe><template #cell="{ row, column, value }">
<em class="interpolation">INTERP:{{ row.name }}</em>
<em class="attribute" :title="row.name" x-text="row.name"></em>
</template></Probe>`
