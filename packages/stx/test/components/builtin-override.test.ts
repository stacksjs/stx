import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { processDirectives } from '../../src/process'
import { join } from 'node:path'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

/**
 * A project-authored component file must take precedence over a built-in
 * component of the same name. The motivating case: a custom `components/Icon.stx`
 * should render instead of the built-in Lucide/Iconify `Icon`.
 */
describe('user components override built-ins', () => {
  let tempDir: string
  let componentsDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-builtin-override-'))
    componentsDir = join(tempDir, 'components')
    await mkdir(componentsDir, { recursive: true })
    await writeFile(
      join(componentsDir, 'Icon.stx'),
      `<template><svg class="my-icon" data-name="{{ name }}"></svg></template>`,
    )
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  const render = (template: string) =>
    processDirectives(template, {}, join(tempDir, 'page.stx'), { componentsDir } as any, new Set<string>())

  it('renders the user Icon component instead of the built-in', async () => {
    const result = await render(`<Icon name="house" />`)
    expect(result).toContain('class="my-icon"')
    expect(result).toContain('data-name="house"')
    // The built-in Lucide path is not taken.
    expect(result).not.toContain('not found in lucide')
  })

  it('still falls back to the built-in when no user file exists', async () => {
    // <StxLink> is a built-in with no user override here.
    const result = await render(`<StxLink href="/about">About</StxLink>`)
    expect(result).toContain('<a')
    expect(result).toContain('/about')
  })
})
