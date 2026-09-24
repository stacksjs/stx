/** Augmented by .stx/runtime-config.d.ts; this module is browser-safe. */
export interface PublicRuntimeConfig {}

/** Public values only. Import from @stacksjs/stx/runtime-config in client code. */
export function useRuntimeConfig(): Readonly<PublicRuntimeConfig> {
  if (typeof document === 'undefined')
    throw new Error('Use the server runtime-config accessor outside the browser')
  const routed = typeof window === 'undefined' ? undefined : (window as any).__STX_RUNTIME_CONFIG__
  if (routed) return routed
  const tags = document.querySelectorAll('script[data-stx-runtime-config]')
  const tag = tags[tags.length - 1]
  return JSON.parse(tag?.textContent || '{}')
}
