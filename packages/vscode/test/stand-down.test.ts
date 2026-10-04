import { describe, expect, test } from 'bun:test'
import { STACKS_EXTENSION_ID, STX_EXTENSION_ID } from '../src/ids'
import { stacksProvidesStx } from '../src/stand-down'

// The stx extension and the Stacks extension (which embeds the same stx
// support) must not both register it in one window (stacksjs/stx#2020).

interface FakeExtension {
  isActive: boolean
  exports: unknown
  activate: () => Promise<unknown>
}

function api(extensions: Record<string, FakeExtension | undefined>) {
  const asked: string[] = []
  return {
    asked,
    extensions: {
      getExtension: (id: string) => {
        asked.push(id)
        return extensions[id]
      },
    },
  }
}

function stacks(activation: () => Promise<unknown>, active = false, exports: unknown = undefined): FakeExtension {
  let activations = 0
  return {
    isActive: active,
    exports,
    activate: () => {
      activations++
      return activation()
    },
    get activations() {
      return activations
    },
  } as FakeExtension
}

describe('VSCODE: standing down for the Stacks extension', () => {
  test('serves stx itself when the Stacks extension is not installed or is disabled', async () => {
    const vscode = api({})
    expect(await stacksProvidesStx(vscode)).toBe(false)
    expect(vscode.asked).toEqual([STACKS_EXTENSION_ID])
  })

  test('stands down once the Stacks extension says it started stx support', async () => {
    expect(await stacksProvidesStx(api({ [STACKS_EXTENSION_ID]: stacks(async () => ({ stx: { active: true } })) }))).toBe(true)
  })

  test('reads an already-active Stacks extension\'s API without activating it again', async () => {
    const extension = stacks(async () => { throw new Error('activated twice') }, true, { stx: { active: true } })
    expect(await stacksProvidesStx(api({ [STACKS_EXTENSION_ID]: extension }))).toBe(true)
    expect((extension as any).activations).toBe(0)
  })

  test('serves stx itself next to a Stacks extension that does not embed it', async () => {
    // An older Stacks extension, from before it embedded stx, returns nothing.
    expect(await stacksProvidesStx(api({ [STACKS_EXTENSION_ID]: stacks(async () => undefined) }))).toBe(false)
    expect(await stacksProvidesStx(api({ [STACKS_EXTENSION_ID]: stacks(async () => ({ stx: { active: false } })) }))).toBe(false)
  })

  test('serves stx itself when the Stacks extension fails to activate', async () => {
    const original = console.error
    console.error = () => {}
    try {
      expect(await stacksProvidesStx(api({ [STACKS_EXTENSION_ID]: stacks(async () => { throw new Error('boom') }) }))).toBe(false)
    }
    finally {
      console.error = original
    }
  })

  test('never stands down for itself', async () => {
    expect(STACKS_EXTENSION_ID.toLowerCase()).not.toBe(STX_EXTENSION_ID.toLowerCase())
    expect(await stacksProvidesStx(api({ [STX_EXTENSION_ID]: stacks(async () => ({ stx: { active: true } })) }))).toBe(false)
  })
})
