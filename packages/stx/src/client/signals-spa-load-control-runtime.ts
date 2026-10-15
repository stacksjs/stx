/** SPA load scheduling and teardown boundaries for the generated client runtime. */
export const SIGNALS_SPA_LOAD_CONTROL_RUNTIME = `  // Re-initialize components after SPA content swap.
  // Debounce to handle rapid re-fires (HMR triggers navigate which triggers stx:load again).
  var _stxLoadTimer = null;
  if (window.__stxLoadHandler) {
    window.removeEventListener('stx:load', window.__stxLoadHandler);
  }
  function stxLoadHandler() {
    if (_stxLoadTimer) { clearTimeout(_stxLoadTimer); }
    _stxLoadTimer = setTimeout(_handleStxLoad, 5);
  }
  window.__stxLoadHandler = stxLoadHandler;
  window.addEventListener('stx:load', stxLoadHandler);

  // Run a pending stx:load now instead of after the debounce. The router's
  // instant navigation (a tab bar) reveals the new screen in a single frame
  // once the page is bound; waiting out the timer revealed it with its
  // {{ }} still unbound and filled it in a frame later.
  function flushStxLoad() {
    if (!_stxLoadTimer) return false;
    clearTimeout(_stxLoadTimer);
    _handleStxLoad();
    return true;
  }
  // The page-level onDestroy callbacks a navigation is leaving behind.
  //
  // stx:load used to run everything in destroyCallbacks, on the reading that
  // the queue held the outgoing page. It does not by then: the router runs the
  // incoming page's scripts BEFORE it fires stx:load, and a page-level
  // onDestroy registered by one of them (a layout partial's useColorMode, a
  // listener, a stream) joined the same queue and was run at once - its owner
  // still on screen. A tab bar that retains screens made it certain, since
  // that path had already filed the outgoing page's callbacks with its screen,
  // so the queue stx:load drained held only the new page's. The page then
  // stopped following the system theme, among other things, until a reload.
  //
  // The router marks the boundary with _beginSwap just before the incoming
  // scripts run. Null means no boundary was marked since the last stx:load (a
  // re-fire, an older router), and then the queue is drained as before.
  var departingDestroys = null;
  function beginSwap() {
    departingDestroys = (departingDestroys || []).concat(destroyCallbacks.splice(0));
  }`
