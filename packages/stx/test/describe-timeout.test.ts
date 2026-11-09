/**
 * `describe(name, fn, ms)` does not set a timeout, and nothing says so.
 *
 * bun:test takes a timeout as the third argument of `it`/`test` and ignores it
 * on `describe`. A file that writes one therefore runs every case inside it
 * under the five-second default while reading as though it had whatever it
 * asked for, and the output never mentions the discarded number.
 *
 * `packages/components/test/ai-textarea-browser.test.ts` asked for 60 seconds
 * that way and got five. Its cases take about 200ms on an idle machine, so the
 * gap only shows on a loaded host — and when it shows, it does not look like a
 * deadline at all: Bun ends the case and runs `afterAll`, which closes the
 * WebView, while the case's own body keeps executing, so the next read raises
 * `ERR_INVALID_STATE: WebView.evaluate: view is closed` against the body's last
 * line. (An in-flight read interrupted by the same close reads `WebView
 * closed`, with no code, which is how the two are told apart.) That is
 * stacksjs/stx#2156: a closure that never reproduced in isolation.
 *
 * So this file pins both halves — that Bun really does discard the argument,
 * and that no file in the repository writes one.
 */
import { describe, expect, it } from 'bun:test'
import { Glob } from 'bun'
import { rm } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createTempDir } from '../src/temp-dir'

const repoRoot = join(import.meta.dir, '..', '..', '..')

/**
 * Blank out comments, strings and template literals, preserving every offset
 * and line break, so a paren scan sees code only. `setInterval(fn, 5)` inside a
 * fixture's template literal is not a describe timeout.
 */
function codeOnly(source: string): string {
  const out = source.split('')
  const blank = (from: number, to: number) => {
    for (let i = from; i < to && i < out.length; i++) {
      if (out[i] !== '\n') out[i] = ' '
    }
  }
  let i = 0
  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]
    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', i)
      blank(i, end < 0 ? source.length : end)
      i = end < 0 ? source.length : end
      continue
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      blank(i, end < 0 ? source.length : end + 2)
      i = end < 0 ? source.length : end + 2
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      let j = i + 1
      while (j < source.length) {
        if (source[j] === '\\') { j += 2; continue }
        if (source[j] === char) break
        j++
      }
      blank(i, j + 1)
      i = j + 1
      continue
    }
    i++
  }
  return out.join('')
}

/** The source offsets of every `describe(` call in a sanitised file. */
function describeCalls(code: string): number[] {
  const calls: number[] = []
  const pattern = /\bdescribe(?:\.\w+)?\s*\(/g
  let match = pattern.exec(code)
  while (match) {
    calls.push(match.index + match[0].length)
    match = pattern.exec(code)
  }
  return calls
}

/** The offset just past the argument list that starts at `open`. */
function endOfArguments(code: string, open: number): number {
  let depth = 1
  for (let i = open; i < code.length; i++) {
    const char = code[i]
    if (char === '(' || char === '[' || char === '{') depth++
    else if (char === ')' || char === ']' || char === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

describe('a timeout on describe', () => {
  it('is discarded by bun:test, so the default still applies', async () => {
    const dir = createTempDir('stx-describe-timeout-')
    try {
      // The case sleeps well inside the timeout the describe asks for and well
      // past the one the run is given. It can only pass if describe's number
      // is honoured.
      await Bun.write(join(dir, 'fixture.test.ts'), `import { describe, expect, it } from 'bun:test'

describe('asks for ten seconds', () => {
  it('sleeps 300ms', async () => {
    await Bun.sleep(300)
    expect(1).toBe(1)
  })
}, 10_000)
`)
      const run = Bun.spawnSync({
        cmd: [process.execPath, 'test', 'fixture.test.ts', '--timeout', '100'],
        cwd: dir,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const output = `${run.stdout.toString()}${run.stderr.toString()}`
      expect(output).toContain('timed out after 100ms')
      expect(output).toContain('1 fail')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  }, 30_000)

  it('is written nowhere in the repository, because it would read as a budget that is not applied', async () => {
    const offenders: string[] = []
    for (const root of ['packages', 'examples']) {
      const base = join(repoRoot, root)
      for await (const rel of new Glob('**/*.test.ts').scan({ cwd: base, absolute: true })) {
        if (rel.includes('/node_modules/') || rel.includes('/dist/')) continue
        const code = codeOnly(await Bun.file(rel).text())
        for (const open of describeCalls(code)) {
          const end = endOfArguments(code, open)
          if (end < 0) continue
          // A third argument shows as a trailing `, <number>` before the close.
          if (/,\s*[\d_]+\s*$/.test(code.slice(open, end))) {
            const line = code.slice(0, end).split('\n').length
            offenders.push(`${relative(repoRoot, rel)}:${line}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  }, 30_000)
})
