/** Keep ESM semantics and make hydration depend on completion, including top-level await. */
import { scanHtmlTags } from './html-masking'
import { scriptAttributes } from './script-attributes'
import { requiresAsyncBody } from './module-syntax'
import { stripBindingLiterals } from './strip-literals'

export function usesImportMeta(code: string): boolean {
  // Stripping strings and comments copies the whole script. An import token
  // must first be followed by a dot or a comment which could hide that dot.
  if (!/\bimport\s*(?:\.|\/[/*])/.test(code)) return false
  return /\bimport\s*\.\s*meta\b/.test(stripBindingLiterals(code))
}

const SCRIPT_SCOPE_TAGS = new Set(['script', 'template'])

/** Only actual element-position scripts; tag-looking prose/attributes are opaque. */
function pageScripts(html: string) {
  const tags = scanHtmlTags(html, SCRIPT_SCOPE_TAGS), scripts: Array<{ start: number, end: number, attrs: string, body: string, inert: boolean }> = []
  let templateDepth = 0
  for (let index = 0; index < tags.length; index++) {
    const tag = tags[index]!, name = tag.name.toLowerCase()
    if (name === 'template') templateDepth += tag.closing ? -1 : 1
    if (name !== 'script' || tag.closing) continue
    const close = tags[index + 1]
    if (close?.name.toLowerCase() !== 'script' || !close.closing) continue
    scripts.push({ start: tag.start, end: close.end, attrs: tag.attributes, body: html.slice(tag.end, close.start), inert: templateDepth > 0 })
  }
  return scripts
}

function renderAttributes(attrs: Map<string, string | true>): string {
  return [...attrs].map(([name, value]) => value === true ? name : `${name}="${value.replace(/"/g, '&quot;')}"`).join(' ')
}

/**
 * Module tags alone do not order completion when one uses top-level await.
 * Register an explicit promise before each affected module. Subsequent page
 * initializers join that promise chain while retaining their classic scope.
 * The runtime and SPA router await the final promise before hydration.
 * Component setup registrations remain synchronous: their bodies execute at
 * hydration, and structural clones must retain their native setup protocol.
 */
export function orderPageModules(html: string): string {
  const scripts = pageScripts(html).map(script => ({ ...script, attributes: scriptAttributes(script.attrs) }))
  if (scripts.some(({ attributes }) => attributes.has('data-stx-module-bootstrap'))) return html
  const candidates = scripts.filter(({ inert, attributes }) => {
    if (inert || attributes.has('data-stx-module-job') || attributes.has('data-stx-runtime') || attributes.has('data-stx-router')) return false
    const type = attributes.get('type')
    if (typeof type === 'string' && !['module', 'text/javascript', 'application/javascript'].includes(type.toLowerCase())) return false
    return [...attributes.keys()].some(name => /^data-stx-(?:scoped|modules|stores|(?:framework-)?composables)$/.test(name))
  })
  const needsModule = ({ attributes, body }: (typeof scripts)[number]): boolean => {
    if (attributes.get('type') === 'module' || usesImportMeta(body)) return true
    // The compiler emits page setup as a synchronous registration. Its
    // request-specific data and nested async callbacks cannot introduce
    // top-level await into the registration outside the setup function.
    if (attributes.has('data-stx-page-setup') || !/\bawait\b/.test(body)) return false
    try { return requiresAsyncBody(body) }
    catch { return false }
  }
  const firstModule = candidates.findIndex(needsModule)
  if (firstModule === -1) return html
  const batch = new Bun.CryptoHasher('md5').update(html).digest('hex').slice(0, 16)
  let result = '', cursor = 0, index = 0
  for (let i = firstModule; i < candidates.length; i++) {
    const script = candidates[i]
    const attrs = script.attributes
    const module = i === firstModule || needsModule(script)
    // Component scripts register setup functions for a later scope walk. They
    // must also work when compiled as a structural clone's synchronous setup.
    if (!module && (attrs.has('data-stx-owner') || attrs.has('data-stx-instance'))) continue
    result += html.slice(cursor, script.start)
    let body = script.body
    const src = attrs.get('src')
    if (typeof src === 'string') {
      attrs.delete('src')
      attrs.set('data-stx-source-url', src)
      body = `${module ? 'await' : 'return'} new Promise(function(resolve,reject){
var source=globalThis.__stxExecutingScript,script=document.createElement('script');
for(var attr of source.attributes)if(!['type','src','data-stx-module-job'].includes(attr.name))script.setAttribute(attr.name,attr.value);
${module ? "script.type='module';" : ''}
if(source.nonce)script.nonce=source.nonce;
script.src=new URL(source.getAttribute('data-stx-source-url'),document.baseURI).href;
script.onload=function(){${module ? '' : 'globalThis.__stxExecutingScript=__stxPreviousScript;'}resolve();};
script.onerror=function(error){${module ? '' : 'globalThis.__stxExecutingScript=__stxPreviousScript;'}reject(error);};
source.parentNode.insertBefore(script,source);
});`
    }
    if (module) {
      const job = `${batch}-${index++}`, key = JSON.stringify(job)
      const bootstrapAttrs = new Map(attrs)
      bootstrapAttrs.delete('type'); bootstrapAttrs.delete('async'); bootstrapAttrs.delete('defer')
      bootstrapAttrs.set('data-stx-module-bootstrap', true)
      result += `<script ${renderAttributes(bootstrapAttrs)}>
;(function(){
var resolve,reject,previous=globalThis.__stxPageModulesReady||Promise.resolve();
var ready=new Promise(function(ok,fail){resolve=ok;reject=fail;});
var job={previous:previous,resolve:resolve,reject:reject};
(globalThis.__stxModuleJobs||(globalThis.__stxModuleJobs={}))[${key}]=job;
job.fail=function(event){
  var script=document.querySelector('script[data-stx-module-job="${job}"]');
  if((event.target&&event.target===script)||(event.filename&&event.filename===(script&&script.src||document.URL))){
    window.removeEventListener('error',job.fail,true);
    if(globalThis.__stxExecutingScript===job.script)globalThis.__stxExecutingScript=job.previousScript;
    reject(event.error||new Error(event.message||'Page module failed to load'));
    delete globalThis.__stxModuleJobs[${key}];
  }
};
window.addEventListener('error',job.fail,true);
globalThis.__stxPageModulesReady=ready;
ready.catch(function(error){console.error('[stx] page module failed',error);});
})();
</script>`
      attrs.set('type', 'module'); attrs.delete('async'); attrs.delete('defer'); attrs.set('data-stx-module-job', job)
      result += `<script ${renderAttributes(attrs)}>
await globalThis.__stxModuleJobs[${key}].previous;
globalThis.__stxModuleJobs[${key}].previousScript=globalThis.__stxExecutingScript;
globalThis.__stxModuleJobs[${key}].script=document.querySelector('script[data-stx-module-job="${job}"]');
globalThis.__stxExecutingScript=globalThis.__stxModuleJobs[${key}].script;
${body}
globalThis.__stxExecutingScript=globalThis.__stxModuleJobs[${key}].previousScript;
window.removeEventListener('error',globalThis.__stxModuleJobs[${key}].fail,true);
globalThis.__stxModuleJobs[${key}].resolve();
delete globalThis.__stxModuleJobs[${key}];
</script>`
    }
    else {
      result += `<script ${renderAttributes(attrs)}>
;(function(__stxSource){
globalThis.__stxPageModulesReady=(globalThis.__stxPageModulesReady||Promise.resolve()).then(function(){
var __stxPreviousScript=globalThis.__stxExecutingScript;
globalThis.__stxExecutingScript=__stxSource;
${typeof src === 'string' ? body : `var __stxLive=document.createElement('script');
for(var __stxAttr of __stxSource.attributes)if(!['src','type'].includes(__stxAttr.name))__stxLive.setAttribute(__stxAttr.name,__stxAttr.value);
if(__stxSource.nonce)__stxLive.nonce=__stxSource.nonce;
__stxLive.textContent=${JSON.stringify(body).replace(/<\/script/gi, '<\\/script')};
var __stxFailure;
function __stxCapture(event){__stxFailure=event.error||new Error(event.message);}
window.addEventListener('error',__stxCapture);
try { __stxSource.parentNode.replaceChild(__stxLive,__stxSource); }
finally { window.removeEventListener('error',__stxCapture); globalThis.__stxExecutingScript=__stxPreviousScript; }
if(__stxFailure)throw __stxFailure;`}
});
})(document.currentScript);
</script>`
    }
    cursor = script.end
  }
  return result + html.slice(cursor)
}
