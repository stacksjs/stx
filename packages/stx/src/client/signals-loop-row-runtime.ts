/** Loop-row ownership and placeholder helpers for the generated client runtime. */
export const SIGNALS_LOOP_ROW_RUNTIME = `  // A loop row binds in its own iteration scope, and only its loop puts it
  // there. A walk from further out (an enclosing :if hydrating the branch it
  // shows) carries no item, so it used to bind whatever in the row was still
  // unbound -- a conditional's children, waiting for their own deferred pass
  // -- against a scope without the row: on a native screen every card's
  // compliance chip came out empty. Such a walk now leaves the row alone.
  function markLoopRow(row, itemName, itemSignal) {
    row.__stx_loop_row = { name: itemName, signal: itemSignal };
  }
  function isForeignToLoopRow(el, scope) {
    var row = el.__stx_loop_row;
    return !!row && (!scope || scope[row.name] !== row.signal);
  }

  // Where a structural directive's output goes is wherever its placeholder
  // is NOW, not the parent it was bound under. Something may move the
  // placeholder after binding: the router adopts the first page into a
  // retained screen (<div data-stx-screen>) by moving the container's
  // children, and an app may move a node itself. A :for or :if at the top
  // level of a page kept inserting into the container while its placeholder
  // sat in the screen, and the browser threw "insertBefore: the node before
  // which the new node is to be inserted is not a child of this node" -- the
  // page went blank the first time a top-level condition changed. The
  // if/else chain has always inserted at its placeholder's parent; :if and
  // :for now do the same. Hidden nodes registered on the old parent (#1954)
  // follow, so a later disposal walk of the new one still finds them.
  function followPlaceholder(placeholder, parent, nodes) {
    var now = placeholder.parentNode;
    if (!now || now === parent) return parent;
    var held = parent && parent.__stx_detached_if;
    if (held && nodes) {
      nodes.forEach(function(node) {
        if (!held.has(node)) return;
        held.delete(node);
        if (!now.__stx_detached_if) now.__stx_detached_if = new Set();
        now.__stx_detached_if.add(node);
      });
    }
    return now;
  }
`
