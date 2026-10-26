import { expect, it } from 'bun:test'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { projectAccessibility } from '../../src/native/accessibility'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { createNativeHost } from '../../src/native/runtime/native-host'

it('uses image alt as a label fallback without changing native or ARIA override precedence', () => {
  const props = Object.freeze({ alt: 'Photo' })
  expect(projectAccessibility(props, 'Image')).toEqual({ accessibilityLabel: 'Photo' })
  expect(projectAccessibility(props, 'View')).toEqual({})
  expect(projectAccessibility(props)).toEqual({})
  expect(projectAccessibility({ alt: '' }, 'Image')).toEqual({})
  expect(projectAccessibility({ alt: null }, 'Image')).toEqual({})
  expect(projectAccessibility({ alt: 'Photo', 'aria-label': 'ARIA' }, 'Image')).toEqual({ accessibilityLabel: 'ARIA' })
  expect(projectAccessibility({ alt: 'Photo', 'aria-label': 'ARIA', accessibilityLabel: 'Native' }, 'Image')).toEqual({ accessibilityLabel: 'Native' })
  expect(projectAccessibility({ alt: 'Photo', accessibilityLabel: null }, 'Image')).toEqual({ accessibilityLabel: null })
  expect(props).toEqual({ alt: 'Photo' })
})

it('projects static img alt without turning the generated label into an authored override', async () => {
  const { root } = await translateHtmlToIR('<img src="/photo.png" alt="Photo &amp; café">')
  expect(root.type).toBe('Image')
  expect(root.props).toMatchObject({ source: '/photo.png', alt: 'Photo & café', accessibilityLabel: 'Photo & café' })
  expect(root._accessibilitySource).toEqual({})
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch), schedule() {} })
  try {
    const node = host.adopt({ __stxId: 'photo' }, root.type, null, root)
    host.setAttribute(node, 'alt', 'Updated')
    host.flush() // snapshot starts a new render baseline and clears queued patches.
    expect(host.snapshot(node).props.accessibilityLabel).toBe('Updated')
    host.removeAttribute(node, 'alt')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBeUndefined()
    host.flush()
    expect(operations).toContainEqual({ op: 'updateNode', id: 'photo', patch: { props: { alt: null, accessibilityLabel: null } } })
  }
  finally { host.dispose() }
})

it('falls back through native label, ARIA label and alt while sending explicit clears to the host', async () => {
  const { root } = await translateHtmlToIR('<img source="/legacy.png" alt="Photo" aria-label="ARIA" accessibilityLabel="Native">')
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch), schedule() {} })
  try {
    const node = host.adopt({ __stxId: 'photo' }, root.type, null, root)
    host.setAttribute(node, 'alt', 'Changed')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBe('Native')
    host.removeAttribute(node, 'accessibility-label')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBe('ARIA')
    host.removeAttribute(node, 'aria-label')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBe('Changed')
    host.setAttribute(node, 'alt', '')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBeUndefined()
    host.setAttribute(node, 'alt', 'Restored')
    host.flush()
    expect(host.snapshot(node).props.accessibilityLabel).toBe('Restored')
    expect(host.snapshot(node).props.source).toBe('/legacy.png')
    host.flush()
    expect(operations).toContainEqual({ op: 'updateNode', id: 'photo', patch: { props: { alt: '', accessibilityLabel: null } } })
    expect(operations).toContainEqual({ op: 'updateNode', id: 'photo', patch: { props: { 'aria-label': null, accessibilityLabel: 'Changed' } } })
  }
  finally { host.dispose() }
})
