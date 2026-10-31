/** Two-way form model binding for the generated client runtime. */
export const SIGNALS_MODEL_RUNTIME = `  function bindModel(el, expr, passedScope = componentScope, attrName = '@model') {
    if (el.__stx_model_bound) return;
    el.__stx_model_bound = true;
    const tag = el.tagName.toLowerCase();
    const type = el.type;
    const modifiers = attrName.split('.').slice(1);
    const capturedScope = layerTemplateScopes(globalHelpers, passedScope, (findElementScope(el) || {}));
    const coerceValue = (value) => {
      var next = value;
      if (modifiers.includes('trim') && typeof next === 'string') next = next.trim();
      if (modifiers.includes('number') && next !== '') {
        var numeric = Number(next);
        if (!Number.isNaN(numeric)) next = numeric;
      }
      return next;
    };

    const getValue = () => {
      var direct = capturedScope[expr];
      if (direct && typeof direct === 'function' && (direct._isSignal || direct._isDerived))
        return direct();
      try {
        var unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
        var fn = __stxCompileScoped(unwrapScope, [], 'return (' + expr + ')');
        return fn(...__stxArgs(fn, unwrapScope));
      }
      catch (e) {
        reportUnknownBinding(e, expr, capturedScope, el);
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] ' + attrName + ' get error:', expr, e);
        return '';
      }
    };
    const setValue = (val) => {
      try {
        if (capturedScope[expr] && capturedScope[expr]._isSignal) {
          capturedScope[expr].set(val);
        }
else {
          // Write through the SAME auto-unwrap proxy the read path uses.
          //
          // This used to destructure the scope into plain parameters, so an
          // lvalue like store.title assigned onto the raw object and REPLACED
          // the signal with a raw string. Everything else bound to that signal
          // stopped updating, its .set was gone so the next write threw
          // TypeError, and nothing warned — the field the user typed into was
          // the only thing on the page that still looked right (#1883).
          //
          // The proxy's set trap already did the correct thing (call .set on a
          // signal-valued property) and was simply never reached from here.
          // Routing through it also drops the old requirement that every scope
          // key be a valid identifier, since nothing is destructured now.
          var writeScope = createModelWriteProxy(capturedScope);
          var writeFn = __stxCompile(['__scope__', '__v__'], 'with(__scope__) { ' + expr + ' = __v__ }');
          writeFn(writeScope, val);
        }
      }
catch (e) {
        if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] ' + attrName + ' set error:', expr, e);
      }
    };

    bindFormControlReset(el, 'model', getValue, setValue);

    if (tag === 'input' && type === 'checkbox') {
      var syncCheckbox = () => {
        var current = getValue();
        el.checked = Array.isArray(current)
          ? current.some(function(item) { return String(item) === String(el.value); })
          : Boolean(current);
      };
      el.__stx_model_sync = syncCheckbox;
      effect(syncCheckbox);
      stxHost.listen(el, 'change', () => {
        var current = getValue();
        if (!Array.isArray(current)) {
          setValue(el.checked);
          return;
        }

        var checkboxValue = coerceValue(el.value);
        var next = current.filter(function(item) { return String(item) !== String(checkboxValue); });
        if (el.checked) next.push(checkboxValue);
        setValue(next);
      });
    }
    else if (tag === 'input' && type === 'radio') {
      var syncRadio = () => { el.checked = String(getValue()) === String(el.value); };
      el.__stx_model_sync = syncRadio;
      effect(syncRadio);
      stxHost.listen(el, 'change', () => {
        if (el.checked) setValue(coerceValue(el.value));
      });
    }
    else if (tag === 'select') {
      // Same equality guard as the text branch. Harmless here — a select has
      // no caret — but an unconditional write is still a needless DOM mutation
      // on every signal change, and the inconsistency invites the text-branch
      // bug being reintroduced by copying this one (#1799).
      var syncSelect = () => { var next = getValue() ?? ''; if (el.value !== next) el.value = next; };
      el.__stx_model_sync = syncSelect;
      effect(syncSelect);
      if (!el.__stx_model_observer && typeof window.MutationObserver !== 'undefined') {
        el.__stx_model_observer = new window.MutationObserver(syncSelect);
        el.__stx_model_observer.observe(el, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['value'],
        });
        el.__stx_destroy = el.__stx_destroy || [];
        el.__stx_destroy.push(function() {
          if (el.__stx_model_observer) el.__stx_model_observer.disconnect();
          el.__stx_model_observer = null;
        });
      }
      stxHost.listen(el, 'change', () => setValue(coerceValue(el.value)));
    }
else {
      // Writing el.value moves the text cursor to the END of the control, and
      // typing forms a loop: input -> setValue -> the signal changes -> this
      // effect re-runs -> the write. So every keystroke reset the caret
      // (stacksjs/stx#1799).
      //
      // Invisible while appending at the end of a field, which is why a login
      // form with x-model felt fine and a textarea people actually edit did
      // not. Worse inside :for, where key-based reuse updates the item signal
      // on reuse (#1669) and re-evaluates the reused row's bindings on every
      // character.
      //
      // The equality guard alone fixes typing, because the value this effect
      // computes IS the value just typed. The offset is preserved as well for
      // the case the guard cannot cover: a value that legitimately changed
      // from elsewhere while the field is focused — a formatter rewriting
      // input, a remote sync.
      effect(() => {
        var next = getValue() ?? '';
        if (el.value === next) return;
        var active = typeof document !== 'undefined' && document.activeElement === el;
        var start = null;
        var end = null;
        if (active) {
          // selectionStart throws on input types that do not support
          // selection (number, email, date), so it cannot be assumed present.
          try { start = el.selectionStart; end = el.selectionEnd; }
          catch (e) { start = null; end = null; }
        }
        el.value = next;
        if (active && start !== null && typeof el.setSelectionRange === 'function') {
          // Clamp: the incoming value may be shorter than the old offset.
          try { el.setSelectionRange(Math.min(start, next.length), Math.min(end == null ? start : end, next.length)); }
          catch (e) { /* type does not support selection */ }
        }
      });
      stxHost.listen(el, modifiers.includes('lazy') ? 'change' : 'input', () => setValue(coerceValue(el.value)));
    }

    el.removeAttribute(attrName);
  }
`
