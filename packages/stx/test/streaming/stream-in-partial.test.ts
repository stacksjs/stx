/**
 * @stream inside an included partial (stacksjs/stx#1746).
 *
 * The page-level @stream extraction runs before @include resolves, so a
 * boundary that lives in a partial was previously missed (rendered literal). A
 * second extraction pass after processIncludes — still before
 * conditionals/expressions — captures it raw.
 *
 * Rendered via the src processDirectives (not Bun.build).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import type { StxOptions } from '../../src/types'

const opts: StxOptions = { debug: false, componentsDir: 'components' }
const tmp = path.join(os.tmpdir(), 'stx-1746-stream-partial')
const partialPath = path.join(tmp, 'tabs.stx')

beforeAll(async () => {
  await fs.promises.mkdir(tmp, { recursive: true })
  await fs.promises.writeFile(
    partialPath,
    `@stream('tab')<section>{{ $boundary.title }}</section>@fallback<p>Loading…</p>@endstream`,
  )
})
afterAll(async () => { await fs.promises.rm(tmp, { recursive: true, force: true }) })

describe('@stream inside an included partial (#1746)', () => {
  it('extracts the boundary from the partial — placeholder + captured template, not literal', async () => {
    const ctx: Record<string, any> = {}
    const out = await processDirectives(
      `<h1>Page</h1>@include('${partialPath}')`,
      ctx,
      path.join(tmp, 'page.stx'),
      opts,
      new Set(),
    )

    expect(out).toContain('<div data-suspense="tab"><p>Loading…</p></div>')
    expect(out).not.toContain('@stream')
    expect(ctx.__streamTemplates.tab).toBe('<section>{{ $boundary.title }}</section>')
  })
})
