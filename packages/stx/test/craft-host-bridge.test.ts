import { expect, test } from 'bun:test'
import { CRAFT_BRIDGE_SCRIPT } from '../src/craft-bridge'

test('preserves the native host bridge and its complete API', () => {
  const dialog = { showOpenDialog: () => Promise.resolve({ canceled: true }) }
  const onFileDrop = () => {}
  const craft = { __craft_bridge_loaded: true, dialog, onFileDrop }
  const host = { craft }
  const code = CRAFT_BRIDGE_SCRIPT.replace(/<\/?script>/g, '')
  new Function('window', code)(host)
  expect(host.craft).toBe(craft)
  expect(host.craft.dialog).toBe(dialog)
  expect(host.craft.onFileDrop).toBe(onFileDrop)
})
