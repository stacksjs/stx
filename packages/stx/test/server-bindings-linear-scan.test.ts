import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processServerBindings, reactiveLoopScopes } from '../src/server-bindings'
import { scanHtmlTags } from '../src/html-masking'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function boundedScan(code: string): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'stx-tag-scan-'))
  directories.push(directory)
  const config = join(directory, 'bunfig.toml')
  writeFileSync(config, '')
  const child = Bun.spawn([process.execPath, '--no-env-file', `--config=${config}`, '-e', code], { cwd: directory, env: { PATH: process.env.PATH }, stdout: 'pipe', stderr: 'pipe' })
  const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
  try {
    const [output, error, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    expect(error).toBe('')
    expect(output).toContain('ready')
    expect(exit).toBe(0)
    expect(output).toContain('complete')
  }
  finally { clearTimeout(timer); child.kill() }
}

test.each(['scope', 'bindings'].flatMap(mode => ['whitespace', 'nested', 'quote'].map(vector => [mode, vector])))('%s scanning finishes on the malformed %s suffix', async (mode, vector) => {
  const module = new URL('../src/server-bindings.ts', import.meta.url).href
  const suffix = vector === 'whitespace' ? '<Name ' + ' '.repeat(80000) : vector === 'nested' ? '<Name '.repeat(10000) : '<Name title="' + '<Name '.repeat(10000)
  const expression = mode === 'scope' ? 'reactiveLoopScopes(input)' : "processServerBindings(input,{id:'resolved'})"
  const valid = mode === 'scope' ? 'value.length === 0' : `value.startsWith(${JSON.stringify('<div id="resolved">')})`
  await boundedScan(`import { reactiveLoopScopes, processServerBindings } from ${JSON.stringify(module)}; const input='<div :id="id"></div>'+${JSON.stringify(suffix)}; console.log('ready'); const value=${expression}; if(!(${valid}))throw new Error('Incorrect scan result'); console.log('complete');`)
})

test('quoted greater-than signs and self-closing bindings keep their HTML contract', () => {
  expect(processServerBindings('<input title="a > b" :value="value" />', { value: 'a"b' })).toBe('<input title="a > b" value="a&quot;b" />')
  const input = '<div :for="row in rows"><div><span :for="child in row.children"></span></div></div>'
  const scopes = reactiveLoopScopes(input)
  expect(scopes.map(scope => ({ names: scope.names, text: input.slice(scope.start, scope.end) }))).toEqual([
    { names: ['row'], text: input },
    { names: ['child'], text: '<span :for="child in row.children"></span>' },
  ])
})

test('tag boundaries ignore quoted markup, comments and script/style bodies', () => {
  const html = `<div title='<span :for="fake in values">'>ok</div><!-- <p :for="fake in values"> --><script>const sample='<span :for="fake in values">'</script><style>.x:after{content:'<p :for="fake in values">'}</style><input :value="value" />`
  expect(scanHtmlTags(html).map(tag => [tag.name, tag.closing, tag.selfClosing])).toEqual([
    ['div', false, false], ['div', true, false], ['script', false, false], ['script', true, false],
    ['style', false, false], ['style', true, false], ['input', false, true],
  ])
  expect(reactiveLoopScopes(html)).toEqual([])
  expect(scanHtmlTags(`<div title="unfinished <span :for='fake in values'>`)).toEqual([])
})

test('nested loop boundaries are matched once, including same-name elements', () => {
  const opening = '<div :for="row in rows">'
  const html = opening.repeat(4000) + '</div>'.repeat(4000)
  const scopes = reactiveLoopScopes(html)
  expect(scopes).toHaveLength(4000)
  expect(scopes[0]).toEqual({ start: 0, end: html.length, names: ['row'] })
  expect(scopes.at(-1)).toEqual({ start: opening.length * 3999, end: opening.length * 4000 + 6, names: ['row'] })
})

test('the complete directive pipeline also finishes on the malformed suffix', async () => {
  const module = new URL('../src/process.ts', import.meta.url).href
  const config = new URL('../src/config.ts', import.meta.url).href
  await boundedScan(`import { processDirectives } from ${JSON.stringify(module)}; import { defaultConfig } from ${JSON.stringify(config)}; const suffix='<Name '+ ' '.repeat(80000);console.log('ready');const output=await processDirectives('<div :id="id">OK</div>'+suffix,{id:'resolved'},'/owned-linear-scan.stx',defaultConfig,new Set());if(!output.includes('OK')||!output.includes(suffix))throw new Error('Lost content');console.log('complete');`)
})
