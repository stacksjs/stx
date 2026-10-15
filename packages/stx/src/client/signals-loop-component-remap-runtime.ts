/** Loop component scope remapping helpers for the generated client runtime. */
export const SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME = `  var __forComponentScopeCounter = 0;
  var __forComponentSetupFactories = new Map();

  function forEachGroupElement(nodes, callback) {
    function visit(node, insideTemplateContent) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      callback(node, insideTemplateContent);

      // HTMLTemplateElement children live in template.content, outside the
      // element's ordinary descendant tree. Component roots and setup scripts
      // wrapped by caller-owned :if/:for directives must still be discoverable
      // for scope remapping before those templates are cloned.
      var entersTemplateContent = node.tagName === 'TEMPLATE' && node.content;
      var childRoot = entersTemplateContent
        ? node.content
        : node;
      Array.from(childRoot.childNodes || []).forEach(function(child) {
        visit(child, insideTemplateContent || entersTemplateContent);
      });
    }

    nodes.forEach(function(node) { visit(node, false); });
  }

  // A signal component expanded inside <template :for> carries a compiled
  // data-stx-scope id and setup script. cloneNode() used to duplicate that id
  // for every row, so all instances shared the first child's props and state.
  // Give each cloned component tree its own ids before insertion, and rewrite
  // the setup scripts that target those ids.
  function remapForComponentScopes(nodes) {
    var scopeMap = {};
    forEachGroupElement(nodes, function(node) {
      if (!node.hasAttribute || !node.hasAttribute('data-stx-scope')) return;
      var oldId = node.getAttribute('data-stx-scope');
      if (!oldId) return;
      if (!scopeMap[oldId])
        scopeMap[oldId] = oldId + '_for_' + (++__forComponentScopeCounter);
      // Keep the compiler's original id through any additional structural
      // clones. DOM cloneNode() preserves attributes but not expando fields.
      if (!node.hasAttribute('data-stx-template-scope'))
        node.setAttribute('data-stx-template-scope', oldId);
      node.setAttribute('data-stx-scope', scopeMap[oldId]);
    });

    var oldIds = Object.keys(scopeMap);
    if (!oldIds.length) return;

    forEachGroupElement(nodes, function(node) {
      if (node.attributes) {
        Array.from(node.attributes).forEach(function(rawAttribute) {
          var attribute = Array.isArray(rawAttribute)
            ? { name: rawAttribute[0], value: rawAttribute[1] }
            : rawAttribute;
          if (!attribute || attribute.name === 'data-stx-scope' || attribute.name === 'data-stx-template-scope') return;
          var value = attribute.value;
          if (typeof value !== 'string') return;
          oldIds.forEach(function(oldId) {
            if (value.indexOf(oldId) !== -1)
              value = value.split(oldId).join(scopeMap[oldId]);
          });
          if (value !== attribute.value) node.setAttribute(attribute.name, value);
        });
      }
    });
  }
`
