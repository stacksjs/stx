/** Single-branch conditional binding for the generated client runtime. */
export const SIGNALS_IF_RUNTIME = `  const detachedBranches = new Set();
  function resumeDetachedBranches() {
    if (!detachedBranches.size) return;
    Array.from(detachedBranches).forEach(function(resume) {
      if (!resume.el.isConnected) return;
      detachedBranches.delete(resume);
      resume();
    });
  }

  function bindIf(el, passedScope = componentScope, attrName = '@if') {
    // Guard: prevent double-binding on the same element
    if (el.__stx_if_bound) { console.log('[stx] bindIf SKIPPED (already bound):', el.getAttribute(attrName) || '(attr removed)', 'on', el.tagName); return; }
    el.__stx_if_bound = true;

    const expr = el.getAttribute(attrName);
    let parent = el.parentNode;

    // Guard: if element has no parent, it's detached - skip processing
    if (!parent) {
      console.warn('[STX] bindIf: element has no parent, skipping');
      return;
    }

    const placeholder = stxHost.anchor('stx-if');
    // Marks where this branch's rendered content ENDS (stacksjs/stx#1955).
    // Hiding used to remove only the cloned nodes, but a structural directive
    // directly inside the template renders its own output as siblings that are
    // not among those clones -- a <template :for> at the top level of a
    // <template :if> left every row on screen after the branch went false.
    // Only the template branch needs it; the single-element branch owns exactly
    // the node it was bound to.
    let endMarker = null;
    let isInserted = true;

    // Handle <template> elements specially - clone their content
    const isTemplate = el.tagName === 'TEMPLATE';
    if (!isTemplate) el.__stx_if_visible = state(true);
    const componentSetupSiblings = isTemplate ? [] : findConditionalComponentSetupSiblings(el);
    let currentNodes = isTemplate ? [] : [el, ...componentSetupSiblings];

    // Capture BOTH element scope AND passedScope NOW before anything changes
    // passedScope may contain @for iteration variables or parent component signals
    const capturedElementScope = findElementScope(el);
    const capturedComponentScope = layerTemplateScopes(passedScope);

    preserveConditionalComponentScopes(el, capturedComponentScope);
    stxHost.insert(parent, placeholder, el);
    el.removeAttribute(attrName);

    if (isTemplate) {
      // Nothing is cloned until the condition holds: the effect below clones
      // template.content on the first true and binds it then. Every branch
      // used to be cloned and inserted up front and the false ones removed, so
      // a false branch still built its elements - in WebKit a <video> or
      // <audio> sets up a media player as it is created.
      isInserted = false;
      stxHost.remove(el); // Remove the template element itself
    }

    // Helper to evaluate with captured scope (auto-unwraps signals).
    // A with-scope resolves only identifiers the expression actually references,
    // so the conditional subscribes narrowly instead of reading every signal
    // in a component scope. That broad subscription made an unrelated ref
    // update re-enter structural removal while the real condition was already
    // removing the same subtree. First try the auto-unwrap proxy (so a bare
    // comparison like count > 5 reads the signal value), then retry with the
    // raw scope so call syntax like count() === 0 still works (#1733).
    const evalExpr = (expression) => {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expression.trim())) {
        return expression;
      }
      try {
        var scope = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));
        const unwrapScope = createExpressionAutoUnwrapProxy(scope, expression);
        const fn = __stxCompileScoped(unwrapScope, [], 'return ' + expression + '');
        return fn(...__stxArgs(fn, unwrapScope));
      }
catch (e1) {
        try {
          // Retry without the unwrap proxy so call-syntax (signal()) works.
          const scope2 = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));
          const fn2 = __stxCompileScoped(scope2, [], 'return ' + expression + '');
          return fn2(...__stxArgs(fn2, scope2));
        }
catch (e2) {
          reportUnknownBinding(e2, expression, scope || {}, el);
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expression, e2);
          return '';
        }
      }
    };

    // Track if children have been processed
    let childrenProcessed = false;

    // Helper to process children with captured scope
    const processChildrenWithScope = () => {
      // Build the combined scope for children - no need to modify global componentScope
      // Just pass the scope explicitly to processElement
      const childScope = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));


      Array.from(el.childNodes).forEach(child => processElement(child, childScope));

      childrenProcessed = true;
    };

    // A <template :if> inserts clones of template.content rather than the
    // template element itself. Those clones still need the normal directive
    // and interpolation pass. Previously the initially-visible branch was
    // inserted and left inert, so bindings such as :text and {{ expression }}
    // leaked into the rendered UI until the condition toggled.
    const processTemplateNodes = (nodes) => {
      const childScope = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));
      // Components compiled inside a <template :if> carry setup scripts in the
      // template content. Browser-cloned scripts are inert, so register their
      // scopes and forwarded props before walking the inserted branch. This is
      // the same component hydration path used by <template :for>.
      hydrateComponentScopes(nodes, childScope);
      nodes.forEach(node => {
        if (!node.__stx_disposers && node.tagName !== 'SCRIPT')
          node.__stx_effect_disposers = trackEffects(function() { processElement(node, childScope); });
        if (node.nodeType === 1) {
          node.removeAttribute('x-cloak');
          node.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
        }
      });
      resumeDetachedBranches();
    };

    // Evaluate the :if expression — use direct signal read for simple refs,
    // falling back to evalExpr for complex expressions
    const fullScope = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));
    const directSignal = fullScope[expr];

    effect(() => {
      parent = followPlaceholder(placeholder, parent, currentNodes);
      var value;
      if (directSignal && (directSignal._isSignal || directSignal._isDerived)) {
        value = directSignal();
        console.log('[stx] bindIf effect (direct):', expr, '→', value, 'isInserted:', isInserted);
      } else {
        value = evalExpr(expr);
      }

      if (isTemplate) {
        if (value && !isInserted) {
          // Inserting a component runs its setup synchronously. Child prop
          // reconciliation must not subscribe this branch to the child state.
          isInserted = true;
          childrenProcessed = true;
          peek(function() {
            // Re-insert cloned content
            currentNodes = Array.from(el.content.childNodes).map(n => stxHost.clone(n));
            const insertionAnchor = placeholder.nextSibling;
            currentNodes.forEach(node => stxHost.insert(parent, node, insertionAnchor));
            // Bound AFTER the clones, so hiding can remove whatever a nested
            // structural directive rendered as their sibling (#1955).
            if (!endMarker) endMarker = stxHost.anchor('stx-if-end');
            stxHost.insert(parent, endMarker, insertionAnchor);
            processTemplateNodes(currentNodes);
            // Stamp insertion time for click propagation guard
            currentNodes.forEach(function(n) { if (n.nodeType === 1) n.__stx_shown_at = performance.now(); });
          });
        }
else if (!value && isInserted) {
          // Remove all current nodes. Do NOT disposeSubtreeScopes — :if is a
          // toggle, not a permanent unmount; see the single-element branch
          // below and #1737. Effects are disposed, though: these clones are never
          // reused, and a re-show clones afresh, so leaving them bound only
          // accumulates work (#1954).
          //
          // Everything between the placeholder and the end marker goes, not
          // just the clones: a nested :for or :if renders siblings of its own
          // that no clone list contains (#1955).
          // Only walk the range when THIS binding inserted the content and
          // left its marker. Without that guard the walk ran to the end of the
          // parent and took a sibling <template :if> with it -- the initial
          // server-rendered state has no marker to stop at.
          if (endMarker && endMarker.parentNode === parent) {
            var leaving = [];
            for (var cursor = placeholder.nextSibling; cursor && cursor !== endMarker; cursor = cursor.nextSibling) leaving.push(cursor);
            suspendSubtreeScopes(leaving);
            var doomed = placeholder.nextSibling;
            while (doomed && doomed !== endMarker) {
              var nextDoomed = doomed.nextSibling;
              disposeSubtreeEffects(doomed);
              stxHost.remove(doomed);
              doomed = nextDoomed;
            }
            stxHost.remove(endMarker);
          }
          suspendSubtreeScopes(currentNodes.filter(node => node.parentNode));
          currentNodes.forEach(node => { disposeSubtreeEffects(node); stxHost.remove(node); });
          currentNodes = [];
          isInserted = false;
          childrenProcessed = false;
        }
        else if (value && isInserted && !childrenProcessed) {
          // Initial template content is cloned before the effect runs. Process
          // it after the condition is confirmed so hidden branches stay inert.
          // Keep hydration synchronous so the outer scope walk cannot bind
          // caller-owned slot expressions first, while peek() prevents child
          // reads from subscribing to this conditional effect.
          childrenProcessed = true;
          peek(function() {
            if (isInserted) processTemplateNodes(currentNodes);
          });
        }
      }
else {
        // Native hosts keep a view hierarchy rather than a DOM subtree. Route
        // the conditional through the same visibility contract as :show so a
        // false branch is hidden in the first render and in every loop row;
        // the structural remove/insert below still preserves browser and
        // native lifecycle behaviour when the branch changes.
        if (stxHost.isNative) stxHost.setVisible(el, !!value);
        if (value && !isInserted) {
          console.log('[stx] bindIf INSERTING element for :if=' + expr);
          const insertionAnchor = placeholder.nextSibling;
          currentNodes.forEach(node => stxHost.insert(parent, node, insertionAnchor));
          if (parent && parent.__stx_detached_if) currentNodes.forEach(node => parent.__stx_detached_if.delete(node));
          el.__stx_if_visible.set(true);
          el.__stx_shown_at = performance.now();
          isInserted = true;
          // A previously hydrated parent skips hydrateShownBranch on re-show.
          // Its children may have become visible while it was detached, so
          // resume their pending bindings now that the subtree is connected.
          peek(resumeDetachedBranches);
          // Shown before, so the components in it mounted and were suspended
          // when it hid. They mount again now -- in a microtask, the same
          // moment their first mount ran, and only if still shown by then.
          if (childrenProcessed) {
            queueMicrotask(function() {
              if (isInserted) peek(function() { resumeSubtreeScopes(currentNodes); });
            });
          }
        }
else if (!value && isInserted) {
          console.log('[stx] bindIf REMOVING element for :if=' + expr, 'el.isConnected:', el.isConnected, 'parent:', parent.tagName);
          el.__stx_if_visible.set(false);
          // Unmounted, not disposed: the components in it release what they
          // hold while their markup is still on the page, and keep their scopes.
          suspendSubtreeScopes(currentNodes);
          // Do NOT disposeSubtreeScopes here. :if is a TOGGLE — the element is
          // re-shown when the condition flips back — not a permanent unmount.
          // A nested data-stx-scope inside this subtree is created once by its
          // setup IIFE at page load and stored in window.stx._scopes; deleting
          // it on hide left re-show unable to recreate it, so nested scoped
          // components under reactive conditionals rendered all branches at
          // once (#1737). Permanent disposal stays in bindFor (item removal)
          // and cleanupContainer (SPA navigation). The double-bind guards make
          // re-show idempotent, so toggling doesn't leak.
          currentNodes.forEach(node => stxHost.remove(node));
          // Detached nodes are out of reach of a DOM walk, so an ancestor row or
          // branch removed while this is hidden could not dispose their effects
          // (#1954). Record them on the parent that keeps the placeholder.
          if (parent) {
            if (!parent.__stx_detached_if) parent.__stx_detached_if = new Set();
            currentNodes.forEach(node => parent.__stx_detached_if.add(node));
          }
          isInserted = false;
          console.log('[stx] bindIf REMOVED, el.isConnected:', el.isConnected);
        }
        // Process the entire subtree when element is visible and not yet processed.
        // peek() keeps child effects from subscribing to this bindIf's tracked
        // signals. Use capturedComponentScope (not global componentScope) so
        // iteration variables from an enclosing for-loop remain in scope.
        // Process the element itself, not just children, so sibling directives
        // on the same element (e.g. text binding alongside if) fire too. The if
        // attribute was already removed, so no recursion.
        //
        // Synchronously when the branch is on the page, as the template and
        // if/else-chain branches already are. This pass used to wait for a
        // timer, so every :if (and each :for inside one) filled in a frame
        // after the rest of the page was bound: a screen opened from a tab bar
        // showed its sections arriving one after another.
        if (value && isInserted && !childrenProcessed) {
          childrenProcessed = true;
          // Until this pass runs, the shown subtree still holds literal {{ }}.
          // Flag it so the hydration audit doesn't report those as a binding
          // miss when the pass is deferred (#1773).
          el.__stx_if_pending = true;
          var hydrateShownBranch = function() {
            // Removed with its row, or hidden again, before this ran. Hydrating
            // a detached element now creates effects nothing will dispose
            // (#1954). Leave it unprocessed so the next show schedules the pass.
            if (!el.isConnected) {
              childrenProcessed = false;
              el.__stx_if_pending = false;
              // Hidden by an ancestor rather than by this condition (a page :if
              // around a component whose own :if queued this pass), the branch
              // comes back without this effect running, and a component shown
              // again kept its :for rows as raw markup.
              var resume = function() {
                if (!isInserted || childrenProcessed) return;
                childrenProcessed = true;
                el.__stx_if_pending = true;
                peek(hydrateShownBranch);
              };
              resume.el = el;
              detachedBranches.add(resume);
              return;
            }
            // A row's heavy branch is an empty element until it is first shown.
            materializeLazyBranch(el);
            var childScope = layerTemplateScopes(globalHelpers, capturedComponentScope, (capturedElementScope || {}));
            // A false single-element conditional is detached before the
            // DOMContentLoaded component-scope pass. When it becomes visible,
            // hydrate any component roots in the restored subtree first so
            // projected slot bindings and component-local directives receive
            // the same lifecycle as components inserted by template :if.
            var wasTrackedBeforeConditionalHydration = !!el.__stx_disposers;
            hydrateComponentScopes(currentNodes, childScope);
            // Tracked on its own property so an ancestor row or branch removal
            // reaches these effects too (#1954). This runs after the enclosing
            // tracker has closed, so nothing else would collect them.
            if (wasTrackedBeforeConditionalHydration || !el.__stx_disposers)
              el.__stx_if_disposers = trackEffects(function() { processElement(el, childScope); });
            // Remove x-cloak from the inserted subtree — the initial
            // cloak removal (after processElement on the root) already
            // ran before this deferred processing, so newly-inserted
            // :if children still have x-cloak and stay hidden.
            el.removeAttribute('x-cloak');
            el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
            // Deferred bind complete — the audit may inspect this subtree now.
            el.__stx_if_pending = false;
            // Branches inside this one that were hidden with it can bind now.
            resumeDetachedBranches();
          };
          // In a microtask, not inside this effect's own run: child effects
          // created while it is running saw the data mid-change (a screen
          // swapping workouts) and recorded expressions that had never
          // evaluated. A microtask still runs before the browser paints, so
          // the branch is bound in the first frame all the same. A branch
          // shown while detached (inside content not on the page yet) waits a
          // macrotask, when it has been placed.
          if (el.isConnected) {
            // A native host sends the insertion as soon as its current
            // mutation turn ends. Hydrating in a later microtask would put the
            // handler registration in a second batch, leaving a same-turn tap
            // with the source expression instead of a native handler id.
            if (stxHost.isNative) peek(hydrateShownBranch);
            else queueMicrotask(function() { peek(hydrateShownBranch); });
          }
          else setTimeout(hydrateShownBranch, 0);
        }
      }
    });
  }
`
