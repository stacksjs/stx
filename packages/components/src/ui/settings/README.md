# Settings window

A Mac-native Settings window, built once: the two-column shell System Settings
has, its sidebar and search, panes with back and forward, the rounded groups of
rows, and controls drawn the way AppKit draws them. Measured against System
Settings on macOS 26 and later, in light, dark and an inactive window.

```html
<script client>
const pane = state('general')
const openAtLogin = state(true)
const size = state('medium')
</script>

<SettingsWindow title="Settings" storageKey="my-app" v-model:pane="pane">
  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" icon="i-f7-gear-alt-fill" tone="grey" />
      <SettingsSidebarItem id="appearance" label="Appearance" icon="i-f7-circle-lefthalf-fill" tone="ink" />
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
| `*.stx` | The templates and their styles. |

The pieces meet in the DOM, not in each other's scripts. A sidebar item is a
`[data-settings-item]`, a pane a `[data-settings-pane]`, a row a
`[data-settings-row]`; the shell finds them wherever they are, so a row can be
your own markup as long as it carries those attributes.
`@stacksjs/components/settings` exports the core and the view without the
templates.

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
`back()`, `forward()`, `focusSearch()`, `getPane()`.

```ts
import { componentApi } from '@stacksjs/components/component-api'

// From a menu item, a notification, a deep link:
componentApi('settings').revealSetting('open-at-login')
```

## Rows

`<SettingsRow>` props: `label`, `description`, `icon` and `tone` (a leading
tile), `setting` (its id), `keywords`, `to` (a pane id: a navigation row with a
chevron), `value` (text beside the chevron), `multiline`, `destructive`,
`disabled`, `layout="stacked"` (the control under the label, for a text area or
a list of radio buttons).

The row's label names the control inside it: a control with no accessible name
of its own gets `aria-labelledby` pointing at the label, and the description
becomes its `aria-describedby`.

Tones: `grey`, `blue`, `red`, `orange`, `yellow`, `green`, `indigo`, `purple`,
`pink`, `ink`. Icons are Iconify classes, such as `i-f7-bell-fill`.

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
- **The Mac look is for a web view.** Its styles are left out of a native
  (iOS, Android) build, where a control has the platform's own look already.
- **Icons need the app's icon CSS.** A tile shows nothing if the page does not
  generate the Iconify class it was given.
- **Not looked at:** a real Craft window, Windows and Linux web views, a screen
  reader. Focus rings are tested from their CSS rules, since a headless window
  never shows keyboard focus.
