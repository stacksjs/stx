import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readApplicationMetadata } from '../src/application-metadata'

test.skipIf(process.platform !== 'darwin')('application metadata uses the localized display name instead of the bundle folder', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stx-app-metadata-'))
  const path = join(directory, 'Things3.app')
  try {
    await mkdir(join(path, 'Contents/Resources/en.lproj'), { recursive: true })
    await writeFile(join(path, 'Contents/Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Things3</string>
<key>CFBundleDisplayName</key><string>Things3</string>
<key>CFBundleIdentifier</key><string>com.example.things</string>
<key>CFBundleDevelopmentRegion</key><string>en</string>
<key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>`)
    await writeFile(join(path, 'Contents/Resources/en.lproj/InfoPlist.strings'), '"CFBundleDisplayName" = "Things"; "CFBundleName" = "Things";')
    expect(readApplicationMetadata(path)).toEqual({ displayName: 'Things', bundleName: 'Things', bundleId: 'com.example.things' })
    expect(readApplicationMetadata(path)?.displayName).toBe('Things')
    const consumer = join(directory, 'consumer.ts')
    await writeFile(consumer, `import { readApplicationMetadata } from ${JSON.stringify(new URL('../src/application-metadata.ts', import.meta.url).pathname)}\nprocess.stdout.write(JSON.stringify(readApplicationMetadata(${JSON.stringify(path)})))`)
    const executable = join(directory, 'metadata-reader')
    const build = Bun.spawnSync([process.execPath, 'build', consumer, '--compile', '--outfile', executable], { stdout: 'pipe', stderr: 'pipe' })
    expect(build.exitCode, build.stderr.toString()).toBe(0)
    const result = Bun.spawnSync([executable], { stdout: 'pipe', stderr: 'pipe' })
    expect(result.exitCode, result.stderr.toString()).toBe(0)
    expect(JSON.parse(result.stdout.toString()).displayName).toBe('Things')
  }
  finally { await rm(directory, { recursive: true, force: true }) }
})

test.skipIf(process.platform !== 'darwin')('bundle-name fallback supports Unicode, and missing metadata stays unavailable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stx-app-name-'))
  try {
    const path = join(directory, 'Editor2.app')
    await mkdir(join(path, 'Contents'), { recursive: true })
    await writeFile(join(path, 'Contents/Info.plist'), '<plist version="1.0"><dict><key>CFBundleName</key><string>Éditeur 日本語</string></dict></plist>')
    expect(readApplicationMetadata(path)?.displayName).toBe('Éditeur 日本語')
    expect(readApplicationMetadata(join(directory, 'Missing.app'))).toBeNull()
    const empty = join(directory, 'Empty.app')
    await mkdir(empty)
    expect(readApplicationMetadata(empty)).toBeNull()
  }
  finally { await rm(directory, { recursive: true, force: true }) }
})

test('application metadata rejects invalid paths before accessing native APIs', () => {
  for (const path of ['relative.app', '/Applications/Editor.txt', '/Applications/Bad\0.app']) expect(() => readApplicationMetadata(path)).toThrow('absolute .app path')
})
