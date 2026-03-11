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

  var cache={};
  var prefetching={};
  var isNavigating=false;

  function getContainer(){
    return document.querySelector(containerSel)||document.querySelector('[data-stx-content]')||document.querySelector('main');
  }

  // ── Navigation ──
  function navigate(url,pushState){
    if(isNavigating)return;
    var t=new URL(url,location.origin);

    // Different origin → full navigation
    if(t.origin!==location.origin){location.href=url;return}

    // Hash-only navigation on same page
    if(t.pathname===location.pathname&&t.hash){
      if(pushState!==false)history.pushState({},'',t.href);
      var el=document.querySelector(t.hash);
      if(el)el.scrollIntoView({behavior:'smooth'});
      return;
    }

    // Same page, no hash → skip
    if(t.href===location.href&&!t.hash)return;

    isNavigating=true;
    document.body.classList.add(o.loadingClass);

    var targetHref=t.href;
    var targetPath=t.pathname;
    var targetHash=t.hash;

    function done(){isNavigating=false;document.body.classList.remove(o.loadingClass)}

    if(o.cache&&cache[targetPath]){
      swap(cache[targetPath],targetPath,pushState,targetHash);
      done();
    }else{
      fetch(url,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){
        if(!r.ok)throw new Error(r.status);
        return r.text();
      }).then(function(html){
        if(o.cache)cache[targetPath]=html;
        swap(html,targetPath,pushState,targetHash);
      }).catch(function(){
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
      currentContent.innerHTML=newContent.innerHTML;

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
      }else{
        execScripts();
      }

      // Update active nav links
      updateNav(url);
      updateActiveLinks();

      // Scroll
      if(o.scrollToTop&&!hash)window.scrollTo({top:0,behavior:'instant'});
      else if(hash){var el=document.querySelector(hash);if(el)el.scrollIntoView({behavior:'smooth'})}

      // Update title
      var newTitle=doc.querySelector('title');
      if(newTitle)document.title=newTitle.textContent;

      // Push history state
      if(pushState!==false)history.pushState({},'',url+(hash||''));

      // Dispatch navigation events
      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));
      window.dispatchEvent(new Event('stx:load'));
    }

    if(o.viewTransitions&&document.startViewTransition){
      document.startViewTransition(doSwap);
    }else{
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
    if(href===location.pathname)return false;
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
  window.addEventListener('popstate',function(){
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
      if(cache[href]||prefetching[href])return;
      prefetching[href]=true;
      fetch(href,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){return r.text()}).then(function(html){
        if(o.cache)cache[href]=html;
      }).catch(function(){}).finally(function(){delete prefetching[href]});
    },true);
  }

  // ── Active link management ──
  function updateNav(url){
    document.querySelectorAll('nav a[href], #mobileNav a[href], [data-stx-nav] a[href]').forEach(function(a){
      var href=a.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('http'))return;
      var isActive=(href===url)||(href==='/'&&url==='/');
      a.style.background=isActive?'var(--nav-active-bg, rgba(0,0,0,0.06))':'';
      a.style.color=isActive?'var(--text-primary, inherit)':'var(--text-nav, inherit)';
      a.style.fontWeight=isActive?'500':'';
      if(a.hasAttribute('data-stx-link')){
        var ac=a.getAttribute('data-stx-active-class')||'active';
        if(isActive)a.classList.add(ac);else a.classList.remove(ac);
      }
    });
  }

  function updateActiveLinks(){
    var links=document.querySelectorAll('[data-stx-link]');
    var cur=location.pathname;
    links.forEach(function(link){
      var href=link.getAttribute('href')||'';
      var ac=link.getAttribute('data-stx-active-class')||'active';
      var eac=link.getAttribute('data-stx-exact-active-class')||'exact-active';
      ac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      eac.split(' ').forEach(function(cls){if(cls)link.classList.remove(cls)});
      var isExact=cur===href;
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
      if(!cache[url]){
        fetch(url,{headers:{'X-STX-Router':'true'}}).then(function(r){return r.text()}).then(function(html){cache[url]=html}).catch(function(){});
      }
    },
    clearCache:function(){for(var k in cache)delete cache[k]},
    cache:cache,
    swap:swap,
    updateNav:updateNav
  };

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
}
