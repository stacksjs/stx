# Shared/native component resolution audit

Audited against v0.2.634 source plus the text-input focus-style work for
[#2090](https://github.com/stacksjs/stx/issues/2090). This is an acceptance audit
for [#2091](https://github.com/stacksjs/stx/issues/2091), not a claim that every
component is portable or that device rendering has been certified.

## Resolution inventory

The shipped shared library and native primitive directory have six overlapping
names. `test/native/remaining-component-resolution.test.ts` enumerates both
directories and fails if a new overlap has no recorded compatibility decision.

| Name | Current native selection | Browser selection without an explicit override | Remaining gate |
| --- | --- | --- | --- |
| Button | Shared app/plugin file, primitive fallback | Shared app/plugin file | Device accessibility/visual validation |
| Checkbox | Shared for checked/change usage; primitive for legacy value/value-change | Shared file | Preserve both APIs; device validation |
| Switch | Shared for checked/change usage; primitive for legacy value/value-change | Shared file | Preserve both APIs; device validation |
| TextInput | Primitive | Shared file | Reactive disabled state and input-event compatibility |
| Image | Primitive | `StxImage` builtin alias, not the shared file | Source/fit mapping and builtin/shared precedence decision |
| Video | Primitive | Shared file | Browser custom-element dependency needs a native adapter |

Explicit imports and screen-local components remain overrides. The audit tests
verify dependency paths rather than inferring selection from similar HTML.
Adding an override to an already compiled project requires cache invalidation,
as the dev watcher performs; the test models that invalidation explicitly.

## Reproduced blockers before further migration

Each probe explicitly imports the real shared `.stx` file, compiles with
`compileNativeScreen`, and executes with `mountNativeScreen`. The screen has a
wrapping `<div>`, a client `value = state('/first')`, and
`disabled = state(false)`, exposed through `window.probe`.

1. **TextInput:** `<TextInput testID="target" :value="value" :disabled="disabled" />`.
   After `disabled.set(true)` and `value.set('/second')`, the physical
   `TextInput` has the new value but no disabled prop. The shared template
   still computes disabled state server-side. Migrate only after live
   disabling/re-enabling, input rejection and legacy event payloads are covered
   on the same shared file in browser/native tests.
2. **Image:** `<Image testID="target" alt="Photo" :src="value" />`.
   The physical Image has `src: ''` before and after the value update; native
   `source` is not populated. `objectFit` and `objectPosition` also produce
   unsupported-style diagnostics. Forwarding a binding to the picture wrapper
   is not sufficient. Decide how shared `src`/fit and native `source`/resizeMode
   coexist, and account for the browser builtin alias before changing defaults.
3. **Video:** `<Video testID="target" label="Movie" :src="value" />`.
   Executing the compiled bundle throws `ReferenceError: customElements is not
   defined`: the shared setup imports and registers browser video-player
   elements. Its fallback markup alone does not make its setup portable.
   Separate host-neutral media state from browser registration first, then
   test source, pause, events, lifecycle, and platform media capabilities.

These are JS/compiler observations, not simulator screenshots. None justifies
changing resolution globally. The legacy-media regression tests keep the
existing TextInput, Image and Video paths working with the shared plugin
installed, including reactive state, events, conditional remount and teardown
in normal and minified builds.

## Acceptance evidence and boundaries

- Precedence, explicit imports, configured roots and screen-local overrides:
  `shared-component-resolution.test.ts`, `checked-control-resolution.test.ts`,
  and `remaining-component-resolution.test.ts`.
- Same-source browser/native controls, props, models, lifecycle and cleanup:
  `shared-checkbox-reactivity.test.ts`, `shared-switch-reactivity.test.ts`,
  `shared-controls-example.test.ts`, and the Button resolution suite.
- Native physical attribute targeting and compatibility:
  `shared-control-attributes.test.ts`, `control-compatibility.test.ts`.
- Remaining overlaps: identified and their existing contracts protected, but
  **not migrated**. Explicitly compiling a shared file is not proof of correct
  execution; the probes above demonstrate why.
- Maintained-host visual/accessibility checks: still outstanding. Protocol
  tests are not VoiceOver, TalkBack, keyboard-modality or pixel-parity evidence.

## Focus/ring audit boundary

The maintained Craft templates report `onFocus`/`onBlur` for text fields and
multiline fields. STX can apply supported `focus:` style layers there, including
dark variants, reactive replacement, inline priority and lifecycle restoration.
`focus-styles.test.ts` covers this against the actual shared TextInput.

The host style contract has no independent ring width/color/inset/offset
drawing fields. Rings remain diagnostics, not border/shadow approximations.
Non-text control focus and keyboard modality (`focus-visible:`) also lack the
necessary host events/state. STX now implements `focus-within:` from descendant
text-input events: `focus-within-runtime.test.ts` verifies actual shared
Card/TextInput ancestry, reactive styles, appearance changes, overlapping
focus/blur delivery, removal, hiding, remount, reparenting and cloning.
Non-text-focus coverage is still unavailable. Full host focus and ring support,
plus device validation, remain separate work; no Craft code was changed in
this audit.
