/**
 * An `@name` that is not a directive is an EVENT, whatever the name
 * (stacksjs/stx#2016).
 *
 * `classifyAttribute` matched event names against a 25-entry whitelist and
 * fell through to `'attr'` for anything outside it. `error` and `load` were
 * both absent, so `<img @error="onImageError($event)">` was recorded as an
 * attribute binding and listened for nothing — and `<Avatar>`'s image
 * fallback, the component's whole advantage over a hand-rolled `@if (src)`
 * block, could never fire. An avatar whose URL 404s rendered an empty circle
 * and the initials never appeared.
 *
 * It was easy to miss because the attribute survives into the rendered HTML,
 * so it reads as wired in devtools and in a snapshot. No warning, no console
 * message, nothing in the build output. It failed only when an image actually
 * broke: rare in development, routine in production.
 *
 * `@` means "event listener" in the prefix convention, so a whitelist was the
 * wrong shape for it — the runtime's own attribute walk has always bound any
 * `@name`, and only this classification, which the manifest path uses,
 * disagreed.
 */
import { describe, expect, it } from 'bun:test'
import { classifyAttribute, extractBindingManifest } from '../../src/binding-manifest'
import { RUNTIME_EVENT_NAMES } from '../../src/runtime-globals'

describe('#2016 — @ binds a listener for any event name', () => {
  it('classifies the two that broke Avatar', () => {
    expect(classifyAttribute('@error')).toBe('event')
    expect(classifyAttribute('@load')).toBe('event')
  })

  /*
   * The others the report listed as being in the same position. Named
   * individually rather than looped over a list, so the file says which real
   * events were dead markup.
   */
  it('classifies the rest of the events the whitelist omitted', () => {
    for (const name of [
      '@animationend',
      '@transitionend',
      '@drop',
      '@dragover',
      '@dragstart',
      '@paste',
      '@copy',
      '@cut',
      '@close',
      '@toggle',
      '@loadeddata',
      '@canplay',
      '@ended',
      '@invalid',
      '@reset',
      '@select',
    ])
      expect(classifyAttribute(name), `${name} is not an event`).toBe('event')
  })

  /*
   * A typo used to be silent dead markup. It now binds a listener for an event
   * that never fires, which is visible in devtools and costs nothing — the
   * failure the report asked to stop being invisible.
   */
  it('binds a misspelled event rather than silently dropping it', () => {
    expect(classifyAttribute('@clik')).toBe('event')
  })

  it('still routes directives and modifiers correctly', () => {
    expect(classifyAttribute('@if')).toBe('if')
    expect(classifyAttribute('@click.stop')).toBe('event')
    expect(classifyAttribute('@keydown.enter')).toBe('event')
    expect(classifyAttribute('@bind:title')).toBe('attr')
    expect(classifyAttribute('::literal')).toBeNull()
  })

  /*
   * The regression this change could have caused, and the reason `error` was
   * NOT simply added to the shared whitelist.
   *
   * `:` is the structural and prop prefix, so `:error` on a component is a
   * PROP — <EmailInput :error="error"> and <SearchInput :error="error"> pass
   * exactly that. Reading it as an event would have made both inputs stop
   * receiving their error state, trading a broken avatar for a broken form.
   */
  it('leaves :error a prop, because : is not the event prefix', () => {
    expect(classifyAttribute(':error')).toBe('attr')
    expect(classifyAttribute(':load')).toBe('attr')
    expect(RUNTIME_EVENT_NAMES).not.toContain('error')
    expect(RUNTIME_EVENT_NAMES).not.toContain('load')
    // …while the structural ones keep their own kinds.
    expect(classifyAttribute(':show')).toBe('show')
    expect(classifyAttribute(':if')).toBe('if')
  })

  it('records @error as an event in a manifest built from real markup', () => {
    const { manifest } = extractBindingManifest(
      '<img class="avatar" :show="showImage()" @error="onImageError($event)">',
    )
    const kinds = manifest.entries.flatMap(e => e.bindings.map(b => `${b.kind} ${b.name}`))

    expect(kinds).toContain('event @error')
    expect(kinds).toContain('show :show')
  })
})
