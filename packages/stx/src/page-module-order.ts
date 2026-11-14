/** Keep ESM semantics and make hydration depend on completion, including top-level await. */
import { scanHtmlTags } from './html-masking'
import { scriptAttributes } from './script-attributes'
import { requiresAsyncBody } from './module-syntax'
import { stripBindingLiterals } from './strip-literals'

export function usesImportMeta(code: string): boolean {
  return /\bimport\s*\.\s*meta\b/.test(stripBindingLiterals(code))
}

/** Only actual element-position scripts; tag-looking prose/attributes are opaque. */
function pageScripts(html: string) {
  const tags = scanHtmlTags(html), scripts: Array<{ start: number, end: number, attrs: string, body: string, inert: boolean }> = []
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
  const scripts = pageScripts(html)
  if (scripts.some(script => scriptAttributes(script.attrs).has('data-stx-module-bootstrap'))) return html
  const needsModule = (body: string): boolean => {
    if (usesImportMeta(body)) return true
    try { return requiresAsyncBody(body) }
    catch { return false } // Explicit external ESM imports are identified by their type attribute.
  }
  if (!scripts.some(script => needsModule(script.body) || scriptAttributes(script.attrs).get('type') === 'module')) return html
  const batch = new Bun.CryptoHasher('md5').update(html).digest('hex').slice(0, 16)
  let result = '', cursor = 0, started = false, index = 0
  for (const script of scripts) {
    const attrs = scriptAttributes(script.attrs), type = attrs.get('type')
    if (script.inert || attrs.has('data-stx-module-job') || attrs.has('data-stx-runtime') || attrs.has('data-stx-router')) continue
    if (typeof type === 'string' && !['module', 'text/javascript', 'application/javascript'].includes(type.toLowerCase())) continue
    const owned = [...attrs.keys()].some(name => /^data-stx-(?:scoped|modules|stores|(?:framework-)?composables)$/.test(name))
    if (!owned) continue
    const module = type === 'module' || needsModule(script.body)
    if (module) started = true
    if (!started) continue
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
