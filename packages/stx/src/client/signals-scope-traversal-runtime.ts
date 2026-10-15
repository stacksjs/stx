/** Scoped-tree traversal used by the generated client runtime. */
export const SIGNALS_SCOPE_TRAVERSAL_RUNTIME = `  // Helper to process elements while skipping already-processed scoped containers
  function processElementSkipScopes(el, processedScopes) {
    if (processedScopes.has(el)) return;
    if (el.nodeType === Node.TEXT_NODE) {
      processElement(el);
      return;
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return;
    // Skip scoped elements - they were already processed
    if (el.hasAttribute && el.hasAttribute('data-stx-scope')) return;
    // Inactive chain members are owned by bindIfChain. Use explicit branch
    // state because an active nested branch can live under a detached outer
    // conditional while its reactive effects continue to run.
    if (el.__stx_chain_member && !el.__stx_chain_active) return;
    // Process this element's directives without recursing into children
    // (we'll handle children manually to skip scoped ones)
    const hasFor = el.hasAttribute && (el.hasAttribute('@for') || el.hasAttribute(':for') || el.hasAttribute('x-for'));
    const hasIf = el.hasAttribute && (el.hasAttribute('@if') || el.hasAttribute(':if') || el.hasAttribute('x-if'));
    if (hasFor) { var fa = el.hasAttribute(':for') ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for'; bindFor(el, componentScope, fa); return; }
    if (hasIf) {
      var ia = el.hasAttribute(':if') ? ':if' : el.hasAttribute('x-if') ? 'x-if' : '@if';
      var ic = findIfChain(el, ia);
      if (ic.length > 1) bindIfChain(ic, componentScope);
      else bindIf(el, componentScope, ia);
      return;
    }
    // Process other attributes...
    var isNativeModal = el.tagName === 'MODAL';
    if (el.hasAttribute && ((el.hasAttribute('@show') && !isNativeModal)
      || el.hasAttribute(':show') || el.hasAttribute('x-show'))) {
      var sa = el.hasAttribute(':show') ? ':show' : el.hasAttribute('x-show') ? 'x-show' : '@show';
      bindShow(el, el.getAttribute(sa), componentScope, sa);
    }
    var mb = getModelBinding(el);
    if (mb) {
      bindModel(el, mb.expression, componentScope, mb.name);
    }
    // Process children, skipping scoped containers and script/style elements
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
      Array.from(el.childNodes).forEach(child => processElementSkipScopes(child, processedScopes));
    }
  }`
