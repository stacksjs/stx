/**
 * A tag written inside a package resolves to that package's component.
 *
 * Resolution ranked the host app's directories ahead of the referencing file's
 * own, so `<Avatar>` written inside `@stacksjs/components` was answered by the
 * app's `Avatar` and the package component rendered against markup it was
 * never written for. In stacksjs/stacks#3213 that produced three native
 * diagnostics per avatar; moving the host's Avatar aside took them from nine
 * to zero (stacksjs/stx#2170).
 *
 * The two halves pull in opposite directions and both are asserted here,
 * because a fix that simply ranks packages first everywhere reverses the
 * other: an app writing `<EmptyState>` must still get the framework's
 * (stacksjs/stx#2927). What separates them is which file holds the tag.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { packageComponentDirs, resolveComponentFileSync } from '../../src/component-resolution'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-package-precedence-')
const app = join(root, 'app')
const pkg = join(app, 'node_modules', '@scope', 'kit')
const flat = join(app, 'node_modules', '@scope', 'flat')

function write(file: string, body: string) {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, body, 'utf8')
}

beforeAll(() => {
  write(join(app, 'package.json'), '{"name":"host-app","version":"1.0.0"}')
  write(join(app, 'components', 'Avatar.stx'), '<div class="host">host</div>')
  write(join(app, 'pages', 'Home.stx'), '<Avatar />')

  // A package laid out conventionally.
  write(join(pkg, 'package.json'), '{"name":"@scope/kit","version":"1.0.0"}')
  write(join(pkg, 'src', 'ui', 'avatar', 'Avatar.stx'), '<div class="kit">kit</div>')
  write(join(pkg, 'dist', 'ConversationListItem.stx'), '<Avatar />')

  // A package shipping a flat, content-hashed dist and naming its own roots,
  // which is the only way a plain `Name.stx` lookup can find anything there.
  write(join(flat, 'package.json'), '{"name":"@scope/flat","version":"1.0.0","stx":{"components":["./ui"]}}')
  write(join(flat, 'ui', 'Avatar.stx'), '<div class="flat">flat</div>')
  write(join(flat, 'dist', 'Card-9f2ab1cd.stx'), '<Avatar />')
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

const options = () => ({ componentsDir: join(app, 'components'), projectRoot: app })

describe('a component tag inside an installed package', () => {
  it('resolves to the package it was written in, not the host app', () => {
    const from = join(pkg, 'dist', 'ConversationListItem.stx')

    expect(resolveComponentFileSync('Avatar', from, options())).toBe(join(pkg, 'src', 'ui', 'avatar', 'Avatar.stx'))
  })

  it('still gives an app page the app component of the same name', () => {
    // The #2927 half. A fix that ranks packages first everywhere breaks this.
    const from = join(app, 'pages', 'Home.stx')

    expect(resolveComponentFileSync('Avatar', from, options())).toBe(join(app, 'components', 'Avatar.stx'))
  })

  it('uses the roots a flat package declares in its manifest', () => {
    const from = join(flat, 'dist', 'Card-9f2ab1cd.stx')

    expect(resolveComponentFileSync('Avatar', from, options())).toBe(join(flat, 'ui', 'Avatar.stx'))
  })
})

describe('packageComponentDirs', () => {
  it('offers nothing for a file in the project being built', () => {
    expect(packageComponentDirs(join(app, 'pages', 'Home.stx'), app)).toEqual([])
  })

  it('prefers a declared root over the conventional ones', () => {
    const dirs = packageComponentDirs(join(flat, 'dist', 'Card-9f2ab1cd.stx'), app)

    expect(dirs).toEqual([join(flat, 'dist'), join(flat, 'ui')])
  })

  it('reads an installed dependency even when no project root is known', () => {
    // The renderer only has a root when one is configured; a dependency is the
    // case that can still be recognised without it.
    expect(packageComponentDirs(join(pkg, 'dist', 'ConversationListItem.stx'))).toContain(join(pkg, 'src', 'ui'))
  })

  it('stays silent for a rootless file outside node_modules', () => {
    // Without a root, treating the nearest package.json as "a package" would
    // start ranking a page's own directory above the configured one.
    expect(packageComponentDirs(join(app, 'pages', 'Home.stx'))).toEqual([])
  })
})
