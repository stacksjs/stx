# RenderSurface: integration boundary for #2108

## Inspected upstream, 2026-10-23

Craft main `44fac13d2ff6474390e36cba99a00eaf0aebe9ec` adds
`craft.metal_surface.Surface` in `packages/zig/src/metal_surface.zig`.
Its maintained guide is `docs/guides/metal-surface.md`; the native execution
receipt is `docs/receipts/metal-surface-macos.json`.

This is real progress, not a no-op: it accepts a host-owned native view,
maintains a CAMetalLayer, resizes to view/backing-scale metrics, presents bounded
opaque CPU frames and supports readback. It enforces main-thread ownership,
suspension, dimension/buffer limits and terminal GPU failure handling. Its
recorded execution is on macOS. The guide explicitly leaves iOS acceptance,
native input/clocks and STX HUD integration separate.

The shared TypeScript/native node API is not present in the inspected iOS,
Android and TypeScript packages. STX cannot instantiate the Zig owner from
JavaScriptCore or pass a native view pointer through its existing node bridge.
Inventing a `data-native="RenderSurface"` component alone would produce a
successful compile without the required rendering behavior.

## Host-owned boundary needed before implementation

Craft's assigned agent owns the implementation and final API names. STX needs
the following published behavior, not a private copy of host implementation:

- A supported native node/capability, including explicit unavailable-platform
  and unavailable-device outcomes rather than a silently empty View.
- Creation tied to a retained node ID; updating frame/resource input must not
  recreate the native view or transfer ownership ambiguously.
- Documented frame/resource handles or transport, dimensions/backing scale,
  validation errors, buffer limits and backpressure. Do not serialize raw
  native pointers or assume arbitrary JavaScript arrays are accepted.
- Monotonic frame clocks and normalized pointer/keyboard/touch/scale events,
  including interruption, capture cancellation and suspend/resume ordering.
- Idempotent teardown and explicit behavior for late frames or callbacks after
  disposal. Resize/failure must preserve or invalidate resource IDs predictably.
- A maintained host fixture proving mount, update, visible presentation,
  unavailable-host failure, interruption and resource cleanup.

## STX-owned follow-through

Once that contract exists, add its primitive/type/prop/event mappings to the
existing shared compiler and bridge, not a second renderer. Test compilation
and retained identity through reactive updates, keyed moves and removal. Test
invalid resources, repeated mount/unmount, cancellation and unsupported hosts.
Then use the real host fixture to capture native output and add the HUD fixture
from #2109 above the surface. Protocol-only success is not native presentation.

## Canonical blockers

- [Craft #395](https://github.com/craft-native/craft/issues/395): shared native
  surface clocks/input; depends on #392/#393/#394. Former #409/#406/#407/#408
  were accidental duplicates closed without implementation.
- [ts-css #38](https://github.com/stacksjs/ts-css/issues/38): faithful HUD
  styling, itself dependent on STX #2108. Former #39 was an accidental duplicate.

Keep STX #2108 and #2109 open. Neither the Metal source landing nor closure of
duplicate issues proves their acceptance criteria. No Craft code is modified
by this audit or by the STX-owned HUD test harness.
