# Component models

`useModel` connects an incoming component prop to its `update:*` event and
returns a signal: read with `model()`, write with `.set()`, `.update()` or `.value`.
Call it during component setup in `<script client>`.

```html
<!-- TextEditor.stx -->
<script client>
const text = useModel({ default: '' })
</script>
<input :value="text()" @input="text.input($event.target.value)" @change="text.change($event.target.value)">
```

```html
<TextEditor v-model.trim.lazy="title" />
```

The default model uses `modelValue` and `update:modelValue`. Named models use
`useModel('title', { default: '' })` with `v-model:title="title"`. A component may
have several independent models, including default and named models together.
`TextInput` supports `v-model:value`; `Switch` supports `v-model:checked`.
Their existing `@input` and `@change` events remain supported.

Parent updates never emit an update event. Child writes update the local signal
and emit once when its value changes. Defaults are local fallbacks, **not**
automatically written back to an undefined parent; initialize the parent when
both sides must start with the same value. Without a default the return type
includes `undefined`. Type arguments are supported, e.g.
`useModel<number>('count', { default: 0 })`.

## Modifiers and transforms

- `.trim` trims string writes.
- `.number` converts non-empty numeric strings using `Number`; invalid strings
  stay strings. Use `string | number` when your input can contain either.
- `.lazy` makes `.input(value)` wait for `.change(value)`. `.set(value)` always
  writes immediately, so buttons and explicit programmatic commits still work.
- Custom modifiers are available through `model.modifiers` and the `set`
  transform. The compiler forwards them as `modelModifiers` or `nameModifiers`.

```ts
const title = useModel('title', {
  default: '',
  set: (value, modifiers) => modifiers.capitalize ? value.toUpperCase() : value,
})
```

`get(value)` transforms reads; `set(value, modifiers)` transforms writes before
the built-in trim/number coercion. `parse(rawAttribute)` overrides browser DOM
attribute parsing (not already-typed parent values). Native inputs retain their
existing `v-model.trim.number.lazy` semantics.

For direct module imports, `useModel` reads the current component instance's
props; signal-valued props track parent changes. Plain prop values are initial
snapshots, not reactive objects. The same model core runs in generated client
code. Model subscriptions and prop observers are disposed with their component;
retained model references cannot emit after teardown.

This helper is unrelated to the database ORM's `defineModel`.
