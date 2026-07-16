import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { captureScreenshot, captureScreenshots } from '../src/screenshot'

/** A trivial HTML page on disk. */
function fixture(): { dir: string, file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'stx-shot-'))
  const file = join(dir, 'page.html')
  writeFileSync(file, '<!doctype html><html><body style="background:#0b1020;color:#fff"><h1>stx screenshot</h1></body></html>')
  return { dir, file }
}

describe('screenshot (Bun WebView)', () => {
  it('captures a single HTML file to a PNG', async () => {
    const { dir, file } = fixture()
    const out = join(dir, 'shot.png')
    try {
      const r = await captureScreenshot(file, out, { width: 600, height: 400, waitMs: 300, timeoutMs: 30_000 })
      expect(existsSync(out)).toBe(true)
      expect(r.bytes).toBeGreaterThan(1000)
      // Valid PNG magic header.
      const head = await Bun.file(out).bytes()
      expect([head[0], head[1], head[2], head[3]]).toEqual([0x89, 0x50, 0x4E, 0x47])
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 45_000)

  it('captures every *.html in a directory', async () => {
    const { dir } = fixture()
    writeFileSync(join(dir, 'two.html'), '<!doctype html><h1>two</h1>')
    const outDir = join(dir, 'out')
    try {
      const results = await captureScreenshots(dir, outDir, { width: 500, height: 300, waitMs: 300, timeoutMs: 30_000 })
      expect(results.length).toBe(2)
      expect(results.every(r => r.bytes > 0)).toBe(true)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 75_000)

  it('full-page captures the whole scrollable document, not just the viewport', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-shot-full-'))
    // A page far taller than the viewport (a tall column).
    const tall = join(dir, 'tall.html')
    writeFileSync(tall, '<!doctype html><html><body style="margin:0"><div style="height:3000px;background:#0b1020"></div></body></html>')
    const viewportOut = join(dir, 'viewport.png')
    const fullOut = join(dir, 'full.png')
    try {
      await captureScreenshot(tall, viewportOut, { width: 400, height: 300, waitMs: 300 })
      await captureScreenshot(tall, fullOut, { width: 400, height: 300, waitMs: 300, fullPage: true })
      // PNG height lives in bytes 20-23 (big-endian) of the IHDR chunk.
      const pngHeight = async (p: string): Promise<number> => {
        const b = await Bun.file(p).bytes()
        return (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
      }
      const vh = await pngHeight(viewportOut)
      const fh = await pngHeight(fullOut)
      // The full-page shot is much taller than the 300px viewport capture.
      expect(fh).toBeGreaterThan(vh * 3)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 45_000)

  it('wait-selector resolves and still captures when the selector exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-shot-sel-'))
    const file = join(dir, 'sel.html')
    writeFileSync(file, '<!doctype html><html><body><div id="ready">ok</div></body></html>')
    const out = join(dir, 'sel.png')
    try {
      const r = await captureScreenshot(file, out, { width: 400, height: 300, waitMs: 200, waitSelector: '#ready', timeoutMs: 5000 })
      expect(existsSync(out)).toBe(true)
      expect(r.bytes).toBeGreaterThan(0)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 45_000)
})
