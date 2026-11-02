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
  const images = descendants(result.document.root).filter(node => node.type === 'Image')
  expect(images).toHaveLength(2)
  expect(images.find(node => node.props.testID === 'legacy-photo')!.style).toMatchObject({ width: 40, height: 40 })
}, 30_000)
