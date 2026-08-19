import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { extractVariables } from '../src/variable-extractor'

const made: string[] = []

function project(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-require-'))
  made.push(dir)
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(dir, name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, contents)
  }
  return dir
}

afterEach(() => {
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('require() in a server script', () => {
  it('resolves a relative specifier against the template, not against stx', async () => {
    const dir = project({
      'lib/analyze.ts': 'export function analyze() { return { total: 42 } }\n',
      'pages/index.stx': '',
    })
    const context: Record<string, unknown> = {}

    await extractVariables(
      `const { analyze } = require('../lib/analyze.ts')\nconst total = analyze().total`,
      context,
      path.join(dir, 'pages/index.stx'),
    )

    expect(context.total).toBe(42)
  })

  it('reaches a sibling module too', async () => {
    const dir = project({ 'pages/data.ts': 'export const label = \'ok\'\n', 'pages/index.stx': '' })
    const context: Record<string, unknown> = {}

    await extractVariables(
      `const { label } = require('./data.ts')\nconst shown = label`,
      context,
      path.join(dir, 'pages/index.stx'),
    )

    expect(context.shown).toBe('ok')
  })

  it('says which relative module could not be resolved, instead of failing silently', async () => {
    const dir = project({ 'pages/index.stx': '' })
    const context: Record<string, unknown> = {}
    const warnings: string[] = []
    const original = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')) }

    try {
      // Silence is the bug this guards: a page whose every value renders blank,
      // with nothing in the output or the logs to say why. Rendering still
      // continues — that is stx's deliberate policy for a failed server script
      // — but the reason now reaches the console.
      await extractVariables(
        `const { missing } = require('../lib/nope.ts')\nconst value = missing`,
        context,
        path.join(dir, 'pages/index.stx'),
      )
    }
    finally {
      console.warn = original
    }

    expect(warnings.join('\n')).toContain('../lib/nope.ts')
    expect(context.value).toBeUndefined()
  })

  it('still lets bare specifiers fall through to the runtime', async () => {
    const dir = project({ 'pages/index.stx': '' })
    const context: Record<string, unknown> = {}

    await extractVariables(
      `const path = require('node:path')\nconst joined = path.join('a', 'b')`,
      context,
      path.join(dir, 'pages/index.stx'),
    )

    expect(context.joined).toBe('a/b')
  })
})
