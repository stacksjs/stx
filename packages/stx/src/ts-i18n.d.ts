/* eslint-disable pickier/no-unused-vars */
// Ambient declaration for @stacksjs/ts-i18n.
//
// stx delegates translation file discovery/parsing to ts-i18n's `loadLocale`
// when the package is available (see src/i18n.ts). The dependency is linked via
// a `file:` path until @stacksjs/ts-i18n@>=0.1.11 (which adds `loadLocale`) is
// published, so on machines where it isn't installed the import resolves at
// runtime via a guarded dynamic import with a built-in fallback. This ambient
// declaration keeps `tsc` happy in both states, matching the pattern used for
// the other un-typed external deps (ts-images, sharp, ts-videos).
declare module '@stacksjs/ts-i18n' {
  export interface LoadLocaleOptions {
    translationsDir: string
    defaultLocale?: string
    sources?: Array<'ts' | 'yaml' | 'json'>
    [key: string]: unknown
  }

  export function loadLocale(
    locale: string,
    options: LoadLocaleOptions,
  ): Promise<Record<string, any> | undefined>
}
