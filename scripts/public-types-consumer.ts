import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
  const receipt: Record<string, unknown> = { phase, consumer, status: 'FAIL', archives: archiveReceipts, checks, publicSubpaths, registryProvider }
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
          if (subpath.includes('*') || !target || typeof target !== 'object' || !('types' in target) || typeof target.types !== 'string') continue
          publicSubpaths.push({ specifier: owner.name + (subpath === '.' ? '' : subpath.slice(1)), types: target.types })
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
    writeFileSync(join(consumer, 'strict-public-types.json'), JSON.stringify({ compilerOptions, files: ['strict-public-types.ts'] }))
    const imports = publicSubpaths.map((entry, index) => `import type * as PublicEntry${index} from ${JSON.stringify(entry.specifier)};`).join('\n')
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
const safeGrammar: false = null as unknown as IsAny<typeof grammar.src>;` },
      { code: 2339, source: 'const phantom = props.notAResolvedProp' },
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
