import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { seedClassTable } from '../../src/native/compiler/class-table'
import { classStyleKey, compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { createStyleVariables } from '../../src/native/compiler/style-variables'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const source = `<script client>const on = state(false)</script>
<View class="flex-1 p-4 bg-white dark:bg-black">
  <Text testID="title" class="text-lg font-semibold text-gray-900 dark:text-white">Title</Text>
  <Pressable testID="row" class="flex-row items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition">
    <Text class="text-lg font-semibold text-gray-900 dark:text-white">Row</Text>
  </Pressable>
  <TextInput testID="field" class="h-9 px-2 border border-gray-300 focus:border-blue-500" />
</View>`

describe('the class table a screen ships with', () => {
  it('holds each static class list once per way the runtime asks for it', async () => {
    const root = createTempDir('stx-class-table-')
    const { document } = await compileScreenSource(source, path.join(root, 'Screen.stx'))
    const table = document.root._classTable!
    expect(table).toBeDefined()
    // Repeated lists and identical variants are stored once.
    const keys = Object.keys(table.plain).length + Object.keys(table.light).length + Object.keys(table.dark).length
    expect(table.entries.length).toBeLessThan(keys)
    expect(table.plain[classStyleKey('text-lg font-semibold text-gray-900 dark:text-white')]).toBeNumber()
    expect(Object.keys(table.light).some(key => key.startsWith('011light|') && key.includes('hover:bg-gray-100'))).toBe(true)
    expect(Object.keys(table.dark).some(key => key.startsWith('110dark|') && key.includes('focus:border-blue-500'))).toBe(true)
  })

  it('is what the cache answers once seeded', async () => {
    const root = createTempDir('stx-class-table-seed-')
    const { document } = await compileScreenSource(source, path.join(root, 'Screen.stx'))
    const table = document.root._classTable!
    const variables = createStyleVariables(document.root._stylesheetTheme?.light ?? []).computed()
    seedClassTable(table, 'light', variables, document.root._stylesheetRules)
    const list = 'flex-row items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition'
    expect(compileClassStyles(list)).toBe(table.entries[table.plain[classStyleKey(list)]!]!)
  })

  it('leaves the mounted screen exactly as compiling at runtime would', async () => {
    const root = createTempDir('stx-class-table-mount-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, source)
    const { code } = await compileSharedScreenBundle(file, { root })
    // The same bundle with the table stripped: every list compiled on the device.
    // Renamed where it is written as a key, not where the runtime reads it.
    const bare = code.replace(/([{,]\s*"?)_classTable("?\s*:)/g, '$1_unusedClassTable$2')
    expect(bare).not.toBe(code)
    const styles = (bundle: string, scheme: 'light' | 'dark') => {
      const screen = mountNativeScreen(bundle, 'Screen', { platform: 'macos', colorScheme: scheme })
      return ['title', 'row', 'field'].map(id => JSON.stringify(screen.byTestID(id)!.style))
    }
    for (const scheme of ['light', 'dark'] as const) expect(styles(code, scheme)).toEqual(styles(bare, scheme))
  })
})
