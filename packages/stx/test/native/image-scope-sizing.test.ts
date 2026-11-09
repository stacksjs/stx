import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileScreenFile } from '../../src/native/compiler/render-screen'
import type { STXNode } from '../../src/native/compiler/ir'

function descendants(node: STXNode): STXNode[] {
  return [node, ...node.children.flatMap(child => typeof child === 'string' ? [] : descendants(child))]
}

it('keeps the native shared Image containing box through its scope without sizing unrelated scopes', async () => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileScreenFile(join(import.meta.dir, 'fixtures/shared-image-device.stx'), { root })
  const scopes = descendants(result.document.root).filter(node => 'data-stx-component-wrapper' in node.props)
  const image = scopes.find(node => descendants(node).some(child => child.props.testID === 'shared-photo'))!
  expect(image).toBeDefined()
  expect(image.style).toMatchObject({ width: '100%', height: '100%' })
  expect(image.style.flex).toBeUndefined()
  const buttons = scopes.filter(node => descendants(node).some(child => child.type === 'Pressable'))
  expect(buttons.length).toBe(5)
  for (const button of buttons) {
    expect(button.style.height).toBeUndefined()
    expect(button.style.width).toBeUndefined()
  }
  // The converged native call (#2091) renders through the shared file, so its
  // box lives on the scope the frame became. An authored style sizing both
  // dimensions has to replace the inherited fill there rather than lose to
  // it, or the host stretches the node back out to its parent.
  const converged = scopes.find(node => descendants(node).some(child => child.props.testID === 'shared-legacy-photo'))!
  expect(converged).toBeDefined()
  // No containing box is imposed on it, so the authored size governs instead
  // of being nested inside a scope that fills the parent.
  expect(converged.style.width).toBeUndefined()
  expect(converged.style.height).toBeUndefined()
  const convergedFrame = descendants(converged).find(node => node.style?.overflow === 'hidden')!
  expect(convergedFrame.style).toMatchObject({ width: 40, height: 40 })
  const images = descendants(result.document.root).filter(node => node.type === 'Image')
  expect(images).toHaveLength(3)
  // The alt-less call beside it keeps the primitive, which sizes the node itself.
  expect(images.find(node => node.props.testID === 'legacy-photo')!.style).toMatchObject({ width: 40, height: 40 })
}, 30_000)
