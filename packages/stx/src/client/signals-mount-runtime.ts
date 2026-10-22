export const SIGNALS_MOUNT_RUNTIME = `    mountEl: function(selector, setupFn) {
      function doMount() {
        var root = document.querySelector(selector);
        if (!root) { console.warn('[stx] mountEl: element not found:', selector); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        // The setup's hooks are collected off the global queues below, so an
        // outer flush's destroy sink must not catch them first (see mount).
        var outerSink = activeDestroySink;
        activeDestroySink = null;
        var scope;
        // Its effects too: they go with the root's bindings (__stx_disposers).
        var endSetupEffects = beginEffects();
        var disposeSetupEffects;
        try { scope = setupFn(); }
        finally {
          activeDestroySink = outerSink;
          disposeSetupEffects = endSetupEffects();
        }

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          root.__stx_scope = scope;
        }

        var disposeEffects = trackEffects(function() {
          processElement(root, mergeTemplateScopes(componentScope, (scope || {})));
        });
        root.__stx_disposers = function() { disposeEffects(); disposeSetupEffects(); };

        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        // Through runMountCallbacks, so an onDestroy called inside one of
        // them lands here too rather than on the global queue (#1958).
        runMountCallbacks(localMountHooks, localDestroyHooks);

        root.__stx_destroy = localDestroyHooks;
      }

      if (document.readyState === 'loading') {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    },
    mount: function(setupFn) {
      console.log('[mount] called');
      // Capture script reference synchronously (only valid during execution)
      var scriptEl = document.currentScript;

      function doMount() {
        // Auto-mount scripts are emitted after their component template. Other
        // generated helper scripts can sit between the rendered root and this
        // script, so walk past script/style siblings before selecting the root.
        // Router-injected page scripts are marked data-stx-page and must use the
        // content-container fallback below instead.
        var isSpaPageScript = scriptEl && scriptEl.hasAttribute
          && scriptEl.hasAttribute('data-stx-page')
          && !scriptEl.hasAttribute('data-stx-positioned');
        var root = null;
        if (scriptEl && !isSpaPageScript) {
          var previous = scriptEl.previousElementSibling;
          while (previous && (previous.tagName === 'SCRIPT' || previous.tagName === 'STYLE'))
            previous = previous.previousElementSibling;

          var next = scriptEl.nextElementSibling;
          while (next && (next.tagName === 'SCRIPT' || next.tagName === 'STYLE'))
            next = next.nextElementSibling;

          root = previous || next || scriptEl.parentElement;
        }

        // SPA fallback: during router navigation, script is appended to body>
        // (not inside the content container), so nextElementSibling won't find the page content.
        // Only use fallback when we genuinely couldn't find a suitable root element.
        // Do NOT fallback just because the script is in body> — layout scripts in body>
        // with valid siblings (e.g. sidebar <aside>) should use those siblings as root.

        // An x-data root that initScope has not claimed yet is not ours to mount.
        //
        // The element carries its own state expression and the reactive runtime
        // owns it; data-stx-scope is on it from the server, but the id is not
        // in stx._scopes until initScope runs, which on a navigation happens
        // later in the stx:load handler. Mounting it in the meantime binds its
        // whole subtree against whatever scope the mounting script brought.
        //
        // That is what a layout script did after every SPA navigation. Its own
        // re-executed script now lands inside the content container next to the
        // incoming page, so previousElementSibling resolved to the *page's*
        // x-data root; mount() adopted it and ran processElement over it with the
        // sidebar's scope. Every :for template inside was consumed against a
        // scope holding none of the page's data, and bindFor replaces each
        // template with its stx-for anchor on that single pass — so the markup a
        // retry needed was gone, and the effect had read no signal to re-run on.
        // The list stayed empty for the life of the page while its state sat
        // fully populated beside it. Cold loads never hit it: there the page's
        // own script mounts first, with the right scope.
        //
        // Registered scopes are left alone, so an element the reactive runtime
        // has already initialised keeps whatever behaviour it had.
        function awaitingReactiveInit(el) {
          if (!el || !el.hasAttribute || !el.hasAttribute('data-stx-xdata'))
            return false;
          var id = el.getAttribute('data-stx-scope');
          return !(id && window.stx && window.stx._scopes && window.stx._scopes[id]);
        }

        var needsFallback = !root || root === document.body
          || (root && root.tagName === 'SCRIPT')
          || awaitingReactiveInit(root);
        if (needsFallback) {
          var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
          var container = document.querySelector('[data-stx-content]')
            || document.querySelector('[data-stx-router-container]')
            || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
            || document.querySelector('main')
            || document.querySelector('#content');
          if (container) {
            // Use the container itself as root — process ALL content inside it
            root = container;
            // But if a specific child is already mounted, find first unmounted one instead
            var hasMount = false;
            var children = container.children;
            for (var ci = 0; ci < children.length; ci++) {
              if (children[ci].__stx_scope) { hasMount = true; break; }
            }
            if (hasMount) for (var ci = 0; ci < children.length; ci++) {
              var candidate = children[ci];
              if (candidate.__stx_scope || candidate.tagName === 'SCRIPT') continue;
              if (awaitingReactiveInit(candidate)) continue;
              root = candidate;
              break;
            }
          }
        }

        // The fallback can still land on one (a container whose only unmounted
        // child is the incoming page). Processing the container instead is safe:
        // processElement skips [data-stx-scope] children, so the reactive
        // runtime keeps its subtree and binds it with the right scope.
        if (awaitingReactiveInit(root)) {
          var reactiveOwnerParent = root.parentElement;
          root = reactiveOwnerParent && reactiveOwnerParent !== document.body ? reactiveOwnerParent : null;
        }

        if (!root) { console.warn('[stx] mount: no root element found'); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        // Track lifecycle hooks registered during setup
        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        // Run setup function — returns scope object with declarations
        //
        // With no outer destroy sink (#1958). This can run inside another
        // component's onMount, where runMountCallbacks has pointed onDestroy at
        // THAT component's queue. The setup's own teardown (a composable such
        // as useEventListener registers its removal with onDestroy) must land
        // on the global queue, where the splice below collects it for this
        // root. Otherwise it belonged to the outer component and outlived this
        // root: mounted on a :for row, removing the row left its listener in.
        var outerSink = activeDestroySink;
        activeDestroySink = null;
        var scope;
        // Its effects too: they go with the root's bindings (__stx_disposers).
        var endSetupEffects = beginEffects();
        var disposeSetupEffects;
        try { scope = setupFn(); }
        finally {
          activeDestroySink = outerSink;
          disposeSetupEffects = endSetupEffects();
        }
        console.log('[mount] root:', root.tagName, 'scope keys:', scope ? Object.keys(scope).slice(0, 10) : 'null');

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        // Capture mount/destroy hooks added during setup
        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        // Register scope
        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          // An auto-mounted page can start with a shared component. That
          // wrapper already owns a component scope: the page supplies its
          // caller, not a replacement for its handlers/refs/prop signals.
          if (root.hasAttribute('data-stx-component-wrapper')) root.__stx_parent_scope = scope;
          else root.__stx_scope = scope;
          assignTemplateScope(componentScope, scope);  // Keep for backwards compat
        }

        // Walk DOM and bind directives, tracking effects for cleanup
        var disposeEffects = trackEffects(function() {
          processElement(root, mergeTemplateScopes(componentScope, (scope || {})));
        });
        root.__stx_disposers = function() { disposeEffects(); disposeSetupEffects(); };

        // Remove x-cloak after bindings are applied (prevents FOUC)
        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        // Fire mount hooks
        // Through runMountCallbacks, so an onDestroy called inside one of
        // them lands here too rather than on the global queue (#1958).
        runMountCallbacks(localMountHooks, localDestroyHooks);

        // Store cleanup on element for auto-destroy
        root.__stx_destroy = localDestroyHooks;
      }

      var isRoutedMount = scriptEl && scriptEl.hasAttribute
        && scriptEl.hasAttribute('data-stx-page');
      if (document.readyState === 'loading' || isRoutedMount) {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    }`

