export const SIGNALS_STORE_REGISTRY_RUNTIME = `    // ── Store System ──
    // Pinia-inspired, signals-based. Stores survive SPA navigation.

    defineStore: function(id, setupOrOptions, storeOptions) {
      console.log('[stx:store] defineStore called:', id, 'type:', typeof setupOrOptions === 'function' ? 'setup' : 'options', 'persist:', !!(storeOptions && storeOptions.persist));
      // Return existing store if already defined.
      //
      // During a store HMR pass the definition is deliberately re-run, so the
      // cached instance must NOT short-circuit it (#1877 ask 4).
      if (window.stx._stores.has(id) && !window.stx.__hmrStoreReplacing) {
        console.log('[stx:store] returning existing store:', id);
        return window.stx._stores.get(id);
      }

      // Determine setup function
      var setupFn;
      if (typeof setupOrOptions === 'function') {
        // Setup style: defineStore('id', () => { ... })
        setupFn = setupOrOptions;
      } else {
        // Options style: defineStore('id', { state, getters, actions })
        var opts = setupOrOptions;
        setupFn = function() {
          var result = {};
          // Convert state to signals
          var initialState = typeof opts.state === 'function' ? opts.state() : (opts.state || {});
          var stateSignals = {};
          for (var key in initialState) {
            stateSignals[key] = state(initialState[key]);
            result[key] = stateSignals[key];
          }
          // Convert getters to derived signals
          if (opts.getters) {
            for (var gKey in opts.getters) {
              (function(getterKey, getterFn) {
                result[getterKey] = derived(function() {
                  // Build state snapshot for getter
                  var snapshot = {};
                  for (var sk in stateSignals) { snapshot[sk] = stateSignals[sk](); }
                  return getterFn(snapshot);
                });
              })(gKey, opts.getters[gKey]);
            }
          }
          // An action that mutates state in place — this.list.push(x),
          // this.list[i] = x, delete this.map[k] — never went through set(),
          // so nothing that read the list re-ran. A detail page upserting the
          // record it had just fetched kept rendering "not found" until some
          // unrelated action happened to reassign the whole list.
          //
          // So an array or plain object read through this comes back as a
          // view that notifies its signal on write. The view is shallow:
          // elements read through it are the raw ones, so identity checks
          // (includes, indexOf, ===) still hold.
          var mutatingArrayMethods = { push: 1, pop: 1, shift: 1, unshift: 1, splice: 1, sort: 1, reverse: 1, fill: 1, copyWithin: 1 };
          var viewRaw = new WeakMap();
          var viewCache = new WeakMap();
          var unwrapView = function(v) {
            return (v && typeof v === 'object' && viewRaw.has(v)) ? viewRaw.get(v) : v;
          };
          var isPlainContainer = function(v) {
            if (!v || typeof v !== 'object') return false;
            if (Array.isArray(v)) return true;
            var proto = Object.getPrototypeOf(v);
            return proto === Object.prototype || proto === null;
          };
          var mutableView = function(sig, raw) {
            var cached = viewCache.get(raw);
            if (cached && cached.sig === sig) return cached.view;
            var view = new Proxy(raw, {
              get: function(target, p) {
                if (Array.isArray(target) && typeof p === 'string' && mutatingArrayMethods[p]) {
                  // One notification per call, not one per index it writes.
                  return function() {
                    var args = Array.prototype.map.call(arguments, unwrapView);
                    var out = Array.prototype[p].apply(target, args);
                    sig.trigger();
                    return out === target ? view : out;
                  };
                }
                return Reflect.get(target, p, target);
              },
              set: function(target, p, v) {
                target[p] = unwrapView(v);
                sig.trigger();
                return true;
              },
              deleteProperty: function(target, p) {
                var had = Object.prototype.hasOwnProperty.call(target, p);
                delete target[p];
                if (had) sig.trigger();
                return true;
              }
            });
            viewRaw.set(view, raw);
            viewCache.set(raw, { sig: sig, view: view });
            return view;
          };
          // Bind actions with proxy for this.propName access
          if (opts.actions) {
            for (var aKey in opts.actions) {
              (function(actionKey, actionFn) {
                result[actionKey] = function() {
                  var proxy = new Proxy({}, {
                    get: function(_, p) {
                      if (result[p] && result[p]._isSignal) {
                        var current = result[p]();
                        return (typeof result[p].trigger === 'function' && isPlainContainer(current))
                          ? mutableView(result[p], current)
                          : current;
                      }
                      if (result[p]) return result[p];
                      return undefined;
                    },
                    set: function(_, p, v) {
                      if (result[p] && result[p]._isSignal) { result[p].set(unwrapView(v)); return true; }
                      return false;
                    }
                  });
                  return actionFn.apply(proxy, arguments);
                };
              })(aKey, opts.actions[aKey]);
            }
          }
          return result;
        };
      }

      // Run setup with store-safe effect tracking (effects are global, not element-scoped)
      var prevDisposers = activeDisposers;
      activeDisposers = null;

      var result;
      try {
        result = setupFn();
      } finally {
        activeDisposers = prevDisposers;
      }

      // Log what the setup returned
      var signalKeys = [];
      var actionKeys = [];
      for (var dk in result) {
        if (result[dk] && result[dk]._isSignal) signalKeys.push(dk);
        else if (typeof result[dk] === 'function') actionKeys.push(dk);
      }
      console.log('[stx:store] setup complete:', id, 'signals:', signalKeys, 'actions:', actionKeys);

      // Capture initial values for $reset
      var _initialValues = {};
      for (var k in result) {
        if (result[k] && result[k]._isSignal) {
          _initialValues[k] = result[k]();
        }
      }

      // Store metadata
      result.$id = id;
      result.$reset = function() {
        batch(function() {
          for (var rk in _initialValues) {
            if (result[rk] && result[rk]._isSignal) result[rk].set(_initialValues[rk]);
          }
        });
      };
      result.$patch = function(partial) {
        batch(function() {
          for (var pk in partial) {
            if (result[pk] && result[pk]._isSignal) result[pk].set(partial[pk]);
          }
        });
      };
      result.$subscribe = function(cb) {
        var unsubs = [];
        for (var sk in result) {
          if (result[sk] && result[sk]._isSignal && result[sk].subscribe) {
            unsubs.push(result[sk].subscribe(function() {
              var snapshot = {};
              for (var ssk in result) {
                if (result[ssk] && result[ssk]._isSignal) snapshot[ssk] = result[ssk]();
              }
              cb(snapshot);
            }));
          }
        }
        return function() { unsubs.forEach(function(u) { u(); }); };
      };
      result.$dispose = function() {
        window.stx._stores.delete(id);
        if (window.__STX_STORES__) delete window.__STX_STORES__[id];
      };

      // Hydration: restore state from SSR
      var hydrationData = window.__STX_STORE_STATE__ && window.__STX_STORE_STATE__[id];
      if (hydrationData) {
        console.log('[stx:store] hydrating from SSR:', id, Object.keys(hydrationData));
        batch(function() {
          for (var hk in hydrationData) {
            if (result[hk] && result[hk]._isSignal) result[hk].set(hydrationData[hk]);
          }
        });
      }

      // Persistence
      var persistCfg = storeOptions && storeOptions.persist;
      if (persistCfg) {
        var pOpts = persistCfg === true ? {} : persistCfg;
        var storageKey = pOpts.key || ('stx-store-' + id);
        var pick = pOpts.pick || null;

        // Three additions, all of which apps previously had to hand-roll outside
        // the store entirely (#1872):
        //
        //   keys        map a field to its OWN storage key, and optionally its own
        //               backend, instead of folding everything into one JSON blob
        //   serialize   / deserialize — the codec was hardcoded to JSON, so a
        //               persisted string came back quoted. A signed-out token
        //               stored as '""' is two characters and TRUTHY, which is a
        //               real class of auth bug, and a legacy raw value could not
        //               be read at all
        //   cookie      a backend the SERVER can read. Server-rendered,
        //               owner-scoped pages authenticate from a cookie and cannot
        //               see localStorage, so this previously meant a second
        //               persisted signal plus a hand-written mirroring effect
        var fieldMap = pOpts.keys || null;
        var defaultSerialize = pOpts.serialize || function(value) { return JSON.stringify(value); };
        var defaultDeserialize = pOpts.deserialize || function(raw) { return JSON.parse(raw); };

        // 'local' and 'localStorage' both accepted; the old code only recognised
        // 'sessionStorage', so 'session' silently fell through to localStorage.
        // Resolved through window when the bare global is absent, so persist also
        // works where the runtime is evaluated outside a page's global scope
        // (component test harnesses, embedded runtimes).
        function _backendFor(kind) {
          if (kind === 'cookie') return 'cookie';
          var scope = typeof window !== 'undefined' ? window : null;
          if (kind === 'session' || kind === 'sessionStorage')
            return typeof sessionStorage !== 'undefined' ? sessionStorage : (scope && scope.sessionStorage);
          return typeof localStorage !== 'undefined' ? localStorage : (scope && scope.localStorage);
        }
        var storageType = _backendFor(pOpts.storage);

        // Resolved config for a field that has its own key, or null if it belongs
        // in the shared blob.
        function _mappedConfig(field) {
          if (!fieldMap || !Object.prototype.hasOwnProperty.call(fieldMap, field)) return null;
          var cfg = fieldMap[field];
          if (typeof cfg === 'string') cfg = { key: cfg };
          cfg = cfg || {};
          return {
            key: cfg.key || field,
            backend: _backendFor(cfg.storage === undefined ? pOpts.storage : cfg.storage),
            cookieOpts: cfg,
            serialize: cfg.serialize || defaultSerialize,
            deserialize: cfg.deserialize || defaultDeserialize
          };
        }

        // A mapped field owns its key, so it must NOT also be written into the
        // blob — otherwise it round-trips through two places that can disagree.
        function _inBlob(field) {
          if (pick && pick.indexOf(field) === -1) return false;
          return !_mappedConfig(field);
        }

        // Read persisted state (overrides hydration)
        try {
          var saved = storageType === 'cookie' ? null : storageType.getItem(storageKey);
          if (saved) {
            var parsed = defaultDeserialize(saved);
            console.log('[stx:store] restoring persisted state:', id, 'key:', storageKey, Object.keys(parsed));
            batch(function() {
              for (var pk in parsed) {
                if (result[pk] && result[pk]._isSignal && _inBlob(pk)) {
                  result[pk].set(parsed[pk]);
                }
              }
            });
          } else {
            console.log('[stx:store] no persisted state found:', id, 'key:', storageKey);
          }
        } catch(e) { console.warn('[stx:store] persistence read error:', id, e); }

        // Per-field persistence: own key, own backend, own codec.
        //
        // The disposer swap is the same trick the blob effect below uses — these
        // effects must outlive the component that happened to instantiate the
        // store, or persistence would stop the first time that component
        // unmounted.
        var prevFieldDisposers = activeDisposers;
        activeDisposers = null;
        if (fieldMap) {
          for (var fk in fieldMap) {
            if (!Object.prototype.hasOwnProperty.call(fieldMap, fk)) continue;
            if (!result[fk] || !result[fk]._isSignal) {
              console.warn('[stx:store] persist.keys names a field that is not a signal:', id, fk);
              continue;
            }
            (function(field, cfg, signal) {
              if (cfg.backend === 'cookie') {
                // useCookie owns path / max-age / SameSite / Secure, so cookie
                // attributes do not have to be reimplemented here. It is a
                // string-valued signal, hence serialize on the way out.
                var cookieSignal = useCookie(cfg.key, cfg.cookieOpts);
                var initialCookie = cookieSignal();
                if (initialCookie !== '' && initialCookie != null) {
                  try { signal.set(cfg.deserialize(initialCookie)); }
                  catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
                }
                effect(function() {
                  var next = signal();
                  try { cookieSignal.set(next == null ? '' : String(cfg.serialize(next))); }
                  catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
                });
                return;
              }
              try {
                var rawValue = cfg.backend.getItem(cfg.key);
                if (rawValue !== null) signal.set(cfg.deserialize(rawValue));
              } catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
              effect(function() {
                var value = signal();
                try { cfg.backend.setItem(cfg.key, String(cfg.serialize(value))); }
                catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
              });
            })(fk, _mappedConfig(fk), result[fk]);
          }
        }
        activeDisposers = prevFieldDisposers;

        // Write on change (debounced)
        var writeTimer = null;
        var prevPersistDisposers = activeDisposers;
        activeDisposers = null;
        effect(function() {
          var snapshot = {};
          var wrote = false;
          for (var wk in result) {
            if (result[wk] && result[wk]._isSignal && _inBlob(wk)) {
              snapshot[wk] = result[wk]();
              wrote = true;
            }
          }
          // With every field mapped to its own key there is no blob left, and
          // writing an empty object would clobber whatever else owns that key.
          if (!wrote || storageType === 'cookie') return;
          if (writeTimer) clearTimeout(writeTimer);
          writeTimer = setTimeout(function() {
            console.log('[stx:store] persisting:', id, 'key:', storageKey, Object.keys(snapshot));
            try { storageType.setItem(storageKey, String(defaultSerialize(snapshot))); } catch(e) { console.warn('[stx:store] persist write error:', id, e); }
          }, 100);
        });
        activeDisposers = prevPersistDisposers;
      }

      // Marker so the template-scope auto-unwrap proxy knows to recursively
      // unwrap signal-valued properties on this object. Script-level callers
      // still see the bare store (so existing patterns like store.someSignal()
      // keep working); only template expression evaluation auto-unwraps.
      result._isStxStore = true;

      // Carry state across a hot replacement.
      //
      // The NEW store object is kept rather than patching the old one: a
      // setup-style store's actions close over the signals created in that
      // same run, so keeping the old signals would leave the new actions
      // writing to signals nothing is watching — an edit that appears to do
      // nothing, which is worse than the reload this replaces. Seeding the new
      // signals with the old values keeps state and behaviour consistent, and
      // the caller re-renders afterwards so components rebind to this object.
      var seed = window.stx.__hmrStoreSeed && window.stx.__hmrStoreSeed[id];
      if (seed) {
        for (var seedKey in seed) {
          var target = result[seedKey];
          if (target && target._isSignal && typeof target.set === 'function' && !target._isDerived) {
            try { target.set(seed[seedKey]); }
            catch (e) { /* shape changed across the edit — keep the new default */ }
          }
        }
      }

      // Register globally
      window.stx._stores.set(id, result);
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      window.__STX_STORES__[id] = result;

      console.log('[stx:store] registered:', id, 'total stores:', window.stx._stores.size);
      return result;
    },

    // Replace the store definitions in place, keeping their state — the
    // acceptHMRUpdate contract (#1877 ask 4). Called by the dev server's HMR
    // client when a file under storesDir changes, instead of reloading the
    // document and throwing away everything the SPA exists to preserve.
    __hmrReplaceStores: function(code) {
      var seed = {};
      window.stx._stores.forEach(function(store, id) {
        var values = {};
        for (var key in store) {
          var value = store[key];
          // Derived values recompute from state, so seeding them would fight
          // their own recomputation.
          if (value && value._isSignal && !value._isDerived) {
            try { values[key] = value.peek ? value.peek() : value(); }
            catch (e) { /* unreadable — let the new default stand */ }
          }
        }
        seed[id] = values;
      });

      window.stx.__hmrStoreSeed = seed;
      window.stx.__hmrStoreReplacing = true;
      var ok = true;
      try {
        // Indirect eval, so the bundle evaluates at global scope the way it
        // does when inlined into the page.
        (0, eval)(code);
      }
      catch (e) {
        ok = false;
        console.error('[stx:hmr] store bundle failed to evaluate:', e);
      }
      finally {
        window.stx.__hmrStoreReplacing = false;
        window.stx.__hmrStoreSeed = null;
      }

      if (!ok) return false;

      // Components captured the PREVIOUS store object from useStore(), so
      // re-render the route to rebind them. Still not a document reload: the
      // swap keeps every non-store signal on the page alive.
      if (window.stxRouter && typeof window.stxRouter.refresh === 'function') {
        try { window.stxRouter.refresh(); }
        catch (e) { /* a refresh that cannot run is not worth a reload here */ }
      }
      return true;
    },

    registerStoresClient: function(stores) {
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      var names = Object.keys(stores || {});
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        window.__STX_STORES__[name] = stores[name];
      }
      window.dispatchEvent(new CustomEvent('stx:stores-ready', { detail: names }));
    },

    useStore: function(id) {
      var store = window.stx._stores.get(id);
      if (!store && window.__STX_STORES__) {
        store = window.__STX_STORES__[id];
      }
      if (!store) {
        console.error('[stx:store] Store not found:', id, 'available:', Array.from(window.stx._stores.keys()));
        throw new Error('[stx] Store "' + id + '" not found. Define it with defineStore() first.');
      }
      console.log('[stx:store] useStore:', id);
      return store;
    },`

