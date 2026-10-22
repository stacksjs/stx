/**
 * A small web app on disk, for the tests that run its views as native
 * screens: `stx.config.ts` with the directories a Stacks app has (layouts,
 * partials, stores), then the files a test gives.
 */
import type { CompileNativeBundleOptions } from '../../src/native/compiler/bundle'
import type { NativeScreen, NativeScreenOptions } from '../../src/native/testing'
import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const CONFIG = `export default {
  layoutsDir: 'layouts',
  partialsDir: 'partials',
  storesDir: 'stores',
}
`

/** Write `files` (path to source, relative to the app) into a new app. */
export function webApp(files: Record<string, string>): string {
  const root = createTempDir('stx-native-web-view-')
  for (const [file, source] of Object.entries({ 'stx.config.ts': CONFIG, ...files })) {
    const at = path.join(root, file)
    mkdirSync(path.dirname(at), { recursive: true })
    writeFileSync(at, source)
  }
  return root
}

/** Compile the app's views as screens (name to view path) and mount `screen`. */
export async function mountWebView(root: string, screens: Record<string, string>, screen: string, options: NativeScreenOptions = {}, bundle: Partial<CompileNativeBundleOptions> = {}): Promise<NativeScreen> {
  const { code } = await compileNativeBundle({ ...bundle, root, screens })
  const phone = mountNativeScreen(code, screen, options)
  await phone.settle()
  return phone
}
