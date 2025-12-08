/**
 * Analytics Module
 *
 * Provides automatic analytics script injection for various providers:
 * - Fathom Analytics (privacy-focused)
 * - Google Analytics (GA4)
 * - Plausible Analytics (privacy-focused, open source)
 * - Self-hosted analytics (using dynamodb-tooling)
 * - Custom analytics scripts
 *
 * ## Configuration
 *
 * Analytics can be configured in `stx.config.ts`:
 * ```typescript
 * export default {
 *   analytics: {
 *     enabled: true,
 *     driver: 'fathom',
 *     fathom: {
 *       siteId: 'ABCDEFGH',
 *       honorDnt: true,
 *     }
 *   }
 * }
 * ```
 */
import type { AnalyticsConfig, StxOptions } from './types'

/**
 * Generate analytics tracking script based on configuration
 */
export function generateAnalyticsScript(options: StxOptions): string {
  const analytics = options.analytics
  if (!analytics?.enabled) {
    return ''
  }

  switch (analytics.driver) {
    case 'fathom':
      return generateFathomScript(analytics)
    case 'google-analytics':
      return generateGoogleAnalyticsScript(analytics)
    case 'plausible':
      return generatePlausibleScript(analytics)
    case 'self-hosted':
      return generateSelfHostedScript(analytics)
    case 'custom':
      return generateCustomScript(analytics)
    default:
      return ''
  }
}

/**
 * Generate Fathom Analytics script
 * https://usefathom.com/
 */
function generateFathomScript(config: Partial<AnalyticsConfig>): string {
  const fathom = config.fathom
  if (!fathom?.siteId) {
    return ''
  }

  const scriptUrl = fathom.scriptUrl || 'https://cdn.usefathom.com/script.js'
  const defer = fathom.defer !== false ? ' defer' : ''

  const dataAttrs: string[] = [`data-site="${escapeAttr(fathom.siteId)}"`]

  if (fathom.honorDnt) {
    dataAttrs.push('data-honor-dnt="true"')
  }

  if (fathom.spa) {
    dataAttrs.push('data-spa="auto"')
  }

  if (fathom.canonical) {
    dataAttrs.push(`data-canonical="${escapeAttr(fathom.canonical)}"`)
  }

  if (fathom.auto === false) {
    dataAttrs.push('data-auto="false"')
  }

  return `
<!-- Fathom Analytics -->
<script src="${escapeAttr(scriptUrl)}" ${dataAttrs.join(' ')}${defer}></script>
`
}

/**
 * Generate Google Analytics 4 script
 */
function generateGoogleAnalyticsScript(config: Partial<AnalyticsConfig>): string {
  const ga = config.googleAnalytics
  if (!ga?.measurementId) {
    return ''
  }

  const measurementId = escapeAttr(ga.measurementId)
  const debugMode = ga.debug ? `gtag('config', '${measurementId}', { 'debug_mode': true });` : ''

  return `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
  ${debugMode}
</script>
`
}

/**
 * Generate Plausible Analytics script
 * https://plausible.io/
 */
function generatePlausibleScript(config: Partial<AnalyticsConfig>): string {
  const plausible = config.plausible
  if (!plausible?.domain) {
    return ''
  }

  const scriptUrl = plausible.scriptUrl || 'https://plausible.io/js/script.js'
  const _dataAttrs: string[] = [`data-domain="${escapeAttr(plausible.domain)}"`]

  // Build script URL with extensions
  let finalScriptUrl = scriptUrl
  const extensions: string[] = []

  if (plausible.trackLocalhost) {
    extensions.push('local')
  }

  if (plausible.hashMode) {
    extensions.push('hash')
  }

  if (extensions.length > 0 && scriptUrl === 'https://plausible.io/js/script.js') {
    finalScriptUrl = `https://plausible.io/js/script.${extensions.join('.')}.js`
  }

  return `
<!-- Plausible Analytics -->
<script defer data-domain="${escapeAttr(plausible.domain)}" src="${escapeAttr(finalScriptUrl)}"></script>
`
}

/**
 * Generate self-hosted analytics script (using dynamodb-tooling analytics)
 * This creates a minimal, privacy-focused tracking script similar to Fathom
 */
function generateSelfHostedScript(config: Partial<AnalyticsConfig>): string {
  const selfHosted = config.selfHosted
  if (!selfHosted?.siteId || !selfHosted?.apiEndpoint) {
    return ''
  }

  const siteId = escapeAttr(selfHosted.siteId)
  const apiEndpoint = escapeAttr(selfHosted.apiEndpoint)
  const honorDnt = selfHosted.honorDnt ? `if(n.doNotTrack==="1")return;` : ''
  const hashTracking = selfHosted.trackHashChanges ? `w.addEventListener('hashchange',pv);` : ''
  const outboundTracking = selfHosted.trackOutboundLinks
    ? `
  d.addEventListener('click',function(e){
    var a=e.target.closest('a');
    if(a&&a.hostname!==location.hostname){
      t('outbound',{url:a.href});
    }
  });`
    : ''

  return `
<!-- Self-Hosted Analytics -->
<script data-site="${siteId}" data-api="${apiEndpoint}" defer>
(function(){
  'use strict';
  var d=document,w=window,n=navigator,s=d.currentScript;
  var site=s.dataset.site,api=s.dataset.api;
  ${honorDnt}
  var q=[],sid=Math.random().toString(36).slice(2);
  function t(e,p){
    var x=new XMLHttpRequest();
    x.open('POST',api+'/collect',true);
    x.setRequestHeader('Content-Type','application/json');
    x.send(JSON.stringify({
      s:site,sid:sid,e:e,p:p||{},
      u:location.href,r:d.referrer,t:d.title,
      sw:screen.width,sh:screen.height
    }));
  }
  function pv(){t('pageview');}
  ${hashTracking}
  ${outboundTracking}
  if(d.readyState==='complete')pv();
  else w.addEventListener('load',pv);
  w.stxAnalytics={track:function(n,v){t('event',{name:n,value:v});}};
})();
</script>
`
}

/**
 * Generate custom analytics script
 */
function generateCustomScript(config: Partial<AnalyticsConfig>): string {
  const custom = config.custom
  if (!custom) {
    return ''
  }

  // Inline script takes precedence
  if (custom.inlineScript) {
    return `
<!-- Custom Analytics -->
<script>
${custom.inlineScript}
</script>
`
  }

  if (!custom.scriptUrl) {
    return ''
  }

  const attrs: string[] = []
  if (custom.scriptId) {
    attrs.push(`id="${escapeAttr(custom.scriptId)}"`)
  }

  if (custom.attributes) {
    for (const [key, value] of Object.entries(custom.attributes)) {
      attrs.push(`${escapeAttr(key)}="${escapeAttr(value)}"`)
    }
  }

  const attrsStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''

  return `
<!-- Custom Analytics -->
<script${attrsStr} src="${escapeAttr(custom.scriptUrl)}" defer></script>
`
}

/**
 * Inject analytics script into HTML
 * Scripts are injected just before </head> for optimal loading
 */
export function injectAnalytics(html: string, options: StxOptions): string {
  const analyticsScript = generateAnalyticsScript(options)

  if (!analyticsScript) {
    return html
  }

  // Check if document has a head tag
  if (!html.includes('</head>')) {
    // Try to inject before </body> as fallback
    if (html.includes('</body>')) {
      return html.replace('</body>', `${analyticsScript}</body>`)
    }
    // Append to end as last resort
    return html + analyticsScript
  }

  // Inject just before closing </head> tag
  return html.replace('</head>', `${analyticsScript}</head>`)
}

/**
 * Escape attribute value for safe HTML insertion
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Custom @analytics directive for explicit placement
 */
export const analyticsDirective: CustomDirective = {
  name: 'analytics',
  hasEndTag: false,
  handler: async (
    _content: string,
    _params: string[],
    context: Record<string, any>,
    _filePath: string,
  ): Promise<string> => {
    const options = context.__stx_config as StxOptions || {}
    return generateAnalyticsScript(options)
  },
}
