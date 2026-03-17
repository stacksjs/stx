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
export function getRouterScript(): string {
  return `
;(function(){
  'use strict';
  if(window.__stxRouter)return;

  // ── Configuration ──
  var defaults={container:'main',loadingClass:'stx-navigating',viewTransitions:true,cache:true,scrollToTop:true,prefetch:true};
  var o=Object.assign({},defaults,window.__stxRouterConfig||{},window.STX_ROUTER_OPTIONS||{});
  var containerSel=o.container;

  var CACHE_TTL=5*60*1000; // 5 minutes
  var cache={};
  var prefetching={};
  var isNavigating=false;
  var currentAbort=null;

  function normalizePath(p){return p.length>1&&p.charAt(p.length-1)==='/'?p.slice(0,-1):p}
  function getCached(key){
    var entry=cache[key];
    if(!entry)return null;
    if(Date.now()-entry.ts>CACHE_TTL){delete cache[key];return null}
    return entry.html;
  }
  function setCache(key,html){cache[key]={html:html,ts:Date.now()}}

  function getContainer(){
    return document.querySelector(containerSel)||document.querySelector('[data-stx-content]')||document.querySelector('main');
  }

  // ── Navigation ──
  function navigate(url,pushState){
    var t=new URL(url,location.origin);

    // Different origin → full navigation
    if(t.origin!==location.origin){location.href=url;return}

    // Hash-only navigation on same page
    if(normalizePath(t.pathname)===normalizePath(location.pathname)&&t.hash){
      if(pushState!==false)history.pushState({},'',t.href);
      var el=document.querySelector(t.hash);
      if(el)el.scrollIntoView({behavior:'smooth'});
      return;
    }

    // Same page, no hash → skip
    if(t.href===location.href&&!t.hash)return;

    // Abort any in-flight navigation
    if(currentAbort){currentAbort.abort();currentAbort=null}

    isNavigating=true;
    document.body.classList.add(o.loadingClass);

    var targetPath=normalizePath(t.pathname);
    var targetHash=t.hash;

    function done(){isNavigating=false;currentAbort=null;document.body.classList.remove(o.loadingClass)}

    var cached=o.cache&&getCached(targetPath);
    if(cached){
      swap(cached,targetPath,pushState,targetHash);
      done();
    }
    else {
      var abort=new AbortController();
      currentAbort=abort;
      fetch(url,{headers:{'X-STX-Router':'true','Accept':'text/html'},signal:abort.signal}).then(function(r){
        if(!r.ok)throw new Error(r.status);
        return r.text();
      }).then(function(html){
        if(o.cache)setCache(targetPath,html);
        swap(html,targetPath,pushState,targetHash);
      }).catch(function(err){
        if(err&&err.name==='AbortError')return;
        location.href=url;
      }).finally(done);
    }
  }

  function swap(html,url,pushState,hash){
    var parser=new DOMParser();
    var doc=parser.parseFromString(html,'text/html');
    var newContent=doc.querySelector(containerSel)||doc.querySelector('[data-stx-content]')||doc.querySelector('main');
    var currentContent=getContainer();
    if(!newContent||!currentContent){location.href=url;return}

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

      var incoming=[];
      newStyles.forEach(function(s){
        if(!keepIds[s.id]){
          var ns=document.createElement('style');
          ns.textContent=s.textContent;
          ns.setAttribute('data-stx-incoming','');
          if(s.getAttribute('data-crosswind'))ns.setAttribute('data-crosswind',s.getAttribute('data-crosswind'));
          document.head.appendChild(ns);
          incoming.push(ns);
        }
      });

      // Remove old styles (except persistent ones and incoming)
      curStyles.forEach(function(s){
        if(!keepIds[s.id]&&!s.hasAttribute('data-stx-incoming'))s.remove();
      });

      incoming.forEach(function(s){s.removeAttribute('data-stx-incoming')});

      // ── Swap main content ──
      // Strip inline scripts from innerHTML — they won't execute via innerHTML anyway,
      // and leaving them causes stx.mount() to find the wrong nextElementSibling
      var cleanHTML=newContent.innerHTML.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/scr'+'ipt\\\\s*>','gi'),'');
      currentContent.innerHTML=cleanHTML;

      // ── Load new external <head> scripts ──
      var loadedSrcs={};
      document.querySelectorAll('head script[src]').forEach(function(s){loadedSrcs[s.src]=1});
      var extPromises=[];
      doc.querySelectorAll('head script[src]').forEach(function(s){
        var src=new URL(s.getAttribute('src'),location.origin).href;
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

      var scripts=[];
      doc.querySelectorAll('script').forEach(function(s){
        var text=s.textContent||'';
        // Skip the signals runtime
        if(text.indexOf('let activeEffect')!==-1)return;
        // Skip the router
        if(text.indexOf('__stxRouter')!==-1)return;
        // Skip layout shell scripts
        if(text.indexOf('__stxDashboardInit')!==-1||text.indexOf('__stxLayoutInit')!==-1)return;
        // Skip external scripts
        if(s.hasAttribute('src'))return;
        // Skip empty
        if(!text.trim())return;
        scripts.push(text);
      });

      function execScripts(){
        scripts.forEach(function(text){
          var ns=document.createElement('script');
          ns.textContent=text;
          ns.setAttribute('data-stx-page','');
          document.body.appendChild(ns);
        });
      }

      if(extPromises.length>0){
        Promise.all(extPromises).then(execScripts).catch(execScripts);
      }
else {
        execScripts();
      }

      // Push history state (before active link updates so location.pathname is current)
      if(pushState!==false)history.pushState({},'',url+(hash||''));

      // Update active nav links
      updateActiveLinks();

      // Scroll
      if(o.scrollToTop&&!hash)window.scrollTo({top:0,behavior:'instant'});
      else if(hash){var el=document.querySelector(hash);if(el)el.scrollIntoView({behavior:'smooth'})}

      // Update title
      var newTitle=doc.querySelector('title');
      if(newTitle)document.title=newTitle.textContent;

      // Dispatch navigation events
      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));
      window.dispatchEvent(new Event('stx:load'));
    }

    if(o.viewTransitions&&document.startViewTransition){
      document.startViewTransition(doSwap);
    }
else {
      // Fallback fade for browsers without View Transitions API
      currentContent.style.transition='opacity 0.12s ease-out';
      currentContent.style.opacity='0';
      setTimeout(function(){
        doSwap();
        currentContent.style.opacity='1';
        setTimeout(function(){currentContent.style.transition=''},150);
      },120);
    }
  }

  // ── Link interception ──
  function shouldIntercept(link){
    if(!link)return false;
    var href=link.getAttribute('href');
    if(!href)return false;
    if(href.startsWith('http')||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('javascript:'))return false;
    if(link.target==='_blank')return false;
    if(link.hasAttribute('data-stx-no-router')||link.hasAttribute('data-no-router')||link.hasAttribute('download'))return false;
    if(normalizePath(href)===normalizePath(location.pathname))return false;
    if(!getContainer())return false;
    return true;
  }

  document.addEventListener('click',function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    if(!e.target||!e.target.closest)return;
    var link=e.target.closest('a[href]');
    if(!shouldIntercept(link))return;
    e.preventDefault();
    e.stopPropagation();
    navigate(link.getAttribute('href'));
  },true);

  // ── Back/forward ──
  window.addEventListener('popstate',function(e){
    // Cancel any in-flight navigation so back/forward always works
    if(currentAbort){currentAbort.abort();currentAbort=null}
    isNavigating=false;
    navigate(location.pathname+location.search+location.hash,false);
  });

  // ── Prefetch on hover ──
  if(o.prefetch){
    document.addEventListener('mouseover',function(e){
      if(!e.target||!e.target.closest)return;
      var link=e.target.closest('a[href]');
      if(!shouldIntercept(link))return;
      // Only prefetch links with data-stx-prefetch or all internal links
      var href=link.getAttribute('href');
      var cacheKey=normalizePath(new URL(href,location.origin).pathname);
      if(getCached(cacheKey)||prefetching[cacheKey])return;
      prefetching[cacheKey]=true;
      fetch(href,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){return r.text()}).then(function(html){
        if(o.cache)setCache(cacheKey,html);
      }).catch(function(){}).finally(function(){delete prefetching[cacheKey]});
    },true);
  }

  // ── Active link management ──
  function updateActiveLinks(){
    var cur=normalizePath(location.pathname);
    var links=document.querySelectorAll('[data-stx-link]');
    links.forEach(function(link){
      var href=normalizePath(link.getAttribute('href')||'');
      var ac=link.getAttribute('data-stx-active-class')||'active';
      var eac=link.getAttribute('data-stx-exact-active-class')||'exact-active';
      // Remove all active classes first
      ac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      eac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      // Exact match
      var isExact=cur===href;
      // Prefix match (root "/" only matches itself)
      var isActive=href!=='/'?cur.startsWith(href):cur==='/';
      if(isExact)eac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
      if(isActive)ac.split(' ').forEach(function(cls){if(cls)link.classList.add(cls)});
    });
  }

  // ── Loading bar + View Transitions CSS ──
  function injectStyles(){
    if(document.getElementById('stx-r-css'))return;
    var s=document.createElement('style');s.id='stx-r-css';
    s.textContent='.stx-navigating{cursor:wait}.stx-navigating *{pointer-events:none}@keyframes stx-l{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}.stx-navigating::before{content:\\'\\';position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#78dce8,transparent);animation:stx-l 1s ease-in-out infinite;z-index:99999}';
    document.head.appendChild(s);
  }

  function injectViewTransitionCSS(){
    if(document.getElementById('stx-view-transitions'))return;
    var s=document.createElement('style');s.id='stx-view-transitions';
    s.textContent='::view-transition-group(root){animation:none}::view-transition-old(root){animation:none}::view-transition-new(root){animation:none}#app-content,[data-stx-content]{view-transition-name:stx-content}::view-transition-old(stx-content){animation:stx-fade-out .15s ease-out both}::view-transition-new(stx-content){animation:stx-fade-in .15s ease-in .1s both}@keyframes stx-fade-out{from{opacity:1}to{opacity:0}}@keyframes stx-fade-in{from{opacity:0}to{opacity:1}}::view-transition{background:transparent}::view-transition-group(stx-content){background:inherit;overflow:hidden}';
    (document.head||document.documentElement).appendChild(s);
  }

  // ── Public API ──
  var router={
    navigate:navigate,
    navigateTo:navigate,
    prefetch:function(url){
      var key=normalizePath(new URL(url,location.origin).pathname);
      if(!getCached(key)){
        fetch(url,{headers:{'X-STX-Router':'true'}}).then(function(r){return r.text()}).then(function(html){setCache(key,html)}).catch(function(){});
      }
    },
    clearCache:function(){for(var k in cache)delete cache[k]},
    cache:cache,
    swap:swap,
    updateActiveLinks:updateActiveLinks
  };

  window.__stxRouter=router;
  window.stxRouter=router;
  if(window.stx)window.stx.router=router;

  // ── Initialize ──
  function init(){
    injectStyles();
    injectViewTransitionCSS();
    updateActiveLinks();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
`
}
