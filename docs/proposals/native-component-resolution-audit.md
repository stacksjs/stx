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
| TextInput | Primitive | Shared file | Broader input-event/API compatibility before changing default resolution |
| Image | Primitive | `StxImage` builtin alias, not the shared file | Position/scale-down support, device validation and builtin/shared precedence decision |
| Video | Primitive | Shared file | Shared file playback adapter verified; provider/DRM/API and device validation remain |

Explicit imports and screen-local components remain overrides. The audit tests
verify dependency paths rather than inferring selection from similar HTML.
Adding an override to an already compiled project requires cache invalidation,
as the dev watcher performs; the test models that invalidation explicitly.

## Reproduced blockers before further migration

Each probe explicitly imports the real shared `.stx` file, compiles with
`compileNativeScreen`, and executes with `mountNativeScreen`. The screen has a
wrapping `<div>`, a client `value = state('/first')`, and
`disabled = state(false)`, exposed through `window.probe`.

1. **TextInput (disabled gap fixed):**
   `<TextInput testID="target" :value="value" :disabled="disabled" />` previously
   updated value but never forwarded live disabled state to the physical
   input. The shared template now binds disabled state, styling and clear
   visibility reactively and rejects disabled input/change/clear actions.
   `shared-text-input-disabled.test.ts` exercises the actual shared file on
   web/native in normal/minified builds, including re-enable, parent updates,
   remount and native teardown. `form-controls-browser.test.ts` checks real
   browser FormData exclusion and lazy model events. This does not change
   default native resolution: legacy primitive input events carry an object,
   while the shared component emits a string. Broader API migration remains
   separate work.
2. **Image (source gap fixed):**
   `<Image testID="target" alt="Photo" :src="value" />` now updates the inner
   image, and the native adapter maps image `src` to the host's `source` on
   creation, update and removal. Use empty string/null to explicitly clear
   the image, rather than undefined (a missing prop subject to defaults).
   `shared-image-source.test.ts` covers web/native updates, clearing, identity,
   remount and native teardown in normal/minified builds. Optimized browser
   URLs and responsive candidates survive hydration; candidates for the old
   URL (and its placeholder background) are removed when it changes and
   restored if that URL returns.
   `image-delivery.test.ts` covers that with the real delivery catalog, and
   `image-source-browser.test.ts` verifies actual browser `currentSrc` selection
   and image decoding through URL replacement, clearing and restoration.
   Legacy native `source` values and resolution are unchanged.
   **Fit binding is now supported (unreleased after v0.2.661):** both
   `objectFit` and its `fit` alias update the physical image. A nonempty
   `objectFit` wins; clearing it reveals `fit`, and clearing both restores
   `cover`. Static SSR styling is preserved. Native CSS styles map `cover` /
   `contain` / `fill` / `none` to `resizeMode` `cover` / `contain` / `stretch` /
   `center`, including variable resolution and live style layers.
   `scale-down` and invalid native fit values are diagnosed and omitted (so
   an authored fallback can remain); browser `scale-down` is unchanged.
   `image-fit.test.ts` and `shared-image-fit.test.ts` cover translation,
   diagnostics, precedence, live changes, defaults, identity, remount and
   teardown, with normal/minified native bundles and computed browser styles.
   `objectPosition` remains unsupported. Existing Craft implementations also
   differ for `contain` upscaling: iOS uses aspect-fit, Android CENTER_INSIDE
   does not upscale small images. No Craft code was changed, and this is not
   a claim of device pixel parity. Position/scale-down, host validation and
   browser builtin/shared precedence remain migration gates.
3. **Video (shared setup crash fixed, unreleased):**
   `<Video testID="target" label="Movie" :src="value" :paused="paused" />`
   now registers custom elements only in the browser. On native, the physical
   player is one `Video` leaf: browser fallback videos and custom controls are
   not emitted as duplicate players or unmapped views. Live `src` writes and
   removal target native `source`; fractional aspect ratios become numbers.
   Native play/pause/ended/timeupdate/loadedmetadata/loadstart/error callbacks
   are relayed to the caller, without intercepting browser event bubbling.
   `shared-video.test.ts` verifies source replacement/clearing, pause state,
   playback events and payloads, sizing, conditional remount, stale events and
   teardown in normal/minified bundles. `video-browser.test.ts` verifies real
   custom-element registration, single event delivery and pause-on-clear.
   Native hosts must support the supplied media URL/codec. YouTube/Vimeo page
   embeds, browser source-list selection, tracks and DRM configuration are not
   implemented by this adapter. Default native resolution and the primitive's
   legacy `source` API remain unchanged; device playback/visual validation and
   broader media API compatibility are still gates before default migration.

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

## Platform controls (after v0.2.657)

Resolution is unchanged, but what the shared files draw natively is not: a
component reads `$native` and renders the platform's control there, keeping
its web markup byte for byte. Switch is the host's `Switch`, Select a
`Picker` with `items` (fixing the rejected option-children mutation), the text
fields 48pt platform fields with keyboard, autofill and secure entry projected
from HTML (`src/native/text-entry.ts`), Button a filled system-blue
Pressable with an ActivityIndicator, lists iOS inset groups with `divide-y`
separators, SegmentedControl/Tabs a segmented track via `aria-selected:`
layers, Dialog/Drawer slide-up sheets. The shared Button, TextInput and Select
no longer read the web's control density/shape tokens natively; Card and
plain elements still do. Evidence: `test/native/native-shared-*.test.ts`,
`native-text-entry.test.ts`, `native-state-layers.test.ts`; still protocol
evidence, not device screenshots.

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
