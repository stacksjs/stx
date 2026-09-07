/**
 * The runtime, store, composable and framework-composable tags ship together
 * (stacksjs/stx#1945).
 *
 * Each of those four used to splice itself into the finished document, and a
 * splice copies the whole page: measured at 193KB apiece on a 205KB page, to
 * insert a few hundred bytes. They are collected and spliced once now, which
 * means the composable bundle's reachability scan no longer sees a document
 * with the store tag already in it -- the pending fragments are handed to it
 * instead.
 *
 * That wiring is what these cover. Sabotaging it (dropping the pending
 * fragments) left the whole stx suite green while silently shipping a page
 * without a composable its store calls, which is a ReferenceError at click
 * time, so it is pinned here rather than left to the loader-level tests.
 */

import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearComposableCache } from '../../src/composable-loader'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const APP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-bundle-injection-'))
const storesDir = path.join(APP, 'stores')
const composablesDir = path.join(APP, 'functions')

// `state(` in the page is what makes the signals runtime ship; the bundles
// anchor to it, so without it there is nothing to assert.
const PAGE = [
  '<html><head><meta charset="utf-8"><title>t</title></head><body>',
  '<main><p>page</p></main>',
  '<script client>const open = state(false)</script>',
  '</body></html>',
].join('\n')

beforeAll(async () => {
  fs.mkdirSync(storesDir, { recursive: true })
  fs.mkdirSync(composablesDir, { recursive: true })

  // Reached from the store only -- named nowhere in the markup.
  // The sentinel is in the emitted VALUE, not a comment: the bundle is
  // transpiled, and comments do not survive that -- an earlier draft asserted on
  // one and failed for that reason rather than for a missing composable.
  await Bun.write(path.join(composablesDir, 'pricing.ts'), [
    `export function applyDiscount(total: number): string { return 'DISCOUNT_BODY_SENTINEL' + total * 0.9 }`,
  ].join('\n'))

  // Reached from nothing at all.
  await Bun.write(path.join(composablesDir, 'charts.ts'), [
    `export function renderAnalyticsChart(): string { return 'CHART_BODY_SENTINEL' }`,
  ].join('\n'))

  await Bun.write(path.join(storesDir, 'cart.ts'), [
    `import { defineStore, state } from 'stx'`,
    ``,
    `export const useCart = defineStore('cart', () => {`,
    `  const total = state(0)`,
    `  function checkout() { return applyDiscount(total()) }`,
    `  return { total, checkout }`,
    `})`,
  ].join('\n'))
})

afterAll(() => fs.rmSync(APP, { recursive: true, force: true }))

async function render(): Promise<string> {
  clearComposableCache()
  const options = { ...defaultConfig, storesDir, composablesDir } as StxOptions
  return processDirectives(PAGE, {}, path.join(APP, 'page.stx'), options, new Set())
}

describe('bundles injected after the signals runtime', () => {
  it('ships a composable that only a store reaches', async () => {
    // The body, not the name: `applyDiscount` appears in the store bundle
    // either way, so a name check passes whether or not pricing.ts shipped.
    const output = await render()

    expect(output).toContain('DISCOUNT_BODY_SENTINEL')
  })

  it('still leaves out what nothing reaches', async () => {
    const output = await render()

    expect(output).not.toContain('CHART_BODY_SENTINEL')
  })

  it('puts the store definitions after the runtime and before the composables', async () => {
    // The runtime defines defineStore/state/derived as globals, and a
    // composable may call useStore(), so this order is the contract the single
    // splice has to reproduce.
    const output = await render()
    const runtime = output.indexOf('data-stx-runtime')
    const stores = output.indexOf('data-stx-stores')
    const composables = output.indexOf('data-stx-composables')

    expect(runtime).toBeGreaterThan(-1)
    expect(stores).toBeGreaterThan(runtime)
    expect(composables).toBeGreaterThan(stores)
  })
})
