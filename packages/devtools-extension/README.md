# @stacksjs/stx-devtools-extension

The browser-extension side of **Stacks DevTools** ([stacksjs/stx#1747](https://github.com/stacksjs/stx/issues/1747), Phases 4–6). It consumes the in-page `window.__stxDevtools` introspection protocol (Phases 1–3, shipped in the stx runtime) and surfaces it in a browser devtools panel.

> Distinct from `packages/devtools` (the server-side project **dashboard**). This package is the runtime **inspector** extension.

## Architecture

The standard devtools trifecta — the panel can't touch `window.__stxDevtools` directly (different JS world), so messages cross a bridge:

```
┌── devtools panel (panel.ts) ──┐        ┌─────── inspected page ───────┐
│  request(type) ──────────────┼──┐      │                              │
│  render response             │  │      │  inject.ts (page world)      │
└──────────────────────────────┘  │      │   installDevtoolsBridge()    │
            ▲                      ▼      │     handleDevtoolsRequest(    │
            │              content-script.ts ──▶ window.__stxDevtools )  │
            └──────── responses ──────┘  │                              │
                                          └──────────────────────────────┘
```

- **`protocol.ts`** — the contract: `DevtoolsRequest` / `DevtoolsResponse` and the pure `handleDevtoolsRequest(devtools, req)` that maps a request to the matching `__stxDevtools` call. Framework-agnostic, **fully unit-tested**.
- **`inject.ts`** (→ `inject.js`, page world) — `installDevtoolsBridge()`: answers protocol requests from `window.__stxDevtools` and posts responses. **Unit-tested** against a fake window.
- **`content-script.ts`** — injects `inject.js` and relays requests/responses between the page (`postMessage`) and the extension (`chrome.runtime`).
- **`devtools.ts`** — registers the "Stacks" panel.
- **`panel.ts` / `panel.html`** — sends requests via `request(type)` and renders the responses.

## Protocol

`request(type, payload?)` → `{ ok, result | error }`, mirroring `window.__stxDevtools` v2:

| type | maps to | phase |
|---|---|---|
| `version` `tree` `scope` `stores` | introspection | 1 |
| `enable` `disable` `tracking` `stats` `resetStats` `graph` | instrumentation | 2 |
| `ifTrace` `queries` | traces | 3 |

`scope` takes `payload: { scopeId }`. Reads are safe; a missing runtime / unknown type / throwing call all return `{ ok: false, error }` (never throws).

## Build

```bash
bun run build   # → dist/ : a loadable unpacked extension
```

Bundles `src/{content-script,inject-entry,devtools,panel}.ts` to the JS files the
manifest references and copies `public/*` (manifest + HTML). Load `dist/` via the
browser's **Load unpacked** (Chrome `chrome://extensions`, Developer mode).

## Status

- ✅ **Protocol + bridge** — done and unit-tested (`test/protocol.test.ts`, `test/inject.test.ts`).
- ✅ **Build** — `bun run build` emits a loadable `dist/` (`test/build.test.ts`).
- ✅ **Background relay** — `relay.ts` pairs a devtools-panel port with its tab's content-script port (by id) and forwards both ways; `background.ts` is the chrome adapter. Routing core unit-tested (`test/relay.test.ts`).
- 🚧 **Rich UI** — the panel currently renders raw JSON. The component-tree view, interactive reactive graph, `:if` decision trace, and query timeline are thin clients of `request()`.

The protocol, bridge, relay, and build are settled and tested end-to-end; the
remaining work is the panel UI on top of the stable `request()` surface.
