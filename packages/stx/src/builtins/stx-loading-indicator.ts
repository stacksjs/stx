/**
 * StxLoadingIndicator Builtin Component
 *
 * Renders a fixed-position progress bar at the top of the viewport that
 * activates on navigation. Includes shimmer animation, automatic
 * link-click interception, and a global `window.stxLoading` API.
 *
 * Ported from the inline implementation in component-processing.ts.
 *
 * @module builtins/stx-loading-indicator
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

/**
 * Sanitize a CSS value to prevent injection (strips semicolons, braces, url()).
 */
function sanitizeCss(value: string): string {
  return value.replace(/[;{}()]/g, '').replace(/url/gi, '')
}

/**
 * Resolve a string prop from static or server-dynamic bindings.
 */
function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) {
    return String(props.serverDynamic[key])
  }
  const val = props.static[key]
  if (typeof val === 'string') {
    return val
  }
  return undefined
}

/**
 * Resolve a numeric prop, returning the default if not provided or not a valid number.
 */
function resolveNumericProp(props: ResolvedProps, key: string, defaultValue: number): number {
  const raw = resolveProp(props, key)
  if (raw !== undefined) {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  return defaultValue
}

export const StxLoadingIndicatorBuiltin: BuiltinComponentDef = {
  name: 'StxLoadingIndicator',
  aliases: ['stx-loading-indicator'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const color = sanitizeCss(resolveProp(props, 'color') || '#6366f1')
    const initialColor = sanitizeCss(resolveProp(props, 'initialColor') || resolveProp(props, 'initial-color') || '')
    const height = sanitizeCss(resolveProp(props, 'height') || '3px')
    const duration = resolveNumericProp(props, 'duration', 2000)
    const throttle = resolveNumericProp(props, 'throttle', 200)
    const zIndex = resolveNumericProp(props, 'zIndex', 999999) || resolveNumericProp(props, 'z-index', 999999)

    // Suppress unused variable warning — duration is available for future use
    void duration

    const gradient = initialColor
      ? `linear-gradient(to right, ${initialColor}, ${color})`
      : color

    return `
<div id="stx-loading-indicator" style="position:fixed;top:0;left:0;right:0;height:${height};background:${gradient};z-index:${zIndex};transform:scaleX(0);transform-origin:left;transition:transform 0.1s ease-out,opacity 0.3s ease;opacity:0;pointer-events:none">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%);animation:stx-shimmer 1.5s infinite"></div>
</div>
<style>@keyframes stx-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>
<script>
(function(){var el=document.getElementById('stx-loading-indicator'),p=0,l=!1,i=null;function u(v){p=Math.min(Math.max(v,0),100);if(el){el.style.opacity=p>0?'1':'0';el.style.transform='scaleX('+(p/100)+')'}}window.stxLoading={start:function(){l=!0;p=0;u(10);if(i)clearInterval(i);i=setInterval(function(){if(!l)return;var r=90-p,inc=Math.max(0.5,r*0.1);if(p<90)u(p+inc)},${throttle})},finish:function(){l=!1;if(i){clearInterval(i);i=null}u(100);setTimeout(function(){if(el)el.style.opacity='0';setTimeout(function(){p=0;if(el)el.style.transform='scaleX(0)'},300)},200)},set:function(v){u(v)},clear:function(){l=!1;p=0;if(i){clearInterval(i);i=null}if(el){el.style.opacity='0';el.style.transform='scaleX(0)'}}};document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(!h||h.startsWith('http')||h.startsWith('#')||h.startsWith('mailto:')||h.startsWith('tel:')||a.target==='_blank')return;window.stxLoading.start()});window.addEventListener('popstate',function(){window.stxLoading.start()});window.addEventListener('load',function(){window.stxLoading.finish()})})();
</script>`
  },
}
