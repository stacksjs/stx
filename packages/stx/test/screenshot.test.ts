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
      const r = await captureScreenshot(file, out, { width: 600, height: 400, waitMs: 300 })
      expect(existsSync(out)).toBe(true)
      expect(r.bytes).toBeGreaterThan(1000)
      // Valid PNG magic header.
      const head = await Bun.file(out).bytes()
      expect([head[0], head[1], head[2], head[3]]).toEqual([0x89, 0x50, 0x4E, 0x47])
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('captures every *.html in a directory', async () => {
    const { dir } = fixture()
    writeFileSync(join(dir, 'two.html'), '<!doctype html><h1>two</h1>')
    const outDir = join(dir, 'out')
    try {
      const results = await captureScreenshots(dir, outDir, { width: 500, height: 300, waitMs: 300 })
      expect(results.length).toBe(2)
      expect(results.every(r => r.bytes > 0)).toBe(true)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
