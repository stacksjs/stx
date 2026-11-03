/**
 * Native loop rows built from a plan (native screens only).
 *
 * A `:for` row on a native screen used to be made the way a browser makes
 * one: the whole template cloned (every hidden branch included), every scope
 * id rewritten across every attribute, then processElement walking the copy,
 * reading each attribute to work out again what it was, layering a scope per
 * element and per binding, and compiling each expression on every
 * evaluation. A sidebar row did all of that, the same way, forty times, and an
 * interpreted engine paid for each step: about fifteen milliseconds a row.
 *
 * The plan is the part that is the same for every row, worked out once from
 * the template: which attributes are bindings of which kind, which children
 * sit behind an `:if`, which attributes stay. A row then clones only the
 * nodes it shows, binds them through one scope, evaluates each expression
 * with the function compiled for it, and is inserted once it is bound, so the
 * host sends each node whole instead of as a node and a run of patches.
 *
 * Writing a bound value and running a handler go through the same functions
 * processElement uses (applyBoundAttribute, listenTemplateEvent, setStyle,
 * setText). A template with anything a plan does not cover (a nested loop or
 * component, an if/else chain, x- attributes, model, show, refs) keeps the
 * generic path; a branch with such content is processed generically when it
 * is first shown.
 */
export const SIGNALS_NATIVE_ROW_RUNTIME = `  // ==========================================================================
  // Native row plans
  // ==========================================================================

  var __STX_ROW_GENERIC_ATTRS = { 'stx-hydrate': 1, 'data-stx-memo': 1, 'data-stx-suspense': 1, 'x-data': 1, 'data-stx-xdata': 1, ref: 1, 'data-stx-ref': 1, 'data-stx-lazy': 1, 'data-stx-slot-scope': 1 };
  var __STX_ROW_SKIPPED_EVENTS = { if: 1, for: 1, show: 1, model: 1, class: 1, style: 1, text: 1, html: 1, ref: 1 };
  var __STX_ROW_CONTROL_ATTRS = { value: 1, checked: 1, selected: 1, indeterminate: 1 };
  var __STX_IDENT = /^[A-Za-z_$][\\w$]*$/;

  function __stxAlwaysVisible() { return true; }

  // A plan for rows cloned from \`template\`, or null where the generic path
  // has to make them.
  function planNativeRow(template) {
    if (!template || template.nodeType !== 1 || !template.attributes) return null;
    var plan = { sites: [], names: [], nameIndex: {}, shapes: new Map(), component: false, scopeId: null, setup: null, root: null };
    if (template.hasAttribute('data-stx-scope')) {
      plan.component = true;
      plan.scopeId = template.getAttribute('data-stx-template-scope') || template.getAttribute('data-stx-scope');
      var setups = window.__stx_componentSetups;
      plan.setup = setups && setups[plan.scopeId];
      if (typeof plan.setup !== 'function') return null;
    }
    try {
      plan.root = planRowNode(plan, template, true, false);
    }
    catch (e) {
      return null;
    }
    return plan.root ? plan : null;
  }

  function planRowSite(plan, raw, kind) {
    var expr = raw.indexOf('&') === -1 ? raw : raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
    // The same body text each path compiles, so the functions are the ones
    // the generic path would have made.
    var body = kind === 'attr' || kind === 'text' ? 'return (' + expr + ')'
      : kind === 'if' ? 'return ' + expr + ''
        : 'return ' + raw;
    var source = kind === 'attr' || kind === 'text' || kind === 'if' ? expr : raw;
    if (parsePipeExpression(source, {}) !== null) throw new Error('pipe');
    if (plan.component && raw.indexOf(plan.scopeId) !== -1) throw new Error('scope id in an expression');
    var names = kind === 'class'
      ? __stxNamesIn(source).filter(function(k) { return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k); })
      : __stxNamesIn(body);
    var uses = names.map(function(name) { return expressionSignalUse(source, name); });
    for (var i = 0; i < names.length; i++) {
      if (plan.nameIndex[names[i]] === undefined) {
        plan.nameIndex[names[i]] = plan.names.length;
        plan.names.push(names[i]);
      }
    }
    var site = { index: plan.sites.length, kind: kind, expr: source, body: body, names: names, uses: uses, placeholder: /^__[A-Z_]+__$/.test(source.trim()), ident: __STX_IDENT.test(source.trim()), handler: null };
    plan.sites.push(site);
    return site;
  }

  // One element of the template: its bindings, the attributes a row's copy
  // keeps, and its children. Throws where the template needs the generic path;
  // returns { generic: true } for an :if branch whose content does.
  function planRowNode(plan, tmpl, isRoot, inBranch) {
    var node = { tmpl: tmpl, attrs: [], ops: [], children: [], ifSite: null, generic: false, inert: false, remap: [] };
    var attrs = getElementAttributes(tmpl);
    var parentEvents = __stxWords(tmpl.getAttribute('data-stx-parent-events') || '');
    var parentBindings = isRoot && plan.component ? __stxWords(tmpl.getAttribute('data-stx-parent-bindings') || '') : [];
    var generic = false;
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i].name;
      var value = attrs[i].value;
      if (!name) continue;
      if (name === ':if' || name === '@if') {
        if (isRoot) throw new Error('root if');
        if (getElseAttrInfo(tmpl.nextElementSibling)) throw new Error('if chain');
        node.ifSite = planRowSite(plan, value, 'if');
        continue;
      }
      if (name === 'x-if' || getElseAttrInfo(tmpl)) throw new Error('chain');
      if ((name === ':for' || name === '@for' || name === 'x-for') && isForDirectiveExpression(value)) throw new Error('nested for');
      if (name === 'x-cloak') continue;
      if (name === 'data-stx-scope' || name === 'data-stx-template-scope') {
        if (!isRoot) throw new Error('nested component');
        continue;
      }
      if (__STX_ROW_GENERIC_ATTRS[name] || name.startsWith('::') || name.startsWith('x-') || name.startsWith('@bind:')) { generic = true; continue; }
      if (name.charCodeAt(0) === 58) {
        var bound = name.slice(1);
        var base = bound.split('.')[0];
        if (base === 'class' || base === 'style' || base === 'text') {
          if (name !== ':' + base) { generic = true; continue; }
          node.ops.push({ kind: base, site: planRowSite(plan, value, base) });
          if (base === 'text') node.inert = true;
          continue;
        }
        if (DIRECTIVE_NAMES[base] || EVENT_RE.test(bound)) { generic = true; continue; }
        if (isRoot && plan.component && parentBindings.indexOf(bound) !== -1) { node.attrs.push(attrs[i]); continue; }
        if ((__STX_ROW_CONTROL_ATTRS[bound] && bound in tmpl) || (bound === 'src' && tmpl.tagName === 'IFRAME')) { generic = true; continue; }
        node.ops.push({ kind: 'attr', attrName: bound, site: planRowSite(plan, value, 'attr') });
        continue;
      }
      if (name.charCodeAt(0) === 64) {
        if (name === '@class' || name === '@style' || name === '@text') {
          var directive = name.slice(1);
          node.ops.push({ kind: directive, site: planRowSite(plan, value, directive) });
          if (directive === 'text') node.inert = true;
          continue;
        }
        var parts = name.slice(1).split('.');
        var eventName = parentEvents.find(function(event) { return event.toLowerCase() === parts[0].toLowerCase(); }) || parts[0];
        if (__STX_ROW_SKIPPED_EVENTS[eventName]) { generic = true; continue; }
        if (plan.component && value.indexOf(plan.scopeId) !== -1) throw new Error('scope id in a handler');
        node.ops.push({
          kind: 'event',
          eventName: eventName,
          modifiers: parts.slice(1),
          value: value,
          key: '__stx_evt_' + eventName + '_' + value.substring(0, 20),
          forwarded: isRoot && plan.component && parentEvents.indexOf(eventName) !== -1,
        });
        continue;
      }
      if (plan.component && typeof value === 'string' && value.indexOf(plan.scopeId) !== -1) node.remap.push(node.attrs.length);
      node.attrs.push(attrs[i]);
    }
    if (generic) {
      if (!inBranch || !node.ifSite) throw new Error('generic content');
      return { tmpl: tmpl, generic: true, ifSite: node.ifSite };
    }
    var kids = tmpl.childNodes || [];
    for (var k = 0; k < kids.length; k++) {
      var child = kids[k];
      if (child.nodeType !== 1 || child.tagName === 'SCRIPT' || child.tagName === 'TEMPLATE' || child.__stx_scope) throw new Error('child kind');
      var hasIf = child.hasAttribute(':if') || child.hasAttribute('@if');
      node.children.push(planRowNode(plan, child, false, hasIf));
    }
    return node;
  }

  // Which of the plan's names this row's scope holds, and the functions
  // compiled for that answer. Rows of one loop nearly always share one.
  function rowShape(plan, own, layers) {
    var names = plan.names;
    var signature = '';
    for (var i = 0; i < names.length; i++) {
      var layer = __stxLayerOf(own, names[i]);
      layers[i] = layer;
      signature += layer === null ? '0' : '1';
    }
    var shape = plan.shapes.get(signature);
    if (!shape) {
      shape = { signature: signature, compiled: new Array(plan.sites.length) };
      plan.shapes.set(signature, shape);
    }
    return shape;
  }

  function compileRowSite(plan, site, shape) {
    var keys = [];
    var uses = [];
    for (var i = 0; i < site.names.length; i++) {
      if (shape.signature.charCodeAt(plan.nameIndex[site.names[i]]) === 49) {
        keys.push(site.names[i]);
        uses.push(site.uses[i]);
      }
    }
    var slots = keys.map(function(key) { return plan.nameIndex[key]; });
    var compiled = { keys: keys, slots: slots, uses: uses, fn: null, error: null };
    try { compiled.fn = __stxCompile(keys, site.body); }
    catch (e) { compiled.error = e; }
    shape.compiled[site.index] = compiled;
    return compiled;
  }

  function readRowScope(own, key) {
    var layer = __stxLayerOf(own, key);
    return layer === null ? own[key] : layer[key];
  }

  // What the expression's auto-unwrap proxy would hand the function for one
  // name (StxAutoUnwrapHandler.get with the expression).
  function unwrapRowValue(site, value, use) {
    if (value && typeof value === 'function' && (value._isSignal || value._isDerived)) {
      if (value._isStxLoopItem) return value();
      if (use === 1) return value;
      if (use === 0) return value();
      var keep;
      try {
        var current = value();
        keep = !(current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, 'value'));
      }
      catch (e) { keep = true; }
      return keep ? value : value();
    }
    if (value && typeof value === 'object' && value._isStxStore)
      return new Proxy(value, site.handler || (site.handler = new StxAutoUnwrapHandler(null, site.expr)));
    return value;
  }

  // An expression evaluated as its generic path does: through the unwrapping
  // scope first, then the raw scope, then reported and replaced by \`fallback\`.
  function evaluateRowSite(row, site, el, fallback, subscribe) {
    if (site.placeholder) return site.expr;
    var compiled = row.shape.compiled[site.index] || compileRowSite(row.plan, site, row.shape);
    var keys = compiled.keys;
    var layers = row.layers;
    var raw = new Array(keys.length);
    var args = new Array(keys.length);
    for (var i = 0; i < keys.length; i++) {
      // The layer holding each name was found once for the row (rowShape):
      // the layers are the row's own objects and the scopes it was given.
      var value = layers[compiled.slots[i]][keys[i]];
      raw[i] = value;
      if (subscribe && value && typeof value === 'function' && (value._isSignal || value._isDerived)) value();
      args[i] = unwrapRowValue(site, value, compiled.uses[i]);
    }
    if (compiled.fn) {
      try {
        var result = compiled.fn.apply(null, args);
        if (site.kind === 'attr' || site.kind === 'text') {
          if (result && typeof result === 'function' && (result._isSignal || result._isDerived)) result = result();
          noteExprSuccess(site.expr);
        }
        return result;
      }
      catch (e1) {
        try {
          var retried = compiled.fn.apply(null, raw);
          if (site.kind === 'attr' || site.kind === 'text') {
            if (retried && typeof retried === 'function' && (retried._isSignal || retried._isDerived)) retried = retried();
            noteExprSuccess(site.expr);
          }
          return retried;
        }
        catch (e2) {
          return failRowSite(row, site, el, e2, fallback);
        }
      }
    }
    return failRowSite(row, site, el, compiled.error, fallback);
  }

  function failRowSite(row, site, el, error, fallback) {
    reportUnknownBinding(error, site.expr, row.scope, el);
    var label = site.kind === 'attr' || site.kind === 'text' ? '[STX] Attribute expression error:'
      : site.kind === 'style' ? '[STX] Style expression error:'
        : site.kind === 'class' ? '[STX] Class expression error:' : '[STX] Expression error:';
    if (!(error instanceof ReferenceError) && !(error instanceof TypeError)) console.warn(label, site.expr, error);
    else if (site.kind === 'attr' || site.kind === 'text') noteExprFailure(site.expr, error);
    return fallback;
  }

  // The visibility gates an element's attribute bindings wait on: every :if
  // around it, the row's own and those around the loop.
  function rowVisibility(el, row) {
    var gates = [];
    for (var node = el; node; node = node.parentNode) {
      if (node.__stx_if_visible) gates.push(node.__stx_if_visible);
      if (node === row.root && !node.parentNode) {
        for (var i = 0; i < row.outer.length; i++) gates.push(row.outer[i]);
        break;
      }
    }
    if (!gates.length) return __stxAlwaysVisible;
    if (gates.length === 1) { var gate = gates[0]; return function() { return gate(); }; }
    return function() {
      for (var g = 0; g < gates.length; g++) if (!gates[g]()) return false;
      return true;
    };
  }

  // The nodes of one planned element, children placed and :if children
  // given their anchors, nothing bound yet.
  function buildRowNode(pnode, row) {
    var el = stxHost.cloneElement(pnode.tmpl, pnode.attrs);
    for (var r = 0; r < pnode.remap.length; r++) {
      var attribute = pnode.attrs[pnode.remap[r]];
      el.setAttribute(attribute.name, attribute.value.split(row.plan.scopeId).join(row.scopeId));
    }
    var kids = new Array(pnode.children.length);
    for (var i = 0; i < pnode.children.length; i++) {
      var child = pnode.children[i];
      var made;
      if (child.ifSite) {
        made = { pnode: child, el: null, anchor: stxHost.anchor('stx-if') };
        stxHost.append(el, made.anchor);
      }
      else {
        made = buildRowNode(child, row);
        stxHost.append(el, made.el);
      }
      kids[i] = made;
    }
    return { pnode: pnode, el: el, kids: kids, anchor: null };
  }

  function bindRowNode(made, row) {
    var pnode = made.pnode;
    var el = made.el;
    var ops = pnode.ops;
    var visible = null;
    var urlWarning = null;
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.kind === 'attr') {
        if (!visible) visible = rowVisibility(el, row);
        if (!urlWarning) urlWarning = { warned: false };
        bindRowAttribute(el, op, row, visible, urlWarning);
      }
      else if (op.kind === 'class') {
        if (!visible) visible = rowVisibility(el, row);
        bindRowClass(el, op.site, row, visible);
      }
      else if (op.kind === 'style') {
        if (!visible) visible = rowVisibility(el, row);
        bindRowStyle(el, op.site, row, visible);
      }
      else if (op.kind === 'text') {
        el.__stx_inert_content = true;
        bindRowText(el, op.site, row);
      }
      else if (op.kind === 'event') {
        if (el[op.key]) continue;
        el[op.key] = true;
        var forwarded = op.forwarded && !!el.__stx_parent_scope;
        listenTemplateEvent(el, op.eventName, op.modifiers, op.value,
          forwarded ? layerTemplateScopes(globalHelpers, el.__stx_parent_scope) : row.evalScope, forwarded);
      }
    }
    if (pnode.inert) return;
    for (var k = 0; k < made.kids.length; k++) {
      var kid = made.kids[k];
      if (kid.anchor) bindRowIf(kid, made.el, row);
      else bindRowNode(kid, row);
    }
  }

  function bindRowAttribute(el, op, row, visible, urlWarning) {
    effect(function() {
      if (!visible()) return;
      applyBoundAttribute(el, op.attrName, evaluateRowSite(row, op.site, el, ''), visible, urlWarning);
    });
  }

  function bindRowText(el, site, row) {
    effect(function() { stxHost.setText(el, evaluateRowSite(row, site, el, '')); });
  }

  function bindRowStyle(el, site, row, visible) {
    effect(function() {
      if (!visible()) return;
      stxHost.setStyle(el, evaluateRowSite(row, site, el, {}), true);
    });
  }

  // bindClass, reading its names through the row's scope.
  function bindRowClass(el, site, row, visible) {
    var originalClasses = el.className;
    effect(function() {
      if (!visible()) return;
      var value = evaluateRowSite(row, site, el, '', true);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach(function(cls) {
          var tokens = cls.split(/\\s+/).filter(Boolean);
          if (value[cls]) tokens.forEach(function(t) { el.classList.add(t); });
          else tokens.forEach(function(t) { el.classList.remove(t); });
        });
      }
      else if (Array.isArray(value)) {
        el.className = [originalClasses, value.filter(Boolean).join(' ')].filter(Boolean).join(' ');
      }
      else {
        el.className = [originalClasses, value || ''].filter(Boolean).join(' ');
      }
    });
  }

  // bindIf for an element of a planned row. Its element is made the first
  // time it shows, rather than cloned with the row and removed again.
  function bindRowIf(made, parentEl, row) {
    var pnode = made.pnode;
    var site = pnode.ifSite;
    var placeholder = made.anchor;
    var parent = parentEl;
    var el = null;
    var isInserted = false;
    var childrenProcessed = false;
    var firstRun = true;
    var direct = site.ident ? readRowScope(row.own, site.expr.trim()) : null;
    var directSignal = direct && (direct._isSignal || direct._isDerived) ? direct : null;
    effect(function() {
      parent = followPlaceholder(placeholder, parent, el ? [el] : []);
      var value = directSignal ? directSignal() : evaluateRowSite(row, site, null, '');
      var initial = firstRun;
      firstRun = false;
      if (!el) {
        if (!value) return;
        el = makeRowBranch(pnode, row);
        made.el = el;
        if (initial) {
          // Shown from the start: placed as the generic path's clone was.
          stxHost.insert(parent, el, placeholder.nextSibling);
          isInserted = true;
        }
      }
      stxHost.setVisible(el, !!value);
      if (value && !isInserted) {
        stxHost.insert(parent, el, placeholder.nextSibling);
        if (parent && parent.__stx_detached_if) parent.__stx_detached_if.delete(el);
        el.__stx_if_visible.set(true);
        el.__stx_shown_at = performance.now();
        isInserted = true;
        peek(resumeDetachedBranches);
        if (childrenProcessed) {
          queueMicrotask(function() {
            if (isInserted) peek(function() { resumeSubtreeScopes([el]); });
          });
        }
      }
      else if (!value && isInserted) {
        el.__stx_if_visible.set(false);
        suspendSubtreeScopes([el]);
        stxHost.remove(el);
        if (parent) {
          if (!parent.__stx_detached_if) parent.__stx_detached_if = new Set();
          parent.__stx_detached_if.add(el);
        }
        isInserted = false;
      }
      if (value && isInserted && !childrenProcessed) {
        childrenProcessed = true;
        peek(function() { hydrateRowBranch(made, row); });
      }
    });
  }

  function makeRowBranch(pnode, row) {
    var el;
    if (pnode.generic) {
      el = stxHost.clone(pnode.tmpl);
      el.removeAttribute(':if');
      el.removeAttribute('@if');
      if (row.plan.component) remapRowSubtree(el, row);
    }
    else {
      var made = buildRowNode(pnode, row);
      el = made.el;
      el.__stx_row_made = made;
    }
    el.__stx_if_bound = true;
    el.__stx_if_visible = state(true);
    return el;
  }

  function remapRowSubtree(el, row) {
    var oldId = row.plan.scopeId;
    [el].concat(stxHost.descendants(el)).forEach(function(node) {
      if (!node.attributes) return;
      getElementAttributes(node).forEach(function(attribute) {
        if (typeof attribute.value === 'string' && attribute.value.indexOf(oldId) !== -1)
          node.setAttribute(attribute.name, attribute.value.split(oldId).join(row.scopeId));
      });
    });
  }

  function hydrateRowBranch(made, row) {
    var el = made.el;
    var built = el.__stx_row_made;
    if (built) {
      el.__stx_row_made = null;
      el.__stx_if_disposers = trackEffects(function() { bindRowNode(built, row); });
      resumeDetachedBranches();
      return;
    }
    // Generic content, processed as bindIf's shown branch is: once its row
    // is on the screen, since the generic walk reads the tree around it.
    var run = function() {
      if (!el.isConnected) {
        if (!row.inserted) { row.after.push(run); return; }
        var resume = function() { peek(run); };
        resume.el = el;
        detachedBranches.add(resume);
        return;
      }
      var wasTracked = !!el.__stx_disposers;
      if (wasTracked || !el.__stx_disposers)
        el.__stx_if_disposers = trackEffects(function() { processElement(el, row.scope); });
      resumeDetachedBranches();
    };
    run();
  }

  // A row of \`plan\`, bound before it is inserted. \`parent\` is where it will
  // go; the caller inserts it and then calls finishNativeRow.
  function createNativeRow(plan, itemScope, parent) {
    var row = { plan: plan, root: null, scope: null, evalScope: null, own: null, layers: null, shape: null, outer: [], after: [], inserted: false, scopeVars: null, scopeId: null };
    for (var node = parent; node; node = node.parentNode) if (node.__stx_if_visible) row.outer.push(node.__stx_if_visible);
    if (plan.component) row.scopeId = plan.scopeId + '_for_' + (++__forComponentScopeCounter);
    var made = buildRowNode(plan.root, row);
    var root = made.el;
    row.root = root;
    if (plan.component) {
      if (!root.hasAttribute('data-stx-template-scope')) root.setAttribute('data-stx-template-scope', plan.scopeId);
      root.setAttribute('data-stx-scope', row.scopeId);
      if (!(window.stx._scopes && window.stx._scopes[row.scopeId])) runClonedComponentSetup(plan.setup, root);
      var callerScope = componentCallerScopeFrom(parent, itemScope);
      root.__stx_parent_scope = callerScope;
      bindParentComponentProps(root, callerScope);
      var scopeVars = window.stx._scopes && window.stx._scopes[row.scopeId];
      if (!scopeVars) return { root: root, row: row };
      scopeVars.__el = root;
      row.scopeVars = scopeVars;
      row.scope = layerTemplateScopes(callerScope, scopeVars);
      row.evalScope = layerTemplateScopes(globalHelpers, row.scope, scopeVars);
    }
    else {
      row.scope = itemScope;
      row.evalScope = layerTemplateScopes(globalHelpers, itemScope, findElementScope(parent) || {});
    }
    row.own = __stxOwnOf.get(row.evalScope);
    row.layers = new Array(plan.names.length);
    row.shape = rowShape(plan, row.own, row.layers);
    var dispose = trackEffects(function() { bindRowNode(made, row); });
    if (plan.component) root.__stx_disposers = dispose;
    else root.__stx_effect_disposers = dispose;
    return { root: root, row: row };
  }

  function finishNativeRow(created) {
    var row = created.row;
    row.inserted = true;
    var scopeVars = row.scopeVars;
    if (scopeVars && scopeVars.__mountCallbacks && !scopeVars.__mounted) {
      scopeVars.__mounted = true;
      runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
    }
    var after = row.after.splice(0, row.after.length);
    for (var i = 0; i < after.length; i++) after[i]();
  }
`
