/* eslint-disable prefer-const, no-console, style/max-statements-per-line, general/prefer-template */
/**
 * STX Router - Canonical SPA Router
 *
 * Single source of truth for client-side navigation.
 * Injected via @stxRouter directive or auto-loaded with the signals runtime.
 *
 * Features:
 *   - Click interception for internal links
 *   - History API pushState navigation
 *   - View Transitions API with CSS fade fallback
 *   - <head> style swapping (prevents unstyled flash)
 *   - Smart script filtering (skip signals runtime, layout guards)
 *   - Page prefetching on hover
 *   - Response caching (5-minute TTL)
 *   - Active link class management (data-stx-link)
 *   - Loading indicator bar
 *   - Configurable via window.STX_ROUTER_OPTIONS or window.__stxRouterConfig
 */
let cachedRouterScript: string | undefined

function minifyRouterScript(source: string): string {
  try {
    const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true })
    return transpiler.transformSync(source)
      .replace(/\}(var |let |const |function )/g, '};$1')
      .trim()
  }
  catch {
    return source
  }
}

export function getRouterScript(): string {
  if (cachedRouterScript)
    return cachedRouterScript

  const source = `
;(function(){
  'use strict';
  var ROUTER_REV=7;
  if(window.__stxRouter&&window.__stxRouter.__rev===ROUTER_REV)return;

  // ── Configuration ──
  var defaults={container:'main',loadingClass:'stx-navigating',viewTransitions:true,cache:true,scrollToTop:true,prefetch:true,progress:true,progressColor:'#78dce8',progressHeight:'2px',interceptAllLinks:false,prefetchCacheMax:50,routeFocus:true,announceRoute:true,interceptForms:false};
  var o=Object.assign({},defaults,window.__stxRouterConfig||{},window.STX_ROUTER_OPTIONS||{});
  var containerSel=o.container;
  var debug=!!o.debug;
  function log(){if(debug&&typeof console!=='undefined'&&console.log)console.log.apply(console,arguments)}

  // ── Build skew (stacksjs/stx#1772) ──
  // The build that rendered THIS document, and therefore the build the runtime
  // executing right now came from. Under bun --watch a save restarts the server,
  // so the next navigation can fetch a fragment produced by a newer build; when
  // the scoped-script or binding format drifted between the two, the old runtime
  // cannot hydrate the new fragment — literal moustaches, dead bindings, stale
  // canvas. Sporadic, and never on a clean boot.
  //
  // Conservative on purpose: act only when BOTH ids are known. A missing id is
  // "no information", never "mismatch", so statically hosted output (no headers)
  // and older servers behave exactly as before.
  var buildMeta=document.querySelector('meta[name="stx-build"]');
  var loadedBuild=buildMeta?(buildMeta.getAttribute('content')||''):'';
  window.__stxBuild=loadedBuild;
  function isBuildSkew(incoming){
    return !!(loadedBuild&&incoming&&incoming!==loadedBuild);
  }
  function reloadForSkew(url,incoming){
    log('[router] build skew: page is',loadedBuild,'server is',incoming,'— full navigation');
    location.href=url;
  }
  function runViewTransition(callback){
    if(!o.viewTransitions||!document.startViewTransition)return false;
    try{
      var transition=document.startViewTransition(callback);
      var onAbort=function(err){log('[router] view transition aborted:',err&&err.message?err.message:err)};
      if(transition&&transition.ready&&transition.ready.catch)transition.ready.catch(onAbort);
      if(transition&&transition.finished&&transition.finished.catch)transition.finished.catch(onAbort);
      if(transition&&transition.updateCallbackDone&&transition.updateCallbackDone.catch)transition.updateCallbackDone.catch(onAbort);
      return true;
    }catch(err){
      log('[router] view transition unavailable:',err&&err.message?err.message:err);
      return false;
    }
  }

  // ── Progress bar (0→100% at top of viewport) ──
  // Native loading indicator baked into the router. Starts when navigation
  // begins, trickles up to ~90% during fetch, snaps to 100% + fades on
  // completion. Opt-out via window.__stxRouterConfig={progress:false}.
  var progEl=null;
  var progVal=0;
  var progTimer=null;
  function setProgress(v){
    progVal=v<0?0:(v>100?100:v);
    if(!progEl)return;
    progEl.style.opacity=progVal>0?'1':'0';
    progEl.style.transform='scaleX('+(progVal/100)+')';
  }
  function startProgress(){
    if(!o.progress||!progEl)return;
    if(progTimer){clearInterval(progTimer);progTimer=null}
    setProgress(8);
    progTimer=setInterval(function(){
      if(progVal>=90)return;
      // Asymptotic trickle — fast at first, slower near 90%
      var inc=Math.max(0.4,(90-progVal)*0.08);
      setProgress(progVal+inc);
    },160);
  }
  function finishProgress(){
    if(!o.progress||!progEl)return;
    if(progTimer){clearInterval(progTimer);progTimer=null}
    setProgress(100);
    // Fade out, then reset. Delays chosen so the "full" state is briefly
    // visible before the bar disappears.
    setTimeout(function(){
      if(!progEl)return;
      progEl.style.opacity='0';
      setTimeout(function(){progVal=0;if(progEl)progEl.style.transform='scaleX(0)'},260);
    },180);
  }

  var cache={};
  var prefetching={};
  var isNavigating=false;

  // LRU bookkeeping for cache/layoutCache/layoutGroupCache. Pre-fix
  // (stacksjs/stx#1719) these were plain objects with no eviction, so
  // hover-prefetch on a sidebar of 200 internal links retained ~10MB
  // of HTML strings for the page's lifetime. cacheOrder is a most-
  // recently-used-last list of keys; setCache pushes new entries and
  // evicts the oldest when length exceeds o.prefetchCacheMax (default
  // 50). touchCache promotes a key on cache-hit. We use a plain array
  // rather than a Map to keep the diff localized and the runtime
  // hand-minified shape consistent.
  var cacheOrder=[];
  function setCache(key,html,layout,group,title,cattrs){
    if(!(key in cache))cacheOrder.push(key);
    cache[key]=html;
    layoutCache[key]=layout;
    layoutGroupCache[key]=group;
    titleCache[key]=title||'';
    attrsCache[key]=cattrs||'';
    while(cacheOrder.length>o.prefetchCacheMax){
      var oldest=cacheOrder.shift();
      delete cache[oldest];
      delete layoutCache[oldest];
      delete layoutGroupCache[oldest];
      delete titleCache[oldest];
      delete attrsCache[oldest];
    }
  }
  // Apply a page title captured from the fragment response's X-STX-Title
  // header (URI-encoded) so SPA swaps keep document.title in sync with the
  // page — full-document swaps set the title from the <title> tag directly.
  function applyTitle(t){if(t){try{document.title=decodeURIComponent(t)}catch(e){document.title=t}}}
  // ── Container attributes ──
  // A fragment carries only the container's INNER content, so any layout that
  // lives on the destination's <main> itself (e.g. a centered auth page whose
  // <main> carries flex + min-h-[100dvh] + items-center) would be
  // dropped when injected into the persistent container. The server sends the
  // destination container's attributes in X-STX-Container-Attrs (URI-encoded);
  // we apply them here and track what we applied so navigating onward to a page
  // with a bare <main> clears them again. Attributes the router never applied
  // (the app's own id/data-stx-content hooks) are left untouched.
  var pendingContainerAttrs='';
  function parseContainerAttrs(attrStr){
    var map={};
    if(!attrStr)return map;
    var probe=document.createElement('div');
    probe.innerHTML='<i '+attrStr+'></i>';
    var src=probe.firstChild;
    if(src&&src.attributes){
      Array.prototype.forEach.call(src.attributes,function(a){map[a.name]=a.value});
    }
    return map;
  }
  function setContainerAttrs(el,map){
    if(!el)return;
    var prev=(el.getAttribute('data-stx-cattrs')||'').split(',');
    prev.forEach(function(n){if(n&&!(n in map))el.removeAttribute(n)});
    var names=[];
    for(var k in map){
      if(Object.prototype.hasOwnProperty.call(map,k)&&k!=='data-stx-cattrs'){
        el.setAttribute(k,map[k]);names.push(k);
      }
    }
    if(names.length)el.setAttribute('data-stx-cattrs',names.join(','));
    else el.removeAttribute('data-stx-cattrs');
  }
  function applyContainerAttrs(el,encoded){
    var attrStr='';
    if(encoded){try{attrStr=decodeURIComponent(encoded)}catch(e){attrStr=encoded}}
    setContainerAttrs(el,parseContainerAttrs(attrStr));
  }
  function touchCache(key){
    var i=cacheOrder.indexOf(key);
    if(i>=0){cacheOrder.splice(i,1);cacheOrder.push(key)}
  }
  function evictCache(key){
    var i=cacheOrder.indexOf(key);
    if(i>=0)cacheOrder.splice(i,1);
    delete cache[key];
    delete layoutCache[key];
    delete layoutGroupCache[key];
    delete titleCache[key];
    delete attrsCache[key];
  }

  // Extract top-level CSS blocks (rules AND @media blocks with nested braces).
  // The old regex ([^{}]+\{[^{}]*\}) silently dropped @media blocks because
  // it couldn't handle nested braces — causing responsive classes (lg:, md:)
  // to vanish after SPA navigation.
  function extractCssBlocks(css){
    var blocks=[];
    var i=0;
    var len=css.length;
    while(i<len){
      // Skip whitespace
      while(i<len&&(css[i]===' '||css[i]==='\\n'||css[i]==='\\r'||css[i]==='\\t'))i++;
      if(i>=len)break;
      // Find the start of a block (first {)
      var blockStart=i;
      var bracePos=css.indexOf('{',i);
      if(bracePos===-1)break;
      // Walk forward tracking brace depth to find the matching close
      var depth=0;
      var j=bracePos;
      while(j<len){
        if(css[j]==='{')depth++;
        else if(css[j]==='}'){depth--;if(depth===0){j++;break}}
        j++;
      }
      if(depth!==0)break;
      blocks.push(css.slice(blockStart,j).trim());
      i=j;
    }
    return blocks;
  }

  function mergeCrosswindCSS(existing,incoming){
    var blocks=extractCssBlocks(incoming);
    var newBlocks=[];
    for(var bi=0;bi<blocks.length;bi++){
      if(existing.indexOf(blocks[bi])===-1)newBlocks.push(blocks[bi]);
    }
    if(newBlocks.length>0)return existing+'\\n'+newBlocks.join('\\n');
    return null;
  }

  function getContainer(){
    return document.querySelector(containerSel)||document.querySelector('[data-stx-content]')||document.querySelector('main');
  }

  // ── Navigation ──
  // Layout group detection — layouts in the same group share a <main> container.
  // Only truly different layout groups trigger a full page reload.
  var layoutCache={};
  var layoutGroupCache={};
  var titleCache={};
  var attrsCache={};
  // Track executed script hashes to prevent redeclaration errors on navigation.
  // Layout-level scripts (theme, nav setup) execute on initial page load and
  // should NOT re-execute when navigating to another page with the same layout.
  var executedScriptHashes={};

  // ── Re-execution contract (stacksjs/stx#1773) ──
  // Whether a generated script may run again after an SPA swap used to be
  // SNIFFED from its source: does it start with '(' or ';', or mention
  // window.stx.mount. That is a property of the emitted shape, not of intent,
  // so every change to how scripts are wrapped was one edit away from silently
  // reclassifying them — and the symptom of getting it wrong is a component
  // that renders completely dead (literal moustaches, stuck :show) only on a
  // REVISIT, because nav-away already disposed its scope.
  //
  // Emitters now declare it: data-stx-run="always" on self-contained scope
  // IIFEs and mount() wrappers, which own their scope and whose registration
  // _cleanupContainer removed on the way out. Anything unstamped falls back to
  // the old sniff, so a page rendered by an older server behaves exactly as
  // before.
  //
  // The sniff itself now asks what the script REGISTERS rather than how it is
  // spelled (#1828). cleanupContainer deletes window.stx._scopes entries,
  // element disposers and destroy hooks on the way out, so the scripts that
  // must run again are exactly the ones that put a scope back. That is
  // detectable; a leading character is not.
  //
  // Deliberately NOT "strip leading comments, then test the first character",
  // which is the obvious repair and is wrong in the expensive direction. Three
  // emitters open with a comment and MUST NOT re-run: the animation scripts
  // register matchMedia and DOMContentLoaded listeners plus an
  // IntersectionObserver, and the STX lifecycle runtime owns a Map of live
  // instances. Comment-stripping would flip all three to re-running on every
  // navigation, leaking a listener and an observer each time and resetting the
  // instance registry — trading a silent missing component for a silent leak.
  var REGISTERS_SCOPE=/window\\.stx\\.mount|_scopes\\s*\\[|\\.initScope\\s*\\(|__stxComponentFactories\\s*\\[/;
  function runsAlways(declared, code){
    if(declared==='always')return true;
    if(declared==='once')return false;
    if(REGISTERS_SCOPE.test(code))return true;
    var head=code.trimStart();
    return head.charAt(0)==='('||head.charAt(0)===';';
  }
  function hashScript(code){
    var h=0;for(var i=0;i<code.length;i++){h=((h<<5)-h)+code.charCodeAt(i);h|=0}
    return h;
  }
  function hasStaticImport(code){
    return /(?:^|\\n)[ \\t]*import(?:[ \\t]+|[{*'"])/.test(code);
  }
  function generatedSetupName(code){
    var match=code.match(/function (__stx_setup_[A-Za-z0-9_]+)\\s*\\(/);
    return match?match[1]:'';
  }
  // Does this fetched DOCUMENT carry the signals runtime?
  //
  // Unlike a fragment, a document holds the answer directly, so there is
  // nothing to infer from markers or ask the server for: look for the script.
  // Both emitted shapes carry data-stx-runtime — inline, and the serve-mode
  // src="/_stx/runtime.js" — with the content sniff behind it for a document
  // rendered by a server old enough not to stamp the attribute.
  function documentShipsRuntime(doc,html){
    if(doc&&doc.querySelector&&doc.querySelector('script[data-stx-runtime]'))return true;
    return html.indexOf("'use strict';var cloakStyle")!==-1
      ||(html.indexOf('_cleanupContainer')!==-1&&html.indexOf('signals runtime loading')!==-1);
  }
  function isSignalsRuntimeScript(script,code){
    return !!(script&&script.hasAttribute&&script.hasAttribute('data-stx-runtime'))
      ||(code.indexOf('_cleanupContainer')!==-1&&code.indexOf('signals runtime loading')!==-1)
      ||code.indexOf("'use strict';var cloakStyle")!==-1;
  }
  // A fragment never carries the signals runtime: the server strips the runtime
  // IIFE out of it, and every re-execution path here filters it out again. So a
  // page that never needed a runtime cannot hydrate a fragment that does — the
  // setup function would be defined but never invoked, scope IIFEs throw while
  // destructuring window.stx, and every x-cloak element stays display:none
  // forever against the cloak style shipped on EVERY page. Hand those off to a
  // real navigation, which loads the destination's own runtime (#1809).
  //
  // The SERVER decides this now, and says so in X-STX-Runtime, which travels
  // into the fragment marker as rt=1 / rt=0 so it survives the prefetch cache.
  // It is answering a question it knows the answer to exactly — did I put a
  // runtime in this page — where the router could only guess from markup.
  //
  // Guessing missed a whole page shape (#1827). Every marker below originates in
  // a client SCRIPT, so a page with reactive syntax and no script anywhere — a
  // <script server>-only login form built from :if / x-model / :disabled — emits
  // none of them, while the server ships it the runtime. Whatever root marker it
  // does get lands on <body>, which a fragment excludes by construction. So
  //   <p :if="error" x-cloak>Invalid credentials</p>
  // swapped into a runtime-less page keeps the x-cloak the server stamped on it,
  // and only the runtime ever removes that: server-rendered text, in the DOM, at
  // display:none forever.
  //
  // The same held for x-data on the routed container, whose scope attribute is
  // hoisted out of the fragment body into X-STX-Container-Attrs. Asking the
  // server covers both without either being enumerated.
  //
  // The sniff stays as the fallback for a server too old to declare it. Its
  // discriminators matter. x-cloak and data-stx-scoped are NOT usable: each
  // fragment inlines the head styles, cloak rule included, and the appearance
  // bootstrap emits a self-contained data-stx-scoped script on pages with no
  // reactivity at all. A bare window.stx is not usable either — the server
  // prepends a _latestSetup=null clear script to every fragment. Any of those
  // would make this always true and disable SPA navigation everywhere.
  function fragmentNeedsRuntime(frag,declared){
    if(declared==='1')return true;
    if(declared==='0')return false;
    if(frag.indexOf('__stx_setup_')!==-1
      ||frag.indexOf('data-stx-scope=')!==-1
      ||frag.indexOf('data-stx-reactive')!==-1
      ||/=\\s*window\\.stx\\s*;/.test(frag))return true;
    var content=stripInertRegions(frag);
    return BARE_DIRECTIVE.test(content)||content.indexOf('{{')!==-1;
  }
  // Documentation is both the largest population of runtime-less pages and the
  // likeliest to contain directive syntax as literal CONTENT, so the fallback
  // reads past the regions where that content lives. A page of stx examples must
  // not full-reload on every hop through the docs — that is the regression
  // #1809 existed to remove.
  function stripInertRegions(frag){
    return frag
      .replace(new RegExp('<scr'+'ipt\\\\b[\\\\s\\\\S]*?<\\\\/scr'+'ipt>','gi'),'')
      .replace(/<style\\b[\\s\\S]*?<\\/style>/gi,'')
      .replace(/<pre\\b[\\s\\S]*?<\\/pre>/gi,'')
      .replace(/<code\\b[\\s\\S]*?<\\/code>/gi,'')
      .replace(/<!--[\\s\\S]*?-->/g,'');
  }
  // Anchored on the whitespace before an attribute name and the = that follows,
  // so it reads attribute POSITIONS rather than characters. Bare ':' and '@' are
  // everywhere in ordinary content — 'xlink:href', 'background: red', '10:00',
  // an email address — and none of those sit in that position.
  //
  // The x- arm is deliberately open rather than a list of known directives:
  // x-attr is a GENERIC binding prefix, so x-href / x-src / x-value / x-alt bind
  // exactly like x-text does. Measured over the 339 rendered docs pages, the
  // open form costs nothing over an allowlist (3 matches either way, all three
  // of them pages the CURRENT four-marker sniff already matches because they
  // document its marker names) while covering directives an allowlist forgets.
  var BARE_DIRECTIVE=/\\s(?::[a-z][\\w-]*|@[a-z][\\w.-]*|x-[a-z][\\w-]*)\\s*=\\s*["']/i;
  // The fragment marker doubles as the carrier for the server's declaration.
  // Encoding it in the HTML rather than threading a parameter keeps it inside
  // the one value that already reaches swap() through every path, the prefetch
  // cache included.
  function fragmentMarker(declared){
    return '<!--stx-fragment'+(declared==='true'?' rt=1':declared==='false'?' rt=0':'')+'-->';
  }
  // Record scripts from the initial page load
  document.querySelectorAll('script').forEach(function(s){
    var text=s.textContent||'';
    if(text.trim()&&!s.hasAttribute('src'))executedScriptHashes[hashScript(text)]=1;
  });
  function cacheKey(url){
    // Base is the CURRENT document, not the origin root: a relative key like
    // '?status=resolved' on /dashboard must cache as /dashboard?status=resolved,
    // not /?status=resolved (#1777).
    var u=new URL(url,location.href);
    return u.pathname+u.search;
  }
  // Keep SPA fetches inside the active locale (/en/... when viewing English).
  function withCurrentLocale(href){
    var d=window.__stxI18n;
    if(d&&typeof d.localizeHref==='function')return d.localizeHref(href);
    return href;
  }
  function defaultLayoutGroup(layout){
    if(!layout)return 'app';
    var clean=String(layout).replace(/\\\\/g,'/');
    var parts=clean.split('/').filter(Boolean);
    var idx=parts.lastIndexOf('layouts');
    var part=idx>=0?parts[idx+1]:parts[parts.length-1];
    return part?part.replace(/\\.stx$/i,''):'app';
  }
  function getCurrentLayoutGroup(){
    var meta=document.querySelector('meta[name="stx-layout-group"]');
    if(meta&&meta.getAttribute('content'))return meta.getAttribute('content');
    var layout=document.querySelector('meta[name="stx-layout"]');
    return defaultLayoutGroup(layout?layout.getAttribute('content'):'');
  }
  function getDocLayoutGroup(doc,layout){
    var meta=doc&&doc.querySelector?doc.querySelector('meta[name="stx-layout-group"]'):null;
    return meta&&meta.getAttribute('content')?meta.getAttribute('content'):defaultLayoutGroup(layout||'');
  }
  function checkLayoutChange(newLayout,targetUrl,newGroup){
    var currentLayout=document.querySelector('meta[name="stx-layout"]');
    var curLayoutName=currentLayout?currentLayout.getAttribute('content'):'';
    var curGroup=getCurrentLayoutGroup();
    var nextGroup=newGroup||defaultLayoutGroup(newLayout);
    log('[router] layout check: current='+curLayoutName+'('+curGroup+') new='+(newLayout||'')+'('+nextGroup+')');
    // Different layout GROUP (e.g. app → auth): full reload
    if(curGroup!==nextGroup){
      log('[router] layout group change:',curGroup,'→',nextGroup,'— full reload to:',targetUrl);
      return true;
    }
    // Same group but different SPECIFIC layout (e.g. layouts/app → layouts/coach):
    // full body swap so nav, sidebar, and other layout-level elements update
    if(curLayoutName && newLayout && curLayoutName!==newLayout){
      log('[router] layout name change:',curLayoutName,'→',newLayout,'— full body swap');
      return true;
    }
    return false;
  }

  function shouldUseFragmentResponse(){
    return containerSel==='main'||containerSel==='[data-stx-content]';
  }

  // Write the address bar. The mode travels in the same slot as the legacy
  // pushState boolean: false still means "do not touch history", true still
  // pushes, and the string 'replace' replaces. Threading a fourth argument
  // through swap() to each of the three history sites would have been the
  // alternative (#1807).
  function writeHistory(mode,href){
    if(mode==='replace')history.replaceState({},'',href);
    else history.pushState({},'',href);
  }

  // Second arg accepts the legacy pushState boolean OR an options object
  // { replace }. Callers inside this file still pass the boolean.
  function navigate(url,pushState,force){
    if(pushState&&typeof pushState==='object')pushState=pushState.replace?'replace':true;
    // Lang-picker passes force=true with an already-localized path (/en/...).
    // Re-localizing would map it back to the *current* locale and no-op.
    if(!force) url=withCurrentLocale(url);
    log('[router] navigate() called:',url,'isNavigating:',isNavigating);
    if(isNavigating)return Promise.resolve(false);
    // Resolve against the current document URL, matching native <a> semantics.
    // With location.origin as the base, any relative href ('?status=resolved',
    // '#anchor', './sibling') resolved to the SITE ROOT — so filter tabs,
    // pagination and sort links silently bounced users to the landing page once
    // the SPA interceptor was active (#1777).
    var t=new URL(url,location.href);

    if(t.origin!==location.origin){location.href=url;return Promise.resolve(false)}

    if(t.pathname===location.pathname&&t.hash){
      if(pushState!==false)writeHistory(pushState,t.href);
      var el=document.querySelector(t.hash);
      if(el)el.scrollIntoView({behavior:'smooth'});
      return Promise.resolve(true);
    }

    // Skip if user clicks a link to the page they're already on. We
    // deliberately allow popstate (pushState===false) through because
    // the browser has already updated location.href to the popped
    // entry — without this allowance, hitting back would early-return
    // and the visible page content would be left frozen on the
    // forward-navigation page.
    if(pushState!==false&&t.href===location.href&&!t.hash&&!force)return Promise.resolve(false);

    isNavigating=true;
    document.body.classList.add(o.loadingClass);
    startProgress();

    var targetHref=t.href;
    var targetPath=cacheKey(url);
    var targetHash=t.hash;

    function done(){isNavigating=false;document.body.classList.remove(o.loadingClass);finishProgress()}

    if(o.cache&&cache[targetPath]&&!force){
      // Cache hit → promote in LRU order so this entry survives eviction
      // longer than other entries that haven't been touched.
      touchCache(targetPath);
      if(checkLayoutChange(layoutCache[targetPath],url,layoutGroupCache[targetPath])){
        // Layout changed — fetch full page and do full document swap
        log('[router] cache hit but layout changed — fetching full page');
        return fetch(url,{headers:{'Accept':'text/html'}}).then(function(r){
          if(!r.ok)throw new Error(r.status);
          return r.text();
        }).then(function(html){
          log('[router] full page fetched from cache path, len:',html.length);
          pendingLayoutDecl={layout:layoutCache[targetPath]||'',group:layoutGroupCache[targetPath]||''};
          return swap(html,targetPath,pushState,targetHash);
        }).catch(function(err){
          console.error('[router] full page fetch error:',err);
          location.href=url;
        }).finally(done);
      }
      pendingContainerAttrs=attrsCache[targetPath]||'';
      pendingLayoutDecl=null;
      return Promise.resolve(swap(cache[targetPath],targetPath,pushState,targetHash)).then(function(){
        applyTitle(titleCache[targetPath]);
        return true;
      }).finally(done);
    }
else {
      if(force&&cache[targetPath])evictCache(targetPath);
      // First fetch as fragment (SPA mode) when the configured container is
      // the page content. Custom app-shell containers need full documents so
      // the router does not inject a <main> fragment into the wrong element.
      var wantsFragment=shouldUseFragmentResponse();
      return fetch(url,{headers:wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'}}).then(function(r){
        if(!r.ok)throw new Error(r.status);
        // A route guard answered with a redirect and fetch followed it
        // transparently, so r.ok is the DESTINATION's 200 and this markup
        // belongs to r.url — not to the path that was requested. Without
        // retargeting, an auth guard's /login body is swapped in while the
        // address bar, the history entry and the cache key all still read
        // /dashboard: the user sees a login form at a URL that claims to be
        // the page they asked for, and reloading bounces them again (#1849).
        if(r.redirected&&r.url){
          var rd=new URL(r.url,location.href);
          // A guard that sends you off-origin (a hosted IdP) cannot be
          // resolved by swapping a fragment — hand it to the browser.
          if(rd.origin!==location.origin){location.href=r.url;return null}
          log('[router] guard redirected:',url,'->',rd.pathname);
          url=rd.pathname+rd.search+rd.hash;
          targetPath=cacheKey(url);
          targetHash=rd.hash;
        }
        // Before anything is parsed or swapped: a fragment from a different
        // build must not be handed to this page's runtime (#1772).
        var incomingBuild=r.headers.get('X-STX-Build')||'';
        if(isBuildSkew(incomingBuild)){reloadForSkew(url,incomingBuild);return null}
        var isFragment=wantsFragment&&r.headers.get('X-STX-Fragment')==='true';
        var newLayout=r.headers.get('X-STX-Layout')||'';
        var newGroup=r.headers.get('X-STX-Layout-Group')||'';
        var newTitle=r.headers.get('X-STX-Title')||'';
        var newCAttrs=r.headers.get('X-STX-Container-Attrs')||'';
        var newRuntime=r.headers.get('X-STX-Runtime')||'';
        // Layout change? Fetch the FULL page (no X-STX-Router header) and do full document swap
        if(isFragment&&checkLayoutChange(newLayout,url,newGroup)){
          log('[router] layout change — fetching full page for document swap');
          return fetch(url,{headers:{'Accept':'text/html'}}).then(function(fullRes){
            log('[router] full page fetched:',fullRes.status,'ok:',fullRes.ok);
            if(!fullRes.ok)throw new Error(fullRes.status);
            return fullRes.text().then(function(html){
              log('[router] full page html length:',html.length);
              return{html:html,isFragment:false,layout:newLayout,layoutGroup:newGroup,title:newTitle};
            });
          });
        }
        return r.text().then(function(html){return{html:html,isFragment:isFragment,layout:newLayout,layoutGroup:newGroup,title:newTitle,containerAttrs:newCAttrs,runtime:newRuntime}});
      }).then(function(result){
        if(!result)return;
        if(result.isFragment)result.html=fragmentMarker(result.runtime)+result.html;
        if(o.cache)setCache(targetPath,result.html,result.layout,result.layoutGroup,result.title,result.containerAttrs);
        pendingContainerAttrs=result.isFragment?(result.containerAttrs||''):'';
        pendingLayoutDecl=result.isFragment?null:{layout:result.layout||'',group:result.layoutGroup||''};
        return Promise.resolve(swap(result.html,targetPath,pushState,targetHash)).then(function(){
          // Fragment swaps carry no <head>; apply the title from the header.
          // Full-document swaps already set document.title from the <title> tag.
          if(result.isFragment)applyTitle(result.title);
          return true;
        });
      }).catch(function(err){
        console.error('[router] fetch error:',err);
        location.href=url;
      }).finally(done);
    }
  }

  // A full document is only safe to partial-swap into the stx shell if it is
  // itself stx-rendered. Pages served by another engine mounted on the same
  // origin (e.g. a docs/blog generator) carry none of these markers; swapping
  // their <main> + styles into the stx shell corrupts the layout. Detect them
  // and hand off to a native full navigation instead.
  function isStxDocument(html){
    return html.indexOf('name="stx-layout"')!==-1
      ||html.indexOf('__stxRouterConfig')!==-1
      ||html.indexOf('data-stx-content')!==-1;
  }

  // The layout and group the SERVER declared for the document about to be
  // swapped in. Set immediately before each swap() call by whichever path
  // fetched it, and consumed once.
  //
  // Threaded this way rather than as a swap() parameter, matching
  // pendingContainerAttrs — see the note above writeHistory about the cost of
  // adding an argument to swap() and its three call sites (#1807).
  var pendingLayoutDecl=null;
  // ── Focus and route announcement ──
  // A fragment swap replaces content without a document load, so the browser
  // does none of what it normally does for a navigation. Focus stays on a link
  // that no longer exists, which the browser resets to <body> — a keyboard user
  // is silently returned to the top of the tab order — and a screen reader says
  // nothing at all, so there is no signal the page changed. Neither is fixable
  // from app code, because only the router knows a navigation happened (#1862).
  function routeAnnouncer(){
    var el=document.getElementById('stx-route-announcer');
    if(el)return el;
    el=document.createElement('div');
    el.id='stx-route-announcer';
    el.setAttribute('aria-live','polite');
    el.setAttribute('role','status');
    el.setAttribute('aria-atomic','true');
    // Visually hidden but still ANNOUNCED. display:none and visibility:hidden
    // are both skipped by screen readers, which would make this a silent no-op
    // that looks correct in the DOM.
    el.style.cssText='position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
    document.body.appendChild(el);
    return el;
  }

  function announceRoute(){
    if(o.announceRoute===false)return;
    var c=getContainer();
    var h=c&&c.querySelector?c.querySelector('h1'):null;
    // The heading names the destination better than the title, which often
    // carries a site-name suffix. Falls back to the title, then gives up
    // rather than announcing an empty string.
    var label=(h&&(h.textContent||'').trim())||document.title||'';
    if(!label)return;
    var el=routeAnnouncer();
    // Cleared first: several screen readers ignore a live-region update whose
    // text is identical to what is already there, so navigating between two
    // pages with the same heading would announce only the first.
    el.textContent='';
    el.textContent=label;
  }

  function focusAfterNavigation(hash){
    if(o.routeFocus===false)return;
    var target=null;
    if(hash){try{target=document.querySelector(hash)}catch(e){target=null}}
    if(!target)target=getContainer();
    if(!target||!target.focus)return;
    // The container is not naturally focusable. tabindex="-1" makes it
    // programmatically focusable without inserting it into the tab order.
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    // preventScroll because scroll position is already decided just above —
    // focusing would otherwise fight scrollToTop and the hash scrollIntoView.
    try{target.focus({preventScroll:true})}catch(e){try{target.focus()}catch(e2){}}
  }

  function swap(html,url,pushState,hash){
    var fragMark=/^<!--stx-fragment(?: rt=([01]))?-->/.exec(html);
    var isFragment=!!fragMark;
    var declaredRuntime=fragMark&&fragMark[1]?fragMark[1]:'';
    if(isFragment)html=html.slice(fragMark[0].length);
    if(!isFragment&&!isStxDocument(html)){log('[router] non-stx document — full navigation to:',url);location.href=url;return Promise.resolve(false)}
    var currentContent=getContainer();
    log('[router] swap: isFragment='+isFragment+' container='+!!currentContent+' tag='+(currentContent&&currentContent.tagName)+' selector='+containerSel+' htmlLen='+html.length);
    if(!currentContent){log('[router] no container — falling back');location.href=url;return Promise.resolve(false)}

    // Fragment mode: server returned just the page content (no document wrapper)
    if(isFragment){
      // Before _cleanupContainer, not after: handing off later would dispose
      // the OUTGOING page's scopes and then reload anyway. Inside doFragSwap
      // would be later still — innerHTML is already replaced by then.
      if(!window.stx&&fragmentNeedsRuntime(html,declaredRuntime)){
        log('[router] fragment needs the signals runtime and this page has none — full navigation to:',url);
        location.href=url;
        return Promise.resolve(false);
      }
      if(window.stx&&window.stx._cleanupContainer)window.stx._cleanupContainer(currentContent);
      function doFragSwap(){
        // Extract scripts from fragment before injecting HTML
        var fragScripts=[];
        var fragScriptId=0;
        var fragStyles=[];
        var fragCrosswindHrefs=[];
        var fragCrosswindCSS=null;
        var cleanFrag=html.replace(new RegExp('<scr'+'ipt\\\\b([^>]*)>([\\\\s\\\\S]*?)<\\\\/scr'+'ipt>','gi'),function(m,attrs,code){
          // A data block is not code, and everything below this line assumes it
          // is: the body gets stashed in fragScripts, re-emitted as a pending
          // placeholder, then wrapped in braces and executed. Wrapping a JSON
          // object in braces reparses it as a labelled block, so its first ':'
          // is a SyntaxError on every single fragment swap
          // (stacksjs/stx#1801). @structuredData renders at its call site,
          // which inside a layout is @section('content') — i.e. in the routed
          // container — so the natural way to write it hit this.
          //
          // Left exactly as found rather than stripped: crawlers read
          // structured data wherever it sits, and the browser will not execute
          // a non-JS type anyway. Mirrors prepareRoutedBodyScripts' notion of
          // executable, which this path never had.
          var typeMatch=attrs.match(/\\btype\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
          var scriptType=((typeMatch&&(typeMatch[1]||typeMatch[2]||typeMatch[3]))||'').trim().toLowerCase();
          if(scriptType&&scriptType!=='text/javascript'&&scriptType!=='application/javascript'&&scriptType!=='module')return m;
          if(code&&code.trim()&&!isSignalsRuntimeScript({hasAttribute:function(name){return name==='data-stx-runtime'&&attrs.indexOf('data-stx-runtime')!==-1}},code)){
            var slot='fragment-'+(++fragScriptId);
            var scoped=/(?:^|\\s)data-stx-scoped(?:\\s|=|$)/i.test(attrs);
            var runDecl=(attrs.match(/data-stx-run\\s*=\\s*["']?(always|once)["']?/i)||[])[1];
            fragScripts.push({text:code,slot:slot,setupName:generatedSetupName(code),scoped:scoped,run:runDecl?runDecl.toLowerCase():''});
            // Retain scoped setup code in its inert placeholder. A placeholder
            // inside template.content is unreachable through document, so the
            // repeated component runtime must execute it for each clone.
            return '<scr'+'ipt type="application/stx-pending" data-stx-route-script="'+slot+'"'
              +(scoped?' data-stx-scoped':'')
              +(runDecl?' data-stx-run="'+runDecl.toLowerCase()+'"':'')
              +'>'+code+'<\\/scr'+'ipt>';
          }
          return '';
        });
        cleanFrag=cleanFrag.replace(new RegExp('<sty'+'le\\\\b([^>]*)>([\\\\s\\\\S]*?)<\\\\/sty'+'le>','gi'),function(m,attrs,css){
          if(attrs.indexOf('data-crosswind')!==-1){
            fragCrosswindCSS=css;
          }else{
            fragStyles.push({attrs:attrs,css:css});
          }
          return '';
        });
        cleanFrag=cleanFrag.replace(new RegExp('<link\\\\b([^>]*)>','gi'),function(m,attrs){
          if(attrs.indexOf('data-crosswind')===-1)return m;
          var hrefMatch=attrs.match(/\\bhref=(["'])(.*?)\\1/i);
          if(hrefMatch&&hrefMatch[2])fragCrosswindHrefs.push(hrefMatch[2]);
          return '';
        });
        // Remove old page styles (not crosswind — that gets merged)
        document.querySelectorAll('style[data-stx-page]').forEach(function(s){s.remove()});
        // Merge crosswind CSS from fragment into existing crosswind style
        if(fragCrosswindCSS){
          var curCrosswind=document.querySelector('head style[data-crosswind]');
          if(curCrosswind){
            var merged=mergeCrosswindCSS(curCrosswind.textContent||'',fragCrosswindCSS);
            if(merged)curCrosswind.textContent=merged;
          }else{
            var cw=document.createElement('style');
            cw.setAttribute('data-crosswind','generated');
            cw.textContent=fragCrosswindCSS;
            document.head.appendChild(cw);
          }
        }
        fragCrosswindHrefs.forEach(function(href){
          var absolute=new URL(href,location.href).href;
          var exists=false;
          document.querySelectorAll('head link[data-crosswind][href]').forEach(function(link){
            if(new URL(link.getAttribute('href'),location.href).href===absolute)exists=true;
          });
          if(exists)return;
          var link=document.createElement('link');
          link.setAttribute('data-crosswind','generated');
          link.setAttribute('rel','stylesheet');
          link.setAttribute('href',href);
          document.head.appendChild(link);
        });
        // Add new page styles
        fragStyles.forEach(function(s){
          var el=document.createElement('style');
          el.textContent=s.css;
          el.setAttribute('data-stx-page','');
          document.head.appendChild(el);
        });
        // Swap content — apply the destination container's own attributes first
        // so the incoming markup lands in a correctly-laid-out container instead
        // of flashing (or sticking) unstyled.
        applyContainerAttrs(currentContent,pendingContainerAttrs);
        currentContent.innerHTML=cleanFrag;
        // Remove old page scripts
        document.querySelectorAll('script[data-stx-page]').forEach(function(s){s.remove()});
        if(pushState!==false)writeHistory(pushState,url+(hash||''));
        updateNav(url);
        updateActiveLinks();
        if(o.scrollToTop&&!hash)window.scrollTo({top:0,behavior:'instant'});
        else if(hash){var el=document.querySelector(hash);if(el)el.scrollIntoView({behavior:'smooth'})}
        window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));
        // Before page scripts run, so a page that focuses its own control on
        // mount still wins — its script executes after this.
        focusAfterNavigation(hash);
        // Deferred a tick because the title is applied by the caller after this
        // swap resolves, and the announcement should read the new one.
        setTimeout(announceRoute,0);
        // Execute page scripts FIRST — they define setup functions and set _latestSetup
        log('[router] frag scripts:', fragScripts.length);
        document.querySelectorAll('script[data-stx-page]').forEach(function(s){s.remove()});
        fragScripts.sort(function(a,b){return (a.setupName?1:0)-(b.setupName?1:0)});
        fragScripts.forEach(function(entry){
          var code=entry.text;
          log('[router] exec script len:', code.length, 'has __stx_setup:', code.indexOf('__stx_setup')>-1);
          var placeholder=document.querySelector('script[data-stx-route-script="'+entry.slot+'"]');
          var nestedScopedTemplate=false;
          var scopedLoopSetup=false;
          if(entry.scoped&&placeholder){
            document.querySelectorAll('template').forEach(function(template){
              if(template.contains(placeholder)||(template.content&&template.content.contains(placeholder)))
                nestedScopedTemplate=true;
            });
            var loopRoot=placeholder.previousSibling;
            while(loopRoot&&(
              (loopRoot.nodeType===Node.TEXT_NODE&&!(loopRoot.textContent||'').trim())
              ||loopRoot.nodeType===Node.COMMENT_NODE
            ))loopRoot=loopRoot.previousSibling;
            if(loopRoot&&loopRoot.nodeType===Node.ELEMENT_NODE&&loopRoot.hasAttribute('data-stx-scope')
              &&(loopRoot.hasAttribute(':for')||loopRoot.hasAttribute('@for')||loopRoot.hasAttribute('x-for'))){
              var loopScopeId=loopRoot.getAttribute('data-stx-scope');
              scopedLoopSetup=!!loopScopeId&&code.indexOf(loopScopeId)!==-1;
            }
          }
          if(entry.scoped&&(!placeholder||!placeholder.parentNode||nestedScopedTemplate||scopedLoopSetup)){
            log('[router] leaving loop-scoped script for component hydration');
            return;
          }
          // Skip scripts that were already executed (layout-level partials
          // like theme.stx, stores.stx, nav.stx). Their top-level const/let
          // declarations would throw "Identifier has already been declared"
          // on re-execution. Setup functions (__stx_setup_) must always
          // re-execute because each page has its own setup.
          var h=hashScript(code);
          var isSetup=code.indexOf('__stx_setup_')!==-1;
          // Self-contained scope scripts must re-execute on every navigation:
          // they own their scope, won't collide with prior runs, and
          // _cleanupContainer deleted their entry from window.stx._scopes on
          // the way out. Skipping one leaves the page leaf with no scope
          // registered — bindIf/@event never re-bind and every :if branch
          // stays visible at once. Declared by the emitter via data-stx-run,
          // sniffed only as a fallback (#1773).
          var isAlreadyScoped=runsAlways(entry.run,code);
          if(!isSetup&&!isAlreadyScoped&&executedScriptHashes[h]){
            log('[router] skipping already-executed script (hash dedup)');
            return;
          }
          executedScriptHashes[h]=1;
          var ns=document.createElement('script');
          var hasImport=hasStaticImport(code);
          if(hasImport){
            ns.type='module';
          }
          ns.textContent=(hasImport||isAlreadyScoped)?code:'{'+code+'}';
          ns.setAttribute('data-stx-page','');
          if(placeholder&&placeholder.parentNode){
            ns.setAttribute('data-stx-positioned','');
            placeholder.parentNode.replaceChild(ns,placeholder);
          }else{
            document.body.appendChild(ns);
          }
        });
        // Guarded: the router ships on every page, the signals runtime only on
        // pages that have a client script. log() is debug-gated but its
        // ARGUMENTS are evaluated at the call site regardless, so an unguarded
        // read here threw on every runtime-less page — aborting the swap and
        // falling back to a full document load (#1809).
        log('[router] scripts done. _latestSetup:', !!(window.stx&&window.stx._latestSetup));
        // THEN fire stx:load — now _latestSetup is set and processElement has the right scope
        window.dispatchEvent(new Event('stx:load'));
      }
      return new Promise(function(resolve,reject){
        function completeFragSwap(){
          try{
            doFragSwap();
            resolve(true);
          }catch(err){reject(err)}
        }
        if(runViewTransition(completeFragSwap)){}
        else{currentContent.style.transition='opacity 0.12s ease-out';currentContent.style.opacity='0';setTimeout(function(){completeFragSwap();currentContent.style.opacity='1';setTimeout(function(){currentContent.style.transition=''},150)},120)}
      });
    }

    // Full document mode: parse with DOMParser and extract container content
    var parser=new DOMParser();
    var doc=parser.parseFromString(html,'text/html');
    // Full documents carry the build id as a meta rather than a header, and
    // this path also serves cached HTML, so check here too (#1772).
    var docBuildMeta=doc.querySelector('meta[name="stx-build"]');
    var docBuild=docBuildMeta?(docBuildMeta.getAttribute('content')||''):'';
    if(isBuildSkew(docBuild)){reloadForSkew(url,docBuild);return Promise.resolve(false)}
    // Same hand-off as the fragment path, for the same reason (#1809, #1839).
    // A full document DOES carry the destination's runtime — and this path
    // throws it away: prepareRoutedBodyScripts drops every script[src] and
    // everything isSignalsRuntimeScript matches, on the assumption that the
    // current page already has one. When it does not, nothing puts a runtime
    // back, so the destination's client code dies on its first line with
    // "defineStore is not defined" (defineStore lives on window.stx) and the
    // page renders quietly inert — no error reaches the user.
    //
    // Before the swap and before _cleanupContainer, so we neither dispose the
    // outgoing page's scopes nor half-replace the document and then reload.
    if(!window.stx&&documentShipsRuntime(doc,html)){
      log('[router] document needs the signals runtime and this page has none — full navigation to:',url);
      location.href=url;
      return Promise.resolve(false);
    }
    var newContent=doc.querySelector(containerSel)||doc.querySelector('[data-stx-content]')||doc.querySelector('main');
    if(!newContent){location.href=url;return Promise.resolve(false)}

    // Clean up existing signals/effects
    if(window.stx&&window.stx._cleanupContainer){
      window.stx._cleanupContainer(currentContent);
    }

    function doSwap(){
      // ── Swap <head> styles ──
      // Inject new styles FIRST, then remove old to prevent unstyled flash
      var keepIds={'stx-view-transitions':1,'stx-r-css':1};
      var curStyles=document.querySelectorAll('head style');
      var newStyles=doc.querySelectorAll('head style');

      // Merge crosswind styles instead of replacing — persistent elements
      // (nav, footer) outside <main> still need their utility classes
      var curCrosswind=document.querySelector('head style[data-crosswind]');
      var newCrosswind=null;
      newStyles.forEach(function(s){if(s.getAttribute('data-crosswind'))newCrosswind=s});

      if(curCrosswind&&newCrosswind){
        var merged=mergeCrosswindCSS(curCrosswind.textContent||'',newCrosswind.textContent||'');
        if(merged)curCrosswind.textContent=merged;
      }

      var incoming=[];
      newStyles.forEach(function(s){
        if(!keepIds[s.id]&&!s.getAttribute('data-crosswind')){
          var ns=document.createElement('style');
          ns.textContent=s.textContent;
          ns.setAttribute('data-stx-incoming','');
          document.head.appendChild(ns);
          incoming.push(ns);
        }
      });

      // If no existing crosswind but new page has one, add it
      if(!curCrosswind&&newCrosswind){
        var ns=document.createElement('style');
        ns.textContent=newCrosswind.textContent;
        ns.setAttribute('data-crosswind',newCrosswind.getAttribute('data-crosswind'));
        document.head.appendChild(ns);
      }

      // Remove old styles (except persistent ones, crosswind, and incoming)
      curStyles.forEach(function(s){
        if(!keepIds[s.id]&&!s.hasAttribute('data-stx-incoming')&&!s.hasAttribute('data-crosswind'))s.remove();
      });

      incoming.forEach(function(s){s.removeAttribute('data-stx-incoming')});

      // ── Swap <head> stylesheet / font <link>s ──
      // Without this, an SPA navigation to a page whose <link rel="stylesheet">
      // (or font/preconnect <link>) the current page had not already loaded left
      // the swapped-in content completely unstyled (e.g. a page that pulls in its
      // own marketing.css, or Google Fonts). Additive and href-deduped, mirroring
      // the external <head script[src]> reconcile below — never removes existing
      // links, so stylesheets shared across pages simply persist.
      // Relative asset hrefs resolve against the document that declared them:
      // the CURRENT page for links already in <head>, and the page being
      // navigated TO for links from the fetched document. Against location.origin
      // both collapsed to the site root, so 'assets/app.css' on /docs/intro
      // deduped as /assets/app.css — the wrong file, and a false cache hit that
      // skipped the real stylesheet (#1777).
      var docBase;
      try{docBase=new URL(url,location.href).href}catch(e){docBase=location.href}
      var linkSel='link[rel="stylesheet"],link[rel="preconnect"]';
      var curLinks={};
      document.querySelectorAll('head '+linkSel).forEach(function(l){var h=l.getAttribute('href');if(h)curLinks[new URL(h,location.href).href]=1});
      doc.querySelectorAll('head '+linkSel).forEach(function(l){
        var href=l.getAttribute('href');
        if(!href)return;
        var abs=new URL(href,docBase).href;
        if(curLinks[abs])return;
        curLinks[abs]=1;
        var nl=document.createElement('link');
        Array.from(l.attributes).forEach(function(a){nl.setAttribute(a.name,a.value)});
        document.head.appendChild(nl);
      });

      // ── Swap content ──
      // For layout changes: swap the entire <body> to replace layout chrome (nav, footer, etc.)
      // For same-layout: swap only the container (<main>)
      var newBody=doc.querySelector('body');
      var isLayoutChange=false;
      var declaredLayout=pendingLayoutDecl;
      pendingLayoutDecl=null;
      if(newBody){
        var newMeta=doc.querySelector('meta[name="stx-layout"]');
        var curMeta=document.querySelector('meta[name="stx-layout"]');
        var curLayout=curMeta?curMeta.getAttribute('content'):'';
        // The server's answer wins over the document's metas. We are only here
        // because checkLayoutChange already said the group changed, based on
        // exactly these headers — re-deriving from metas and disagreeing meant
        // paying for the full-document fetch and then discarding the reason we
        // made it, so the destination's <main> was swapped into the previous
        // page's chrome (#1833).
        //
        // They disagree more easily than they look. The bun-plugin serve path
        // calls a layout-less page 'default' while the client's own fallback
        // calls it 'app'; a <head> with attributes silently skips the meta
        // injection entirely; and the i18n path rewrites every page's group to
        // i18n:<locale>. Any one of those leaves the metas saying "unchanged"
        // about a document the headers said had changed.
        var newLayout=declaredLayout&&declaredLayout.layout
          ? declaredLayout.layout
          : (newMeta?newMeta.getAttribute('content'):'');
        var curGroup=getCurrentLayoutGroup();
        var newGroup=declaredLayout&&declaredLayout.group
          ? declaredLayout.group
          : getDocLayoutGroup(doc,newLayout);
        isLayoutChange=curGroup!==newGroup||!!(curLayout&&newLayout&&curLayout!==newLayout);
      }
      var incomingSetupName=newBody?(newBody.getAttribute('data-stx')||''):'';
      // Scripts assigned through innerHTML are inert. Preserve executable
      // scripts as placeholders so re-execution keeps document.currentScript
      // beside the component template it owns.
      var routedBodyScripts=[];
      var routedBodyScriptId=0;
      function prepareRoutedBodyScripts(root){
        if(!root)return;
        root.querySelectorAll('script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src')){s.remove();return}
          var type=(s.getAttribute('type')||'').trim().toLowerCase();
          var executable=!type||type==='text/javascript'||type==='application/javascript'||type==='module';
          if(!executable||!text.trim())return;
          if(isSignalsRuntimeScript(s,text)||text.indexOf('__stxRouter')!==-1){s.remove();return}
          var slot='document-'+(++routedBodyScriptId);
          var setupName=generatedSetupName(text);
          if(setupName)incomingSetupName=setupName;
          routedBodyScripts.push({text:text,runAlways:true,slot:slot,setupName:setupName,run:s.getAttribute('data-stx-run')||''});
          s.textContent='';
          s.setAttribute('type','application/stx-pending');
          s.setAttribute('data-stx-route-script',slot);
        });
      }
      prepareRoutedBodyScripts(isLayoutChange?newBody:newContent);
      if(isLayoutChange&&newBody){
        log('[router] full body swap for layout change');
        // Replace entire body content — layout chrome and all
        var bodyHTML=newBody.innerHTML;
        document.body.innerHTML=bodyHTML;
        // Copy body attributes (class, data-stx, etc.)
        Array.from(newBody.attributes).forEach(function(attr){document.body.setAttribute(attr.name,attr.value)});
        // Update layout meta tag
        var oldMeta=document.querySelector('meta[name="stx-layout"]');
        var freshMeta=doc.querySelector('meta[name="stx-layout"]');
        if(oldMeta&&freshMeta)oldMeta.setAttribute('content',freshMeta.getAttribute('content')||'');
        else if(freshMeta){var m=document.createElement('meta');m.name='stx-layout';m.content=freshMeta.getAttribute('content')||'';document.head.appendChild(m)}
        var oldGroupMeta=document.querySelector('meta[name="stx-layout-group"]');
        var freshGroupMeta=doc.querySelector('meta[name="stx-layout-group"]');
        if(oldGroupMeta&&freshGroupMeta)oldGroupMeta.setAttribute('content',freshGroupMeta.getAttribute('content')||'');
        else if(freshGroupMeta){var gm=document.createElement('meta');gm.name='stx-layout-group';gm.content=freshGroupMeta.getAttribute('content')||'';document.head.appendChild(gm)}
        // Update container reference for script execution below
        currentContent=document.querySelector(containerSel)||document.querySelector('main')||document.body;
      } else {
        // Same layout — swap only container content. Carry the destination
        // container's attributes across too (same reason as the fragment path:
        // pages whose layout lives on <main> itself would otherwise lose it).
        var attrMap={};
        Array.prototype.forEach.call(newContent.attributes,function(a){attrMap[a.name]=a.value});
        setContainerAttrs(currentContent,attrMap);
        var cleanHTML=newContent.innerHTML;
        currentContent.innerHTML=cleanHTML;
        if(incomingSetupName)document.body.setAttribute('data-stx',incomingSetupName);
      }

      // ── Load new external <head> scripts ──
      var loadedSrcs={};
      document.querySelectorAll('head script[src]').forEach(function(s){loadedSrcs[s.src]=1});
      var extPromises=[];
      doc.querySelectorAll('head script[src]').forEach(function(s){
        // Fetched-document script: resolve against the page being navigated to
        // (docBase), not the origin root — same rationale as the <link> reconcile (#1777).
        var src=new URL(s.getAttribute('src'),docBase).href;
        if(loadedSrcs[src])return;
        loadedSrcs[src]=1;
        extPromises.push(new Promise(function(resolve,reject){
          var ns=document.createElement('script');
          ns.src=src;
          ns.onload=resolve;
          ns.onerror=reject;
          document.head.appendChild(ns);
        }));
      });

      // ── Script re-execution ──
      // Remove previously injected page scripts
      document.querySelectorAll('script[data-stx-page]').forEach(function(s){s.remove()});

      var scripts=routedBodyScripts.slice();
      function addScript(text, runAlways, slot){
        scripts.push({text:text,runAlways:!!runAlways,slot:slot||''});
      }
      if(isLayoutChange){
        // Also collect setup functions from <head>
        doc.querySelectorAll('head script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          if(isSignalsRuntimeScript(s,text))return;
          if(text.indexOf('__stx_setup_')!==-1)addScript(text,true);
        });
      } else {
        // Collect page scripts from <head> AND <body> (outside container).
        // SSG builds place the setup function in <body> before <main>, not
        // in <head>. Without this, SPA navigation on static sites never
        // runs the setup and reactive data stays empty.
        var seenSetups={};
        scripts.forEach(function(entry){var t=entry.text;if(t.indexOf('__stx_setup_')!==-1)seenSetups[t.substring(0,80)]=1});
        doc.querySelectorAll('script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          // Skip signals runtime and router (they contain __stx_setup references but aren't setup functions)
          if(isSignalsRuntimeScript(s,text))return;
          if(text.indexOf('__stxRouter')!==-1)return;
          if(newContent.contains(s))return;
          if(text.indexOf('__stx_setup_')===-1&&!s.hasAttribute('data-stx-scoped')&&!s.hasAttribute('data-stx-page')&&!s.hasAttribute('data-stx-route-params'))return;
          var key=text.substring(0,80);
          if(seenSetups[key])return;
          seenSetups[key]=1;
          addScript(text,true);
        });
      }
      // Component setup scripts also assign window.stx._latestSetup. Run the
      // destination page setup last so stx:load hydrates with the page scope,
      // not whichever nested component happened to render last.
      if(incomingSetupName){
        scripts.sort(function(a,b){
          var aPage=(a.setupName||generatedSetupName(a.text))===incomingSetupName?1:0;
          var bPage=(b.setupName||generatedSetupName(b.text))===incomingSetupName?1:0;
          return aPage-bPage;
        });
      }

      // Push history state (before active link updates so location.pathname is current)
      if(pushState!==false)writeHistory(pushState,url+(hash||''));

      // Update active nav links
      updateNav(url);
      updateActiveLinks();

      // Scroll
      if(o.scrollToTop&&!hash)window.scrollTo({top:0,behavior:'instant'});
      else if(hash){var el=document.querySelector(hash);if(el)el.scrollIntoView({behavior:'smooth'})}

      // Update title
      var newTitle=doc.querySelector('title');
      if(newTitle)document.title=newTitle.textContent;

      // Update <html lang> from the destination doc so screen readers,
      // CSS :lang() selectors, and any i18n picker that mirrors
      // document.documentElement.lang stay accurate after SPA hops.
      if(doc.documentElement&&doc.documentElement.lang){
        document.documentElement.lang=doc.documentElement.lang;
      }

      // ── Reconcile <html> attributes (stacksjs/stx#1798) ──
      // A layout that scopes its design tokens to the root element
      // (html.marketing { --bg: … }) needs that class to LEAVE when you
      // navigate to a layout that doesn't want it — otherwise both token sets
      // match at once and the second layout paints with the first one's
      // palette. Head stylesheets are additive across a swap, so the class is
      // the only thing disambiguating them.
      //
      // Only what stx wrote is touched, per the markers emitted by
      // document-shell.ts. Diffing the whole element against the incoming
      // document would strip the color-mode boot's dark class and
      // data-reduced-motion, which exist only on the live page.
      if(doc.documentElement){
        var curRoot=document.documentElement,incRoot=doc.documentElement;
        var tokens=function(el,attr){var v=el.getAttribute(attr);return v?v.split(/\\s+/).filter(Boolean):[]};
        var prevCls=tokens(curRoot,'data-stx-html-class'),nextCls=tokens(incRoot,'data-stx-html-class');
        prevCls.forEach(function(c){if(nextCls.indexOf(c)===-1)curRoot.classList.remove(c)});
        nextCls.forEach(function(c){curRoot.classList.add(c)});
        if(nextCls.length)curRoot.setAttribute('data-stx-html-class',nextCls.join(' '));
        else curRoot.removeAttribute('data-stx-html-class');

        var prevNames=tokens(curRoot,'data-stx-html-attrs'),nextNames=tokens(incRoot,'data-stx-html-attrs');
        prevNames.forEach(function(n){if(nextNames.indexOf(n)===-1)curRoot.removeAttribute(n)});
        nextNames.forEach(function(n){var v=incRoot.getAttribute(n);if(v!==null)curRoot.setAttribute(n,v)});
        if(nextNames.length)curRoot.setAttribute('data-stx-html-attrs',nextNames.join(' '));
        else curRoot.removeAttribute('data-stx-html-attrs');
      }

      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));

      // Execute page scripts FIRST — they define setup functions and set _latestSetup
      function execScripts(){
        scripts.forEach(function(entry){
          var text=typeof entry==='string'?entry:entry.text;
          var runAlways=typeof entry==='string'?false:entry.runAlways;
          // Skip scripts that were already executed (layout-level partials
          // like theme.stx). Their top-level const/function declarations
          // would throw "Identifier has already been declared" on re-execution.
          // Exception: setup functions (__stx_setup_) must always re-execute
          // because each page has its own setup, and import statements
          // need special handling.
          var h=hashScript(text);
          var isSetup=text.indexOf('__stx_setup_')!==-1;
          var hasImport=hasStaticImport(text);
          if(!runAlways&&!isSetup&&executedScriptHashes[h])return;
          executedScriptHashes[h]=1;
          // Wrap scripts with import statements as modules (Bug 3 fix)
          var ns=document.createElement('script');
          if(hasImport){
            ns.type='module';
          }
          // Wrap in block scope to prevent const/let collisions on re-navigation.
          // Top-level const/let in <script> tags are global-scoped in browsers
          // and throw "Identifier has already been declared" on re-execution.
          // Skip the wrap for module scripts — they get their own scope from
          // ESM, and top-level 'import' is illegal inside a block, which
          // would throw SyntaxError before the script ever runs.
          var alreadyScoped=runsAlways(typeof entry==='string'?'':entry.run,text);
          ns.textContent=(hasImport||alreadyScoped)?text:'{'+text+'}';
          ns.setAttribute('data-stx-page','');
          var placeholder=entry.slot?document.querySelector('script[data-stx-route-script="'+entry.slot+'"]'):null;
          if(placeholder&&placeholder.parentNode){
            ns.setAttribute('data-stx-positioned','');
            placeholder.parentNode.replaceChild(ns,placeholder);
          }else{
            document.body.appendChild(ns);
          }
        });
        // THEN fire stx:load — now _latestSetup is set and processElement has the right scope
        window.dispatchEvent(new Event('stx:load'));
      }

      if(extPromises.length>0){
        Promise.all(extPromises).then(execScripts).catch(execScripts);
      }
else {
        execScripts();
      }
    }

    return new Promise(function(resolve,reject){
      function completeSwap(){
        try{
          doSwap();
          resolve(true);
        }catch(err){reject(err)}
      }
      if(runViewTransition(completeSwap)){
      }
else {
        // Fallback fade for browsers without View Transitions API
        currentContent.style.transition='opacity 0.12s ease-out';
        currentContent.style.opacity='0';
        setTimeout(function(){
          completeSwap();
          currentContent.style.opacity='1';
          setTimeout(function(){currentContent.style.transition=''},150);
        },120);
      }
    });
  }

  // ── Link interception ──
  // Links the router must never touch, however it found them. This is the
  // opt-out set, and it is deliberately separate from shouldIntercept's
  // eligibility rules below: [data-stx-link] is an author saying "this is a
  // router link", which answers eligibility but must NOT override an explicit
  // opt-out or a non-navigational scheme.
  function isRouterExcluded(link){
    if(!link)return true;
    var href=link.getAttribute('href');
    if(!href)return true;
    if(href.startsWith('http')||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('javascript:'))return true;
    if(link.target==='_blank')return true;
    if(link.hasAttribute('data-stx-no-router')||link.hasAttribute('data-no-router')||link.hasAttribute('download'))return true;
    return false;
  }

  // Paths the router can actually render, compiled from the server's own route
  // table and shipped as regex sources (#1864). Absent when discovery found
  // nothing, which means UNKNOWN, not "owns nothing" — treating it as the
  // latter would disable SPA navigation for a whole site.
  var ownedRoutes=null;
  (function(){
    var raw=o.ownedRoutes;
    if(!raw||!raw.length)return;
    var compiled=[];
    for(var i=0;i<raw.length;i++){
      try{compiled.push(new RegExp(raw[i]))}
      catch(e){}
    }
    if(compiled.length)ownedRoutes=compiled;
  })();

  // Does the router own this path? Only meaningful when the route table made it
  // to the client; otherwise every path is treated as owned, preserving the old
  // behaviour.
  function routerOwns(pathname){
    if(!ownedRoutes)return true;
    for(var i=0;i<ownedRoutes.length;i++){
      if(ownedRoutes[i].test(pathname))return true;
    }
    return false;
  }

  // Eligibility for auto-claiming an arbitrary same-origin anchor under
  // interceptAllLinks. Only reached for anchors the author did not mark.
  function shouldIntercept(link){
    if(isRouterExcluded(link))return false;
    var href=link.getAttribute('href');
    if(href.startsWith('?'))return true;
    if(href===location.pathname)return false;
    if(!getContainer())return false;
    // An endpoint the router cannot render must go to the browser. Claiming it
    // meant a failed fragment fetch, a fallback navigation, and the endpoint
    // hit TWICE — on OAuth redirects, that mints state twice.
    var path=href;
    var q=path.indexOf('?');if(q!==-1)path=path.slice(0,q);
    var h=path.indexOf('#');if(h!==-1)path=path.slice(0,h);
    if(path.charAt(0)==='/'&&!routerOwns(path)){
      log('[router] not a known route, leaving to the browser:',href);
      return false;
    }
    return true;
  }

  // SPA click handling. By default only [data-stx-link] elements get
  // SPA navigation; regular <a href> does native full page reload. Set
  // interceptAllLinks:true (window.__stxRouterConfig or build-time
  // config) to intercept any same-origin anchor — used by static-site
  // mode where every page is part of the same SPA shell.
  document.addEventListener('click',function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    if(!e.target||!e.target.closest)return;
    var link=e.target.closest('[data-stx-link]');
    // A marked link still has to clear the opt-out set. It used to skip it
    // entirely, so data-no-router on a [data-stx-link] anchor was silently
    // ignored and an OAuth redirect got claimed by the router.
    if(link&&isRouterExcluded(link)){log('[router] excluded:',link.getAttribute('href'));return}
    if(!link&&o.interceptAllLinks){
      var anchor=e.target.closest('a[href]');
      if(anchor&&shouldIntercept(anchor))link=anchor;
    }
    if(!link){return}
    var href=link.getAttribute('href');
    log('[router] click intercepted:',href,'container:',!!getContainer(),'defaultPrevented:',e.defaultPrevented);
    e.preventDefault();
    e.stopPropagation();
    log('[router] navigating to:',href);
    navigate(withCurrentLocale(href));
  },true);

  // ── Form submission ──
  // A submit IS a navigation, and the router only ever watched clicks. So any
  // in-app form tore down the SPA with a full document load and discarded
  // every signal on the page, and the only way out was a hand-written fetch in
  // a @submit handler with its own loading and error state.
  //
  // Gated exactly like links: a form opts in with data-stx-form, or
  // interceptForms claims them all — the same shape as [data-stx-link] /
  // interceptAllLinks. Deliberately not on by default: a POST has side
  // effects, so claiming one has to be a decision rather than something that
  // starts happening on upgrade (#1863).
  function formAttrOf(form,submitter,submitterAttr,formAttr){
    // A submit button overrides the form: formaction / formmethod / formenctype.
    var v=submitter&&submitter.getAttribute?submitter.getAttribute(submitterAttr):null;
    return (v!==null&&v!==undefined)?v:form.getAttribute(formAttr);
  }

  function formTargetUrl(form,submitter){
    return formAttrOf(form,submitter,'formaction','action')||(location.pathname+location.search);
  }

  function formMethodOf(form,submitter){
    return String(formAttrOf(form,submitter,'formmethod','method')||'get').toLowerCase();
  }

  function formExcluded(form,submitter){
    if(!form||form.tagName!=='FORM')return true;
    if(form.hasAttribute('data-stx-no-router')||form.hasAttribute('data-no-router'))return true;
    // A form aimed at another browsing context is not this page's navigation.
    if(form.target&&form.target!=='_self')return true;
    try{
      // Resolving against location handles relative, absolute and foreign
      // schemes in one step: mailto: parses to a null origin and is excluded.
      if(new URL(formTargetUrl(form,submitter),location.href).origin!==location.origin)return true;
    }
    catch(e){return true}
    return false;
  }

  function setFormPending(form,on){
    if(on){form.classList.add('stx-submitting');form.setAttribute('aria-busy','true')}
    else{form.classList.remove('stx-submitting');form.removeAttribute('aria-busy')}
  }

  function submitForm(form,submitter){
    var method=formMethodOf(form,submitter);
    var action=formTargetUrl(form,submitter);
    var fd=new FormData(form);
    // A named submit button contributes its value, exactly as a native submit
    // would. FormData does not include it, so multi-button forms (Save vs
    // Delete) would otherwise lose the one piece of state that distinguishes them.
    if(submitter&&submitter.name)fd.append(submitter.name,submitter.value||'');

    if(method==='get'){
      // A GET form is a link whose href the user filled in. Serialise and hand
      // it to the ordinary navigation path — no special swap handling, and it
      // inherits caching, prefetch and the guard-redirect behaviour for free.
      var qs=new URLSearchParams();
      fd.forEach(function(v,k){if(typeof v==='string')qs.append(k,v)});
      var gu=new URL(action,location.href);
      gu.search=qs.toString();
      return navigate(gu.pathname+gu.search+gu.hash);
    }

    setFormPending(form,true);
    form.dispatchEvent(new CustomEvent('stx:form-submit',{bubbles:true,detail:{action:action,method:method}}));

    var enctype=String(formAttrOf(form,submitter,'formenctype','enctype')||'').toLowerCase();
    // Respect the declared encoding. Handing FormData to fetch always produces
    // multipart, which a server expecting urlencoded will read as empty.
    var body=enctype.indexOf('multipart')===0?fd:new URLSearchParams(fd);
    var wantsFragment=shouldUseFragmentResponse();

    return fetch(action,{
      method:method.toUpperCase(),
      body:body,
      headers:wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'},
      credentials:'same-origin',
    }).then(function(r){
      // POST/redirect/GET. The server said where the result lives, so go there
      // through the normal path rather than swapping the POST's body under the
      // form's own URL — otherwise reloading re-submits.
      if(r.redirected&&r.url){
        var rd=new URL(r.url,location.href);
        if(rd.origin!==location.origin){location.href=r.url;return}
        return navigate(rd.pathname+rd.search+rd.hash);
      }
      return r.text().then(function(html){
        var isFrag=wantsFragment&&r.headers.get('X-STX-Fragment')==='true';
        pendingContainerAttrs=isFrag?(r.headers.get('X-STX-Container-Attrs')||''):'';
        pendingLayoutDecl=isFrag?null:{layout:r.headers.get('X-STX-Layout')||'',group:r.headers.get('X-STX-Layout-Group')||''};
        var marked=isFrag?fragmentMarker(r.headers.get('X-STX-Runtime')||'')+html:html;
        // Deliberately NOT cached: this body is the answer to one POST, and
        // serving it later for a GET of the same path would be a lie.
        // 'replace' so re-rendered validation errors do not stack one history
        // entry per attempt.
        return Promise.resolve(swap(marked,cacheKey(action),'replace','')).then(function(){
          applyTitle(r.headers.get('X-STX-Title')||'');
        });
      });
    }).catch(function(err){
      // No native re-submit on failure: that would send the POST a second time.
      // The app is told instead, and the form is left intact for a retry.
      console.error('[router] form submit failed:',err);
      form.dispatchEvent(new CustomEvent('stx:form-error',{bubbles:true,detail:{error:err,action:action}}));
    }).finally(function(){setFormPending(form,false)});
  }

  document.addEventListener('submit',function(e){
    // Bubble phase, and defaultPrevented is honoured, so a page's own @submit
    // handler always wins. This is a fallback for forms nobody else claimed,
    // never an override of one that is already handled.
    if(e.defaultPrevented)return;
    var form=e.target;
    if(!form||form.tagName!=='FORM')return;
    if(!form.hasAttribute('data-stx-form')&&!form.hasAttribute('data-stx-link')&&!o.interceptForms)return;
    var submitter=e.submitter||null;
    if(formExcluded(form,submitter))return;
    // Without a container there is nothing to swap into, so a native submit is
    // the only thing that can work.
    if(!getContainer())return;
    // Constraint validation has already run by the time submit fires, so an
    // invalid form never reaches here.
    e.preventDefault();
    // A synchronous throw in here would be swallowed by dispatchEvent, and
    // preventDefault has already run — so the form would be silently dead with
    // nothing in the console. Report it and clear the pending state instead.
    try{submitForm(form,submitter)}
    catch(err){
      console.error('[router] form submit failed:',err);
      setFormPending(form,false);
      form.dispatchEvent(new CustomEvent('stx:form-error',{bubbles:true,detail:{error:err}}));
    }
  });

  // ── Back/forward ──
  window.addEventListener('popstate',function(){
    navigate(location.pathname+location.search+location.hash,false);
  });

  // ── Prefetch on hover ──
  if(o.prefetch){
    document.addEventListener('mouseover',function(e){
      if(!e.target||!e.target.closest)return;
      var link=e.target.closest('[data-stx-link]');
      // Same opt-out set as the click path. Without it, hovering a link the
      // router is not allowed to claim still fired a real GET at it — a
      // logout or OAuth URL was requested on hover alone.
      if(isRouterExcluded(link))return;
      var href=withCurrentLocale(link.getAttribute('href'));
      var key=cacheKey(href);
      if(cache[key]||prefetching[key])return;
      prefetching[key]=true;
      var wantsFragment=shouldUseFragmentResponse();
      fetch(href,{headers:wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'}}).then(function(r){
        // Never cache a body that came from somewhere else. A guarded route
        // prefetched while logged out answers with /login's markup, and
        // storing it under the guarded key poisons the cache: the later real
        // navigation is a cache hit, so it swaps the login page in without
        // ever hitting the network, where the redirect check above would
        // have caught it (#1849).
        if(r.redirected)return null;
        var isFrag=wantsFragment&&r.headers.get('X-STX-Fragment')==='true';
        var pLayout=r.headers.get('X-STX-Layout')||'';
        var pGroup=r.headers.get('X-STX-Layout-Group')||'';
        var pTitle=r.headers.get('X-STX-Title')||'';
        var pRuntime=r.headers.get('X-STX-Runtime')||'';
        return r.text().then(function(html){return{html:isFrag?fragmentMarker(pRuntime)+html:html,layout:pLayout,layoutGroup:pGroup,title:pTitle}});
      }).then(function(result){
        if(result&&o.cache)setCache(key,result.html,result.layout,result.layoutGroup,result.title);
      }).catch(function(){}).finally(function(){delete prefetching[key]});
    },true);
  }

  // ── Active link management ──
  function updateNav(url){
    document.querySelectorAll('nav a[href], #mobileNav a[href], [data-stx-nav] a[href]').forEach(function(a){
      var href=a.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('http'))return;
      var isActive=(href===url)||(href==='/'&&url==='/');
      if(a.hasAttribute('data-stx-link')){
        var ac=a.getAttribute('data-stx-active-class')||'active';
        if(isActive)ac.split(' ').forEach(function(cls){if(cls)a.classList.add(cls)});else ac.split(' ').forEach(function(cls){if(cls)a.classList.remove(cls)});
      }
    });
  }

  function updateActiveLinks(){
    // Update active classes on <stx-link> elements (and legacy data-stx-link)
    var links=document.querySelectorAll('[data-stx-link]');
    var cur=location.pathname;
    links.forEach(function(link){
      var href=link.getAttribute('to')||link.getAttribute('href')||'';
      var ac=link.getAttribute('active-class')||link.getAttribute('data-stx-active-class')||'active';
      var eac=link.getAttribute('exact-active-class')||link.getAttribute('data-stx-exact-active-class')||'exact-active';
      ac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      eac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      var isExact=cur===href;
      var isActive=href!=='/'?cur.startsWith(href):cur==='/';
      if(isExact)eac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
      if(isActive)ac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
    });
  }

  // ── Progress bar DOM + style ──
  // Injects a fixed-position element at the top of the viewport plus the
  // minimal CSS for its transform/opacity transitions. Kept idempotent so
  // repeated init() calls (e.g. after full-body swaps) don't duplicate.
  // Also ships the default View Transitions fade+slide CSS when
  // viewTransitions is enabled and the browser supports it. Apps can
  // override by defining more specific ::view-transition-* rules later in
  // the cascade, or opt out entirely with viewTransitions:false.
  function injectStyles(){
    if(!document.getElementById('stx-r-css')){
      var s=document.createElement('style');s.id='stx-r-css';
      // Strip characters that could escape our CSS block and inject new
      // declarations: ; { } ( ) " ' \\ < > plus whitespace control chars.
      // This keeps the value safe to concat into a stylesheet even if a
      // caller wires the config from an untrusted source.
      var sanitize=function(v){return String(v).replace(/[;{}()"'\\\\<>\\n\\r\\t]/g,'')};
      var pc=sanitize(o.progressColor);
      var ph=sanitize(o.progressHeight);
      var css='.stx-navigating{cursor:wait}.stx-navigating a,.stx-navigating button{pointer-events:none}#stx-router-progress{position:fixed;top:0;left:0;right:0;height:'+ph+';background:'+pc+';box-shadow:0 0 8px '+pc+',0 0 4px '+pc+';transform:scaleX(0);transform-origin:left;transition:transform .18s ease-out,opacity .26s ease;opacity:0;pointer-events:none;z-index:999999}';
      if(o.viewTransitions&&'startViewTransition' in document){
        var dur=(o.viewTransitionDuration||220)+'ms';
        var ease=o.viewTransitionEasing||'cubic-bezier(0.16, 1, 0.3, 1)';
        css+='::view-transition-old(root),::view-transition-new(root){animation-duration:'+dur+';animation-timing-function:'+ease+'}';
        css+='::view-transition-old(root){animation-name:stx-r-fade-out}::view-transition-new(root){animation-name:stx-r-fade-in}';
        css+='@keyframes stx-r-fade-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-4px)}}';
        css+='@keyframes stx-r-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}';
        css+='@media (prefers-reduced-motion: reduce){::view-transition-old(root),::view-transition-new(root){animation-duration:0s;animation-name:none}}';
      }
      s.textContent=css;
      document.head.appendChild(s);
    }
    if(o.progress&&!document.getElementById('stx-router-progress')){
      var el=document.createElement('div');
      el.id='stx-router-progress';
      el.setAttribute('role','progressbar');
      el.setAttribute('aria-hidden','true');
      // Append to <html>, not <body>: when the router swaps the body
      // (container:'body' for full-page static-site SPAs) the progress
      // element gets wiped along with it. <html> stays put across
      // swaps, so the bar survives multi-hop navigation.
      document.documentElement.appendChild(el);
      progEl=el;
    } else if(o.progress){
      progEl=document.getElementById('stx-router-progress');
    }
  }

  function injectViewTransitionCSS(){
    if(document.getElementById('stx-view-transitions'))return;
    var s=document.createElement('style');s.id='stx-view-transitions';
    s.textContent='::view-transition-group(root){animation:none}::view-transition-old(root){animation:none}::view-transition-new(root){animation:none}main,#app-content,[data-stx-content]{view-transition-name:stx-content}::view-transition-old(stx-content){animation:stx-fade-out .15s ease-out both}::view-transition-new(stx-content){animation:stx-fade-in .15s ease-in .1s both}@keyframes stx-fade-out{from{opacity:1}to{opacity:0}}@keyframes stx-fade-in{from{opacity:0}to{opacity:1}}::view-transition{background:transparent}::view-transition-group(stx-content){background:inherit;overflow:hidden}';
    (document.head||document.documentElement).appendChild(s);
  }

  // ── Public API ──
  var router={
    navigate:navigate,
    navigateTo:navigate,
    prefetch:function(url){
      var key=cacheKey(url);
      if(!cache[key]){
        var wantsFragment=shouldUseFragmentResponse();
        fetch(url,{headers:wantsFragment?{'X-STX-Router':'true'}:{'Accept':'text/html'}}).then(function(r){var isFrag=wantsFragment&&r.headers.get('X-STX-Fragment')==='true';var pLayout=r.headers.get('X-STX-Layout')||'';var pGroup=r.headers.get('X-STX-Layout-Group')||'';var pTitle=r.headers.get('X-STX-Title')||'';var pRuntime=r.headers.get('X-STX-Runtime')||'';return r.text().then(function(html){return{html:isFrag?fragmentMarker(pRuntime)+html:html,layout:pLayout,layoutGroup:pGroup,title:pTitle}})}).then(function(result){setCache(key,result.html,result.layout,result.layoutGroup,result.title)}).catch(function(){});
      }
    },
    // Re-run the CURRENT route against the server and swap the result.
    //
    // There was no way to do this. invalidate() on a query only re-runs client
    // fetches, so anything the server rendered — a list the mutation just
    // changed, a count in the layout — could only be refreshed with a full
    // document load, which discards every signal on the page. That is the
    // exact thing the SPA exists to avoid, so apps reached for
    // location.reload() and lost their state (#1850, #1858).
    //
    // force:true both evicts the cache entry and defeats navigate's
    // same-URL early return, so this is exposing behaviour the router already
    // had rather than adding a second code path. 'replace' because a refresh
    // is not a new place — it must not add a history entry you can go Back to.
    refresh:function(){
      return navigate(location.pathname+location.search+location.hash,'replace',true);
    },
    // Expire ONE entry, so a mutation can invalidate just the page it affected
    // and let the next visit re-fetch, instead of throwing the whole cache away.
    invalidate:function(url){
      evictCache(cacheKey(url||(location.pathname+location.search)));
    },
    clearCache:function(){for(var k in cache)delete cache[k];for(var lk in layoutCache)delete layoutCache[lk];for(var gk in layoutGroupCache)delete layoutGroupCache[gk];cacheOrder.length=0},
    cache:cache,
    swap:swap,
    updateNav:updateNav
  };

  router.__rev=ROUTER_REV;
  window.__stxRouter=router;
  window.stxRouter=router;
  if(window.stx)window.stx.router=router;

  // ── Initialize ──
  function init(){
    injectStyles();
    injectViewTransitionCSS();
    updateActiveLinks();
    updateNav(location.pathname);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
`
  cachedRouterScript = minifyRouterScript(source)
  return cachedRouterScript
}
