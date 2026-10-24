# Menu Bar Apps

A native menu bar app is a small window that hangs off a tray icon: an stx
template for the popup, a few JSON endpoints for the buttons in it, and a tray
menu. `createMenuBarApp` wires those to a Craft window so you write the three
pieces and nothing else.

```bash
bun add @stacksjs/stx
```

## A complete app

```typescript
import { createMenuBarApp } from '@stacksjs/stx/menubar'

const app = createMenuBarApp({
  name: 'Timer',
  template: new URL('./timer.stx', import.meta.url).pathname,

  preferences: {
    durationMinutes: 25,
    launchAtLogin: false,
  },

  context: prefs => ({
    duration: prefs.get('durationMinutes'),
    running: isRunning(),
  }),

  routes: {
    'POST /api/start': (request, prefs) => {
      start(prefs.get('durationMinutes'))
      return { running: true }
    },
    'POST /api/stop': () => {
      stop()
      return { running: false }
    },
  },

  menu: prefs => [
    { label: isRunning() ? 'Stop' : 'Start', action: 'toggle', shortcut: 'Cmd+Shift+T' },
    { type: 'separator' },
    { label: 'Launch at Login', type: 'checkbox', checked: prefs.get('launchAtLogin'), action: 'toggleLaunch' },
    { label: 'Quit', action: 'quit', shortcut: 'Cmd+Q' },
  ],

  launchAtLogin: 'launchAtLogin',
})

await app.start()
```

That is the whole app. There is no server to configure, no port to pick, no
preference file to read or write.

## The pieces

### Template

`template` points at a `.stx` file rendered on every request, so the popup
always opens against current state. Whatever `context` returns is in scope:

```html
<div class="timer">
  <p>{{ running ? 'Running' : 'Idle' }}</p>
  <p>{{ duration }} minutes</p>
</div>
```

### Routes

Routes are keyed by `"<METHOD> <path>"`. A key without a method is a `GET`.
Handlers receive the request and the preference store, and return anything
JSON-serializable — or a `Response` if you want full control:

```typescript
routes: {
  '/api/status': () => ({ running: isRunning() }),
  'POST /api/duration': async (request, prefs) => {
    const { minutes } = await request.json()
    prefs.set('durationMinutes', minutes)
    return prefs.getAll()
  },
}
```

Three endpoints exist without you declaring them, because every menu bar app
needs them. Declare the same route to override any of them.

| Route | Returns |
| --- | --- |
| `GET /api/preferences` | All preference values |
| `POST /api/preferences` | Applies a patch, ignoring unknown keys, and returns the result |
| `GET /api/menu` | The current tray menu |

### Preferences

`preferences` supplies defaults; the store persists to
`~/Library/Application Support/<name>/` and is passed to `context`, `routes`
and `menu`. `POST /api/preferences` only writes keys present in the defaults,
so a stray request cannot add fields of its own.

Name a boolean preference in `launchAtLogin` and the login item tracks it,
including when the user toggles it while the app is running.

### Window

Menu bar defaults — 320×640, tray icon, no Dock icon, hidden titlebar, floating,
dark — are applied first, and `window` overrides any of them:

```typescript
window: { width: 360, height: 520, darkMode: false }
```

## Shipping it

A shipped app is compiled to a single binary, so the `.stx` file is no longer on
disk to read. Embed it at build time and pass it as `templateSource` — the app
then renders identically whether run from source or from a bundle:

```typescript
import templateSource from './timer.stx' with { type: 'text' }

createMenuBarApp({
  name: 'Timer',
  template: new URL('./timer.stx', import.meta.url).pathname,
  templateSource,
  // …
})
```

Package it through the stx desktop API, backed by [Craft](https://github.com/craft-native/craft), which sets
`LSUIElement` so it ships without a Dock icon:

```typescript
import { packageApp, resolveCraftExecutablePath } from '@stacksjs/stx/desktop'

await packageApp({
  name: 'Timer',
  version: '1.0.0',
  binaryPath: './dist/timer',
  bundleId: 'com.example.timer',
  macos: {
    menuBarOnly: true,
    nativeRuntimePath: resolveCraftExecutablePath(),
    signIdentity: 'Developer ID Application: You (TEAMID)',
    category: 'public.app-category.utilities',
  },
})
```

See Craft's [packaging guide](https://github.com/craft-native/craft/blob/main/docs/PACKAGING.md)
for signing, notarization and App Store submission.

### Sandboxed native host

For a sandboxed Store app, make Craft the native application and run the
compiled TypeScript server as its inherited backend. Set `host: 'craft'` in
`createMenuBarApp`. This mode serves the template without launching another
window process. It prints its initial authenticated loopback URL on stdout;
Craft loads that URL and owns the backend's input pipe. Closing that pipe stops
the server and releases its resources.

The initial URL carries a random session token. Loading it establishes an
HttpOnly, SameSite cookie; subsequent API requests require that cookie and
reject foreign origins. Keep the token out of public logs and links.

Package the compiled backend with these macOS options:

```typescript
macos: {
  appStore: true,
  menuBarOnly: true,
  nativeRuntimePath: resolveCraftExecutablePath(),
  nativeWindow: {
    width: 320, height: 640, systemTray: true,
    headless: true, keepRunning: true, hideDockIcon: true,
    titlebarHidden: true, darkMode: true,
    resizable: false, alwaysOnTop: true,
  },
  signIdentity: '3rd Party Mac Developer Application: You (TEAMID)',
  installerIdentity: '3rd Party Mac Developer Installer: You (TEAMID)',
  provisioningProfile: '/absolute/path/to/profile.provisionprofile',
  entitlements: '/absolute/path/to/app-store.entitlements',
}
```

Craft requires the adjacent public-only `craft-app-store` binary from Pantry;
it refuses a missing variant or one built with private APIs. The native host
is the main app executable and the backend inherits its sandbox. Provide the
matching application/team identifiers and sandbox network client/server
entitlements for the loopback connection.

`launchAtLogin` is rejected in Craft-hosted mode because a LaunchAgent does not
belong in a sandboxed Store app. Use `useNativeDesktop().bridge` and its
`autoLaunch.enable()`, `disable()` and `isEnabled()` methods for native login
registration. The `window` option applies when stx launches the application
host; configure the Store host's window through `nativeWindow` when packaging.
Private menu bar visibility and external self-update installers must be
excluded from Store consumers.

## Standalone template builds

When compiling an app to one binary, prepare its embedded templates before
`Bun.build`. Client imports must be bundled while their source files exist;
runtime rendering still supplies current preferences and server data.

```ts
import { menuBarTemplatePlugin } from '@stacksjs/stx/menubar-build'

const templates = await menuBarTemplatePlugin({ templates: ['./src/popup.stx'] })
await Bun.build({
  entrypoints: ['./app.ts'],
  target: 'bun',
  compile: { outfile: './dist/MyApp' },
  plugins: [templates],
})
```

The app imports the template with `with { type: 'text' }` and passes it as
`templateSource` to `createMenuBarApp`. List every embedded `.stx` template.
Client TypeScript and its transitive imports are prepared by stx, including
handlers used only in template expressions. Missing imports stop the build.
Pass server values through rendered data attributes so they remain runtime data
instead of build-time JavaScript. Native access stays behind
`useNativeDesktop()`; optional native menu bar grouping is provided by Craft's
`menubar` API and must be selected explicitly.
