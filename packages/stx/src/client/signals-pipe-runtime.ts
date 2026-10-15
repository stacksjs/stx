/** Pipe expression parsing and execution for client template bindings. */
export const SIGNALS_PIPE_RUNTIME = `  // ==========================================================================
  // Pipe Syntax Support (Feature #2)
  // ==========================================================================

  // Parse and execute pipe expressions like "value | fmt" or "value | truncate:20"
  // Must distinguish single | (pipe) from || (logical OR) and ?? (nullish coalescing)
  function parsePipeExpression(expr, scope) {
    // Find pipe operators: single | that's not part of || or preceded by ?
    // We need to find | that is:
    // 1. Not preceded by | or ?
    // 2. Not followed by |
    // Use a manual scan to handle this correctly
    let pipeIndex = -1;
    let inString = false;
    let stringChar = '';
    let depth = 0; // Track parentheses/brackets depth

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      const prevChar = i > 0 ? expr[i - 1] : '';
      const nextChar = i < expr.length - 1 ? expr[i + 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'" || char === '\`') && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        }
else if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      // Track depth for parentheses and brackets
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;

      // Only look for pipes at top level (depth 0)
      if (depth !== 0) continue;

      // Check for single pipe (not || and not ??)
      if (char === '|') {
        // Skip if it's || (logical OR)
        if (nextChar === '|') {
          i++; // Skip next |
          continue;
        }
        // Skip if preceded by | (second part of ||)
        if (prevChar === '|') continue;
        // Skip if preceded by ? (part of ??)
        if (prevChar === '?') continue;

        // Found a pipe operator
        pipeIndex = i;
        break;
      }
    }

    if (pipeIndex === -1) return null;

    const valueExpr = expr.slice(0, pipeIndex).trim();
    const pipeChain = expr.slice(pipeIndex + 1).trim();

    // Parse all pipes in the chain, being careful about || and ??
    const pipes = [];
    let currentPipe = '';
    inString = false;
    stringChar = '';
    depth = 0;

    for (let i = 0; i < pipeChain.length; i++) {
      const char = pipeChain[i];
      const prevChar = i > 0 ? pipeChain[i - 1] : '';
      const nextChar = i < pipeChain.length - 1 ? pipeChain[i + 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'" || char === '\`') && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        }
else if (char === stringChar) {
          inString = false;
        }
        currentPipe += char;
        continue;
      }

      if (inString) {
        currentPipe += char;
        continue;
      }

      // Track depth
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;

      // Check for pipe at top level
      if (depth === 0 && char === '|' && nextChar !== '|' && prevChar !== '|' && prevChar !== '?') {
        // End of current pipe, start new one
        if (currentPipe.trim()) {
          const parts = currentPipe.trim().split(':');
          pipes.push({
            name: parts[0].trim(),
            args: parts.slice(1).map(a => a.trim())
          });
        }
        currentPipe = '';
      }
else {
        currentPipe += char;
      }
    }

    // Add last pipe
    if (currentPipe.trim()) {
      const parts = currentPipe.trim().split(':');
      pipes.push({
        name: parts[0].trim(),
        args: parts.slice(1).map(a => a.trim())
      });
    }

    if (pipes.length === 0) return null;

    return { valueExpr, pipes };
  }

  function executePipeExpression(valueExpr, pipes, scope) {
    // First evaluate the base expression
    let value;
    try {
      const fn = __stxCompileScoped(scope, [], 'return ' + valueExpr);
      value = fn(...__stxArgs(fn, scope));
    }
catch (e) {
      if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Pipe base expression error:', valueExpr, e);
      return '';
    }

    // Apply each pipe/filter
    for (const pipe of pipes) {
      const filterFn = scope[pipe.name] || globalHelpers[pipe.name];
      if (typeof filterFn === 'function') {
        try {
          // Parse args - they might be numbers, strings, or expressions
          const parsedArgs = pipe.args.map(arg => {
            // Try to parse as number
            if (/^-?\\d+(\\.\\d+)?$/.test(arg)) return Number(arg);
            // Try to parse as string (quoted)
            if (/^['"].*['"]$/.test(arg)) return arg.slice(1, -1);
            // Try to evaluate as expression in scope
            try {
              const fn = __stxCompileScoped(scope, [], 'return ' + arg);
              return fn(...__stxArgs(fn, scope));
            }
catch (e) {
              return arg;
            }
          });
          value = filterFn(value, ...parsedArgs);
        }
catch (e) {
          if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Pipe filter error:', pipe.name, e);
        }
      }
else {
        console.warn('[STX] Unknown pipe/filter:', pipe.name);
      }
    }

    return value;
  }
`
