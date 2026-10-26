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
| TextInput | Shared for value-model calls without `@input`; primitive for legacy/ambiguous calls | Shared file | Preserve object-payload callers; device validation |
| Image | Primitive | `StxImage` builtin alias, not the shared file | Position/scale-down support, device validation and builtin/shared precedence decision |
| Video | Shared for src with shared media events; primitive for source, mixed, bare or legacy-event calls | Shared file | Preserve legacy API; provider/DRM/API and device validation remain |

Explicit imports and screen-local components remain overrides. The audit tests
verify dependency paths rather than inferring selection from similar HTML.
Adding an override to an already compiled project requires cache invalidation,
as the dev watcher performs; the test models that invalidation explicitly.

## Reproduced blockers before further migration

### Video resolution batch (unreleased after v0.2.674)

Native `src` calls now select the app/plugin shared Video implementation when
installed. Legacy `source`, mixed `src`/`source`, and calls without either
remain primitive. Calls with legacy event names such as `@progress`, `@end`,
`@load` and `@playing` also remain primitive; the shared adapter uses
`@timeupdate`, `@ended`, `@loadedmetadata` and `@play`. Selection uses authored
props/bindings, not truthiness, so
an empty or initially undefined `src` still selects shared; an initially
undefined `source` still preserves the legacy path. Explicit imports and
screen-local overrides remain first, and the primitive remains available
when no shared component library is installed.

The prerequisite shared-player fix makes `controls`, `autoplay`, `muted` and
`loop` reactive on the physical player. Explicit-import native tests and the
real-browser test toggle these flags in both directions, including false
initial values; browser fallback controls/mute/loop follow the same props.

`video-resolution.test.ts` checks actual shared dependency paths on web/native
and runs shared URL and legacy object-source players in one normal/minified
bundle. It covers source replacement/clearing, reactive controls/pause/aspect
ratio, payload forwarding once per event, retained identity, conditional
remount, stale callbacks and teardown. Existing primitive-media regressions
remain in `remaining-component-resolution.test.ts`.

This is not native media/device certification. Provider page embeds, browser
source-list/track selection and DRM remain outside the shared native adapter's
supported contract. Image resolution is intentionally unchanged: web still
selects its builtin alias unless overridden, and object-position/scale-down
plus host visual validation remain gates. Craft is not modified.

### TextInput resolution batch (unreleased after v0.2.661)

After the shared disabled/readonly, model, focus/blur and native-submit fixes,
value-model usage (`v-model:value`, including modifiers, or `@update:value`)
selects conventional/plugin shared TextInput. Any `@input` listener retains
primitive selection: its body might expect the legacy `$event.text` object,
and inferring a contract from handler source would not be reliable. Plain
`:value` calls also retain their existing selection. Authors who want shared
value-shaped `@input` alongside a model should explicitly import the shared
file. Explicit imports and screen-local overrides remain first; a primitive
remains the fallback when no shared implementation is installed.

`text-input-resolution.test.ts` checks actual dependency paths on both targets,
mixed shared/legacy instances in the same bundle, model modifiers, event
payloads, readonly updates, remount and disposal. It does not claim to finish
the Image/Video migration or native-host visual validation.

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
   while the shared component emits the model value (normally a string;
   `.number` can emit a number). Broader API migration remains separate work.

   **Shared event compatibility (unreleased after v0.2.661):** native
   `onEndEditing` now commits shared lazy models and delivers an event-shaped
   `@change`; normal edits still emit value-shaped `@input`. The final host
   text takes precedence over an older change-text callback. Repeated identical
   end-editing callbacks do not double-emit, and existing synthetic
   `onValueChange` callers remain supported. Input is declared before the first
   edit so a lazy draft cannot leak a raw event into the value callback.
   `shared-text-input-events.test.ts` covers normal/minified native execution,
   trim/number modifiers, clearing, disabled commits, remount, stale events and
   legacy primitive input/end/submit payloads. The companion browser test
   exercises the actual shared component in WebView. Default native resolution
   and Craft code are unchanged; this is not a transparent migration of legacy
   object-payload callers to the shared value-payload API.

   **Reactive readonly (unreleased after v0.2.661):** the physical input now
   follows `:readonly` on both targets, including clearing an initially true
   value. Browser styling and clear-button visibility follow it too. Shared
   input/change/end-editing/clear handlers reject edits while locked and restore
   the model value after a stray edit callback; parent-driven value writes
   remain allowed. Readonly stays distinct from disabled: browser form values
   are still submitted, and removing readonly cannot bypass disabled state.
   `shared-text-input-readonly.test.ts` covers normal/minified native bundles
   and a real browser, including lazy commits, literals, toggling, remount and
   teardown. This uses the existing readonly-to-editable mapping; legacy
   primitive selection and event contracts, and Craft code, are unchanged.

   **Focus/blur and native submit forwarding (unreleased after v0.2.661):**
   shared `@focus`/`@blur` now receive the physical input's original event on
   web/native. Browser FocusEvent identity, target and relatedTarget survive;
   native payload fields survive. Existing bubbling focusin/focusout listeners
   still fire once. Native `onSubmitEditing` relays `@submit-editing` and its
   `@submit` alias once each, without committing a lazy model (end-editing
   retains that job). Browser forms keep their normal submit event; the input
   does not synthesize one from Enter. Removed inputs cannot forward stale
   lifecycle events. `shared-text-input-lifecycle-events.test.ts` covers shared
   and legacy native paths in normal/minified bundles, readonly/disabled,
   remount and teardown; `shared-text-input-focus-browser.test.ts` exercises
   actual browser focus, blur, form submission and remount. Craft and global
   primitive resolution are unchanged; device keyboard behavior is not certified.
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

   **Reactive responsive selection (unreleased after v0.2.708):** shared
   `srcSet` (also spelled `srcset`) and `sizes` update the physical browser
   image. A changed candidate set takes ownership from initial picture sources,
   so those sources cannot silently win over the new candidates. Unchanged
   initial candidates remain tied to the original `src`; replacing that URL
   drops them, while a replacement set can accompany a replacement URL.
   Restoring the original URL and initial set restores the initial sources.
   Empty string/null clears candidates or sizes; undefined restores defaults,
   including prepared catalog candidates. This distinction also applies to
   pictures whose initial candidates live only on their source elements.
   Lowercase/kebab prop aliases retain typed null/empty writes through the
   attribute observer instead of reverting to serialized defaults.
   Clearing `src` still clears all
   candidate sets. Source-specific `sizes` wins over the live global value;
   sources without their own size follow it. The source list itself remains
   setup-time, not a reactive art-direction API.
   `image-responsive-browser.test.ts` verifies decoded `currentSrc` selection
   for both prop spellings, size-driven selection, clearing and remount in
   actual WebKit/Chrome browsers (use `STX_IMAGE_BROWSER=chrome` on macOS).
   `image-delivery.test.ts` protects prepared formats/default restoration;
   `shared-image-source.test.ts` verifies normal/minified native bundles keep
   using `src`, never browser responsive URLs. This does not add native
   responsive image selection or change component resolution. Craft is untouched.

   **Reactive loading policy (unreleased after v0.2.709):** shared `priority`,
   `lazy`, `loading` and `fetchpriority` now update the physical image's browser
   hints. Priority forces `eager`/`high`; turning it off reveals the current
   authored hints, even when priority originally masked them during SSR.
   Without priority, explicit loading wins over lazy, and empty/null loading
   falls back to lazy (`true` by default). Empty/null fetch priority falls back
   to `auto`. Undefined restores the authored defaults. Boolean strings follow
   server `$bool` semantics, including `off`/`no`/`0` and the empty attribute.
   Typed false/null/default writes made while hidden survive remount, even
   when the outer prop attribute stays absent; parsed numeric/boolean defaults
   are also retained through the reactive-prop bridge.
   The historical #1704 observer guard is tested behaviorally in
   `edge-cases/issue-fixes.test.ts`: unchanged raw or parsed values cause no
   redundant writes, while a pending typed value with identical serialized
   text is still consumed. Router tests verify that type changes notify once.
   `image-loading-browser.test.ts` checks actual browser hint properties,
   precedence, SSR, clearing/defaults and retained identity in WebKit/Chrome.
   Its offscreen test verifies that enabling priority starts and decodes a
   previously deferred request without replacing the image. Hints cannot undo
   an already-started request and do not guarantee network scheduling order.
   `shared-image-loading.test.ts` verifies normal/minified native source,
   labels, identity, remount and teardown; it does not claim host support for
   browser loading hints. Craft and component resolution remain unchanged.
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

   **Reactive dimensions and layout (unreleased after v0.2.707):** the shared
   file now updates the physical image's `width`/`height` attributes and the
   picture frame's `aspectRatio`. Native ratio bindings accept positive finite
   numbers or CSS fractions such as `9 / 16`, converted to the numeric style
   protocol. With no authored ratio, none is inferred from intrinsic dimensions.
   Browser `objectPosition` and its `position` alias are live too: a nonempty
   primary position wins, clearing it reveals the alias, and clearing both
   restores `center`. Static HTML, responsive-source ownership, fit, and the
   existing full-size frame/image styles are preserved.
   `shared-image-layout.test.ts` reproduces the frozen values before the fix,
   then checks native protocol updates in normal/minified bundles and actual
   browser attributes/computed styles, clearing, retained native identity,
   hide/reopen and teardown. Dimension assertions concern HTML attributes and
   native props, not certification of device pixel layout. Native non-centred
   positions remain unsupported and diagnosed, not approximated. Resolution
   remains unchanged: use an explicit shared import to opt in; legacy native
   calls and the browser builtin are not silently migrated.

   **Load/error forwarding (unreleased after v0.2.707):** listeners now attach
   to the physical image and emit through the shared component once. The
   browser's original non-bubbling event (including identity, methods and
   target) and the native callback payload survive. Removed images cannot
   deliver stale callbacks. An empty initial URL omits `src` rather than
   requesting the page as an image and reporting a spurious load failure.
   `shared-image-events.test.ts` covers real browser
   image decoding/network failure, native callbacks in normal/minified
   bundles, hide/reopen and disposal. Legacy primitive selection and payloads
   are unchanged; this does not certify device image-loader delivery.
   Resource-event targets must be read during the callback: Chrome clears
   `Event.target` after dispatch, unlike WebKit. The test retains both the
   original Event (for identity) and the target observed by the caller (for
   delivery semantics), rather than asserting a platform-dependent later read.
   On macOS, `STX_IMAGE_BROWSER=chrome bun test
   packages/stx/test/native/shared-image-events.test.ts` reproduces the CI
   engine in a fresh headless browser without attaching to user tabs.

   **Reactive accessibility (unreleased after v0.2.707):** shared `alt` and
   `decorative` now update the physical image. Decorative images expose empty
   alt text; restoring meaningful status restores the current authored label,
   including text initially masked by static `decorative`. Browser
   `aria-hidden` follows the live flag and is removed when it clears. String
   boolean values use the same interpretation as server `$bool`.
   The native adapter projects image `alt` to `accessibilityLabel` as a fallback
   behind explicit native and ARIA labels, including static creation, updates
   and explicit clears. Other native types and legacy source/event contracts
   are unchanged. The shared component still requires meaningful server alt
   (or static decorative status) for SSR; this does not relax that validation.
   `image-accessibility.test.ts` verifies projection, overrides and wire clears;
   `shared-image-accessibility.test.ts` verifies both native bundle modes and
   a real browser, clearing, static-decorative recovery, identity and lifecycle.
   Native `aria-hidden` exclusion is not part of the current projection:
   clearing a label is not proof that a device screen reader skips the image.
   Host/device accessibility validation therefore remains a migration gate.
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
   implemented by this adapter. The resolution batch above now enables shared
   `src` usage while preserving the primitive's legacy `source` API. Device
   playback/visual validation and broader media API compatibility remain open.

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
