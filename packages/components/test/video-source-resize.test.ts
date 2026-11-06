/**
 * Shared Video accepts the native primitive's media-URL and fit names.
 *
 * The primitive calls the URL `source` (a string or a `{ uri }` payload) and
 * the fit `resizeMode`; the shared component knew only `src` and a fixed
 * contain. Accepting both is the prerequisite for migrating those calls off
 * the primitive (stacksjs/stx#2091).
 *
 * Resolution is NOT changed by this: a `source` call still compiles the
 * primitive on native. The iOS gate rejected the migration twice, and the
 * reason is not a missing prop but the layout model — this component imposes a
 * `w-full` container with an aspect ratio, so a caller asking for a 64x32 box
 * gets a full-width one, which pushed the next control off-screen.
 */
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const video = join(root, 'src/ui/video/Video.stx')

async function render(attributes: string): Promise<string> {
  const source = `@import('Video', '${video}')\n<div><Video ${attributes} /></div>`
  return processDirectives(source, {}, join(root, 'Page.stx'), { ...defaultConfig, cache: false }, new Set())
}

const urls = [
  ['source alone', 'source="/legacy.mp4" label="L"', '/legacy.mp4'],
  ['src alone', 'src="/only.mp4" label="S"', '/only.mp4'],
  // src is this component's own API, so it wins a call that carries both.
  ['src and source together', 'src="/new.mp4" source="/legacy.mp4" label="M"', '/new.mp4'],
] as const

it.each(urls)('plays the media named by %s', async (_label, attributes, expected) => {
  const html = await render(attributes)

  expect(html).toContain(`src="${expected}"`)
})

const fits = [
  ['', 'contain'],
  ['contain', 'contain'],
  ['cover', 'cover'],
  ['stretch', 'fill'],
  ['center', 'none'],
  // The host owns an unrecognised value; the web falls back rather than
  // emitting an object-fit the browser will not honour.
  ['nonsense', 'contain'],
] as const

it.each(fits)('maps resizeMode %s onto object-fit %s', async (mode, fit) => {
  const html = await render(`src="/a.mp4" ${mode ? `resizeMode="${mode}"` : ''}`)

  expect(html).toContain(`object-${fit} h-full w-full`)
})

it('forwards the native fit name to the host root, and omits it when unset', async () => {
  // The host, not stx, applies it: iOS renders Video in Craft.
  expect(await render('src="/a.mp4" resizeMode="cover"')).toContain('resizeMode="cover"')
  expect(await render('src="/a.mp4"')).not.toContain('resizeMode=')
})

it('keeps an existing caller on contain when it names no fit', async () => {
  // The primitive defaults to cover; adopting that here would have moved every
  // shared Video already in use.
  const html = await render('src="/a.mp4"')

  expect(html).toContain('object-contain h-full w-full')
  expect(html).not.toContain('object-cover')
})
