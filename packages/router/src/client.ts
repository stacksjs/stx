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
let cachedRouterScriptDev: string | undefined

/**
 * Remove every call to the router's own `log()` helper.
 *
 * The helper is gated on `debug`, so the calls print nothing in an ordinary
 * page -- but they ship to every page regardless, and they had grown to 32
 * sites and 2.3KB of the delivered script. The dev build keeps them
 * (getRouterScriptDev), the same way the signals runtime keeps its
 * console.log calls in generateSignalsRuntimeDev and strips them for the
 * shipped build.
 *
 * Each call becomes `0`, a valid expression statement, so a call that stood
 * alone as a statement leaves valid code behind. String contents and nested
 * parentheses are respected, so a `(` inside a logged message cannot confuse
 * the matcher. `console.log.apply` inside the helper's own definition is left
 * alone: the needle only matches `log(` that no identifier character or dot
 * precedes.
 */
function stripRouterLogs(source: string): string {
  const out: string[] = []
  const needle = 'log('
  let i = 0

  while (i < source.length) {
    const hit = source.indexOf(needle, i)
    if (hit === -1) {
      out.push(source.slice(i))
      break
    }

    // `dialog(`, `catalog(`, `console.log(` -- not the helper. Nor the
    // helper's own declaration, `function log()`, which has to survive: the
    // calls become `0`, but `function 0(){}` is not a program.
    const before = hit > 0 ? source[hit - 1] : ' '
    const isDeclaration = /\bfunction\s+$/.test(source.slice(Math.max(0, hit - 16), hit))
    if (/[\w$.]/.test(before) || isDeclaration) {
      out.push(source.slice(i, hit + needle.length))
      i = hit + needle.length
      continue
    }

    out.push(source.slice(i, hit))

    let depth = 1
    let j = hit + needle.length
    while (j < source.length && depth > 0) {
      const character = source[j]
      if (character === '"' || character === '\'' || character === '`') {
        const quote = character
        j++
        while (j < source.length && source[j] !== quote) {
          if (source[j] === '\\')
            j++
          j++
        }
        j++
        continue
      }
      if (character === '(')
        depth++
      else if (character === ')')
        depth--
      j++
    }

    out.push('0')
    i = j
  }

  return out.join('')
}

function minifyRouterScript(source: string, mangle = false): string {
  try {
    const transpiler = new Bun.Transpiler(mangle
      ? { loader: 'js', minify: { whitespace: true, identifiers: true } }
      : { loader: 'js', minifyWhitespace: true })
    return transpiler.transformSync(source)
      .replace(/\}(var |let |const |function )/g, '};$1')
      .trim()
  }
  catch {
    return source
  }
}

/** The router script as written, before stripping or minification. */
function routerSource(): string {
  return `
;(function(){
  'use strict';
  var ROUTER_REV=7;
  if(window.__stxRouter&&window.__stxRouter.__rev===ROUTER_REV)return;

  // ── Configuration ──
  var defaults={container:'main',loadingClass:'stx-navigating',viewTransitions:true,cache:true,scrollToTop:true,prefetch:true,progress:true,progressColor:'#78dce8',progressHeight:'2px',interceptAllLinks:false,prefetchCacheMax:50,routeFocus:true,announceRoute:true,interceptForms:false,cssLoadTimeout:1500,scrollRestoration:true,screens:'auto',screenLimit:8,navDuration:350,swipeBack:true,swipeEdge:20,prefetchVisible:true,prefetchVisibleMax:12,revalidate:true,revalidateAfter:3000};
  var o=Object.assign({},defaults,window.__stxRouterConfig||{},window.STX_ROUTER_OPTIONS||{});
  var containerSel=o.container;
  var debug=!!o.debug;
  function log(){if(debug&&typeof console!=='undefined'&&console.log)console.log.apply(console,arguments)}

  // Shorthands for the document-rooted queries this script makes ~33 times.
  // Every page carries these bytes, and the budget in
  // scripts/performance-budgets.ts is what noticed.
  var LAYOUT_META='meta[name="stx-layout"]';
  var LAYOUT_GROUP_META='meta[name="stx-layout-group"]';
  var BUILD_META='meta[name="stx-build"]';
  function qs(sel){return document.querySelector(sel)}
  function qsa(sel){return document.querySelectorAll(sel)}
  function ce(tag){return document.createElement(tag)}
  function dhead(){return document.head}

  // ── Scroll position ──
  // Forward navigation goes to the top, or to the hash. Back and forward return
  // to where the entry was left -- the browser cannot do that for us, because
  // by the time it would restore, the content of the entry has not been fetched
  // yet, so it clamps to whatever height the outgoing page happened to have.
  // history.scrollRestoration therefore goes to manual and the positions are
  // kept here, keyed by a token written into each history entry (two entries
  // for the same URL keep their own positions, which is the point).
  //
  // Manual restoration also takes the browser's reload behaviour away, so the
  // positions are mirrored into sessionStorage: a reload, or a return to the
  // tab, finds the entry's token already in history.state and restores from
  // there. sessionStorage is per tab and dies with it, same as the history.
  var SCROLL_TOKEN='__stxScroll';
  var SCROLL_STORE='stx:scroll:';
  // On every entry the router pushes, never on the one the app opened with
  // (which carries a scroll token too): going back from a pushed entry stays
  // in the app, from the first it leaves it (or, in a phone app, does nothing).
  var PUSHED_MARK='__stxPushed';
  // How far above the entry the app opened with this one sits, and which tab
  // it belongs to. A tab switch rewinds to depth 0 before it writes the next
  // tab's entries, which is what keeps Back from ever crossing tabs.
  var DEPTH='__stxDepth';
  var TAB='__stxTab';
  var histDepth=(history.state&&history.state[DEPTH])|0;
  var scrollSeq=0;
  var pendingScroll=null;
  var restoreScroll=!!o.scrollRestoration;
  function newScrollToken(){return 's'+(++scrollSeq)+'-'+Date.now()}
  var scrollToken=(history.state&&history.state[SCROLL_TOKEN])||newScrollToken();
  // sessionStorage is the only store: it is synchronous, it is per tab, it dies
  // with the tab exactly as the history does, and it is the one that survives a
  // reload. A private window that refuses it degrades to scrolling to the top.
  function readScroll(token){
    try{
      var parts=(window.sessionStorage.getItem(SCROLL_STORE+token)||'').split(',');
      return parts.length===2?[parseFloat(parts[0])||0,parseFloat(parts[1])||0]:null;
    }catch(e){return null}
  }
  // Inner scrollers, marked data-stx-scroll: a screen whose list scrolls
  // inside its own box rather than the window lost its place on Back exactly
  // the way the window used to. Keyed by the attribute's value, or by order
  // for an unnamed one.
  function scrollerKey(el,i){return el.getAttribute('data-stx-scroll')||('#'+i)}
  function innerScroll(root){
    var m=null;
    if(root&&root.querySelectorAll)root.querySelectorAll('[data-stx-scroll]').forEach(function(el,i){
      if(el.scrollTop||el.scrollLeft){m=m||{};m[scrollerKey(el,i)]=[el.scrollLeft||0,el.scrollTop||0]}
    });
    return m;
  }
  function applyInner(root,m){
    if(!m||!root||!root.querySelectorAll)return;
    root.querySelectorAll('[data-stx-scroll]').forEach(function(el,i){
      var at=m[scrollerKey(el,i)];
      if(at){el.scrollLeft=at[0];el.scrollTop=at[1]}
    });
  }
  // Called while the outgoing entry is still the current one, so the position
  // read here belongs to the token being written.
  function rememberScroll(){
    if(active&&active.el&&!active.el.hasAttribute(HIDDEN))saveScroll(active);
    if(!restoreScroll)return;
    try{
      window.sessionStorage.setItem(SCROLL_STORE+scrollToken,(window.pageXOffset||window.scrollX||0)+','+(window.pageYOffset||window.scrollY||0));
      // Taken as the swap began when there is one: by the time the history
      // is written the outgoing page's scrollers have been replaced.
      var inner=innerSnap!==undefined?innerSnap:innerScroll(activeRoot());
      innerSnap=undefined;
      if(inner)window.sessionStorage.setItem(SCROLL_STORE+scrollToken+':i',JSON.stringify(inner));
      else window.sessionStorage.removeItem(SCROLL_STORE+scrollToken+':i');
    }catch(e){}
  }
  var pendingInner=null;
  var innerSnap;
  function readInner(token){
    try{return JSON.parse(window.sessionStorage.getItem(SCROLL_STORE+token+':i')||'null')}catch(e){return null}
  }
  // One place decides where a swap leaves the viewport, so the fragment path
  // and the whole-document path cannot drift apart.
  function applyScroll(hash){
    if(pendingScroll){
      var at=pendingScroll;
      pendingScroll=null;
      window.scrollTo({left:at[0],top:at[1],behavior:'instant'});
      // Again once the page has bound: a scroller's content is often drawn
      // by a :for that has not run yet, and a box with nothing in it cannot
      // be scrolled anywhere.
      var inner=pendingInner;pendingInner=null;
      if(inner){applyInner(activeRoot(),inner);setTimeout(function(){applyInner(activeRoot(),inner)},60)}
      return;
    }
    pendingInner=null;
    if(o.scrollToTop&&!hash){window.scrollTo({top:0,behavior:'instant'});return}
    if(hash){var el=findIn(hash);if(el)el.scrollIntoView({behavior:'smooth'})}
  }
  // Keeps whatever another script put in the entry; only adds the token.
  function stampScrollToken(){
    var state={};
    var current=history.state;
    if(current&&typeof current==='object')for(var key in current)state[key]=current[key];
    state[SCROLL_TOKEN]=scrollToken;
    state[DEPTH]=histDepth;
    try{history.replaceState(state,'',location.href)}catch(e){}
  }
  if(restoreScroll){
    try{history.scrollRestoration='manual'}catch(e){}
    // A token already in the entry means this document is a reload or a
    // restore of an entry visited before, so its position is worth asking for.
    var known=history.state&&history.state[SCROLL_TOKEN];
    if(known){
      var saved=readScroll(scrollToken);
      if(saved&&(saved[0]||saved[1])){
        var restoreAt=function(){window.scrollTo({left:saved[0],top:saved[1],behavior:'instant'})};
        if(document.readyState==='complete')restoreAt();
        else window.addEventListener('load',restoreAt,{once:true});
      }
    }
    else{
      stampScrollToken();
    }
    // A reload or a link out of the app never calls writeHistory, so this is
    // the only chance to record where the page was left. pagehide fires for
    // both, and unlike beforeunload it does not keep the page out of the
    // back/forward cache.
    window.addEventListener('pagehide',rememberScroll);
  }

  // Replace, never merge: absent payloads must forget the outgoing page's data.
  // Run at the committed swap, not during prefetch or a superseded navigation.
  function hydrateServerData(html){
    window.__STX_RUNTIME_CONFIG__={};
    var configMatch=html.match(/<script\\b[^>]*\\bdata-stx-runtime-config\\b[^>]*>([\\s\\S]*?)<\\/script>/i);
    if(configMatch){try{var configValues=JSON.parse(configMatch[1]);if(configValues&&typeof configValues==='object'&&!Array.isArray(configValues))window.__STX_RUNTIME_CONFIG__=configValues}catch(e){}}
    window.__STX_DATA__={};
    var match=html.match(/<script\\b[^>]*\\bdata-stx-server-data\\b[^>]*>([\\s\\S]*?)<\\/script>/i);
    if(match){try{var values=JSON.parse(match[1]);if(values&&typeof values==='object'&&!Array.isArray(values))window.__STX_DATA__=values}catch(e){}}
  }

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
  var buildMeta=qs(BUILD_META);
  var loadedBuild=buildMeta?(buildMeta.getAttribute('content')||''):'';
  window.__stxBuild=loadedBuild;
  function isBuildSkew(incoming){
    return !!(loadedBuild&&incoming&&incoming!==loadedBuild);
  }
  // A navigation the user asked for loads its destination as a document: no
  // fragment of the newer build can be hydrated by this runtime, and a tap is
  // the one moment a page load is expected anyway. Anything else that notices
  // the newer build (a background revalidation, the offline worker) must not
  // reload a screen the user is in the middle of using, so the reload waits
  // until the page is hidden, and a cold start picks the build up regardless.
  var skewDeferred=false;
  function reloadForSkew(url,incoming,background){
    log('[router] build skew: page is',loadedBuild,'server is',incoming,background?'— reload when hidden':'— full navigation');
    if(!background){location.href=url;return}
    if(skewDeferred)return;
    skewDeferred=true;
    var reloadHidden=function(){
      if(document.visibilityState!=='hidden')return;
      document.removeEventListener('visibilitychange',reloadHidden);
      location.reload();
    };
    document.addEventListener('visibilitychange',reloadHidden);
  }
  // A link marked data-stx-transition="none" swaps without the cross-fade. A
  // tab bar is the case: iOS switches tabs instantly, and the fade read as a
  // quarter-second lag on every tap in a phone app. Set by the click that
  // started the navigation, so programmatic and history navigations keep it.
  var instantNext=false;
  var instantNav=false;
  function runViewTransition(callback){
    if(instantNav||!o.viewTransitions||!document.startViewTransition)return false;
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

  // ── Instant navigation: one frame, already filled ──
  // A tab swap used to paint the new screen before its scripts had run: a page
  // script with an import is a module, and a module runs after the task that
  // inserted it, so for a few frames the screen showed its bare markup and then
  // filled in, on every visit. Each inserted page script now reports when it
  // has run, and an instant navigation holds the old frame (a View Transition
  // with no animation) until they all have, capped so it can never hang.
  var scriptsPending=0;
  var hydrateWaiters=[];
  window.__stxScriptRan=function(){
    if(scriptsPending>0)scriptsPending--;
    if(!scriptsPending){var w=hydrateWaiters;hydrateWaiters=[];w.forEach(function(f){f()})}
  };
  function markRan(code){scriptsPending++;return code+String.fromCharCode(10)+';window.__stxScriptRan&&window.__stxScriptRan();'}
  function whenHydrated(capMs){
    return new Promise(function(resolve){
      var done=false;
      function finish(){if(done)return;done=true;setTimeout(resolve,0)}
      if(!scriptsPending){done=true;resolve();return}
      hydrateWaiters.push(finish);
      setTimeout(finish,capMs);
    });
  }
  // Whether a fragment's scripts all run inside the swap's own task: none is
  // a module, and every file it names is already loaded. Then an instant
  // navigation needs no held frame at all: swapped, run and bound before the
  // browser next paints, it shows the new screen whole in the first frame.
  function swapRunsInOneTask(html,base){
    var sync=true;
    html.replace(new RegExp('<scr'+'ipt\\\\b([^>]*)>([\\\\s\\\\S]*?)<\\\\/scr'+'ipt>','gi'),function(m,attrs,code){
      if(!sync)return m;
      var typeMatch=attrs.match(/\\btype\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
      var scriptType=((typeMatch&&(typeMatch[1]||typeMatch[2]||typeMatch[3]))||'').trim().toLowerCase();
      if(scriptType==='module'){sync=false;return m}
      if(scriptType&&scriptType!=='text/javascript'&&scriptType!=='application/javascript')return m;
      var srcMatch=attrs.match(/\\bsrc\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
      var src=srcMatch&&(srcMatch[1]||srcMatch[2]||srcMatch[3]);
      if(src){
        if(!isSharedClientScriptAttrs(attrs)){var key=externalScriptKey(src,base);if(key&&!loadedExternalScripts[key])sync=false}
        return m;
      }
      if(code&&hasStaticImport(code))sync=false;
      return m;
    });
    return sync;
  }
  function runInOneTask(complete){
    // The runtime binds on stx:load after a debounce; bind now, in this task.
    function flush(){if(window.stx&&typeof window.stx._flushLoad==='function')window.stx._flushLoad()}
    window.addEventListener('stx:load',flush,{once:true});
    try{complete()}finally{window.removeEventListener('stx:load',flush)}
  }
  function runInstantSwap(complete){
    if(!document.startViewTransition)return false;
    var root=document.documentElement;
    root.classList.add('stx-instant');
    var clear=function(){root.classList.remove('stx-instant')};
    try{
      var transition=document.startViewTransition(function(){
        scriptsPending=0;
        // The runtime binds the page on stx:load after a short debounce; run
        // it now, so the frame this reveals is bound rather than showing its
        // {{ }} for a frame before they fill in.
        var loaded=new Promise(function(resolve){window.addEventListener('stx:load',function(){if(window.stx&&typeof window.stx._flushLoad==='function')window.stx._flushLoad();resolve()},{once:true});setTimeout(resolve,300)});
        complete();
        return loaded.then(function(){return whenHydrated(300)});
      });
      if(transition&&transition.finished&&transition.finished.then)transition.finished.then(clear,clear);else clear();
      if(transition&&transition.ready&&transition.ready.catch)transition.ready.catch(function(){});
      return true;
    }catch(err){
      clear();
      log('[router] instant transition unavailable:',err&&err.message?err.message:err);
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
  // Shown only for a navigation that is actually waiting. A page served from
  // the prefetch cache swaps in a few milliseconds, and drawing then fading a
  // bar for it made every instant navigation look like a load.
  var progDelay=null;
  function startProgress(){
    if(!o.progress||!progEl)return;
    if(progTimer){clearInterval(progTimer);progTimer=null}
    if(progDelay)clearTimeout(progDelay);
    progDelay=setTimeout(function(){
      progDelay=null;
      setProgress(8);
      progTimer=setInterval(function(){
        if(progVal>=90)return;
        // Asymptotic trickle — fast at first, slower near 90%
        var inc=Math.max(0.4,(90-progVal)*0.08);
        setProgress(progVal+inc);
      },160);
    },150);
  }
  function finishProgress(){
    if(!o.progress||!progEl)return;
    if(progDelay){clearTimeout(progDelay);progDelay=null;return}
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
  // When each entry was fetched, so a cache hit knows whether it is worth
  // checking behind the swap (revalidate).
  var cacheAt={};
  var prefetching={};
  var awaitingKey='';
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
    cacheAt[key]=Date.now();
    while(cacheOrder.length>o.prefetchCacheMax){
      var oldest=cacheOrder.shift();
      delete cache[oldest];
      delete layoutCache[oldest];
      delete layoutGroupCache[oldest];
      delete titleCache[oldest];
      delete attrsCache[oldest];
      delete cacheAt[oldest];
    }
  }
  // Read a prefetch response into the shape setCache stores, or null when this
  // answer must not be cached at all.
  //
  // Both prefetch paths used to assemble this by hand, and both left out
  // X-STX-Container-Attrs (#1947): setCache takes six arguments and they
  // passed five, which JavaScript accepts without a word. The entry was
  // cached with no container attributes, so a link that had been hovered
  // before it was clicked applied '' on the cache hit, and setContainerAttrs
  // stripped the class the previous navigation had put on the routed
  // container. A dashboard lost its max-width, but only on links that
  // happened to be hovered first, and a hard reload always fixed it — which
  // made it read as a CSS problem.
  //
  // Hand-assembling it twice is what let them drift, so the two guards below
  // live here rather than at the call sites — the hover path had one of them
  // and the public router.prefetch() had neither:
  //
  //   - a redirected body belongs to the URL it came FROM. A guarded route
  //     prefetched while logged out answers with /login's markup, and storing
  //     that under the guarded key poisons the cache: the later real
  //     navigation is a hit, so it swaps the login page in without ever
  //     reaching the network, where navigate's own redirect check would have
  //     caught it (#1849).
  //   - a fragment from a DIFFERENT build must not be handed to this page's
  //     runtime (#1772). navigate answers skew by reloading; a prefetch must
  //     not, because the user only hovered a link. Declining to cache is the
  //     whole fix — the click then goes to the network, where navigate does
  //     the reload properly.
  function readPrefetchResponse(r,wantsFragment){
    if(r.redirected)return Promise.resolve(null);
    if(isBuildSkew(r.headers.get('X-STX-Build')||''))return Promise.resolve(null);
    var isFrag=wantsFragment&&r.headers.get('X-STX-Fragment')==='true';
    var layout=r.headers.get('X-STX-Layout')||'';
    var group=r.headers.get('X-STX-Layout-Group')||'';
    var title=r.headers.get('X-STX-Title')||'';
    var cattrs=r.headers.get('X-STX-Container-Attrs')||'';
    var runtime=r.headers.get('X-STX-Runtime')||'';
    return r.text().then(function(html){return{html:isFrag?fragmentMarker(runtime)+html:html,layout:layout,layoutGroup:group,title:title,containerAttrs:cattrs}});
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
    var probe=ce('div');
    probe.innerHTML='<i '+attrStr+'></i>';
    var src=probe.firstChild;
    // getAttributeNames first: it is the same standard DOM answer and it is
    // what the test DOM implements. Reading .attributes alone made this
    // silently return {} there — so the whole container-attrs path, header to
    // element, had no test coverage at all while #1947 sat in it.
    if(src&&src.getAttributeNames){
      src.getAttributeNames().forEach(function(n){map[n]=src.getAttribute(n)});
    }
    else if(src&&src.attributes){
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
    delete cacheAt[key];
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

  function mergeCss(existing,incoming){
    var blocks=extractCssBlocks(incoming);
    var newBlocks=[];
    for(var bi=0;bi<blocks.length;bi++){
      if(existing.indexOf(blocks[bi])===-1)newBlocks.push(blocks[bi]);
    }
    if(newBlocks.length>0)return existing+'\\n'+newBlocks.join('\\n');
    return null;
  }

  function getContainer(){
    return qs(containerSel)||qs('[data-stx-content]')||qs('main');
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
  // The page's module registry (#1957): the bundle every component that
  // imports a local module reads from, so on navigation it has to run before
  // any of them. Marked data-stx-modules; the text test also finds it where
  // only a script's text survives. Its wrapper names __stxModuleBundles, which
  // no component script does -- they read __stxModules.
  var REGISTRY_TEXT=/__stxModuleBundles/;
  function isModuleRegistryScript(s){
    return !!s&&((s.hasAttribute&&s.hasAttribute('data-stx-modules'))||REGISTRY_TEXT.test(s.textContent||''));
  }
  // The page's composables (resources/functions and friends), published as
  // globals its templates call. Each page ships the ones it reaches, so the
  // next page can need one the first never loaded: it runs right after the
  // registry, before anything that calls into it. Guarded per bundle, so a
  // repeat is a no-op.
  var COMPOSABLES_TEXT=/__stxComposableBundles/;
  function isComposablesScript(s){
    return !!s&&((s.hasAttribute&&s.hasAttribute('data-stx-composables'))||COMPOSABLES_TEXT.test(s.textContent||''));
  }
  /*
   * What the block wrap below would otherwise hide (stacksjs/stx#2041).
   *
   * A re-executed script is wrapped in a bare block so that top-level const
   * and let cannot collide across navigations. That wrap is invisible for a
   * plain function declaration -- Annex B.3.3 still hoists its binding to the
   * enclosing scope in sloppy mode -- and NOT invisible for anything else.
   * async function, function*, class, const and let are all block-scoped, so
   * the same source published a global when the browser parsed the script and
   * published nothing when the router re-ran it.
   *
   * The effect is a divergence between development and a built app, because
   * only the built one reaches a route as a fragment: a page served whole runs
   * its script natively. An inline onclick that names such a declaration then
   * worked in dev and threw ReferenceError in the packaged app, where there is
   * no console, so it read as a button that does nothing.
   *
   * So: re-publish what the browser would have published. Only values that are
   * functions, which is what an inline handler calls -- assigning every
   * top-level const would otherwise write over window.name and friends, which
   * a lexical global shadows rather than overwrites. Each name is guarded on
   * its own so an unmatched one cannot take the rest down, and typeof is safe
   * on a name that was never declared.
   *
   * Column-anchored: a declaration nested inside a function is indented, and
   * is not in scope at the end of the block anyway.
   */
  var TLD=/^(?:export\\s+)?(?:async\\s+)?(?:function\\s*\\*?|class|const|let|var)\\s+([$\\w]+)/gm;
  function republishTopLevel(src){
    var n=[],m,o='',i;
    TLD.lastIndex=0;
    while((m=TLD.exec(src))!==null)if(n.indexOf(m[1])<0)n.push(m[1]);
    for(i=0;i<n.length;i++)o+='try{typeof '+n[i]+'=="function"&&(window.'+n[i]+'='+n[i]+')}catch(e){}';
    return o?'\\n;'+o:'';
  }
  function runsAlways(declared, code){
    if(declared==='always')return true;
    if(declared==='once')return false;
    if(REGISTERS_SCOPE.test(code))return true;
    var head=code.trimStart();
    return head.charAt(0)==='('||head.charAt(0)===';';
  }
  // A component scope script names the root it binds in data-stx-owner (#1958).
  // On navigation it runs only for a root that just ARRIVED: one swapped in
  // with the new content, which is not bound yet. A layout component that
  // stayed on screen is skipped, in both shapes that reach here:
  //   - its root is gone: it keeps its first render's id while the fragment
  //     carries the next page's id for it (ids are page-keyed on purpose), so
  //     the script has no markup of its own;
  //   - its root is present and already bound: the same page file on both
  //     sides of the navigation gives the same id.
  // Either way running it built a second instance of a component whose markup
  // stays bound to the first -- setup and its side effects repeated on every
  // navigation. Scripts without an owner are unaffected.
  function ownerStays(owner){
    if(!owner)return false;
    var root=qs('[data-stx-scope="'+owner+'"]');
    return !root||typeof root.__stx_disposers==='function';
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
  // src="/_stx/runtime.<hash>.js" — with the content sniff behind it for a
  // document rendered by a server old enough not to stamp the attribute.
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
  // The runtime and the router themselves, as external script tags.
  //
  // Serve mode links both by content hash, so after a deploy the incoming
  // page's copy has a different URL from the one this document loaded. Every
  // path below that loads a script[src] it has not seen yet would then run a
  // second router and a second runtime over the live ones — two click
  // handlers on every link, a fresh window.stx under scopes created by the
  // old one. A new version is picked up by the build-skew reload instead; it
  // is never loaded into a running page. The attrs form is for the fragment
  // path, which sees a tag as text.
  function isSharedClientScript(el){
    return !!(el&&el.hasAttribute&&(el.hasAttribute('data-stx-runtime')||el.hasAttribute('data-stx-router')));
  }
  function isSharedClientScriptAttrs(attrs){
    return /(?:^|\\s)data-stx-(?:runtime|router)(?:[\\s=]|$)/i.test(attrs||'');
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
  // ── External scripts inside the routed container ──
  //
  // A page whose x-data factory lives in its own file — a
  // <script src="dashboard-xdata.js"> sitting inside [data-stx-content] — lost that
  // file on every SPA navigation. Both swap paths dropped it: the fragment
  // path's regex sees an empty body and returns '', and the full-document path
  // removed it outright. The inline scripts beside it were re-executed with
  // care; the external ones were deleted.
  //
  // The result was a screen that rendered on a cold load and came back empty
  // after a click, reporting "dashboardXData is not defined" with every binding
  // in the container left unevaluated — because nothing had defined it since
  // the file was thrown away.
  //
  // Loaded once per URL, never re-run. What these files define is a global that
  // outlives the navigation, so a second execution buys nothing and costs
  // whatever side effects the file has: a mount helper firing again on every
  // click through the same page is its own bug.
  var loadedExternalScripts={};
  // The base is resolved first because callers pass what they have: the
  // fragment path knows only the path it navigated to ('/reports/disk'), and
  // new URL(src, '/reports/disk') throws — a base must be absolute. Silently
  // returning '' there meant the file was never requested, which is the bug
  // this whole block exists to fix, reintroduced one level down.
  function externalScriptKey(src,base){
    try{
      var absoluteBase=base?new URL(base,location.href).href:location.href;
      return new URL(src,absoluteBase).href;
    }catch(e){return ''}
  }
  function rememberExternalScript(src,base){
    var key=externalScriptKey(src,base);
    if(key)loadedExternalScripts[key]=1;
    return key;
  }
  // Returns a promise, or null when there is nothing to wait for — an already
  // loaded file, or an unparseable src. Resolves rather than rejects on error:
  // one 404 must not stop the rest of the page hydrating, matching what the
  // head-script path already does by sending failures to execScripts too.
  function loadExternalScript(src,base){
    var key=externalScriptKey(src,base);
    if(!key||loadedExternalScripts[key])return null;
    loadedExternalScripts[key]=1;
    return new Promise(function(resolve){
      var el=ce('script');
      el.src=key;
      // Deliberately NOT data-stx-page: both swap paths clear those on every
      // navigation, which would sweep this away and — since it is never loaded
      // twice — leave the document without it. These are loaded once and stay,
      // the same as the external head scripts beside them.
      el.setAttribute('data-stx-external','');
      el.onload=function(){resolve()};
      el.onerror=function(){log('[router] container script failed:',key);resolve()};
      dhead().appendChild(el);
    });
  }

  // Record scripts from the initial page load
  qsa('script').forEach(function(s){
    var text=s.textContent||'';
    if(s.hasAttribute('src'))rememberExternalScript(s.getAttribute('src'));
    else if(text.trim())executedScriptHashes[hashScript(text)]=1;
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
    var meta=qs(LAYOUT_GROUP_META);
    if(meta&&meta.getAttribute('content'))return meta.getAttribute('content');
    var layout=qs(LAYOUT_META);
    return defaultLayoutGroup(layout?layout.getAttribute('content'):'');
  }
  function getDocLayoutGroup(doc,layout){
    var meta=doc&&doc.querySelector?doc.querySelector(LAYOUT_GROUP_META):null;
    return meta&&meta.getAttribute('content')?meta.getAttribute('content'):defaultLayoutGroup(layout||'');
  }
  function checkLayoutChange(newLayout,targetUrl,newGroup){
    var currentLayout=qs(LAYOUT_META);
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
  //
  // 'tab' is a tab's first screen: it takes the place of the entry the app
  // opened with (selectTab has rewound to it), under a token of its own so
  // the tab it replaced keeps its positions.
  var scrollSaved=false;
  function writeHistory(mode,href){
    // The position belongs to the entry being left, and scrollToken still
    // names it here -- unless the screen swap already saved it, before the
    // outgoing screen was lifted out of the page and the window clamped.
    if(!scrollSaved)rememberScroll();
    scrollSaved=false;
    if(mode==='replace'){
      // A replaced entry is still the one it replaces: pushed by the app or
      // the one the app opened with.
      var replaced=tokenState();
      if(history.state&&history.state[PUSHED_MARK])replaced[PUSHED_MARK]=true;
      history.replaceState(replaced,'',href);
      return;
    }
    scrollToken=newScrollToken();
    if(mode==='tab'){histDepth=0;history.replaceState(tokenState(),'',href);return}
    histDepth++;
    var pushed=tokenState();
    pushed[PUSHED_MARK]=true;
    history.pushState(pushed,'',href);
  }
  function tokenState(){var state={};state[SCROLL_TOKEN]=scrollToken;state[DEPTH]=histDepth;if(curTab)state[TAB]=curTab;return state}

  // Second arg accepts the legacy pushState boolean OR an options object
  // { replace, instant }. Callers inside this file still pass the boolean.
  // instant is what data-stx-transition="none" is to a link: no cross-fade.
  //
  // The newest navigation wins. One already on its way when another starts
  // (a second tap, Back while a page is still loading) is aborted and its
  // answer ignored: it used to be the other way round, the later one was
  // dropped, and a Back during a load left the address bar on the popped
  // entry while the screen went on to show the page being left.
  var navSeq=0;
  var navAbort=null;
  // What the next swap needs to know about where it is going: set by the
  // caller right before navigate() (popstate, a tab switch) and carried to
  // swap() through pendingCtx, the same way pendingContainerAttrs is.
  var navCtxNext=null;
  var pendingCtx=null;
  function routerFetch(url,headers){
    var init={headers:headers};
    if(navAbort)init.signal=navAbort.signal;
    return fetch(url,init);
  }
  function navigate(url,pushState,force){
    var ctx=navCtxNext||{};
    navCtxNext=null;
    if(pushState&&typeof pushState==='object'){if(pushState.instant)instantNext=true;pushState=pushState.replace?'replace':true}
    // Lang-picker passes force=true with an already-localized path (/en/...).
    // Re-localizing would map it back to the *current* locale and no-op.
    if(!force) url=withCurrentLocale(url);
    log('[router] navigate() called:',url,'isNavigating:',isNavigating);
    // Resolve against the current document URL, matching native <a> semantics.
    // With location.origin as the base, any relative href ('?status=resolved',
    // '#anchor', './sibling') resolved to the SITE ROOT — so filter tabs,
    // pagination and sort links silently bounced users to the landing page once
    // the SPA interceptor was active (#1777).
    var t=new URL(url,location.href);

    if(t.origin!==location.origin){location.href=url;return Promise.resolve(false)}

    if(t.pathname===location.pathname&&t.hash&&pushState!=='tab'){
      if(pushState!==false)writeHistory(pushState,t.href);
      var el=findIn(t.hash);
      if(el)el.scrollIntoView({behavior:'smooth'});
      return Promise.resolve(true);
    }

    // Skip if user clicks a link to the page they're already on. We
    // deliberately allow popstate (pushState===false) through because
    // the browser has already updated location.href to the popped
    // entry — without this allowance, hitting back would early-return
    // and the visible page content would be left frozen on the
    // forward-navigation page.
    if(pushState!==false&&pushState!=='tab'&&t.href===location.href&&!t.hash&&!force)return Promise.resolve(false);

    // Its prefetch is on the way: wait for that answer rather than asking the
    // server a second time. A later tap elsewhere wins.
    var awaitedKey=cacheKey(url);
    if(o.cache&&!force&&!cache[awaitedKey]&&prefetching[awaitedKey]&&prefetching[awaitedKey].then){
      awaitingKey=awaitedKey;
      return prefetching[awaitedKey].then(function(){
        if(awaitingKey!==awaitedKey)return false;
        awaitingKey='';
        navCtxNext=ctx;
        return navigate(url,pushState,force);
      });
    }
    awaitingKey='';

    if(navAbort){try{navAbort.abort()}catch(e){}}
    navAbort=typeof AbortController==='function'?new AbortController():null;
    var id=++navSeq;
    ctx.id=id;
    if(!ctx.direction)ctx.direction=pushState==='replace'?'replace':pushState==='tab'?'tab':pushState===false?'pop':'push';
    isNavigating=true;
    instantNav=instantNext;
    instantNext=false;
    document.body.classList.add(o.loadingClass);
    startProgress();

    var targetHref=t.href;
    var targetPath=cacheKey(url);
    var targetHash=t.hash;

    function done(){
      if(id!==navSeq)return;
      isNavigating=false;navAbort=null;
      document.body.classList.remove(o.loadingClass);finishProgress();
      settleDirection();
    }
    function stale(){return id!==navSeq}
    // A failed fetch keeps the app: the destination shows a way to try again
    // in place of its content, where a document load used to be the answer
    // to everything -- offline that load is the offline page, or nothing.
    function failed(err){
      if(stale()||(err&&err.name==='AbortError'))return false;
      console.error('[router] fetch error:',err);
      return showNavError(url,err,pushState,targetHash,ctx);
    }
    function swapWith(html,key){pendingCtx=ctx;return swap(html,key,pushState,targetHash)}

    if(o.cache&&cache[targetPath]&&!force){
      // Cache hit → promote in LRU order so this entry survives eviction
      // longer than other entries that haven't been touched.
      touchCache(targetPath);
      if(checkLayoutChange(layoutCache[targetPath],url,layoutGroupCache[targetPath])){
        // Layout changed — fetch full page and do full document swap
        log('[router] cache hit but layout changed — fetching full page');
        return routerFetch(url,{'Accept':'text/html'}).then(function(r){
          if(!r.ok)throw httpError(r.status);
          return r.text();
        }).then(function(html){
          if(stale())return false;
          log('[router] full page fetched from cache path, len:',html.length);
          pendingLayoutDecl={layout:layoutCache[targetPath]||'',group:layoutGroupCache[targetPath]||''};
          return swapWith(html,targetPath);
        }).catch(failed).finally(done);
      }
      pendingContainerAttrs=attrsCache[targetPath]||'';
      pendingLayoutDecl=null;
      return Promise.resolve(swapWith(cache[targetPath],targetPath)).then(function(swapped){
        if(swapped===false)return false;
        applyTitle(titleCache[targetPath]);
        // Shown from the cache at once; asked again behind it, so a page that
        // changed since says so (stx:updated) instead of staying stale.
        revalidate(targetPath,url);
        return true;
      }).finally(done);
    }
else {
      if(force&&cache[targetPath])evictCache(targetPath);
      // First fetch as fragment (SPA mode) when the configured container is
      // the page content. Custom app-shell containers need full documents so
      // the router does not inject a <main> fragment into the wrong element.
      var wantsFragment=shouldUseFragmentResponse();
      return routerFetch(url,wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'}).then(function(r){
        if(stale())return null;
        if(!r.ok)throw httpError(r.status);
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
          return routerFetch(url,{'Accept':'text/html'}).then(function(fullRes){
            log('[router] full page fetched:',fullRes.status,'ok:',fullRes.ok);
            if(!fullRes.ok)throw httpError(fullRes.status);
            return fullRes.text().then(function(html){
              log('[router] full page html length:',html.length);
              return{html:html,isFragment:false,layout:newLayout,layoutGroup:newGroup,title:newTitle};
            });
          });
        }
        return r.text().then(function(html){return{html:html,isFragment:isFragment,layout:newLayout,layoutGroup:newGroup,title:newTitle,containerAttrs:newCAttrs,runtime:newRuntime}});
      }).then(function(result){
        if(!result||stale())return false;
        if(result.isFragment)result.html=fragmentMarker(result.runtime)+result.html;
        if(o.cache)setCache(targetPath,result.html,result.layout,result.layoutGroup,result.title,result.containerAttrs);
        pendingContainerAttrs=result.isFragment?(result.containerAttrs||''):'';
        pendingLayoutDecl=result.isFragment?null:{layout:result.layout||'',group:result.layoutGroup||''};
        return Promise.resolve(swapWith(result.html,targetPath)).then(function(swapped){
          if(swapped===false)return false;
          // Fragment swaps carry no <head>; apply the title from the header.
          // Full-document swaps already set document.title from the <title> tag.
          if(result.isFragment)applyTitle(result.title);
          return true;
        });
      }).catch(failed).finally(done);
    }
  }
  function httpError(status){var err=new Error(String(status));err.status=status;return err}

  // ── A screen that could not be loaded ──
  // Shown in the routed container (in a screen of its own when screens are
  // retained, so Back returns to the one before it), with the address bar at
  // the destination, so "Try again" and coming back online both retry it in
  // place. A page that wants to draw its own cancels stx:navigate-error.
  function escAttr(v){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
  function showNavError(url,err,pushState,hash,ctx){
    var status=err&&err.status||0;
    var offline=!status&&navigator.onLine===false;
    var ev=new CustomEvent('stx:navigate-error',{cancelable:true,detail:{url:url,status:status,offline:offline,error:err}});
    window.dispatchEvent(ev);
    if(ev.defaultPrevented)return false;
    var title=offline?'You are offline':'This page could not be loaded';
    var text=offline?'It will load as soon as you are back online.':status?'Something went wrong on the way. Try again in a moment.':'Check your connection and try again.';
    var html='<!--stx-fragment rt=0--><div class="stx-retry" role="alert" data-stx-retry="'+escAttr(url)+'"><p class="stx-retry-title">'+title+'</p><p class="stx-retry-text">'+text+'</p><button type="button" class="stx-retry-button" data-stx-retry-button>Try again</button></div>';
    pendingContainerAttrs='';
    pendingLayoutDecl=null;
    pendingCtx=ctx;
    return Promise.resolve(swap(html,cacheKey(url),pushState,hash)).then(function(){return false});
  }
  function retryShown(){var root=activeRoot();var el=root&&root.querySelector?root.querySelector('[data-stx-retry]'):null;return el?el.getAttribute('data-stx-retry'):''}
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-stx-retry-button]'):null;
    if(!b)return;
    var holder=b.closest('[data-stx-retry]');
    if(holder)navigate(holder.getAttribute('data-stx-retry'),'replace',true);
  });
  window.addEventListener('online',function(){var u=retryShown();if(u)navigate(u,'replace',true)});

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
    el=ce('div');
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
    var c=activeRoot();
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
    if(hash){try{target=qs(hash)}catch(e){target=null}}
    if(!target)target=getContainer();
    if(!target||!target.focus)return;
    // The container is not naturally focusable. tabindex="-1" makes it
    // programmatically focusable without inserting it into the tab order.
    if(!target.hasAttribute('tabindex')){target.setAttribute('tabindex','-1');target.setAttribute('data-stx-route-focus','')}
    // preventScroll because scroll position is already decided just above —
    // focusing would otherwise fight scrollToTop and the hash scrollIntoView.
    try{target.focus({preventScroll:true})}catch(e){try{target.focus()}catch(e2){}}
  }

  // ── Generated utility stylesheets ──
  // Every page ships its own content-addressed utility sheet as
  // <link data-css="generated">, and none of them is ever removed on a
  // navigation, so they pile up in <head>. Two of them can define the same
  // class at the same specificity, which makes their ORDER decide the cascade:
  // the later sheet wins. Deduping alone left that order as "first seen", so
  // after Records → Feed → Records the Feed sheet still sat after the Records
  // one and its .flex-col beat Records' own responsive sm:flex-row — the header
  // stacked into a column on desktop. The current page's complete sheet has to
  // be the last one, every navigation, not just the first time it is seen.
  function findGeneratedCss(abs){
    var found=null;
    qsa('head link[data-css][href]').forEach(function(link){
      if(new URL(link.getAttribute('href'),location.href).href!==abs)return;
      // Collapse duplicates, so moving one copy to the end can never leave an
      // older copy of the same sheet behind to fight it.
      if(found){link.parentNode.removeChild(link);return}
      found=link;
    });
    return found;
  }

  // Before the swap: add each sheet the page does not have yet, as
  // media="print" so it downloads without restyling the page still on screen.
  // Returns a promise for them to finish (load OR error, capped at
  // cssLoadTimeout so a slow sheet never stalls navigation), or null when
  // nothing new is needed and the swap can go ahead in the same turn. The
  // promise resolves false when a sheet failed outright, and the caller then
  // navigates in full rather than swap in markup that has no styles.
  function preloadGeneratedCss(hrefs,base){
    var pending=[];
    hrefs.forEach(function(href){
      var abs;
      try{abs=new URL(href,base).href}catch(e){return}
      var link=findGeneratedCss(abs);
      if(link){
        // Still downloading for a navigation that never swapped — wait on it
        // rather than on nothing.
        if(link.__stxCssReady)pending.push(link.__stxCssReady);
        return;
      }
      link=ce('link');
      link.setAttribute('data-css','generated');
      link.setAttribute('rel','stylesheet');
      link.setAttribute('href',new URL(href,location.href).href===abs?href:abs);
      link.setAttribute('media','print');
      link.setAttribute('data-stx-css-pending','');
      link.__stxCssReady=new Promise(function(resolve){
        var timer=setTimeout(finish,o.cssLoadTimeout);
        function finish(failed){
          clearTimeout(timer);link.onload=null;link.onerror=null;link.__stxCssReady=null;
          // A sheet that failed (a 5xx, a dropped connection) is gone for good:
          // swapping anyway painted the page with only the utilities the
          // previous page happened to share, which reads as a broken layout.
          // Drop the dead <link> so a retry fetches it again, and report it.
          if(failed===true&&link.parentNode)link.parentNode.removeChild(link);
          resolve(failed!==true);
        }
        link.onload=function(){finish(false)};
        link.onerror=function(){finish(true)};
      });
      pending.push(link.__stxCssReady);
      dhead().appendChild(link);
    });
    return pending.length?Promise.all(pending).then(function(results){return results.every(function(ok){return ok!==false})}):null;
  }

  // Swap once the destination's sheets are in, or hand the navigation to the
  // browser when one could not be fetched — a full load retries the sheet.
  function afterCss(ready,url,swapNow){
    if(!ready)return swapNow();
    return ready.then(function(ok){
      if(ok)return swapNow();
      log('[router] stylesheet failed to load — full navigation to:',url);
      location.href=url;
      return false;
    });
  }

  // At the swap: make the destination's sheets live and move them to the end
  // of <head>. appendChild on a node that is already there MOVES it — no
  // duplicate, and the browser keeps the parsed sheet rather than refetching.
  // Only generated sheets are reordered; app and font stylesheets keep the
  // order they were declared in.
  function promoteGeneratedCss(hrefs,base){
    hrefs.forEach(function(href){
      var abs;
      try{abs=new URL(href,base).href}catch(e){return}
      var link=findGeneratedCss(abs);
      if(!link){
        preloadGeneratedCss([href],base);
        link=findGeneratedCss(abs);
        if(!link)return;
      }
      if(link.hasAttribute('data-stx-css-pending')){
        link.removeAttribute('data-stx-css-pending');
        link.removeAttribute('media');
      }
      dhead().appendChild(link);
    });
  }

  // The generated-sheet hrefs a fragment carries. Scripts are skipped so a
  // <link> written inside a string in page code is not mistaken for one.
  function fragmentCssHrefs(html){
    var hrefs=[];
    html.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/scr'+'ipt>','gi'),'').replace(new RegExp('<link\\\\b([^>]*)>','gi'),function(m,attrs){
      if(attrs.indexOf('data-css')===-1)return m;
      var hrefMatch=attrs.match(/\\bhref=(["'])(.*?)\\1/i);
      if(hrefMatch&&hrefMatch[2])hrefs.push(hrefMatch[2]);
      return m;
    });
    return hrefs;
  }

  function swap(html,url,pushState,hash){
    var fragMark=/^<!--stx-fragment(?: rt=([01]))?-->/.exec(html);
    var isFragment=!!fragMark;
    var declaredRuntime=fragMark&&fragMark[1]?fragMark[1]:'';
    if(isFragment)html=html.slice(fragMark[0].length);
    if(!isFragment&&!isStxDocument(html)){log('[router] non-stx document — full navigation to:',url);location.href=url;return Promise.resolve(false)}
    var ctx=pendingCtx||{direction:pushState==='replace'?'replace':pushState==='tab'?'tab':pushState===false?'pop':'push'};
    pendingCtx=null;
    var currentContent=getContainer();
    // The routed container. currentContent is where the page is written: the
    // container itself, or with screens retained, the new screen inside it.
    var host=currentContent;
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
      function doFragSwap(){
        hydrateServerData(html);
        // Extract scripts from fragment before injecting HTML
        var fragScripts=[];
        var fragScriptId=0;
        var fragStyles=[];
        var fragCssHrefs=[];
        var fragCss=null;
        var fragExternalScripts=[];
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
          // An external script has no body, so every check below reads it as
          // nothing to run and the fragment loses it. Queue it instead; the
          // file is where the page's factory usually lives.
          var srcMatch=attrs.match(/\\bsrc\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
          var fragSrc=srcMatch&&(srcMatch[1]||srcMatch[2]||srcMatch[3]);
          if(fragSrc){if(!isSharedClientScriptAttrs(attrs))fragExternalScripts.push(fragSrc);return ''}
          if(code&&code.trim()&&!isSignalsRuntimeScript({hasAttribute:function(name){return name==='data-stx-runtime'&&attrs.indexOf('data-stx-runtime')!==-1}},code)){
            var slot='fragment-'+(++fragScriptId);
            var scoped=/(?:^|\\s)data-stx-scoped(?:\\s|=|$)/i.test(attrs);
            var runDecl=(attrs.match(/data-stx-run\\s*=\\s*["']?(always|once)["']?/i)||[])[1];
            var ownerDecl=(attrs.match(/data-stx-owner\\s*=\\s*["']([^"']+)["']/i)||[])[1]||'';
            var registry=/(?:^|\\s)data-stx-modules(?:\\s|=|$)/i.test(attrs)||REGISTRY_TEXT.test(code);
            var composables=/(?:^|\\s)data-stx-composables(?:\\s|=|$)/i.test(attrs)||COMPOSABLES_TEXT.test(code);
            fragScripts.push({text:code,slot:slot,setupName:generatedSetupName(code),scoped:scoped,run:runDecl?runDecl.toLowerCase():'',owner:ownerDecl,registry:registry,composables:composables});
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
        // A <style> inside a script is a string the script owns — a web
        // component's shadow-DOM CSS, typically — not a page style. Lifted into
        // <head> it restyles the whole document (its bare button rule shrank
        // every button on the page) and the component loses it. Hold scripts
        // aside while the fragment's own styles are collected.
        var heldScripts=[];
        cleanFrag=cleanFrag.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/scr'+'ipt>','gi'),function(m){
          heldScripts.push(m);
          return '<!--stx-held-script-'+(heldScripts.length-1)+'-->';
        });
        cleanFrag=cleanFrag.replace(new RegExp('<sty'+'le\\\\b([^>]*)>([\\\\s\\\\S]*?)<\\\\/sty'+'le>','gi'),function(m,attrs,css){
          if(attrs.indexOf('data-css')!==-1){
            fragCss=css;
          }else{
            fragStyles.push({attrs:attrs,css:css});
          }
          return '';
        });
        cleanFrag=cleanFrag.replace(new RegExp('<link\\\\b([^>]*)>','gi'),function(m,attrs){
          if(attrs.indexOf('data-css')===-1)return m;
          var hrefMatch=attrs.match(/\\bhref=(["'])(.*?)\\1/i);
          if(hrefMatch&&hrefMatch[2])fragCssHrefs.push(hrefMatch[2]);
          return '';
        });
        cleanFrag=cleanFrag.replace(new RegExp('<!--stx-held-script-(\\\\d+)-->','g'),function(m,i){return heldScripts[Number(i)]});
        // Remove old page styles (not css — that gets merged)
        qsa('style[data-stx-page]').forEach(function(s){s.remove()});
        // Merge css CSS from fragment into existing css style
        if(fragCss){
          var curCss=qs('head style[data-css]');
          if(curCss){
            var merged=mergeCss(curCss.textContent||'',fragCss);
            if(merged)curCss.textContent=merged;
          }else{
            var cw=ce('style');
            cw.setAttribute('data-css','generated');
            cw.textContent=fragCss;
            dhead().appendChild(cw);
          }
        }
        // Already present ones are MOVED last, not skipped — see
        // promoteGeneratedCss for why their order is the whole bug.
        promoteGeneratedCss(fragCssHrefs,location.href);
        // Add new page styles
        fragStyles.forEach(function(s){
          var el=ce('style');
          el.textContent=s.css;
          el.setAttribute('data-stx-page','');
          dhead().appendChild(el);
        });
        // Swap content — apply the destination container's own attributes first
        // so the incoming markup lands in a correctly-laid-out container instead
        // of flashing (or sticking) unstyled.
        if(scr)scr.cattrs=pendingContainerAttrs;
        applyContainerAttrs(host,pendingContainerAttrs);
        currentContent.innerHTML=cleanFrag;
        // Remove old page scripts
        qsa('script[data-stx-page]').forEach(function(s){s.remove()});
        if(pushState!==false)writeHistory(pushState,url+(hash||''));
        if(scr)screenCommit(scr,url+(hash||''));
        refreshCurrentLinks();
        applyScroll(hash);
        window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url,direction:ctx.direction}}));
        // Before page scripts run, so a page that focuses its own control on
        // mount still wins — its script executes after this.
        focusAfterNavigation(hash);
        // Deferred a tick because the title is applied by the caller after this
        // swap resolves, and the announcement should read the new one.
        setTimeout(announceRoute,0);
        // Execute page scripts FIRST — they define setup functions and set _latestSetup
        log('[router] frag scripts:', fragScripts.length);
        qsa('script[data-stx-page]').forEach(function(s){s.remove()});
        // The page's module registry first (#1957), setups last. A fragment
        // lists its scripts in document order, and the registry is emitted
        // after the content it serves: a component that imports a package ran
        // ahead of it and threw "is not registered on this page". The full
        // document path orders them the same way (registryFirst, below).
        function fragOrder(entry){return entry.registry?0:entry.composables?1:entry.setupName?3:2}
        fragScripts.sort(function(a,b){return fragOrder(a)-fragOrder(b)});
        function runFragScripts(){
        fragScripts.forEach(function(entry){
          var code=entry.text;
          log('[router] exec script len:', code.length, 'has __stx_setup:', code.indexOf('__stx_setup')>-1);
          var placeholder=qs('script[data-stx-route-script="'+entry.slot+'"]');
          var nestedScopedTemplate=false;
          var scopedLoopSetup=false;
          if(entry.scoped&&placeholder){
            qsa('template').forEach(function(template){
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
          if(ownerStays(entry.owner)){
            log('[router] skipping component that stayed on the page:', entry.owner);
            return;
          }
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
          var ns=ce('script');
          var hasImport=hasStaticImport(code);
          if(hasImport){
            ns.type='module';
          }
          ns.textContent=markRan((hasImport||isAlreadyScoped)?code:'{'+code+'}');
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
        // The container's own files first, for the same reason as the
        // full-document path: the inline scripts call into them. Only awaited
        // when something actually has to load, so a fragment with no external
        // scripts — every fragment before this change — still runs its inline
        // scripts in the same synchronous turn and nothing about its timing
        // moves.
        var fragPending=[];
        fragExternalScripts.forEach(function(src){
          var pending=loadExternalScript(src,url);
          if(pending)fragPending.push(pending);
        });
        if(fragPending.length)Promise.all(fragPending).then(runFragScripts).catch(runFragScripts);
        else runFragScripts();
      }
      // With screens retained, the outgoing page is kept (or disposed once it
      // has animated away) by screenBegin rather than cleaned up here.
      var scr=null;
      var useScreens=screensOn();
      function startFragSwap(){
        if(ctx.id&&ctx.id!==navSeq)return Promise.resolve(false);
        if(pushState!==false)innerSnap=innerScroll(activeRoot());
        if(useScreens)settleAnimation();
        else if(window.stx&&window.stx._cleanupContainer)window.stx._cleanupContainer(currentContent);
        return new Promise(function(resolve,reject){
          function completeFragSwap(){
            try{
              setDirection(ctx.direction);
              if(useScreens){scr=screenBegin(host,ctx,html,pushState!==false);currentContent=scr.el}
              doFragSwap();
              if(scr)screenEnd(scr);
              resolve(true);
            }catch(err){reject(err)}
          }
          if(instantNav&&swapRunsInOneTask(html,url)){runInOneTask(completeFragSwap)}
          else if(instantNav&&runInstantSwap(completeFragSwap)){}
          else if(useScreens){completeFragSwap()}
          else if(runViewTransition(completeFragSwap)){}
          else if(instantNav){completeFragSwap()}
          else{currentContent.style.transition='opacity 0.12s ease-out';currentContent.style.opacity='0';setTimeout(function(){completeFragSwap();currentContent.style.opacity='1';setTimeout(function(){currentContent.style.transition=''},150)},120)}
        });
      }
      // A stylesheet this page has never loaded is fetched BEFORE the content
      // swaps, or the new markup paints once without its utilities and then
      // jumps. Cleanup waits with it so the outgoing page stays live meanwhile.
      // With nothing new to load this runs in the same turn, as it always did.
      var fragCssReady=preloadGeneratedCss(fragmentCssHrefs(html),location.href);
      return afterCss(fragCssReady,url,startFragSwap);
    }

    // Full document mode: parse with DOMParser and extract container content
    var parser=new DOMParser();
    var doc=parser.parseFromString(html,'text/html');
    // Full documents carry the build id as a meta rather than a header, and
    // this path also serves cached HTML, so check here too (#1772).
    var docBuildMeta=doc.querySelector(BUILD_META);
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

    // The destination's generated utility sheets, resolved against the page
    // being navigated to. Loaded before the swap and moved last during it —
    // same reasons as the fragment path (promoteGeneratedCss).
    var docCssBase;
    try{docCssBase=new URL(url,location.href).href}catch(e){docCssBase=location.href}
    var docCssHrefs=[];
    doc.querySelectorAll('head link[data-css][href]').forEach(function(l){docCssHrefs.push(l.getAttribute('href'))});

    function doSwap(){
      // ── Swap <head> styles ──
      // Inject new styles FIRST, then remove old to prevent unstyled flash
      var keepIds={'stx-r-css':1};
      var curStyles=qsa('head style');
      var newStyles=doc.querySelectorAll('head style');

      // Merge css styles instead of replacing — persistent elements
      // (nav, footer) outside <main> still need their utility classes
      var curCss=qs('head style[data-css]');
      var newCss=null;
      newStyles.forEach(function(s){if(s.getAttribute('data-css'))newCss=s});

      if(curCss&&newCss){
        var merged=mergeCss(curCss.textContent||'',newCss.textContent||'');
        if(merged)curCss.textContent=merged;
      }

      var incoming=[];
      newStyles.forEach(function(s){
        if(!keepIds[s.id]&&!s.getAttribute('data-css')){
          var ns=ce('style');
          ns.textContent=s.textContent;
          ns.setAttribute('data-stx-incoming','');
          dhead().appendChild(ns);
          incoming.push(ns);
        }
      });

      // If no existing css but new page has one, add it
      if(!curCss&&newCss){
        var ns=ce('style');
        ns.textContent=newCss.textContent;
        ns.setAttribute('data-css',newCss.getAttribute('data-css'));
        dhead().appendChild(ns);
      }

      // Remove old styles (except persistent ones, css, and incoming)
      curStyles.forEach(function(s){
        if(!keepIds[s.id]&&!s.hasAttribute('data-stx-incoming')&&!s.hasAttribute('data-css'))s.remove();
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
      qsa('head '+linkSel).forEach(function(l){var h=l.getAttribute('href');if(h)curLinks[new URL(h,location.href).href]=1});
      doc.querySelectorAll('head '+linkSel).forEach(function(l){
        var href=l.getAttribute('href');
        if(!href)return;
        // Generated utility sheets are not additive-only: promoteGeneratedCss
        // below also reorders them.
        if(l.hasAttribute('data-css'))return;
        var abs=new URL(href,docBase).href;
        if(curLinks[abs])return;
        curLinks[abs]=1;
        var nl=ce('link');
        Array.from(l.attributes).forEach(function(a){nl.setAttribute(a.name,a.value)});
        dhead().appendChild(nl);
      });
      // After every other stylesheet link, so the destination's complete
      // utility sheet is last in the cascade.
      promoteGeneratedCss(docCssHrefs,docBase);

      // ── Swap content ──
      // For layout changes: swap the entire <body> to replace layout chrome (nav, footer, etc.)
      // For same-layout: swap only the container (<main>)
      var newBody=doc.querySelector('body');
      var isLayoutChange=false;
      var declaredLayout=pendingLayoutDecl;
      pendingLayoutDecl=null;
      if(newBody){
        var newMeta=doc.querySelector(LAYOUT_META);
        var curMeta=qs(LAYOUT_META);
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
      var routedExternalScripts=[];
      var routedBodyScriptId=0;
      function prepareRoutedBodyScripts(root){
        if(!root)return;
        root.querySelectorAll('script').forEach(function(s){
          var text=s.textContent||'';
          // Not discarded: queued against docBase, so a relative src resolves
          // against the page being navigated to rather than the current URL.
          // The runtime and router are dropped, not queued: see isSharedClientScript.
          if(s.hasAttribute('src')){if(!isSharedClientScript(s))routedExternalScripts.push(s.getAttribute('src'));s.remove();return}
          var type=(s.getAttribute('type')||'').trim().toLowerCase();
          var executable=!type||type==='text/javascript'||type==='application/javascript'||type==='module';
          if(!executable||!text.trim())return;
          if(isSignalsRuntimeScript(s,text)||text.indexOf('__stxRouter')!==-1){s.remove();return}
          var slot='document-'+(++routedBodyScriptId);
          var setupName=generatedSetupName(text);
          if(setupName)incomingSetupName=setupName;
          routedBodyScripts.push({text:text,runAlways:true,slot:slot,setupName:setupName,run:s.getAttribute('data-stx-run')||'',owner:s.getAttribute('data-stx-owner')||'',registry:isModuleRegistryScript(s),composables:isComposablesScript(s)});
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
        // The outgoing chrome's components are destroyed with it (#1958).
        // They are no longer re-run on every navigation, so they live as long
        // as their layout does, and _cleanupContainer above only covered the
        // container: their onDestroy and their scopes waited for the next
        // navigation's orphan sweep, and their effects were never disposed.
        // Before the swap, while the old markup is still here to walk.
        if(window.stx&&window.stx._cleanupContainer)window.stx._cleanupContainer(document.body);
        document.body.innerHTML=bodyHTML;
        // Copy body attributes (class, data-stx, etc.)
        Array.from(newBody.attributes).forEach(function(attr){document.body.setAttribute(attr.name,attr.value)});
        // Update layout meta tag
        var oldMeta=qs(LAYOUT_META);
        var freshMeta=doc.querySelector(LAYOUT_META);
        if(oldMeta&&freshMeta)oldMeta.setAttribute('content',freshMeta.getAttribute('content')||'');
        else if(freshMeta){var m=ce('meta');m.name='stx-layout';m.content=freshMeta.getAttribute('content')||'';dhead().appendChild(m)}
        var oldGroupMeta=qs(LAYOUT_GROUP_META);
        var freshGroupMeta=doc.querySelector(LAYOUT_GROUP_META);
        if(oldGroupMeta&&freshGroupMeta)oldGroupMeta.setAttribute('content',freshGroupMeta.getAttribute('content')||'');
        else if(freshGroupMeta){var gm=ce('meta');gm.name='stx-layout-group';gm.content=freshGroupMeta.getAttribute('content')||'';dhead().appendChild(gm)}
        // Update container reference for script execution below
        currentContent=qs(containerSel)||qs('main')||document.body;
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

      // Teardown (including outgoing layout chrome) has finished. Its destroy
      // callbacks must not be able to invalidate the incoming page's snapshot.
      hydrateServerData(html);

      // ── Load new external <head> scripts ──
      var loadedSrcs={};
      qsa('head script[src]').forEach(function(s){loadedSrcs[s.src]=1});
      var extPromises=[];
      doc.querySelectorAll('head script[src]').forEach(function(s){
        if(isSharedClientScript(s))return;
        // Fetched-document script: resolve against the page being navigated to
        // (docBase), not the origin root — same rationale as the <link> reconcile (#1777).
        var src=new URL(s.getAttribute('src'),docBase).href;
        if(loadedSrcs[src])return;
        loadedSrcs[src]=1;
        extPromises.push(new Promise(function(resolve,reject){
          var ns=ce('script');
          ns.src=src;
          ns.onload=resolve;
          ns.onerror=reject;
          dhead().appendChild(ns);
        }));
      });

      // Before the inline scripts, and through the same barrier: an inline
      // script's whole reason for existing is often to call into one of these,
      // so running it first would fail exactly the way this bug did.
      routedExternalScripts.forEach(function(src){
        var pending=loadExternalScript(src,docBase);
        if(pending)extPromises.push(pending);
      });

      // ── Script re-execution ──
      // Remove previously injected page scripts
      qsa('script[data-stx-page]').forEach(function(s){s.remove()});

      var scripts=routedBodyScripts.slice();
      function addScript(text, runAlways, slot, owner){
        scripts.push({text:text,runAlways:!!runAlways,slot:slot||'',owner:owner||'',registry:REGISTRY_TEXT.test(text),composables:COMPOSABLES_TEXT.test(text)});
      }
      if(isLayoutChange){
        // Also collect setup functions from <head>, and the page's module
        // registry (#1957). The registry is anchored to the signals runtime,
        // and a layout with its own <head> script (analytics, say) pulls the
        // runtime -- and the registry with it -- into <head>. Collecting only
        // setups there dropped it, so every component that imports a local
        // module threw "is not registered on this page" and its template
        // hydrated against globals: an <input id="email"> bound to
        // :model="email" showed "[object HTMLInputElement]".
        doc.querySelectorAll('head script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          if(isSignalsRuntimeScript(s,text))return;
          if(isModuleRegistryScript(s)||isComposablesScript(s))addScript(text,true,'','');
          else if(text.indexOf('__stx_setup_')!==-1)addScript(text,true);
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
          // Code only, as prepareRoutedBodyScripts takes it. A layout island's
          // type="stx/island" script is hydrated by its own trigger, and one
          // collected here was set up on every navigation, the trigger or not.
          var scriptType=(s.getAttribute('type')||'').trim().toLowerCase();
          if(scriptType&&scriptType!=='text/javascript'&&scriptType!=='application/javascript'&&scriptType!=='module')return;
          // A component with no scope root has no root for the owner check,
          // so its script is marked data-stx-instance instead. Out here it
          // belongs to the layout chrome, which this swap leaves in place with
          // its instance running; running it again set up a second one, and a
          // stx.mount wrapper re-run from here mounted onto the container, the
          // incoming page's content (#1958). Fragments leave these out.
          if(s.hasAttribute('data-stx-instance'))return;
          if(text.indexOf('__stx_setup_')===-1&&!s.hasAttribute('data-stx-scoped')&&!s.hasAttribute('data-stx-page')&&!s.hasAttribute('data-stx-route-params'))return;
          var key=text.substring(0,80);
          if(seenSetups[key])return;
          seenSetups[key]=1;
          // A layout component outside the container carries its owner, so
          // execScripts skips it when it stayed on the page (#1958).
          addScript(text,true,'',s.getAttribute('data-stx-owner')||'');
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
      // The module registry runs before anything that reads it (#1957). The
      // container's own scripts are collected first and head scripts after,
      // so without this a component in the page body could run ahead of the
      // registry it imports from. Stable: the order within each group holds.
      var registryFirst=scripts.filter(function(e){return e.registry});
      var composablesNext=scripts.filter(function(e){return !e.registry&&e.composables});
      if(registryFirst.length||composablesNext.length)scripts=registryFirst.concat(composablesNext,scripts.filter(function(e){return !e.registry&&!e.composables}));

      // Push history state (before active link updates so location.pathname is current)
      if(pushState!==false)writeHistory(pushState,url+(hash||''));

      // Update active nav links
      refreshCurrentLinks();

      // Scroll
      applyScroll(hash);

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

      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url,direction:ctx.direction}}));

      // Execute page scripts FIRST — they define setup functions and set _latestSetup
      function execScripts(){
        scripts.forEach(function(entry){
          var text=typeof entry==='string'?entry:entry.text;
          var runAlways=typeof entry==='string'?false:entry.runAlways;
          if(typeof entry!=='string'&&ownerStays(entry.owner))return;
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
          var ns=ce('script');
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
          ns.textContent=markRan((hasImport||alreadyScoped)?text:'{'+text+republishTopLevel(text)+'}');
          ns.setAttribute('data-stx-page','');
          var placeholder=entry.slot?qs('script[data-stx-route-script="'+entry.slot+'"]'):null;
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

    function startSwap(){
      if(ctx.id&&ctx.id!==navSeq)return Promise.resolve(false);
      if(pushState!==false)innerSnap=innerScroll(activeRoot());
      setDirection(ctx.direction);
      // A whole document is written into the container as it is, so retained
      // screens go first: they would otherwise outlive the page they belong to.
      collapseScreens();
      currentContent=getContainer();
      // Clean up existing signals/effects
      if(window.stx&&window.stx._cleanupContainer){
        window.stx._cleanupContainer(currentContent);
      }
      return new Promise(function(resolve,reject){
        function completeSwap(){
          try{
            doSwap();
            resolve(true);
          }catch(err){reject(err)}
        }
        if(instantNav&&runInstantSwap(completeSwap)){
        }
        else if(runViewTransition(completeSwap)){
        }
        else if(instantNav){
          // A tab: swap at once, no fade either way.
          completeSwap();
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
    var docCssReady=preloadGeneratedCss(docCssHrefs,docCssBase);
    return afterCss(docCssReady,url,startSwap);
  }

  // ── Screens ──
  // A phone app keeps the screens it has shown. Going back finds the list
  // exactly where it was left, and switching tabs finds the other tab as it
  // was: the same DOM, its scroll, its signals still live. Re-rendering each
  // of them from the server on every visit is what made an stx app read as a
  // web page in a shell.
  //
  // So with screens on, each page is written into a screen of its own,
  // <div data-stx-screen>, inside the routed container. Leaving one by a push
  // or a tab switch hides it instead of disposing it; Back and the tab bar
  // show it again without running anything. Each tab owns a stack of them,
  // mirrored by the history entries above the one the app opened with.
  //
  // The runtime binds whichever element carries data-stx-content before it
  // falls back to the router's container, so the screen being shown wears
  // that marker and a navigation binds the new screen alone, leaving the
  // retained ones as they are. A container that is itself [data-stx-content]
  // (the app-shell mode) keeps the old behaviour, as does a page without the
  // signals runtime, which has nothing to retain.
  //
  // On when the page has tab links (data-stx-nav="tab"), or always with
  // screens:true; never with screens:false.
  var SCREEN='data-stx-screen';
  var HIDDEN='data-stx-screen-hidden';
  var TAB_SEL='[data-stx-nav="tab"],[data-native-tab]';
  var tabs={};
  var curTab='';
  var active=null;
  var shownSeq=0;
  var screensLive=false;
  function screensOn(){
    if(screensLive)return true;
    if(o.screens===false||o.screens==='false'||!shouldUseFragmentResponse())return false;
    var stx=window.stx;
    if(!stx||typeof stx._cleanupContainer!=='function')return false;
    var host=getContainer();
    if(!host||(host.closest&&host.closest('[data-stx-content]')))return false;
    return o.screens===true||!!qs(TAB_SEL);
  }
  // Where the current page lives: its screen, or the container.
  function activeRoot(){return active&&active.el&&active.el.isConnected?active.el:getContainer()}
  // A selector looked up in the page on screen first: a retained screen
  // carries the same ids as the page that rendered it.
  function findIn(sel){
    var root=activeRoot(),el=null;
    try{el=root&&root.querySelector?root.querySelector(sel):null;if(!el)el=qs(sel)}catch(e){}
    return el;
  }
  function stackOf(id){return tabs[id]||(tabs[id]=[])}
  function newEntry(url,token,depth){return{url:url,key:cacheKey(url),token:token,depth:depth,tab:curTab,el:null,sx:0,sy:0,inner:null,destroys:[],cattrs:'',shown:0}}
  function tabId(href){return cacheKey(withCurrentLocale(href))}
  function tabLinks(){return qsa(TAB_SEL)}
  // The tab the page on screen belongs to: the one the tab bar has current,
  // which the sticky nav keeps lit for a screen opened from it.
  function currentTabId(){
    var links=tabLinks(),best='',i;
    for(i=0;i<links.length;i++)if(links[i].hasAttribute('data-stx-nav-current'))return tabId(links[i].getAttribute('href')||'');
    for(i=0;i<links.length;i++){
      var st=linkState(links[i].getAttribute('href')||'',links[i].getAttribute('data-stx-active-match'));
      if(st&&(st.exact||st.matched))return tabId(links[i].getAttribute('href')||'');
      if(st&&st.active&&!best)best=tabId(links[i].getAttribute('href')||'');
    }
    return best;
  }
  // Which tab link the bar shows as current. Set by hand on a switch: the
  // sticky nav would otherwise keep the old tab lit over the other tab's
  // pushed screen, since neither tab's own URL is on screen.
  function markTab(id){
    tabLinks().forEach(function(a){
      if(tabId(a.getAttribute('href')||'')===id)a.setAttribute('data-stx-nav-current','');
      else a.removeAttribute('data-stx-nav-current');
    });
  }
  function hostAttrString(host){
    var out=[];
    if(host&&host.getAttributeNames)host.getAttributeNames().forEach(function(n){
      if(n==='data-stx-cattrs'||n==='data-stx-route-focus'||n==='data-stx-animating'||(n==='tabindex'&&host.hasAttribute('data-stx-route-focus')))return;
      out.push(n+'="'+escAttr(host.getAttribute(n))+'"');
    });
    return encodeURIComponent(out.join(' '));
  }
  // The page the app opened with becomes the first screen the first time a
  // screen is needed. Moved, not re-rendered: its bindings stay on its nodes.
  function adoptInitial(host){
    if(active&&active.el&&active.el.isConnected)return;
    screensLive=true;
    var el=ce('div');
    el.setAttribute(SCREEN,'');
    while(host.firstChild)el.appendChild(host.firstChild);
    host.appendChild(el);
    if(host.__stx_disposers){el.__stx_disposers=host.__stx_disposers;host.__stx_disposers=null}
    if(!curTab)curTab=currentTabId();
    active=newEntry(location.pathname+location.search+location.hash,scrollToken,histDepth);
    active.el=el;
    active.cattrs=hostAttrString(host);
    active.shown=++shownSeq;
    stackOf(curTab)[histDepth]=active;
    markActive(el);
  }
  function markActive(el){
    var host=getContainer();
    if(host)Array.prototype.forEach.call(host.querySelectorAll('['+SCREEN+'][data-stx-content]'),function(other){if(other!==el)other.removeAttribute('data-stx-content')});
    el.setAttribute('data-stx-content','');
    el.removeAttribute(HIDDEN);
  }
  function saveScroll(e){
    e.sx=window.pageXOffset||window.scrollX||0;
    e.sy=window.pageYOffset||window.scrollY||0;
    e.inner=innerScroll(e.el);
  }
  // Everything that is global to the page on screen, kept with it while it is
  // hidden: its page-level onDestroy callbacks (the runtime runs whatever is
  // queued on the next stx:load, which would tear a retained page down), its
  // setup, its server data and its route params.
  function saveEntry(e){
    var stx=window.stx||{};
    e.title=document.title;
    e.setup=stx._latestSetup;
    e.data=window.__STX_DATA__;
    e.config=window.__STX_RUNTIME_CONFIG__;
    e.params=stx._rp||window.__stx_rp||{};
    if(stx._destroyCallbacks)e.destroys=e.destroys.concat(stx._destroyCallbacks.splice(0));
  }
  function restoreEntry(e){
    var stx=window.stx||{};
    if(e.title)document.title=e.title;
    if(e.setup)stx._latestSetup=e.setup;
    window.__STX_DATA__=e.data||{};
    window.__STX_RUNTIME_CONFIG__=e.config||{};
    if(stx._destroyCallbacks&&e.destroys.length)Array.prototype.push.apply(stx._destroyCallbacks,e.destroys);
    e.destroys=[];
    applyContainerAttrs(getContainer(),e.cattrs);
  }
  // A new page must not share the outgoing page's scope object, or its setup
  // merges into the one the retained screen's bindings read. Cleaning an
  // empty element resets that scope and nothing else.
  function resetScope(){
    var stx=window.stx;
    if(!stx||!stx._cleanupContainer)return;
    var keep=stx._mountCallbacks?stx._mountCallbacks.splice(0):[];
    stx._cleanupContainer(ce('div'));
    if(stx._mountCallbacks)Array.prototype.push.apply(stx._mountCallbacks,keep);
  }
  function hideScreen(e){
    if(!e||!e.el)return;
    unfreeze(e.el);
    e.el.setAttribute(HIDDEN,'');
    e.el.removeAttribute('data-stx-content');
  }
  // Disposal runs the same paths a navigation always has: the runtime's
  // container cleanup (effects, scopes, element hooks) and the page-level
  // onDestroy callbacks that were put aside when the screen was hidden.
  // Pending mount callbacks belong to whatever is arriving, so they survive.
  function disposeEntry(e){
    if(!e||!e.el)return;
    var el=e.el,stx=window.stx;
    e.el=null;
    if(e===active)saveEntry(e);
    if(stx&&stx._cleanupContainer){
      var keep=stx._mountCallbacks?stx._mountCallbacks.splice(0):[];
      try{stx._cleanupContainer(el)}catch(err){console.error('[router] screen cleanup failed:',err)}
      if(stx._mountCallbacks)Array.prototype.push.apply(stx._mountCallbacks,keep);
    }
    var fns=e.destroys;e.destroys=[];
    fns.forEach(function(fn){try{fn()}catch(err){console.warn('[stx] destroy callback error:',err)}});
    if(el.parentNode)el.parentNode.removeChild(el);
  }
  function eachEntry(fn){for(var id in tabs)tabs[id].forEach(function(e){if(e)fn(e,id)})}
  // Keep at most screenLimit screens alive, the least recently shown going
  // first. An evicted screen stays in its stack as an address: Back to it
  // loads it again.
  function enforceLimit(){
    var live=[];
    eachEntry(function(e){if(e.el&&e!==active&&!e.leaving)live.push(e)});
    live.sort(function(a,b){return a.shown-b.shown});
    while(live.length+1>Math.max(1,o.screenLimit|0))disposeEntry(live.shift());
  }
  // Everything back to the plain container: before a whole-document swap and
  // when the screens are given up.
  // The screen on screen is left in place: the swap cleans the container,
  // and it with it, as it always has.
  function collapseScreens(){
    if(!screensLive)return;
    settleAnimation();
    eachEntry(function(e){if(e!==active)disposeEntry(e)});
    tabs={};active=null;screensLive=false;
  }
  // Component scopes are keyed by ids the server derives from the page, so a
  // second visit to the same page, pushed over a retained first one, brings
  // the same ids. The retained copies are renamed out of the way, registry
  // entry and all, so each instance keeps its own and disposing one cannot
  // reach the other.
  var retagSeq=0;
  function retagCollisions(html){
    var ids={},any=false;
    html.replace(/data-stx-scope="([^"]+)"/g,function(m,id){ids[id]=1;any=true;return m});
    if(!any)return;
    var scopes=window.stx&&window.stx._scopes;
    eachEntry(function(e){
      if(!e.el)return;
      Array.prototype.forEach.call(e.el.querySelectorAll('[data-stx-scope]'),function(node){
        var id=node.getAttribute('data-stx-scope');
        if(!ids[id])return;
        var next=id+'-r'+(++retagSeq);
        node.setAttribute('data-stx-scope',next);
        if(scopes&&scopes[id]&&(!scopes[id].__el||scopes[id].__el===node)){scopes[next]=scopes[id];delete scopes[id]}
      });
    });
  }

  // The swap's half: before the page is written, the outgoing screen is put
  // aside (lifted out of the page for a slide, or hidden), and a new screen
  // is made for the page to go into, first in the container so that a lookup
  // by id finds the page on screen before any retained copy of it.
  function screenBegin(host,ctx,html,writes){
    adoptInitial(host);
    var from=active;
    retagCollisions(html);
    if(from&&from.el){
      // A popstate saved the outgoing position already, under the token it
      // has since replaced; saving again here would file it under the wrong one.
      if(writes){rememberScroll();scrollSaved=true}
      saveEntry(from);
    }
    resetScope();
    var el=ce('div');
    el.setAttribute(SCREEN,'');
    var anim=!!(from&&from.el&&canAnimate(ctx.direction));
    if(anim)freeze(from.el);
    else if(from&&from.el)hideScreen(from);
    host.insertBefore(el,host.firstChild);
    markActive(el);
    return{el:el,from:from,ctx:ctx,anim:anim,cattrs:''};
  }
  // After the history write, so the entry knows its token and depth.
  function screenCommit(scr,href){
    var e=scr.ctx.entry||newEntry(href,scrollToken,histDepth);
    e.url=href;e.key=cacheKey(href);e.token=scrollToken;e.depth=histDepth;e.tab=curTab;
    e.el=scr.el;e.cattrs=scr.cattrs;e.shown=++shownSeq;e.destroys=[];
    var stack=stackOf(curTab);
    // A push drops whatever was forward of it; a pop or a replacement takes
    // the place of what was at its depth. The outgoing screen is left to the
    // transition, which disposes it once it is off screen.
    for(var i=e.depth;i<stack.length;i++){var x=stack[i];if(x&&x!==e&&x!==scr.from)disposeEntry(x)}
    stack.length=e.depth;
    stack[e.depth]=e;
    active=e;
    scrollSaved=false;
  }
  function screenEnd(scr){
    var from=scr.from,dir=scr.ctx.direction;
    if(!from||!from.el){finishScreen();return}
    // Retained: left by a push, or by a tab switch. Popped or replaced: gone.
    var keep=dir==='push'||dir==='tab';
    var stack=tabs[from.tab];
    if(keep&&!(stack&&stack[from.depth]===from))keep=false;
    from.leaving=true;
    var after=function(){
      from.leaving=false;
      if(keep&&from.el)hideScreen(from);
      else disposeEntry(from);
      finishScreen();
    };
    if(scr.anim)animateScreens(from.el,scr.el,dir,after);
    else after();
  }
  function finishScreen(){
    enforceLimit();
    observeLinks();
  }

  // Show a screen that is already here: Back to one below in the stack, or a
  // tab's top screen. Nothing is fetched and no page script runs; the page is
  // told it is on screen again (stx:screen-shown) so it can refresh whatever
  // may have gone stale while it was hidden.
  function showRetained(to,dir,opts){
    opts=opts||{};
    settleAnimation();
    var from=active,host=getContainer();
    if(navAbort){try{navAbort.abort()}catch(e){}navAbort=null}
    navSeq++;
    isNavigating=false;
    document.body.classList.remove(o.loadingClass);
    if(from&&from.el){if(!opts.settled)saveScroll(from);saveEntry(from)}
    setDirection(dir);
    var anim=!opts.settled&&from&&from.el&&from!==to&&canAnimate(dir,true);
    if(anim)freeze(from.el);
    else if(from&&from.el&&from!==to&&!opts.settled)hideScreen(from);
    unfreeze(to.el);
    markActive(to.el);
    active=to;
    to.shown=++shownSeq;
    restoreEntry(to);
    pendingScroll=null;pendingInner=null;
    window.scrollTo({left:to.sx,top:to.sy,behavior:'instant'});
    applyInner(to.el,to.inner);
    if(opts.settled&&from&&from!==to&&from.el)hideScreen(from);
    refreshCurrentLinks();
    window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:to.url,direction:dir,retained:true,params:to.params||{}}}));
    focusAfterNavigation('');
    setTimeout(announceRoute,0);
    window.dispatchEvent(new CustomEvent('stx:screen-shown',{detail:{url:to.url,direction:dir}}));
    revalidate(to.key,to.url);
    var keep=dir==='push'||dir==='tab';
    var after=function(){
      if(from&&from!==to){
        if(dir==='pop'){
          // Everything above the screen shown is gone from the stack.
          var stack=tabs[to.tab]||[];
          for(var i=to.depth+1;i<stack.length;i++)if(stack[i]&&stack[i]!==from)disposeEntry(stack[i]);
          stack.length=to.depth+1;
        }
        if(keep&&from.el)hideScreen(from);
        else if(!keep)disposeEntry(from);
      }
      finishScreen();
      settleDirection();
    };
    if(anim){from.leaving=true;animateScreens(from.el,to.el,dir,function(){from.leaving=false;after()})}
    else after();
    return true;
  }

  // ── Direction and motion ──
  // data-nav-direction on <html> says what kind of move is under way --
  // push, pop, tab or replace -- for as long as it is, so CSS (and a page's
  // own transitions) can tell a step forward from a step back.
  var animEnd=null;
  function setDirection(d){if(d)document.documentElement.setAttribute('data-nav-direction',d)}
  function settleDirection(){
    if(isNavigating||animEnd)return;
    document.documentElement.removeAttribute('data-nav-direction');
  }
  function reducedMotion(){
    try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){return false}
  }
  // instantNav belongs to a navigation that fetched; a screen shown from
  // the stack (Back) is not one, and must not inherit the last tab tap's.
  function canAnimate(dir,shown){
    return (dir==='push'||dir==='pop')&&(shown||!instantNav)&&o.navDuration>0&&typeof window.getComputedStyle==='function';
  }
  // The first background behind the container that is not transparent: the
  // screens are transparent, and two of them sliding over each other need
  // the page's colour to hide the one underneath.
  function screenBackground(host){
    for(var n=host;n&&n.nodeType===1;n=n.parentNode){
      var c='';
      try{c=getComputedStyle(n).backgroundColor}catch(e){}
      if(c&&c!=='transparent'&&c!=='rgba(0, 0, 0, 0)')return c;
    }
    return '';
  }
  // Lifted out of the flow and pinned where it is on screen, as a box the
  // height of the viewport scrolled to the same place: the page can scroll
  // to wherever the next screen wants, the outgoing one does not move, and a
  // sticky header inside it stays stuck.
  function freeze(el,top){
    var r=el.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    var at=top===undefined?r.top:top;
    var y=Math.max(at,0);
    var s=el.style;
    s.position='fixed';s.top=y+'px';s.left=r.left+'px';s.width=r.width+'px';s.height=Math.max(vh-y,0)+'px';s.overflow='hidden';s.margin='0';
    el.scrollTop=y-at;
  }
  function unfreeze(el){
    if(!el)return;
    var s=el.style;
    ['position','top','left','width','height','overflow','margin','transform','transition','zIndex','backgroundColor','pointerEvents'].forEach(function(k){s[k]=''});
    el.removeAttribute('data-stx-screen-enter');
    el.removeAttribute('data-stx-screen-leave');
    el.scrollTop=0;
  }
  function parseDuration(v){
    v=String(v||'').split(',')[0].trim();
    var n=parseFloat(v);
    if(!(n>=0))return -1;
    return v.indexOf('ms')>0?n:n*1000;
  }
  function dimLayer(host){
    var r=host.getBoundingClientRect();
    var dim=ce('div');
    dim.setAttribute('data-stx-screen-dim','');
    dim.style.left=r.left+'px';
    dim.style.width=r.width+'px';
    return dim;
  }
  // Two real screens, animated by the shipped CSS: the one arriving and the
  // one leaving, and a dim between them over the one underneath.
  function animateScreens(fromEl,toEl,dir,done){
    var host=getContainer();
    var bg=screenBackground(host);
    var dim=dimLayer(host);
    host.setAttribute('data-stx-animating','');
    fromEl.style.backgroundColor=bg;toEl.style.backgroundColor=bg;
    fromEl.style.pointerEvents='none';
    fromEl.setAttribute('data-stx-screen-leave','');
    toEl.setAttribute('data-stx-screen-enter','');
    host.appendChild(dim);
    var ms=-1;
    try{ms=parseDuration(getComputedStyle(toEl).animationDuration)}catch(e){}
    if(!(ms>0))ms=o.navDuration;
    var timer=setTimeout(end,ms+120);
    function onEnd(e){if(e.target===toEl)end()}
    toEl.addEventListener('animationend',onEnd);
    function end(){
      if(animEnd!==end)return;
      animEnd=null;
      clearTimeout(timer);
      toEl.removeEventListener('animationend',onEnd);
      if(dim.parentNode)dim.parentNode.removeChild(dim);
      host.removeAttribute('data-stx-animating');
      toEl.removeAttribute('data-stx-screen-enter');
      toEl.style.backgroundColor='';
      done();
      settleDirection();
    }
    animEnd=end;
  }
  // A navigation that starts while a slide is still running finishes the
  // slide first, rather than lifting a screen that is halfway across.
  function settleAnimation(){if(animEnd)animEnd()}

  // ── Tabs ──
  // Back never crosses tabs: the history above the entry the app opened with
  // is always the current tab's stack. A switch rewinds to that entry, writes
  // the target tab's stack in its place, and shows its top screen exactly as
  // it was left.
  var rewinding=null;
  function rewind(){
    if(histDepth<=0)return Promise.resolve();
    return new Promise(function(resolve){
      var n=histDepth;
      var timer=setTimeout(finish,700);
      function finish(){
        clearTimeout(timer);
        if(rewinding===finish)rewinding=null;
        histDepth=(history.state&&history.state[DEPTH])|0;
        var token=history.state&&history.state[SCROLL_TOKEN];
        if(token)scrollToken=token;
        resolve();
      }
      rewinding=finish;
      history.go(-n);
    });
  }
  function entryState(e,pushed){
    var st={};
    st[SCROLL_TOKEN]=e.token;st[DEPTH]=e.depth;st[TAB]=e.tab;
    if(pushed)st[PUSHED_MARK]=true;
    return st;
  }
  function selectTab(href){
    if(!href)return Promise.resolve(false);
    var id=tabId(href);
    var on=screensOn();
    if(on&&!screensLive)adoptInitial(getContainer());
    if(!curTab)curTab=on&&active?active.tab:currentTabId();
    if(id===curTab)return reselectTab(href);
    if(active&&active.el){rememberScroll();saveScroll(active)}
    settleAnimation();
    if(navAbort){try{navAbort.abort()}catch(e){}navAbort=null}
    var seq=++navSeq;
    return rewind().then(function(){
      if(seq!==navSeq)return false;
      curTab=id;
      markTab(id);
      var stack=on?(tabs[id]||[]).filter(Boolean):[];
      if(!stack.length){
        if(on)tabs[id]=[];
        navCtxNext={direction:'tab'};
        instantNext=true;
        return navigate(href,'tab');
      }
      // Rewritten in order, so Back walks this tab's own stack.
      stack.forEach(function(e,i){
        e.depth=i;e.tab=id;
        if(i===0)history.replaceState(entryState(e,false),'',e.url);
        else history.pushState(entryState(e,true),'',e.url);
      });
      tabs[id]=stack;
      var top=stack[stack.length-1];
      histDepth=top.depth;
      scrollToken=top.token;
      if(top.el)return showRetained(top,'tab');
      // Its top screen was let go: load it into the same entry.
      pendingScroll=[top.sx,top.sy];
      navCtxNext={direction:'tab',entry:top};
      instantNext=true;
      return navigate(top.url,false);
    });
  }
  // The tab that is already current, selected again: back to the top of its
  // screen, and when it is there already, back to the tab's first screen.
  // stx:tabreselect says which, and a page that cancels it keeps its own.
  function reselectTab(href){
    var root=activeRoot();
    var y=window.pageYOffset||window.scrollY||0;
    var inner=innerScroll(root);
    var atRoot=active?active.depth===0&&active.key===tabId(href):cacheKey(location.href)===tabId(href);
    var action=(y>0||inner)?'top':atRoot?'none':'root';
    var ev=new CustomEvent('stx:tabreselect',{cancelable:true,detail:{href:href,action:action}});
    window.dispatchEvent(ev);
    if(ev.defaultPrevented||action==='none')return Promise.resolve(false);
    if(action==='top'){
      window.scrollTo({top:0,left:0,behavior:reducedMotion()?'instant':'smooth'});
      if(root&&root.querySelectorAll)root.querySelectorAll('[data-stx-scroll]').forEach(function(el){if(el.scrollTo)el.scrollTo({top:0,left:0,behavior:'smooth'});else el.scrollTop=0});
      return Promise.resolve(true);
    }
    var stack=tabs[curTab]||[];
    var first=stack.filter(Boolean)[0];
    if(first&&first.el&&first.key===tabId(href)&&histDepth>0){
      var target=first;
      return new Promise(function(resolve){
        history.go(target.depth-histDepth);
        setTimeout(function(){resolve(true)},0);
      });
    }
    // The tab's first screen is not here (opened on a deep link, or let
    // go): load the tab's own page in its place.
    return rewind().then(function(){
      navCtxNext={direction:'pop'};
      return navigate(href,'tab');
    });
  }

  // ── Swipe back ──
  // A pan from the left edge drags the screen on top away and shows the
  // retained one underneath, the way iOS does: the one underneath moves from
  // -30% and brightens as the top one goes. Released past half way, or
  // flicked, it completes as a Back (history.back(), shown without a second
  // animation); otherwise it springs back. Only where there is a screen to
  // go back to in this tab, never from inside data-stx-no-swipe, and never
  // over something that pans sideways on its own (touch-action none, pan-x,
  // pan-y, or a horizontal scroller that is not at its start).
  var swipe=null;
  var swipeSettled=null;
  function swipePrev(){
    if(o.swipeBack===false||!screensLive||!active||!active.el||isNavigating||animEnd)return null;
    var prev=(tabs[curTab]||[])[active.depth-1];
    return prev&&prev.el?prev:null;
  }
  function swipeBlocked(target){
    var host=getContainer();
    for(var n=target;n&&n.nodeType===1&&n!==host;n=n.parentNode){
      if(n.hasAttribute('data-stx-no-swipe'))return true;
      var cs=null;
      try{cs=getComputedStyle(n)}catch(e){}
      if(!cs)continue;
      var ta=String(cs.touchAction||'').split(' ');
      var has=function(v){return ta.indexOf(v)!==-1};
      if(has('none')||(has('pan-x')||has('pan-left')||has('pan-right'))!==(has('pan-y')||has('pan-up')||has('pan-down')))return true;
      var ox=String(cs.overflowX||'');
      if((ox==='auto'||ox==='scroll')&&n.scrollWidth>n.clientWidth&&n.scrollLeft>0)return true;
    }
    return false;
  }
  function now(){return window.performance&&performance.now?performance.now():Date.now()}
  function touchOf(e){return (e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0])||null}
  function swipeStart(e){
    if(swipe||!e.touches||e.touches.length!==1)return;
    var t=e.touches[0];
    if(t.clientX>o.swipeEdge)return;
    var prev=swipePrev();
    if(!prev||swipeBlocked(e.target))return;
    swipe={prev:prev,x0:t.clientX,y0:t.clientY,x:t.clientX,t:now(),v:0,on:false};
  }
  function swipeBegin(){
    var cur=active,prev=swipe.prev,host=getContainer();
    var w=host.getBoundingClientRect().width||window.innerWidth||1;
    saveScroll(cur);
    var docTop=cur.el.getBoundingClientRect().top+(window.pageYOffset||window.scrollY||0);
    swipe.w=w;
    swipe.cur=cur;
    swipe.bg=screenBackground(host);
    swipe.dim=dimLayer(host);
    swipe.dim.setAttribute('data-stx-drag','');
    // Shown before it is measured: a hidden screen has no box to pin.
    prev.el.removeAttribute(HIDDEN);
    freeze(prev.el,docTop-prev.sy);
    applyInner(prev.el,prev.inner);
    prev.el.style.zIndex='1';
    prev.el.style.backgroundColor=swipe.bg;
    cur.el.style.position='relative';
    cur.el.style.zIndex='3';
    cur.el.style.backgroundColor=swipe.bg;
    host.setAttribute('data-stx-animating','');
    host.appendChild(swipe.dim);
    setDirection('pop');
    swipe.on=true;
  }
  function swipeDraw(dx){
    var p=Math.min(Math.max(dx/swipe.w,0),1);
    swipe.p=p;
    swipe.cur.el.style.transform='translateX('+(p*swipe.w)+'px)';
    swipe.prev.el.style.transform='translateX('+(-0.3*swipe.w*(1-p))+'px)';
    swipe.dim.style.opacity=String(1-p);
  }
  function swipeMove(e){
    if(!swipe)return;
    var t=touchOf(e);
    if(!t)return;
    var dx=t.clientX-swipe.x0,dy=t.clientY-swipe.y0;
    if(!swipe.on){
      if(Math.abs(dx)<8&&Math.abs(dy)<8)return;
      // Vertical first, or leftwards: a scroll, not a Back.
      if(dx<=0||Math.abs(dy)>=Math.abs(dx)){swipe=null;return}
      swipeBegin();
    }
    if(e.cancelable)e.preventDefault();
    var n=now(),dt=n-swipe.t;
    if(dt>0)swipe.v=swipe.v*0.2+((t.clientX-swipe.x)/dt)*0.8;
    swipe.x=t.clientX;swipe.t=n;
    swipeDraw(dx);
  }
  function swipeEnd(e){
    if(!swipe)return;
    var s=swipe;
    swipe=null;
    if(!s.on)return;
    // A finger held still before lifting has no speed left.
    if(now()-s.t>80)s.v=0;
    var commit=e.type!=='touchcancel'&&(s.p>0.5||s.v>0.5);
    var remaining=commit?(1-s.p)*s.w:s.p*s.w;
    var ms=Math.round(Math.min(o.navDuration,Math.max(120,remaining/Math.max(Math.abs(s.v),0.6))));
    var ease='cubic-bezier(0.2, 0.9, 0.3, 1)';
    [s.cur.el,s.prev.el].forEach(function(el){el.style.transition='transform '+ms+'ms '+ease});
    s.dim.style.transition='opacity '+ms+'ms '+ease;
    s.cur.el.style.transform=commit?'translateX('+s.w+'px)':'translateX(0px)';
    s.prev.el.style.transform=commit?'translateX(0px)':'translateX('+(-0.3*s.w)+'px)';
    s.dim.style.opacity=commit?'0':'1';
    var finished=false;
    var finish=function(){
      if(finished)return;
      finished=true;
      animEnd=null;
      if(s.dim.parentNode)s.dim.parentNode.removeChild(s.dim);
      getContainer().removeAttribute('data-stx-animating');
      if(commit){
        // Already where Back would put it: the popstate that follows shows
        // the screen underneath as it is, with no second animation.
        s.cur.el.style.visibility='hidden';
        swipeSettled=s.prev;
        history.back();
      }
      else{
        hideScreen(s.prev);
        s.cur.el.style.transform='';s.cur.el.style.transition='';s.cur.el.style.position='';s.cur.el.style.zIndex='';s.cur.el.style.backgroundColor='';
        settleDirection();
      }
    };
    animEnd=finish;
    setTimeout(finish,ms+40);
  }
  document.addEventListener('touchstart',swipeStart,{capture:true,passive:true});
  document.addEventListener('touchmove',swipeMove,{capture:true,passive:false});
  document.addEventListener('touchend',swipeEnd,{capture:true,passive:true});
  document.addEventListener('touchcancel',swipeEnd,{capture:true,passive:true});
  // The system is short of memory: let go of every hidden screen except the
  // one a swipe back would show.
  window.addEventListener('craftMemoryWarning',function(){
    var keep=active?(tabs[curTab]||[])[active.depth-1]:null;
    eachEntry(function(e){if(e!==active&&e!==keep&&!e.leaving)disposeEntry(e)});
  });

  // ── Revalidation and updates ──
  // A page served from the router's cache, or a screen shown again, is asked
  // for once more behind the swap. If it changed, the cache takes the new copy
  // and stx:updated says so, so the page can refresh what it shows; the
  // screen is never swapped out from under the user.
  function revalidate(key,url){
    if(!o.revalidate||!o.cache||!key||prefetching[key])return;
    if(Date.now()-(cacheAt[key]||0)<o.revalidateAfter)return;
    var wantsFragment=shouldUseFragmentResponse();
    var before=cache[key];
    prefetching[key]=fetch(url,{headers:wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'}}).then(function(r){
      var incoming=r.headers.get('X-STX-Build')||'';
      if(isBuildSkew(incoming)){reloadForSkew(url,incoming,true);return null}
      return readPrefetchResponse(r,wantsFragment);
    }).then(function(result){
      if(!result)return;
      if(o.cache)setCache(key,result.html,result.layout,result.layoutGroup,result.title,result.containerAttrs);
      if(before!==undefined&&before!==result.html&&cacheKey(location.href)===key)emitUpdated(url,'page');
    }).catch(function(){}).finally(function(){delete prefetching[key]});
  }
  // The offline worker answered from its cache and found something newer
  // behind it. It posts { type: 'stx:updated', url, kind }, which its own
  // register script turns into a window event; the router does that only
  // where that script is not on the page, so the event is heard once. Either
  // way a page the router has cached is dropped, so the next visit gets the
  // new one.
  var ownUpdate=false;
  function emitUpdated(url,kind){
    ownUpdate=true;
    try{window.dispatchEvent(new CustomEvent('stx:updated',{detail:{url:url,kind:kind||'page'}}))}finally{ownUpdate=false}
  }
  window.addEventListener('stx:updated',function(e){
    var d=e&&e.detail;
    if(ownUpdate||!d||!d.url||d.kind==='api')return;
    try{evictCache(cacheKey(d.url))}catch(err){}
  });
  try{
    var sw=navigator.serviceWorker;
    if(sw&&sw.addEventListener)sw.addEventListener('message',function(e){
      var d=e&&e.data;
      if(!d||d.type!=='stx:updated'||window.stxOffline)return;
      window.dispatchEvent(new CustomEvent('stx:updated',{detail:{url:d.url,kind:d.kind||'page'}}));
    });
  }catch(e){}

  // ── Prefetch on sight ──
  // Links are fetched as they scroll into view, a few per screen, so most
  // taps find their page already here. Not on a connection that asked to
  // save data, and not for a link marked data-stx-prefetch="false" or
  // "hover" (hover and touch still prefetch everything).
  var sightObserver=null;
  var sightCount=0;
  function observeLinks(){
    if(!o.prefetch||!o.cache||o.prefetchVisible===false||typeof IntersectionObserver!=='function')return;
    var c=navigator.connection;
    if(c&&(c.saveData||/2g/.test(c.effectiveType||'')))return;
    if(!sightObserver)sightObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        sightObserver.unobserve(en.target);
        if(sightCount>=o.prefetchVisibleMax)return;
        sightCount++;
        prefetchLink(en.target);
      });
    });
    sightCount=0;
    var root=activeRoot()||document.body;
    if(!root||!root.querySelectorAll)return;
    root.querySelectorAll('[data-stx-link][href]').forEach(function(a){
      if(a.__stxSeen)return;
      var p=a.getAttribute('data-stx-prefetch');
      if(p==='false'||p==='hover'||p==='none')return;
      a.__stxSeen=1;
      sightObserver.observe(a);
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
    // A handler on the page has already decided this click is not a
    // navigation, so the router must not perform one - the same contract the
    // browser honours for a plain anchor.
    //
    // This listener used to run in the CAPTURE phase, which broke that twice
    // over: it saw the click before the anchor did, so defaultPrevented was
    // necessarily false by the time it was read here, and the stopPropagation
    // below then stopped the event ever reaching the element - so a page's own
    // click handler on an intercepted link never ran AT ALL. Progressive
    // enhancement on an anchor was impossible; the only way out was to swap it
    // for a button in script (stacksjs/stacks#2393).
    //
    // Bubbling instead puts the page's handlers first, which is where a
    // decision about the page's own markup belongs.
    if(e.defaultPrevented)return;
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
    // A tab: its own stack, never a back entry (selectTab).
    if(link.getAttribute('data-stx-nav')==='tab'||link.hasAttribute('data-native-tab')){selectTab(href);return}
    instantNext=link.getAttribute('data-stx-transition')==='none';
    navigate(withCurrentLocale(href));
  });

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
    // A tab switch rewinding to the first entry: not a navigation of its own.
    if(rewinding){rewinding();return}
    var settled=swipeSettled;
    swipeSettled=null;
    // Nothing has scrolled yet (restoration is manual), so the viewport still
    // shows the entry being left: save it under its own token before adopting
    // the popped entry's, and hand the swap the position to land on.
    if(!settled)rememberScroll();
    var st=history.state;
    // An entry the router did not write (a page's own pushState) keeps the
    // depth it was written at; a lower one is a step back.
    var depth=st&&typeof st[DEPTH]==='number'?st[DEPTH]:histDepth;
    var dir=depth<histDepth?'pop':depth>histDepth?'push':'replace';
    histDepth=depth;
    var popped=st&&st[SCROLL_TOKEN];
    scrollToken=popped||newScrollToken();
    if(restoreScroll){
      if(!popped)stampScrollToken();
      pendingScroll=readScroll(scrollToken);
      pendingInner=readInner(scrollToken);
    }
    if(screensLive){
      if(st&&st[TAB]!==undefined&&st[TAB]!==curTab&&tabs[st[TAB]]){curTab=st[TAB];markTab(curTab)}
      var target=(tabs[curTab]||[])[depth];
      if(target&&target.el&&target.token===scrollToken&&target!==active){showRetained(target,dir==='replace'?'pop':dir,{settled:settled===target});return}
    }
    navCtxNext={direction:dir};
    navigate(location.pathname+location.search+location.hash,false);
  });

  // ── Offline stand-in ──
  // Without a network the offline worker answers a screen it has not kept
  // whole with the app's first screen, marked. A screen reached inside the
  // app was kept as a fragment, so ask for that and show it in place. Only
  // when it is there: a failed navigate reloads, and the reload would be
  // answered with the stand-in again.
  var standIn=document.querySelector('meta[name="stx-offline-fallback"]');
  if(standIn&&shouldUseFragmentResponse()){
    standIn.remove();
    var wanted=location.pathname+location.search;
    fetch(wanted,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){
      if(r.ok&&r.headers.get('X-STX-Fragment')==='true'&&location.pathname+location.search===wanted)
        navigate(wanted+location.hash,false,true);
    }).catch(function(){});
  }

  // ── Prefetch ──
  // A link's page, fetched before it is followed into the cache navigate
  // reads, so following it is a swap rather than a round trip.
  // 'prefetching' holds each fetch in flight, so a tap that lands before its
  // prefetch has finished waits for that answer instead of asking again.
  // 'fresh' refetches a page that is cached, for an entry restored from an
  // earlier launch that is shown at once and replaced behind it.
  function prefetchLink(link,fresh){
    // Same opt-out set as the click path. Without it, hovering a link the
    // router is not allowed to claim still fired a real GET at it — a
    // logout or OAuth URL was requested on hover alone.
    if(isRouterExcluded(link))return;
    var href=withCurrentLocale(link.getAttribute('href'));
    var key=cacheKey(href);
    if((cache[key]&&!fresh)||prefetching[key])return;
    var eager=link.getAttribute('data-stx-prefetch')==='eager';
    var wantsFragment=shouldUseFragmentResponse();
    prefetching[key]=fetch(href,{headers:wantsFragment?{'X-STX-Router':'true','Accept':'text/html'}:{'Accept':'text/html'}}).then(function(r){
      return readPrefetchResponse(r,wantsFragment);
    }).then(function(result){
      if(result&&o.cache){
        setCache(key,result.html,result.layout,result.layoutGroup,result.title,result.containerAttrs);
        if(eager)keepPage(key,result);
      }
      if(result){
        loadModuleRegistries(result.html,href);
        // Its stylesheet too, so the tap never waits on cssLoadTimeout for a
        // sheet it could have had all along. Added unapplied (media=print),
        // as a navigation adds it; the swap makes it live.
        if(result.html.indexOf('<!--stx-fragment')===0)preloadGeneratedCss(fragmentCssHrefs(result.html),location.href);
      }
    }).catch(function(){}).finally(function(){delete prefetching[key]});
  }

  // ── Pages kept between launches ──
  // An eager link's page (a tab bar's) is kept in localStorage under the build
  // that rendered it, and put back into the cache when the next launch of the
  // same build starts. The first tap after opening the app is then a swap,
  // not a round trip, however far the server is; the eager prefetch replaces
  // the kept copy behind it. Pages of any other build are dropped, since a
  // runtime must never be handed another build's fragment (#1772).
  var KEPT_PREFIX='stx:pages:';
  var KEPT_MAX_BYTES=400000;
  function keptStore(){try{return window.localStorage||null}catch(e){return null}}
  function keepPage(key,result){
    var store=keptStore();
    if(!store||!loadedBuild||!result||!result.html||result.html.length>KEPT_MAX_BYTES)return;
    try{
      var all=JSON.parse(store.getItem(KEPT_PREFIX+loadedBuild)||'{}');
      all[key]={h:result.html,l:result.layout,g:result.layoutGroup,t:result.title,a:result.containerAttrs};
      store.setItem(KEPT_PREFIX+loadedBuild,JSON.stringify(all));
    }catch(e){}
  }
  function restoreKeptPages(){
    var store=keptStore();
    if(!store||!o.cache||!loadedBuild)return;
    try{
      for(var i=store.length-1;i>=0;i--){
        var name=store.key(i);
        if(name&&name.indexOf(KEPT_PREFIX)===0&&name!==KEPT_PREFIX+loadedBuild)store.removeItem(name);
      }
      var all=JSON.parse(store.getItem(KEPT_PREFIX+loadedBuild)||'{}');
      for(var key in all){
        var page=all[key];
        if(!Object.prototype.hasOwnProperty.call(all,key)||!page||!page.h||cache[key])continue;
        setCache(key,page.h,page.l||'',page.g||'',page.t||'',page.a||'');
        restored[key]=true;
        loadModuleRegistries(page.h,key);
      }
    }catch(e){}
  }
  var restored={};

  // A prefetched page's module registry (the file its imports are bundled
  // into, one per page) is loaded with the prefetch, not on the tap. It only
  // registers modules, once, so loading it early changes nothing but timing,
  // and the tap then finds every script it needs already here: the swap runs
  // in one task and the first visit to a tab paints whole, like the second.
  function loadModuleRegistries(html,base){
    html.replace(new RegExp('<scr'+'ipt\\\\b([^>]*)>','gi'),function(m,attrs){
      if(!/(?:^|\\s)data-stx-modules(?:[\\s=]|$)/i.test(attrs))return m;
      var srcMatch=attrs.match(/\\bsrc\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
      var src=srcMatch&&(srcMatch[1]||srcMatch[2]||srcMatch[3]);
      if(src)loadExternalScript(src,base);
      return m;
    });
  }

  // Links marked data-stx-prefetch="eager", fetched once the page is idle, so
  // even their first tap is served from the cache: the way a phone's tab bar
  // switches instantly. Not on a connection that asked to save data.
  var eagerQueued=false;
  function prefetchEager(){
    if(!o.prefetch||!o.cache||eagerQueued)return;
    eagerQueued=true;
    var run=function(){
      eagerQueued=false;
      var connection=navigator.connection;
      if(connection&&(connection.saveData||/2g/.test(connection.effectiveType||'')))return;
      // The page it is on too: it was loaded as a whole document, so without
      // its fragment the way back to it went to the network.
      var links=document.querySelectorAll('[data-stx-link][data-stx-prefetch="eager"]');
      for(var i=0;i<links.length;i++){
        var href=links[i].getAttribute('href');
        if(!href)continue;
        var key=cacheKey(withCurrentLocale(href));
        prefetchLink(links[i],restored[key]);
        delete restored[key];
      }
    };
    // Soon after the first paint rather than whenever the page next idles: on
    // a distant server each page is a second away, and the first tap comes fast.
    if(window.requestIdleCallback)window.requestIdleCallback(run,{timeout:500});
    else setTimeout(run,100);
  }

  if(o.prefetch){
    // A mouse hovers before it clicks. A finger does not hover, but it
    // touches down a tap's length before the click: start the fetch there.
    var onIntent=function(e){
      if(!e.target||!e.target.closest)return;
      prefetchLink(e.target.closest('[data-stx-link]'));
    };
    document.addEventListener('mouseover',onIntent,true);
    document.addEventListener('touchstart',onIntent,{capture:true,passive:true});
    window.addEventListener('stx:load',prefetchEager);
    window.addEventListener('stx:load',function(){setTimeout(observeLinks,0)});
  }

  // ── Active link management ──
  // Which links point at the page being shown. Every href is resolved against
  // the current URL first, because comparing the raw attribute with
  // location.pathname got most real links wrong:
  //   - a query-only href (?range=24h, the shape of every range picker and tab
  //     bar) never equalled a pathname, so the active one lost its classes and
  //     had the server's aria-current="page" stripped on every load;
  //   - /dashboard?site=1 was never an exact match for /dashboard;
  //   - http://same-origin/x and /x/ were never matches for /x;
  //   - /blog was "active" on /blogging, a prefix that is not a parent.
  // Null for links the router does not own (another origin, a bare #fragment,
  // anything unparseable), which are left exactly as the server rendered them.
  function normPath(p){return p.length>1&&p.charAt(p.length-1)==='/'?p.slice(0,-1):p}
  // Paths beyond the link's own that make it current: a tab bar's Calendar
  // tab stays lit on a workout opened from it (data-stx-active-match, a
  // space-separated list of path prefixes).
  function matchesAny(list,cur){
    if(!list)return false;
    return list.split(/\\s+/).some(function(p){p=normPath(p);return p&&(cur===p||cur.indexOf(p+'/')===0)});
  }
  function linkState(href,also){
    if(!href||href.charAt(0)==='#')return null;
    var u;
    try{u=new URL(href,location.href)}catch(e){return null}
    if(u.origin!==location.origin)return null;
    var path=normPath(u.pathname),cur=normPath(location.pathname);
    // A link with no query matches on its path, so a nav entry stays current
    // while the page adds filters. A link WITH a query is current only when
    // every param it names has that value here: of five range links that all
    // point at this path, exactly one is.
    var have=new URLSearchParams(location.search),q=true;
    u.searchParams.forEach(function(v,k){if(have.getAll(k).indexOf(v)===-1)q=false});
    // EXACT is the stricter half (stacksjs/stx#2017). A link with NO query
    // satisfied the loop above trivially, so a bare /list reported itself exact
    // on /list?status=up - taking exact-active-class and aria-current from the
    // chip the user was actually on, and telling a screen reader the unfiltered
    // link was the current page.
    //
    // Only a link with no query at all is held to the stricter test, which is
    // what keeps #1777 working: a range picker's /dashboard?site=1&range=7d is
    // still exact on /dashboard?site=1&range=7d&country=US, because a page
    // filter the link does not name should not unmark the range it IS on. The
    // two requests look opposed and are not - one is about a link naming MORE
    // than the page, the other about a link naming NOTHING.
    var linkHasQuery=false;
    u.searchParams.forEach(function(){linkHasQuery=true});
    var sameQuery=q&&(linkHasQuery||!location.search);
    var matched=matchesAny(also,cur);
    return {
      exact:sameQuery&&path===cur,
      active:q&&(path==='/'?cur==='/':(cur===path||cur.indexOf(path+'/')===0))||matched,
      matched:matched
    };
  }

  // A nav marked data-stx-sticky-active is a tab bar: each tab owns the
  // screens opened from it, as on iOS. On a page that is none of its links'
  // own, the link that was current stays current (a workout opened from
  // Today keeps Today lit), and data-stx-active-match only decides a page
  // reached with nothing current yet, such as a cold start on a deep link.
  // data-stx-nav-current remembers which link that was, because
  // updateActiveLinks has already rewritten the classes by now.
  function updateNav(){
    var done=new Set();
    qsa('nav, #mobileNav, [data-stx-nav]:not(a)').forEach(function(nav){
      var states=[];
      Array.prototype.forEach.call(nav.querySelectorAll('a[href]'),function(a){
        if(done.has(a)||!a.hasAttribute('data-stx-link'))return;
        done.add(a);
        var st=linkState(a.getAttribute('href'),a.getAttribute('data-stx-active-match'));
        if(st)states.push({a:a,st:st});
      });
      var kept=null;
      if(nav.hasAttribute('data-stx-sticky-active')&&!states.some(function(x){return x.st.exact})){
        kept=states.filter(function(x){return x.a.hasAttribute('data-stx-nav-current')})[0]||null;
      }
      states.forEach(function(x){
        var a=x.a,st=x.st;
        var on=kept?a===kept.a:(st.exact||st.matched);
        var ac=a.getAttribute('data-stx-active-class')||'active';
        ac.split(' ').forEach(function(cls){if(cls){if(on)a.classList.add(cls);else a.classList.remove(cls)}});
        if(on)a.setAttribute('data-stx-nav-current','');else a.removeAttribute('data-stx-nav-current');
      });
    });
  }

  // Both passes, always in this order. A link inside a <nav> is current only on
  // its own page (or one it names in data-stx-active-match), so updateNav has
  // the last word. Navigation used to run them the other way round, which lit
  // a nav's parent links by prefix after an in-app navigation but not after a
  // full load of the same URL.
  function refreshCurrentLinks(){
    updateActiveLinks();
    updateNav();
  }

  function updateActiveLinks(){
    // Update active classes on <stx-link> elements (and legacy data-stx-link)
    var links=qsa('[data-stx-link]');
    links.forEach(function(link){
      var st=linkState(link.getAttribute('to')||link.getAttribute('href')||'',link.getAttribute('data-stx-active-match'));
      if(!st)return;
      var ac=link.getAttribute('active-class')||link.getAttribute('data-stx-active-class')||'active';
      var eac=link.getAttribute('exact-active-class')||link.getAttribute('data-stx-exact-active-class')||'exact-active';
      ac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      eac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      if(st.exact)eac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
      if(st.active)ac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
      markCurrent(link,st.exact);
    });
  }

  // aria-current="page" names the page the user is ON, so it has to move when
  // the page does. The server stamps it on the link for the page it rendered;
  // after that, only a full load would ever correct it, and a fragment swap is
  // not a full load. Left alone, a screen reader announces the entry the user
  // arrived through as current for the rest of the session, however far they
  // navigate — silently wrong, and only to the people relying on it.
  //
  // Only ever touched on links that already carry the attribute or are the
  // current one, so a page using aria-current for something else — a step in a
  // wizard, a sort direction — is not rewritten out from under itself.
  //
  // Cleared for 'true' as well as 'page' (#2017). Both say "this is the current
  // one" with no further meaning, and a consumer working around a missing
  // aria-current by stamping aria-current="true" server-side kept it forever:
  // the router neither updated nor removed it, so after one navigation it named
  // the wrong link and the workaround was worse than the bug. The role-specific
  // values - step, location, date, time - are still left alone, because those
  // ARE the page using the attribute for something else.
  function markCurrent(link,isExact){
    var now=link.getAttribute('aria-current');
    if(isExact){
      if(now!=='page')link.setAttribute('aria-current','page');
      return;
    }
    if(now==='page'||now==='true')link.removeAttribute('aria-current');
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
      var s=ce('style');s.id='stx-r-css';
      // Strip characters that could escape our CSS block and inject new
      // declarations: ; { } ( ) " ' \\ < > plus whitespace control chars.
      // This keeps the value safe to concat into a stylesheet even if a
      // caller wires the config from an untrusted source.
      var sanitize=function(v){return String(v).replace(/[;{}()"'\\\\<>\\n\\r\\t]/g,'')};
      var pc=sanitize(o.progressColor);
      var ph=sanitize(o.progressHeight);
      // The container the router focuses after a navigation is not a
      // control, so it draws no focus ring: Safari drew one around the whole
      // page, a blue line along its bottom edge on every screen.
      // Links stay live while a page loads: a tap on another one is the newest
      // navigation and wins (navigate), where pointer-events:none used to
      // swallow it.
      var css='[data-stx-route-focus]:focus{outline:none}.stx-navigating{cursor:progress}#stx-router-progress{position:fixed;top:0;left:0;right:0;height:'+ph+';background:'+pc+';box-shadow:0 0 8px '+pc+',0 0 4px '+pc+';transform:scaleX(0);transform-origin:left;transition:transform .18s ease-out,opacity .26s ease;opacity:0;pointer-events:none;z-index:999999}html.stx-instant::view-transition-group(*),html.stx-instant::view-transition-old(*),html.stx-instant::view-transition-new(*){animation:none!important}';
      // One View Transitions block. There used to be two, and the second
      // (injected after this one) silently overrode the first: the page stays
      // put and only the routed content fades, which is what this now says
      // once. The retained screen inside it is not named, so the container
      // and the screen never carry the same name.
      if(o.viewTransitions&&'startViewTransition' in document){
        var dur=(o.viewTransitionDuration||220)+'ms';
        var ease=o.viewTransitionEasing||'cubic-bezier(0.16, 1, 0.3, 1)';
        css+='::view-transition-old(root),::view-transition-new(root){animation:none}::view-transition{background:transparent}';
        css+='main,#app-content,[data-stx-content]:not([data-stx-screen]){view-transition-name:stx-content}::view-transition-group(stx-content){overflow:hidden}';
        css+='::view-transition-old(stx-content){animation:stx-r-fade-out '+dur+' '+ease+' both}::view-transition-new(stx-content){animation:stx-r-fade-in '+dur+' '+ease+' both}';
        css+='@keyframes stx-r-fade-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-4px)}}';
        css+='@keyframes stx-r-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}';
        css+='@media (prefers-reduced-motion: reduce){::view-transition-old(stx-content),::view-transition-new(stx-content){animation-duration:0s;animation-name:none}}';
      }
      // Screens: a hidden one takes no room, and a screen lays its page out
      // the way the container would have. Push and pop are iOS's: the new
      // screen slides in from the right edge while the one under it moves a
      // third of the way left and dims, over --stx-nav-duration on a spring
      // (linear() where the browser has it). Reduced motion cross-fades.
      css+='[data-stx-screen]{display:inherit;flex-direction:inherit;flex-wrap:inherit;gap:inherit;align-items:inherit;justify-content:inherit;grid-template-columns:inherit;grid-template-rows:inherit;grid-column:1/-1;flex:1 1 auto;align-self:stretch;min-width:0}['+HIDDEN+']{display:none!important}';
      css+=':root{--stx-nav-duration:'+(o.navDuration|0)+'ms;--stx-nav-ease:cubic-bezier(0.32,0.72,0,1)}@supports (animation-timing-function:linear(0,1)){:root{--stx-nav-ease:linear(0,.079,.236,.403,.551,.671,.764,.833,.883,.919,.944,.962,.974,.983,.988,.992,.995,.997,.998,.999,1)}}';
      css+='[data-stx-animating]{overflow-x:clip}[data-stx-screen-enter],[data-stx-screen-leave]{position:relative;will-change:transform;animation-duration:var(--stx-nav-duration);animation-timing-function:var(--stx-nav-ease);animation-fill-mode:both}';
      css+='html[data-nav-direction=push] [data-stx-screen-enter]{animation-name:stx-nav-in;z-index:3;box-shadow:0 0 24px rgb(0 0 0 / .12)}html[data-nav-direction=push] [data-stx-screen-leave]{animation-name:stx-nav-out;z-index:1}';
      css+='html[data-nav-direction=pop] [data-stx-screen-enter]{animation-name:stx-nav-back-in;z-index:1}html[data-nav-direction=pop] [data-stx-screen-leave]{animation-name:stx-nav-back-out;z-index:3;box-shadow:0 0 24px rgb(0 0 0 / .12)}';
      css+='[data-stx-screen-dim]{position:fixed;top:0;bottom:0;z-index:2;background:rgb(0 0 0 / .1);pointer-events:none;animation:stx-nav-dim var(--stx-nav-duration) var(--stx-nav-ease) both}html[data-nav-direction=pop] [data-stx-screen-dim]{animation-direction:reverse}[data-stx-screen-dim][data-stx-drag]{animation:none}';
      css+='@keyframes stx-nav-in{from{transform:translateX(100%)}to{transform:none}}@keyframes stx-nav-out{from{transform:none}to{transform:translateX(-30%)}}@keyframes stx-nav-back-in{from{transform:translateX(-30%)}to{transform:none}}@keyframes stx-nav-back-out{from{transform:none}to{transform:translateX(100%)}}@keyframes stx-nav-dim{from{opacity:0}to{opacity:1}}@keyframes stx-nav-fade-in{from{opacity:0}}@keyframes stx-nav-fade-out{to{opacity:0}}';
      css+='@media (prefers-reduced-motion: reduce){html[data-nav-direction] [data-stx-screen-enter]{animation-name:stx-nav-fade-in;animation-duration:200ms;box-shadow:none}html[data-nav-direction] [data-stx-screen-leave]{animation-name:stx-nav-fade-out;animation-duration:200ms;box-shadow:none}[data-stx-screen-dim]{display:none}}';
      // The screen a failed load leaves behind (showNavError).
      css+='.stx-retry{display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:4rem 1.5rem;text-align:center}.stx-retry-title{margin:0;font-weight:600;font-size:1.0625rem}.stx-retry-text{margin:0;opacity:.7;max-width:20rem}.stx-retry-button{margin-top:.75rem;padding:.5rem 1.25rem;border:0;border-radius:999px;background:var(--native-accent,#2563eb);color:#fff;font:inherit;font-weight:600}';
      s.textContent=css;
      dhead().appendChild(s);
    }
    if(o.progress&&!document.getElementById('stx-router-progress')){
      var el=ce('div');
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


  // ── Public API ──
  var router={
    navigate:navigate,
    navigateTo:navigate,
    prefetch:function(url){
      var key=cacheKey(url);
      if(!cache[key]){
        var wantsFragment=shouldUseFragmentResponse();
        fetch(url,{headers:wantsFragment?{'X-STX-Router':'true'}:{'Accept':'text/html'}}).then(function(r){return readPrefetchResponse(r,wantsFragment)}).then(function(result){if(result)setCache(key,result.html,result.layout,result.layoutGroup,result.title,result.containerAttrs)}).catch(function(){});
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
    // Switch to the tab whose link points at href, as a tap on it would:
    // its retained screens and its own back stack (selectTab).
    selectTab:selectTab,
    back:function(){return history.back()},
    // The screens kept alive, for a page or a test that wants to look.
    screens:function(){var out=[];eachEntry(function(e,id){out.push({url:e.url,tab:id,depth:e.depth,live:!!e.el,active:e===active})});return out},
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
    refreshCurrentLinks();
    // The first screen, from the start, so the page never changes shape on
    // its first navigation.
    if(screensOn()){var host=getContainer();if(host)adoptInitial(host)}
    restoreKeptPages();
    prefetchEager();
    observeLinks();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
`
}

/**
 * The router script as it ships: debug logging removed, then minified with
 * its local names mangled.
 *
 * Every page carries this, so the 32 `log()` call sites -- 2.3KB of the
 * delivered bytes, printing nothing unless `debug` is set -- are not part of
 * it. Stripping happens outside the try, as in generateSignalsRuntime: losing
 * minification makes the script bigger, losing the strip would ship the logs.
 *
 * Mangling is safe because everything lives in one IIFE and nothing reaches
 * in by name: the outside sees window.stxRouter and the events. It takes
 * about a quarter off; the dev build keeps the names for reading.
 */
export function getRouterScript(): string {
  if (cachedRouterScript)
    return cachedRouterScript

  cachedRouterScript = minifyRouterScript(stripRouterLogs(routerSource()), true)
  return cachedRouterScript
}

/**
 * The router script with its `log()` calls intact, for development.
 *
 * Set `debug` in the router config to see them. Minified the same way, so what
 * a developer runs behaves exactly like what ships.
 */
export function getRouterScriptDev(): string {
  if (cachedRouterScriptDev)
    return cachedRouterScriptDev

  cachedRouterScriptDev = minifyRouterScript(routerSource())
  return cachedRouterScriptDev
}
