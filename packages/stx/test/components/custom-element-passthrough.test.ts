/**
 * A custom element the app does not own is left alone (stacksjs/stx#1845).
 *
 * stx resolves component tags from disk in three passes — kebab, PascalCase,
 * then single-word lowercase. The lowercase pass matched only the START of a
 * tag name, with nothing anchoring the end, so after the kebab pass correctly
 * declined `<ion-button />` (no such file), the lowercase pass matched the
 * PREFIX `ion`, lost the hyphen that marks it a Custom Element, and tried to
 * resolve `ion.stx` from disk — splicing an ENOENT error into the page.
 *
 * The issue's headline is stale in one respect and worth recording: the PAIRED
 * form `<ion-button></ion-button>` already passed through. Only the
 * self-closing form was claimed, which is why this looked intermittent — the
 * same component worked or didn't depending on how it was written.
 */
import { describe, expect, it } from 'bun:test'
import { findComponentTags } from '../../src/component-processing'

/** The three patterns the renderer applies, in order (component-renderer.ts:899-907). */
const KEBAB = /[a-z][a-z0-9]*-[a-z0-9-]*/
const PASCAL = /[A-Z][a-zA-Z0-9]*/
const LOWERCASE = /[a-z][a-z0-9]*/

const names = (html: string, pattern: RegExp, skip?: Set<string>) =>
  findComponentTags(html, pattern, skip).map(t => t.tagName)

describe('the lowercase pass cannot claim a prefix (#1845)', () => {
  it('leaves a self-closing custom element alone', () => {
    // Matched `ion` before, and resolved ion.stx from disk.
    expect(names('<ion-button />', LOWERCASE)).toEqual([])
  })

  it('leaves a multi-hyphen custom element alone', () => {
    expect(names('<rich-text-editor />', LOWERCASE)).toEqual([])
  })

  it('leaves a two-letter-prefix custom element alone', () => {
    // Shoelace, Ionic and friends all use a short prefix, which is exactly
    // the shape most likely to collide with a real single-word component.
    expect(names('<sl-dialog />', LOWERCASE)).toEqual([])
  })

  it('already left the paired form alone', () => {
    // Regression guard for the half that was never broken.
    expect(names('<ion-button></ion-button>', LOWERCASE)).toEqual([])
  })

  it('still claims a genuine single-word component', () => {
    // Control. Without this the fix could be "match nothing", which would
    // silently disable lowercase components entirely.
    expect(names('<card />', LOWERCASE)).toEqual(['card'])
  })

  it('still skips known HTML tags', () => {
    expect(names('<div />', LOWERCASE, new Set(['div']))).toEqual([])
  })
})

describe('the other two passes are unaffected (#1845)', () => {
  it('kebab still claims a hyphenated tag', () => {
    // The kebab pass is what SHOULD see a custom element — it then declines
    // when no such file exists on disk. Anchoring must not stop it matching.
    expect(names('<my-widget />', KEBAB)).toEqual(['my-widget'])
  })

  it('kebab matches the whole name, not a prefix of it', () => {
    expect(names('<rich-text-editor />', KEBAB)).toEqual(['rich-text-editor'])
  })

  it('PascalCase still claims a component', () => {
    expect(names('<Button />', PASCAL)).toEqual(['Button'])
  })

  it('PascalCase matches the whole name', () => {
    // `<UserCard />` must not come back as `User`.
    expect(names('<UserCard />', PASCAL)).toEqual(['UserCard'])
  })

  it('handles attributes and whitespace after the name', () => {
    expect(names('<Button class="x" />', PASCAL)).toEqual(['Button'])
    expect(names('<card\n  title="x" />', LOWERCASE)).toEqual(['card'])
  })
})
