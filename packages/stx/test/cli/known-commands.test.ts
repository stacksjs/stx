/**
 * Every registered command is reachable (stacksjs/stx#1881).
 *
 * A hand-maintained `knownCommands` array gated argv before the parser ever saw
 * it, and it had drifted from the registrations: `bundle`, `pwa` and `images`
 * are fully implemented, are listed by `stx --help`, and were rejected with
 * "Unknown command" plus a suggestion for a different one.
 *
 * The gate is derived now. The subtlety worth a test rather than a comment is
 * that deriving from command NAMES alone is not enough — `new` and `i` are
 * aliases of `init` and `interactive`, so a names-only derivation silently
 * breaks two working commands while fixing three. That is the trap in the
 * issue's own suggested fix.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'

const CLI = path.join(import.meta.dir, '..', '..', 'bin', 'cli.ts')

/** Run `stx <command> --help` and report whether the CLI accepted it. */
async function accepts(command: string): Promise<boolean> {
  const proc = Bun.spawn(['bun', CLI, command, '--help'], { stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  await proc.exited
  return !`${out}${err}`.includes('Unknown command')
}

describe('commands that are registered are reachable', () => {
  it('accepts the three that the hand-maintained gate had dropped', async () => {
    for (const command of ['bundle', 'pwa', 'images'])
      expect(await accepts(command)).toBe(true)
  })

  it('still accepts a representative sample of the rest', async () => {
    for (const command of ['build', 'docs', 'dev', 'init'])
      expect(await accepts(command)).toBe(true)
  })
})

describe('aliases survive the derivation', () => {
  it('accepts new and i', async () => {
    // Not commands in their own right — aliases of init and interactive. A
    // gate derived from names alone rejects both.
    expect(await accepts('new')).toBe(true)
    expect(await accepts('i')).toBe(true)
  })
})

describe('the gate is still a gate', () => {
  it('rejects something that is neither a command nor a path', async () => {
    expect(await accepts('definitely-not-a-command')).toBe(false)
  })
})
