/**
 * Packaging and code signing.
 *
 * Craft owns the native side of this — building the `.app`, the DMG, the MSI,
 * the Linux packages, and the signed `.pkg` the Mac App Store accepts. This
 * module re-exports it so an app reaches packaging through the same import as
 * the rest of the desktop API, rather than depending on Craft directly.
 *
 * @example
 * ```typescript
 * import { packageApp } from '@stacksjs/stx/desktop'
 *
 * await packageApp({
 *   name: 'Barista',
 *   version: '0.1.0',
 *   binaryPath: './dist/barista',
 *   bundleId: 'org.stacksjs.barista',
 *   macos: { menuBarOnly: true, dmg: true },
 * })
 * ```
 */
import { accessSync, closeSync, constants, openSync, readSync, realpathSync } from 'node:fs'
import { resolveCraftBinary } from 'craft-native'

export { macOSRuntimeExecutablePath, pack, packageApp } from 'craft-native'

export type { PackageConfig, PackageResult } from 'craft-native'

/**
 * Craft's binary resolution contract — PATH (craft installs via pantry), with
 * `CRAFT_BIN` for local builds. Re-exported so a build script bundling the
 * runtime into its app finds the same binary the window layer will spawn.
 */
export { craftBinaryNotFoundMessage, resolveCraftBinary } from 'craft-native'

/**
 * Find the native provider file to embed in an application bundle. A command
 * suitable for spawning may be a Pantry activation launcher, which cannot be
 * relocated outside its installation tree. Pantry owns that resolution; local
 * source builds can supply a native executable through CRAFT_BIN or `explicit`.
 */
export function resolveCraftExecutablePath(explicit?: string): string {
  const command = resolveCraftBinary(explicit)
  let path = command
  if (command === 'craft') {
    const result = Bun.spawnSync(['pantry', 'which', 'craft', '--resolve'])
    if (result.exitCode !== 0) {
      const detail = `${result.stderr}${result.stdout}`.trim()
      throw new Error(`Cannot locate Craft's native executable. Install Craft through Pantry and use Pantry 0.11.114 or newer.${detail ? ` ${detail}` : ''}`)
    }
    path = result.stdout.toString().trim()
  }

  const executable = realpathSync(path)
  accessSync(executable, constants.X_OK)
  const descriptor = openSync(executable, 'r')
  const header = Buffer.alloc(4)
  try {
    readSync(descriptor, header, 0, header.length, 0)
  }
  finally {
    closeSync(descriptor)
  }
  const magic = header.readUInt32BE(0)
  const native = process.platform === 'darwin'
    ? [0xFEEDFACE, 0xCEFAEDFE, 0xFEEDFACF, 0xCFFAEDFE, 0xCAFEBABE, 0xBEBAFECA, 0xCAFEBABF, 0xBFBAFECA].includes(magic)
    : process.platform === 'win32' ? header[0] === 0x4D && header[1] === 0x5A : magic === 0x7F454C46
  if (!native)
    throw new Error(`Craft packaging requires a native executable, received: ${executable}`)
  return executable
}
