/**
 * STX Media - Media Manager Embedding
 *
 * Embed a media manager UI via CDN script injection.
 *
 * @module media/manager/embed
 */

import type { MediaManagerConfig } from '../types'

// =============================================================================
// Media Manager Embedding
// =============================================================================

/**
 * Generate HTML and script for embedding a media manager
 *
 * @example
 * ```typescript
 * const { html, script } = generateMediaManagerEmbed({
 *   src: 'https://media-manager.example.com/embed.js',
 *   apiKey: 'your-api-key',
 *   bucket: 'uploads',
 * })
 * ```
 */
export function generateMediaManagerEmbed(config: MediaManagerConfig): { html: string; script: string } {
  const {
    src,
    apiKey,
    bucket,
    allowedTypes,
    maxFileSize,
    multiple = false,
    customStyles = {},
    callbacks = {},
  } = config

  const containerId = `stx-media-manager-${Math.random().toString(36).slice(2, 8)}`

  // Generate configuration object
  const managerConfig: Record<string, unknown> = {
    container: `#${containerId}`,
  }

  if (apiKey) managerConfig.apiKey = apiKey
  if (bucket) managerConfig.bucket = bucket
  if (allowedTypes) managerConfig.allowedTypes = allowedTypes
  if (maxFileSize) managerConfig.maxFileSize = maxFileSize
  if (multiple) managerConfig.multiple = multiple
  if (Object.keys(customStyles).length > 0) managerConfig.styles = customStyles

  // HTML container
  const html = `<div id="${containerId}" class="stx-media-manager"></div>`

  // Generate callback handlers
  const callbackHandlers = Object.entries(callbacks)
    .filter(([, handler]) => handler)
    .map(([event, handler]) => {
      const eventName = event.replace(/^on/, '').toLowerCase()
      return `manager.on('${eventName}', ${handler});`
    })
    .join('\n    ')

  // Script to load and initialize
  const script = `
(function() {
  // Load media manager script
  var script = document.createElement('script');
  script.src = '${escapeAttr(src)}';
  script.async = true;

  script.onload = function() {
    // Initialize manager
    if (typeof MediaManager !== 'undefined') {
      var manager = new MediaManager(${JSON.stringify(managerConfig)});
      ${callbackHandlers}
      manager.init();

      // Expose manager instance
      window.STX = window.STX || {};
      window.STX.mediaManager = manager;
    }
  };

  script.onerror = function() {
    console.error('[stx] Failed to load media manager from:', '${escapeAttr(src)}');
  };

  document.head.appendChild(script);
})();
`.trim()

  return { html, script }
}

/**
 * Generate a simple media picker modal
 *
 * For use when a full media manager is not available,
 * provides a basic file browser interface.
 */
export function generateSimpleMediaPicker(options: {
  accept?: string
  multiple?: boolean
  onSelect?: string
}): { html: string; script: string; css: string } {
  const { accept = 'image/*', multiple = false, onSelect = 'handleMediaSelect' } = options
  const pickerId = `stx-picker-${Math.random().toString(36).slice(2, 8)}`

  const html = `
<div id="${pickerId}" class="stx-media-picker" style="display:none;">
  <div class="stx-media-picker-backdrop"></div>
  <div class="stx-media-picker-modal">
    <div class="stx-media-picker-header">
      <h3>Select Media</h3>
      <button class="stx-media-picker-close" data-close>&times;</button>
    </div>
    <div class="stx-media-picker-body">
      <input type="file" accept="${accept}" ${multiple ? 'multiple' : ''} data-input />
      <div class="stx-media-picker-preview" data-preview></div>
    </div>
    <div class="stx-media-picker-footer">
      <button class="stx-media-picker-cancel" data-close>Cancel</button>
      <button class="stx-media-picker-confirm" data-confirm>Select</button>
    </div>
  </div>
</div>
`.trim()

  const script = `
(function() {
  var picker = document.getElementById('${pickerId}');
  if (!picker) return;

  var input = picker.querySelector('[data-input]');
  var preview = picker.querySelector('[data-preview]');
  var selectedFiles = [];

  // Open picker
  window.STX = window.STX || {};
  window.STX.openMediaPicker = function() {
    picker.style.display = 'flex';
  };

  window.STX.closeMediaPicker = function() {
    picker.style.display = 'none';
    input.value = '';
    preview.innerHTML = '';
    selectedFiles = [];
  };

  // Close handlers
  picker.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', window.STX.closeMediaPicker);
  });

  picker.querySelector('.stx-media-picker-backdrop').addEventListener('click', window.STX.closeMediaPicker);

  // File selection
  input.addEventListener('change', function(e) {
    selectedFiles = Array.from(e.target.files);
    preview.innerHTML = '';

    selectedFiles.forEach(function(file) {
      var item = document.createElement('div');
      item.className = 'stx-media-picker-item';

      if (file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function(e) {
          item.innerHTML = '<img src="' + e.target.result + '" alt="' + file.name + '" />';
        };
        reader.readAsDataURL(file);
      } else {
        item.textContent = file.name;
      }

      preview.appendChild(item);
    });
  });

  // Confirm selection
  picker.querySelector('[data-confirm]').addEventListener('click', function() {
    if (selectedFiles.length > 0 && typeof ${onSelect} === 'function') {
      ${onSelect}(selectedFiles);
    }
    window.STX.closeMediaPicker();
  });
})();
`.trim()

  const css = `
.stx-media-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.stx-media-picker-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.stx-media-picker-modal {
  position: relative;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.stx-media-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.stx-media-picker-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.stx-media-picker-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.stx-media-picker-body {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.stx-media-picker-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.stx-media-picker-item {
  aspect-ratio: 1;
  background: #f3f4f6;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.stx-media-picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stx-media-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.stx-media-picker-footer button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.stx-media-picker-cancel {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.stx-media-picker-confirm {
  background: #3b82f6;
  border: none;
  color: white;
}
`.trim()

  return { html, script, css }
}

// =============================================================================
// Helpers
// =============================================================================

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
