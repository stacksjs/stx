# Reactive scoped-slot bindings

Scoped slots bind the child's evaluated prop values to the parent's binding
pattern. Their spelling is independent of the child's loop variable:

```html
<!-- Child -->
<li :for="(item, index) in items()" :key="item.id">
  <slot name="actions" :row="item" :index="index" />
</li>

<!-- Caller -->
<Box :items="items()">
  <template #actions="{ row: entry, index: position }">
    <button @click="edit(entry)">{{ position + ': ' + entry.name }}</button>
  </template>
</Box>
```

For props unavailable during server rendering, the compiler emits a transparent
singleton template scope. The shared keyed-loop runtime owns its nodes, live
prop values, nested component setup, event closures and disposal. Destructured
aliases, defaults, nested patterns and an object binding (`#actions="props"`)
use the evaluated prop object. Caller variables remain caller-owned; unrelated
child variables are not exposed. Resolved server slots keep their existing
server rendering path.

Native loop templates retain their own metadata and clone their children into
the real parent. They do not add a physical row wrapper. Component calls with
`:for` forward their `:key` to the generated loop boundary so existing keyed
controls retain identity, edited values and handlers through reordering.

Regression evidence lives in `scoped-slot-prop-bindings.test.ts` (both browser
build modes and normal/minified native bundles), `template-for-fragments.test.ts`
and `shared-runtime-screen.test.ts`. The slot tests cover caller shadowing,
attributes, events, text-only content, keyed replacement and removed-row effect
disposal. Native protocol checks establish compilation, mutations and cleanup;
they do not establish native graphics surface support or certify device focus.
