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
  var __STX_QUOTED = /'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"/g;
  var __STX_KEYWORDS = { return: 1, true: 1, false: 1, null: 1, typeof: 1, instanceof: 1, new: 1, this: 1, void: 1, in: 1, of: 1, delete: 1, function: 1, var: 1, let: 1, const: 1, if: 1, else: 1 };

  function __stxAlwaysVisible() { return true; }

  // What planning throws for a template it leaves to the generic path: one
  // object, not an Error with a stack to capture for every refusal.
  var ROW_UNPLANNED = { unplanned: true };

  // A plan for rows cloned from \`template\`, or null where the generic path
  // has to make them.
  function planNativeRow(template) {
    if (!template || template.nodeType !== 1 || !template.attributes) return null;
    // Two scopes a row reads from: its own (bindings inside the row) and, for
    // a component, its caller's (the props the caller passes). Each keeps the
    // names its expressions mention and the functions compiled per shape.
    var plan = { sites: [], eval: rowGroup(), prop: rowGroup(), props: null, component: false, scopeId: null, setup: null, root: null };
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

  function rowGroup() {
    return { names: [], nameIndex: {}, shapes: new Map() };
  }

  function planRowSite(plan, raw, kind) {
    var expr = raw.indexOf('&') === -1 ? raw : raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
    // The same body text each path compiles, so the functions are the ones
    // the generic path would have made.
    var body = kind === 'attr' || kind === 'text' || kind === 'prop' ? 'return (' + expr + ')'
      : kind === 'if' ? 'return ' + expr + ''
        : 'return ' + raw;
    var source = kind === 'attr' || kind === 'text' || kind === 'if' ? expr : raw;
    var group = kind === 'prop' ? plan.prop : plan.eval;
    if (parsePipeExpression(source, {}) !== null) throw ROW_UNPLANNED;
    if (plan.component && raw.indexOf(plan.scopeId) !== -1) throw ROW_UNPLANNED;
    // The names the expression can read: not the words of its quoted strings
    // (a class list in a ternary) nor keywords, which every row would
    // otherwise look up in its scope for nothing.
    var unquoted = source.indexOf("'") === -1 && source.indexOf('"') === -1 ? source : source.replace(__STX_QUOTED, ' ');
    var names = __stxNamesIn(unquoted).filter(function(k) { return !__STX_KEYWORDS[k]; });
    for (var i = 0; i < names.length; i++) {
      if (group.nameIndex[names[i]] === undefined) {
        group.nameIndex[names[i]] = group.names.length;
        group.names.push(names[i]);
      }
    }
    var site = { index: plan.sites.length, kind: kind, group: group, expr: source, body: body, names: names, placeholder: /^__[A-Z_]+__$/.test(source.trim()), ident: __STX_IDENT.test(source.trim()), handler: null };
    plan.sites.push(site);
    return site;
  }

  // One element of the template: its bindings, the attributes a row's copy
  // keeps, and its children. Throws where the template needs the generic path;
  // returns { generic: true } for an :if branch whose content does.
  function planRowNode(plan, tmpl, isRoot, inBranch, gated) {
    var node = { tmpl: tmpl, attrs: [], ops: [], children: [], ifSite: null, generic: false, inert: false, remap: [], gated: !!(gated || inBranch) };
    var attrs = getElementAttributes(tmpl);
    var parentEvents = __stxWords(tmpl.getAttribute('data-stx-parent-events') || '');
    var parentBindings = isRoot && plan.component ? __stxWords(tmpl.getAttribute('data-stx-parent-bindings') || '') : [];
    // A component's props, as bindParentComponentProps reads them: each
    // parent binding from its :name attribute, else from the bindings an
    // enclosing loop deferred (data-stx-deferred-parent-bindings). What the
    // row leaves deferred is the same for every row.
    var deferredProps = null;
    if (isRoot && plan.component) {
      plan.props = [];
      deferredProps = readDeferredParentComponentProps(tmpl);
      for (var b = 0; b < parentBindings.length; b++) {
        var propName = parentBindings[b];
        var propExpression = tmpl.hasAttribute(':' + propName) ? tmpl.getAttribute(':' + propName) : deferredProps[propName];
        if (typeof propExpression !== 'string') continue;
        plan.props.push({ name: propName, site: planRowSite(plan, propExpression, 'prop') });
        delete deferredProps[propName];
      }
    }
    if (getElseAttrInfo(tmpl)) throw ROW_UNPLANNED;
    var generic = false;
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i].name;
      var value = attrs[i].value;
      if (!name) continue;
      if (name === ':if' || name === '@if') {
        if (isRoot) throw ROW_UNPLANNED;
        if (getElseAttrInfo(tmpl.nextElementSibling)) throw ROW_UNPLANNED;
        node.ifSite = planRowSite(plan, value, 'if');
        continue;
      }
      if (name === 'x-if') throw ROW_UNPLANNED;
      if ((name === ':for' || name === '@for' || name === 'x-for') && isForDirectiveExpression(value)) throw ROW_UNPLANNED;
      if (name === 'x-cloak') continue;
      if (name === 'data-stx-scope' || name === 'data-stx-template-scope') {
        if (!isRoot) throw ROW_UNPLANNED;
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
        if (isRoot && plan.component && parentBindings.indexOf(bound) !== -1) continue;
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
        if (plan.component && value.indexOf(plan.scopeId) !== -1) throw ROW_UNPLANNED;
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
      if (deferredProps && name === 'data-stx-deferred-parent-bindings' && plan.props.length) {
        if (Object.keys(deferredProps).length) node.attrs.push({ name: name, value: JSON.stringify(deferredProps) });
        continue;
      }
      if (plan.component && typeof value === 'string' && value.indexOf(plan.scopeId) !== -1) node.remap.push(node.attrs.length);
      node.attrs.push(attrs[i]);
    }
    if (generic) {
      if (!inBranch || !node.ifSite) throw ROW_UNPLANNED;
      return { tmpl: tmpl, generic: true, ifSite: node.ifSite };
    }
    var kids = tmpl.childNodes || [];
    for (var k = 0; k < kids.length; k++) {
      var child = kids[k];
      if (child.nodeType !== 1 || child.tagName === 'SCRIPT' || child.tagName === 'TEMPLATE' || child.__stx_scope) throw ROW_UNPLANNED;
      var hasIf = child.hasAttribute(':if') || child.hasAttribute('@if');
      node.children.push(planRowNode(plan, child, false, hasIf, node.gated));
    }
    return node;
  }

  // Which of the plan's names this row's scope holds, and the functions
  // compiled for that answer. Rows of one loop nearly always share one.
  function rowShape(group, own, layers) {
    var names = group.names;
    var stack = own[__STX_LAYERS];
    // A row's scope is its loop's layers (the same objects for every row)
    // and a few of its own (its item, its component's variables), which hold
    // the same names from row to row. When this row's are the last row's or
    // hold the same names, every name lives where it did: nothing to look up.
    var last = group.last;
    if (last && stack.length === last.stack.length && own[__STX_HIDDEN] === undefined && Object.keys(own).length === 0) {
      var same = true;
      for (var j = 0; j < stack.length && same; j++) {
        if (stack[j] !== last.stack[j]) same = Object.keys(stack[j]).join('\u0001') === last.names[j];
      }
      if (same) {
        for (var n = 0; n < names.length; n++) layers[n] = last.at[n] < 0 ? null : stack[last.at[n]];
        last.stack = stack;
        return last.shape;
      }
    }
    var signature = '';
    var at = new Array(names.length);
    for (var i = 0; i < names.length; i++) {
      var layer = __stxLayerOf(own, names[i]);
      layers[i] = layer;
      at[i] = layer === null ? -1 : stack.lastIndexOf(layer);
      signature += layer === null ? '0' : '1';
    }
    var shape = group.shapes.get(signature);
    if (!shape) {
      shape = { signature: signature, compiled: [] };
      group.shapes.set(signature, shape);
    }
    // Remembered for the next row only when every name was found in a layer
    // (not on the scope's own object, which differs per row).
    var ownless = Object.keys(own).length === 0 && own[__STX_HIDDEN] === undefined;
    if (ownless) {
      for (var k = 0; k < names.length; k++) if (layers[k] !== null && at[k] < 0) ownless = false;
    }
    group.last = ownless ? { stack: stack, names: stack.map(function(layer) { return Object.keys(layer).join('\u0001'); }), at: at, shape: shape } : null;
    return shape;
  }

  // How the expression uses a name its scope holds, worked out when a row
  // first evaluates it: a prop's scope keeps a signal its expression calls or
  // uses as a signal (createAutoUnwrapProxy's rule), everything else follows
  // the expression (StxAutoUnwrapHandler's).
  function rowSignalUse(site, name) {
    return site.kind === 'prop'
      ? (expressionCallsSignal(site.expr, name) || expressionUsesSignalApi(site.expr, name) ? 1 : 0)
      : expressionSignalUse(site.expr, name);
  }

  function compileRowSite(site, shape) {
    var nameIndex = site.group.nameIndex;
    var keys = [];
    var uses = [];
    for (var i = 0; i < site.names.length; i++) {
      if (shape.signature.charCodeAt(nameIndex[site.names[i]]) === 49) {
        keys.push(site.names[i]);
        uses.push(rowSignalUse(site, site.names[i]));
      }
    }
    var slots = keys.map(function(key) { return nameIndex[key]; });
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
    if (value && typeof value === 'object' && value._isStxStore) {
      if (!site.handler) {
        var expr = site.expr;
        site.handler = site.kind === 'prop'
          ? new StxAutoUnwrapHandler(function(prop) { return typeof prop === 'string' && (expressionCallsSignal(expr, prop) || expressionUsesSignalApi(expr, prop)); }, null)
          : new StxAutoUnwrapHandler(null, expr);
      }
      return new Proxy(value, site.handler);
    }
    return value;
  }

  // An expression evaluated as its generic path does: through the unwrapping
  // scope first, then the raw scope, then reported and replaced by \`fallback\`.
  // \`at\`: the scope the site reads, as the row found it (row.local or row.caller).
  function evaluateRowSite(at, site, el, fallback, subscribe) {
    if (site.placeholder) return site.expr;
    var compiled = at.shape.compiled[site.index] || compileRowSite(site, at.shape);
    var keys = compiled.keys;
    var layers = at.layers;
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
          return failRowSite(at, site, el, e2, fallback);
        }
      }
    }
    return failRowSite(at, site, el, compiled.error, fallback);
  }

  function failRowSite(at, site, el, error, fallback) {
    reportUnknownBinding(error, site.expr, at.scope, el);
    if (site.kind === 'prop') {
      if (!(error instanceof ReferenceError) && !(error instanceof TypeError)) console.warn('[STX] Parent component prop error:', site.expr, error);
      return fallback;
    }
    var label = site.kind === 'attr' || site.kind === 'text' ? '[STX] Attribute expression error:'
      : site.kind === 'style' ? '[STX] Style expression error:'
        : site.kind === 'class' ? '[STX] Class expression error:' : '[STX] Expression error:';
    if (!(error instanceof ReferenceError) && !(error instanceof TypeError)) console.warn(label, site.expr, error);
    else if (site.kind === 'attr' || site.kind === 'text') noteExprFailure(site.expr, error);
    return fallback;
  }

  // The visibility gates an element's attribute bindings wait on: every :if
  // around it, the row's own and those around the loop.
  function rowVisibility(el, row, pnode) {
    // Outside every :if of the row, in a loop no :if hides: always visible,
    // without walking up to find that out.
    if (!pnode.gated && !row.outer.length && !row.inserted) return __stxAlwaysVisible;
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
        if (!visible) visible = rowVisibility(el, row, pnode);
        if (!urlWarning) urlWarning = { warned: false };
        bindRowAttribute(el, op, row, visible, urlWarning);
      }
      else if (op.kind === 'class') {
        if (!visible) visible = rowVisibility(el, row, pnode);
        bindRowClass(el, op.site, row, visible);
      }
      else if (op.kind === 'style') {
        if (!visible) visible = rowVisibility(el, row, pnode);
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
        // A forwarded handler runs in its caller's scope, which the listener
        // layers again when it fires; one layering serves all of the row's.
        if (forwarded && row.forwardedScope === null) row.forwardedScope = layerTemplateScopes(globalHelpers, el.__stx_parent_scope);
        listenTemplateEvent(el, op.eventName, op.modifiers, op.value, forwarded ? row.forwardedScope : row.evalScope, forwarded);
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
      applyBoundAttribute(el, op.attrName, evaluateRowSite(row.local, op.site, el, ''), visible, urlWarning);
    });
  }

  function bindRowText(el, site, row) {
    effect(function() { stxHost.setText(el, evaluateRowSite(row.local, site, el, '')); });
  }

  function bindRowStyle(el, site, row, visible) {
    effect(function() {
      if (!visible()) return;
      stxHost.setStyle(el, evaluateRowSite(row.local, site, el, {}), true);
    });
  }

  // bindClass, reading its names through the row's scope.
  function bindRowClass(el, site, row, visible) {
    var originalClasses = el.getAttribute('class') || '';
    effect(function() {
      if (!visible()) return;
      var value = evaluateRowSite(row.local, site, el, '', true);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach(function(cls) {
          var tokens = cls.split(/\\s+/).filter(Boolean);
          if (value[cls]) tokens.forEach(function(t) { el.classList.add(t); });
          else tokens.forEach(function(t) { el.classList.remove(t); });
        });
      }
      else if (Array.isArray(value)) {
        el.setAttribute('class', [originalClasses, value.filter(Boolean).join(' ')].filter(Boolean).join(' '));
      }
      else {
        el.setAttribute('class', [originalClasses, value || ''].filter(Boolean).join(' '));
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
    var direct = site.ident ? readRowScope(row.local.own, site.expr.trim()) : null;
    var directSignal = direct && (direct._isSignal || direct._isDerived) ? direct : null;
    effect(function() {
      parent = followPlaceholder(placeholder, parent, el ? [el] : []);
      var value = directSignal ? directSignal() : evaluateRowSite(row.local, site, null, '');
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
        el.__stx_if_disposers = trackEffects(function() { processElement(el, row.evalScope); });
      resumeDetachedBranches();
    };
    run();
  }

  // The scope a row's expressions read, with the layer each name lives in
  // found once (rowShape): the layers are the row's own objects and the
  // scopes it was given, so a read goes straight to the layer.
  function rowScopeAt(group, scope) {
    var own = __stxOwnOf.get(scope);
    var layers = new Array(group.names.length);
    return { scope: scope, own: own, layers: layers, shape: rowShape(group, own, layers) };
  }

  // bindParentComponentProps for a planned row: the caller's props, each
  // evaluated with the function compiled for it, written as the generic
  // path writes them.
  function bindRowProps(root, row, callerScope) {
    root.__stx_parent_props_bound = true;
    var props = row.plan.props;
    var caller = row.caller = rowScopeAt(row.plan.prop, layerTemplateScopes(globalHelpers, callerScope));
    for (var i = 0; i < props.length; i++) bindRowProp(root, props[i], caller);
  }

  function bindRowProp(root, prop, caller) {
    var name = prop.name;
    effect(function() {
      var value = evaluateRowSite(caller, prop.site, root, undefined);
      if (value && typeof value === 'function' && (value._isSignal || value._isDerived)) value = value();
      if (name.startsWith('aria-') && typeof value === 'boolean') stxHost.setAttribute(root, name, String(value));
      else if (value === null || value === undefined) stxHost.removeAttribute(root, name);
      else stxHost.setAttribute(root, name, value);
      syncComponentPropSignal(root, name, value);
    });
  }

  // A row of \`plan\`, bound before it is inserted. \`parent\` is where it will
  // go; the caller inserts it and then calls finishNativeRow.
  function createNativeRow(plan, itemScope, parent) {
    var row = { plan: plan, root: null, scope: null, evalScope: null, local: null, caller: null, forwardedScope: null, outer: [], after: [], inserted: false, scopeVars: null, scopeId: null };
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
      if (plan.props.length) bindRowProps(root, row, callerScope);
      var scopeVars = window.stx._scopes && window.stx._scopes[row.scopeId];
      if (!scopeVars) return { root: root, row: row };
      scopeVars.__el = root;
      row.scopeVars = scopeVars;
      row.scope = layerTemplateScopes(callerScope, scopeVars);
      // processElement layers the helpers and the component's variables over
      // this scope for each element; it already starts with the helpers (the
      // item scope's first layer) and ends with the variables, so the same
      // names resolve to the same layers through it as it is.
      row.evalScope = row.scope;
    }
    else {
      row.scope = itemScope;
      row.evalScope = layerTemplateScopes(globalHelpers, findElementScope(parent) || {}, itemScope);
      root.__stx_row_scope = row.evalScope;
    }
    row.local = rowScopeAt(plan.eval, row.evalScope);
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
