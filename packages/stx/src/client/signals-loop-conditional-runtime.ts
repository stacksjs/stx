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
    if (!root || !root.querySelectorAll || typeof document === 'undefined' || !document.createElement) return;
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
`
