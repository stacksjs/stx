/**
 * A route typo is a type error, and a computed URL still compiles
 * (stacksjs/stx#1887).
 *
 * `generateRouteTypes()` emitted `declare module "stx/routes"` into a specifier
 * nothing declares or imports. TypeScript read that as an ambient module
 * declaration rather than an augmentation, so it parsed, shipped, and
 * constrained nothing — `navigate('/dashbaord')` type-checked.
 *
 * Two failure modes had to be avoided at once, and they pull against each
 * other:
 *
 *  - `RoutePath = KnownRoute | (string & {})` catches nothing. A parameter that
 *    accepts a computed `string` accepts every literal too. That is the same
 *    trade the dangling declaration already made.
 *  - a plain union rejects real code. This repo's own tests navigate to
 *    `'?status=resolved'`, `'guide'` and `'https://example.com/pricing'`, and
 *    the generated union holds PATTERNS (`/cars/:id`) while callers pass URLs
 *    (`/cars/42`) — measured against a real app it would have produced zero
 *    true positives against five false ones.
 *
 * So the check is a generic gate on the argument's own literal type. The tests
 * that matter compile a real project: a string assertion over the emitted text
 * passes just as happily for the dangling version, which is exactly how this
 * bug survived.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateRouteTypes } from '../src/router'
import { $path } from '../src/route-types'

describe('$path', () => {
  it('fills a dynamic segment', () => {
    expect($path('/cars/:id' as string, { id: 42 } as any)).toBe('/cars/42')
  })

  it('drops the leading slash of an absent optional segment', () => {
    // `/settings/:tab?` with no tab is `/settings`, not `/settings/`.
    expect($path('/settings/:tab?' as string)).toBe('/settings')
    expect($path('/settings/:tab?' as string, { tab: 'profile' } as any)).toBe('/settings/profile')
  })

  it('keeps the slashes inside a catch-all', () => {
    // A catch-all matches across separators, so encoding the whole value would
    // turn the path into one escaped segment.
    expect($path('/blog/:slug*' as string, { slug: '2024/jan/hello' } as any)).toBe('/blog/2024/jan/hello')
  })

  it('encodes each segment', () => {
    expect($path('/cars/:id' as string, { id: 'a b&c' } as any)).toBe('/cars/a%20b%26c')
  })

  it('appends leftover params as a query string', () => {
    expect($path('/cars/:id' as string, { id: 1, sort: 'new' } as any)).toBe('/cars/1?sort=new')
  })

  it('leaves a pattern alone when its param was not supplied', () => {
    expect($path('/cars/:id' as string, {} as any)).toBe('/cars/:id')
  })
})

describe('the generated declaration', () => {
  let dir = ''

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-route-decl-'))
  })

  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true })
  })

  function generate(routes: Array<{ pattern: string, params: string[] }>): string {
    const out = path.join(dir, `.stx-${Math.abs(routes.length * 31 + routes.length)}`)
    generateRouteTypes(
      routes.map(r => ({ ...r, filePath: 'x', isDynamic: r.params.length > 0, regex: /x/ })) as any,
      out,
    )
    return fs.readFileSync(path.join(out, 'route-types.d.ts'), 'utf8')
  }

  it('augments the real package, not a specifier nothing resolves', () => {
    const text = generate([{ pattern: '/about', params: [] }])

    expect(text).toContain(`declare module '@stacksjs/stx'`)
    expect(text).toContain('interface KnownRoutes')
  })

  it('ends with export {}, which is what makes it an augmentation', () => {
    // Without it the block REPLACES the package instead of extending it — the
    // difference between constraining something and constraining nothing.
    expect(generate([{ pattern: '/about', params: [] }])).toContain('export {}')
  })

  it('marks an optional segment optional', () => {
    // Otherwise $path('/settings/:tab?') demands an argument for the very
    // segment whose point is that it can be absent.
    expect(generate([{ pattern: '/settings/:tab?', params: ['tab'] }])).toContain(`'/settings/:tab?': { tab?: string }`)
  })

  it('types a catch-all as one string, not an array', () => {
    // `/blog/:slug*` against `/blog/2024/jan/hi` yields `{ slug: '2024/jan/hi' }`
    // — one capture containing slashes.
    expect(generate([{ pattern: '/blog/:slug*', params: ['slug'] }])).toContain(`'/blog/:slug*': { slug: string }`)
  })

  it('omits components, layouts and partials', () => {
    const text = generate([
      { pattern: '/about', params: [] },
      { pattern: '/components/site-nav', params: [] },
    ])

    expect(text).toContain(`'/about'`)
    expect(text).not.toContain('site-nav')
  })

  it('emits no interface when there are no routes', () => {
    const text = generate([])

    expect(text).not.toContain('KnownRoutes')
    expect(text).toContain('stay typed as string')
  })
})

// The decisive tests. Everything above would pass for a dangling declaration.
describe('type checking a real project', () => {
  let project = ''
  let linkError = ''

  beforeAll(() => {
    project = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-route-tsc-'))

    const modules = path.join(project, 'node_modules', '@stacksjs')
    fs.mkdirSync(modules, { recursive: true })
    try {
      fs.symlinkSync(path.resolve(import.meta.dir, '..'), path.join(modules, 'stx'), 'dir')
    }
    catch (e) {
      // Recorded, not swallowed — a silent skip would leave the only tests that
      // can catch a dangling declaration passing because they ran nothing.
      linkError = String(e)
    }

    generateRouteTypes([
      { pattern: '/', params: [] },
      { pattern: '/about', params: [] },
      { pattern: '/host/dashboard', params: [] },
      { pattern: '/cars/:id', params: ['id'] },
      { pattern: '/settings/:tab?', params: ['tab'] },
    ].map(r => ({ ...r, filePath: 'x', isDynamic: r.params.length > 0, regex: /x/ })) as any,
    path.join(project, '.stx'))

    const compilerOptions = {
      strict: true,
      noEmit: true,
      moduleResolution: 'bundler',
      module: 'esnext',
      target: 'esnext',
      skipLibCheck: true,
      types: [] as string[],
    }
    fs.writeFileSync(path.join(project, 'tsconfig.json'), JSON.stringify({
      compilerOptions,
      include: ['page.ts', '.stx/*.d.ts'],
    }))
    // A second project that never generated the declaration.
    fs.writeFileSync(path.join(project, 'tsconfig.bare.json'), JSON.stringify({
      compilerOptions,
      include: ['bare.ts'],
    }))
  })

  afterAll(() => {
    if (project) fs.rmSync(project, { recursive: true, force: true })
  })

  const DECL = `declare function navigate<T extends string>(u: T & import('@stacksjs/stx').CheckHref<T>, o?: unknown): void\n`

  async function check(file: string, config: string, source: string): Promise<string> {
    fs.writeFileSync(path.join(project, file), source)
    const proc = Bun.spawn(['bunx', '--bun', 'tsc', '--noEmit', '-p', config], {
      cwd: project,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    await proc.exited
    return out + err
  }

  it('accepts every shape real code actually uses', async () => {
    expect(linkError).toBe('')

    const output = await check('page.ts', 'tsconfig.json', `${DECL}import { $path } from '@stacksjs/stx'
const id = '42'
const nextUrl: string = '/about'
const mut = '/about'
navigate('/')
navigate('/about')
navigate('/host/dashboard')
navigate('/cars/42')
navigate('/settings')
navigate('/settings/profile')
navigate('/about?ref=x')
navigate('/about#top')
navigate('?status=resolved')
navigate('guide')
navigate('https://example.com/pricing')
navigate('./sibling')
navigate(nextUrl)
navigate(mut)
navigate(\`/cars/\${id}\`)
navigate('/cars/' + id)
navigate(Math.random() > 0.5 ? '/about' : '/')
;['/about', '/'].forEach(u => navigate(u))
navigate($path('/cars/:id', { id: 7 }))
navigate($path('/settings/:tab?'))
`)

    expect(output).not.toMatch(/error TS/)
  }, 180_000)

  it('rejects a typo in a hand-written path', async () => {
    expect(linkError).toBe('')

    const output = await check('page.ts', 'tsconfig.json', `${DECL}navigate('/abuot')\n`)

    expect(output).toMatch(/error TS/)
    expect(output).toContain('abuot')
  }, 180_000)

  it('rejects a raw pattern passed where a URL belongs', async () => {
    expect(linkError).toBe('')

    const output = await check('page.ts', 'tsconfig.json', `${DECL}navigate('/cars/:id')\n`)

    expect(output).toMatch(/error TS/)
  }, 180_000)

  it('rejects a typo inside a ternary arm', async () => {
    expect(linkError).toBe('')

    const output = await check('page.ts', 'tsconfig.json', `${DECL}navigate(Math.random() > 0.5 ? '/about' : '/typo')\n`)

    expect(output).toMatch(/error TS/)
  }, 180_000)

  it('checks nothing when no declaration was generated', async () => {
    // An un-adopted project must be completely unaffected.
    expect(linkError).toBe('')

    const output = await check('bare.ts', 'tsconfig.bare.json', `${DECL}navigate('/anything-at-all')\n`)

    expect(output).not.toMatch(/error TS/)
  }, 180_000)
})
