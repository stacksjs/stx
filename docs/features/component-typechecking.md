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

## Native custom-element author programs

A `<script component type="application/json">` declares the element properties.
`stx typecheck` uses the same metadata/property types and method parser as the
native element emitter. Client methods receive the element as their `this`
context, including `HTMLElement`, `emit`, `requestUpdate`, `renderRoot`, declared
properties and the actual authored method signatures. Metadata names that overlap
`HTMLElement` (such as `style` and `onclick`) retain the native DOM property API;
their attribute/default values are still checked against the metadata type. Generic methods retain
their generic arguments. Server blocks and ordinary page functions receive no
component instance context. JSON metadata is never interpreted as executable
TypeScript; invalid JSON, invalid property kinds and mismatched defaults are
reported at the metadata source.

```html
<script component type="application/json">
{"tag":"typed-list","properties":{"rows":{"type":"array"},"count":{"type":"number"}}}
</script>
<script client>
interface ComponentState {
  rows: { title: string }[]
  _abort?: AbortController
}
function onConnect() { this._abort = new AbortController() }
function add(amount: number): void { this.count += amount }
</script>
<template>
  @foreach(this.rows as row)<p>{{ row.title }}</p>@endforeach
</template>
```

An optional `ComponentState` interface or object type describes private fields and
refines object/array element shapes. Refined metadata properties must still be
assignable to their declared metadata type. It is a type contract, not a state
initializer: use optional private fields until lifecycle code initializes them.
Private fields must be optional until initialized. Scalar/`any` state aliases, index signatures, `any` fields and method redeclarations are rejected; they cannot erase the native metadata or method contract. Unknown properties, wrong method
arguments and wrong property assignments remain errors. Nested native loops
have lexical aliases, including object key/value loops; aliases cannot escape
their loop. Synthetic `this` parameters and template wrappers retain mappings
to the authored line and column.

## Inherited server context

A partial can explicitly type the lexical context that the renderer copies from
its caller, without changing runtime behavior or converting it into props:

```html
<script server>
interface InheritedContext {
  pageTitle?: string
  pageDescription?: string
  canonicalPath?: string
}
const title = pageTitle || 'My site'
</script>
<title>{{ title }}</title>
```

Only these declared names become available to that server script. They are
file-local contracts, not ambient globals. Check the complete author tree:

```sh
stx typecheck 'resources/**/*.stx'
```

For each leaf page, the checker follows static `@extends`, `@layout` and
`@include` paths, using the configured layout/partial directories. It infers
server values, layout overrides and explicit include data without executing
scripts. Each reachable inherited contract is checked at the leaf callsite:
a numeric `pageTitle` fails at that page's layout/include directive; a missing
optional field is valid; a missing required field fails. Layouts and partials
are not treated as imaginary standalone renders with no incoming context.
Programmatic callers may set `partialsDir` and `layoutsDir` explicitly.

The contract form is a locally declared, non-generic object interface or object
type alias with named lexical properties. Callable/`any`/generic aliases are
explicit errors. Nested declarations, named function expressions, comments and
literals never supply caller bindings; imported values and destructuring aliases
do, while type-only imports do not. Dynamic include/layout paths, unresolved static targets and cyclic
or deeper-than-32 graphs cannot prove an inherited contract. When a checked tree
contains inherited contracts, these produce explicit diagnostics rather than a
successful but incomplete check. Include the partials and layouts in the author
program so their own scripts are checked too. Runtime-supplied context from an
external server caller is outside the static template graph.
