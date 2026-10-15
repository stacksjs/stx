/** Event-expression shorthand parser used by the client runtime. */
export const SIGNALS_EVENT_SHORTHAND_RUNTIME = `  // ==========================================================================
  // Event Handler Shorthand (Feature #8)
  // ==========================================================================

  function parseEventShorthand(expr, scope) {
    const trimmed = expr.trim();

    // Handle !variable toggle: "!visible" -> toggle the signal
    if (/^!\\w+$/.test(trimmed)) {
      const varName = trimmed.slice(1);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.set(!signal());
      }
      return null;
    }

    // Handle variable++ increment: "count++" -> increment the signal
    if (/^\\w+\\+\\+$/.test(trimmed)) {
      const varName = trimmed.slice(0, -2);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.update(n => n + 1);
      }
      return null;
    }

    // Handle variable-- decrement: "count--" -> decrement the signal
    if (/^\\w+--$/.test(trimmed)) {
      const varName = trimmed.slice(0, -2);
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return () => signal.update(n => n - 1);
      }
      return null;
    }

    // Handle += and -= operators: "count += 5"
    const assignMatch = trimmed.match(/^(\\w+)\\s*([+\\-*\\/])=\\s*(.+)$/);
    if (assignMatch) {
      const [, varName, op, valueExpr] = assignMatch;
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return ($event) => {
          const addValue = toValue(valueExpr, null, true, { ...scope, $event: $event });
          signal.update(n => {
            switch (op) {
              case '+': return n + addValue;
              case '-': return n - addValue;
              case '*': return n * addValue;
              case '/': return n / addValue;
              default: return n;
            }
          });
        };
      }
      return null;
    }

    // Handle simple assignment: "count = 5" or "visible = false"
    const simpleAssignMatch = trimmed.match(/^(\\w+)\\s*=\\s*(.+)$/);
    if (simpleAssignMatch && !trimmed.includes('==') && !trimmed.includes('=>')) {
      const [, varName, valueExpr] = simpleAssignMatch;
      const signal = scope[varName];
      if (signal && signal._isSignal) {
        return ($event) => {
          const newValue = toValue(valueExpr, null, true, { ...scope, $event: $event });
          signal.set(newValue);
        };
      }
      return null;
    }

    // Bare function reference: "@click=\\"foo\\"" should invoke foo($event),
    // matching Alpine/Vue/Svelte. Without this the expression falls through
    // to the generic new Function() path and is evaluated as a discarded
    // identifier statement — silently a no-op. See stacksjs/stx#1695.
    const bareIdMatch = trimmed.match(/^([a-zA-Z_$][\\w$]*)$/);
    if (bareIdMatch) {
      const fn = scope[bareIdMatch[1]];
      if (typeof fn === 'function' && !fn._isSignal) {
        return ($event) => fn($event);
      }
    }

    return null;
  }
`
