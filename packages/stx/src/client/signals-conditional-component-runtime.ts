/** Conditional component scope preservation for the generated client runtime. */
export const SIGNALS_CONDITIONAL_COMPONENT_RUNTIME = `  // A false :if detaches its subtree before the DOMContentLoaded scope walk
  // reaches nested components. Capture and bind their caller-owned props while
  // the ancestor chain is still connected, otherwise resolveComponentCallerScope
  // can no longer see the component that declared expressions such as
  // :options="environmentOptions".
  function preserveConditionalComponentScopes(root, callerScope) {
    if (!root || !root.querySelectorAll) return;
    // A <template :if> branch is inert source: what shows is a clone of its
    // content, hydrated and bound by processTemplateNodes when it is inserted.
    // A DOM whose querySelectorAll reaches into template content (the test
    // DOM, a native host) would otherwise bind the SOURCE component's caller
    // props here, consuming :value on the source, so every clone carried the
    // value of the moment it was cloned and stopped following the page.
    if (root.tagName === 'TEMPLATE') return;
    var scopeEls = [];
    if (root.matches && root.matches('[data-stx-scope]')) scopeEls.push(root);
    root.querySelectorAll('[data-stx-scope]').forEach(function(scopeEl) { scopeEls.push(scopeEl); });
    scopeEls.forEach(function(scopeEl) {
      if (scopeEl.__stx_parent_props_bound) return;
      // A component inside a descendant loop cannot resolve its caller props
      // until bindFor creates the iteration scope. Binding it while the outer
      // conditional is being detached would consume expressions such as
      // :status="deployment.status" before the deployment item exists, leaving every
      // later clone with the child's default prop. bindFor hydrates these
      // component scopes after insertion with the correct per-item scope.
      var current = scopeEl;
      while (current && current !== root) {
        if (current.hasAttribute
          && (current.hasAttribute('@for') || current.hasAttribute(':for') || current.hasAttribute('x-for'))) {
          preserveDeferredParentComponentProps(scopeEl);
          return;
        }
        current = current.parentElement || current.parentNode;
      }
      scopeEl.__stx_parent_scope = resolveComponentCallerScope(scopeEl, callerScope);
      bindParentComponentProps(scopeEl, scopeEl.__stx_parent_scope);
    });
  }

  // Component setup scripts are emitted immediately after their scoped root.
  // When that root itself carries :if, detaching only the element leaves the
  // sibling setup script outside the conditional node group. Scripts inserted
  // through innerHTML are inert, so the later hydration pass has no script to
  // execute and the component keeps raw directives and interpolations.
  function findConditionalComponentSetupSiblings(root) {
    if (!root || !root.hasAttribute || !root.hasAttribute('data-stx-scope')) return [];
    var scopeId = root.getAttribute('data-stx-scope');
    var templateScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
    if (!scopeId) return [];

    var scripts = [];
    var sibling = root.nextSibling;
    while (sibling) {
      var next = sibling.nextSibling;
      if (sibling.nodeType === Node.TEXT_NODE && !(sibling.textContent || '').trim()) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.COMMENT_NODE) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.ELEMENT_NODE
        && sibling.tagName === 'STYLE'
        && sibling.hasAttribute('data-stx-vendor')) {
        sibling = next;
        continue;
      }
      if (sibling.nodeType === Node.ELEMENT_NODE
        && sibling.tagName === 'SCRIPT'
        && sibling.hasAttribute('data-stx-scoped')
        && ((sibling.textContent || '').indexOf(scopeId) !== -1
          || (templateScopeId && (sibling.textContent || '').indexOf(templateScopeId) !== -1))) {
        scripts.push(sibling);
        sibling = next;
        continue;
      }
      break;
    }
    return scripts;
  }
`
