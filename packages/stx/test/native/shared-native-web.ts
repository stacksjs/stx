/**
 * The web half of the shared-component native tests: the same source served
 * as a page, so a test can show a component's web markup is the one it had.
 */
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

export async function renderWeb(source: string): Promise<string> {
  const root = createTempDir('stx-shared-native-web-')
  const file = join(root, 'Page.stx')
  await Bun.write(file, source)
  return processDirectives(source, {}, file, { ...defaultConfig, root, cache: false, buildMode: undefined } as never, new Set())
}
