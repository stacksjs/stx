import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Router } from '../src/file-router'

/**
 * Layered page roots: the Router accepts an ordered stack of page
 * directories. Earlier roots shadow later ones for the same pattern,
 * which lets a framework ship default views (cart, checkout, orders)
 * and let apps override them just by dropping a file with the same
 * relative path into their own views directory.
 */
describe('Router with layered pagesDirs', () => {
  let baseDir: string
  let userDir: string
  let defaultsDir: string

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-router-roots-'))
    userDir = path.join(baseDir, 'resources', 'views')
    defaultsDir = path.join(baseDir, 'storage', 'framework', 'defaults', 'resources', 'views')
    fs.mkdirSync(userDir, { recursive: true })
    fs.mkdirSync(path.join(defaultsDir, 'orders'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true })
  })

  function writeView(dir: string, relPath: string, body = '<html></html>'): string {
    const full = path.join(dir, relPath)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, body)
    return full
  }

  it('serves a default-only page from the second root', () => {
    writeView(userDir, 'index.stx')
    writeView(defaultsDir, 'cart.stx')
    writeView(defaultsDir, 'orders/[id].stx')

    const router = new Router(baseDir, {
      pagesDirs: [
        path.relative(baseDir, userDir),
        path.relative(baseDir, defaultsDir),
      ],
    })

    const patterns = router.routes.map(r => r.pattern).sort()
    expect(patterns).toContain('/cart')
    expect(patterns).toContain('/orders/:id')
    expect(patterns).toContain('/')
  })

  it('first root shadows the second for the same pattern', () => {
    const userIndex = writeView(userDir, 'index.stx', '<!-- user -->')
    writeView(defaultsDir, 'index.stx', '<!-- defaults -->')

    const router = new Router(baseDir, {
      pagesDirs: [
        path.relative(baseDir, userDir),
        path.relative(baseDir, defaultsDir),
      ],
    })

    const indexRoute = router.routes.find(r => r.pattern === '/')
    expect(indexRoute).toBeDefined()
    expect(indexRoute!.filePath).toBe(userIndex)

    // The shadowed default must NOT also be in the route list — that
    // would duplicate `/` and the wrong one might match first.
    const indexes = router.routes.filter(r => r.pattern === '/')
    expect(indexes.length).toBe(1)
  })

  it('falls back to second root for patterns not present in the first', () => {
    writeView(userDir, 'index.stx')
    const defaultCart = writeView(defaultsDir, 'cart.stx', '<!-- defaults -->')

    const router = new Router(baseDir, {
      pagesDirs: [
        path.relative(baseDir, userDir),
        path.relative(baseDir, defaultsDir),
      ],
    })

    const cartRoute = router.routes.find(r => r.pattern === '/cart')
    expect(cartRoute).toBeDefined()
    expect(cartRoute!.filePath).toBe(defaultCart)
  })

  it('preserves backwards-compat single-root pagesDir', () => {
    writeView(userDir, 'about.stx')

    const router = new Router(baseDir, {
      pagesDir: path.relative(baseDir, userDir),
    })

    expect(router.routes.map(r => r.pattern)).toEqual(['/about'])
  })

  it('matches /cart against a defaults-only view', () => {
    writeView(userDir, 'index.stx')
    writeView(defaultsDir, 'cart.stx')

    const router = new Router(baseDir, {
      pagesDirs: [
        path.relative(baseDir, userDir),
        path.relative(baseDir, defaultsDir),
      ],
    })

    const match = router.match('/cart')
    expect(match).not.toBeNull()
    expect(match!.route.pattern).toBe('/cart')
  })

  it('handles missing first root gracefully', () => {
    writeView(defaultsDir, 'cart.stx')

    const router = new Router(baseDir, {
      pagesDirs: [
        'does/not/exist',
        path.relative(baseDir, defaultsDir),
      ],
    })

    expect(router.routes.map(r => r.pattern)).toContain('/cart')
  })
})
