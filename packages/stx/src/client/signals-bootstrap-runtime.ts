/** Runtime preamble installed before any reactive APIs are created. */
export const SIGNALS_PREAMBLE_RUNTIME = `
// STX Signals Runtime (Development Build)
console.log('[stx] signals runtime loading');
// Pre-initialization shim: capture onMount/onDestroy calls made before the runtime IIFE runs
// (e.g. from partial scripts that execute before the full runtime is ready)
if(!window.__stx_early_mounts)window.__stx_early_mounts=[];
if(!window.__stx_early_destroys)window.__stx_early_destroys=[];
if(!window.onMount)window.onMount=function(fn){window.__stx_early_mounts.push(fn)};
if(!window.onDestroy)window.onDestroy=function(fn){window.__stx_early_destroys.push(fn)};
console.log('[stx] entering IIFE');
(function() {
  'use strict';

`

/** Browser-only setup that must run after the host adapter is selected. */
export const SIGNALS_CLOAK_RUNTIME = `  // Inject x-cloak CSS to prevent FOUC (Flash of Unstyled Content)
  // Elements with x-cloak are hidden until the runtime removes the attribute after mount
  var cloakStyle = document.getElementById ? document.getElementById('stx-cloak-style') : null;
  if (!cloakStyle) {
    cloakStyle = document.createElement('style');
    cloakStyle.id = 'stx-cloak-style';
    cloakStyle.textContent = '[x-cloak] { display: none !important; } [data-stx-component-wrapper]:not([stx-hydrate]) { display: contents; }';
    document.head.appendChild(cloakStyle);
  }

`
