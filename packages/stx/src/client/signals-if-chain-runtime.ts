/** Reactive if/else-if/else chain binding for the generated client runtime. */
export const SIGNALS_IF_CHAIN_RUNTIME = `  // Reactive if/else-if/else chain. A single effect drives mutual exclusion:
  // on each run it picks the first branch whose condition is truthy (the
  // trailing x-else always matches), inserts that branch, and removes
  // whichever branch was previously shown. One effect for the whole chain
  // means branches can't transiently both render or both vanish in a tick,
  // and a single source signal isn't subscribed N times. See #1734.
  function bindIfChain(chain, passedScope = componentScope) {
    var head = chain[0].el;
    if (head.__stx_if_bound) { console.log('[stx] bindIfChain SKIPPED (head already bound):', head.tagName, chain.map(function(c) { return c.attr; }).join(',')); return; }
    console.log('[stx] bindIfChain entry:', head.tagName, 'branches:', chain.map(function(c) { return c.attr; }).join(','));

    var parent = head.parentNode;
    if (!parent) { console.warn('[STX] bindIfChain: head element has no parent, skipping'); return; }

    var capturedComponentScope = layerTemplateScopes(passedScope);

    // Detach every branch up-front, leaving a positional placeholder comment
    // so reinsertion preserves source order. Mark each as a chain member so
    // the parent's snapshot child-iteration skips the detached (non-active)
    // branches instead of bringing their content to life. The active branch
    // is re-inserted below and IS connected, so it processes normally.
    chain.forEach(function(b) {
      preserveConditionalComponentScopes(b.el, capturedComponentScope);
      b.el.__stx_if_bound = true;
      b.el.__stx_chain_member = true;
      b.el.__stx_chain_active = false;
      b.el.__stx_if_visible = state(false);
      b.capturedElementScope = findElementScope(b.el);
      b.placeholder = stxHost.anchor('stx-if-chain');
      stxHost.insert(parent, b.placeholder, b.el);
      b.el.removeAttribute(b.attr);
      // A <template> branch (the wrapper convertSignalDirectivesToAttributes
      // emits for a multi-child / text branch) is INERT — inserting the element
      // renders nothing, its content lives in a document fragment. Clone that
      // content ONCE into a stable node set we toggle in and out, exactly as
      // bindIf/bindFor already do for template elements. An element branch is
      // its own single node. Without this, a multi-element @else / @else-if
      // branch rendered blank the moment the markup was well-formed enough to
      // survive as a real <template> (the #1784 markup fix). See #1784.
      b.isTemplate = b.el.tagName === 'TEMPLATE';
      // A template branch renders CLONES, re-cloned on every show, and marks
      // where they end -- the same contract the single-template :if got in
      // #1955. Its content was cloned once here and that one node set was
      // toggled in and out, which broke two ways as soon as the branch held a
      // structural directive: a :for inside it replaces its own source element
      // with a placeholder comment and renders rows as SIBLINGS, so hiding
      // removed neither (the rows were never in this list, and the source node
      // it did hold was already detached, so the parentNode guard skipped it)
      // and both branches stayed on screen at once. Re-showing then re-inserted
      // that source element, painting the literal text of its interpolations.
      // An element branch still owns exactly the node it was bound to: whatever
      // a directive inside it renders is inside that element.
      // Snapshot the content BEFORE anything processes it, and clone each show
      // from the snapshot rather than from the live template. A nested :for
      // does not leave content pristine -- processing moves its row source out
      // and the attributes it consumed (x-model, :id) do not come back -- so a
      // second clone taken from the element would arrive already stripped, with
      // no binding and no way to acquire one.
      b.pristine = b.isTemplate ? stxHost.clone(b.el.content) : null;
      b.nodes = b.isTemplate ? [] : [b.el];
      b.endMarker = null;
      stxHost.remove(b.el);
      b.childrenProcessed = false;
    });

    // Per-branch evaluator. Evaluated inside the chain effect via with()
    // (like evalLazy) so ONLY the signals the expression actually references
    // register as dependencies — not every signal in scope. The old form
    // (new Function(...Object.keys(scope)) called with ...Object.values of
    // the unwrap proxy) read every scope value through the proxy to build the
    // positional args, subscribing the effect to ALL scope signals, so it
    // re-ran on every unrelated mutation (#1738). with() only triggers the
    // proxy's get-trap for identifiers the expression names.
    //
    // Two passes, same as bindIf (#1733): proxy pass first (so bare-ref
    // comparisons like count === 0 read the signal as a value), raw-scope
    // retry second (so call-syntax like count() === 0 works — the proxy
    // would have unwrapped count to a value, making count() throw).
    function evalBranch(b) {
      var expression = b.expr;
      if (/^__[A-Z_]+__$/.test(expression.trim())) return expression;
      var scope = layerTemplateScopes(globalHelpers, capturedComponentScope, (b.capturedElementScope || {}));
      try {
        var unwrapScope = createExpressionAutoUnwrapProxy(scope, expression);
        // Compiled over the names the expression mentions (see __stxCompileScoped).
        var fn = __stxCompileScoped(unwrapScope, [], 'return ' + expression + '');
        return fn(...__stxArgs(fn, unwrapScope));
      }
catch (e1) {
        try {
          var fn2 = __stxCompileScoped(scope, [], 'return ' + expression + '');
          return fn2(...__stxArgs(fn2, scope));
        }
catch (e2) {
          reportUnknownBinding(e2, expression, scope, b.el);
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expression, e2);
          return '';
        }
      }
    }

    var currentIdx = -1;

    effect(function() {
      // Evaluate EVERY branch's condition each run (not for-break) so the
      // reactive tracker registers dependencies on exactly the signals the
      // branch expressions reference — and on ALL of them, so a transition
      // from a later branch back to an earlier one still re-fires. Then pick
      // the first truthy branch (terminal x-else always matches).
      //
      // Pre-fix (#1738) this used a for-break picker, which only subscribed
      // to signals up to the first truthy branch; to stay correct it then
      // eagerly read EVERY signal in scope — a sledgehammer that re-ran this
      // effect on every unrelated signal mutation in the scope (50+ no-op
      // runs per page load on real apps). Evaluating all branches subscribes
      // narrowly to just the branch signals instead.
      var pickedIdx = -1;
      for (var i = 0; i < chain.length; i++) {
        var b = chain[i];
        var matched = b.terminal ? true : !!evalBranch(b);
        if (matched && pickedIdx === -1) pickedIdx = i;
      }

      console.log('[stx] bindIfChain pick:', pickedIdx, 'of', chain.length, '(', pickedIdx >= 0 ? chain[pickedIdx].attr : 'none', ') prev:', currentIdx);
      if (__stxDevtoolsTracking) {
        var __ifScope = null;
        try { __ifScope = stxHost.scopeOf(head); } catch (e) { __ifScope = null; }
        __stxDevtoolsRecordIf({
          scopeId: __ifScope ? __ifScope.getAttribute('data-stx-scope') : null,
          branches: chain.map(function(c) { return c.attr; }),
          picked: pickedIdx,
          pickedAttr: pickedIdx >= 0 ? chain[pickedIdx].attr : null,
          prev: currentIdx
        });
      }
      if (pickedIdx === currentIdx) return;

      // Remove the previously-shown branch. Do NOT disposeSubtreeScopes here:
      // a chain branch is a TOGGLE (re-shown when its condition matches again),
      // not a permanent unmount, and a nested data-stx-scope inside it can't be
      // recreated once deleted from window.stx._scopes (its setup IIFE ran
      // once at page load). Deleting it broke re-show of nested scoped
      // components under reactive conditionals (#1737). Permanent disposal is
      // still handled by bindFor (item removal) and cleanupContainer (SPA nav).
      if (currentIdx !== -1) {
        var gone = chain[currentIdx];
        gone.el.__stx_chain_active = false;
        gone.el.__stx_if_visible.set(false);
        // Unmount what the branch held, as a single :if does, before any of
        // it leaves the page.
        var leavingNodes = gone.nodes.filter(function (n) { return n.parentNode; });
        if (gone.isTemplate && gone.endMarker && gone.endMarker.parentNode) {
          leavingNodes = [];
          for (var walk = gone.placeholder.nextSibling; walk && walk !== gone.endMarker; walk = walk.nextSibling) leavingNodes.push(walk);
        }
        suspendSubtreeScopes(leavingNodes);

        if (gone.isTemplate) {
          // Everything this branch rendered goes, not just the clones it owns:
          // a nested :for or :if renders siblings of its own that no clone list
          // contains. The marker bounds the range, so a sibling that belongs to
          // a later branch or to ordinary markup is never touched.
          if (gone.endMarker && gone.endMarker.parentNode) {
            var doomed = gone.placeholder.nextSibling;
            while (doomed && doomed !== gone.endMarker) {
              var nextDoomed = doomed.nextSibling;
              disposeSubtreeEffects(doomed);
              stxHost.remove(doomed);
              doomed = nextDoomed;
            }
            stxHost.remove(gone.endMarker);
            gone.endMarker = null;
          }
          gone.nodes.forEach(function (n) {
            if (!n.parentNode) return;
            disposeSubtreeEffects(n);
            stxHost.remove(n);
          });
          // The next show clones afresh and processes again, so these effects
          // are finished with; leaving them bound only accumulates work (#1954).
          if (typeof gone.el.__stx_chain_disposers === 'function') {
            try { gone.el.__stx_chain_disposers(); }
catch (e) { /* a disposer of its own is not this branch's problem */ }
            gone.el.__stx_chain_disposers = null;
          }
          gone.nodes = [];
          gone.childrenProcessed = false;
        }
        else {
          gone.nodes.forEach(function (n) {
            if (!n.parentNode) return;
            // Detached nodes are out of reach of a DOM walk, so a row removed
            // while this branch is hidden could not dispose the effects it was
            // processed with (#1954). Same registry the single-element :if uses.
            var parentEl = n.parentNode;
            if (!parentEl.__stx_detached_if) parentEl.__stx_detached_if = new Set();
            parentEl.__stx_detached_if.add(n);
            stxHost.remove(n);
          });
        }
      }

      // Insert + process the newly-picked branch.
      if (pickedIdx !== -1) {
        var pick = chain[pickedIdx];
        pick.el.__stx_chain_active = true;
        // Insert this branch's node(s) before the placeholder's next sibling.
        // The anchor is captured once so the nodes stack in source order.
        var anchor = pick.placeholder.nextSibling;
        var pickHost = pick.placeholder.parentNode;
        if (pick.isTemplate && pick.nodes.length === 0)
          pick.nodes = Array.prototype.slice.call(stxHost.clone(pick.pristine).childNodes);
        // Connecting setup scripts must not make child state a chain dependency.
        peek(function () {
          pick.nodes.forEach(function (n) {
            if (pickHost.__stx_detached_if) pickHost.__stx_detached_if.delete(n);
            stxHost.insert(pickHost, n, anchor);
          });
        });
        pick.el.__stx_if_visible.set(true);
        // Bound AFTER the clones, so hiding can remove whatever a structural
        // directive inside the branch renders as their sibling.
        if (pick.isTemplate) {
          if (!pick.endMarker) pick.endMarker = stxHost.anchor('stx-if-chain-end');
          stxHost.insert(pickHost, pick.endMarker, anchor);
        }
        pick.el.__stx_shown_at = performance.now();
        // An element branch shown before keeps its bindings and its scopes;
        // the components in it mount again (a template branch is cloned afresh
        // and mounts through hydrateComponentScopes below).
        if (pick.childrenProcessed) {
          var shownNodes = pick.nodes;
          queueMicrotask(function () {
            if (pick.el.__stx_chain_active) peek(function () { resumeSubtreeScopes(shownNodes); });
          });
        }
        if (!pick.childrenProcessed) {
          pick.childrenProcessed = true;
          // Hydrate before the outer scope walk can see the inserted branch.
          // Chromium executes scripts cloned from template.content as soon as
          // they are connected, so deferring this pass allowed the global walk
          // to process projected slot expressions without the loop caller
          // scope. peek() keeps this synchronous pass from subscribing child
          // reads to the current chain effect.
          // Tracked on the branch element: this runs inside the chain effect,
          // where no tracker is active, so without a handle the effects of a
          // branch picked after render survive their row's removal (#1954).
          pick.el.__stx_chain_disposers = trackEffects(function () {
          peek(function () {
            var childScope = layerTemplateScopes(globalHelpers, capturedComponentScope, (pick.capturedElementScope || {}));
            // Components compiled inside any branch of an if/else-if/else
            // chain carry scoped setup scripts with them. Branch nodes are
            // detached before those scripts can execute, so simply
            // re-inserting the selected branch leaves component props,
            // events, directives, and projected slot expressions inert.
            // Hydrate those scopes before the normal subtree walk, matching
            // the single-template :if and :for insertion paths.
            var previouslyTrackedNodes = new Set();
            pick.nodes.forEach(function (n) {
              if (n && n.__stx_disposers) previouslyTrackedNodes.add(n);
            });
            hydrateComponentScopes(pick.nodes, childScope);
            pick.nodes.forEach(function (n) {
              if (n.nodeType !== 1) return; // whitespace/text between template children
              // A scoped component receives its disposer in the outer scope
              // walk immediately after processElement returns from binding
              // this conditional. That first pass intentionally stops at
              // :if, so a disposer does not mean its children were hydrated.
              if (previouslyTrackedNodes.has(n) || !n.__stx_disposers)
                processElement(n, childScope);
              n.removeAttribute('x-cloak');
              n.querySelectorAll('[x-cloak]').forEach(function (c) { c.removeAttribute('x-cloak'); });
            });
            resumeDetachedBranches();
          });
          });
        }
      }

      currentIdx = pickedIdx;
    });
  }

  // Shown branches whose deferred bind found them off the page: an enclosing
  // :if, bound later in the same pass, hid them between the queue and the run.
  // Their own condition has not changed, so their effect never runs again to
  // retry; each resumes here when an enclosing branch puts it back.`
