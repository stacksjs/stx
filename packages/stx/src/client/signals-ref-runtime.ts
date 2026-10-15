/** Template ref accessor used by page and component scopes. */
export const SIGNALS_REF_RUNTIME = `  // ==========================================================================
  // Template Refs (useRef)
  // ==========================================================================

  function useRef(name) {
    // A ref belongs to the component scope that created it. Capturing that
    // owner now is essential: componentScope is a mutable compatibility
    // fallback and changes while the rest of the page hydrates. Reading it
    // from the getter made an early component resolve refs from whichever
    // component happened to hydrate last.
    var ownerScope = currentLifecycleScope() || componentScope;
    var ownerRefs = ownerScope.$refs || (ownerScope.$refs = {});

    // Callable, as well as .current / .value.
    //
    // Every other accessor a script destructures alongside this one is
    // call-style — state(), derived(), useReactiveProp() — so myRef() is what
    // a reader reaches for, and it used to throw "myRef is not a function".
    // Inside effect()'s first run that throw escaped the effect, escaped the
    // generated setup function, and left the WHOLE page unhydrated: every
    // @click inert, every interpolation unbound, the markup otherwise
    // perfect. Either API alone looked fine, which is what made it hard to
    // see. Same reasoning as useCookie becoming a Signal in #1710.
    //
    // No backticks in here: this whole runtime is a template literal.
    var read = function () {
      return ownerRefs[name] || null;
    };
    Object.defineProperty(read, 'current', { get: read, enumerable: true });
    Object.defineProperty(read, 'value', { get: read, enumerable: true });
    return read;
  }
`
