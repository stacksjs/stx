import { join } from 'node:path'

/** The same shared fields on the native protocol and its browser peer host. */
export const textareaMultilineSource = `@import('Textarea', '${join(import.meta.dir, '../../components/src/ui/textarea/Textarea.stx')}')
<script client>
const value = state('\\nSeed\\nSecond\\n')
const lazy = state('Saved')
const shown = state(true)
window.probe = { value, lazy, shown, inputs: [], legacyInputs: [], legacySubmits: [], submits: 0 }
</script>
<form id="form" @submit.prevent="window.probe.submits++">
  <div :if="shown">
    <Textarea id="notes" name="notes" placeholder="Notes" v-model:value="value" @input="window.probe.inputs.push($event)" />
    <Textarea id="lazy-notes" placeholder="Lazy notes" v-model:value.lazy.trim="lazy" />
  </div>
  <TextInput id="legacy" testID="legacy" value="Legacy"
    @input="window.probe.legacyInputs.push($event.text)"
    @submit-editing="window.probe.legacySubmits.push([$event.text, $event.marker])" />
  <TextInput id="explicit-single" testID="explicit-single" :multiline="false" value="Single" />
  <TextInput id="explicit-multi" testID="explicit-multi" :multiline="true" value="Multi" />
  <input id="plain" testID="plain" value="Plain" />
</form>`
