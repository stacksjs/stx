# Component contract checking

`stx typecheck` checks component calls against their declared props and events,
in addition to checking scripts and standalone template expressions.

```html
<!-- components/Counter.stx -->
<script client>
interface Props { count: number; label?: string }
const props = defineProps<Props>()
const emit = defineEmits<{ change: [value: number] }>()
</script>
```

In a parent template, these are checked at the parent source location:

```html
<Counter :count="total" @change="handleNumber($event)" />
<Counter count="not a number" /> <!-- wrong prop type -->
<Counter /> <!-- missing required count -->
```

Static attributes, `:prop`, `v-bind:prop`, braced `prop={expression}` and model
props participate. Signal values are unwrapped using the existing template
typing rules. Declared event payloads type `$event`; bare handler references are
checked as calls with that payload. Unknown attributes and undeclared events
remain available for native attribute/event fallthrough.

Both generic `defineProps<Props>()` declarations and constructor-style
`defineProps({ count: { type: Number, required: true } })` are supported.
Optional props and props supplied by `withDefaults` or a definition's `default`
may be omitted. Type aliases and imported types are resolved by TypeScript.
Components without explicit prop/event declarations keep their existing loose
typing; this does not infer a public contract from arbitrary server variables.

Component lookup shares the renderer's file naming and search order, including
`componentsDir`, explicit local imports, package component imports, and `@import`.
The CLI loads the app's stx configuration. Programmatic callers may override
`componentsDir` in `typecheckStxFiles(files, { componentsDir })`.

The TypeScript editor plugin uses the same contract projection, the same
declarations (`stx.d.ts` and `stx-module.d.ts`, preferring the copies the app has
installed) and the same `from 'stx'` rules as `stx typecheck`, so the two report
the same diagnostics. `stxTypescriptPlugin.enabled: false` turns it off.

Globals the app installs itself, which the stx runtime does not know about, are
declared once for both checkers through the stx entry in the app's `tsconfig.json`
(paths relative to the tsconfig that declares the entry, which may be a base the
app `extends`):

```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "@stacksjs/stx-typescript-plugin", "libs": ["./types/request-context.d.ts"] }
    ]
  }
}
```

`stx typecheck --lib <file>` still adds a file for one run. The editor plugin rechecks a
parent when an open child component's declarations change. For a custom component
directory, set `componentsDir` on the stx TypeScript plugin entry in `tsconfig.json`
(relative to the TypeScript project). The editor does not execute `stx.config.ts`.

Contracts are projected into virtual TypeScript; component scripts are not
executed by this feature. Script checking remains independently available for
both server and client blocks.
