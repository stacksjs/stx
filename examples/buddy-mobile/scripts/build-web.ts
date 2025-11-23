/**
 * Build script for Buddy Mobile
 *
 * This script builds the web assets for the mobile app by:
 * 1. Reading the voice-buddy.stx template
 * 2. Processing it for mobile (adding mobile-specific meta tags, etc.)
 * 3. Writing to dist/index.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

const ROOT = dirname(import.meta.dir)
const DIST = join(ROOT, 'dist')
const STX_FILE = join(ROOT, '..', 'voice-buddy.stx')

// Ensure dist directory exists
if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true })
}

// Read the STX template
let html = readFileSync(STX_FILE, 'utf-8')

// Add mobile-specific meta tags and Capacitor bridge
const mobileHead = `
  <!-- Mobile App Meta Tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Buddy">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#1a1a2e">
  <meta name="format-detection" content="telephone=no">

  <!-- iOS Safe Area Support -->
  <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

  <!-- Capacitor -->
  <script src="https://unpkg.com/@aspect/capacitor-core@latest/dist/capacitor.js"></script>
`

// Add mobile-specific styles
const mobileStyles = `
    /* Mobile App Styles */
    html {
      /* iOS safe area support */
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }

    body {
      /* Prevent pull-to-refresh on iOS */
      overscroll-behavior-y: contain;
      /* Prevent text selection on long press */
      -webkit-user-select: none;
      user-select: none;
      /* Prevent callout on long press */
      -webkit-touch-callout: none;
    }

    /* Allow text selection in input fields */
    input, textarea {
      -webkit-user-select: auto;
      user-select: auto;
    }

    /* Mobile header adjustments */
    .header {
      padding-top: max(12px, env(safe-area-inset-top));
      flex-wrap: wrap;
      gap: 10px;
    }

    .header-controls {
      flex-wrap: wrap;
      justify-content: center;
    }

    .repo-input {
      width: 100%;
      max-width: 280px;
    }

    /* Mobile voice control */
    .voice-control {
      flex-wrap: wrap;
      justify-content: center;
    }

    .mic-button {
      width: 70px;
      height: 70px;
    }

    .voice-status {
      width: 100%;
      text-align: center;
    }

    .actions {
      width: 100%;
      justify-content: center;
    }

    /* Mobile footer */
    .footer {
      padding-bottom: max(10px, env(safe-area-inset-bottom));
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .header {
        padding: 10px 15px;
        padding-top: max(10px, env(safe-area-inset-top));
      }

      .driver-selector {
        width: 100%;
        justify-content: center;
      }

      .repo-selector {
        width: 100%;
        flex-wrap: wrap;
        justify-content: center;
      }

      .repo-input {
        width: 100%;
      }

      .github-account {
        width: 100%;
        justify-content: center;
      }

      .terminal-output {
        font-size: 12px;
      }

      .message {
        padding: 10px;
      }

      .mic-button {
        width: 60px;
        height: 60px;
      }

      .mic-icon {
        font-size: 24px;
      }

      .text-input-container {
        flex-wrap: wrap;
      }

      .text-input {
        width: 100%;
      }

      .btn {
        padding: 10px 14px;
        font-size: 12px;
      }

      /* Modal adjustments */
      .modal {
        width: 95%;
        padding: 16px;
      }
    }
`

// Add mobile-specific JavaScript
const mobileScript = `
    // Capacitor integration
    async function initCapacitor() {
      if (typeof Capacitor !== 'undefined') {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const { Keyboard } = await import('@capacitor/keyboard');

        // Set status bar style
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
        } catch (e) {
          console.log('StatusBar not available');
        }

        // Haptic feedback for button presses
        window.hapticFeedback = async (style = 'medium') => {
          try {
            const impactStyle = {
              light: ImpactStyle.Light,
              medium: ImpactStyle.Medium,
              heavy: ImpactStyle.Heavy,
            }[style] || ImpactStyle.Medium;

            await Haptics.impact({ style: impactStyle });
          } catch (e) {
            console.log('Haptics not available');
          }
        };

        // Keyboard handling
        try {
          Keyboard.addListener('keyboardWillShow', (info) => {
            document.body.style.paddingBottom = info.keyboardHeight + 'px';
          });

          Keyboard.addListener('keyboardWillHide', () => {
            document.body.style.paddingBottom = '';
          });
        } catch (e) {
          console.log('Keyboard plugin not available');
        }

        console.log('Capacitor initialized');
      }
    }

    // Add haptic feedback to buttons
    function addHapticFeedback() {
      if (window.hapticFeedback) {
        document.querySelectorAll('.btn, .mic-button').forEach(btn => {
          btn.addEventListener('touchstart', () => window.hapticFeedback('light'));
        });
      }
    }

    // Initialize mobile features after DOM loads
    document.addEventListener('DOMContentLoaded', async () => {
      await initCapacitor();
      addHapticFeedback();
    });
`

// Insert mobile head tags
html = html.replace('</head>', `${mobileHead}\n</head>`)

// Insert mobile styles
html = html.replace('</style>', `${mobileStyles}\n  </style>`)

// Insert mobile script before closing script tag
html = html.replace('</script>\n</body>', `\n${mobileScript}\n  </script>\n</body>`)

// Write the processed HTML
writeFileSync(join(DIST, 'index.html'), html)

console.log('✅ Built mobile web assets to dist/index.html')
console.log('')
console.log('Next steps:')
console.log('  1. Run: bun install')
console.log('  2. Run: npx cap add ios')
console.log('  3. Run: bun run build:ios')
console.log('')
console.log('This will open Xcode where you can:')
console.log('  - Connect your iPhone')
console.log('  - Select your device as the build target')
console.log('  - Click Run to install on your device')
