/**
 * Native desktop APIs.
 *
 * stx bundles `@stacksjs/desktop` so an app needs one dependency rather than
 * three. Import windows, system tray, preferences, power management, global
 * shortcuts and the rest of the native surface from here:
 *
 * ```typescript
 * import { caffeinate, createPreferences, createWindow } from '@stacksjs/stx/desktop'
 * ```
 *
 * For a menu bar app, prefer `@stacksjs/stx/menubar`, which composes these into
 * a single declarative call.
 *
 * Server-backed packages embed the GUI provider with
 * `packageApp({ macos: { nativeRuntimePath: resolveCraftExecutablePath() } })`.
 * Craft gives that provider its own agent bundle; the desktop launcher resolves
 * it directly so macOS can identify its windows, permissions and status items.
 */
export * from '@stacksjs/desktop'
