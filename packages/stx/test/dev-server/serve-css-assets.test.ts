import { afterEach, beforeEach, expect, it, spyOn } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearCssServeAssets, getCssServeAsset, registerCssServeAsset } from '../../src/dev-server/serve-css-assets'
import { injectCss, resetCssCache } from '../../src/dev-server/ts-css'
import { createTempDir } from '../../src/temp-dir'

const previousStateDir = process.env.STX_DIR
let root: string
const css = '.flex{display:flex}'
const fileFor = (hash: string) => path.join(root, 'state/css-assets', `${hash}.css`)

beforeEach(() => {
  root = createTempDir('stx-css-assets-')
  process.env.STX_DIR = path.join(root, 'state')
  clearCssServeAssets()
})
afterEach(() => {
  if (previousStateDir === undefined) delete process.env.STX_DIR
  else process.env.STX_DIR = previousStateDir
  resetCssCache()
  fs.rmSync(root, { recursive: true, force: true })
})

it('keeps exact CSS after clearing memory, without rewriting a valid asset', () => {
  const hash = registerCssServeAsset(css)!
  expect(hash).toMatch(/^[a-f0-9]{16}$/)
  expect(fs.readFileSync(fileFor(hash), 'utf8')).toBe(css)
  fs.utimesSync(fileFor(hash), 100, 100)
  clearCssServeAssets()
  expect(getCssServeAsset(hash)).toBe(css)
  expect(registerCssServeAsset(css)).toBe(hash)
  expect(fs.statSync(fileFor(hash)).mtimeMs).toBe(100_000)
  expect(fs.readdirSync(path.dirname(fileFor(hash)))).toEqual([`${hash}.css`])
})

it('rejects unknown, invalid and corrupted assets, then repairs their original bytes', () => {
  const hash = registerCssServeAsset(css)!
  clearCssServeAssets()
  fs.writeFileSync(fileFor(hash), 'truncated')
  expect(getCssServeAsset(hash)).toBeUndefined()
  for (const invalid of ['0000000000000000', '../elsewhere', `${hash}/../secret`, 'not-a-hash'])
    expect(getCssServeAsset(invalid)).toBeUndefined()
  expect(registerCssServeAsset(css)).toBe(hash)
  clearCssServeAssets()
  expect(getCssServeAsset(hash)).toBe(css)
})

it('bounds memory retention while serving evicted CSS from disk', () => {
  const hashes = Array.from({ length: 258 }, (_, index) => registerCssServeAsset(`.item{--index:${index}}`)!)
  expect(getCssServeAsset(hashes[0]!)).toBe('.item{--index:0}')
  // A different old entry remains evicted, so deleting its disk copy is a miss.
  fs.unlinkSync(fileFor(hashes[1]!))
  expect(getCssServeAsset(hashes[1]!)).toBeUndefined()
  const newest = hashes.at(-1)!
  fs.unlinkSync(fileFor(newest))
  expect(getCssServeAsset(newest)).toBe('.item{--index:257}')
})

it('scopes disk and memory lookups to the active serving state directory', () => {
  const hash = registerCssServeAsset(css)!
  process.env.STX_DIR = path.join(root, 'other-state')
  expect(getCssServeAsset(hash)).toBeUndefined()
  expect(registerCssServeAsset(css)).toBe(hash)
  clearCssServeAssets()
  expect(getCssServeAsset(hash)).toBe(css)
  process.env.STX_DIR = path.join(root, 'state')
  expect(getCssServeAsset(hash)).toBe(css)
})

it('inlines generated CSS when its durable asset directory is unavailable', async () => {
  fs.mkdirSync(path.join(root, 'state'), { recursive: true })
  fs.writeFileSync(path.join(root, 'state/css-assets'), 'not a directory')
  expect(registerCssServeAsset(css)).toBeUndefined()
  const html = await injectCss('<html><head></head><body class="flex gap-4"></body></html>', root, true)
  expect(html).toContain('<style data-css="generated">')
  expect(html).toContain('.flex')
  expect(html).not.toContain('/_stx/css.')
})

it('keeps non-serve generation inline without creating served assets', async () => {
  const html = await injectCss('<body class="grid"></body>', root)
  expect(html).toContain('<style data-css="generated">')
  expect(html).toContain('.grid')
  expect(fs.existsSync(path.join(root, 'state/css-assets'))).toBe(false)
})

it('does not publish an incomplete asset when the atomic rename fails', () => {
  const rename = spyOn(fs, 'renameSync').mockImplementation(() => { throw new Error('rename failed') })
  try {
    expect(registerCssServeAsset(css)).toBeUndefined()
    expect(fs.readdirSync(path.join(root, 'state/css-assets'))).toEqual([])
  }
  finally { rename.mockRestore() }
  const hash = registerCssServeAsset(css)!
  clearCssServeAssets()
  expect(getCssServeAsset(hash)).toBe(css)
})
