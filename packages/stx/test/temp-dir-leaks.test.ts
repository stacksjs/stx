/**
 * The test suites left about 590 `stx-*` directories (about 12 MB) in the
 * macOS per-user temp folder per full run, on a shared Mac that ran out of
 * disk twice in one day.
 *
 * Each case runs in a child process whose TMPDIR is a fresh, empty sandbox,
 * so "nothing left behind" is an exact assertion rather than a count taken
 * in a temp folder other processes are writing to at the same time.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { sweepOrphanedTempDirs } from '../src/temp-dir'

const repo = resolve(import.meta.dir, '../../..')
const helper = resolve(import.meta.dir, '../src/temp-dir.ts')
const processor = resolve(import.meta.dir, '../src/image-optimization/processor.ts')

/**
 * A representative slice of the suite: the files that leaked the most, one
 * per kind of scratch project. The native compiler driven through the CLI,
 * the SPA router harness, the client-script bundler, server-script error
 * boundaries, config resolution, the dev server and the file router.
 */
const slice = [
  'packages/stx/test/native/cli.test.ts',
  'packages/stx/test/native/capability-protocol.test.ts',
  'packages/stx/test/router/side-effect-import.test.ts',
  'packages/stx/test/client-script-bundler/component-bundles-share-modules.test.ts',
  'packages/stx/test/server-script-error-boundary.test.ts',
  'packages/stx/test/config/config-dir-anchor.test.ts',
  'packages/bun-plugin/test/serve-exclude.test.ts',
  'packages/router/test/page-routes.test.ts',
]

// Not `stx-` prefixed, so neither the code under test nor its sweep can
// mistake the sandbox itself for one of its directories.
const root = mkdtempSync(join(tmpdir(), 'leak-test-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

let caseNumber = 0
function sandbox(): { temp: string, scripts: string } {
  caseNumber += 1
  const temp = join(root, `case-${caseNumber}`, 'tmp')
  const scripts = join(root, `case-${caseNumber}`, 'scripts')
  mkdirSync(temp, { recursive: true })
  mkdirSync(scripts, { recursive: true })
  return { temp, scripts }
}

function leftovers(temp: string): string[] {
  return readdirSync(temp).filter(name => name.startsWith('stx-'))
}

function env(temp: string): Record<string, string> {
  // TMPDIR is what os.tmpdir() reads on macOS and Linux; TEMP/TMP on Windows.
  const vars = { ...process.env, TMPDIR: temp, TEMP: temp, TMP: temp } as Record<string, string>
  delete vars.STX_KEEP_TEMP
  return vars
}

async function run(command: string[], temp: string): Promise<{ exitCode: number, output: string }> {
  const child = Bun.spawn(command, { cwd: repo, env: env(temp), stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
  return { exitCode, output: stdout + stderr }
}

/** Start a child and wait until it prints `ready`. */
async function startReady(command: string[], temp: string): Promise<ReturnType<typeof Bun.spawn>> {
  const child = Bun.spawn(command, { cwd: repo, env: env(temp), stdout: 'pipe', stderr: 'inherit' })
  const reader = (child.stdout as ReadableStream<Uint8Array>).getReader()
  let seen = ''
  while (!seen.includes('ready')) {
    const { value, done } = await reader.read()
    if (done)
      break
    seen += new TextDecoder().decode(value)
  }
  reader.releaseLock()
  return child
}

/** A test file whose assertion fails while it holds a scratch project, with no cleanup of its own. */
function failingTestFile(scripts: string): string {
  const file = join(scripts, 'forced-failure.test.ts')
  writeFileSync(file, `
import { expect, it } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTempDir } from ${JSON.stringify(helper)}

it('fails with a project in temp', () => {
  const dir = createTempDir('forced-failure')
  writeFileSync(join(dir, 'page.stx'), '<p>half written</p>')
  expect('the assertion').toBe('a failure')
})
`)
  return file
}

describe('no stx-* directory outlives a run', () => {
  it('a slice of the suite, plus a test file that fails', async () => {
    const { temp, scripts } = sandbox()
    const result = await run([process.execPath, 'test', ...slice, failingTestFile(scripts)], temp)
    expect(result.output).toContain('1 fail')
    expect(result.output).toContain('fails with a project in temp')
    // The slice really ran (90 tests when this was written), not just the failure.
    expect(Number(/(\d+) pass/.exec(result.output)?.[1] ?? 0)).toBeGreaterThan(50)
    expect(result.exitCode).not.toBe(0)
    expect(leftovers(temp)).toEqual([])
  }, 300_000)

  it('the image pipeline\'s scratch files', async () => {
    const { temp, scripts } = sandbox()
    const script = join(scripts, 'image.ts')
    // A 1x1 PNG through the ts-images path (no sharp in this repo), which
    // writes its output to a scratch file and reads it back.
    writeFileSync(script, `
import { resizeAndConvert } from ${JSON.stringify(processor)}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64')
const out = await resizeAndConvert(png, { width: 1, height: 1, format: 'png', quality: 80, fit: 'cover' })
console.log('bytes', out.length)
`)
    const result = await run([process.execPath, script], temp)
    expect(result.output).toContain('bytes')
    expect(result.exitCode).toBe(0)
    expect(readdirSync(temp)).toEqual([])
  }, 60_000)

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    it(`a run interrupted with ${signal}`, async () => {
      const { temp, scripts } = sandbox()
      const script = join(scripts, 'interrupted.ts')
      writeFileSync(script, `
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTempDir } from ${JSON.stringify(helper)}
const dir = createTempDir('interrupted')
writeFileSync(join(dir, 'page.stx'), '<p>interrupted</p>')
console.log('ready')
setInterval(() => {}, 1000)
`)
      const child = await startReady([process.execPath, script], temp)
      expect(leftovers(temp)).toHaveLength(1)
      child.kill(signal)
      const exitCode = await child.exited
      // The default action's status (128 + signal number), not a clean exit.
      expect(exitCode).toBe(signal === 'SIGINT' ? 130 : 143)
      expect(leftovers(temp)).toEqual([])
    }, 30_000)
  }

  it('a `bun test` run interrupted mid-test', async () => {
    const { temp, scripts } = sandbox()
    const file = join(scripts, 'hangs.test.ts')
    writeFileSync(file, `
import { it } from 'bun:test'
import { createTempDir } from ${JSON.stringify(helper)}
it('hangs with a project in temp', async () => {
  createTempDir('hangs')
  console.log('ready')
  await new Promise(() => {})
}, 60_000)
`)
    const child = await startReady([process.execPath, 'test', file], temp)
    expect(leftovers(temp)).toHaveLength(1)
    child.kill('SIGINT')
    await child.exited
    expect(leftovers(temp)).toEqual([])
  }, 60_000)

  it('a run killed outright is swept up by the next one', async () => {
    const { temp, scripts } = sandbox()
    const script = join(scripts, 'killed.ts')
    writeFileSync(script, `
import { createTempDir } from ${JSON.stringify(helper)}
createTempDir('killed')
console.log('ready')
setInterval(() => {}, 1000)
`)
    const child = await startReady([process.execPath, script], temp)
    child.kill('SIGKILL')
    await child.exited
    // SIGKILL cannot be caught; this is the one case the run itself cannot fix.
    expect(leftovers(temp)).toHaveLength(1)
    // What the next stx process does on its first createTempDir (minus the
    // minimum age, which is there for processes racing on a shared folder).
    // `exited` can resolve a moment before the kernel reaps the child, and a
    // zombie still answers kill(pid, 0); give it that moment.
    for (let attempt = 0; attempt < 50 && leftovers(temp).length; attempt++) {
      sweepOrphanedTempDirs({ root: temp, minAgeMs: 0 })
      if (leftovers(temp).length)
        await Bun.sleep(20)
    }
    expect(leftovers(temp)).toEqual([])
  }, 30_000)
})
