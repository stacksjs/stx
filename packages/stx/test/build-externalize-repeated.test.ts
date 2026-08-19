import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { externalizeRepeatedAssets } from '../src/build-externalize-repeated'

const made: string[] = []

function site(pages: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-repeated-'))
  made.push(dir)
  for (const [name, html] of Object.entries(pages)) {
    const file = path.join(dir, name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, html)
  }
  return dir
}

function read(dir: string, name: string): string {
  return fs.readFileSync(path.join(dir, name), 'utf8')
}

/** A body big enough to clear the min-size floor. */
const big = (marker: string): string => `${marker};${'x'.repeat(2048)}`

afterEach(() => {
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('externalizeRepeatedAssets', () => {
  it('lifts a script body shared by two pages into one asset', () => {
    const body = big('console.log(1)')
    const dir = site({
      'a.html': `<html><body><script data-stx-scoped>${body}</script></body></html>`,
      'b.html': `<html><body><script data-stx-scoped>${body}</script></body></html>`,
    })

    const result = externalizeRepeatedAssets(dir)

    expect(result.assets).toBe(1)
    expect(result.pages).toBe(2)
    expect(result.bytesInlined).toBe(body.length * 2)

    const [asset] = fs.readdirSync(path.join(dir, '_stx'))
    expect(asset).toMatch(/^chunk\.[0-9a-f]+\.js$/)
    expect(fs.readFileSync(path.join(dir, '_stx', asset), 'utf8')).toBe(body)

    for (const page of ['a.html', 'b.html']) {
      expect(read(dir, page)).toContain(`<script data-stx-scoped src="/_stx/${asset}"></script>`)
      expect(read(dir, page)).not.toContain(body)
    }
  })

  it('leaves a blob that appears on only one page inline', () => {
    const shared = big('shared()')
    const once = big('lonely()')
    const dir = site({
      'a.html': `<html><body><script>${shared}</script><script>${once}</script></body></html>`,
      'b.html': `<html><body><script>${shared}</script></body></html>`,
    })

    const result = externalizeRepeatedAssets(dir)

    expect(result.assets).toBe(1)
    expect(read(dir, 'a.html')).toContain(once)
  })

  it('turns a repeated style into a stylesheet link, keeping its attributes', () => {
    const css = big('.a{color:red}')
    const dir = site({
      'a.html': `<html><head><style data-page>${css}</style></head></html>`,
      'b.html': `<html><head><style data-page>${css}</style></head></html>`,
    })

    externalizeRepeatedAssets(dir)

    const [asset] = fs.readdirSync(path.join(dir, '_stx'))
    expect(asset).toMatch(/^style\.[0-9a-f]+\.css$/)
    expect(read(dir, 'a.html')).toContain(`<link data-page rel="stylesheet" href="/_stx/${asset}">`)
  })

  it('preserves type="module" on the reference it writes', () => {
    const body = big('export const a = 1')
    const dir = site({
      'a.html': `<html><body><script type="module">${body}</script></body></html>`,
      'b.html': `<html><body><script type="module">${body}</script></body></html>`,
    })

    externalizeRepeatedAssets(dir)

    expect(read(dir, 'a.html')).toContain('<script type="module" src="/_stx/')
  })

  it('never externalizes structured data, whatever its size', () => {
    const json = `{"@context":"https://schema.org","x":"${'y'.repeat(2048)}"}`
    const dir = site({
      'a.html': `<html><head><script type="application/ld+json">${json}</script></head></html>`,
      'b.html': `<html><head><script type="application/ld+json">${json}</script></head></html>`,
    })

    const result = externalizeRepeatedAssets(dir)

    expect(result.assets).toBe(0)
    expect(read(dir, 'a.html')).toContain(json)
  })

  it('leaves a style that belongs to a template subtree alone', () => {
    const css = big('.scoped{color:red}')
    const dir = site({
      'a.html': `<html><body><template><style>${css}</style></template></body></html>`,
      'b.html': `<html><body><template><style>${css}</style></template></body></html>`,
    })

    expect(externalizeRepeatedAssets(dir).assets).toBe(0)
  })

  it('skips blobs too small to be worth a request', () => {
    const dir = site({
      'a.html': '<html><body><script>a()</script></body></html>',
      'b.html': '<html><body><script>a()</script></body></html>',
    })

    expect(externalizeRepeatedAssets(dir).assets).toBe(0)
  })

  it('is a no-op on a second run', () => {
    const body = big('console.log(2)')
    const dir = site({
      'a.html': `<html><body><script>${body}</script></body></html>`,
      'b.html': `<html><body><script>${body}</script></body></html>`,
    })

    externalizeRepeatedAssets(dir)
    const after = read(dir, 'a.html')

    expect(externalizeRepeatedAssets(dir).assets).toBe(0)
    expect(read(dir, 'a.html')).toBe(after)
  })

  it('keeps execution order, so a page still runs its scripts in sequence', () => {
    const first = big('first()')
    const second = big('second()')
    const dir = site({
      'a.html': `<html><body><script>${first}</script><script>${second}</script></body></html>`,
      'b.html': `<html><body><script>${first}</script><script>${second}</script></body></html>`,
    })

    externalizeRepeatedAssets(dir)

    const html = read(dir, 'a.html')
    const refs = [...html.matchAll(/src="\/_stx\/(chunk\.[0-9a-f]+\.js)"/g)].map(m => m[1])
    expect(refs).toHaveLength(2)
    expect(fs.readFileSync(path.join(dir, '_stx', refs[0]), 'utf8')).toBe(first)
    expect(fs.readFileSync(path.join(dir, '_stx', refs[1]), 'utf8')).toBe(second)
  })

  it('does nothing to a single-page site', () => {
    const dir = site({ 'a.html': `<html><body><script>${big('x()')}</script></body></html>` })
    expect(externalizeRepeatedAssets(dir).assets).toBe(0)
  })
})
