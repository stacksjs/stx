import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Router } from '../src/file-router'

/**
 * Building a router writes the route manifest and types into the state
 * directory. That is right for a dev server or a build, and wrong for a caller
 * that only wants to read the routes: it used to overwrite a project's
 * committed manifest with whatever that caller happened to scan.
 */
describe('Router emit option', () => {
  let baseDir: string
  let stateDir: string

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-router-emit-'))
    stateDir = path.join(baseDir, 'state')
    fs.mkdirSync(path.join(baseDir, 'pages'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, 'pages', 'index.stx'), '<main>Home</main>\n')
  })

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true })
  })

  it('writes the manifest and types by default', () => {
    const router = new Router(baseDir, { pagesDir: 'pages', stateDir })

    expect(router.routes.map(r => r.pattern)).toEqual(['/'])
    expect(fs.readFileSync(path.join(stateDir, 'routes.ts'), 'utf8')).toContain(`pattern: '/'`)
    expect(fs.existsSync(path.join(stateDir, 'route-types.d.ts'))).toBe(true)
  })

  it('writes nothing with emit: false, and still discovers the routes', () => {
    const router = new Router(baseDir, { pagesDir: 'pages', stateDir, emit: false })

    expect(router.routes.map(r => r.pattern)).toEqual(['/'])
    expect(fs.existsSync(stateDir)).toBe(false)
  })
})
