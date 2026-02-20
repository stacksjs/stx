/**
 * STX Media - Upload Component
 *
 * File upload with progress tracking, validation, and preview generation.
 *
 * @module media/upload/component
 */

import type {
  MediaUploadProps,
  UploadConfig,
} from '../types'

// =============================================================================
// Component Rendering
// =============================================================================

/**
 * Render a file upload component
 *
 * @example
 * ```typescript
 * const html = renderMediaUpload({
 *   endpoint: '/api/upload',
 *   accept: 'image/*',
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   preview: true,
 *   dropzone: true,
 * })
 * ```
 */
export function renderMediaUpload(props: MediaUploadProps): { html: string; script: string; css: string } {
  const {
    endpoint,
    accept,
    maxSize,
    maxFiles = 1,
    fieldName = 'file',
    preview = false,
    dropzone = true,
    multiple = false,
    autoUpload = true,
    showProgress = true,
    disabled = false,
    placeholder = 'Drop files here or click to select',
    label,
  } = props

  const className = props.class || ''
  const style = props.style || ''
  const id = props.id || `stx-upload-${Math.random().toString(36).slice(2, 8)}`

  // Build accept string
  const acceptAttr = Array.isArray(accept) ? accept.join(',') : accept

  // HTML template
  const html = `
<div id="${id}" class="stx-upload${dropzone ? ' stx-upload-dropzone' : ''}${disabled ? ' stx-upload-disabled' : ''}${className ? ' ' + className : ''}"${style ? ` style="${style}"` : ''}>
  ${label ? `<label class="stx-upload-label">${escapeHtml(label)}</label>` : ''}
  <div class="stx-upload-area" data-stx-upload-area>
    <input
      type="file"
      name="${fieldName}"
      ${acceptAttr ? `accept="${acceptAttr}"` : ''}
      ${multiple ? 'multiple' : ''}
      ${disabled ? 'disabled' : ''}
      class="stx-upload-input"
      data-stx-upload-input
    />
    <div class="stx-upload-placeholder">
      <svg class="stx-upload-icon" viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
      </svg>
      <span class="stx-upload-text">${escapeHtml(placeholder)}</span>
      ${maxSize ? `<span class="stx-upload-hint">Max size: ${formatSize(maxSize)}</span>` : ''}
    </div>
  </div>
  ${preview ? '<div class="stx-upload-previews" data-stx-upload-previews></div>' : ''}
  ${showProgress ? '<div class="stx-upload-progress" data-stx-upload-progress style="display:none;"><div class="stx-upload-progress-bar"></div><span class="stx-upload-progress-text">0%</span></div>' : ''}
</div>
`.trim()

  // Client-side script
  const script = `
(function() {
  var container = document.getElementById('${id}');
  if (!container) return;

  var input = container.querySelector('[data-stx-upload-input]');
  var area = container.querySelector('[data-stx-upload-area]');
  var previews = container.querySelector('[data-stx-upload-previews]');
  var progress = container.querySelector('[data-stx-upload-progress]');
  var progressBar = progress ? progress.querySelector('.stx-upload-progress-bar') : null;
  var progressText = progress ? progress.querySelector('.stx-upload-progress-text') : null;

  var config = {
    endpoint: '${escapeAttr(endpoint)}',
    fieldName: '${fieldName}',
    maxSize: ${maxSize || 'null'},
    maxFiles: ${maxFiles},
    accept: ${acceptAttr ? JSON.stringify(acceptAttr.split(',')) : 'null'},
    autoUpload: ${autoUpload}
  };

  // Handle file selection
  input.addEventListener('change', function(e) {
    var files = Array.from(e.target.files);
    handleFiles(files);
  });

  // Dropzone events
  if (${dropzone}) {
    area.addEventListener('dragover', function(e) {
      e.preventDefault();
      area.classList.add('stx-upload-dragover');
    });

    area.addEventListener('dragleave', function(e) {
      e.preventDefault();
      area.classList.remove('stx-upload-dragover');
    });

    area.addEventListener('drop', function(e) {
      e.preventDefault();
      area.classList.remove('stx-upload-dragover');
      var files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    });
  }

  function handleFiles(files) {
    files = files.slice(0, config.maxFiles);

    // Validate files
    files = files.filter(function(file) {
      var valid = STX.validateFile(file, config);
      if (!valid.valid) {
        console.warn('File validation failed:', file.name, valid.error);
        return false;
      }
      return true;
    });

    if (files.length === 0) return;

    // Generate previews
    if (${preview} && previews) {
      previews.innerHTML = '';
      files.forEach(function(file) {
        createPreview(file);
      });
    }

    // Auto upload
    if (config.autoUpload) {
      uploadFiles(files);
    }
  }

  function createPreview(file) {
    var item = document.createElement('div');
    item.className = 'stx-upload-preview-item';

    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(e) {
        item.innerHTML = '<img src="' + e.target.result + '" alt="' + escapeHtml(file.name) + '" /><span>' + escapeHtml(file.name) + '</span>';
      };
      reader.readAsDataURL(file);
    } else {
      item.innerHTML = '<div class="stx-upload-preview-file">' + getFileIcon(file.type) + '</div><span>' + escapeHtml(file.name) + '</span>';
    }

    previews.appendChild(item);
  }

  function uploadFiles(files) {
    if (progress) progress.style.display = 'block';

    var uploaded = 0;
    var total = files.length;

    files.forEach(function(file) {
      STX.uploadFile(file, config, function(prog) {
        if (progressBar) progressBar.style.width = prog.percent + '%';
        if (progressText) progressText.textContent = prog.percent + '%';
      }).then(function(result) {
        uploaded++;
        if (result.success) {
          container.dispatchEvent(new CustomEvent('upload', { detail: result }));
        } else {
          container.dispatchEvent(new CustomEvent('error', { detail: result }));
        }

        if (uploaded === total) {
          container.dispatchEvent(new CustomEvent('complete', { detail: { files: files.length } }));
          if (progress) {
            setTimeout(function() { progress.style.display = 'none'; }, 1000);
          }
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getFileIcon(type) {
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  }
})();
`.trim()

  // CSS styles
  const css = `
.stx-upload {
  font-family: system-ui, -apple-system, sans-serif;
}

.stx-upload-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stx-upload-area {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.stx-upload-area:hover,
.stx-upload-dragover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.stx-upload-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.stx-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.stx-upload-icon {
  color: #9ca3af;
}

.stx-upload-text {
  font-size: 0.875rem;
}

.stx-upload-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.stx-upload-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.stx-upload-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background: #f9fafb;
  max-width: 100px;
}

.stx-upload-preview-item img {
  max-width: 80px;
  max-height: 80px;
  object-fit: cover;
  border-radius: 0.25rem;
}

.stx-upload-preview-item span {
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.25rem;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stx-upload-preview-file {
  font-size: 2rem;
}

.stx-upload-progress {
  margin-top: 1rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  height: 0.5rem;
  position: relative;
  overflow: hidden;
}

.stx-upload-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
  width: 0;
}

.stx-upload-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.625rem;
  color: white;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.stx-upload-disabled {
  opacity: 0.5;
  pointer-events: none;
}
`.trim()

  return { html, script, css }
}

// =============================================================================
// Helpers
// =============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
