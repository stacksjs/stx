/** Post-hydration diagnostics used by the generated client runtime. */
export const SIGNALS_HYDRATION_AUDIT_RUNTIME = `  // ==========================================================================
  // Post-hydration invariant sweep (stacksjs/stx#1773)
  // ==========================================================================
  //
  // Preserved moustaches are the framework's de-facto error UI: ANY failure in
  // the detect → extract → bundle → ship → rebind relay collapses into the same
  // visible symptom, literal {{ }} on screen. Eight separate fixes each patched
  // one site's heuristic, and no invariant anywhere asserted the actual
  // requirement — zero unhydrated scopes after hydration. So every new upstream
  // miss reached users silently and had to be diagnosed from a screenshot.
  //
  // This is that invariant. It runs at the end of both hydration entry points
  // and turns a silent miss into one loud, self-healing event:
  //
  //   - an element carrying data-stx-scope whose id isn't in the registry, or
  //     that hydration reached but never processed, is reported AND processed
  //     with the ambient scope, which is what the walk would have done had the
  //     script arrived. That recovers the D2/D3 shapes (a silent early return
  //     in the walk, a stale __stx_scope guard) rather than merely naming them.
  //   - leftover {{ }} text is reported. Diagnostic only, never auto-fixed:
  //     without a scope there is nothing to interpolate against, and a page may
  //     legitimately print moustaches.
  //
  // Deliberately quiet in the normal case: nothing is logged when the page has
  // no signals at all, and containers that legitimately show template syntax
  // (<pre>, <code>, <template>, <script>, <style>, <textarea>, and anything
  // under [data-stx-ignore]) are skipped.

  var AUDIT_SKIP_TAGS = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TEMPLATE: 1 };

  // Expressions whose evaluation threw a ReferenceError/TypeError and have not
  // since succeeded. evalAttrExpr swallows those two on purpose — a signal may
  // not exist yet on an effect's first pass — which is why a genuinely broken
  // binding produces no diagnostic at all today. The classic case is
  // :if="flag()" where flag is a signal: the auto-unwrap proxy returns the
  // VALUE, calling it throws TypeError, the directive suppresses it, and the
  // element silently stays hidden with no warning anywhere (see CLAUDE.md,
  // "Signals: scripts call, templates don't").
  //
  // Recording rather than warning immediately is what keeps this quiet on
  // working pages: a first-pass failure that later succeeds clears itself, so
  // only expressions still broken when hydration finishes are reported.
  var _exprFailures = {};
  var _exprFailureCount = 0;

  function noteExprFailure(expr, err) {
    if (_exprFailures[expr] !== undefined) return;
    // Bounded: one runaway loop must not grow this without limit.
    if (_exprFailureCount >= 50) return;
    _exprFailureCount++;
    _exprFailures[expr] = (err && err.message) ? err.message : String(err);
  }

  function noteExprSuccess(expr) {
    if (_exprFailures[expr] === undefined) return;
    delete _exprFailures[expr];
    _exprFailureCount--;
  }

  function auditSkipped(node) {
    // Not rendered, not audited. Covers <template> content (a detached
    // DocumentFragment — which some DOM implementations still walk into) and
    // :if branches parked off-document, neither of which the user can see.
    if (node.isConnected === false) return true;
    for (var p = node.parentNode; p; p = p.parentNode) {
      if (p.nodeType === Node.DOCUMENT_FRAGMENT_NODE) return true;
      if (p.nodeType !== Node.ELEMENT_NODE) continue;
      if (AUDIT_SKIP_TAGS[p.tagName]) return true;
      if (p.hasAttribute && p.hasAttribute('data-stx-ignore')) return true;
      // A :if whose deferred child-binding pass hasn't run yet legitimately holds
      // literal {{ }} that binds a macrotask later — not a hydration miss (#1773).
      if (p.__stx_if_pending) return true;
      // A deferred island (client=visible|idle|…) is unhydrated ON PURPOSE until
      // its trigger fires, so its {{ }} legitimately stay literal in the meantime
      // — not a miss (#1746). The stranded-scope pass already skips stx-hydrate;
      // the literal sweep must too.
      if (p.hasAttribute && p.hasAttribute('stx-hydrate') && !p.__stx_hydrated) return true;
    }
    return false;
  }

  // Whether the element is, or sits inside, a structural directive's source that has
  // not bound yet. Binding replaces the source with a marker and a template,
  // so a :for / :if still on an element in the document has yet to run.
  var UNBOUND_STRUCTURE = [':for', '@for', 'x-for', ':if', '@if', 'x-if', ':else-if', '@else-if', 'x-else-if', ':else', '@else', 'x-else'];
  function inUnboundStructure(el) {
    for (var p = el; p && p.nodeType === Node.ELEMENT_NODE; p = p.parentElement) {
      for (var i = 0; i < UNBOUND_STRUCTURE.length; i++) {
        if (p.hasAttribute(UNBOUND_STRUCTURE[i])) return true;
      }
    }
    return false;
  }

  function findLiteralMoustaches(root) {
    var found = [];
    if (!root || typeof document.createTreeWalker !== 'function') return found;
    // Read NodeFilter off window, not the bare global: in a real browser they
    // are the same object, but some DOM implementations used for testing expose
    // it only on window, and a bare reference then throws inside the audit.
    var showText = (window.NodeFilter && window.NodeFilter.SHOW_TEXT) || 4;
    var walker = document.createTreeWalker(root, showText, null);
    var node;
    while ((node = walker.nextNode())) {
      // Browsers expose Text.nodeValue as a string, while lightweight DOM and
      // native embedding shims can preserve an assigned number. Diagnostics
      // must normalize the boundary instead of aborting the entire audit on a
      // missing String#indexOf method.
      var text = node.nodeValue == null ? '' : String(node.nodeValue);
      if (text.indexOf('{{') === -1 || text.indexOf('}}') === -1) continue;
      if (auditSkipped(node)) continue;
      found.push(text.trim().slice(0, 80));
      if (found.length >= 5) break;
    }
    return found;
  }

  // A diagnostic that can break hydration is worse than no diagnostic, so the
  // whole sweep is wrapped and every DOM capability it uses is feature-checked.
  // Minimal document stubs (tests, non-browser embeddings) simply skip it.
  function auditHydration(container, phase) {
    try { auditHydrationUnsafe(container, phase); }
    catch (e) { console.warn('[stx] hydration audit skipped:', e && e.message ? e.message : e); }
  }

  function auditHydrationUnsafe(container, phase) {
    if (!window.stx || !window.stx._scopes) return;
    var root = container && typeof container.querySelectorAll === 'function' ? container : document.body;
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // Unregistered / unprocessed scopes — the unambiguous failure, and the one
    // worth repairing.
    var stranded = [];
    root.querySelectorAll('[data-stx-scope]').forEach(function(el) {
      if (el.__stx_audit_recovered) return;
      // Deferred islands are unhydrated ON PURPOSE until their trigger fires.
      if (el.hasAttribute('stx-hydrate') || el.__stx_hydration_scheduled) return;
      // Inert markup is not a miss: a component inside a :if branch whose
      // deferred pass has not run, or inside a :for / :if source that has not
      // bound, is set up when it does, under its own clone's id. The literal
      // sweep already allowed for the first; recovering the second ran a
      // loop's source against the page's scope.
      if (auditSkipped(el) || inUnboundStructure(el)) return;
      var scopeId = el.getAttribute('data-stx-scope');
      var registered = window.stx._scopes[scopeId];
      if (registered && el.__stx_disposers) return;
      stranded.push({ el: el, id: scopeId, registered: !!registered });
    });

    if (stranded.length) {
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': '
        + stranded.length + ' scope(s) left unhydrated — '
        + stranded.map(function(s) {
          return s.id + (s.registered ? ' (registered, never processed)' : ' (not registered)');
        }).join(', ')
        + '. Recovering with the ambient scope; please report with the page that produced it (stacksjs/stx#1773).',
      );
      stranded.forEach(function(s) {
        // Once per element: a repair that itself fails must not loop on the
        // next navigation.
        s.el.__stx_audit_recovered = true;
        try {
          var vars = s.registered ? window.stx._scopes[s.id] : null;
          if (vars) Object.assign(componentScope, vars);
          s.el.__stx_disposers = trackEffects(function() { processElement(s.el, componentScope); });
          s.el.removeAttribute('x-cloak');
          s.el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
        }
        catch (e) {
          console.error('[stx] hydration recovery failed for scope ' + s.id + ':', e);
        }
      });
    }

    var literals = findLiteralMoustaches(root);
    if (literals.length) {
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': literal {{ }} left in the DOM — '
        + literals.join(' | ')
        + '. An expression did not bind; see stacksjs/stx#1773. Wrap intentional '
        + 'template syntax in <pre>/<code> or [data-stx-ignore] to exclude it.',
      );
    }

    // Expressions that threw and never recovered. Reported here rather than at
    // throw time so a first-pass miss that later resolves stays silent.
    var brokenExprs = [];
    for (var expr in _exprFailures) {
      if (Object.prototype.hasOwnProperty.call(_exprFailures, expr))
        brokenExprs.push(expr + ' → ' + _exprFailures[expr]);
    }
    if (brokenExprs.length) {
      var hint = brokenExprs.some(function(m) { return m.indexOf('is not a function') !== -1; })
        ? ' If one of these calls a signal, drop the parentheses: templates read '
          + 'a signal by bare name (:if="flag"), scripts call it (flag()). Calling '
          + 'the unwrapped value is a TypeError, which directives suppress — the '
          + 'element just stays hidden.'
        : '';
      console.error(
        '[stx] hydration invariant failed after ' + phase + ': '
        + brokenExprs.length + ' expression(s) never evaluated — '
        + brokenExprs.slice(0, 5).join(' | ') + '.' + hint,
      );
      _exprFailures = {};
      _exprFailureCount = 0;
    }
  }
`
