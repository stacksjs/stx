import { expect, test } from 'bun:test'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { signMacOSBundle } from '../src/native-signing'

test.skipIf(process.platform !== 'darwin')('compiled native backends inherit the sandbox and retain JIT without parent identity permissions', async () => {
  const work = mkdtempSync(join(tmpdir(), 'stx-backend-signing-'))
  try {
    const app = join(work, 'Backend.app')
    const macos = join(app, 'Contents/MacOS')
    mkdirSync(macos, { recursive: true })
    copyFileSync('/bin/echo', join(macos, 'Backend'))
    const backend = join(macos, 'stx-backend')
    copyFileSync('/bin/echo', backend)
    writeFileSync(join(app, 'Contents/Info.plist'), '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Backend</string><key>CFBundleIdentifier</key><string>org.stx.backend-test</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>')
    const entitlements = join(work, 'parent.plist')
    writeFileSync(entitlements, '<?xml version="1.0"?><plist version="1.0"><dict><key>com.apple.security.app-sandbox</key><true/><key>com.apple.security.network.server</key><true/></dict></plist>')
    await signMacOSBundle(app, [backend], { entitlements, hardenedRuntime: true })
    const signed = Bun.spawnSync(['/usr/bin/codesign', '-d', '--entitlements', ':-', backend])
    const parsed = Bun.spawnSync(['/usr/bin/plutil', '-convert', 'json', '-o', '-', '-'], { stdin: signed.stdout })
    expect(parsed.exitCode).toBe(0)
    expect(JSON.parse(parsed.stdout.toString())).toEqual({
      'com.apple.security.cs.allow-jit': true,
      'com.apple.security.app-sandbox': true,
      'com.apple.security.inherit': true,
    })
    expect(Bun.spawnSync(['/usr/bin/codesign', '--verify', '--deep', '--strict', app]).exitCode).toBe(0)
  }
  finally { rmSync(work, { recursive: true, force: true }) }
})
