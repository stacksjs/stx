/**
 * Build Buddy iOS using Craft's iOS tooling
 *
 * This script:
 * 1. Processes voice-buddy.stx for iOS
 * 2. Builds the Xcode project using Craft
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { build } from '/Users/chrisbreuer/Code/craft/packages/ios/dist/index.js'
// Can also use: bun /Users/chrisbreuer/Code/craft/packages/typescript/bin/cli.ts ios build

const ROOT = dirname(dirname(import.meta.dir))
const IOS_ROOT = dirname(import.meta.dir)
const DIST = join(IOS_ROOT, 'dist')
const STX_FILE = join(ROOT, 'voice-buddy.stx')

// Ensure dist directory exists
if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true })
}

console.log('\n📦 Building Buddy for iOS...')

// Read the STX template
let html = readFileSync(STX_FILE, 'utf-8')

// Add Craft iOS bridge integration
const craftBridge = `
    // Craft iOS Bridge Integration
    (function() {
      // Wait for Craft bridge
      window.addEventListener('craftReady', (e) => {
        console.log('Craft bridge ready:', e.detail);

        // Override mic button to use native speech
        const micBtn = document.querySelector('.mic-button');
        if (micBtn && e.detail.capabilities.speechRecognition) {
          micBtn.addEventListener('click', () => {
            if (window.isListening) {
              window.craft.stopListening();
            } else {
              window.craft.startListening();
            }
            window.isListening = !window.isListening;
          });
        }

        // Add haptic feedback to all buttons
        if (e.detail.capabilities.haptics) {
          document.querySelectorAll('.btn, .mic-button').forEach(btn => {
            btn.addEventListener('touchstart', () => window.craft.haptic('light'));
          });
        }
      });

      // Handle native speech events
      window.addEventListener('craftSpeechStart', () => {
        window.isListening = true;
        const status = document.querySelector('.voice-status');
        if (status) status.textContent = 'Listening...';
        const micBtn = document.querySelector('.mic-button');
        if (micBtn) micBtn.classList.add('listening');
      });

      window.addEventListener('craftSpeechResult', (e) => {
        const { transcript, isFinal } = e.detail;
        const input = document.querySelector('.text-input');
        if (input) input.value = transcript;

        const status = document.querySelector('.voice-status');
        if (status) {
          status.textContent = isFinal ? 'Tap to speak' : 'Listening...';
        }
      });

      window.addEventListener('craftSpeechEnd', () => {
        window.isListening = false;
        const status = document.querySelector('.voice-status');
        if (status) status.textContent = 'Tap to speak';
        const micBtn = document.querySelector('.mic-button');
        if (micBtn) micBtn.classList.remove('listening');
      });

      window.addEventListener('craftSpeechError', (e) => {
        window.isListening = false;
        const status = document.querySelector('.voice-status');
        if (status) status.textContent = 'Error: ' + (e.detail.error || 'Unknown');
        const micBtn = document.querySelector('.mic-button');
        if (micBtn) micBtn.classList.remove('listening');
      });
    })();
`

// Add iOS-specific styles
const iosStyles = `
    /* iOS Native App Styles */
    html {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }

    body {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      overscroll-behavior-y: contain;
    }

    input, textarea {
      -webkit-user-select: auto;
      user-select: auto;
    }

    .mic-button {
      -webkit-tap-highlight-color: transparent;
    }
`

// Insert iOS styles
html = html.replace('</style>', `${iosStyles}\n  </style>`)

// Insert Craft bridge script before closing body
html = html.replace('</body>', `<script>${craftBridge}</script>\n</body>`)

// Write the processed HTML
writeFileSync(join(DIST, 'index.html'), html)
console.log('✅ Web assets built to dist/index.html')

// Build Xcode project using Craft
await build({
  output: IOS_ROOT,
})

console.log('')
console.log('Run: bun run open')
