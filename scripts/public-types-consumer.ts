import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface PublicTypeArchive {
  name: string
  archive: string
}

/** Verify the unchanged installed cohort without checkout aliases or SDK stubs. */
export async function verifyPublicTypes(consumer: string, archives: PublicTypeArchive[], phase: string, registryProvider?: Record<string, unknown>): Promise<void> {
  const evidence = process.env.STX_TYPE_SDK_EVIDENCE
  if (evidence) mkdirSync(evidence, { recursive: true })
  const archiveReceipts: Array<{ name: string; archive: string; sha256: string; files: number }> = []
  const checks: Array<{ args: string[]; code: number; log: string; diagnostics: number[] }> = []
  const publicSubpaths: Array<{ specifier: string; types: string }> = []
  const explicitModuleImports: string[] = []
  const receipt: Record<string, unknown> = { phase, consumer, runtime: { version: Bun.version, executable: process.execPath, platform: process.platform, arch: process.arch }, status: 'FAIL', archives: archiveReceipts, checks, publicSubpaths, explicitModuleImports, registryProvider }
  const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
  try {
    receipt.lockSHA256 = hash(readFileSync(join(consumer, 'bun.lock')))
    for (const owner of archives) {
      const bytes = readFileSync(owner.archive)
      const files = await new Bun.Archive(bytes).files()
      const manifest = await files.get('package/package.json')!.json()
      assert.equal(manifest.name, owner.name)
      if (owner.name === '@stacksjs/stx') {
        for (const [subpath, target] of Object.entries(manifest.exports as Record<string, unknown>)) {
          if (!target || typeof target !== 'object' || !('types' in target) || typeof target.types !== 'string') continue
          if (subpath.includes('*')) {
            const [before, after] = target.types.replace(/^\.\//, 'package/').split('*')
            assert(before && after && !after.includes('*'), `Unsupported wildcard type target: ${target.types}`)
            for (const member of files.keys()) {
              if (!member.startsWith(before) || !member.endsWith(after)) continue
              const matched = member.slice(before.length, -after.length)
              const specifier = owner.name + subpath.slice(1).replace('*', matched)
              if (!publicSubpaths.some(entry => entry.specifier === specifier))
                publicSubpaths.push({ specifier, types: target.types.replace('*', matched) })
            }
          }
          else {
            const specifier = owner.name + (subpath === '.' ? '' : subpath.slice(1))
            publicSubpaths.push({ specifier, types: target.types })
            explicitModuleImports.push(specifier)
          }
        }
      }
      for (const [name, file] of files) {
        assert(name.startsWith('package/') && !name.split('/').includes('..'), `Unsafe archive member: ${name}`)
        const installed = join(consumer, 'node_modules', owner.name, name.slice('package/'.length))
        assert.equal(hash(readFileSync(installed)), hash(new Uint8Array(await file.arrayBuffer())), `Changed installed payload: ${owner.name}/${name}`)
      }
      const retainedArchive = evidence ? join(evidence, 'archives', `${owner.name.replaceAll('/', '__')}.tgz`) : owner.archive
      if (evidence) {
        mkdirSync(join(evidence, 'archives'), { recursive: true })
        copyFileSync(owner.archive, retainedArchive)
      }
      archiveReceipts.push({ name: owner.name, archive: retainedArchive, sha256: hash(bytes), files: files.size })
    }
    const toolVersions: Record<string, string> = {}
    for (const [name, expected] of Object.entries({ typescript: '7.0.2', '@types/bun': '1.4.4' })) {
      const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8'))
      assert.equal(manifest.version, expected, `Unqualified compiler/platform declarations: ${name}`)
      toolVersions[name] = manifest.version
    }
    receipt.toolVersions = toolVersions
    const compilerOptions = { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: false, paths: {}, types: ['bun'], noEmit: true }
    receipt.compilerOptions = compilerOptions
    const publicDeclarations = [...new Set(publicSubpaths.map(entry => join(realpathSync(join(consumer, 'node_modules/@stacksjs/stx')), entry.types)))]
    writeFileSync(join(consumer, 'strict-public-types.json'), JSON.stringify({ compilerOptions, files: ['strict-public-types.ts', ...publicDeclarations] }))
    // Check every wildcard declaration as a compiler input, including ambient
    // scripts that intentionally have no module namespace. Literal module
    // entrypoints also exercise the installed package's export resolution.
    const imports = explicitModuleImports.map((specifier, index) => `import type * as PublicEntry${index} from ${JSON.stringify(specifier)};`).join('\n')
    const prefix = `${imports}\nimport * as stx from '@stacksjs/stx';
import type { ResolvedProps, RenderContext } from '@stacksjs/stx/component-registry';
import { StxToastBuiltin } from '@stacksjs/stx/builtins/toast';
import type { SpeechRecognitionOptions } from '@stacksjs/stx/composables/use-speech';
type IsAny<T> = 0 extends (1 & T) ? true : false;
declare const context: RenderContext;
declare const options: stx.StxOptions;
declare const grammars: NonNullable<SpeechRecognitionOptions['grammars']>;
const props: ResolvedProps = { static: { title: 'Notice' }, staticNames: {}, serverDynamic: {}, clientReactive: {}, events: {} };`
    const controls = [
      { source: `const html = StxToastBuiltin.render(props, '', context);
const text: string = html;
const rendered: Promise<string> = stx.processDirectives('', {}, 'fixture.stx', options, new Set<string>());
const safeHTML: false = null as unknown as IsAny<typeof html>;
const safeProp: false = null as unknown as IsAny<ResolvedProps['static'][string]>;
const grammar = grammars.item(0);
const src: string = grammar.src;
const weight: number = grammar.weight;
const safeGrammar: false = null as unknown as IsAny<typeof grammar.src>;
const debounceAlias: typeof useDebounce = globalThis.useDebounceFn;
const refAlias: typeof useDebouncedValue = globalThis.refDebounced;
const throttleAlias: typeof useThrottle = globalThis.useThrottleFn;
const timeoutAlias: typeof useTimeout = globalThis.useTimeoutFn;
const broadcastAlias: typeof stx.useBroadcastStream = globalThis.useBroadcastStream;
const safeAlias: false = null as unknown as IsAny<typeof globalThis.useBroadcastStream>;` },
      { code: 2339, source: 'const phantom = props.notAResolvedProp' },
      { code: 2345, source: "globalThis.useDebounceFn(() => {}, 'wrong')" },
      { code: 2322, source: 'globalThis.useBroadcastStream({ endpoint: 42, request: fetch, onMessage() {} })' },
      { code: 2345, source: 'grammars.addFromString(42)' },
      { code: 2339, source: 'const missingGrammarMember = grammars.item(0).notAGrammarProperty' },
      { code: 2322, source: 'props.static.title = 42' },
      { code: 2345, source: "stx.processDirectives(42, {}, 'fixture.stx', options, new Set<string>())" },
    ]
    for (const [index, control] of controls.entries()) {
      writeFileSync(join(consumer, 'strict-public-types.ts'), `${prefix}\n${control.source}\n`)
      const args = [process.execPath, '--no-env-file', join(consumer, 'node_modules/typescript/lib/tsc.js'), '--project', 'strict-public-types.json']
      const child = Bun.spawn(args, { cwd: consumer, stdout: 'pipe', stderr: 'pipe', timeout: 120_000 })
      const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
      const output = stdout + stderr
      const log = `${phase}-${index}.log`
      if (evidence) writeFileSync(join(evidence, log), output)
      checks.push({ args, code, log, diagnostics: [...output.matchAll(/error TS(\d+)/g)].map(match => Number(match[1])) })
      assert.equal(code === 0, index === 0, output)
      if ('code' in control) {
        assert.deepEqual(output.match(/error TS\d+/g), [`error TS${control.code}`], output)
        assert(output.includes('strict-public-types.ts('), output)
      }
    }
    receipt.status = 'PASS'
  }
  finally {
    if (evidence) writeFileSync(resolve(evidence, `${phase}-receipt.json`), JSON.stringify(receipt, null, 2))
  }
}
