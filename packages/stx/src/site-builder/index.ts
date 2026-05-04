export { buildStaticSite, defineSiteConfig, type BuildResult } from './build'
export { injectSeo } from './seo'
export { generateSitemap, type SitemapEntry } from './sitemap'
export { generateRobots } from './robots'
export { injectRouterScript, type RouterOptions } from './router'
export { injectThemeBootstrap, type ThemeOptions } from './theme'
export type {
  BuildOptions,
  PageMeta,
  SiteConfig,
  SiteRouterOptions,
  SiteSeo,
  SiteSocial,
  SiteThemeOptions,
} from './types'
