/** Reactive list binding for the generated client runtime. */
export const SIGNALS_FOR_RUNTIME = `  function bindFor(el, passedScope = componentScope, attrName = '@for') {
    if (el.__stx_for_bound) return;
    el.__stx_for_bound = true;
    const expr = el.getAttribute(attrName);
    // Support: "item in list", "item, index in list", "(item, index) in list"
    const match = expr.match(/^\\s*\\(?\\s*(\\w+)(?:\\s*,\\s*(\\w+))?\\s*\\)?\\s+(?:in|of)\\s+(.+)\\s*$/);

    if (!match) {
      console.warn('[STX] Invalid ' + attrName + ':', expr);
      return;
    }

    const [, itemName, indexName, listExpr] = match;
    const slotMetadata = el.getAttribute('data-stx-slot-scope');
    let slotScopeInfo = null;
    let slotCallerScope = null;
    let readSlotBindings = null;
    if (slotMetadata) {
      try {
        slotScopeInfo = JSON.parse(slotMetadata);
        let receiver = el.parentElement;
        while (receiver) {
          if (slotScopeInfo.owner && receiver.getAttribute
            && (receiver.getAttribute('data-stx-template-scope') || receiver.getAttribute('data-stx-scope')) === slotScopeInfo.owner) break;
          receiver = receiver.parentElement;
        }
        slotCallerScope = receiver && receiver.__stx_parent_scope
          || findElementScope(el) || passedScope;
        const bindingScope = mergeTemplateScopes(slotCallerScope);
        slotScopeInfo.names.concat(['__stx_slot_value']).forEach(function(name) { delete bindingScope[name]; });
        readSlotBindings = __stxCompileScoped(bindingScope, ['__stx_slot_value'],
          'const ' + slotScopeInfo.binding + ' = __stx_slot_value; return {' + slotScopeInfo.names.join(',') + '};');
      } catch (error) {
        console.error('[stx] Invalid scoped slot binding:', error);
        return;
      }
    }
    let parent = el.parentNode;

    // Guard: if element has no parent, it's detached - skip processing
    if (!parent) {
      console.warn('[STX] bindFor: element has no parent, skipping');
      return;
    }

    const placeholder = stxHost.anchor('stx-for');
    const isTemplate = el.tagName === 'TEMPLATE';
    const componentSetupTemplates = [];
    if (!isTemplate && el.hasAttribute('data-stx-scope')) {
      const componentScopeId = el.getAttribute('data-stx-scope');
      const componentTemplateScopeId = el.getAttribute('data-stx-template-scope') || componentScopeId;
      let setupSibling = el.nextSibling;
      while (setupSibling) {
        const nextSetupSibling = setupSibling.nextSibling;
        if (setupSibling.nodeType === Node.TEXT_NODE && !(setupSibling.textContent || '').trim()) {
          setupSibling = nextSetupSibling;
          continue;
        }
        if (setupSibling.nodeType === Node.COMMENT_NODE) {
          setupSibling = nextSetupSibling;
          continue;
        }
        if (setupSibling.nodeType === Node.ELEMENT_NODE
          && setupSibling.tagName === 'SCRIPT'
          && setupSibling.hasAttribute('data-stx-scoped')
          && ((setupSibling.textContent || '').indexOf(componentScopeId) !== -1
            || (componentTemplateScopeId && (setupSibling.textContent || '').indexOf(componentTemplateScopeId) !== -1))) {
          componentSetupTemplates.push(stxHost.clone(setupSibling));
          stxHost.remove(setupSibling);
          setupSibling = nextSetupSibling;
          continue;
        }
        break;
      }
    }

    // Check if element also has @if / :if - need to handle together
    const ifExpr = el.getAttribute('@if') || el.getAttribute(':if');

    // Feature #3: Check for @loading and @empty siblings/content
    const loadingExpr = el.getAttribute('@loading');
    const emptyExpr = el.getAttribute('@empty');

    // Look for sibling elements with @for-loading or @for-empty
    let loadingTemplate = null;
    let emptyTemplate = null;

    // Check next siblings for @for-loading and @for-empty
    let sibling = el.nextElementSibling;
    while (sibling) {
      if (sibling.hasAttribute('@for-loading')) {
        loadingTemplate = stxHost.clone(sibling);
        loadingTemplate.removeAttribute('@for-loading');
        stxHost.remove(sibling);
        sibling = el.nextElementSibling;
        continue;
      }
      if (sibling.hasAttribute('@for-empty')) {
        emptyTemplate = stxHost.clone(sibling);
        emptyTemplate.removeAttribute('@for-empty');
        stxHost.remove(sibling);
        sibling = el.nextElementSibling;
        continue;
      }
      break;
    }

    // Capture the scope NOW before element is removed from DOM
    const capturedScope = findElementScope(el) || findElementScope(parent);

    stxHost.insert(parent, placeholder, el);
    // Component setup scripts execute while the server-rendered loop source is
    // still in the document. That source becomes a template, not a live
    // instance, so reclaim all registered scopes before removing it. Every
    // rendered iteration receives remapped setup scripts and fresh scopes.
    disposeSubtreeScopes(el);
    stxHost.remove(el);

    // Capture :key expression BEFORE removing the attribute
    const keyExpr = el.getAttribute(':key') || el.getAttribute('x-bind:key');

    // For <template> elements, use the content; otherwise clone the element
    let templateContent;
    if (isTemplate) {
      templateContent = el.content;
      deferRowConditionals(templateContent);
    }
else {
      // Before the source is cloned into the row template, so that clone does
      // not build the conditional elements either.
      deferRowConditionals(el);
      const wrapper = stxHost.clone(el);
      wrapper.removeAttribute('@for');
      wrapper.removeAttribute(':for');
      wrapper.removeAttribute('x-for');
      wrapper.removeAttribute('@loading');
      wrapper.removeAttribute('@empty');
      wrapper.removeAttribute(':key');
      wrapper.removeAttribute('x-bind:key');
      // Also remove @if / :if / x-if - we'll handle it inline
      if (ifExpr) { wrapper.removeAttribute('@if'); wrapper.removeAttribute(':if'); wrapper.removeAttribute('x-if'); }
      templateContent = wrapper;
    }

    let currentElements = [];
    // One entry per list item, each holding EVERY node that item rendered.
    // currentElements stays flat for transition snapshots, but the keyed
    // diff below must pair a key with all of its nodes: a template row
    // routinely yields several (an element plus its surrounding text nodes),
    // and indexing a flat list by key position then paired the wrong node
    // with each key, leaving the list rotated after an update.
    let currentGroups = [];
    let currentKeys = [];
    let loadingElement = null;
    let emptyElement = null;

    // A <template :for> can contain another structural directive. That
    // nested directive replaces its source node with a placeholder and owns
    // additional live siblings around that placeholder. Track an explicit
    // boundary for every template iteration so keyed reuse moves the complete
    // live range, including nodes created by nested :for / :if bindings.
    // Moving only the original cloned nodes pulled static siblings past the
    // nested range on the next outer update (header, then rows became rows,
    // then header).
    const liveGroupNodes = (group) => {
      if (!isTemplate || !group || group.length < 2) return group || [];
      const start = group[0];
      const end = group[group.length - 1];
      if (!start || !end || start.parentNode !== parent || end.parentNode !== parent)
        return group.filter(groupNode => groupNode && groupNode.parentNode === parent);

      const nodes = [];
      let currentNode = start;
      while (currentNode) {
        nodes.push(currentNode);
        if (currentNode === end) break;
        currentNode = currentNode.nextSibling;
      }
      return nodes;
    };

    const removeGroup = (group) => {
      const liveNodes = liveGroupNodes(group);
      const liveSet = new Set(liveNodes);
      liveNodes.forEach(e => { disposeSubtreeEffects(e); disposeSubtreeScopes(e); stxHost.remove(e); });
      group.forEach(groupNode => {
        if (liveSet.has(groupNode)) return;
        disposeSubtreeEffects(groupNode);
        disposeSubtreeScopes(groupNode);
        stxHost.remove(groupNode);
      });
    };

    const clearRenderedItems = () => {
      currentGroups.forEach(removeGroup);
      currentElements = [];
      currentGroups = [];
      currentKeys = [];
    };

    // Helper to evaluate with captured scope (auto-unwraps signals)
    // NOTE: This eagerly reads ALL signals in scope — use evalLazy inside effects
    // to avoid over-broad dependency tracking.
    const evalExpr = (expression, extraScope = {}) => {
      try {
        // Skip placeholder expressions like __TITLE__ (build-time placeholders)
        if (/^__[A-Z_]+__$/.test(expression.trim())) {
          return expression;
        }
        // Use passedScope instead of componentScope to preserve context through nested processing
        const scope = mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}), extraScope);
        const unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
          if (typeof prop !== 'string') return false;
          return expressionCallsSignal(expression, prop)
            || expressionUsesSignalApi(expression, prop);
        });
        const fn = __stxCompileScoped(scope, [], 'return ' + expression);
        return fn(...__stxArgs(fn, unwrapScope));
      }
catch (e) {
        reportUnknownBinding(e, expression, mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}), extraScope), el);
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expression, e);
        return '';
      }
    };

    // Lazy eval: uses with() so only variables ACTUALLY ACCESSED by the expression
    // trigger signal reads. This prevents unrelated signals (like modalOpen) from
    // being tracked as dependencies when we only care about the list signal.
    const evalLazy = (expression, extraScope = {}) => {
      try {
        if (/^__[A-Z_]+__$/.test(expression.trim())) return expression;
        const scope = mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}), extraScope);
        const unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
          if (typeof prop !== 'string') return false;
          return expressionCallsSignal(expression, prop)
            || expressionUsesSignalApi(expression, prop);
        });
        // Compiled over the names the expression mentions (__stxCompileScoped),
        // so only those are read and register as dependencies. It used with()
        // over the proxy, which JavaScriptCore resolves through proxy traps on
        // every identifier - 36x slower than V8 for a list of message rows.
        const fn = __stxCompileScoped(unwrapScope, [], 'return ' + expression + '');
        return fn(...__stxArgs(fn, unwrapScope));
      } catch (e) {
        reportUnknownBinding(e, expression, mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}), extraScope), el);
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expression, e);
        return '';
      }
    };

    // Helper to show loading state
    const showLoading = () => {
      hideLoading();
      hideEmpty();
      if (loadingTemplate) {
        loadingElement = stxHost.clone(loadingTemplate);
        stxHost.insert(parent, loadingElement, placeholder);
      }
    };

    // Helper to hide loading state
    const hideLoading = () => {
      if (loadingElement) {
        stxHost.remove(loadingElement);
        loadingElement = null;
      }
    };

    // Helper to show empty state
    const showEmpty = () => {
      hideLoading();
      hideEmpty();
      if (emptyTemplate) {
        emptyElement = stxHost.clone(emptyTemplate);
        stxHost.insert(parent, emptyElement, placeholder);
        const shownEmpty = emptyElement;
        shownEmpty.__stx_effect_disposers = trackEffects(function() { processElement(shownEmpty); });
      }
    };

    // Helper to hide empty state
    const hideEmpty = () => {
      if (emptyElement) {
        // A string @empty renders a text node, which has no subtree to dispose.
        if (emptyElement.nodeType === 1) disposeSubtreeEffects(emptyElement);
        stxHost.remove(emptyElement);
        emptyElement = null;
      }
    };

    // Helper: create DOM element(s) for a single list item.
    // The item is wrapped in a signal so bindings track it reactively. The pair
    // rides on the returned group, so reuse always reaches the signals the
    // bindings of THAT row actually read. A Map from key to signals could not:
    // two rows sharing a key overwrote each other in it, and the row that
    // reused the surviving entry was then bound to a signal nothing updated.
    const createItemElements = (item, index, key) => {
      const itemSignal = state(item);
      itemSignal._isStxLoopItem = true;
      const indexSignal = state(index);

      const itemScope = slotScopeInfo
        ? mergeTemplateScopes(globalHelpers, slotCallerScope)
        : mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}));
      Object.defineProperty(itemScope, itemName, { value: itemSignal, writable: true, enumerable: true, configurable: true });
      if (slotScopeInfo) {
        slotScopeInfo.names.forEach(function(name) {
          Object.defineProperty(itemScope, name, { enumerable: true, configurable: true, get: function() {
            return readSlotBindings(...__stxArgs(readSlotBindings, slotCallerScope), itemSignal())[name];
          } });
        });
      } else {
        if (indexName) Object.defineProperty(itemScope, indexName, { value: indexSignal, writable: true, enumerable: true, configurable: true });
      }

      const elements = [];
      if (isTemplate) {
        elements.push(stxHost.anchor('stx-for-item-start'));
        Array.from(templateContent.childNodes).forEach(node => {
          const clone = stxHost.clone(node);
          if (slotScopeInfo) {
            clone.__stx_for_scope = itemScope;
            clone.__stx_slot_scope = itemScope;
          }
          if (clone.nodeType === 1) {
            // Structural directives need a live parent. Keep the iteration
            // scope on the clone until the keyed diff inserts it, then bind.
            clone.__stx_for_scope = itemScope;
            if (slotScopeInfo && !clone.hasAttribute('data-stx-scope')) clone.__stx_scope = itemScope;
            markLoopRow(clone, itemName, itemSignal);
          }
          elements.push(clone);
        });
        elements.push(stxHost.anchor('stx-for-item-end'));
      } else {
        const clone = stxHost.clone(templateContent);
        clone.__stx_for_scope = itemScope;
        if (slotScopeInfo && !clone.hasAttribute('data-stx-scope')) clone.__stx_scope = itemScope;
        markLoopRow(clone, itemName, itemSignal);
        elements.push(clone);
        componentSetupTemplates.forEach(function(setupTemplate) {
          elements.push(stxHost.clone(setupTemplate));
        });
      }
      remapForComponentScopes(elements);
      elements.__stx_signals = { item: itemSignal, index: indexSignal };
      return elements;
    };

    // Keys have the same component and enclosing-row scope as other bindings.
    // Compiling with only item/index hid helper functions and outer signals,
    // silently turning explicit keyed lists into positional lists.
    let warnedKeyExpression = false;
    const getItemKey = (item, index) => {
      if (!keyExpr) return String(index);
      try {
        const rowScope = { [itemName]: item };
        rowScope[indexName || '_idx'] = index;
        const scope = mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}), rowScope);
        const unwrapScope = createExpressionAutoUnwrapProxy(scope, keyExpr);
        const fn = __stxCompileScoped(unwrapScope, [], 'return ' + keyExpr);
        const key = fn(...__stxArgs(fn, unwrapScope));
        if (key === null || key === undefined) throw new Error('The key is null or undefined');
        return String(key);
      } catch (e) {
        if (!warnedKeyExpression) {
          warnedKeyExpression = true;
          console.warn('[STX] :for could not evaluate :key "' + keyExpr + '"; using item positions. Give each item a valid unique key.', e);
        }
        return String(index);
      }
    };

    effect(() => {
      parent = followPlaceholder(placeholder, parent);
      // Use evalLazy for the list expression — only tracks the list signal,
      // not every signal in the component scope. This prevents unrelated
      // signals (modalOpen, menuOpen, etc.) from triggering a full rebuild.
      // Check loading state if @loading attribute provided (Feature #3)
      if (loadingExpr) {
        const isLoading = evalLazy(loadingExpr);
        if (isLoading) {
          // Dispose scopes registered by items before they leave the DOM (#1727).
          clearRenderedItems();
          showLoading();
          return;
        }
      }

      hideLoading();

      // Evaluate list with LAZY tracking — only the list signal is tracked
      let list = evalLazy(listExpr);

      // Tolerate parens-on-signal in the list expression.
      //   :for="x in store.signal"   --> works (bare-ref, auto-unwrapped)
      //   :for="x in store.signal()" --> silently iterated zero, because
      //                                  the proxy unwraps the signal to
      //                                  the array on access, then the
      //                                  trailing call throws TypeError
      //                                  which evalLazy's catch swallows.
      // Retry without the trailing parens so both forms succeed.
      //
      // This runtime is emitted as a TEMPLATE LITERAL, so every backslash here
      // must be DOUBLED to survive into the shipped string. A regex literal
      // crosses only that one layer (doubled escapes ship intact). A
      // new RegExp('...') string crosses a SECOND layer too — the browser's
      // string-literal parse strips the escapes again — collapsing the pattern
      // to a bare-letter match that never fires (stacksjs/stx#1748). So use a
      // regex literal, not new RegExp(string), for patterns with backslashes.
      var trailingParens = /\\(\\s*\\)\\s*$/;
      if (!Array.isArray(list) && trailingParens.test(listExpr)) {
        list = evalLazy(listExpr.replace(trailingParens, ''));
      }
      // Second-chance fallback: if the retry returned a signal /
      // derived function (the proxy failed to auto-unwrap, which
      // can happen when the resolved owning object lacks the
      // _isStxStore marker — e.g. ad-hoc objects, locally-imported
      // shapes), call it manually. Defensive: cheap when it would
      // already be an array, useful when the proxy missed.
      if (!Array.isArray(list) && typeof list === 'function' && (list._isSignal || list._isDerived)) {
        try { list = list(); } catch { /* swallow - the warning below surfaces it */ }
      }

      // If there's an @if condition, check it
      if (ifExpr) {
        const ifValue = evalLazy(ifExpr);
        if (!ifValue) {
          // Dispose scopes registered by items before they leave the DOM (#1727).
          clearRenderedItems();
          hideEmpty();
          return;
        }
      }

      if (!Array.isArray(list)) {
        // Silent return here used to mask a class of real misuse:
        // most often a signal call that threw mid-expression, or a
        // :for over undefined from a typo. One warn line saves a lot
        // of "list rendered no rows despite the data being there"
        // debugging cycles.
        //
        // Diagnostic: dump the scope identifiers so the caller can see
        // whether the expression's root identifier was in scope at all
        // (and if so, what type it was and whether it carried the
        // _isStxStore marker). Only fires on the warn path, which is
        // rare, so the extra Object.keys / spread cost is negligible.
        var diagScope;
        var rootName = '?';
        var rootInScope = true;
        var rootVal;
        try {
          var diagMerged = mergeTemplateScopes(globalHelpers, passedScope, (capturedScope || {}));
          var firstIdent = listExpr.match(/^[A-Za-z_$][\\w$]*/);
          rootName = firstIdent ? firstIdent[0] : '?';
          rootInScope = Object.prototype.hasOwnProperty.call(diagMerged, rootName);
          rootVal = rootInScope ? diagMerged[rootName] : '<NOT-IN-SCOPE>';
          var rootKeys = (rootVal && typeof rootVal === 'object')
            ? Object.keys(rootVal).slice(0, 8).join(',')
            : '-';
          diagScope = '[root=' + rootName + ' inScope=' + rootInScope + ' type=' + (typeof rootVal) + ' isStxStore=' + !!(rootVal && rootVal._isStxStore) + ' keys=' + rootKeys + ']';
        }
        catch (_e) { diagScope = '[diag-error]'; rootInScope = true; }

        /*
         * Name the cause rather than guessing at it (stacksjs/stx#2051).
         *
         * This used to end with "If this is a signal call, try the bare
         * reference" every single time. In the most common failure the
         * identifier is not a signal at all -- it is a bare name the client
         * scope has never heard of, usually a declaration from a
         * script-server block, which :for cannot see because it is expanded
         * on the client. The hint sent people to the wrong layer: one app
         * read it, concluded the signals-and-:for pattern was unreliable, and
         * was rebuilt on hand-written getElementById wiring.
         *
         * The scope dump already answered the question -- inScope=false was
         * right there, ahead of the guess -- so lead with it, and keep the
         * signal advice for when the value really is a signal, which is the
         * one case where it applies.
         */
        var advice;
        if (!rootInScope) {
          advice = 'Nothing named ' + rootName + ' is in the client scope. A script-server declaration is not available here: :for is expanded on the client. '
            + 'Either wrap it in state() inside a script-client block, or iterate it with the server-side @foreach(' + rootName + ' as item).';
        }
        else if (typeof rootVal === 'function' && (rootVal._isSignal || rootVal._isDerived)) {
          advice = rootName + ' is a signal, so try the bare reference: ' + rootName + ' instead of ' + rootName + '().';
        }
        else {
          advice = rootName + ' resolved to a ' + (typeof rootVal) + ', not an array.';
        }
        console.warn('[STX] :for expected an array; got ' + (list === '' ? 'empty/error' : typeof list) + ' for expression "' + listExpr + '". ' + diagScope + ' ' + advice);
        return;
      }

      // Check empty state (Feature #3)
      if (list.length === 0) {
        // Dispose scopes registered by items before they leave the DOM (#1727).
        clearRenderedItems();
        if (emptyExpr) {
          const emptyContent = evalLazy(emptyExpr);
          // Held in the same slot the @for-empty template uses, so hideEmpty
          // takes it away when the list fills and a second empty render
          // replaces it instead of stacking another one. It used to go into
          // currentElements, which teardown does not walk -- it walks
          // currentGroups -- so the text stayed in the document forever: an
          // empty list that filled read "Nothing herea".
          hideEmpty();
          if (emptyContent && typeof emptyContent === 'string') {
            emptyElement = document.createTextNode(emptyContent);
            stxHost.insert(parent, emptyElement, placeholder);
          }
        } else if (emptyTemplate) {
          showEmpty();
        }
        return;
      }

      hideEmpty();

      // ── <TransitionGroup> detection (#1742) ───────────────────────
      // Active only when the list's parent is a [data-stx-transition-group]
      // AND it has already rendered once (no enter animation on first mount).
      // tgReady gates ALL animation work, so plain :for lists are untouched.
      var tgIsGroup = !!(parent && parent.hasAttribute && parent.hasAttribute('data-stx-transition-group'));
      var tgName = tgIsGroup ? (parent.getAttribute('data-stx-transition-group') || 'v') : null;
      var tgReady = tgIsGroup && !!parent.__stx_tg_init;
      var tgFirst = tgReady ? tgSnapshot(currentElements) : null;

      // ── Key-based diffing ─────────────────────────────────────────
      // Build new key list
      const newKeys = list.map((item, i) => getItemKey(item, i));

      // Build old key → element(s) map
      const oldKeyMap = new Map();
      for (let i = 0; i < currentKeys.length; i++) {
        const k = currentKeys[i];
        if (!oldKeyMap.has(k)) oldKeyMap.set(k, []);
        oldKeyMap.get(k).push(currentGroups[i] || []);
      }

      // Build new element list, reusing existing DOM nodes by key
      const newElements = [];
      const newGroups = [];
      // Keys seen in THIS pass, for the duplicate warning only. Reuse is decided
      // by whether a group under the key is still unconsumed, not by whether the
      // key has been seen: gating it on the key made every duplicate occurrence
      // build a NEW group, while the removal pass below skipped the key as used
      // and left the old ones in the document. The list grew by one row on every
      // update, without bound, and the first duplicate stayed bound to a signal
      // the reconciliation never wrote to.
      const seenKeys = new Set();
      let warnedDuplicateKey = false;

      // Minimal-move reconciliation.
      //
      // Every reused row used to be round-tripped through a DocumentFragment,
      // and appendChild into a fragment DETACHES the node from the document
      // first. Removing a focused node blurs it and resets activeElement, so a
      // list could not contain a field the user was typing in: any write to the
      // backing array kicked them out of it, losing caret, selection and undo
      // history. It happened for every row unconditionally, including rows that
      // had not moved, and unkeyed loops took the same path because getItemKey
      // falls back to the index (#1882).
      //
      // The cursor walks the existing rendering in order. A node already at the
      // cursor is left ENTIRELY alone — an unchanged list now performs zero DOM
      // operations — and a node that genuinely has to move is moved with
      // insertBefore, which relocates it without a detach/reattach cycle.
      let cursor = null;
      for (let ci = 0; ci < currentGroups.length && !cursor; ci++) {
        const seed = liveGroupNodes(currentGroups[ci] || []);
        if (seed.length) cursor = seed[0];
      }

      for (let i = 0; i < list.length; i++) {
        const key = newKeys[i];
        const existing = oldKeyMap.get(key);

        if (seenKeys.has(key) && !warnedDuplicateKey) {
          warnedDuplicateKey = true;
          console.warn('[STX] :for has more than one item with the key ' + key + '. Rows are matched in order, so give each item a key of its own.');
        }
        seenKeys.add(key);

        if (existing && existing.length > 0) {
          // Reuse this item's nodes — move the whole group into position, in
          // order, so a multi-node row stays contiguous and correctly ordered.
          // A structural directive may intentionally have detached one of the
          // group's nodes. Its own placeholder owns reinsertion, so keyed reuse
          // must not resurrect that hidden node.
          const group = existing.shift();
          const liveNodes = liveGroupNodes(group);
          for (let li = 0; li < liveNodes.length; li++) {
            const groupNode = liveNodes[li];
            if (groupNode === cursor) {
              // Already exactly where it belongs. Touching it here is what
              // used to blur it, so the correct action is to do nothing.
              cursor = cursor.nextSibling;
            }
            else {
              // Moves without detaching. The cursor does not advance: this node
              // is now behind it, and the cursor still marks the next position
              // to fill.
              stxHost.insert(parent, groupNode, cursor || placeholder);
            }
          }
          newElements.push(...group);
          newGroups.push(group);
          // Update the item signal so bindings re-evaluate with new data.
          // This is the fix for #1669 — without this, reused elements show
          // stale data because the old bindings captured the old item via closure.
          const signals = group.__stx_signals;
          if (signals) {
            signals.item.set(list[i]);
            signals.index.set(i);
          }
        } else {
          // New item — create DOM elements with a fresh item signal
          const elements = createItemElements(list[i], i, key);
          elements.forEach(el => {
            // Before the cursor, not before the placeholder: a new row inserted
            // in the MIDDLE of the list must land at its own position, without
            // forcing every row after it to be moved to get back in order.
            stxHost.insert(parent, el, cursor || placeholder);
            if (tgReady && el.isConnected) tgEnter(el, tgName);
          });
          hydrateComponentScopes(elements, elements.find(function(node) {
            return node && node.__stx_for_scope;
          })?.__stx_for_scope || passedScope);
          elements.forEach(el => {
            if (el.nodeType === 1) {
              var itemScope = el.__stx_for_scope || passedScope;
              delete el.__stx_for_scope;
              // Tracked so removeGroup can dispose the row's effects (#1954). Kept
              // off __stx_disposers, which marks a hydrated component root here
              // and in the deferred :if pass.
              if (!el.__stx_disposers && el.tagName !== 'SCRIPT')
                el.__stx_effect_disposers = trackEffects(function() { processElement(el, itemScope); });
              el.removeAttribute('x-cloak');
              el.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
            } else if (slotScopeInfo && el.nodeType === Node.TEXT_NODE && (el.textContent || '').includes('{{')) {
              const itemScope = el.__stx_for_scope;
              delete el.__stx_for_scope;
              // Interpolation replaces the original text node. Its effects
              // therefore belong to the range anchor that survives removal.
              const release = trackEffects(function() { processElement(el, itemScope); });
              const anchor = elements[0];
              const previous = anchor.__stx_effect_disposers;
              anchor.__stx_effect_disposers = function() { if (previous) previous(); release(); };
            }
          });
          newElements.push(...elements);
          newGroups.push(elements);
        }
      }

      // Remove old elements whose keys are no longer in the list.
      // Dispose any scopes registered inside removed items before the
      // remove() call (#1727).
      // Whatever is still in here was not consumed above -- either the key left
      // the list, or the list now has fewer rows under that key than it did.
      // The test used to be "this key was never used", which could not see the
      // second case, so a duplicate key's leftover rows stayed on screen.
      for (const groups of oldKeyMap.values()) {
        if (groups.length > 0) {
          // In a transition group, run the leave animation and let it remove the
          // node; otherwise remove immediately. Scopes are disposed up-front
          // either way (their destroy hooks shouldn't wait on a CSS transition).
          groups.forEach((group) => {
            if (tgReady) {
              const liveNodes = liveGroupNodes(group);
              const transitioned = new Set();
              liveNodes.forEach((el) => {
                disposeSubtreeEffects(el);
                disposeSubtreeScopes(el);
                if (tgLeave(el, tgName)) transitioned.add(el);
                else stxHost.remove(el);
              });
              group.forEach((el) => {
                if (transitioned.has(el) || liveNodes.includes(el)) return;
                disposeSubtreeEffects(el);
                disposeSubtreeScopes(el);
                stxHost.remove(el);
              });
            }
            else {
              removeGroup(group);
            }
          });
          // The row's signals went with its group, so there is no key-indexed
          // map left to prune here.
        }
      }

      currentElements = newElements;
      currentGroups = newGroups;
      currentKeys = newKeys;

      // ── <TransitionGroup> play (#1742) ────────────────────────────
      // FLIP the surviving elements from their snapshotted positions, then mark
      // the group rendered so the next update animates.
      if (tgReady && tgFirst) tgFlip(newElements, tgFirst, tgName);
      if (tgIsGroup) parent.__stx_tg_init = true;
    });
  }
`
