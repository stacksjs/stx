import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'

/**
 * The macOS sidebar revamp: `@stacksjs/components`' Sidebar renders purely
 * with stx + utility classes (no native fallback) and recreates the macOS
 * Tahoe source list. These tests pin the rendered contract the Sidebar
 * client controller relies on, plus the engine fixes the revamp required:
 *
 * 1. `$slots` is exposed to component server contexts (`@if($slots.header)`).
 * 2. `<template #name>` slot templates are never mistaken for a component's
 *    SFC root template (previously the page collapsed to the slot's content).
 * 3. `$props` tolerates props named after readonly function properties
 *    (`name`, `length`) — previously Object.assign threw and silently
 *    killed the component's server script.
 */

const componentsDir = path.resolve(__dirname, '../../../components/src/ui/sidebar')
const pagePath = path.resolve(__dirname, '../../../components/examples/__test__.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, pagePath, { componentsDir } as any, new Set<string>())
}

describe('macOS sidebar component', () => {
  it('renders sections, rows, icon tints and plain gray counts', async () => {
    const result = await render(`<body><Sidebar theme="macos" placement="static" :sections="[
      { id: 'favorites', label: 'Favorites', items: [
        { id: 'icloud', label: 'iCloud', icon: 'i-f7-tray', iconColor: 'blue', count: 248, active: true },
      ] },
    ]" /></body>`)

    expect(result).toContain('data-sidebar-theme="macos"')
    expect(result).toContain('data-section-id="favorites"')
    expect(result).toContain('data-item-id="icloud"')
    // macOS system blue tint on the icon
    expect(result).toContain('color: #0088ff')
    // plain gray text count, not a pill badge
    expect(result).toContain('tabular-nums')
    expect(result).toContain('>248<')
    // the selected row carries the active marker for the controller
    expect(result).toContain('data-active="true"')
    // Liquid Glass edge highlight layer
    expect(result).toContain('stx-sidebar-rim')
  })

  it('flattens nested children with depth indent and ancestor ids', async () => {
    const result = await render(`<body><Sidebar theme="macos" placement="static" :sections="[
      { id: 's', items: [
        { id: 'parent', label: 'All Inboxes', children: [
          { id: 'child', label: 'iCloud' },
        ] },
      ] },
    ]" /></body>`)

    // parent knows it is expandable
    expect(result).toMatch(/data-item-id="parent"[^>]*/)
    expect(result).toContain('data-expanded="true"')
    // child row remembers its ancestor chain and indents one level
    expect(result).toContain('data-parents="parent"')
    expect(result).toContain('padding-left: 16px')
  })

  it('renders named header and footer slots gated by $slots', async () => {
    const result = await render(`<body><Sidebar theme="macos" placement="static" :sections="[{ id: 's', items: [{ id: 'a', label: 'A' }] }]">
      <template #header>
        <SidebarHeader />
      </template>
      <template #footer>
        <SidebarFooter name="Chris Breuer" />
      </template>
    </Sidebar></body>`)

    // header strip with traffic lights
    expect(result).toContain('h-[52px]')
    expect(result).toContain('bg-[#ff5f57]')
    // footer account row — `name` prop exercises the readonly-prop fix
    expect(result).toContain('Chris Breuer')
    expect(result).toContain('h-[44px]')
  })

  it('does not collapse the page to the first slot template content', async () => {
    const result = await render(`<!DOCTYPE html>
<html><body><div id="shell"><Sidebar theme="macos" placement="static" :sections="[{ id: 's', items: [{ id: 'a', label: 'A' }] }]">
  <template #header><SidebarHeader /></template>
</Sidebar></div></body></html>`)

    expect(result).toContain('<!DOCTYPE')
    expect(result).toContain('id="shell"')
    expect(result).toContain('<aside')
  })
})
