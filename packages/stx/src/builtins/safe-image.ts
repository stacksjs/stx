/**
 * SafeImage Builtin Component
 *
 * Drop-in `<img>` replacement with a declarative broken-image fallback.
 * Third-party image URLs (external-CDN avatars, user content that gets
 * deleted, seed data pointing at links that 404) fail frequently in
 * production; without intervention the browser draws the alt text inside
 * whatever layout frame the `<img>` had — round avatar frames in
 * particular look broken.
 *
 * SafeImage wires an inline `onerror=` handler that swaps to a fallback
 * image (and optionally swaps the class string) when the primary src
 * fails to load.
 *
 * Usage:
 *   <SafeImage src="/avatars/u.png" alt="User" fallback="/avatars/default.svg" />
 *   <SafeImage :src="judge.photo" :alt="judge.name"
 *              className="h-12 w-12 rounded-full grayscale filter"
 *              fallbackClassName="h-12 w-12 rounded-full"
 *              fallback="/images/avatars/default-judge.svg" />
 *
 * Why inline `onerror=` rather than a delegated capture-phase listener:
 * `error` events don't bubble, so a listener attached by a component's
 * `<script client>` IIFE runs AFTER the element's first load attempt —
 * cached 404s and offline first paint slip past it. The inline HTML
 * `onerror=` attribute is parsed-and-attached synchronously with the
 * element by the browser's HTML parser, before the image request fires.
 * That's the only race-free option for the error path.
 *
 * Why a single window-level handler rather than per-instance inline
 * closures: keeps rendered HTML small (a ~35-byte attribute vs. a
 * ~120-byte inline function body per `<img>`). The handler is emitted
 * once per page render (gated on a render-context flag) and registered
 * once per browser session (gated on the `window.__stxSafeImageHandler`
 * existence check, so it's also idempotent across SPA navigation).
 * Per-instance config travels via `data-*` attributes, so the handler
 * stays stateless.
 *
 * Resolves stacksjs/stx#1732.
 *
 * @module builtins/safe-image
 */

import type { BuiltinComponentDef, RenderContext, ResolvedProps } from '../component-registry'

const DEFAULT_FALLBACK = '/images/safe-image-default.svg'

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined)
    return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string')
    return val
  return undefined
}

// The window-level error handler, minified by hand to keep the per-page
// payload small. Idempotent: the outer `||` short-circuits if already
// registered, and `__stx_fb` on the element prevents an infinite loop
// when the fallback image ALSO 404s (the flag is set before the src swap,
// so the fallback's own error event is a no-op).
const HANDLER_SCRIPT
  = `<script>window.__stxSafeImageHandler||(window.__stxSafeImageHandler=function(i){`
    + `if(i.__stx_fb)return;i.__stx_fb=1;`
    + `var f=i.getAttribute('data-fallback')||'${DEFAULT_FALLBACK}';`
    + `var c=i.getAttribute('data-fallback-class');`
    + `i.src=f;if(c)i.className=c;});</script>`

export const SafeImageBuiltin: BuiltinComponentDef = {
  name: 'SafeImage',
  aliases: ['safe-image', 'safe-img'],

  render(props: ResolvedProps, _slotContent: string, ctx: RenderContext): string {
    const src = resolveProp(props, 'src') || ''
    const alt = resolveProp(props, 'alt') || ''
    const fallback = resolveProp(props, 'fallback') || DEFAULT_FALLBACK
    const className = resolveProp(props, 'class') || resolveProp(props, 'className') || ''
    const fallbackClassName = resolveProp(props, 'fallbackClassName') || ''

    const imgAttrs: string[] = []
    imgAttrs.push(`src="${escapeAttr(src)}"`)
    imgAttrs.push(`alt="${escapeAttr(alt)}"`)
    if (className)
      imgAttrs.push(`class="${escapeAttr(className)}"`)
    imgAttrs.push(`data-fallback="${escapeAttr(fallback)}"`)
    if (fallbackClassName)
      imgAttrs.push(`data-fallback-class="${escapeAttr(fallbackClassName)}"`)
    imgAttrs.push('onerror="window.__stxSafeImageHandler(this)"')

    // Forward extra static attributes not consumed above (loading, width,
    // height, decoding, id, etc.).
    const consumed = new Set([
      'src', 'alt', 'fallback', 'class', 'className', 'fallbackClassName',
    ])
    for (const [key, value] of Object.entries(props.static)) {
      if (consumed.has(key))
        continue
      if (typeof value === 'boolean') {
        if (value)
          imgAttrs.push(escapeAttr(key))
      }
      else {
        imgAttrs.push(`${escapeAttr(key)}="${escapeAttr(value)}"`)
      }
    }

    const imgTag = `<img ${imgAttrs.join(' ')} />`

    // Emit the handler <script> once per page render. `ctx.context` is the
    // per-template (per-page) context object, so each SSR page gets its own
    // emission while repeated SafeImage instances on the SAME page share one.
    const renderCtx = ctx.context as Record<string, unknown> & { __safeImageHandlerEmitted?: boolean }
    if (!renderCtx.__safeImageHandlerEmitted) {
      renderCtx.__safeImageHandlerEmitted = true
      return `${HANDLER_SCRIPT}${imgTag}`
    }

    return imgTag
  },
}
