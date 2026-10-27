import { expect, test } from 'bun:test'
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { embedMacOSProvisioningProfile, parseMacOSProfileEntitlements, signMacOSBundle } from '../src/native-signing'

test.skipIf(process.platform === 'win32')('a private signing profile becomes a readable bundle resource without changing the input', () => {
  const work = mkdtempSync(join(tmpdir(), 'stx-profile-permissions-'))
  try {
    const profile = join(work, 'private.provisionprofile')
    const bundle = join(work, 'Store App.app')
    mkdirSync(join(bundle, 'Contents'), { recursive: true })
    writeFileSync(profile, Buffer.from([0x30, 0x82, 0x00, 0x04, 1, 2, 3, 4]))
    chmodSync(profile, 0o600)
    embedMacOSProvisioningProfile(profile, bundle)
    const embedded = join(bundle, 'Contents', 'embedded.provisionprofile')
    expect(readFileSync(embedded)).toEqual(readFileSync(profile))
    expect(statSync(embedded).mode & 0o777).toBe(0o644)
    expect(statSync(profile).mode & 0o777).toBe(0o600)
    // Rebuilds must repair an existing private copy as well.
    chmodSync(embedded, 0o600)
    embedMacOSProvisioningProfile(profile, bundle)
    expect(statSync(embedded).mode & 0o777).toBe(0o644)
  }
  finally {
    rmSync(work, { recursive: true, force: true })
  }
})

test.skipIf(process.platform !== 'darwin')('profile parsing isolates entitlements from certificate data and dates', () => {
  const profile = Buffer.from(`<?xml version="1.0"?><plist version="1.0"><dict>
    <key>CreationDate</key><date>2026-10-21T00:00:00Z</date>
    <key>DeveloperCertificates</key><array><data>AQIDBA==</data></array>
    <key>Entitlements</key><dict>
      <key>com.apple.application-identifier</key><string>TESTTEAM.org.stx.test</string>
      <key>com.apple.developer.usernotifications.communication</key><true/>
      <key>keychain-access-groups</key><array><string>TESTTEAM.*</string></array>
    </dict>
  </dict></plist>`)
  expect(parseMacOSProfileEntitlements(profile)).toEqual({
    'com.apple.application-identifier': 'TESTTEAM.org.stx.test',
    'com.apple.developer.usernotifications.communication': true,
    'keychain-access-groups': ['TESTTEAM.*'],
  })
})

test.skipIf(process.platform !== 'darwin')('profile parsing rejects missing and non-dictionary entitlements', () => {
  expect(() => parseMacOSProfileEntitlements(Buffer.from('<plist version="1.0"><dict/></plist>'))).toThrow('Could not extract')
  expect(() => parseMacOSProfileEntitlements(Buffer.from('<plist version="1.0"><dict><key>Entitlements</key><array/></dict></plist>'))).toThrow('must be a dictionary')
})

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
