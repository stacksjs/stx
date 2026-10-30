import { expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { BrowserScreenRenderer } from '../../src/native/runtime/browser-renderer'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('keeps the browser peer image while props override styles and clearing restores legacy fit', () => {
  const browser = new Window()
  const renderer = new BrowserScreenRenderer(browser.document.body as unknown as HTMLElement, { event() {} })
  renderer.render({ id: 'photo', type: 'Image', props: { source: '/photo.png', resizeMode: 'center', objectFit: 'scale-down', objectPosition: 'right top' }, style: { objectFit: 'cover', objectPosition: '25% 75%' }, events: {}, children: [] })
  const image = browser.document.querySelector('img')!
  let revision = 0
  const patch = (patch: { props?: Record<string, unknown>, style?: Record<string, unknown> }) => renderer.mutate({ version: 1, baseRevision: revision++, revision, operations: [{ op: 'updateNode', id: 'photo', patch }] })
  try {
    expect(image.style.objectFit).toBe('scale-down')
    expect(image.style.objectPosition).toBe('right top')
    patch({ props: { objectFit: null, objectPosition: null } })
    expect(image.style.objectFit).toBe('cover')
    expect(image.style.objectPosition).toBe('25% 75%')
    patch({ style: { objectFit: null } })
    expect(image.style.objectFit).toBe('fill')
    patch({ style: { objectPosition: null } })
    expect(image.style.objectFit).toBe('none')
    expect(image.style.objectPosition).toBe('center')
    patch({ props: { resizeMode: 'stretch' } })
    expect(image.style.objectFit).toBe('fill')
    patch({ props: { objectFit: 'invalid', objectPosition: '10px 20px' } })
    expect(image.style.objectFit).toBe('fill')
    expect(image.style.objectPosition).toBe('center')
    expect(browser.document.querySelector('img')).toBe(image)
    expect(image.getAttribute('data-source')).toBe('/photo.png')
  }
  finally { renderer.dispose(); browser.happyDOM.abort() }
})

it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('retains direct legacy Image props and clears explicit geometry (%s, minify=%s)', async (platform, minify) => {
  const { code } = await compileNativeScreen(`<script client>
const fit = state('scale-down')
const position = state('right top')
const styles = state({ objectFit: 'cover', objectPosition: '25% 75%' })
window.probe = { fit, position, styles }
</script><View><Image testID="photo" source="/photo.png" resizeMode="center" :objectFit="fit" :objectPosition="position" :style="styles" /></View>`, { minify })
  const phone = mountNativeScreen(code, 'Screen', { platform })
  try {
    await phone.settle()
    const image = phone.byTestID('photo')!
    expect(image.props).toMatchObject({ source: '/photo.png', resizeMode: 'center', objectFit: 'scale-down', objectPosition: 'right top' })
    expect(image.style).toMatchObject({ objectFit: 'cover', objectPosition: '25% 75%' })
    phone.context.probe.fit.set(null)
    phone.context.probe.position.set(null)
    await phone.settle()
    expect(image.props.objectFit).toBeNull()
    expect(image.props.objectPosition).toBeNull()
    phone.context.probe.styles.set(null)
    await phone.settle()
    expect(image.style.objectFit).toBeNull()
    expect(image.style.objectPosition).toBeNull()
    expect(phone.byTestID('photo')).toBe(image)
    expect(image.props).toMatchObject({ source: '/photo.png', resizeMode: 'center' })
    const updates = phone.operations().filter(op => op.op === 'updateNode' && op.id === image.id)
    expect(updates.some(op => op.op === 'updateNode' && op.patch.props?.source !== undefined)).toBe(false)
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
