import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { detectBuildMode, validateComponentScripts } from '../src/build-mode-detector'

const tempDirs: string[] = []

async function makeTempProject() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-build-mode-'))
  tempDirs.push(dir)

  await fs.promises.mkdir(path.join(dir, 'pages'), { recursive: true })
  await fs.promises.mkdir(path.join(dir, 'components'), { recursive: true })
  await fs.promises.writeFile(path.join(dir, 'stx.config.ts'), 'export default {}\n')

  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => fs.promises.rm(dir, { recursive: true, force: true })))
})

describe('build mode detection', () => {
  it('keeps bare and client scripts in SSG mode', async () => {
    const root = await makeTempProject()
    await fs.promises.writeFile(
      path.join(root, 'pages', 'index.stx'),
      '<script>console.log("client")</script><script client>console.log("also client")</script>',
    )

    const result = await detectBuildMode(root)

    expect(result.mode).toBe('ssg')
    expect(result.serverScriptFiles).toEqual([])
  })

  it('switches to SSR only for explicit server scripts', async () => {
    const root = await makeTempProject()
    await fs.promises.writeFile(
      path.join(root, 'pages', 'index.stx'),
      '<script server>export const products = []</script>',
    )

    const result = await detectBuildMode(root)

    expect(result.mode).toBe('ssr')
    expect(result.serverScriptFiles).toEqual(['pages/index.stx'])
  })

  it('flags components that mix server and client scripts', async () => {
    const root = await makeTempProject()
    await fs.promises.writeFile(
      path.join(root, 'components', 'BadCard.stx'),
      '<script server>export const title = "x"</script><script client>console.log(title)</script>',
    )

    const errors = await validateComponentScripts(root)

    expect(errors).toHaveLength(1)
    expect(errors[0].file).toBe('components/BadCard.stx')
    expect(errors[0].message).toContain('both <script server> and <script client>')
  })
})
