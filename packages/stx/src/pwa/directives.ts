/**
 * PWA Template Directives
 *
 * Provides template directives for PWA functionality:
 * - @pwa.installButton - Install prompt button
 * - @pwa.updatePrompt - Update notification UI
 * - @pwa.offlineIndicator - Offline status indicator
 * - @pwa.pushSubscribe - Push notification subscription button
 */

import type { CustomDirective, StxOptions } from '../types'

/**
 * Generate install button HTML and JavaScript
 */
function generateInstallButton(content: string, options: StxOptions): string {
  const themeColor = options.pwa?.manifest?.themeColor || '#4f46e5'

  return `<div class="stx-pwa-install" style="display:none;">
  ${content}
</div>
<script>
(function() {
  let deferredPrompt;
  const installContainer = document.querySelector('.stx-pwa-install');
  const installBtn = installContainer?.querySelector('button, [data-pwa-install]') || installContainer;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installContainer) {
      installContainer.style.display = 'block';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      deferredPrompt = null;
      if (installContainer) {
        installContainer.style.display = 'none';
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    if (installContainer) {
      installContainer.style.display = 'none';
    }
  });

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installContainer) {
      installContainer.style.display = 'none';
    }
  }
})();
</script>`
}

/**
 * Generate update prompt HTML and JavaScript
 */
function generateUpdatePrompt(content: string, options: StxOptions): string {
  const config = options.pwa?.updates
  const message = config?.message || 'A new version is available. Reload to update?'
  const autoReload = config?.autoReload || false

  // If custom content provided, use it; otherwise generate default UI
  const hasCustomContent = content.trim().length > 0

  const defaultUI = `
<div class="stx-pwa-update-banner" style="
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  z-index: 99999;
  transform: translateY(100%);
  transition: transform 0.3s ease;
">
  <span style="font-size: 14px;">${message}</span>
  <div style="display: flex; gap: 12px;">
    <button data-pwa-dismiss style="
      background: transparent;
      border: 1px solid rgba(255,255,255,0.5);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    ">Later</button>
    <button data-pwa-reload style="
      background: white;
      border: none;
      color: #667eea;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    ">Update Now</button>
  </div>
</div>`

  const ui = hasCustomContent ? `<div class="stx-pwa-update" style="display:none;">${content}</div>` : defaultUI

  return `${ui}
<script>
(function() {
  const updateContainer = document.querySelector('.stx-pwa-update, .stx-pwa-update-banner');
  const dismissBtn = updateContainer?.querySelector('[data-pwa-dismiss]');
  const reloadBtn = updateContainer?.querySelector('[data-pwa-reload], button');
  const autoReload = ${autoReload};
  let newWorker = null;

  function showUpdate() {
    if (updateContainer) {
      if (updateContainer.classList.contains('stx-pwa-update-banner')) {
        updateContainer.style.transform = 'translateY(0)';
      } else {
        updateContainer.style.display = 'block';
      }
    }
    if (autoReload) {
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  function hideUpdate() {
    if (updateContainer) {
      if (updateContainer.classList.contains('stx-pwa-update-banner')) {
        updateContainer.style.transform = 'translateY(100%)';
      } else {
        updateContainer.style.display = 'none';
      }
    }
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', hideUpdate);
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  }

  // Listen for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdate();
            }
          });
        }
      });
    });

    // Handle controller change (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Also listen for custom event
  window.addEventListener('pwa-update-available', showUpdate);
})();
</script>`
}

/**
 * Generate offline indicator HTML and JavaScript
 */
function generateOfflineIndicator(content: string, options: StxOptions): string {
  const hasCustomContent = content.trim().length > 0

  const defaultUI = `
<div class="stx-offline-indicator" style="
  position: fixed;
  top: 16px;
  right: 16px;
  background: #ef4444;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  z-index: 99999;
  display: none;
  align-items: center;
  gap: 8px;
">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1"/>
  </svg>
  <span>You are offline</span>
</div>`

  const ui = hasCustomContent ? `<div class="stx-offline-indicator" style="display:none;">${content}</div>` : defaultUI

  return `${ui}
<script>
(function() {
  const indicator = document.querySelector('.stx-offline-indicator');

  function updateStatus() {
    if (indicator) {
      indicator.style.display = navigator.onLine ? 'none' : 'flex';
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
})();
</script>`
}

/**
 * Generate push subscribe button HTML and JavaScript
 */
function generatePushSubscribe(content: string, options: StxOptions): string {
  const pushConfig = options.pwa?.push
  const vapidKey = pushConfig?.vapidPublicKey || ''
  const endpoint = pushConfig?.subscriptionEndpoint || '/api/push/subscribe'

  return `<div class="stx-pwa-push" style="display:none;">
  ${content}
</div>
<script>
(function() {
  const pushContainer = document.querySelector('.stx-pwa-push');
  const pushBtn = pushContainer?.querySelector('button, [data-pwa-push]') || pushContainer;
  const vapidKey = '${vapidKey}';
  const endpoint = '${endpoint}';

  async function checkPushSupport() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[PWA] Push notifications not supported');
      return false;
    }
    return true;
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && vapidKey) {
        // Convert VAPID key
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        // Send subscription to server
        if (endpoint) {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });
        }

        console.log('[PWA] Push subscription created');
        return subscription;
      }

      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  async function init() {
    if (await checkPushSupport()) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && pushContainer) {
        pushContainer.style.display = 'block';
      }
    }
  }

  if (pushBtn) {
    pushBtn.addEventListener('click', subscribeToPush);
  }

  // Check support on load
  if (pushContainer) {
    init();
  }
})();
</script>`
}

/**
 * PWA Install Button Directive
 * Usage: @pwa.installButton ... @endpwa.installButton
 */
export const pwaInstallDirective: CustomDirective = {
  name: 'pwa.installButton',
  handler: (content, _params, context, _filePath) => {
    const options = (context.__stx_options || {}) as StxOptions
    return generateInstallButton(content, options)
  },
  hasEndTag: true,
  description: 'Renders a PWA install prompt button that appears when the app can be installed',
}

/**
 * PWA Update Prompt Directive
 * Usage: @pwa.updatePrompt ... @endpwa.updatePrompt
 */
export const pwaUpdateDirective: CustomDirective = {
  name: 'pwa.updatePrompt',
  handler: (content, _params, context, _filePath) => {
    const options = (context.__stx_options || {}) as StxOptions
    return generateUpdatePrompt(content, options)
  },
  hasEndTag: true,
  description: 'Renders a PWA update notification UI when a new version is available',
}

/**
 * PWA Offline Indicator Directive
 * Usage: @pwa.offlineIndicator ... @endpwa.offlineIndicator
 */
export const pwaOfflineDirective: CustomDirective = {
  name: 'pwa.offlineIndicator',
  handler: (content, _params, context, _filePath) => {
    const options = (context.__stx_options || {}) as StxOptions
    return generateOfflineIndicator(content, options)
  },
  hasEndTag: true,
  description: 'Renders an offline status indicator that shows when the user loses connection',
}

/**
 * PWA Push Subscribe Directive
 * Usage: @pwa.pushSubscribe ... @endpwa.pushSubscribe
 */
export const pwaPushDirective: CustomDirective = {
  name: 'pwa.pushSubscribe',
  handler: (content, _params, context, _filePath) => {
    const options = (context.__stx_options || {}) as StxOptions
    return generatePushSubscribe(content, options)
  },
  hasEndTag: true,
  description: 'Renders a push notification subscription button',
}

/**
 * All PWA directives
 */
export const pwaDirectives: CustomDirective[] = [
  pwaInstallDirective,
  pwaUpdateDirective,
  pwaOfflineDirective,
  pwaPushDirective,
]

/**
 * Register all PWA directives with the config
 */
export function registerPwaDirectives(customDirectives: CustomDirective[]): CustomDirective[] {
  return [...customDirectives, ...pwaDirectives]
}
