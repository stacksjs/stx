export const SIGNALS_COMPONENT_API_RUNTIME = `    // Component composition API (Phase 4)
    defineProps: function(definitions) {
      var props = window.__STX_CURRENT_PROPS__ || {};
      if (!definitions) return props;
      var result = Object.assign({}, props);
      for (var key in definitions) {
        if (!definitions.hasOwnProperty(key)) continue;
        var def = definitions[key];
        var opts = (typeof def === 'function' || Array.isArray(def)) ? { type: def } : (def || {});
        if (result[key] === undefined && opts['default'] !== undefined) {
          result[key] = typeof opts['default'] === 'function' ? opts['default']() : opts['default'];
        }
      }
      return result;
    },
    withDefaults: function(props, defaults) {
      var result = Object.assign({}, props);
      for (var key in defaults) {
        if (!defaults.hasOwnProperty(key)) continue;
        if (result[key] === undefined) {
          result[key] = typeof defaults[key] === 'function' ? defaults[key]() : defaults[key];
        }
      }
      return result;
    },
    defineEmits: function(events) {
      var el = window.__STX_CURRENT_ELEMENT__ || null;
      var declaredEvents = Array.isArray(events)
        ? events
        : (events && typeof events === 'object' ? Object.keys(events) : []);
      if (el && declaredEvents.length) {
        el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
        declaredEvents.forEach(function(event) {
          el.__stx_component_emits[event] = true;
        });
      }
      return function(event, payload) {
        var target = el || document.body;
        if (el) {
          el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
          el.__stx_component_emits[event] = true;
        }
        var emitted = new CustomEvent(event, { detail: payload, bubbles: true, cancelable: true });
        emitted.__stx_emit_args = Array.prototype.slice.call(arguments, 1);
        stxHost.emitComponentEvent(target, emitted);
      };
    },
    defineExpose: function(exposed) {
      var el = window.__STX_CURRENT_ELEMENT__;
      if (el) el.__stx_exposed = exposed;
    },
    defineSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },
    // Vue spells the same lookup useSlots(); it was auto-imported with no
    // implementation behind it (#1804).
    useSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },`

