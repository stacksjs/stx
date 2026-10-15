import { statSync } from 'node:fs'
import path from 'node:path'
import { compileNativeBundle, type CompileNativeBundleOptions, type NativeBundleResult } from './bundle'

export interface CompileBrowserScreenOptions extends Omit<CompileNativeBundleOptions, 'screens' | 'routed' | 'browser'> {
  screen: string
  source: string
  browser: NonNullable<CompileNativeBundleOptions['browser']>
}

interface CachedScreen { result: NativeBundleResult, inputs: Map<string, string> }
const cache = new Map<string, CachedScreen>()
const building = new Map<string, Promise<NativeBundleResult>>()
const fingerprint = (file: string): string => {
  try { const stat = statSync(file, { bigint: true }); return `${stat.mtimeNs}:${stat.size}` }
  catch { return 'missing' }
}

/** Compile a shared stx screen using the browser peer of the native renderers. */
export async function compileBrowserScreen(options: CompileBrowserScreenOptions): Promise<NativeBundleResult> {
  const root = path.resolve(options.root ?? process.cwd())
  const key = JSON.stringify({ ...options, root })
  const hit = cache.get(key)
  if (hit && [...hit.inputs].every(([file, value]) => fingerprint(file) === value)) return hit.result
  const pending = building.get(key)
  if (pending) return pending
  const task = compileNativeBundle({ ...options, root, screens: { [options.screen]: options.source }, initialScreen: options.screen }).then((result) => {
    cache.set(key, { result, inputs: new Map(result.dependencies.map(file => [file, fingerprint(file)])) })
    return result
  }).finally(() => building.delete(key))
  building.set(key, task)
  return task
}

/** Framework-owned embedding; applications supply source and platform configuration only. */
export async function renderBrowserScreen(options: CompileBrowserScreenOptions): Promise<string> {
  const { code } = await compileBrowserScreen(options)
  if (!/^#[A-Z\d_-]+$/i.test(options.browser.container)) throw new Error('The browser screen container must be an element id')
  const id = options.browser.container.slice(1)
  return `<div id="${id}" data-shared-screen="${options.screen.replace(/[^a-z\d_-]/gi, '')}" role="main"><p role="status">Loading…</p></div><script data-stx-scoped data-stx-run="always" data-raw>${code.replace(/<\/script/gi, '<\\/script')}</script>`
}
