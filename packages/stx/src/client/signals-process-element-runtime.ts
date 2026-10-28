export function signalsProcessElementRuntime(
  directiveNamesLiteral: string,
  eventRegexLiteral: string,
  handledXAttrsLiteral: string,
): string {
  return `  // skipChildren: this element's bindings only, because something else already
  // knows where the rest are. The manifest path passes it for every entry, so
  // the tree is never walked; see processFromManifest.
  function processElement(el, scope = componentScope, skipChildren) {
    // Lazy hydration: if this element has stx-hydrate and hasn't been hydrated
    // yet, defer its subtree processing until the trigger fires.
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated) {
      var trigger = el.getAttribute('stx-hydrate') || 'idle';
      deferHydration(el, trigger, scope);
      return;
    }
    if (el.nodeType === Node.ELEMENT_NODE
      && el.hasAttribute
      && el.hasAttribute('data-stx-scope')
      && hasPendingAncestorLoopBoundary(el)) {
      preserveDeferredParentComponentProps(el);
      // Even when the component is itself a loop root, an ancestor loop must
      // create its caller item scope first. The ancestor's bindFor pass will
      // clone and hydrate this component with that scope, then its own loop can
      // evaluate expressions such as group.resources.
      return;
    }

    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute
      && el.hasAttribute('data-stx-scope') && !hasPendingLoopBoundary(el)) {
      // A page walk can reach a component before the dedicated scope pass.
      // Resolve its caller before props/events bind and their guards latch.
      el.__stx_parent_scope = el.__stx_parent_scope || resolveComponentCallerScope(el, scope);
      bindParentComponentProps(el, el.__stx_parent_scope);
    }
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute) {
      // x-data elements: the reactive bridge has registered their scope into window.stx._scopes.
      // Merge that scope into the processing scope and continue — we handle all directives.
      // Server renames x-data → data-stx-xdata, so check both.
      if (el.hasAttribute('x-data') || el.hasAttribute('data-stx-xdata') || el.__stx_scope) {
        var xdScope = el.__stx_scope || (findElementScope(el) || {});
        if (xdScope && Object.keys(xdScope).length > 0) {
          scope = mergeTemplateScopes(scope, xdScope);
        }
      }
      // v-memo / @memo — skip re-processing if dependency values haven't changed
      if (el.hasAttribute('data-stx-memo')) {
        var memoExpr = el.getAttribute('data-stx-memo');
        try {
          var memoScope = mergeTemplateScopes(globalHelpers, scope, (findElementScope(el) || {}));
          var memoFn = __stxCompileScoped(memoScope, [], 'return ' + memoExpr);
          var memoVals = JSON.stringify(memoFn(...__stxArgs(memoFn, memoScope)));
          if (el.__stx_memo_prev === memoVals) {
            return; // Dependencies unchanged — skip re-processing
          }
          el.__stx_memo_prev = memoVals;
        } catch(e) {}
      }
    }
    // Normalize a signal returned by an interpolation expression before the
    // DOM coerces it to text. The proxy handles ordinary signal references,
    // but a helper or pipe can return the signal function itself.
    const maybeUnwrapSignal = (v) => {
      if (v && typeof v === 'function' && (v._isSignal || v._isDerived)) return v();
      return v;
    };
    if (el.nodeType === Node.TEXT_NODE) {
      // DOM textContent is specified as a string, but lightweight DOM
      // implementations and user-created nodes can retain a numeric value
      // assigned by a binding. Normalize before interpolation detection.
      const text = el.textContent == null ? '' : String(el.textContent);
      if (text && text.includes('{{')) {
        const parts = text.split(/(\\{\\{[\\s\\S]+?\\}\\})/g);
        if (parts.length > 1) {
          const fragment = document.createDocumentFragment();
          const parentEl = el.parentNode;
          // Capture scope NOW before effects run asynchronously
          // Use the passed scope parameter (not global componentScope) to preserve context
          // through nested @if/@for processing where componentScope may be restored
          const capturedScope = el.__stx_slot_scope || mergeTemplateScopes(globalHelpers, scope, (findElementScope(parentEl) || {}));
          parts.forEach(part => {
            const match = part.match(/^\\{\\{\\s*([\\s\\S]+?)\\s*\\}\\}$/);
            if (match) {
              const expr = match[1];
              // Skip placeholder expressions like __TITLE__ (build-time placeholders)
              if (/^__[A-Z_]+__$/.test(expr.trim())) {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              // Native text-only elements cannot contain the span wrapper used
              // for general interpolation. Bind a text node there so options,
              // titles, and textareas retain valid DOM and accessible labels.
              const isTextOnlyParent = parentEl
                && (parentEl.tagName === 'OPTION' || parentEl.tagName === 'TITLE' || parentEl.tagName === 'TEXTAREA');
              const bindingNode = isTextOnlyParent
                ? document.createTextNode('')
                : document.createElement('span');
              fragment.appendChild(bindingNode);
              // Use captured scope, not dynamic lookup
              effect(() => {
                try {
                  // Check for pipe syntax (Feature #2)
                  const pipeResult = parsePipeExpression(expr, capturedScope);
                  if (pipeResult) {
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    bindingNode.textContent = maybeUnwrapSignal(
                      executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope),
                    );
                  }
else {
                    // Use auto-unwrap proxy (Feature #1)
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    const fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
                    bindingNode.textContent = maybeUnwrapSignal(fn(...__stxArgs(fn, unwrapScope)));
                  }
                }
catch (e) {
                  // Auto-unwrap can break explicit signal calls like errorData().message
                  // because it converts the signal to its value before the expression runs.
                  // Retry without auto-unwrap so signal functions remain callable.
                  try {
                    const fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
                    bindingNode.textContent = maybeUnwrapSignal(fn(...__stxArgs(fn, capturedScope)));
                  }
catch (e2) {
                    reportUnknownBinding(e2, expr, capturedScope, parentEl);
                    if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expr, e2);
                    bindingNode.textContent = '';
                  }
                }
              });
            }
else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          el.replaceWith(fragment);
        }
      }
      return;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) return;
    if (isForeignToLoopRow(el, scope)) return;

    // <stx-link> handling removed — StxLink builtin now produces <a> directly
    // with data-stx-link attribute. The router handles SPA click interception.

    // <Suspense> boundary — coordinate descendant suspense queries (#1742).
    if (el.hasAttribute('data-stx-suspense') && !el.__stx_suspense_bound) {
      bindSuspense(el, scope);
      // bindSuspense processes the content subtree itself; don't double-process.
      return;
    }

    // Handle @for / :for / x-for first (reactive list)
    var hasColonForLoop = el.hasAttribute(':for') && isForDirectiveExpression(el.getAttribute(':for'));
    if (el.hasAttribute('@for') || hasColonForLoop || el.hasAttribute('x-for')) {
      var forAttr = hasColonForLoop ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for';
      bindFor(el, scope, forAttr);
      return;
    }

    // x-else / x-else-if are owned by their preceding x-if chain (#1734).
    // An inactive chain member reached via the parent's snapshot child-
    // iteration must be skipped. Connectivity cannot identify inactivity:
    // an active inner branch is also disconnected while an outer conditional
    // temporarily detaches its parent. bindIfChain owns explicit branch state
    // so nested structural effects can still hydrate active detached subtrees.
    if (el.__stx_chain_member && !el.__stx_chain_active) return;

    // An else/else-if with no preceding if is an orphan. Match Vue: warn,
    // strip the attribute, and render it as a plain element (fall through).
    if (!el.__stx_chain_member) {
      var orphanElse = getElseAttrInfo(el);
      if (orphanElse) {
        console.warn('[STX] ' + orphanElse.name + ' has no matching preceding x-if/:if/@if sibling; rendering as a plain element.');
        el.removeAttribute(orphanElse.name);
      }
    }

    // Handle @if / :if / x-if (conditional rendering)
    if (el.hasAttribute('@if') || el.hasAttribute(':if') || el.hasAttribute('x-if')) {
      var ifAttr = el.hasAttribute(':if') ? ':if' : el.hasAttribute('x-if') ? 'x-if' : '@if';

      // If else/else-if siblings follow, drive the whole chain with one
      // mutually-exclusive effect; otherwise the single-element fast path.
      var ifChain = findIfChain(el, ifAttr);
      console.log('[stx] :if dispatch on', el.tagName, ifAttr + '="' + el.getAttribute(ifAttr) + '"', 'chainLen:', ifChain.length, 'branches:', ifChain.map(function(c) { return c.attr; }).join(','));
      if (ifChain.length > 1) bindIfChain(ifChain, scope);
      else bindIf(el, scope, ifAttr);
      return;
    }

    // Handle @show / :show / x-show (visibility toggle - keeps element in DOM)
    var isNativeModal = el.tagName === 'MODAL';
    if ((el.hasAttribute('@show') && !isNativeModal)
      || el.hasAttribute(':show') || el.hasAttribute('x-show')) {
      var showAttr = el.hasAttribute(':show') ? ':show' : el.hasAttribute('x-show') ? 'x-show' : '@show';
      bindShow(el, el.getAttribute(showAttr), scope, showAttr);
    }

    // Handle @model / :model / x-model (two-way binding)
    var modelBinding = getModelBinding(el);
    if (modelBinding) {
      bindModel(el, modelBinding.expression, scope, modelBinding.name);
    }

    // Capture scope once for all attribute bindings on this element
    // Use the passed scope parameter to preserve context through nested processing
    const attrCapturedScope = mergeTemplateScopes(globalHelpers, scope, (findElementScope(el) || {}));

    // Keep the conditional owners captured while the element is in the tree.
    // Walking parents on each update loses an outer owner when an inner :if
    // detaches its own root. These signals suspend writes while either owner
    // is hidden and refresh the latest value AFTER reinsertion, even when the
    // attribute's source did not change on that show.
    const attrVisibility = [];
    for (var attrAncestor = el; attrAncestor; attrAncestor = attrAncestor.parentNode) {
      if (attrAncestor.__stx_if_visible) attrVisibility.push(attrAncestor.__stx_if_visible);
    }
    function attributesVisible() {
      return attrVisibility.every(function(visible) { return visible(); });
    }

    // Post-eval unwrap: if the expression result is a signal function (e.g.
    // step was resolved via identifier lookup, not via the auto-unwrap
    // proxy — happens when a client script declares const step = state(...)
    // at script-realm scope, making it accessible to new Function but not
    // appearing in the Proxy Object.keys), call it to get the value.
    // Without this, :text="step" sets textContent to the stringified
    // signal function instead of the value.
    const evalAttrExpr = (rawExpr, evaluationScope) => {
      const activeScope = evaluationScope || attrCapturedScope;
      // Decode HTML entities that browsers may encode in attribute values
      // e.g. :text="a > b" may be stored as :text="a &gt; b" in HTML
      var expr = rawExpr.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'");
      try {
        if (/^__[A-Z_]+__$/.test(expr.trim())) return expr;

        // Check for pipe syntax (Feature #2)
        const pipeResult = parsePipeExpression(expr, activeScope);
        if (pipeResult) {
          const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
          var piped = maybeUnwrapSignal(executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope));
          noteExprSuccess(expr);
          return piped;
        }

        // Use auto-unwrap proxy (Feature #1)
        const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
        const fn = __stxCompileScoped(unwrapScope, [], 'return (' + expr + ')');
        var value = maybeUnwrapSignal(fn(...__stxArgs(fn, unwrapScope)));
        noteExprSuccess(expr);
        return value;
      }
catch (e) {
        // Auto-unwrap can break explicit signal calls like errorData().message
        // Retry without auto-unwrap so signal functions remain callable
        try {
          const fn = __stxCompileScoped(activeScope, [], 'return (' + expr + ')');
          var retried = maybeUnwrapSignal(fn(...__stxArgs(fn, activeScope)));
          noteExprSuccess(expr);
          return retried;
        }
catch (e2) {
          reportUnknownBinding(e2, expr, activeScope, el);
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Attribute expression error:', expr, e2);
          // ReferenceError/TypeError stay unlogged HERE on purpose: a signal
          // may not exist yet on an effect's first pass, and warning on every
          // one of those trains people to ignore the console. Instead the
          // failure is recorded and cleared the moment the same expression
          // evaluates successfully, so only expressions that are STILL broken
          // when hydration finishes get reported — by the audit (#1773).
          else noteExprFailure(expr, e2);
          return '';
        }
      }
    };

    // Known directive names to exclude from generic :attr binding
    var DIRECTIVE_NAMES = ${directiveNamesLiteral};

    // A bound value cannot introduce a URL scheme the page did not ask for.
    // This is the client half of url-safety.ts: the server refuses a scheme
    // substituted into an href, and x-href over a signal reaches the same
    // attribute by another road. Same policy, same unsafe: prefix, so a page
    // behaves the same whether the value arrived at render or at runtime.
    var URL_NAV_ATTR = {href:1, 'xlink:href':1, action:1, formaction:1, ping:1, cite:1, manifest:1, data:1, to:1};
    var URL_FETCH_ATTR = {src:1, srcset:1, poster:1, background:1};
    var urlRefusalWarned = false;
    function safeUrlAttr(attrName, value) {
      var navigable = URL_NAV_ATTR[attrName];
      if (!navigable && !URL_FETCH_ATTR[attrName]) return value;
      if (typeof value !== 'string' || !value) return value;
      // Browsers ignore ASCII whitespace and controls inside a scheme and match
      // it case-insensitively, so the spellings collapse before the test.
      var probe = value.replace(/[\\u0000-\\u0020\\u00a0\\u2000-\\u200f\\u2028\\u2029\\ufeff]+/g, '').toLowerCase();
      var refused = /^(?:javascript|vbscript|livescript|mocha|view-source):/.test(probe)
        || (navigable
          ? /^data:(?:text\\/html|text\\/xml|application\\/xhtml\\+xml|application\\/xml|image\\/svg\\+xml)/.test(probe)
          : /^data:(?:text\\/html|application\\/xhtml\\+xml)/.test(probe));
      if (!refused) return value;
      if (!urlRefusalWarned) {
        urlRefusalWarned = true;
        console.warn('[stx] refused a ' + attrName + ' value whose scheme can run script: ' + probe.slice(0, 24));
      }
      return 'unsafe:' + value;
    }
    // SVG attributes are case-sensitive, but the HTML parser lowercases
    // prefixed attribute names — ':viewBox' arrives as ':viewbox' because
    // the spec's "adjust SVG attributes" step only covers unprefixed names.
    // Without restoring the canonical casing, setAttribute('viewbox') creates
    // a dead duplicate attribute and the real viewBox never updates.
    var SVG_ATTR_CASE = {attributename:'attributeName', attributetype:'attributeType', basefrequency:'baseFrequency', baseprofile:'baseProfile', calcmode:'calcMode', clippathunits:'clipPathUnits', diffuseconstant:'diffuseConstant', edgemode:'edgeMode', filterunits:'filterUnits', glyphref:'glyphRef', gradienttransform:'gradientTransform', gradientunits:'gradientUnits', kernelmatrix:'kernelMatrix', kernelunitlength:'kernelUnitLength', keypoints:'keyPoints', keysplines:'keySplines', keytimes:'keyTimes', lengthadjust:'lengthAdjust', limitingconeangle:'limitingConeAngle', markerheight:'markerHeight', markerunits:'markerUnits', markerwidth:'markerWidth', maskcontentunits:'maskContentUnits', maskunits:'maskUnits', numoctaves:'numOctaves', pathlength:'pathLength', patterncontentunits:'patternContentUnits', patterntransform:'patternTransform', patternunits:'patternUnits', pointsatx:'pointsAtX', pointsaty:'pointsAtY', pointsatz:'pointsAtZ', preservealpha:'preserveAlpha', preserveaspectratio:'preserveAspectRatio', primitiveunits:'primitiveUnits', refx:'refX', refy:'refY', repeatcount:'repeatCount', repeatdur:'repeatDur', requiredextensions:'requiredExtensions', requiredfeatures:'requiredFeatures', specularconstant:'specularConstant', specularexponent:'specularExponent', spreadmethod:'spreadMethod', startoffset:'startOffset', stddeviation:'stdDeviation', stitchtiles:'stitchTiles', surfacescale:'surfaceScale', systemlanguage:'systemLanguage', tablevalues:'tableValues', targetx:'targetX', targety:'targetY', textlength:'textLength', viewbox:'viewBox', viewtarget:'viewTarget', xchannelselector:'xChannelSelector', ychannelselector:'yChannelSelector', zoomandpan:'zoomAndPan'};
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var EVENT_RE = ${eventRegexLiteral};
    var KEY_MAP = {enter:'Enter', tab:'Tab', escape:'Escape', space:' ', up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', 'delete':'Delete', backspace:'Backspace'};

    // Handle attributes
    getElementAttributes(el).forEach(attr => {
      const name = attr.name;
      const value = attr.value;
      if (!name) return;

      /*
       * A doubled colon escapes the prefix, the way a doubled at-sign does in
       * a directive: @@if renders @if, so ::foo renders :foo.
       *
       * It was excluded from the generic attribute path, which is why it was
       * never evaluated as an expression -- but a name beginning with two
       * colons also begins with one, so the event catch-all below claimed it,
       * registered a listener for an event named :foo, and removed the
       * attribute. The author got neither a binding nor their attribute: it
       * disappeared, silently, and nothing took its place.
       *
       * Unescaped here rather than on the server, because an unescaped :foo
       * reaching this pass is indistinguishable from one the author wrote and
       * would be bound as an event. The attributes were snapshotted before
       * this loop, so the one written now is not revisited.
       */
      if (name.startsWith('::')) {
        el.removeAttribute(name);
        el.setAttribute(name.slice(1), value);
        return;
      }

      // Dynamic attribute binding: @bind:attr, x-bind:attr, :attr, OR x-attr
      // x-attr (e.g. x-class, x-style, x-href, x-src) is the canonical binding prefix.
      // :attr still works for backward compat but is reserved for structural directives.
      // x-text, x-html, x-model, x-show, x-if, x-for, x-cloak, x-ref, x-data are
      // handled by their own code paths below — exclude them here.
      var X_HANDLED = ${handledXAttrsLiteral};
      if (name.startsWith('@bind:') || name.startsWith('x-bind:')
          || (name.startsWith(':') && !name.startsWith('::') && !DIRECTIVE_NAMES[name.slice(1).split('.')[0]] && !EVENT_RE.test(name.slice(1)))
          || (name.startsWith('x-') && !X_HANDLED[name.split('.')[0]] && !X_HANDLED[name])) {
        let attrName = name.startsWith('@bind:') ? name.slice(6) : name.startsWith('x-bind:') ? name.slice(7) : name.startsWith('x-') ? name.slice(2) : name.slice(1);
        if (el.namespaceURI === SVG_NS && SVG_ATTR_CASE[attrName]) attrName = SVG_ATTR_CASE[attrName];
        var parentBindingNames = (el.getAttribute && el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/);
        var bindingScope = el.__stx_parent_scope && parentBindingNames.includes(attrName)
          ? el.__stx_parent_scope
          : attrCapturedScope;
        if ((attrName === 'value' || attrName === 'checked') && attrName in el) {
          var modelName = value.trim().match(/^([a-zA-Z_$][\\w$]*)(?:\\(\\))?$/);
          var resetModel = modelName && bindingScope[modelName[1]];
          if (resetModel && resetModel._isSignal && typeof resetModel.set === 'function') {
            bindFormControlReset(el, attrName, resetModel, function(initial) { resetModel.set(initial); });
          }
        }
        effect(() => {
          if (!attributesVisible()) return;
          const v = evalAttrExpr(value, bindingScope);
          // Form control values are live DOM properties. Setting only the HTML
          // attribute does not update a <select>'s chosen option and can leave
          // inputs displaying stale text after a reactive update.
          if (attrName === 'value' && 'value' in el) {
            var controlValue = v;
            if (typeof v === 'object' && v !== null) {
              try { controlValue = JSON.stringify(v); }
              catch (e) { controlValue = String(v); }
            }
            controlValue = v === false || v === null || v === undefined ? '' : String(controlValue);
            el.__stx_bound_value = controlValue;
            var applyControlValue = function() {
              if (!attributesVisible()) return;
              var desiredValue = el.__stx_bound_value == null ? '' : String(el.__stx_bound_value);
              el.value = desiredValue;
              if (desiredValue === '' && el.tagName !== 'OPTION') el.removeAttribute(attrName);
              else if (el.getAttribute(attrName) !== desiredValue) el.setAttribute(attrName, desiredValue);
              if (typeof el.__stx_model_sync === 'function') el.__stx_model_sync();
            };
            applyControlValue();

            // A select's value binding is processed before its child
            // directives. When a nested :for creates the matching options
            // afterward, the browser otherwise leaves the first option
            // selected. Keep the desired value and reapply it whenever the
            // option tree changes, including later reactive list updates.
            if (el.tagName === 'SELECT' && !el.__stx_value_observer && typeof window.MutationObserver !== 'undefined') {
              el.__stx_value_observer = new window.MutationObserver(applyControlValue);
              el.__stx_value_observer.observe(el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value'],
              });
              el.__stx_destroy = el.__stx_destroy || [];
              el.__stx_destroy.push(function() {
                if (el.__stx_value_observer) el.__stx_value_observer.disconnect();
                el.__stx_value_observer = null;
              });
            }
            return;
          }
          // Checked, selected, and indeterminate are live DOM properties, just like value.
          // Updating only the HTML attribute leaves a user-touched checkbox or
          // radio in its previous state because the property becomes dirty.
          // Indeterminate has no corresponding effective HTML attribute at all.
          if ((attrName === 'checked' || attrName === 'selected' || attrName === 'indeterminate') && attrName in el) {
            var selectedState = Boolean(v);
            el[attrName] = selectedState;
            if (attrName === 'indeterminate') {
              el.removeAttribute(attrName);
            }
            else if (selectedState) {
              el.setAttribute(attrName, '');
            }
            else {
              el.removeAttribute(attrName);
            }
            return;
          }
          if (attrName.startsWith('aria-') && typeof v === 'boolean') {
            stxHost.setAttribute(el, attrName, String(v));
          }
          else if (typeof v === 'boolean') {
            stxHost.setAttribute(el, attrName, v);
          }
          else if (v === null || v === undefined) {
            stxHost.removeAttribute(el, attrName);
          }
else {
            var attrValue = v;
            if (typeof v === 'object') {
              try { attrValue = JSON.stringify(v); }
              catch (e) { attrValue = String(v); }
            }
            var attrValueSafe = safeUrlAttr(attrName, attrValue);
            // Keep structured values structured for non-DOM hosts. The DOM
            // host serializes them at its boundary, preserving web output.
            var hostValue = (typeof v === 'object' && v !== null) ? v : attrValueSafe;
            // Writing the value an attribute already has is not nothing: a
            // frame given its own src again loads again (an entry in the
            // page's history each time) and a video restarts. A player whose
            // rest and next set share a video re-set it on every step.
            if (el.getAttribute(attrName) === String(attrValueSafe)) return;
            // A frame already on the page that is pointed somewhere else
            // navigates, and every navigation is an entry in the page's own
            // history: a player showing a video per step left one per step,
            // and Back had to be tapped through all of them before it left
            // the screen. Out of the page and back in, the frame starts afresh
            // (its first load adds no entry, and its old entries go with it).
            var parentNode = el.parentNode;
            if (attrName === 'src' && el.tagName === 'IFRAME' && parentNode && el.isConnected
              && el.hasAttribute('src') && el.getAttribute('src') !== String(attrValueSafe)) {
              var nextSibling = el.nextSibling;
              parentNode.removeChild(el);
              stxHost.setAttribute(el, attrName, hostValue);
              parentNode.insertBefore(el, nextSibling);
            }
            else {
              stxHost.setAttribute(el, attrName, hostValue);
            }
          }
        });
        el.removeAttribute(name);
      }
else if (name === '@class' || name === ':class' || name === 'x-class') {
        bindClass(el, value, scope, attributesVisible);
        el.removeAttribute(name);
      }
else if (name === '@style' || name === ':style' || name === 'x-style') {
        bindStyle(el, value, scope, attributesVisible);
        el.removeAttribute(name);
      }
else if (name === '@text' || name === ':text' || name === 'x-text') {
        effect(() => {
          stxHost.setText(el, evalAttrExpr(value));
        });
        el.removeAttribute(name);
      }
else if (name === '@html' || name === ':html' || name === 'x-html') {
        effect(() => {
          // Coerce null/undefined to '' so a missing/unresolved binding renders
          // nothing rather than the literal string "undefined" (#1767).
          var markup = evalAttrExpr(value) ?? '';
          if (stxHost.isNative && stxHost.setMarkup) stxHost.setMarkup(el, markup);
          else el.innerHTML = markup;
        });
        el.removeAttribute(name);
      }
else if (name === 'ref' || name === ':ref' || name === 'x-ref' || name === 'data-stx-ref') {
        // A page ref can be projected through a component whose own $refs
        // replaced the compatibility scope's map. The compiler retains the
        // receiver boundary so named and signal refs use the same caller.
        var refRoot = stxHost.scopeOf(el);
        var refCaller = el.getAttribute('data-stx-ref-caller');
        var refOwnerScope = findElementScope(el);
        if (refCaller) {
          var receiver = refRoot;
          while (receiver && receiver.getAttribute('data-stx-scope') !== refCaller
            && receiver.getAttribute('data-stx-template-scope') !== refCaller) {
            receiver = stxHost.scopeOf(receiver, true);
          }
          refOwnerScope = receiver && receiver.__stx_parent_scope;
        }
        // Only projected refs may reach outside their component. Caller
        // snapshots exclude unrelated, previously hydrated siblings.
        if (refCaller && refOwnerScope) {
          if (refOwnerScope.$refs) refOwnerScope.$refs[value] = el;
        }
        else {
          // Manifest hydration receives the page scope for each node. A
          // component-local ref still belongs to the node's owning scope.
          if (refOwnerScope && refOwnerScope.$refs) refOwnerScope.$refs[value] = el;
          if (scope.$refs) scope.$refs[value] = el;
          if (componentScope.$refs) componentScope.$refs[value] = el;
        }
        // Also fill a same-named signal declared in the script block, so the
        // documented ref() + x-ref pair works and reading the signal returns
        // the element. Without this the signal stayed empty and every read of
        // it silently returned undefined.
        var refTarget = refCaller && refOwnerScope
          ? refOwnerScope[value]
          : (refOwnerScope && refOwnerScope[value]) || (scope && scope[value]) || componentScope[value];
        if (refTarget && typeof refTarget === 'function' && refTarget._isSignal && typeof refTarget.set === 'function') {
          refTarget.set(el);
        }
      }
      else if (name.startsWith('@') || name.startsWith(':')) {
        // Event handlers: @click, :click, @submit.prevent, :keydown.enter, etc.
        const parts = name.slice(1).split('.');
        // HTML folds attribute names to lowercase; the forwarding metadata
        // retains the declared event spelling (e.g. update:modelValue).
        const parentEventNames = (el.getAttribute && el.getAttribute('data-stx-parent-events') || '').split(/\\s+/);
        const eventName = parentEventNames.find(function(event) {
          return event.toLowerCase() === parts[0].toLowerCase();
        }) || parts[0];
        const modifiers = parts.slice(1);

        // Native Modal uses @show as a lifecycle event. On ordinary elements
        // it remains the visibility directive, so keep that browser behavior.
        const isNativeModalLifecycleEvent = eventName === 'show'
          && el.tagName === 'MODAL';
        // Skip special directives (already handled above or in processElement)
        if (['if', 'for', 'show', 'model', 'class', 'style', 'text', 'html', 'ref'].includes(eventName)
          && !isNativeModalLifecycleEvent) {
          return;
        }

        // Prevent duplicate event binding on the same element
        var eventKey = '__stx_evt_' + eventName + '_' + value.substring(0, 20);
        if (el[eventKey]) { el.removeAttribute(name); return; }
        el[eventKey] = true;

        // Capture scope at setup time so @for loop variables are available when event fires
        const isForwardedComponentEvent = !!(el.__stx_parent_scope && parentEventNames.includes(eventName));
        let eventCapturedScope = isForwardedComponentEvent
          ? mergeTemplateScopes(globalHelpers, el.__stx_parent_scope)
          : mergeTemplateScopes(globalHelpers, scope, (findElementScope(el) || {}));

        stxHost.listen(el, eventName, (event) => {
          // A forwarded handler belongs to the caller, whose scope can be
          // resolved again after this listener is bound: a component inside
          // another component's :if, in a dialog, was bound against the
          // page's scope and only later handed its real caller, so
          // @pick="pickFromBank" found nothing and did nothing. Read it now.
          if (isForwardedComponentEvent && el.__stx_parent_scope)
            eventCapturedScope = mergeTemplateScopes(globalHelpers, el.__stx_parent_scope);
          // Vue-style component listeners fall through to the rendered native
          // root unless the child emits the same event. Signal components use
          // a scope wrapper, so native events arrive here from a descendant.
          // Ignore that native event only after defineEmits() has declared or
          // emitted the same name, preventing submit/click handlers from
          // firing once for the native event and again for the CustomEvent.
          var componentEmits = el.__stx_component_emits;
          if (isForwardedComponentEvent && event.target !== el
            && componentEmits && componentEmits[eventName]) return;

          // Vue-style component handlers receive the emitted payload directly.
          // Native root events still receive the Event object so server-only
          // components can forward clicks and other browser events.
          var emittedArgs = isForwardedComponentEvent && event instanceof CustomEvent
            && Array.isArray(event.__stx_emit_args) ? event.__stx_emit_args : null;
          var handlerEvent = emittedArgs ? emittedArgs[0]
            : isForwardedComponentEvent && event instanceof CustomEvent ? event.detail : event;

          // Skip an opener click that reaches UI which just became visible in
          // this frame. A click whose target is inside the revealed subtree is
          // a real interaction and must not be discarded, especially for
          // async lists whose controls are usable as soon as they render.
          if (eventName === 'click') {
            var ancestor = el;
            while (ancestor) {
              if (ancestor.__stx_shown_at
                && (performance.now() - ancestor.__stx_shown_at) < 50
                && !(ancestor.contains && ancestor.contains(event.target))) return;
              ancestor = ancestor.parentElement;
            }
          }
          // System key modifiers
          if (modifiers.includes('self') && event.target !== el) return;
          if (modifiers.includes('ctrl') && !event.ctrlKey) return;
          if (modifiers.includes('alt') && !event.altKey) return;
          if (modifiers.includes('shift') && !event.shiftKey) return;
          if (modifiers.includes('meta') && !event.metaKey) return;
          // Key modifiers
          for (var mi = 0; mi < modifiers.length; mi++) {
            if (KEY_MAP[modifiers[mi]] && event.key !== KEY_MAP[modifiers[mi]]) return;
          }
          if (modifiers.includes('prevent')) event.preventDefault();
          if (modifiers.includes('stop')) event.stopPropagation();
          // Execute with captured scope (includes @for loop variables)
          // For x-data scopes, expressions like "mobileOpen = !mobileOpen" need to
          // read the signal value AND write back through the signal's setter.
          try {
            if (!value || /^__[A-Z_]+__$/.test(value.trim())) return;
            var shorthandFn = parseEventShorthand(value, eventCapturedScope);
            if (shorthandFn) { shorthandFn.apply(null, emittedArgs || [handlerEvent]); return; }
            // Check if any scope values are signals (x-data pattern)
            // A derived value reads like a signal in a handler, as it does in a
            // binding: \`pick(selectedPackage)\` passes the package. Leaving it
            // out handed the handler the derived's getter function, so
            // \`selectedPackage.trainer_id\` was undefined with nothing said.
            var hasSignals = Object.values(eventCapturedScope).some(function(v) {
              return v && typeof v === 'function' && (v._isSignal || v._isDerived);
            });
            // Only use signal read/write proxy for DIRECT assignment expressions
            // like "count = count + 1" or "open = !open". Function calls like
            // "openModal()" handle their own signal.set() internally — the writeback
            // would RESET signals to their pre-handler values.
            var isDirectAssignment = hasSignals && /^[a-zA-Z_$]\\w*\\s*=/.test(value.trim()) && !value.trim().startsWith('==');
            if (isDirectAssignment) {
              var getVars = Object.keys(eventCapturedScope).map(function(k) {
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && (__s["' + k + '"]._isSignal || __s["' + k + '"]._isDerived) ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var setVars = Object.keys(eventCapturedScope).filter(function(k) {
                var v = eventCapturedScope[k];
                return v && typeof v === 'function' && v._isSignal;
              }).map(function(k) {
                return 'if(' + k + ' !== __s["' + k + '"]()) __s["' + k + '"].set(' + k + ')';
              }).join(';');
              var body = getVars + ';' + value + ';' + setVars;
              var fn2 = __stxCompile(['__s', '$event'], body);
              fn2(eventCapturedScope, handlerEvent);
            } else if (hasSignals) {
              // Function calls with signals in scope keep any signal used through
              // its object API as a raw signal function, and unwrap the rest for
              // primitive reads.
              var unwrapVars = Object.keys(eventCapturedScope).map(function(k) {
                var v = eventCapturedScope[k];
                // A :for item is a signal only as an implementation detail, so
                // that keyed rows can update in place. Its \`.value\` is a field
                // on the item, never the signal compatibility API — the same
                // rule createAutoUnwrapProxy states for binding expressions.
                // Without the carve-out, expressionUsesSignalApi sees
                // \`option.value\` and hands the handler the raw signal, so a
                // handler like \`pick(option.value)\` receives the whole item.
                // It is not an error, so it lands silently: the wrong value is
                // stored and only surfaces much later.
                if (v && typeof v === 'function' && ((v._isSignal && !v._isStxLoopItem) || v._isDerived)
                  && (expressionCallsSignal(value, k) || expressionUsesSignalApi(value, k))) {
                  return 'var ' + k + ' = __s["' + k + '"]';
                }
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && (__s["' + k + '"]._isSignal || __s["' + k + '"]._isDerived) ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var fn3 = __stxCompile(['__s', '$event'], unwrapVars + ';' + value);
              fn3(eventCapturedScope, handlerEvent);
            } else {
              var fn = __stxCompileScoped(eventCapturedScope, ['$event'], value);
              fn(...__stxArgs(fn, eventCapturedScope), handlerEvent);
            }
          }
catch (e) {
            // See #1694: dropping the TypeError/ReferenceError carve-out for inline
            // handlers — same reason as executeHandler above. Silencing these hid
            // the substring-detector bug (auto-unwrap missing .set( inside helper
            // calls) for ~30min of bisecting in the field.
            console.warn('[STX] Handler error:', value, e);
          }
        }, {
          capture: modifiers.includes('capture'),
          // A touch or wheel listener that is not passive holds every scroll
          // starting on the element until this thread has run it. Passive
          // unless .prevent needs preventDefault() or .nonpassive asks.
          passive: modifiers.includes('passive')
            || (/^(touchstart|touchmove|wheel|mousewheel)$/i.test(eventName)
              && !modifiers.includes('prevent') && !modifiers.includes('nonpassive')),
          once: modifiers.includes('once')
        });
        el.removeAttribute(name);
      }
    });

    // Process children (skip script/style elements — their text content is not template markup)
    // Skip elements that are roots of nested stx.mount() components — those have their own scope
    if (!skipChildren && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
      var children = Array.from(el.childNodes);
      children.forEach(function(child) {
        if (child.nodeType !== Node.ELEMENT_NODE) { processElement(child, scope); return; }
        // Skip script elements entirely
        if (child.tagName === 'SCRIPT') return;
        // Skip elements already processed by stx.mount() — they have their own scope and effects
        if (child.__stx_scope) return;
        // Skip data-stx-scope elements — they are managed by the reactive (x-data) runtime
        if (child.hasAttribute && child.hasAttribute('data-stx-scope')) return;
        processElement(child, scope);
      });
    }
  }`
}

