/** Loop-row conditional deferral for the generated client runtime. */
export const SIGNALS_LOOP_CONDITIONAL_RUNTIME = `  // A :for row is a clone of its template, so a conditional element in the row
  // is built for every row whether or not its condition ever holds; :if then
  // parks the false ones. In WebKit a <video> or <audio> sets up a media player
  // as it is created: a message list with one media slot per attachment took
  // 1.8s to render instead of 18ms, and every row paid for elements it never
  // showed. Before any row is cloned, each eligible conditional element in the
  // row template is moved into a <template> carrying its condition. Template
  // content is inert, so a cloned row builds the element only when the
  // condition holds (bindIf clones template content on the first true).
  //
  // Left alone: an if/else chain (its branches must stay siblings), an element
  // that is also a loop, a component (its setup script is a sibling), and
  // anything holding a script.
  var IF_ATTRS = [':if', 'x-if', '@if'];
  var FOR_ATTRS = [':for', 'x-for', '@for'];
  function deferRowConditionals(root) {
    if (stxHost.isNative || !root || !root.querySelectorAll || typeof document === 'undefined' || !document.createElement) return;
    // Inert HTML template content is a DOM allocation optimisation. Native
    // hosts already clone recorded descriptors and bind conditions through
    // their host operations; their document facade has no template content.
    if (!document.createElement('template').content) return;
    // A walk, not a selector: escaping ':' and '@' in an attribute selector
    // through this generated source is easy to get wrong, and wrong throws.
    var candidates = Array.prototype.slice.call(root.querySelectorAll('*'));
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.tagName === 'TEMPLATE' || !el.parentNode) continue;
      var attr = null;
      for (var a = 0; a < IF_ATTRS.length; a++) {
        if (el.hasAttribute(IF_ATTRS[a])) { attr = IF_ATTRS[a]; break; }
      }
      if (!attr) continue;
      var skip = false;
      for (var f = 0; f < FOR_ATTRS.length; f++) {
        if (el.hasAttribute(FOR_ATTRS[f])) skip = true;
      }
      if (skip || getElseAttrInfo(el)) continue;
      var next = el.nextElementSibling;
      if (next && (getElseAttrInfo(next) || next.tagName === 'SCRIPT')) continue;
      if (el.hasAttribute('data-stx-scope') || el.hasAttribute('x-data') || el.querySelector('script')) continue;
      var holder = document.createElement('template');
      holder.setAttribute(attr, el.getAttribute(attr));
      el.removeAttribute(attr);
      el.parentNode.insertBefore(holder, el);
      holder.content.appendChild(el);
    }
  }

  // A conditional branch that holds a COMPONENT is the heaviest thing a row can
  // carry and the one a row almost never shows: an inline editor for the one
  // row that is open. Cloned into every row only to be parked by :if, a 200-line
  // editor was a third of the time it took to draw a list, twice over (the
  // clone, then the walk that gives each cloned component its own scope id).
  // deferRowConditionals cannot take it (it holds a setup script, and a
  // <template> in a row is cloned with its content all the same), so the row
  // template keeps an EMPTY element with the same condition and the branch
  // lives once, here. bindIf fills the element from it the first time the
  // condition holds (materializeLazyBranch), as it would have been cloned.
  var __stxLazyBranches = new Map();
  var __stxLazyCounter = 0;
  function shareHeavyRowBranches(root) {
    if (stxHost.isNative || !root || !root.querySelectorAll || typeof document === 'undefined' || !document.createDocumentFragment) return;
    var candidates = Array.prototype.slice.call(root.querySelectorAll('[data-stx-scope]'));
    if (!candidates.length) return;
    var branches = [];
    candidates.forEach(function(component) {
      for (var el = component.parentElement; el; el = el.parentElement) {
        if (el.tagName === 'TEMPLATE') return;
        var attr = null;
        for (var a = 0; a < IF_ATTRS.length; a++) {
          if (el.hasAttribute(IF_ATTRS[a])) { attr = IF_ATTRS[a]; break; }
        }
        if (attr) {
          if (branches.indexOf(el) === -1 && eligibleHeavyBranch(el)) branches.push(el);
          return;
        }
        if (!root.contains(el)) return;
      }
    });
    branches.forEach(function(el) {
      // An outer candidate already took this one's children with it.
      if (!root.contains(el)) return;
      var holder = document.createDocumentFragment();
      while (el.firstChild) holder.appendChild(el.firstChild);
      var id = 'lz' + (++__stxLazyCounter);
      __stxLazyBranches.set(id, Array.prototype.slice.call(holder.childNodes));
      el.__stx_lazy_holder = holder;
      el.setAttribute('data-stx-lazy', id);
    });
  }
  function eligibleHeavyBranch(el) {
    for (var f = 0; f < FOR_ATTRS.length; f++) {
      if (el.hasAttribute(FOR_ATTRS[f])) return false;
    }
    if (getElseAttrInfo(el)) return false;
    var next = el.nextElementSibling;
    if (next && (getElseAttrInfo(next) || next.tagName === 'SCRIPT')) return false;
    if (el.hasAttribute('data-stx-scope') || el.hasAttribute('x-data')) return false;
    return true;
  }
  // Fill a row's empty conditional element with a copy of its branch, with the
  // component ids of THIS copy, before the branch is hydrated and bound.
  function materializeLazyBranch(el) {
    var id = el.getAttribute && el.getAttribute('data-stx-lazy');
    if (!id) return;
    el.removeAttribute('data-stx-lazy');
    var source = __stxLazyBranches.get(id);
    if (!source) return;
    var fragment = document.createDocumentFragment();
    source.forEach(function(node) { fragment.appendChild(stxHost.clone(node)); });
    el.appendChild(fragment);
    remapForComponentScopes([el]);
  }
`
