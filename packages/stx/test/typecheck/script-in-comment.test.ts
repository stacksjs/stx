/**
 * A script tag NAMED in a comment does not open a block (stacksjs/stx#1901).
 *
 * `extractScriptBlocks` scanned for the literal tag text without reading markup
 * as markup, so a comment mentioning `<script client>` in prose opened a real
 * block — and everything from there to the next `</script>` (the rest of the
 * sentence, the `-->`, and the actual script below it) was handed to
 * TypeScript. One real file produced **106 errors, every one pointing at an
 * English sentence**.
 *
 * Documenting the framework in a comment above the thing being documented is
 * the most ordinary thing an author can do, and `<script client>` is exactly
 * the phrase they would use. A checker that punishes it gets muted, and a muted
 * gate catches nothing.
 */

import { describe, expect, it } from 'bun:test'
import { extractScriptBlocks } from '../../src/stx-virtual-ts'

describe('a comment is prose, not markup', () => {
  it('does not open a block from an HTML comment', () => {
    const blocks = extractScriptBlocks(`<!--
  This block is deliberately NOT <script client>.
  It executes once per full page load and never re-runs.
-->
<script>
  const ok = 1
</script>`)

    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('plain')
    expect(blocks[0].code.trim()).toBe('const ok = 1')
  })

  it('does not open one from an stx template comment either', () => {
    const blocks = extractScriptBlocks(`{{-- see the <script server> below --}}
<script server>
const a = 1
</script>`)

    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('server')
    expect(blocks[0].code.trim()).toBe('const a = 1')
  })

  it('keeps the line numbers of everything after a comment', () => {
    // Blanking preserves newlines, so a diagnostic still points at the line the
    // author wrote. Reporting the right error on the wrong line is its own bug.
    const blocks = extractScriptBlocks(`<!--
  mentions <script client> here
-->
<script client>
const a = 1
</script>`)

    expect(blocks[0].startLine).toBe(4)
  })

  it('still finds a real block that follows a commented-out one', () => {
    const blocks = extractScriptBlocks(`<!-- <script client>const dead = 1</script> -->
<script client>
const live = 2
</script>`)

    expect(blocks).toHaveLength(1)
    expect(blocks[0].code.trim()).toBe('const live = 2')
  })
})
