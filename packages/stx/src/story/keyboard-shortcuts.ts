/**
 * STX Story - Keyboard Shortcuts
 * Keyboard shortcuts panel and handler
 */

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Shortcut key(s) */
  key: string
  /** Modifier keys */
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  /** Description */
  description: string
  /** Category */
  category: string
  /** Action to perform */
  action: string
}

/**
 * Default keyboard shortcuts
 */
export const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  { key: 'k', modifiers: ['meta'], description: 'Open search', category: 'Navigation', action: 'openSearch' },
  { key: 'ArrowUp', description: 'Previous story', category: 'Navigation', action: 'prevStory' },
  { key: 'ArrowDown', description: 'Next story', category: 'Navigation', action: 'nextStory' },
  { key: 'ArrowLeft', description: 'Previous variant', category: 'Navigation', action: 'prevVariant' },
  { key: 'ArrowRight', description: 'Next variant', category: 'Navigation', action: 'nextVariant' },
  { key: 'Enter', description: 'Select story', category: 'Navigation', action: 'selectStory' },
  { key: 'Escape', description: 'Close panel/modal', category: 'Navigation', action: 'closePanel' },

  // View
  { key: 'd', description: 'Toggle dark mode', category: 'View', action: 'toggleDarkMode' },
  { key: 'f', description: 'Toggle fullscreen', category: 'View', action: 'toggleFullscreen' },
  { key: 's', description: 'Toggle sidebar', category: 'View', action: 'toggleSidebar' },
  { key: 'a', description: 'Toggle addons panel', category: 'View', action: 'toggleAddons' },
  { key: 'z', description: 'Zoom in', category: 'View', action: 'zoomIn' },
  { key: 'x', description: 'Zoom out', category: 'View', action: 'zoomOut' },
  { key: '0', description: 'Reset zoom', category: 'View', action: 'resetZoom' },

  // Actions
  { key: 'r', description: 'Reload story', category: 'Actions', action: 'reloadStory' },
  { key: 'c', description: 'Copy story code', category: 'Actions', action: 'copyCode' },
  { key: 'p', description: 'Open props panel', category: 'Actions', action: 'openProps' },
  { key: 'b', description: 'Toggle bookmark', category: 'Actions', action: 'toggleBookmark' },
  { key: 't', description: 'Run tests', category: 'Actions', action: 'runTests' },

  // Help
  { key: '?', description: 'Show shortcuts', category: 'Help', action: 'showShortcuts' },
]

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.modifiers) {
    for (const mod of shortcut.modifiers) {
      switch (mod) {
        case 'meta':
          parts.push('⌘')
          break
        case 'ctrl':
          parts.push('Ctrl')
          break
        case 'alt':
          parts.push('Alt')
          break
        case 'shift':
          parts.push('⇧')
          break
      }
    }
  }

  // Format special keys
  let key = shortcut.key
  switch (key) {
    case 'ArrowUp':
      key = '↑'
      break
    case 'ArrowDown':
      key = '↓'
      break
    case 'ArrowLeft':
      key = '←'
      break
    case 'ArrowRight':
      key = '→'
      break
    case 'Enter':
      key = '↵'
      break
    case 'Escape':
      key = 'Esc'
      break
    default:
      key = key.toUpperCase()
  }

  parts.push(key)
  return parts.join(' + ')
}

/**
 * Generate keyboard shortcuts modal HTML
 */
export function getShortcutsModalHtml(shortcuts: KeyboardShortcut[] = defaultShortcuts): string {
  // Group by category
  const categories = new Map<string, KeyboardShortcut[]>()
  for (const shortcut of shortcuts) {
    const list = categories.get(shortcut.category) || []
    list.push(shortcut)
    categories.set(shortcut.category, list)
  }

  const sections = Array.from(categories.entries()).map(([category, items]) => `
    <div class="shortcuts-category">
      <h4>${category}</h4>
      <div class="shortcuts-list">
        ${items.map(s => `
          <div class="shortcut-item">
            <span class="shortcut-desc">${s.description}</span>
            <kbd class="shortcut-key">${formatShortcutKey(s)}</kbd>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return `
    <div class="shortcuts-modal" id="shortcuts-modal" style="display: none;">
      <div class="shortcuts-backdrop" onclick="closeShortcutsModal()"></div>
      <div class="shortcuts-content">
        <div class="shortcuts-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="shortcuts-close" onclick="closeShortcutsModal()">×</button>
        </div>
        <div class="shortcuts-body">
          ${sections}
        </div>
      </div>
    </div>
  `
}

/**
 * Generate keyboard shortcuts styles
 */
export function getShortcutsStyles(): string {
  return `
    .shortcuts-modal {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shortcuts-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
    }
    .shortcuts-content {
      position: relative;
      background: var(--bg);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .shortcuts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .shortcuts-header h3 {
      margin: 0;
      font-size: 16px;
    }
    .shortcuts-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0;
      line-height: 1;
    }
    .shortcuts-body {
      padding: 20px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    .shortcuts-category h4 {
      margin: 0 0 12px;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
    }
    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .shortcut-desc {
      font-size: 13px;
      color: var(--text);
    }
    .shortcut-key {
      font-family: monospace;
      font-size: 11px;
      padding: 4px 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-secondary);
      white-space: nowrap;
    }
  `
}

/**
 * Generate keyboard shortcuts handler script
 */
export function getShortcutsScript(): string {
  return `
<script>
window.__stxShortcuts = {
  shortcuts: ${JSON.stringify(defaultShortcuts)},

  init() {
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  },

  handleKeydown(event) {
    // Don't handle if typing in input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const shortcut = this.findShortcut(event);
    if (shortcut) {
      event.preventDefault();
      this.executeAction(shortcut.action);
    }
  },

  findShortcut(event) {
    return this.shortcuts.find(s => {
      if (s.key.toLowerCase() !== event.key.toLowerCase()) return false;

      const mods = s.modifiers || [];
      if (mods.includes('meta') !== event.metaKey) return false;
      if (mods.includes('ctrl') !== event.ctrlKey) return false;
      if (mods.includes('alt') !== event.altKey) return false;
      if (mods.includes('shift') !== event.shiftKey) return false;

      return true;
    });
  },

  executeAction(action) {
    switch (action) {
      case 'openSearch':
        document.getElementById('search-input')?.focus();
        break;
      case 'prevStory':
        this.navigateStory(-1);
        break;
      case 'nextStory':
        this.navigateStory(1);
        break;
      case 'prevVariant':
        this.navigateVariant(-1);
        break;
      case 'nextVariant':
        this.navigateVariant(1);
        break;
      case 'selectStory':
        document.querySelector('.story-item.focused')?.click();
        break;
      case 'closePanel':
        this.closeActivePanel();
        break;
      case 'toggleDarkMode':
        document.documentElement.classList.toggle('dark');
        break;
      case 'toggleFullscreen':
        this.toggleFullscreen();
        break;
      case 'toggleSidebar':
        document.querySelector('.sidebar')?.classList.toggle('hidden');
        break;
      case 'toggleAddons':
        document.querySelector('.addons-panel')?.classList.toggle('hidden');
        break;
      case 'zoomIn':
        window.__stxStory?.zoomIn?.();
        break;
      case 'zoomOut':
        window.__stxStory?.zoomOut?.();
        break;
      case 'resetZoom':
        window.__stxStory?.resetZoom?.();
        break;
      case 'reloadStory':
        window.__stxStory?.reloadCurrentStory?.();
        break;
      case 'copyCode':
        window.__stxStory?.copyCode?.();
        break;
      case 'openProps':
        document.querySelector('[data-panel="props"]')?.click();
        break;
      case 'toggleBookmark':
        window.__stxBookmarks?.toggleCurrent?.();
        break;
      case 'runTests':
        window.__stxStory?.runTests?.();
        break;
      case 'showShortcuts':
        this.showModal();
        break;
    }
  },

  navigateStory(direction) {
    const items = Array.from(document.querySelectorAll('.story-item'));
    const current = document.querySelector('.story-item.active');
    const currentIndex = current ? items.indexOf(current) : -1;
    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));
    items[nextIndex]?.click();
  },

  navigateVariant(direction) {
    const buttons = Array.from(document.querySelectorAll('.variant-btn'));
    const current = document.querySelector('.variant-btn.active');
    const currentIndex = current ? buttons.indexOf(current) : -1;
    const nextIndex = Math.max(0, Math.min(buttons.length - 1, currentIndex + direction));
    buttons[nextIndex]?.click();
  },

  closeActivePanel() {
    const modal = document.querySelector('.shortcuts-modal[style*="flex"]');
    if (modal) {
      closeShortcutsModal();
      return;
    }
    // Close other panels
    document.querySelector('.panel.open')?.classList.remove('open');
  },

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  },

  showModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.style.display = 'flex';
  }
};

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.style.display = 'none';
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.__stxShortcuts.init());
} else {
  window.__stxShortcuts.init();
}
</script>
`
}
