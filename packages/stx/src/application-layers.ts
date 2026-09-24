import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { StxOptions } from './types'

export interface ApplicationLayer {
  root: string
  configFile: string
  resources: Record<'pages' | 'components' | 'layouts' | 'partials' | 'composables', string>
}
export interface ApplicationLayerGraph {
  /** Highest precedence first: app, first layer and its ancestors, next layer. */
  layers: ApplicationLayer[]
  configDependencies: string[]
  /** Intentional resource overrides, suitable for diagnostics. */
  overrides?: Array<{ resource: string, winner: string, shadowed: string }>
}

const resourceKeys = ['pages', 'components', 'layouts', 'partials', 'composables'] as const
const configSources = new Set<string>()
export function isLayerConfigSource(file: string): boolean {
  try { return configSources.has(fs.realpathSync(file)) }
  catch { return configSources.has(path.resolve(file)) }
}
const localKeys = new Set(['extends', 'root', ...resourceKeys.map(key => `${key}Dir`), 'publicDir', 'stateDir', 'cachePath'])
const plain = (value: any): boolean => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

/** Objects merge recursively; arrays replace except ordered middleware/plugins. */
export function mergeLayerConfig(base: any, override: any, key = ''): any {
  if (Array.isArray(override))
    return ['middleware', 'plugins'].includes(key) ? [...(Array.isArray(base) ? base : []), ...override] : [...override]
  if (!plain(override)) return override
  const out: Record<string, any> = { ...(plain(base) ? base : {}) }
  for (const [name, value] of Object.entries(override)) {
    if (['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error(`Invalid layer config key: ${name}`)
    out[name] = mergeLayerConfig(out[name], value, name)
  }
  return out
}

function findConfig(root: string): string {
  for (const name of ['stx.config.ts', 'stx.config.js', 'stx.config.mjs', '.config/stx.config.ts', '.config/stx.ts', 'ui.config.ts']) {
    const file = path.join(root, name)
    if (fs.existsSync(file)) return fs.realpathSync(file)
  }
  throw new Error(`Application layer has no stx.config.ts: ${root}`)
}

function resolveLayer(specifier: string, parent: string, dependencies: Set<string>): string {
  if (typeof specifier !== 'string' || !specifier || /^(?:https?:|git[+:])/.test(specifier))
    throw new Error(`Invalid application layer ${JSON.stringify(specifier)} in ${parent}; use a local path or installed package`)
  if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
    const resolved = path.resolve(parent, specifier)
    return fs.statSync(resolved).isDirectory() ? findConfig(resolved) : fs.realpathSync(resolved)
  }
  // Walk node_modules rather than resolving the package entry: a layer need
  // not expose executable JS, and package exports may hide package.json.
  let directory = parent
  while (true) {
    const candidate = path.join(directory, 'node_modules', specifier)
    const pkg = path.join(candidate, 'package.json')
    if (fs.existsSync(pkg)) {
      dependencies.add(fs.realpathSync(pkg))
      const metadata = JSON.parse(fs.readFileSync(pkg, 'utf8'))
      return metadata.stx?.layer ? fs.realpathSync(path.resolve(candidate, metadata.stx.layer)) : findConfig(candidate)
    }
    const next = path.dirname(directory)
    if (next === directory) break
    directory = next
  }
  throw new Error(`Cannot resolve application layer ${JSON.stringify(specifier)} from ${parent}`)
}

async function readConfig(file: string, dependencies: Set<string>): Promise<StxOptions & { extends?: string[] }> {
  const build = await Bun.build({
    entrypoints: [file], target: 'bun', format: 'esm', splitting: false,
    plugins: [{ name: 'stx-layer-config', setup(builder) {
      builder.onResolve({ filter: /^[^./]/ }, (args) => {
        if (args.path.startsWith('node:')) return { path: args.path, external: true }
        return { path: Bun.resolveSync(args.path, args.resolveDir), external: true }
      })
      builder.onLoad({ filter: /./ }, (args) => {
        const file = fs.realpathSync(args.path)
        dependencies.add(file)
        configSources.add(file)
        return undefined
      })
    } }],
  })
  if (!build.success) throw new Error(`Cannot load layer ${file}: ${build.logs.join('\n')}`)
  const output = build.outputs.find(item => item.kind === 'entry-point')
  if (!output || build.outputs.length !== 1) throw new Error(`Unsupported layer config output: ${file}`)
  const loaded = (await import(`data:text/javascript;base64,${Buffer.from(await output.text()).toString('base64')}`)).default
  if (!plain(loaded)) throw new Error(`Layer ${file} must default-export a config object`)
  return loaded
}

export async function resolveApplicationLayers(appRoot: string, defaults: StxOptions): Promise<{ config: StxOptions, graph: ApplicationLayerGraph }> {
  const dependencies = new Set<string>()
  const layers: ApplicationLayer[] = []
  const configs: StxOptions[] = []
  const seen = new Set<string>()
  const active: string[] = []
  async function visit(file: string, root?: string): Promise<void> {
    file = fs.realpathSync(file)
    if (active.includes(file)) throw new Error(`Application layer cycle: ${[...active, file].join(' -> ')}`)
    if (seen.has(file)) return
    seen.add(file)
    active.push(file)
    const declared = await readConfig(file, dependencies)
    // .config/ is a config-file location, not the resource root.
    root ??= path.basename(path.dirname(file)) === '.config' ? path.dirname(path.dirname(file)) : path.dirname(file)
    root = fs.realpathSync(root)
    const base = path.resolve(root, declared.root ?? '.')
    const resources = Object.fromEntries(resourceKeys.map(name => [name, path.resolve(base, (declared as any)[`${name}Dir`] ?? (name === 'composables' ? 'functions' : name))])) as ApplicationLayer['resources']
    layers.push({ root, configFile: file, resources })
    const config = { ...declared }
    if (config.plugins) config.plugins = config.plugins.map((entry) => {
      const spec = typeof entry === 'string' ? entry : entry[0]
      const resolved = spec.startsWith('.') ? path.resolve(root!, spec) : path.isAbsolute(spec) ? spec : Bun.resolveSync(spec, root!)
      dependencies.add(fs.realpathSync(resolved))
      return typeof entry === 'string' ? resolved : [resolved, entry[1]]
    })
    if (typeof config.css === 'string') config.css = path.resolve(root, config.css)
    if (config.serverApi) config.serverApi = { ...(typeof config.serverApi === 'object' ? config.serverApi : {}), dir: path.resolve(root, typeof config.serverApi === 'object' ? config.serverApi.dir ?? 'server/api' : 'server/api') }
    configs.push(config)
    if (declared.extends !== undefined && !Array.isArray(declared.extends)) throw new Error(`extends in ${file} must be an array`)
    for (const spec of declared.extends ?? []) await visit(resolveLayer(spec, root, dependencies))
    active.pop()
  }
  await visit(findConfig(appRoot), appRoot)
  for (const name of ['package.json', 'bun.lock', 'package-lock.json', 'pnpm-lock.yaml']) {
    const file = path.join(appRoot, name)
    if (fs.existsSync(file)) dependencies.add(fs.realpathSync(file))
  }
  let config: any = mergeLayerConfig({}, defaults)
  for (let i = configs.length - 1; i >= 0; i--) {
    const values = i === 0 ? configs[i] : Object.fromEntries(Object.entries(configs[i]).filter(([key]) => !localKeys.has(key)))
    config = mergeLayerConfig(config, values)
  }
  const graph = { layers, configDependencies: [...dependencies].sort() }
  config._layerGraph = graph
  config._layerPageDirs = layers.map(layer => layer.resources.pages)
  config._layerComponentDirs = layers.map(layer => layer.resources.components)
  config._layerLayoutDirs = layers.map(layer => layer.resources.layouts)
  config._layerPartialDirs = layers.map(layer => layer.resources.partials)
  config._layerComposableDirs = layers.map(layer => layer.resources.composables)
  await refreshLayerDiagnostics(graph, appRoot)
  return { config, graph }
}

export async function refreshLayerDiagnostics(graph: ApplicationLayerGraph, appRoot: string): Promise<void> {
  const selected = new Map<string, string>()
  const overrides: NonNullable<ApplicationLayerGraph['overrides']> = []
  for (const layer of graph.layers) {
    for (const [kind, dir] of Object.entries(layer.resources)) {
      if (!fs.existsSync(dir)) continue
      const glob = new Bun.Glob(kind === 'composables' ? '**/*.ts' : '**/*.stx')
      for (const relative of [...glob.scanSync({ cwd: dir })].sort()) {
        const resource = `${kind}/${relative}`
        const file = path.join(dir, relative)
        const winner = selected.get(resource)
        if (winner) overrides.push({ resource, winner, shadowed: file })
        else selected.set(resource, file)
      }
    }
  }
  Object.assign(graph, { overrides })
  await Bun.write(path.join(appRoot, '.stx/layers.json'), JSON.stringify(graph, null, 2))
}

export function layerDependencies(graph: ApplicationLayerGraph): string[] {
  const files = new Set(graph.configDependencies)
  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return
    files.add(dir)
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) files.add(file)
    }
  }
  for (const layer of graph.layers) for (const dir of Object.values(layer.resources)) walk(dir)
  return [...files].sort()
}

export function layerSignature(graph: ApplicationLayerGraph): string {
  return fileSignature(layerDependencies(graph))
}

export function layerConfigSignature(graph: ApplicationLayerGraph): string {
  return fileSignature(graph.configDependencies)
}

function fileSignature(files: string[]): string {
  return files.map((file) => {
    try { const stat = fs.statSync(file); return `${file}:${stat.mtimeMs}:${stat.size}` }
    catch { return `${file}:missing` }
  }).join('\n')
}

/** Portable build provenance; no absolute paths or config values. */
export function layerManifest(graph: ApplicationLayerGraph): unknown {
  return graph.layers.map((layer) => ({
    config: path.relative(layer.root, layer.configFile),
    files: layerDependencies({ layers: [layer], configDependencies: graph.configDependencies.filter(file => file.startsWith(`${layer.root}${path.sep}`)) })
      .filter(file => fs.statSync(file).isFile()).map(file => ({ path: path.relative(layer.root, file).replaceAll(path.sep, '/'), sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') })),
  }))
}
