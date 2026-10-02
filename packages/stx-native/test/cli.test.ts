/**
 * The CLI runs (stacksjs/stx#1985).
 *
 * `src/cli/index.ts` did not parse. Line 695 sat in the template text of a code
 * generator and emitted an unescaped backtick, which closed the generator's own
 * literal and left the rest of the function to be parsed as code. Every
 * invocation - `compile`, `build`, `run`, `dev`, `init` - failed before doing
 * anything, so the package's entry point had never once executed.
 *
 * Behind that, nothing it guarded had been exercised either: `run()` read
 * `args[1]` as a subcommand and began flag parsing at `args[2]`, which works
 * for `run ios` and eats the only argument of `compile <file>`.
 *
 * These spawn the entry point as a subprocess rather than importing it. The bug
 * was a parse error, and a test that imports a module it expects to be broken
 * proves less than one that runs it the way a person does.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseSTX } from '../src/compiler/parser'
import { STXCLI } from '../src/cli/index'

const CLI = path.join(import.meta.dir, '..', 'src', 'cli', 'index.ts')

const SCREEN = `<script>
function greet() {
  console.log('hi')
}
</script>
<template>
  <View class="p-4">
    <Text class="text-lg">Hello</Text>
  </View>
</template>
`

async function runCli(args: string[], cwd?: string): Promise<{ code: number, stdout: string, stderr: string }> {
  const proc = Bun.spawn([process.execPath, CLI, ...args], {
    cwd: cwd ?? import.meta.dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { code: await proc.exited, stdout, stderr }
}

async function project(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-cli-'))
  await Bun.write(path.join(root, 'Screen.stx'), SCREEN)
  return root
}

describe('the stx-native CLI entry point', () => {
  it('parses and answers --help with exit 0', async () => {
    const { code, stdout, stderr } = await runCli(['--help'])
    expect(stderr).not.toContain('error:')
    expect(code).toBe(0)
    expect(stdout).toContain('stx-native <command> [options]')
  })

  it('exits non-zero on an unknown command', async () => {
    const { code } = await runCli(['definitely-not-a-command'])
    expect(code).not.toBe(0)
  })

  it('receives the positional argument of compile <file>', async () => {
    // The routing bug answered "Please specify an input file" for a command
    // that specified one, because the file had been consumed as a subcommand.
    const root = await project()
    const { code, stdout, stderr } = await runCli(['compile', 'Screen.stx'], root)
    expect(stderr).not.toContain('Please specify an input file')
    expect(code).toBe(0)

    const ir = JSON.parse(stdout)
    expect(ir.root.type).toBe('View')
    expect(ir.root.style.padding).toBe(16)
    expect(ir.root.children[0].type).toBe('Text')
    expect(ir.root.children[0].style.fontSize).toBe(18)
  })

  it('still reports a missing file rather than crashing', async () => {
    const { code, stderr } = await runCli(['compile'], await project())
    expect(code).not.toBe(0)
    expect(stderr).toContain('Please specify an input file')
  })

  it('keeps a flag after the positional', async () => {
    const root = await project()
    const output = path.join(root, 'ir.json')
    const { code } = await runCli(['compile', 'Screen.stx', '--output', output], root)
    expect(code).toBe(0)
    expect(JSON.parse(await Bun.file(output).text()).root.type).toBe('View')
  })
})

describe('the generated bundle', () => {
  /** `generateBundle` is private; a test is allowed to know that. */
  function generate(source: string): string {
    const cli = new STXCLI() as unknown as { generateBundle: (document: unknown) => string }
    return cli.generateBundle(parseSTX(source, 'Screen.stx'))
  }

  it('is valid JavaScript', () => {
    // The whole bug: the generator's literal closed early, so what it emitted
    // was never checked against a parser either.
    const bundle = generate(SCREEN)
    expect(() => new Bun.Transpiler({ loader: 'js' }).transformSync(bundle)).not.toThrow()
  })

  it('defers the message id to when the bundle runs, not when it was compiled', () => {
    // Escaping the backticks alone would have left `${Date.now()}` to be
    // interpolated by the generator, baking one timestamp into the file so
    // every run correlated its first message under the same id.
    const bundle = generate(SCREEN)
    expect(bundle).toContain('id: `init_${Date.now()}`')
    expect(bundle).not.toMatch(/id: `init_\d+`/)
  })

  it('carries the document and the handlers the script declared', () => {
    const bundle = generate(SCREEN)
    expect(bundle).toContain('__STX_DOCUMENT__')
    expect(bundle).toContain('greet')
  })
})
