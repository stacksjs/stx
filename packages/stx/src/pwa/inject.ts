/**
 * PWA HTML Tag Injection
 *
 * Injects PWA-related meta tags, links, and scripts into HTML output.
 * Handles:
 * - manifest.json link
 * - theme-color meta tag
 * - Apple touch icons
 * - Service worker registration script
 */

import type { StxOptions } from '../types'
import { getServiceWorkerFileName } from './service-worker'

/**
 * Generate PWA HTML tags for injection into <head>
 */
export function generatePwaTags(options: StxOptions): string {
  const pwa = options.pwa
  if (!pwa?.enabled) {
    return ''
  }

  const manifest = pwa.manifest
  const iconsDir = pwa.icons?.outputDir ? `/${pwa.icons.outputDir}` : '/pwa-icons'
  const swFileName = getServiceWorkerFileName(options)

  let tags = `
<!-- stx PWA Meta Tags -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="${manifest?.themeColor || '#000000'}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${escapeHtml(manifest?.shortName || manifest?.name || 'App')}">`

  // Apple touch icons
  if (pwa.icons?.generateAppleIcons !== false) {
    tags += `
<link rel="apple-touch-icon" href="${iconsDir}/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="120x120" href="${iconsDir}/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="152x152" href="${iconsDir}/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="${iconsDir}/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="180x180" href="${iconsDir}/apple-touch-icon-180x180.png">`
  }

  // Favicon links
  tags += `
<link rel="icon" type="image/png" sizes="32x32" href="${iconsDir}/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="${iconsDir}/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="192x192" href="${iconsDir}/icon-192x192.png">`

  // Service worker registration script
  tags += `
<!-- stx Service Worker Registration -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/${swFileName}')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content available, refresh to update');
                // Optionally dispatch a custom event for UI notification
                window.dispatchEvent(new CustomEvent('pwa-update-available'));
              }
            });
          }
        });
      })
      .catch(function(error) {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}
</script>
<!-- End stx PWA -->`

  return tags
}

/**
 * Inject PWA tags into HTML document
 */
export function injectPwaTags(html: string, options: StxOptions): string {
  const pwa = options.pwa

  // Skip if PWA is disabled or auto-inject is disabled
  if (!pwa?.enabled || pwa.autoInject === false) {
    return html
  }

  // Skip if already injected (check for marker comment)
  if (html.includes('<!-- stx PWA Meta Tags -->')) {
    return html
  }

  // Check if document has a head tag
  if (!html.includes('</head>')) {
    // No head tag, try body
    if (html.includes('</body>')) {
      const pwaTags = generatePwaTags(options)
      return html.replace('</body>', `${pwaTags}\n</body>`)
    }
    // No body either, append to end
    return html + generatePwaTags(options)
  }

  const pwaTags = generatePwaTags(options)

  // Inject before closing head tag
  return html.replace('</head>', `${pwaTags}\n</head>`)
}

/**
 * Generate standalone service worker registration script
 * Use this if you want to manually add the registration script
 */
export function generateSwRegistrationScript(options: StxOptions): string {
  const pwa = options.pwa
  if (!pwa?.enabled) {
    return ''
  }

  const swFileName = getServiceWorkerFileName(options)

  return `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/${swFileName}')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered:', registration.scope);
      })
      .catch(function(error) {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}
</script>`
}

/**
 * Generate manifest link tag
 */
export function generateManifestLink(): string {
  return '<link rel="manifest" href="/manifest.json">'
}

/**
 * Generate theme color meta tag
 */
export function generateThemeColorMeta(color: string): string {
  return `<meta name="theme-color" content="${escapeHtml(color)}">`
}

/**
 * Escape HTML entities for safe attribute values
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
