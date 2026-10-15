/** Component authoring composables used by the generated client runtime. */
export function signalsAuthoringRuntime(createModelSignalSource: string): string {
  return `  var __stxGeneratedIdCounter = 0;

  // Stable, scope-aware DOM ids for component authoring. A component setup
  // runs with window.__STX_CURRENT_ELEMENT__ pointing at its compiled root, so
  // the data-stx scope id is already the canonical per-instance identity. The
  // local counter supports multiple useId() calls in one component while the
  // global fallback covers page scripts and manually-mounted roots.
  function useId(prefix) {
    var normalizedPrefix = String(prefix || 'stx')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stx';
    var root = window.__STX_CURRENT_ELEMENT__;
    if (root && root.getAttribute) {
      var scopeId = root.getAttribute('data-stx-scope') || root.getAttribute('data-stx') || '';
      if (scopeId) {
        root.__stx_id_counter = (root.__stx_id_counter || 0) + 1;
        return normalizedPrefix + '-' + String(scopeId).replace(/[^a-zA-Z0-9_-]+/g, '-') + '-' + root.__stx_id_counter;
      }
    }
    __stxGeneratedIdCounter++;
    return normalizedPrefix + '-' + __stxGeneratedIdCounter;
  }

  var createModelSignal = ${createModelSignalSource};
  function useModel(name, options) {
    if (typeof name !== 'string') { options = name || {}; name = 'modelValue'; }
    options = options || {};
    var source = useReactiveProp(name, options.default, { parse: options.parse });
    var modifierName = name === 'modelValue' ? 'modelModifiers' : name + 'Modifiers';
    var modifiers = useReactiveProp(modifierName, {});
    var emit = window.stx.defineEmits(['update:' + name]);
    return createModelSignal(source, function() { return modifiers() || {}; },
      function(value) { emit('update:' + name, value); }, options, onDestroy);
  }

  // Reactive prop binding. Bridges the gap between a parent's clientReactive
  // attribute (e.g. :open="modalOpen()" on a component) and the component's
  // internal state. Returns a signal whose value tracks the named attribute
  // on the component's root element — when the parent's expression changes
  // and bindAttr updates the attribute, a MutationObserver on the root
  // forwards the change into this signal. See stacksjs/stx#1704.
  //
  // Parse heuristic (override via opts.parse for typed props):
  //   - empty string or "true" → true
  //   - "false" → false
  //   - numeric-looking → Number
  //   - otherwise → original string
  //
  // The signal is one-way (parent → child). For two-way binding, components
  // still emit events (@input / @change / @close) and the parent
  // updates its source signal. The signal's own .set() won't propagate back
  // through the attribute by design; that prevents observer feedback loops.
  function useReactiveProp(name, defaultValue, opts) {
    opts = opts || {};
    var parse = opts.parse || function(v) {
      // Infer the prop's intended scalar type from its default. A string prop
      // with an empty value must stay "", not become the boolean true. This
      // mirrors typed component props and keeps form/error text stable when a
      // parent forwards an empty signal value through a DOM attribute.
      if (typeof defaultValue === 'string') return v == null ? '' : String(v);
      if (typeof defaultValue === 'boolean') {
        if (v === '' || v === 'true') return true;
        if (v === 'false' || v === null || v === undefined) return false;
        return Boolean(v);
      }
      if (v === '' || v === 'true') return true;
      if (v === 'false') return false;
      if (typeof v === 'string' && (v.charAt(0) === '[' || v.charAt(0) === '{')) {
        try { return JSON.parse(v); }
        catch (e) {}
      }
      if (typeof defaultValue === 'number')
        return v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : defaultValue;
      if (v != null && v !== '' && !isNaN(Number(v))) return Number(v);
      return v;
    };
    var root = window.__STX_CURRENT_ELEMENT__;
    var kebabName = name.replace(/([A-Z])/g, function(_, c) { return '-' + c.toLowerCase(); });
    var lowerName = name.toLowerCase();
    var attributeNames = [name];
    if (kebabName !== name) attributeNames.push(kebabName);
    if (lowerName !== name && lowerName !== kebabName) attributeNames.push(lowerName);
    function readAttribute() {
      if (!root || !root.hasAttribute) return { has: false, raw: null };
      for (var i = 0; i < attributeNames.length; i++) {
        var candidate = attributeNames[i];
        if (root.hasAttribute(candidate))
          return { has: true, raw: root.getAttribute(candidate) };
      }
      return { has: false, raw: null };
    }
    var staticValue = defaultValue;
    if (root && root.getAttribute) {
      var serializedProps = root.getAttribute('data-stx-props');
      if (serializedProps) {
        try {
          var parsedProps = JSON.parse(serializedProps);
          var camelName = name.replace(/-([a-z0-9])/g, function(_, c) { return c.toUpperCase(); });
          if (Object.prototype.hasOwnProperty.call(parsedProps, name)) staticValue = parsedProps[name];
          else if (Object.prototype.hasOwnProperty.call(parsedProps, camelName)) staticValue = parsedProps[camelName];
        }
        catch (e) {}
      }
    }
    var initial;
    var lastRaw = null;
    var initialAttribute = readAttribute();
    if (initialAttribute.has) {
      lastRaw = initialAttribute.raw;
      initial = parse(lastRaw);
    } else if (typeof staticValue === 'string' && (opts.parse || typeof defaultValue !== 'string')) {
      // A prop written as a plain attribute is serialized as the string it was
      // written as, so it gets the same parse an attribute does. Taken raw,
      // currentPage="1" reached Pagination as "1": "1" + 1 is "11", the
      // range maths took the wrong branch, and ten pages rendered as
      // 1 ... 1 2 3 4 5 6 7 8 9 10 ... 10. A string prop stays a string.
      initial = parse(staticValue);
    } else {
      initial = staticValue;
    }
    var s = state(initial);
    if (!root) return s;
    var propSignals = root.__stx_reactive_prop_signals
      || (root.__stx_reactive_prop_signals = {});
    function register() {
      propSignals[name] = s;
      propSignals[kebabName] = s;
      propSignals[lowerName] = s;
    }
    register();
    function sync() {
      var attribute = readAttribute();
      var hasAttr = attribute.has;
      var raw = attribute.raw;
      if (raw === lastRaw) return;
      lastRaw = raw;
      var directValues = root.__stx_direct_prop_values;
      var directValue = directValues && directValues[name];
      var next;
      if (directValue && directValue.raw === raw) {
        next = directValue.value;
        delete directValues[name];
        for (var directKey in directValues) {
          if (directValues[directKey] === directValue) delete directValues[directKey];
        }
      }
      else {
        next = hasAttr ? parse(raw) : staticValue;
      }
      if (next !== s()) s.set(next);
    }
    var observer = new MutationObserver(sync);
    var connected = true;
    observer.observe(root, { attributes: true, attributeFilter: attributeNames });
    // An :if hides a component and shows it again with the same setup, so
    // the link to the parent is dropped on unmount and made again on mount.
    // Disconnected for good, a component re-shown in an :if kept the prop it
    // had when it hid: a chat header's avatar showed the previous person.
    onMount(function() {
      if (connected) return;
      connected = true;
      register();
      observer.observe(root, { attributes: true, attributeFilter: attributeNames });
      sync();
    });
    onDestroy(function() {
      connected = false;
      observer.disconnect();
      attributeNames.forEach(function(attributeName) {
        if (propSignals[attributeName] === s) delete propSignals[attributeName];
      });
    });
    return s;
  }

  function useEventListener(event, handler, options) {
    var target = (options && options.target) || window;
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target) return;
    var opts = { capture: options && options.capture, passive: options && options.passive, once: options && options.once };
    target.addEventListener(event, handler, opts);
    onDestroy(function() { target.removeEventListener(event, handler, opts); });
  }
`
}
