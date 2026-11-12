# Slider

A value picked along a track, drawn the way macOS draws one: a 4 point track, a white pill for a knob, optional tick marks under the track and an icon at either end.

```html
<script client>
const size = state(1)
</script>

<Slider
  v-model:value="size"
  min="0"
  max="2"
  step="1"
  ticks
  minIcon="i-f7-textformat-size"
  maxIcon="i-f7-textformat-size"
  label="Text size"
/>
```

Under the drawing is a real `<input type="range">`, stretched over the track and transparent. The pointer, a screen reader and a form all get the browser's own slider, and the drawing follows it.

## Props

| Prop | Default | What it does |
|---|---|---|
| `value` | `min` | The value. `v-model:value` follows the knob as it moves. |
| `min`, `max` | `0`, `100` | The ends of the range. Given the wrong way round, they are swapped. |
| `step` | `1` | The distance between two values. `0` allows any value. |
| `ticks` | none | A number draws that many marks, spread evenly with one at each end. `true` (or the bare attribute) draws one for each step. Fewer than 2 or more than 101 draws none. |
| `tint` | `neutral` | `neutral` fills the track up to the knob in grey, `accent` in the accent colour. |
| `minIcon`, `maxIcon` | none | Iconify classes drawn at the low and the high end. |
| `label` | none | The accessible name. Inside a `<SettingsRow>` it can be left out: the row's label names the slider. |
| `disabled` | `false` | Dimmed, and it does not move. |
| `width` | `100%` | A CSS length. In a settings row the default is 220px (the row sets `--stx-slider-width`). |
| `name` | none | Submits the value in a form under this name. |
| `id`, `className` | | On the root element. |

## Events

| Event | Payload | When |
|---|---|---|
| `input` | the value | While the knob moves. |
| `change` | the value | When it is let go, and for each key that moves it. |
| `update:value` | the value | With `input`. This is what `v-model:value` listens to. |

The browser's own `input` and `change` events stop at the component, so a listener hears the component's event once and not the input's as well.

## Keys

| Key | Moves |
|---|---|
| Arrow Right, Arrow Up | one step up |
| Arrow Left, Arrow Down | one step down |
| Page Up, Page Down | ten steps |
| Home, End | to the minimum, to the maximum |

With no step, an arrow moves a hundredth of the range.

## Exposed

`componentApi(target)` gives `value` (the signal) and `setValue(number)`, which snaps what it is given to a step inside the range.

## Arithmetic

`./core` has no DOM and can be used without the component:

```ts
import { sliderFraction, sliderRange, sliderSnap, sliderTicks } from '@stacksjs/components'

const range = sliderRange(0, 10, 4)
sliderSnap(9.9, range) // 8: a maximum that is not on a step cannot be reached
sliderFraction(8, range) // 0.8
sliderTicks(true, range) // [0, 0.4, 0.8]
```

## Styling

Colours come from the Mac theme tokens (`--stx-mac-well`, `--stx-mac-ink-tertiary`, `--stx-mac-accent`, `--stx-mac-knob`, `--stx-mac-focus-ring`), so it follows light, dark (the `dark` class) and more contrast with the rest of the Mac controls. In a window that is not the key window (`data-stx-window-active="false"` on an ancestor, or Craft's `data-craft-window-active='false'` on the root) an accent fill turns grey.

Its own variables, set on the slider or anything around it:

| Variable | Default |
|---|---|
| `--stx-slider-width` | `100%` |
| `--stx-slider-track-height` | `4px` |
| `--stx-slider-knob-width`, `--stx-slider-knob-height` | `20px`, `16px` |
| `--stx-slider-track`, `--stx-slider-fill`, `--stx-slider-tick` | from the theme |
| `--stx-slider-tick-size`, `--stx-slider-tick-offset` | `2px`, `6px` |
| `--stx-slider-icon-size` | `15px` |
