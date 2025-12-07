/**
 * STX Story - Navigation
 * Keyboard navigation, hash routing, and recent components
 */

/**
 * Navigation state
 */
export interface NavigationState {
  /** Currently selected story ID */
  selectedStoryId: string | null
  /** Currently selected variant ID */
  selectedVariantId: string | null
  /** Recently viewed story IDs */
  recentStories: string[]
  /** Maximum recent stories to track */
  maxRecent: number
  /** Search query */
  searchQuery: string
  /** Focused item index for keyboard nav */
  focusedIndex: number
}

/**
 * Create initial navigation state
 */
export function createNavigationState(): NavigationState {
  return {
    selectedStoryId: null,
    selectedVariantId: null,
    recentStories: [],
    maxRecent: 10,
    searchQuery: '',
    focusedIndex: -1,
  }
}

/**
 * Parse hash from URL for routing
 */
export function parseHash(hash: string): { storyId: string | null; variantId: string | null } {
  if (!hash || hash === '#') {
    return { storyId: null, variantId: null }
  }

  // Remove leading #
  const path = hash.startsWith('#') ? hash.slice(1) : hash

  // Format: #/story/variant or #/story
  const parts = path.split('/').filter(Boolean)

  return {
    storyId: parts[0] || null,
    variantId: parts[1] || null,
  }
}

/**
 * Generate hash for URL
 */
export function generateHash(storyId: string | null, variantId: string | null): string {
  if (!storyId) return ''
  if (!variantId) return `#/${storyId}`
  return `#/${storyId}/${variantId}`
}

/**
 * Add story to recent list
 */
export function addToRecent(state: NavigationState, storyId: string): void {
  // Remove if already exists
  const index = state.recentStories.indexOf(storyId)
  if (index !== -1) {
    state.recentStories.splice(index, 1)
  }

  // Add to front
  state.recentStories.unshift(storyId)

  // Trim to max
  if (state.recentStories.length > state.maxRecent) {
    state.recentStories.pop()
  }
}

/**
 * Get keyboard navigation script
 */
export function getKeyboardNavigationScript(): string {
  return `
    (function() {
      const state = {
        focusedIndex: -1,
        items: [],
      };

      function updateItems() {
        state.items = Array.from(document.querySelectorAll('.stx-tree-item, .stx-search-result'));
      }

      function focusItem(index) {
        // Remove previous focus
        state.items.forEach(item => item.classList.remove('focused'));

        // Clamp index
        if (index < 0) index = state.items.length - 1;
        if (index >= state.items.length) index = 0;

        state.focusedIndex = index;

        // Add focus
        if (state.items[index]) {
          state.items[index].classList.add('focused');
          state.items[index].scrollIntoView({ block: 'nearest' });
        }
      }

      function selectFocused() {
        if (state.items[state.focusedIndex]) {
          state.items[state.focusedIndex].click();
        }
      }

      document.addEventListener('keydown', function(e) {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          if (e.key === 'Escape') {
            e.target.blur();
          }
          return;
        }

        updateItems();

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            focusItem(state.focusedIndex - 1);
            break;

          case 'ArrowDown':
            e.preventDefault();
            focusItem(state.focusedIndex + 1);
            break;

          case 'Enter':
            e.preventDefault();
            selectFocused();
            break;

          case '/':
          case 'k':
            if (e.metaKey || e.ctrlKey || e.key === '/') {
              e.preventDefault();
              const searchInput = document.querySelector('.stx-search-input');
              if (searchInput) searchInput.focus();
            }
            break;

          case 'Escape':
            state.focusedIndex = -1;
            state.items.forEach(item => item.classList.remove('focused'));
            break;
        }
      });

      // Hash change handling
      window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (window.__stxStory && window.__stxStory.navigateToHash) {
          window.__stxStory.navigateToHash(hash);
        }
      });

      // Initialize from hash
      if (window.location.hash) {
        setTimeout(function() {
          if (window.__stxStory && window.__stxStory.navigateToHash) {
            window.__stxStory.navigateToHash(window.location.hash);
          }
        }, 100);
      }
    })();
  `
}

/**
 * Get navigation styles
 */
export function getNavigationStyles(): string {
  return `
    .stx-tree-item.focused,
    .stx-search-result.focused {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }

    .stx-recent-list {
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
    }

    .stx-recent-title {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-secondary);
      padding: 4px 12px;
      font-weight: 500;
    }

    .stx-recent-item {
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stx-recent-item:hover {
      background: var(--bg-secondary);
    }

    .stx-recent-item .stx-recent-icon {
      color: var(--text-secondary);
    }
  `
}

/**
 * Generate recent stories list HTML
 */
export function generateRecentList(recentStories: string[], storyMap: Map<string, string>): string {
  if (recentStories.length === 0) return ''

  const items = recentStories
    .filter(id => storyMap.has(id))
    .map(id => `
      <div class="stx-recent-item" onclick="window.__stxStory.selectStory('${id}')">
        <span class="stx-recent-icon">🕐</span>
        <span>${storyMap.get(id)}</span>
      </div>
    `)
    .join('')

  return `
    <div class="stx-recent-list">
      <div class="stx-recent-title">Recent</div>
      ${items}
    </div>
  `
}

/**
 * State persistence helpers
 */
export function saveNavigationState(state: NavigationState): void {
  try {
    localStorage.setItem('stx-story-nav', JSON.stringify({
      selectedStoryId: state.selectedStoryId,
      selectedVariantId: state.selectedVariantId,
      recentStories: state.recentStories,
    }))
  }
  catch {
    // localStorage not available
  }
}

/**
 * Load navigation state from storage
 */
export function loadNavigationState(): Partial<NavigationState> {
  try {
    const saved = localStorage.getItem('stx-story-nav')
    if (saved) {
      return JSON.parse(saved)
    }
  }
  catch {
    // localStorage not available
  }
  return {}
}

/**
 * Get state persistence script
 */
export function getStatePersistenceScript(): string {
  return `
    (function() {
      // Load saved state
      try {
        const saved = localStorage.getItem('stx-story-nav');
        if (saved) {
          const state = JSON.parse(saved);
          window.__stxStoryState = state;

          // Restore selection
          if (state.selectedStoryId && window.__stxStory) {
            window.__stxStory.selectStory(state.selectedStoryId, state.selectedVariantId);
          }
        }
      } catch (e) {}

      // Save state on changes
      window.__stxStory = window.__stxStory || {};
      const originalSelectStory = window.__stxStory.selectStory;

      window.__stxStory.selectStory = function(storyId, variantId) {
        if (originalSelectStory) {
          originalSelectStory(storyId, variantId);
        }

        try {
          const state = window.__stxStoryState || {};
          state.selectedStoryId = storyId;
          state.selectedVariantId = variantId;

          // Add to recent
          state.recentStories = state.recentStories || [];
          const idx = state.recentStories.indexOf(storyId);
          if (idx !== -1) state.recentStories.splice(idx, 1);
          state.recentStories.unshift(storyId);
          if (state.recentStories.length > 10) state.recentStories.pop();

          localStorage.setItem('stx-story-nav', JSON.stringify(state));
          window.__stxStoryState = state;
        } catch (e) {}
      };
    })();
  `
}
