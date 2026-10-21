import { expect, test } from 'bun:test'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { signMacOSBundle } from '../src/native-signing'

test.skipIf(process.platform !== 'darwin')('a provisioning profile requires a real signing identity', async () => {
  await expect(signMacOSBundle('/unused.app', [], { provisioningProfile: '/unused.profile' })).rejects.toThrow('requires a signing identity')
})

test.skipIf(process.platform !== 'darwin')('macOS signing binds the app identity and rejects changed resources', async () => {
  const work = mkdtempSync(join(tmpdir(), 'stx-signing-'))
  try {
    const bundle = join(work, 'Identity Test.app')
    const contents = join(bundle, 'Contents')
    mkdirSync(join(contents, 'MacOS'), { recursive: true })
    copyFileSync('/bin/echo', join(contents, 'MacOS', 'IdentityTest'))
    const plist = join(contents, 'Info.plist')
    writeFileSync(plist, '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>IdentityTest</string><key>CFBundleIdentifier</key><string>org.stx.identity-test</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>')
    const entitlements = join(work, 'entitlements.plist')
    writeFileSync(entitlements, '<?xml version="1.0"?><plist version="1.0"><dict><key>com.apple.developer.usernotifications.communication</key><true/></dict></plist>')
    await signMacOSBundle(bundle, [], { entitlements })
    const signature = Bun.spawnSync(['/usr/bin/codesign', '-dv', bundle]).stderr.toString()
    expect(signature).toContain('Identifier=org.stx.identity-test')
    expect(signature).not.toContain('Info.plist=not bound')
    const capabilities = Bun.spawnSync(['/usr/bin/codesign', '-d', '--entitlements', '-', bundle]).stdout.toString()
    expect(capabilities).toContain('com.apple.developer.usernotifications.communication')
    writeFileSync(plist, (await Bun.file(plist).text()).replace('org.stx.identity-test', 'org.stx.changed'))
    expect(Bun.spawnSync(['/usr/bin/codesign', '--verify', '--strict', bundle]).exitCode).not.toBe(0)
  }
  finally {
    rmSync(work, { recursive: true, force: true })
  }
})
