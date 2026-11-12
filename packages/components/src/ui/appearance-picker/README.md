# AppearancePicker

Light, dark, or whatever the system is, picked from three small pictures of a desktop, as System Settings offers it.

```html
<script client>
const appearance = state('auto')
const mode = useColorMode()

effect(() => mode.set(appearance()))
</script>

<AppearancePicker v-model:value="appearance" label="Appearance" />
```

It reports the choice and does nothing else. Putting the choice into effect is the page's business: usually stx's `useColorMode()`, as above, and in a Craft app the window's appearance as well. The picker never touches the `dark` class.

## Props

| Prop | Default | What it does |
|---|---|---|
| `value` | `auto` | `light`, `dark` or `auto`. `v-model:value`. Anything else is `auto`. |
| `options` | all three | Which choices to offer, in order, and what to call them: `['light', 'dark']`, or `[{ value: 'light', label: 'Hell' }, { value: 'dark', label: 'Dunkel' }]`. Anything that is not one of the three modes is left out. |
| `label` | none | The accessible name of the group. Inside a `<SettingsRow>` it can be left out: the row's label names the group. |
| `disabled` | `false` | Nothing can be chosen. |
| `id`, `className` | | On the root element. |

## Events

| Event | Payload | When |
|---|---|---|
| `change` | `light`, `dark` or `auto` | A different choice was made. |
| `update:value` | the same | The same moment. This is what `v-model:value` listens to. |

## Keys

A radio group with one tab stop, on the chosen picture.

| Key | Does |
|---|---|
| Arrow Right, Arrow Down | chooses the next picture, round to the first |
| Arrow Left, Arrow Up | chooses the one before, round to the last |
| Home, End | chooses the first, the last |
| Space, Enter | chooses the focused picture |

## Accessibility

The root is `role="radiogroup"` and each choice a `<button role="radio">` with `aria-checked`, named by its caption. The pictures are drawn in CSS and hidden from a screen reader.

## Styling

Each picture is 67 by 44 points: wallpaper under a menu bar, a small window with a selected row, and the corner of a larger window with its three buttons. `auto` shows the left half of the light picture beside the left half of the dark one. The pictures are fixed drawings and do not follow the page's theme, since they show what each choice looks like. The ring and the captions do follow it.

| Variable | Default |
|---|---|
| `--stx-appearance-width`, `--stx-appearance-height` | `67px`, `44px` |
| `--stx-appearance-radius` | `7px` |
| `--stx-appearance-gap` | `16px` |
| `--stx-appearance-ring`, `--stx-appearance-ring-gap` | `2.5px`, `2px` |
| `--stx-appearance-ring-color` | the accent |
| `--stx-appearance-caption-gap` | `5px` |
