/**
 * `@include('x', { … })` inside a loop receives the loop variable
 * (stacksjs/stx#1844).
 *
 * Includes are resolved at process.ts:1433, long after loops expand at :1325,
 * and their data map is evaluated with `safeEvaluateObject(varsString, context)`
 * against the PAGE context — where the loop variable no longer exists. The
 * partial rendered with an empty context, and nothing warned: the markup came
 * out structurally correct and semantically blank.
 *
 * Steps 6 and 7 of the loop body already freeze `:prop` bindings and
 * `@component` props to literals for exactly this reason. `@include` data maps
 * had no equivalent, so this adds step 8.
 *
 * A map that reads nothing from the iteration is left exactly as the author
 * wrote it, so an include outside a loop — or one passing only page-level
 * values — keeps its original expression and its original evaluation.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-include-loop-'))
  await Bun.write(path.join(dir, 'partials', 'Row.stx'), '<article class="row">{{ item.label }}</article>\n')
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Render and report the text of each rendered partial. */
async function rows(template: string): Promise<string[]> {
  const out = await processDirectives(
    template,
    {
      items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }],
      site: { label: 'SiteName' },
    },
    '/app/page.stx',
    {
      ...defaultConfig,
      partialsDir: path.join(dir, 'partials'),
      componentsDir: '/tmp',
      layoutsDir: '/tmp',
      autoShell: false,
    } as never,
    new Set<string>(),
  )
  return [...out.matchAll(/<article class="row">([^<]*)<\/article>/g)].map(m => m[1] || '(empty)')
}

describe('the loop variable reaches the partial', () => {
  it('works with the as form', async () => {
    expect(await rows('<div>@foreach(items as item)@include("Row", { item: item })@endforeach</div>'))
      .toEqual(['Alpha', 'Beta'])
  })

  it('works with the in form', async () => {
    // Both spellings now loop (#1842), so both have to carry data too.
    expect(await rows('<div>@foreach(p in items)@include("Row", { item: p })@endforeach</div>'))
      .toEqual(['Alpha', 'Beta'])
  })

  it('handles a nested object in the data map', async () => {
    // The brace inside the map is why this needs balanced-paren matching
    // rather than a lazy regex.
    expect(await rows('<div>@foreach(items as item)@include("Row", { item: { label: item.label } })@endforeach</div>'))
      .toEqual(['Alpha', 'Beta'])
  })

  it('renders one partial per iteration, each with its own value', async () => {
    // The failure looked structurally right — N articles, all blank — so the
    // count alone would not have caught it.
    const rendered = await rows('<div>@foreach(items as item)@include("Row", { item: item })@endforeach</div>')

    expect(rendered).toHaveLength(2)
    expect(new Set(rendered).size).toBe(2)
  })
})

describe('what must keep working', () => {
  it('leaves an include outside a loop alone', async () => {
    expect(await rows('<div>@include("Row", { item: items[0] })</div>')).toEqual(['Alpha'])
  })

  it('still resolves page-level values from inside a loop', async () => {
    // The map reads nothing the iteration owns, so it keeps its original
    // expression and is evaluated later against the page context, as before.
    expect(await rows('<div>@foreach(items as item)@include("Row", { item: site })@endforeach</div>'))
      .toEqual(['SiteName', 'SiteName'])
  })

  it('leaves an include with no data map alone', async () => {
    await Bun.write(path.join(dir, 'partials', 'Static.stx'), '<article class="row">static</article>\n')

    expect(await rows('<div>@foreach(items as item)@include("Static")@endforeach</div>'))
      .toEqual(['static', 'static'])
  })
})
