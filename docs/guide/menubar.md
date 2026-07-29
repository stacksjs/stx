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

Package the app with [Craft](https://github.com/stacksjs/craft), which sets
`LSUIElement` so it ships without a Dock icon:

```typescript
import { packageApp } from 'craft-native'

await packageApp({
  name: 'Timer',
  version: '1.0.0',
  binaryPath: './dist/timer',
  bundleId: 'com.example.timer',
  macos: {
    menuBarOnly: true,
    appStore: true,
    signIdentity: '3rd Party Mac Developer Application: You (TEAMID)',
    installerIdentity: '3rd Party Mac Developer Installer: You (TEAMID)',
    category: 'public.app-category.utilities',
  },
})
```

See Craft's [packaging guide](https://github.com/stacksjs/craft/blob/main/docs/PACKAGING.md)
for signing, notarization and App Store submission.
