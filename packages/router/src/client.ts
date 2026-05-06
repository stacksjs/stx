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
export function getRouterScript(): string {
  return `
;(function(){
  'use strict';
  if(window.__stxRouter)return;

  // ── Configuration ──
  var defaults={container:'main',loadingClass:'stx-navigating',viewTransitions:true,cache:true,scrollToTop:true,prefetch:true,progress:true,progressColor:'#78dce8',progressHeight:'2px',interceptAllLinks:false};
  var o=Object.assign({},defaults,window.__stxRouterConfig||{},window.STX_ROUTER_OPTIONS||{});
  var containerSel=o.container;

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
  // Track executed script hashes to prevent redeclaration errors on navigation.
  // Layout-level scripts (theme, nav setup) execute on initial page load and
  // should NOT re-execute when navigating to another page with the same layout.
  var executedScriptHashes={};
  function hashScript(code){
    var h=0;for(var i=0;i<code.length;i++){h=((h<<5)-h)+code.charCodeAt(i);h|=0}
    return h;
  }
  // Record scripts from the initial page load
  document.querySelectorAll('script').forEach(function(s){
    var text=s.textContent||'';
    if(text.trim()&&!s.hasAttribute('src'))executedScriptHashes[hashScript(text)]=1;
  });
  function getLayoutGroup(layout){
    if(!layout)return 'app';
    if(layout.indexOf('auth')!==-1||layout.indexOf('guest')!==-1)return 'auth';
    return 'app';
  }
  function checkLayoutChange(newLayout,targetUrl){
    var currentLayout=document.querySelector('meta[name="stx-layout"]');
    var curLayoutName=currentLayout?currentLayout.getAttribute('content'):'';
    var curGroup=getLayoutGroup(curLayoutName);
    var newGroup=getLayoutGroup(newLayout);
    console.log('[router] layout check: current='+curLayoutName+'('+curGroup+') new='+(newLayout||'')+'('+newGroup+')');
    // Different layout GROUP (e.g. app → auth): full reload
    if(curGroup!==newGroup){
      console.log('[router] layout group change:',curGroup,'→',newGroup,'— full reload to:',targetUrl);
      return true;
    }
    // Same group but different SPECIFIC layout (e.g. layouts/app → layouts/coach):
    // full body swap so nav, sidebar, and other layout-level elements update
    if(curLayoutName && newLayout && curLayoutName!==newLayout){
      console.log('[router] layout name change:',curLayoutName,'→',newLayout,'— full body swap');
      return true;
    }
    return false;
  }

  function navigate(url,pushState,force){
    console.log('[router] navigate() called:',url,'isNavigating:',isNavigating);
    if(isNavigating)return;
    var t=new URL(url,location.origin);

    if(t.origin!==location.origin){location.href=url;return}

    if(t.pathname===location.pathname&&t.hash){
      if(pushState!==false)history.pushState({},'',t.href);
      var el=document.querySelector(t.hash);
      if(el)el.scrollIntoView({behavior:'smooth'});
      return;
    }

    // Skip if user clicks a link to the page they're already on. We
    // deliberately allow popstate (pushState===false) through because
    // the browser has already updated location.href to the popped
    // entry — without this allowance, hitting back would early-return
    // and the visible page content would be left frozen on the
    // forward-navigation page.
    if(pushState!==false&&t.href===location.href&&!t.hash&&!force)return;

    isNavigating=true;
    document.body.classList.add(o.loadingClass);
    startProgress();

    var targetHref=t.href;
    var targetPath=t.pathname;
    var targetHash=t.hash;

    function done(){isNavigating=false;document.body.classList.remove(o.loadingClass);finishProgress()}

    if(o.cache&&cache[targetPath]&&!force){
      if(checkLayoutChange(layoutCache[targetPath],url)){
        // Layout changed — fetch full page and do full document swap
        console.log('[router] cache hit but layout changed — fetching full page');
        fetch(url,{headers:{'Accept':'text/html'}}).then(function(r){
          if(!r.ok)throw new Error(r.status);
          return r.text();
        }).then(function(html){
          console.log('[router] full page fetched from cache path, len:',html.length);
          swap(html,targetPath,pushState,targetHash);
        }).catch(function(err){
          console.error('[router] full page fetch error:',err);
          location.href=url;
        }).finally(done);
        return;
      }
      swap(cache[targetPath],targetPath,pushState,targetHash);
      done();
    }
else {
      if(force&&cache[targetPath])delete cache[targetPath];
      // First fetch as fragment (SPA mode)
      fetch(url,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){
        if(!r.ok)throw new Error(r.status);
        var isFragment=r.headers.get('X-STX-Fragment')==='true';
        var newLayout=r.headers.get('X-STX-Layout')||'';
        // Layout change? Fetch the FULL page (no X-STX-Router header) and do full document swap
        if(isFragment&&checkLayoutChange(newLayout,url)){
          console.log('[router] layout change — fetching full page for document swap');
          return fetch(url,{headers:{'Accept':'text/html'}}).then(function(fullRes){
            console.log('[router] full page fetched:',fullRes.status,'ok:',fullRes.ok);
            if(!fullRes.ok)throw new Error(fullRes.status);
            return fullRes.text().then(function(html){
              console.log('[router] full page html length:',html.length);
              return{html:html,isFragment:false,layout:newLayout};
            });
          });
        }
        return r.text().then(function(html){return{html:html,isFragment:isFragment,layout:newLayout}});
      }).then(function(result){
        if(!result)return;
        if(result.isFragment)result.html='<!--stx-fragment-->'+result.html;
        if(o.cache){cache[targetPath]=result.html;layoutCache[targetPath]=result.layout}
        swap(result.html,targetPath,pushState,targetHash);
      }).catch(function(err){
        console.error('[router] fetch error:',err);
        location.href=url;
      }).finally(done);
    }
  }

  function swap(html,url,pushState,hash){
    var isFragment=html.indexOf('<!--stx-fragment-->')===0;
    if(isFragment)html=html.slice('<!--stx-fragment-->'.length);
    var currentContent=getContainer();
    console.log('[router] swap: isFragment='+isFragment+' container='+!!currentContent+' tag='+(currentContent&&currentContent.tagName)+' selector='+containerSel+' htmlLen='+html.length);
    if(!currentContent){console.log('[router] no container — falling back');location.href=url;return}

    // Fragment mode: server returned just the page content (no document wrapper)
    if(isFragment){
      if(window.stx&&window.stx._cleanupContainer)window.stx._cleanupContainer(currentContent);
      function doFragSwap(){
        // Extract scripts from fragment before injecting HTML
        var fragScripts=[];
        var fragStyles=[];
        var fragCrosswindCSS=null;
        var cleanFrag=html.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>([\\\\s\\\\S]*?)<\\\\/scr'+'ipt>','gi'),function(m,code){
          if(code&&code.trim())fragScripts.push(code);
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
        // Add new page styles
        fragStyles.forEach(function(s){
          var el=document.createElement('style');
          el.textContent=s.css;
          el.setAttribute('data-stx-page','');
          document.head.appendChild(el);
        });
        // Swap content
        currentContent.innerHTML=cleanFrag;
        // Remove old page scripts
        document.querySelectorAll('script[data-stx-page]').forEach(function(s){s.remove()});
        if(pushState!==false)history.pushState({},'',url+(hash||''));
        updateNav(url);
        updateActiveLinks();
        if(o.scrollToTop&&!hash)window.scrollTo({top:0,behavior:'instant'});
        else if(hash){var el=document.querySelector(hash);if(el)el.scrollIntoView({behavior:'smooth'})}
        window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));
        // Execute page scripts FIRST — they define setup functions and set _latestSetup
        console.log('[router] frag scripts:', fragScripts.length);
        document.querySelectorAll('script[data-stx-page]').forEach(function(s){s.remove()});
        fragScripts.forEach(function(code){
          console.log('[router] exec script len:', code.length, 'has __stx_setup:', code.indexOf('__stx_setup')>-1);
          // Skip scripts that were already executed (layout-level partials
          // like theme.stx, stores.stx, nav.stx). Their top-level const/let
          // declarations would throw "Identifier has already been declared"
          // on re-execution. Setup functions (__stx_setup_) must always
          // re-execute because each page has its own setup.
          var h=hashScript(code);
          var isSetup=code.indexOf('__stx_setup_')!==-1;
          if(!isSetup&&executedScriptHashes[h]){
            console.log('[router] skipping already-executed script (hash dedup)');
            return;
          }
          executedScriptHashes[h]=1;
          var ns=document.createElement('script');
          // Wrap in block scope to prevent const/let collisions on re-navigation.
          // Without this, navigating away and back throws "Identifier has already
          // been declared" because the previous page's top-level const/let are
          // still in the global scope.
          var isAlreadyScoped=code.trimStart().charAt(0)==='('||code.trimStart().charAt(0)===';'||code.indexOf('window.stx.mount')>-1;
          ns.textContent=isAlreadyScoped?code:'{'+code+'}';
          ns.setAttribute('data-stx-page','');
          document.body.appendChild(ns);
        });
        console.log('[router] scripts done. _latestSetup:', !!window.stx._latestSetup);
        // THEN fire stx:load — now _latestSetup is set and processElement has the right scope
        window.dispatchEvent(new Event('stx:load'));
      }
      if(o.viewTransitions&&document.startViewTransition){document.startViewTransition(doFragSwap)}
      else{currentContent.style.transition='opacity 0.12s ease-out';currentContent.style.opacity='0';setTimeout(function(){doFragSwap();currentContent.style.opacity='1';setTimeout(function(){currentContent.style.transition=''},150)},120)}
      return;
    }

    // Full document mode: parse with DOMParser and extract container content
    var parser=new DOMParser();
    var doc=parser.parseFromString(html,'text/html');
    var newContent=doc.querySelector(containerSel)||doc.querySelector('[data-stx-content]')||doc.querySelector('main');
    if(!newContent){location.href=url;return}

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

      // ── Swap content ──
      // For layout changes: swap the entire <body> to replace layout chrome (nav, footer, etc.)
      // For same-layout: swap only the container (<main>)
      var newBody=doc.querySelector('body');
      var isLayoutChange=false;
      if(newBody){
        var newMeta=doc.querySelector('meta[name="stx-layout"]');
        var curMeta=document.querySelector('meta[name="stx-layout"]');
        var curGroup=getLayoutGroup(curMeta?curMeta.getAttribute('content'):'');
        var newGroup=getLayoutGroup(newMeta?newMeta.getAttribute('content'):'');
        isLayoutChange=curGroup!==newGroup;
      }
      if(isLayoutChange&&newBody){
        console.log('[router] full body swap for layout change');
        // Replace entire body content — layout chrome and all
        var bodyHTML=newBody.innerHTML.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/scr'+'ipt\\\\s*>','gi'),'');
        document.body.innerHTML=bodyHTML;
        // Copy body attributes (class, data-stx, etc.)
        Array.from(newBody.attributes).forEach(function(attr){document.body.setAttribute(attr.name,attr.value)});
        // Update layout meta tag
        var oldMeta=document.querySelector('meta[name="stx-layout"]');
        var freshMeta=doc.querySelector('meta[name="stx-layout"]');
        if(oldMeta&&freshMeta)oldMeta.setAttribute('content',freshMeta.getAttribute('content')||'');
        else if(freshMeta){var m=document.createElement('meta');m.name='stx-layout';m.content=freshMeta.getAttribute('content')||'';document.head.appendChild(m)}
        // Update container reference for script execution below
        currentContent=document.querySelector(containerSel)||document.querySelector('main')||document.body;
      } else {
        // Same layout — swap only container content
        var cleanHTML=newContent.innerHTML.replace(new RegExp('<scr'+'ipt\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/scr'+'ipt\\\\s*>','gi'),'');
        currentContent.innerHTML=cleanHTML;
      }

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
      if(isLayoutChange){
        // Layout change: collect ALL scripts from the new document body
        // (layout scripts, component mounts, setup functions — everything)
        var newBodyEl=doc.querySelector('body');
        if(newBodyEl){
          newBodyEl.querySelectorAll('script').forEach(function(s){
            var text=s.textContent||'';
            if(s.hasAttribute('src'))return;
            if(!text.trim())return;
            // Skip the signals runtime IIFE — it's already loaded
            if(text.indexOf("'use strict';var cloakStyle")!==-1)return;
            if(text.indexOf('__stxRouter')!==-1)return;
            scripts.push(text);
          });
        }
        // Also collect setup functions from <head>
        doc.querySelectorAll('head script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          if(text.indexOf('__stx_setup_')!==-1)scripts.push(text);
        });
      } else {
        // Same layout: collect scripts from the container
        newContent.querySelectorAll('script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          scripts.push(text);
        });
        // Collect setup scripts from <head> AND <body> (outside container).
        // SSG builds place the setup function in <body> before <main>, not
        // in <head>. Without this, SPA navigation on static sites never
        // runs the setup and reactive data stays empty.
        var seenSetups={};
        scripts.forEach(function(t){if(t.indexOf('__stx_setup_')!==-1)seenSetups[t.substring(0,80)]=1});
        doc.querySelectorAll('script').forEach(function(s){
          var text=s.textContent||'';
          if(s.hasAttribute('src'))return;
          if(!text.trim())return;
          if(text.indexOf('__stx_setup_')===-1)return;
          // Skip signals runtime and router (they contain __stx_setup references but aren't setup functions)
          if(text.indexOf("'use strict';var cloakStyle")!==-1)return;
          if(text.indexOf('__stxRouter')!==-1)return;
          var key=text.substring(0,80);
          if(seenSetups[key])return;
          seenSetups[key]=1;
          scripts.push(text);
        });
      }

      // Push history state (before active link updates so location.pathname is current)
      if(pushState!==false)history.pushState({},'',url+(hash||''));

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

      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:url}}));

      // Execute page scripts FIRST — they define setup functions and set _latestSetup
      function execScripts(){
        scripts.forEach(function(text){
          // Skip scripts that were already executed (layout-level partials
          // like theme.stx). Their top-level const/function declarations
          // would throw "Identifier has already been declared" on re-execution.
          // Exception: setup functions (__stx_setup_) must always re-execute
          // because each page has its own setup, and import statements
          // need special handling.
          var h=hashScript(text);
          var isSetup=text.indexOf('__stx_setup_')!==-1;
          var hasImport=text.indexOf('import ')!==-1;
          if(!isSetup&&executedScriptHashes[h])return;
          executedScriptHashes[h]=1;
          // Wrap scripts with import statements as modules (Bug 3 fix)
          var ns=document.createElement('script');
          if(hasImport){
            ns.type='module';
          }
          // Wrap in block scope to prevent const/let collisions on re-navigation.
          // Top-level const/let in <script> tags are global-scoped in browsers
          // and throw "Identifier has already been declared" on re-execution.
          var alreadyScoped=text.trimStart().charAt(0)==='('||text.trimStart().charAt(0)===';'||text.indexOf('window.stx.mount')>-1;
          ns.textContent=alreadyScoped?text:'{'+text+'}';
          ns.setAttribute('data-stx-page','');
          document.body.appendChild(ns);
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
    if(href===location.pathname)return false;
    if(!getContainer())return false;
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
    if(!link&&o.interceptAllLinks){
      var anchor=e.target.closest('a[href]');
      if(anchor&&shouldIntercept(anchor))link=anchor;
    }
    if(!link){return}
    var href=link.getAttribute('href');
    console.log('[router] click intercepted:',href,'container:',!!getContainer(),'defaultPrevented:',e.defaultPrevented);
    if(!href||href.startsWith('http')||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')){console.log('[router] skipped:',href);return}
    if(link.target==='_blank'||link.hasAttribute('download'))return;
    e.preventDefault();
    e.stopPropagation();
    console.log('[router] navigating to:',href);
    navigate(href);
  },true);

  // ── Back/forward ──
  window.addEventListener('popstate',function(){
    navigate(location.pathname+location.search+location.hash,false);
  });

  // ── Prefetch on hover ──
  if(o.prefetch){
    document.addEventListener('mouseover',function(e){
      if(!e.target||!e.target.closest)return;
      var link=e.target.closest('[data-stx-link]');
      if(!link)return;
      var href=link.getAttribute('href');
      if(cache[href]||prefetching[href])return;
      prefetching[href]=true;
      fetch(href,{headers:{'X-STX-Router':'true','Accept':'text/html'}}).then(function(r){
        var isFrag=r.headers.get('X-STX-Fragment')==='true';
        var pLayout=r.headers.get('X-STX-Layout')||'';
        return r.text().then(function(html){return{html:isFrag?'<!--stx-fragment-->'+html:html,layout:pLayout}});
      }).then(function(result){
        if(o.cache){cache[href]=result.html;layoutCache[href]=result.layout}
      }).catch(function(){}).finally(function(){delete prefetching[href]});
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
      if(!cache[url]){
        fetch(url,{headers:{'X-STX-Router':'true'}}).then(function(r){var isFrag=r.headers.get('X-STX-Fragment')==='true';return r.text().then(function(html){return isFrag?'<!--stx-fragment-->'+html:html})}).then(function(html){cache[url]=html}).catch(function(){});
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
