/**
 * Default browser host used by the generated signals runtime.
 *
 * Keeping this as source text lets the same binding runtime swap in a native
 * host through `window.__stx_host` without coupling reactive primitives to the
 * DOM. The leading indentation and trailing blank line are intentional: this
 * fragment is interpolated directly into the generated runtime.
 */
export const SIGNALS_HOST_RUNTIME = `  // ── Host ──
  //
  // The tree this runtime mutates. Every write the binding layer makes to a
  // node goes through here, so the same runtime can drive something that is not
  // the document -- native views over a bridge (stacksjs/stx#1984).
  //
  // Signals never touch a node, so nothing above this line needs to change; the
  // coupling is entirely in the bind layer. A host is swapped in by assigning
  // window.__stx_host before the runtime executes. The name is stxHost, not
  // host, because the runtime already calls two local DOM nodes host -- a
  // shadowed adapter fails as node.anchor is not a function, deep inside a
  // branch swap, and nowhere near the line that caused it, which keeps the web path
  // exactly as it was: same calls, one property lookup earlier.
  var stxHost = window.__stx_host || {
    setText: function(node, value) { node.textContent = value; },
    setMarkup: function(node, value) { node.innerHTML = value == null ? '' : value; },
    setAttribute: function(node, name, value) {
      if (value === false) { node.removeAttribute(name); return; }
      if (value === true) { node.setAttribute(name, ''); return; }
      var next = value;
      if (typeof value === 'object' && value !== null) {
        try { next = JSON.stringify(value); }
        catch (e) { next = String(value); }
      }
      node.setAttribute(name, next);
    },
    removeAttribute: function(node, name) { node.removeAttribute(name); },
    observeAttributes: function(node, names, callback) {
      var observer = new MutationObserver(callback);
      observer.observe(node, { attributes: true, attributeFilter: names });
      return function() { observer.disconnect(); };
    },
    setStyle: function(node, value) {
      if (typeof value === 'object' && value !== null) {
        Object.assign(node.style, value);
        if (Object.prototype.hasOwnProperty.call(value, 'display')) node.__stx_display = value.display || '';
      }
      else if (typeof value === 'string') {
        node.style.cssText = value;
        node.__stx_display = node.style.display || '';
      }
      // Reactive style updates must not clear the display:none owned by :show.
      // This also keeps the latest explicit display for when the gate opens.
      if (node.__stx_visible === false) node.style.display = 'none';
    },

    // Structural operations, for the bindings that build rows rather than
    // update one node (#1984).
    //
    // anchor() is a position in the child list that survives the nodes around
    // it moving -- a comment node here, since the document has one; a native
    // host keeps an index or a zero-size sentinel.
    //
    // clone() is the one that does not carry over as-is: a DOM subtree can be
    // deep-copied, a native view hierarchy cannot. A native host materialises a
    // fresh subtree from the template it was given instead of copying views,
    // which is why the row template is passed rather than a node to duplicate.
    // A native host registers the handler against the view and has the platform
    // call it; nothing about the binding layer changes, which is the point.
    // The options argument carries passive/capture/once. A native host has no use for
    // passive -- there is no scroll thread to block -- but dropping the
    // parameter silently makes every touch listener blocking again, so it stays
    // in the signature and each host decides what to do with it.
    listen: function(node, event, handler, options) { node.addEventListener(event, handler, options); },

    // Returns the PREVIOUS visibility. bindShow needs to know whether it just
    // revealed something, and asking the node afterwards is the one read-back
    // in the binding layer -- a native host cannot answer what a UIView's
    // display value was, because it has none. A write that reports what it
    // replaced removes the question: the DOM host reads its own style, a native
    // host reads isHidden, and the binder reads neither.
    //
    // Restoring an explicit display (a flex row, an inline-block) is the host's
    // business too; it records it the first time it hides the node.
    // The scope root a node belongs to: nearest ancestor-or-self that owns a
    // scope, or null. Three binding paths need it -- ref ownership, and an
    // if-chain finding the scope its branch belongs to.
    //
    // Not a query method. A host is never handed a selector, because a native
    // view tree has nothing to match one against: the DOM host walks with
    // closest(), a native host reads the node-to-scope map it maintains as it
    // creates views. The from flag skips the node itself, which the ref path needs
    // when it walks outward past a receiver it has already rejected.
    scopeOf: function(node, from) {
      var start = from ? (node && node.parentElement) : node;
      return (start && start.closest) ? start.closest('[data-stx-scope]') : null;
    },

    setVisible: function(node, visible) {
      if (node.__stx_display === undefined) {
        var d = node.style.display;
        node.__stx_display = (d && d !== 'none') ? d : '';
      }
      var was = node.style.display !== 'none';
      node.__stx_visible = visible;
      node.style.display = visible ? node.__stx_display : 'none';
      return was;
    },

    anchor: function(label) { return document.createComment(label); },
    clone: function(node) { return node.cloneNode(true); },
    insert: function(parent, node, before) { parent.insertBefore(node, before); },
    remove: function(node) { if (node.parentNode) node.parentNode.removeChild(node); },

    // Teardown needs to reach a subtree, and both ways of reaching one were
    // selector queries -- the last DOM assumption left in the binding layer
    // (#1984). A view hierarchy has no selectors, and a native host already
    // knows what it built, so being asked is cheaper for it than searching is
    // for the document.
    //
    // descendants() is every node under this one, for the per-node teardown
    // state the runtime hangs off elements. scopesIn() is the scope IDS in the
    // subtree, this node included -- ids and not nodes, because the only thing
    // done with them is a lookup in window.stx._scopes.
    descendants: function(node) {
      var out = [];
      if (!node || !node.querySelectorAll) return out;
      var all = node.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) out.push(all[i]);
      return out;
    },
    scopesIn: function(node) {
      var ids = [];
      if (!node) return ids;
      var own = node.getAttribute && node.getAttribute('data-stx-scope');
      if (own) ids.push(own);
      if (node.querySelectorAll) {
        var matches = node.querySelectorAll('[data-stx-scope]');
        for (var i = 0; i < matches.length; i++) {
          var id = matches[i].getAttribute('data-stx-scope');
          if (id) ids.push(id);
        }
      }
      return ids;
    }
  };
`
