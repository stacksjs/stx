/**
 * @stacksjs/desktop/browser — the half of this package that runs *inside* a
 * Craft window.
 *
 * The default entry point is a single bundle that also carries the host-side
 * pieces: `window.ts` spawns the Craft process, `packaging.ts` assembles
 * installers, `preferences.ts` and `autolaunch.ts` write files with `node:fs`.
 * Those belong to the build/launch side of an app and pull in `node:child_process`
 * and friends, so bundling the barrel for a webview fails outright:
 *
 *     Browser build cannot import Node.js builtin: "child_process"
 *
 * That left no way to use the bridge wrappers from the UI they were written
 * for. This entry exports only the modules that talk to `window.craft`, so a
 * Craft app can bundle it with `target: 'browser'`.
 *
 * Host-side code keeps importing `@stacksjs/desktop` and is unaffected.
 */

export * from './alerts'
export * from './app-info'
export * from './apple-script'
export * from './audio'
export * from './battery'
export * from './biometric'
export * from './bluetooth'
export * from './bonjour'
export * from './capabilities'
export * from './clipboard'
export * from './continuity-camera'
export * from './coreml'
export * from './crash-reporter'
export * from './deep-link'
export * from './dialogs'
export * from './drag-out'
export * from './file-associations'
export * from './focus'
export * from './fs'
export * from './global-shortcuts'
export * from './handoff'
export * from './hotkeys'
export * from './iap'
export * from './keychain'
export * from './live-activities'
export * from './local-server'
export * from './location'
export * from './log'
export * from './menu'
export * from './midi'
export * from './modals'
export * from './native-autolaunch'
export * from './network'
export * from './notifications'
export * from './pdf'
export * from './permissions'
export * from './power'
export * from './printing'
export * from './screen'
export * from './screen-capture'
export * from './screen-sharing'
export * from './self-update'
export * from './serial'
export * from './service-menu'
export * from './shell'
export * from './speech'
export * from './speech-recognition'
export * from './spotlight'
export * from './tags'
export * from './theme'
export * from './timer'
export * from './touchbar'
export * from './updater'
export * from './vision'
export * from './window-events'
