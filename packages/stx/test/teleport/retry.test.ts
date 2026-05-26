/**
 * Tests for the teleport target-not-found retry (stacksjs/stx#1728).
 *
 * Pre-fix, the teleport script ran a one-shot `document.querySelector` on
 * the target. If the target was created later in the same render pass
 * (e.g. by a layout shell's onMount), the lookup missed and the teleport
 * silently failed (with only a console warning).
 *
 * Fix: retry once via requestAnimationFrame. A target that lands within
 * the same paint cycle is now picked up. A second miss still warns —
 * we don't loop forever.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { processTeleportDirectives } from '../../src/teleport'

// happy-dom doesn't expose requestAnimationFrame on globalThis; the
// generated script reads it as a global. Polyfill once for the whole
// test file.
// eslint-disable-next-line ts/no-explicit-any
if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
  // eslint-disable-next-line ts/no-explicit-any
  ;(globalThis as any).requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0)
}

// Extract the IIFE body from the generated <script> tag so we can run it
// in a controlled order against happy-dom (script tags inserted via
// innerHTML don't auto-execute).
function extractTeleportScript(rendered: string): string {
  const m = rendered.match(/<script>\s*([\s\S]*?)\s*<\/script>/)
  if (!m) throw new Error('no <script> tag in teleport output')
  return m[1]
}

function injectAndRun(rendered: string) {
  // Insert the placeholder HTML into the DOM, then execute the script.
  document.body.innerHTML += rendered.replace(/<script>[\s\S]*?<\/script>/, '')
  const script = extractTeleportScript(rendered)
  // eslint-disable-next-line no-new-func
  new Function(script)()
}

async function nextFrame() {
  // happy-dom: rAF resolves on next macrotask.
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('teleport target retry (#1728)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mounts to the target immediately when it already exists (happy path)', async () => {
    document.body.innerHTML = '<div id="modals"></div>'

    const rendered = processTeleportDirectives(
      `@teleport('#modals')<p data-marker="inner">teleported</p>@endteleport`,
      {},
      '/test.stx',
    )
    injectAndRun(rendered)

    const target = document.getElementById('modals')!
    expect(target.querySelector('[data-marker="inner"]')).not.toBeNull()
    // Wrapper carries the data-teleport-from attribute.
    expect(target.querySelector('[data-teleport-from]')).not.toBeNull()
  })

  it('retries on the next frame when the target appears late (fix)', async () => {
    // No target in DOM yet — script runs and queues a rAF.
    const rendered = processTeleportDirectives(
      `@teleport('#late-target')<p data-marker="appears-after-retry">late teleport</p>@endteleport`,
      {},
      '/test.stx',
    )
    injectAndRun(rendered)

    // Target doesn't exist yet — first lookup missed, retry pending.
    expect(document.getElementById('late-target')).toBeNull()

    // Now create the target — same paint cycle, before the rAF callback fires.
    const target = document.createElement('div')
    target.id = 'late-target'
    document.body.appendChild(target)

    // Wait for the rAF callback to run.
    await nextFrame()
    await nextFrame()

    expect(target.querySelector('[data-marker="appears-after-retry"]')).not.toBeNull()
  })

  it('warns when the target is still missing after the retry', async () => {
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(String(args[0])) }

    try {
      const rendered = processTeleportDirectives(
        `@teleport('#never-shows-up')<p>never lands</p>@endteleport`,
        {},
        '/test.stx',
      )
      injectAndRun(rendered)

      // Wait long enough for the rAF callback to execute and bail.
      await nextFrame()
      await nextFrame()

      expect(warnings.some(w => w.includes('Teleport target not found') && w.includes('#never-shows-up'))).toBe(true)
    }
    finally {
      console.warn = originalWarn
    }
  })

  it('removes the source placeholder once mounted', async () => {
    document.body.innerHTML = '<div id="modals-2"></div>'

    const rendered = processTeleportDirectives(
      `@teleport('#modals-2')<p>x</p>@endteleport`,
      {},
      '/test.stx',
    )
    injectAndRun(rendered)

    // The source placeholder uses .stx-teleport-source — it should be gone
    // after a successful mount.
    expect(document.querySelector('.stx-teleport-source')).toBeNull()
  })
})
