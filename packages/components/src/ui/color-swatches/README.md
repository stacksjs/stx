# ColorSwatches

A row of colour dots to pick one from, as System Settings offers its accent colours. The chosen dot has a ring around it and its name written underneath.

```html
<script client>
const accent = state('multi')
const accents = [
  { value: 'multi', label: 'Multicolour', color: 'conic-gradient(from 210deg, #ff5e5b, #ffb400, #62c554, #2fb0e8, #4b6ef5, #b05bd6, #ff5e5b)' },
  { value: 'blue', label: 'Blue', color: '#3478f6' },
  { value: 'purple', label: 'Purple', color: '#8c3d9a' },
  { value: 'graphite', label: 'Graphite', color: '#989898' },
]
</script>

<ColorSwatches v-model:value="accent" :options="accents" label="Accent colour" />
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `value` | `''` | The chosen option's value. `v-model:value`. |
| `options` | `[]` | `{ value, color, label?, disabled? }`, or a bare string, which is a colour named after itself. `color` is any CSS colour or gradient. The list is reactive. |
| `label` | none | The accessible name of the group. Inside a `<SettingsRow>` it can be left out: the row's label names the group. |
| `caption` | `true` | Write the chosen colour's name under it, and keep room for it so choosing one moves nothing. |
| `disabled` | `false` | Nothing can be chosen. One option can be disabled on its own. |
| `id`, `className` | | On the root element. |

## Events

| Event | Payload | When |
|---|---|---|
| `change` | the value | A different colour was chosen. |
| `update:value` | the value | The same moment. This is what `v-model:value` listens to. |

## Keys

The dots are a radio group with one tab stop, on the chosen dot (or the first, when nothing is chosen).

| Key | Does |
|---|---|
| Arrow Right, Arrow Down | chooses the next dot, round to the first |
| Arrow Left, Arrow Up | chooses the one before, round to the last |
| Home, End | chooses the first, the last |
| Space, Enter | chooses the focused dot |

A disabled dot is stepped over.

## Accessibility

The root is `role="radiogroup"` and each dot a `<button role="radio">` with `aria-checked` and its label as `aria-label`. The caption under the chosen dot is hidden from a screen reader, which has already read the name. Give every option a `label`: without one the name read out is the raw value.

## Styling

The ring is the accent colour (`--stx-mac-accent`) and the caption the secondary ink. The ring stays the accent colour in a window that is not the key window, as it does in System Settings.

| Variable | Default |
|---|---|
| `--stx-swatch-size` | `24px` |
| `--stx-swatch-gap` | `12px` |
| `--stx-swatch-ring`, `--stx-swatch-ring-gap` | `2px`, `2px` |
| `--stx-swatch-ring-color` | the accent |
| `--stx-swatch-caption-gap`, `--stx-swatch-caption-height` | `4px`, `13px` |

The dots wrap on to another line when the row is too narrow for them. A caption can be wider than its dot and is centred under it, so the first and last may reach past the ends of the row.
