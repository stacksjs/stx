/**
 * A press on a control an `:if` has just shown is the person's, not the
 * click that showed it: native events name the node they happened at, so the
 * runtime's guard against an opener's click reaching what it opened lets a
 * real press through at once (native-host.ts `eventAt`).
 */
import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

async function pressedAt(template: string): Promise<boolean> {
  const { code } = await compileNativeScreen(`<script client>
const items = state([])
function mark() { globalThis.__hits = (globalThis.__hits || 0) + 1 }
onMount(() => { setTimeout(() => items.set([1, 2]), 0) })
</script>${template}`, { name: 'Repro' })
  const phone = mountNativeScreen(code, 'main')
  // Pressed at once: inside the 50ms an opener's click is kept from what it opened.
  await Bun.sleep(20)
  phone.press(phone.byTestID('after')!)
  await Bun.sleep(10)
  return phone.context.__hits === 1
}

describe('a press on what an :if has just shown', () => {
  it('reaches a row after a loop inside it', async () => {
    expect(await pressedAt(`<View><View :if="items().length"><View :for="item in items()" :key="item"><Text :text="String(item)" /></View><View testID="after" @click="mark()" /></View></View>`)).toBe(true)
  })

  it('reaches a row alone inside it', async () => {
    expect(await pressedAt(`<View><View :if="items().length"><View testID="after" @click="mark()" /></View></View>`)).toBe(true)
  })

  it('reaches a row after a loop that was always there', async () => {
    expect(await pressedAt(`<View><View :for="item in items()" :key="item"><Text :text="String(item)" /></View><View testID="after" @click="mark()" /></View>`)).toBe(true)
})
})
