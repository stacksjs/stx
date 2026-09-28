import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Router } from '../src/file-router'

/**
 * `exclude`: files a page root holds that are not routes.
 *
 * A root is all-or-nothing otherwise. A framework's default views directory
 * carries its 404 page beside a login page that only works when the
 * framework's auth routes are mounted, and an app with no auth routes wants
 * the one without the other. The manifest must agree with the server, which
 * takes the same list, or typed links point at pages that 404.
 */
describe('Router exclude', () => {
  let baseDir: string
  let userDir: string
  let defaultsDir: string

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-router-exclude-'))
    userDir = path.join(baseDir, 'resources', 'views')
    defaultsDir = path.join(baseDir, 'defaults', 'views')
    fs.mkdirSync(userDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true })
  })

  function writeView(dir: string, relPath: string): string {
    const full = path.join(dir, relPath)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, '<main></main>')
    return full
  }

  function patternsFor(exclude: string[] | undefined): string[] {
    const router = new Router(baseDir, {
      pagesDirs: [path.relative(baseDir, userDir), path.relative(baseDir, defaultsDir)],
      exclude,
      emit: false,
    })
    return router.routes.map(r => r.pattern).sort()
  }

  beforeEach(() => {
    writeView(defaultsDir, 'login.stx')
    writeView(defaultsDir, 'errors/404.stx')
    writeView(defaultsDir, 'checkout/contact.stx')
    writeView(defaultsDir, 'checkout/payment.stx')
  })

  it('changes nothing when absent or empty', () => {
    const all = ['/checkout/contact', '/checkout/payment', '/errors/404', '/login']
    expect(patternsFor(undefined)).toEqual(all)
    expect(patternsFor([])).toEqual(all)
  })

  it('drops an excluded file and keeps the rest of its root', () => {
    expect(patternsFor([path.join(defaultsDir, 'login.stx')]))
      .toEqual(['/checkout/contact', '/checkout/payment', '/errors/404'])
  })

  it('drops a whole directory', () => {
    expect(patternsFor([path.join(defaultsDir, 'checkout')]))
      .toEqual(['/errors/404', '/login'])
  })

  it('resolves a relative entry against baseDir', () => {
    expect(patternsFor([path.relative(baseDir, path.join(defaultsDir, 'login.stx'))]))
      .not.toContain('/login')
  })

  it('does not treat a shared name prefix as a directory', () => {
    // `checkout` must not take `checkout-help.stx` with it.
    writeView(defaultsDir, 'checkout-help.stx')
    expect(patternsFor([path.join(defaultsDir, 'checkout')])).toContain('/checkout-help')
  })

  it('still serves an app page at the path of an excluded default', () => {
    const own = writeView(userDir, 'login.stx')
    const router = new Router(baseDir, {
      pagesDirs: [path.relative(baseDir, userDir), path.relative(baseDir, defaultsDir)],
      exclude: [path.join(defaultsDir, 'login.stx')],
      emit: false,
    })
    expect(router.routes.find(r => r.pattern === '/login')?.filePath).toBe(own)
  })
})
