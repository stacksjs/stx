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
export { pack, packageApp } from 'craft-native'

export type { PackageConfig, PackageResult } from 'craft-native'
