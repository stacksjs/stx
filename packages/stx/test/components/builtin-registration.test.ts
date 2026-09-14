import { describe, expect, it } from 'bun:test'
import { registerBuiltins } from '../../src/builtins'
import { ComponentRegistry } from '../../src/component-registry'

describe('builtin registration', () => {
  it('registers Image into the renderer-owned registry', () => {
    // STX_SOURCE_ROOT builds can load source and installed package module realms
    // together. Registration must target the registry used for lookup instead
    // of assuming the builtin barrel's singleton is that same object (#1951).
    const rendererRegistry = new ComponentRegistry()

    expect(rendererRegistry.getBuiltin('Image')).toBeNull()
    registerBuiltins(rendererRegistry)

    const image = rendererRegistry.getBuiltin('Image')
    expect(image).not.toBeNull()
    expect(image).toBe(rendererRegistry.getBuiltin('StxImage'))
    expect(image?.name).toBe('StxImage')
  })
})
