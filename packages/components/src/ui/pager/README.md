# Pager

Full-width pages you swipe or step through: a first-run tour, an onboarding
questionnaire, a gallery of screenshots.

The pages are the slot's elements in a native scroll-snap track, so a swipe is
the browser's own (momentum, rubber band, reduced motion) and costs no script
per frame. The page shown is a model the page drives with its own buttons.

## Usage

```stx
<script client>
const step = state(0)
</script>

<Pager v-model:index="step" label="Welcome tour" dotsLabel="Tour pages">
  <section>Welcome</section>
  <section :for="slide in slides" :key="slide.id">{{ slide.title }}</section>
</Pager>
<button @click="step.set(step() + 1)">Next</button>
```

A questionnaire whose next page waits on an answer turns swiping off, and puts
its dots above the button:

```stx
<Pager v-model:index="question" swipe="false" dots="false" label="About you">…</Pager>
<PagerDots v-model:index="question" :count="questions.length" label="Questions" className="text-white" />
```

## Props

| Prop | Default | |
|---|---|---|
| `index` | `0` | The page shown. `v-model:index`, or `:index` with `@change`. |
| `label` | | The carousel's accessible name. |
| `swipe` | `true` | Swiping and the arrow keys. Off leaves moving to the page's buttons. |
| `dots` | `true` | The built-in dots under the pages. |
| `dotsLabel` | `Pages` | The dots' group name. |
| `slideLabel` | `{n} of {total}` | Each page's label. |
| `goToLabel` | `Go to page {n}` | Each dot's label. |
| `className`, `trackClass`, `dotsClass` | | Extra classes. Dots take the text colour. |

Exposed: `selected`, `count`, `go(i)`, `next()`, `prev()`.

## Accessibility

The APG carousel pattern: a region with `aria-roledescription="carousel"`, each
page a group with `aria-roledescription="slide"` labelled "2 of 5", the pages
off screen `inert`, the current dot `aria-current="step"`, and the arrow keys
(outside a field, tab strip, radio group or slider) stepping between pages.


## Native host

On Craft hosts advertising `nativePager`, the same slotted content uses platform
horizontal paging. Each direct slot child fills one viewport. `index` follows
buttons and settled swipes; adding/removing pages updates the dots and clamps the
selection. Rotation preserves the selected page. Offscreen pages are excluded
from native accessibility. Use a definite height or flex space for the pager;
its native setup uses no DOM measurement, observers or scroll-snap emulation.
The website keeps its existing scroll-snap and keyboard behavior.
