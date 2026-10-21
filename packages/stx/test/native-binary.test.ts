import { afterAll, expect, test } from 'bun:test'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findCraftBinary } from '../src/native-build'

const root = mkdtempSync(join(tmpdir(), 'stx-native-binary-'))
const project = join(root, 'apps/sample')
const managed = join(root, 'managed/craft')
const checkout = join(root, 'craft/packages/zig/zig-out/bin/craft')
for (const file of [managed, checkout]) {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, '#!/bin/sh\nexit 0\n')
  chmodSync(file, 0o755)
}
mkdirSync(project, { recursive: true })
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('uses the installed runtime rather than a neighboring Craft checkout', () => {
  const previous = { cwd: process.cwd(), path: process.env.PATH, override: process.env.CRAFT_BIN }
  try {
    process.chdir(project)
    process.env.PATH = join(root, 'managed')
    delete process.env.CRAFT_BIN
    expect(findCraftBinary()).toBe(managed)
    process.env.PATH = ''
    expect(findCraftBinary()).toBeNull()
    process.env.CRAFT_BIN = checkout
    expect(findCraftBinary()).toBe(checkout)
    process.env.CRAFT_BIN = join(root, 'missing')
    expect(() => findCraftBinary()).toThrow('CRAFT_BIN points to a missing file')
  }
  finally {
    process.chdir(previous.cwd)
    if (previous.path === undefined) delete process.env.PATH
    else process.env.PATH = previous.path
    if (previous.override === undefined) delete process.env.CRAFT_BIN
    else process.env.CRAFT_BIN = previous.override
  }
})
