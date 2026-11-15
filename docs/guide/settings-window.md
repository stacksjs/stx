# Settings window

> The reference for `@stacksjs/components`' Settings family. The same text ships beside the source as `packages/components/src/ui/settings/README.md`.

A Mac-native Settings window, built once: the two-column shell System Settings
has, its sidebar and search, panes with back and forward, the rounded groups of
rows, and controls drawn the way AppKit draws them. Measured against System
Settings on macOS 26 and later, in light, dark and an inactive window.

The same tags and props draw it twice: in a web view, from this package's
stylesheets, and on a native host (Craft's AppKit host), from the host's own
views. See [On a native host](#on-a-native-host).

```html
<script client>
const pane = state('general')
const openAtLogin = state(true)
const size = state('medium')
</script>

<SettingsWindow title="Settings" storageKey="my-app" v-model:pane="pane">
  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" icon="i-f7-gear-alt-fill" symbol="gearshape.fill" tone="grey" />
      <SettingsSidebarItem id="appearance" label="Appearance" icon="i-f7-circle-lefthalf-fill" symbol="circle.lefthalf.filled" tone="ink" />
    </SettingsSidebarGroup>
  </template>

  <SettingsPane id="general" title="General" active>
    <SettingsGroup header="Startup" footer="Starts in the background when you sign in.">
      <SettingsRow label="Open at login" setting="open-at-login" keywords="launch start">
        <Switch variant="mac" v-model:checked="openAtLogin" />
      </SettingsRow>
      <SettingsRow label="Sidebar icon size" setting="icon-size">
        <Select variant="mac" v-model:value="size" placeholder="" :options="['small', 'medium', 'large']" />
      </SettingsRow>
      <SettingsRow label="About" to="about" />
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="about" title="About" parent="general">
    <SettingsGroup>
      <SettingsRow label="Version"><span>2.4</span></SettingsRow>
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="appearance" title="Appearance">
    <SettingsGroup>
      <SettingsRow label="Appearance" multiline>
        <AppearancePicker value="auto" />
      </SettingsRow>
    </SettingsGroup>
  </SettingsPane>
</SettingsWindow>
```

Open it as its own window on Cmd+, (in a Craft app, `craft.window.open({ name:
'settings', ... })` on a titlebar-less window), or put it inside another window
with `presentation="sheet"`.

## The pieces

| Tag | What it is |
|---|---|
| `<SettingsWindow>` | The shell: sidebar with search, toolbar with back and forward, the scrolling pane. |
| `<SettingsSidebarGroup>`, `<SettingsSidebarItem>` | The sidebar's rows, in groups. An item's `id` is the pane it opens. |
| `<SettingsPane>` | One screen. With `parent`, a sub-pane reached from a navigation row. |
| `<SettingsPaneHeader>` | The card at the top of a pane: icon, title, a sentence. |
| `<SettingsGroup>` | The rounded card of rows, with an optional heading above and footnote below. |
| `<SettingsRow>` | A label, an optional description, and the control at the trailing edge. |
| `<SettingsUpdateRow>` | The row an app that updates itself needs: its version, where the update stands, and the button for it. |

Controls, each the library's own component in its Mac look:

| Control | Tag |
|---|---|
| Switch | `<Switch variant="mac">` (`size="mini"` for the small one) |
| Pop-up button | `<Select variant="mac">` |
| Segmented control | `<SegmentedControl variant="mac">` |
| Checkbox, radio buttons | `<Checkbox variant="mac">`, `<RadioGroup variant="mac">` |
| Push button | `<Button appearance="mac">`, with `variant="primary"` or `variant="danger"` |
| Text and secure field, stepper | `<TextInput variant="mac">`, `<PasswordInput variant="mac">`, `<NumberInput variant="mac">` |
| Slider | `<Slider>` |
| Colour swatches | `<ColorSwatches>` |
| Appearance picker | `<AppearancePicker>` |

`Button` takes `appearance`, not `variant`, because its `variant` already says
what the button is for.

## How it works

| File | What it is |
|---|---|
| `core.ts` | What the window decides: which pane, the history trail, what a search finds and in what order, where an arrow key lands. No DOM. |
| `view.ts` | The DOM: shows a pane, runs the search, moves focus, remembers the pane, marks the window inactive. |
| `native.ts` | The same window over a native host's tree of views, through stx's host adapter. |
| `native-theme.ts` | Every size, padding, radius and colour the native branches draw with. |
| `update.ts` | What an update row says for each state an updater reports. |
| `*.stx` | The templates and their styles, with an `@if($native)` branch for a native host. |

The pieces meet in the DOM, not in each other's scripts. A sidebar item is a
`[data-settings-item]`, a pane a `[data-settings-pane]`, a row a
`[data-settings-row]`; the shell finds them wherever they are, so a row can be
your own markup as long as it carries those attributes.
`@stacksjs/components/settings` exports the core, both views and the update
row's words without the templates. On a native host the pieces meet the same
way, as attributes on the host's views.

## SettingsWindow

| Prop | Default | |
|---|---|---|
| `title` | `'Settings'` | The window's accessible name. |
| `pane` | stored, then first | The open pane. Two-way with `v-model:pane`. |
| `searchable` | `true` | |
| `searchPlaceholder` | `'Search'` | |
| `storageKey` | | Remembers the last pane under `stx:settings:<key>`. |
| `presentation` | `'window'` | `window` fills a titlebar-less window and clears its buttons. `sheet` is a rounded panel inside another window. |
| `sidebarWidth` | `226` | Pixels. |
| `height` | viewport, or `min(640px, 90vh)` for a sheet | A CSS length. |
| `id`, `className` | | |

Slots: `sidebar` (the groups), `account` (anything above them, such as whose
account this is), and the default slot (the panes).

| Event | Payload |
|---|---|
| `@pane` | `{ id, title, parent }` |
| `@search` | `{ query, panes, settings }` |
| `@navigate` | `{ id, from, setting }` |

From `componentApi(target)` (`@stacksjs/components/component-api`):
`showPane(id)`, `revealSetting(id)` (opens the pane that holds the row with
that `setting`, scrolls to it and highlights it; false when there is none),
`back()`, `forward()`, `focusSearch()`, `getPane()`. On a native host, which
has no document to find the window in, `componentApi(id)` takes the window's
`id` and nothing else.
A native sidebar item carries the test id `settings-item-<id>`, so a UI test can
open a pane by pressing it.

```ts
import { componentApi } from '@stacksjs/components/component-api'

// From a menu item, a notification, a deep link:
componentApi('settings').revealSetting('open-at-login')
```

## Rows

`<SettingsRow>` props: `label`, `description`, `icon` and `tone` (a leading
tile), `symbol` (the tile's glyph on a native host), `setting` (its id),
`keywords`, `to` (a pane id: a navigation row with a chevron), `value` (text
beside the chevron), `multiline`, `destructive`, `disabled`,
`layout="stacked"` (the control under the label, for a text area or a list of
radio buttons).

The row's label names the control inside it: a control with no accessible name
of its own gets `aria-labelledby` pointing at the label, and the description
becomes its `aria-describedby`.

Tones: `grey`, `blue`, `red`, `orange`, `yellow`, `green`, `indigo`, `purple`,
`pink`, `ink`. Icons are Iconify classes, such as `i-f7-bell-fill`.

`icon` and `symbol` are the same glyph for two hosts. `icon` is an Iconify
class, which is CSS and so the web's. `symbol` is an SF Symbol name
(`bell.fill`), which a native host draws. `<SettingsSidebarItem>`,
`<SettingsRow>` and `<SettingsPaneHeader>` take both; give both to a screen
that is built for both. Nothing maps one to the other.

## Update row

```html
<script client>
const status = state(null)
onMount(async () => {
  onDestroy(craft.updater.onChange(next => status.set(next)))
  status.set(await craft.updater.status())
})
</script>

<SettingsGroup header="Software Update">
  <SettingsUpdateRow appName="Library" :status="status()"
    @check="craft.updater.check()" @install="craft.updater.install()"
    @relaunch="craft.updater.relaunch()" />
</SettingsGroup>
```

`status` is what an updater reports: `craft.updater`'s `UpdateStatus` on
Craft's AppKit host, or a web app's own of the same shape
(`SettingsUpdateStatus`). The row says the app and its version, a sentence for
the state, and shows one button: **Check Now** (`idle`, `current`, `error`,
and disabled while `checking`), **Download and Install** (`available`, and
disabled beside the percentage while `downloading` and `installing`), or
**Restart to Update** (`installed`). An app that cannot replace itself
(`selfUpdating: false`) is never offered an install and says why (`reason`).
It emits `check`, `install` and `relaunch` and does nothing else.

| Prop | Default | |
|---|---|---|
| `appName` | | The app's name, before its version. |
| `status` | | The updater's status. Reactive. |
| `setting` | `'software-update'` | The row's id, for search and `revealSetting`. |
| `keywords` | `'update version upgrade release'` | |

`settingsUpdateView(status, appName)` (`@stacksjs/components/settings`) is the
same words without the row, for an app that draws its own.

## Search

The field filters the sidebar and, like System Settings, also lists the
settings whose label or `keywords` match, each with the name of its pane.
Choosing one opens the pane, scrolls the row into view and highlights it
briefly. The number of results is announced to a screen reader.

## Keys

| Key | |
|---|---|
| Up, Down | Move through the sidebar and open each pane, as System Settings does. |
| Home, End | First and last row. |
| A letter | Jump to the row starting with it. |
| Cmd/Ctrl+F | Focus the search field. |
| Escape | Clear the search and go back to the list. |
| Cmd/Ctrl+[ and ] | Back and forward. |
| Enter, Space | Open a navigation row. |

The sidebar is a vertical tab list with one tab stop; each pane is a labelled
tab panel. Nothing traps focus.

## On a native host

A native screen (Craft's AppKit host, where a window is AppKit views and not a
web view) is written with the same tags:

```html
<script client>
const pane = state('general')
const openAtLogin = state(true)
const size = state('medium')
const appearance = state('auto')
const status = state(null)

onMount(async () => {
  if (!craft.updater) return
  onDestroy(craft.updater.onChange(next => status.set(next)))
  status.set(await craft.updater.status())
})
</script>

<SettingsWindow id="settings" title="Settings" storageKey="library" v-model:pane="pane">
  <template #account>
    <View class="flex-row items-center gap-2 px-2 py-1">
      <Icon symbol="person.crop.circle.fill" class="h-[32px] w-[32px]" style="color: secondaryLabel" />
      <View class="flex-col">
        <Text class="text-[13px] font-semibold">Ada Lovelace</Text>
        <Text class="text-[11px]" style="color: secondaryLabel">ada@example.com</Text>
      </View>
    </View>
  </template>

  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" symbol="gearshape.fill" tone="grey" />
      <SettingsSidebarItem id="appearance" label="Appearance" symbol="circle.lefthalf.filled" tone="ink" />
    </SettingsSidebarGroup>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="updates" label="Software Update" symbol="arrow.down.circle.fill" tone="blue" />
      <SettingsSidebarItem id="about" label="About" symbol="info.circle.fill" tone="grey" />
    </SettingsSidebarGroup>
  </template>

  <SettingsPane id="general" title="General" active>
    <SettingsGroup header="Startup" footer="Starts in the background when you sign in.">
      <SettingsRow label="Open at login" setting="open-at-login" keywords="launch start">
        <Switch variant="mac" v-model:checked="openAtLogin" />
      </SettingsRow>
      <SettingsRow label="Sidebar icon size" setting="icon-size">
        <Select variant="mac" v-model:value="size" placeholder="" :options="['small', 'medium', 'large']" />
      </SettingsRow>
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="appearance" title="Appearance">
    <SettingsGroup>
      <SettingsRow label="Appearance" layout="stacked" setting="appearance">
        <AppearancePicker v-model:value="appearance" label="Appearance" />
      </SettingsRow>
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="updates" title="Software Update">
    <SettingsGroup>
      <SettingsUpdateRow appName="Library" :status="status()"
        @check="craft.updater.check()" @install="craft.updater.install()"
        @relaunch="craft.updater.relaunch()" />
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="about" title="About">
    <SettingsPaneHeader symbol="books.vertical.fill" tone="blue" title="Library"
      description="Lists, notes and prompts, on every Mac you sign in to." />
    <SettingsGroup>
      <SettingsRow label="Version" setting="version"><Text :text="craft.app.version" /></SettingsRow>
      <SettingsRow label="Acknowledgements" to="acknowledgements" />
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="acknowledgements" title="Acknowledgements" parent="about">
    <SettingsGroup><SettingsRow label="stx" description="MIT" /></SettingsGroup>
  </SettingsPane>
</SettingsWindow>
```

It is drawn from the host's own views: the sidebar on the system's sidebar
material with the system's search field, each item a tinted tile holding an SF
Symbol, the selected one a blue pill with white words; the pane under back,
forward and its name; groups as raised cards with a hairline above every row
but the first. Every size, padding, radius and colour is a class list in
`native-theme.ts` and nowhere else.

What is the same as the web: `pane` and `v-model:pane`, `active`, `storageKey`
(the app's storage, which stx serves as `localStorage`), the `account` and
`sidebar` slots, `@pane`, `@search` and `@navigate`, navigation rows with back
and forward, sub-panes keeping their parent's item selected, the search (the
same ranking, sidebar items filtered and matching settings listed with their
pane), `tone`, `badge`, `destructive`, `disabled`, `multiline`, `value`,
`layout="stacked"`, a group's `header` and `footer`, and
`showPane`, `revealSetting`, `back`, `forward`, `focusSearch` and `getPane`
through `componentApi(id)`.

The controls in a row are the host's: `<Switch>` is an NSSwitch, `<Select>` an
NSPopUpButton, `<Checkbox>` the system checkbox, `<TextInput>` and
`<PasswordInput>` an NSTextField and an NSSecureTextField, and `<Button>` an
NSButton (`variant="primary"`, `"danger"` and `"ghost"` are the host's default,
destructive and borderless buttons; anything else is the plain push button).
`variant="mac"` sizes a field, a label and a segment as AppKit does; without it
they keep the sizes the phone hosts use.

What differs, because the host does not offer it:

- **Glyphs are `symbol`.** An Iconify `icon` class draws nothing natively.
- **No keys.** A native host reports no key presses to a screen, so the arrow
  keys, type-ahead, Cmd+F and Cmd+[ and ] are the web's. Wire them through the
  app's menus (`craft.desktop.setMenus` and `onCommand`) to `focusSearch()`,
  `back()` and `forward()`. Escape in the search field does clear it.
- **`revealSetting` does not scroll.** It opens the pane and highlights the
  row; a host has no way to scroll a view into sight.
- **A navigation row is one press target.** The whole row opens the pane, so a
  control in its slot is not pressed for itself.
- **The selection is the system blue,** not the accent the person chose in
  System Settings, and the window does not grey it when it is not in front:
  the host does not report either.
- **A pane keeps its own scroll position,** since each is a scroll view.
- **`presentation`, `height` and `--stx-*` variables are the web's.** The
  window fills what it is given; `sidebarWidth` still sets the sidebar.
- **A row does not name its control.** The control's own accessible name is
  what a screen reader hears.
- **`<SegmentedControl>` is drawn,** not an NSSegmentedControl, and
  **`<Slider>` does not work**: Craft's AppKit host has neither primitive.
- **`<SettingsUpdateRow>` shows the download as a percentage.** The host has no
  determinate progress bar.

## Theming

Everything is drawn from `--stx-mac-*` custom properties
(`src/utils/mac-theme.ts`), in two sets of values that follow the `dark` class.
The accent is `--stx-accent`: set it and the selection, the focus rings (35% of
it), the primary button and the pickers follow. The ones an app is most likely
to set:

- `--stx-mac-accent`, `--stx-mac-window`, `--stx-mac-sidebar`, `--stx-mac-card`
- `--stx-mac-card-radius`, `--stx-mac-control-radius`, `--stx-mac-row-height`
- `--stx-mac-font`, `--stx-mac-font-size`
- `--stx-settings-sidebar-width`, `--stx-settings-content-width`

The font is the system's: San Francisco on a Mac, Segoe UI on Windows, the
platform sans elsewhere, at the same sizes and layout. Hairlines are half a
point where a display can draw one. Motion stops under
`prefers-reduced-motion`, and lines and secondary text firm up under
`prefers-contrast: more`.

## In a Craft window

- **Window buttons.** In `presentation="window"` the top of the sidebar leaves
  room for the traffic lights, read from `--craft-window-buttons-*`. Nothing is
  drawn under them.
- **Dragging.** The sidebar's top band and the toolbar are marked
  `data-window-drag` (and `-webkit-app-region: drag`, which Chromium honours).
  WKWebView ignores the CSS, so on a Mac the host hands a press on
  `[data-window-drag]` to `startDrag()`.
- **Inactive window.** The shell stamps `data-stx-window-active="false"` when
  the window loses focus, and also honours Craft's
  `data-craft-window-active`: the selection turns grey and the switches and
  radio buttons stand down, as AppKit's do.
- **Appearance.** `<AppearancePicker>` reports the choice; applying it is the
  app's business (`useColorMode()`).

## Limits of this version

- **The pop-up button's menu is the platform's.** `<Select>` is a native
  `<select>`, so on a Mac the menu is a real NSMenu and elsewhere it is the
  browser's. Only the button is drawn.
- **`<RadioGroup>` has no `v-model`.** Give it `value` and listen for `@change`.
- **A pane says for itself that it is open first** (`active`), because a pane
  cannot see the window's `pane` prop while the server renders it. Without it
  the first pane shows until the script runs.
- **Appearance thumbnails are sketches** drawn in CSS, not Apple's artwork.
- **The Mac stylesheets are for a web view.** They are left out of a native
  build, which draws the same components from the host's own views
  ([On a native host](#on-a-native-host)). The native look is measured for a
  Mac; on a phone the controls keep the platform's own look and the window is
  not laid out for a phone's width.
- **Icons need the app's icon CSS.** A tile shows nothing if the page does not
  generate the Iconify class it was given.
- **Not looked at:** a real Craft window (web view or AppKit), Windows and
  Linux web views, a screen reader. Focus rings are tested from their CSS
  rules, since a headless window never shows keyboard focus. The native tree
  is tested as the host receives it, not as AppKit draws it.
