/** Qualify #2119 against a real installed @stacksjs/logging package, not a logger stub.
 * Usage: bun scripts/ssr-reporter-smoke.ts /path/to/@stacksjs/logging [/path/to/@stacksjs/stx]
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defaultConfig } from '../packages/stx/src/config'
import { processDirectives } from '../packages/stx/src/process'

const logging = path.resolve(process.argv[2])
const installed = process.argv[3]
  ? await import(pathToFileURL(path.join(path.resolve(process.argv[3]), 'dist/index.js')).href)
  : null
const render = installed?.processDirectives ?? processDirectives
const { report } = await import(pathToFileURL(path.join(logging, 'dist/runtime.js')).href)
const { registerTransport, log } = await import(pathToFileURL(path.join(logging, 'dist/index.js')).href)
const records: Array<{ level: string }> = []
const detach = registerTransport({ name: 'stx-2119', log: (record: { level: string }) => records.push(record) })
const directory = await mkdtemp(path.join(tmpdir(), 'stx-real-reporter-'))
try {
  const component = `<script client>const report = state(null)</script><p>{{ 'Status: ' + report()?.status }}</p>`
  await Bun.write(path.join(directory, 'ReportProbe.stx'), component)
  const options = { ...(installed?.defaultConfig ?? defaultConfig), componentsDir: directory }
  for (const template of [component, '<ReportProbe />']) {
    const html = await render(template, { report }, path.join(directory, 'page.stx'), options, new Set())
    assert(html.includes("{{ 'Status: ' + report()?.status }}"))
  }
  await log.flush()
  assert.equal(records.filter(record => record.level === 'error').length, 0)
  // An ordinary server expression must still reach the genuine transport.
  await render('<p>{{ report("explicit server probe") }}</p>', { report }, path.join(directory, 'server.stx'), options, new Set())
  await log.flush()
  assert.equal(records.filter(record => record.level === 'error').length, 1)
  console.log('real reporter: 0 client-triggered errors; 1 explicit server error (expected)')
}
finally {
  detach()
  await rm(directory, { recursive: true, force: true })
}
