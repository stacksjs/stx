import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('delivers ghostText and the accept-completion handler of a multi-line TextInput to the host', async () => {
  const compiled = await compileNativeScreen(`<script client>
const body = state('Dear Sam,')
const ghost = state(' thanks for the update.')
window.probe = { body, ghost }
function accept() { body.set(body() + ghost()); ghost.set('') }
</script>
<View><TextInput multiline x-model="body" :ghostText="ghost()" @accept-completion="accept()" testID="editor" /></View>`, { name: 'GhostText', minify: false })
  const phone = mountNativeScreen(compiled.code, 'GhostText')
  try {
    await phone.settle()
    const editor = phone.byTestID('editor')!
    expect(editor.props.ghostText).toBe(' thanks for the update.')
    expect(editor.props.multiline).toBe(true)
    expect(editor.events.onAcceptCompletion).toBeDefined()
    // A change of the completion reaches the host as an update of the same prop.
    phone.context.probe.ghost.set(' and the rest.')
    await phone.settle()
    expect(phone.byTestID('editor')!.props.ghostText).toBe(' and the rest.')
  }
  finally { phone.unmount() }
})
