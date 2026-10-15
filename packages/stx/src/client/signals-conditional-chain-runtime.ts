/** Conditional-chain discovery helpers for the generated client runtime. */
export const SIGNALS_CONDITIONAL_CHAIN_RUNTIME = `  var __bindIfCounter = 0;
  // ── x-else / x-else-if chain support (stacksjs/stx#1734) ──────────────
  // Returns { name, terminal } for an else/else-if attribute present on el,
  // or null. terminal=true for the catch-all x-else (no further siblings
  // join the chain). Checks all three prefixes (:, x-, @).
  function getElseAttrInfo(el) {
    if (!el || !el.hasAttribute) return null;
    if (el.hasAttribute(':else-if')) return { name: ':else-if', terminal: false };
    if (el.hasAttribute('x-else-if')) return { name: 'x-else-if', terminal: false };
    if (el.hasAttribute('@else-if')) return { name: '@else-if', terminal: false };
    if (el.hasAttribute(':else')) return { name: ':else', terminal: true };
    if (el.hasAttribute('x-else')) return { name: 'x-else', terminal: true };
    if (el.hasAttribute('@else')) return { name: '@else', terminal: true };
    return null;
  }

  // Walk forward from an x-if/:if/@if head element collecting consecutive
  // else-if/else siblings (nextElementSibling skips text/comment nodes, so
  // whitespace between branches is tolerated — matches Vue). Returns a chain
  // array whose first entry is the if head; trailing x-else (if any) has
  // expr=null and terminal=true.
  function findIfChain(el, ifAttr) {
    var chain = [{ el: el, attr: ifAttr, expr: el.getAttribute(ifAttr), terminal: false }];
    var sib = el.nextElementSibling;
    while (sib) {
      var info = getElseAttrInfo(sib);
      if (!info) break;
      chain.push({
        el: sib,
        attr: info.name,
        expr: info.terminal ? null : sib.getAttribute(info.name),
        terminal: info.terminal,
      });
      if (info.terminal) break; // x-else is the chain terminator
      sib = sib.nextElementSibling;
    }
    return chain;
  }
`
