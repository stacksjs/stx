import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

test('an external state directory resolves browser packages from the project', async () => {
  const project = mkdtempSync(path.join(tmpdir(), 'stx-project-packages-'))
  const state = mkdtempSync(path.join(tmpdir(), 'stx-external-state-'))
  const previous = process.env.STX_DIR
  try {
    process.env.STX_DIR = state
    const pkg = path.join(project, 'node_modules', 'fixture-client')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'fixture-client', exports: { '.': { browser: './browser.js', default: './server.js' } } }))
    writeFileSync(path.join(pkg, 'browser.js'), "export const target = 'browser-package-resolved'")
    writeFileSync(path.join(pkg, 'server.js'), "throw new Error('Server entry must not enter a browser bundle')")
    const bundled = await bundleClientScript("import { target } from 'fixture-client'; const answer = target", path.join(project, 'page.stx'), { projectRoot: project, externalizeUserModules: false, throwOnFailure: true })
    expect(bundled).toContain('browser-package-resolved')
    expect(bundled).not.toContain('Server entry must not enter')
  }
  finally {
    if (previous === undefined) delete process.env.STX_DIR
    else process.env.STX_DIR = previous
    rmSync(project, { recursive: true, force: true })
    rmSync(state, { recursive: true, force: true })
  }
})
