/**
 * What a node's classes say about its props reaches the host however the
 * node comes to exist (stacksjs/stx#2195).
 *
 * `object-cover` is not a style on a phone. It is the Image's `resizeMode`
 * prop, as `truncate` is a Text's `numberOfLines`. The host was handed them
 * only for a node created after the screen's first draw. One that was on
 * screen from the start, and every node on a redraw, got its style and
 * nothing else, so a product's cover photo that had loaded before the first
 * draw was fitted between two bars while the thumbnails in the loop under it,
 * created a moment later with the very same classes, filled their boxes.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

const screen = (initial: string): string => `<script client>
const product = state(${initial})
const others = state([])
window.probe = { product, others }
</script>
<section>
  <div class="flex overflow-hidden relative items-center justify-center h-[200px] rounded-[12px]">
    <img testID="cover" :if="product().cover" :src="product().cover" alt="" class="absolute inset-0 object-cover h-full w-full" />
  </div>
  <img testID="fixed" src="https://example.com/fixed.jpg" alt="" class="object-contain h-10 w-10" />
  <span testID="title" class="truncate">A long product title</span>
  <span testID="blurb" class="line-clamp-2">Two lines of description at the most</span>
  <div :for="other in others()" :key="other.id">
    <img testID="thumb" :src="other.cover" alt="" class="object-cover h-12 w-12" />
  </div>
</section>`

/** The props a node was created with, or first drawn with, before any update. */
function patched(phone: ReturnType<typeof mountNativeScreen>, id: string, prop: string): boolean {
  return phone.operations().some((op: any) => op.op === 'updateNode' && op.id === id && op.patch?.props && prop in op.patch.props)
}

describe.each(['ios', 'android'] as const)('class-derived props on %s', (platform) => {
  it('are part of the first draw for what is on screen from the start', async () => {
    const { code } = await compileNativeScreen(screen(`{ cover: 'https://example.com/cover.jpg' }`))
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()

    const cover = phone.byTestID('cover')!
    expect(cover.props.resizeMode).toBe('cover')
    expect(phone.byTestID('fixed')!.props.resizeMode).toBe('contain')
    expect(phone.byTestID('title')!.props.numberOfLines).toBe(1)
    expect(phone.byTestID('blurb')!.props.numberOfLines).toBe(2)
    // Drawn that way, not corrected afterwards: a photo that is fitted and
    // then filled is seen to jump.
    expect(patched(phone, cover.id, 'resizeMode')).toBe(false)
  }, 30_000)

  it('come with a node revealed later and with a row of a loop', async () => {
    const { code } = await compileNativeScreen(screen('{}'))
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    expect(phone.byTestID('cover')).toBeUndefined()

    phone.context.probe.product.set({ cover: 'https://example.com/cover.jpg' })
    phone.context.probe.others.set([{ id: 1, cover: 'https://example.com/a.jpg' }, { id: 2, cover: 'https://example.com/b.jpg' }])
    await phone.settle()
    expect(phone.byTestID('cover')!.props.resizeMode).toBe('cover')
    expect(phone.all().filter(node => node.props.testID === 'thumb').map(node => node.props.resizeMode)).toEqual(['cover', 'cover'])
  }, 30_000)

  it('survive the redraw that follows a refused batch', async () => {
    const { code } = await compileNativeScreen(screen(`{ cover: 'https://example.com/cover.jpg' }`))
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    phone.context.probe.others.set([{ id: 1, cover: 'https://example.com/a.jpg' }])
    await phone.settle()

    // The host refuses a batch, and the screen is drawn again from what the
    // runtime holds.
    phone.send('MUTATION_ERROR', { code: 'UNKNOWN_NODE', message: 'refused for the test' })
    await phone.settle()
    expect(phone.byTestID('cover')!.props.resizeMode).toBe('cover')
    expect(phone.byTestID('fixed')!.props.resizeMode).toBe('contain')
    expect(phone.byTestID('thumb')!.props.resizeMode).toBe('cover')
    expect(phone.byTestID('title')!.props.numberOfLines).toBe(1)
  }, 30_000)
})
