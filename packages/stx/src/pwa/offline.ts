/**
 * PWA Offline Page Generation
 *
 * Generates an offline fallback page for when the user loses network connectivity.
 * Supports custom .stx templates or generates a default styled page.
 */

import type { StxOptions } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Generate offline fallback page HTML
 *
 * If a custom offline page is specified in config, it will be processed.
 * Otherwise, a default styled offline page is generated.
 */
export async function generateOfflinePage(options: StxOptions): Promise<string> {
  const offlineConfig = options.pwa?.offline

  if (!offlineConfig?.enabled) {
    return ''
  }

  // If custom offline page specified, try to load and process it
  if (offlineConfig.page) {
    const offlinePath = path.isAbsolute(offlineConfig.page)
      ? offlineConfig.page
      : path.resolve(process.cwd(), offlineConfig.page)

    if (fs.existsSync(offlinePath)) {
      try {
        // Dynamically import processDirectives to avoid circular dependencies
        const { processDirectives } = await import('../process')
        const content = await Bun.file(offlinePath).text()
        const dependencies = new Set<string>()
        return await processDirectives(content, {}, offlinePath, options, dependencies)
      }
      catch (error) {
        console.warn(`[PWA] Failed to process custom offline page: ${error}`)
        // Fall through to default page
      }
    }
    else {
      console.warn(`[PWA] Custom offline page not found: ${offlinePath}`)
    }
  }

  // Generate default offline page
  return generateDefaultOfflinePage(options)
}

/**
 * Generate the default offline page HTML
 */
function generateDefaultOfflinePage(options: StxOptions): string {
  const offlineConfig = options.pwa?.offline
  const manifest = options.pwa?.manifest

  const title = offlineConfig?.fallbackTitle || 'You are offline'
  const message = offlineConfig?.fallbackMessage || 'Please check your internet connection and try again.'
  const themeColor = manifest?.themeColor || '#4f46e5'
  const appName = manifest?.shortName || manifest?.name || 'App'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="${themeColor}">
  <title>${escapeHtml(title)} - ${escapeHtml(appName)}</title>
  <style>
    :root {
      --theme-color: ${themeColor};
      --text-primary: #1a1a2e;
      --text-secondary: #666;
      --bg-gradient-start: #f5f7fa;
      --bg-gradient-end: #c3cfe2;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --text-primary: #f0f0f0;
        --text-secondary: #a0a0a0;
        --bg-gradient-start: #1a1a2e;
        --bg-gradient-end: #16213e;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
      padding: 20px;
    }

    .offline-container {
      text-align: center;
      max-width: 400px;
      padding: 48px 40px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    @media (prefers-color-scheme: dark) {
      .offline-container {
        background: #242438;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      }
    }

    .offline-icon {
      width: 96px;
      height: 96px;
      margin-bottom: 28px;
      color: var(--theme-color);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }

    p {
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 32px;
      font-size: 16px;
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 36px;
      background: var(--theme-color);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
    }

    .retry-btn:active {
      transform: translateY(0);
    }

    .retry-btn svg {
      width: 18px;
      height: 18px;
    }

    .status-indicator {
      margin-top: 24px;
      padding: 10px 16px;
      background: rgba(255, 193, 7, 0.1);
      border-radius: 8px;
      font-size: 14px;
      color: #b8860b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .status-indicator {
        background: rgba(255, 193, 7, 0.15);
        color: #ffc107;
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #ffc107;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .online .status-indicator {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
    }

    @media (prefers-color-scheme: dark) {
      .online .status-indicator {
        background: rgba(40, 167, 69, 0.15);
      }
    }

    .online .status-dot {
      background: #28a745;
      animation: none;
    }
  </style>
</head>
<body>
  <div class="offline-container" id="container">
    <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 1l22 22"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1"/>
    </svg>

    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>

    <button class="retry-btn" onclick="window.location.reload()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
      Try Again
    </button>

    <div class="status-indicator">
      <span class="status-dot"></span>
      <span id="status-text">Waiting for connection...</span>
    </div>
  </div>

  <script>
    // Update status and auto-reload when online
    function updateStatus() {
      const container = document.getElementById('container');
      const statusText = document.getElementById('status-text');

      if (navigator.onLine) {
        container.classList.add('online');
        statusText.textContent = 'Back online! Reloading...';
        setTimeout(() => window.location.reload(), 1000);
      } else {
        container.classList.remove('online');
        statusText.textContent = 'Waiting for connection...';
      }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Initial check
    updateStatus();

    // Periodic check every 5 seconds
    setInterval(() => {
      if (!navigator.onLine) {
        // Try to fetch a small resource to verify connectivity
        fetch('/', { method: 'HEAD', cache: 'no-store' })
          .then(() => {
            // If fetch succeeds, we're actually online
            updateStatus();
          })
          .catch(() => {
            // Still offline
          });
      }
    }, 5000);
  </script>
</body>
</html>`
}

/**
 * Escape HTML entities for safe output
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
