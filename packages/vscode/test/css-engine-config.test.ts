import { describe, expect, test } from 'bun:test'
import { getDefaultConfig } from '../src/ts-css/context'

describe('CSS engine fallback config', () => {
  test('provides the container theme expected by current ts-css', () => {
    const config = getDefaultConfig({ workspace: { workspaceFolders: undefined } } as any)

    expect(config.theme.containers).toEqual({})
  })
})
