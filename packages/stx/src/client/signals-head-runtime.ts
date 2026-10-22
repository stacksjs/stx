/** Client-side document head and SEO helpers. */
export const SIGNALS_HEAD_RUNTIME = `  // ==========================================================================
  // Client-side useHead / useSeoMeta
  // ==========================================================================

  function useHead(config) {
    function apply() {
      if (config.title) document.title = config.title;
      // Process meta tags
      var metas = config.meta || [];
      for (var i = 0; i < metas.length; i++) {
        var m = metas[i];
        if (!m.name && !m.property) continue;
        var selector = m.name ? 'meta[name="' + m.name + '"]' : 'meta[property="' + m.property + '"]';
        var el = document.querySelector(selector);
        if (el) {
          el.setAttribute('content', m.content || '');
        } else {
          el = document.createElement('meta');
          if (m.name) el.setAttribute('name', m.name);
          if (m.property) el.setAttribute('property', m.property);
          el.setAttribute('content', m.content || '');
          document.head.appendChild(el);
        }
      }
      // Process link tags
      var links = config.link || config.links || [];
      for (var j = 0; j < links.length; j++) {
        var l = links[j];
        if (!l.rel || !l.href) continue;
        var linkSel = 'link[rel="' + l.rel + '"][href="' + l.href + '"]';
        if (!document.querySelector(linkSel)) {
          var le = document.createElement('link');
          for (var k in l) { if (l.hasOwnProperty(k)) le.setAttribute(k, l[k]); }
          document.head.appendChild(le);
        }
      }
      // Script tags
      var scripts = config.script || config.scripts || [];
      for (var si = 0; si < scripts.length; si++) {
        var s = scripts[si];
        var se = document.createElement('script');
        if (s.src) se.src = s.src;
        if (s.innerHTML) se.innerHTML = s.innerHTML;
        if (s.async) se.async = true;
        if (s.defer) se.defer = true;
        document.head.appendChild(se);
      }
      // Body class
      // A native screen's document has no body (jsc-globals.ts).
      if (config.bodyAttrs && config.bodyAttrs.class && document.body) {
        config.bodyAttrs.class.split(' ').forEach(function(cls) { if (cls) document.body.classList.add(cls); });
      }
      // Html attributes. Every key, not just lang — the module impl
      // (head.ts updateHead) has always applied all of them, and a root-level
      // class is the main reason to reach for htmlAttrs at all (#1798).
      // class merges rather than replaces, matching bodyAttrs.class above:
      // the color-mode boot script owns a class on this same element.
      if (config.htmlAttrs) {
        for (var hk in config.htmlAttrs) {
          if (!config.htmlAttrs.hasOwnProperty(hk)) continue;
          var hv = config.htmlAttrs[hk];
          if (hv == null) continue;
          if (hk === 'class') {
            String(hv).split(' ').forEach(function(cls) { if (cls) document.documentElement.classList.add(cls); });
          } else {
            document.documentElement.setAttribute(hk, hv);
          }
        }
      }
    }
    // Apply immediately if DOM is ready, otherwise on mount
    if (document.readyState !== 'loading') { apply(); }
    else { onMount(apply); }
  }

  function useSeoMeta(config) {
    var meta = [];
    if (config.title) meta.push({ name: 'title', content: config.title });
    if (config.description) meta.push({ name: 'description', content: config.description });
    if (config.ogTitle) meta.push({ property: 'og:title', content: config.ogTitle });
    if (config.ogDescription) meta.push({ property: 'og:description', content: config.ogDescription });
    if (config.ogImage) meta.push({ property: 'og:image', content: config.ogImage });
    if (config.ogType) meta.push({ property: 'og:type', content: config.ogType });
    if (config.ogUrl) meta.push({ property: 'og:url', content: config.ogUrl });
    if (config.twitterCard) meta.push({ name: 'twitter:card', content: config.twitterCard });
    if (config.twitterTitle) meta.push({ name: 'twitter:title', content: config.twitterTitle });
    if (config.twitterDescription) meta.push({ name: 'twitter:description', content: config.twitterDescription });
    if (config.twitterImage) meta.push({ name: 'twitter:image', content: config.twitterImage });
    if (config.robots) meta.push({ name: 'robots', content: config.robots });
    if (config.canonical) meta.push({ property: 'og:url', content: config.canonical });
    useHead({ title: config.title || config.ogTitle, meta: meta });
  }
`
