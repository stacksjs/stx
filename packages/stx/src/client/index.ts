/**
 * STX Client-Side Modules
 *
 * Browser-side functionality for STX applications.
 */

export * from './router'
export * from './directive'

/**
 * Generate the browser router script as a string
 * This can be injected into pages or served as a static file
 */
export function getRouterScript(): string {
  return `
;(function(){
  'use strict';
  var o={container:'main',linkSelector:'a[href]',loadingClass:'stx-navigating',viewTransitions:!0,cache:!0,scrollToTop:!0,prefetch:!0};
  var c=new Map(),p=new Set(),n=!1,u=location.href;
  function init(){
    document.addEventListener('click',handleClick,!0);
    window.addEventListener('popstate',function(){navigate(location.href,!1)});
    document.addEventListener('mouseenter',handleHover,!0);
    cacheCurrentPage();
    injectStyles();
  }
  function navigate(url,push){
    if(n)return;
    var t=new URL(url,location.origin);
    if(t.href===u&&!t.hash)return;
    if(t.origin!==location.origin){location.href=url;return}
    if(t.pathname===new URL(u).pathname&&t.hash){
      if(push!==!1)history.pushState({url:t.href},'',t.href);
      var el=document.querySelector(t.hash);if(el)el.scrollIntoView({behavior:'smooth'});return
    }
    n=!0;document.body.classList.add(o.loadingClass);
    fetchPage(t.href).then(function(r){
      if(r){
        swapContent(r);
        if(push!==!1)history.pushState({url:t.href},'',t.href);
        u=t.href;
        if(o.scrollToTop&&!t.hash)window.scrollTo({top:0,behavior:'instant'});
        else if(t.hash){var el=document.querySelector(t.hash);if(el)el.scrollIntoView({behavior:'smooth'})}
      }
    }).catch(function(){location.href=url}).finally(function(){n=!1;document.body.classList.remove(o.loadingClass)});
  }
  function handleClick(e){
    var a=e.target.closest('a[href]');if(!a)return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    if(a.target&&a.target!=='_self')return;if(a.hasAttribute('download'))return;
    var h=a.getAttribute('href');
    if(!h||h.startsWith('mailto:')||h.startsWith('tel:')||h.startsWith('javascript:'))return;
    if(a.hasAttribute('data-stx-no-router'))return;
    var t=new URL(h,location.origin);if(t.origin!==location.origin)return;
    e.preventDefault();e.stopPropagation();navigate(h);
  }
  function handleHover(e){
    var a=e.target.closest('a[data-stx-prefetch]');if(!a)return;
    var h=a.getAttribute('href');if(h&&!c.has(h))fetchPage(new URL(h,location.origin).href).catch(function(){});
  }
  function fetchPage(url){
    if(c.has(url)){var x=c.get(url);if(Date.now()-x.t<3e5)return Promise.resolve({h:x.h,i:x.i})}
    return fetch(url,{headers:{'X-STX-Router':'true'}}).then(function(r){
      if(!r.ok)throw new Error(r.status);return r.text()
    }).then(function(html){
      var d=new DOMParser().parseFromString(html,'text/html'),m=d.querySelector(o.container);
      if(!m)throw new Error('Container not found');
      var r={h:m.innerHTML,i:d.title};c.set(url,{h:r.h,i:r.i,t:Date.now()});return r
    });
  }
  function swapContent(r){
    var m=document.querySelector(o.container);if(!m)return;
    var swap=function(){
      m.innerHTML=r.h;document.title=r.i;
      m.querySelectorAll('script').forEach(function(s){
        var n=document.createElement('script');
        Array.from(s.attributes).forEach(function(a){n.setAttribute(a.name,a.value)});
        n.textContent=s.textContent;s.parentNode.replaceChild(n,s);
      });
      window.dispatchEvent(new CustomEvent('stx:navigate',{detail:{url:u}}));
      window.dispatchEvent(new CustomEvent('stx:load'));
    };
    if(o.viewTransitions&&'startViewTransition'in document)document.startViewTransition(swap);else swap();
  }
  function cacheCurrentPage(){var m=document.querySelector(o.container);if(m)c.set(u,{h:m.innerHTML,i:document.title,t:Date.now()})}
  function injectStyles(){
    if(document.getElementById('stx-r-css'))return;
    var s=document.createElement('style');s.id='stx-r-css';
    s.textContent='.stx-navigating{cursor:wait}.stx-navigating *{pointer-events:none}@keyframes stx-l{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}.stx-navigating::before{content:\\'\\';position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#78dce8,transparent);animation:stx-l 1s ease-in-out infinite;z-index:99999}';
    document.head.appendChild(s);
  }
  window.stxRouter={navigate:navigate,clearCache:function(){c.clear()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
`
}
