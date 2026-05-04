export { buildStaticSite, defineSiteConfig, type BuildResult } from './build'
export { injectSeo } from './seo'
export { generateSitemap, type SitemapEntry } from './sitemap'
export { generateRobots } from './robots'
export { injectRouterScript, type RouterOptions } from './router'
export { injectThemeBootstrap, type ThemeOptions } from './theme'
export {
  applyTranslations,
  buildAlternateLinks,
  buildLangPickerScript,
  localizePath,
  resolveI18n,
  stripLocalePrefix,
  translate,
} from './i18n'
export type {
  BuildOptions,
  PageMeta,
  SiteConfig,
  SiteI18nOptions,
  SiteRouterOptions,
  SiteSeo,
  SiteSocial,
  SiteThemeOptions,
} from './types'
