/**
 * STX Story - Bookmarks
 * Bookmark component+variant+props combinations for quick access
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Bookmark entry
 */
export interface Bookmark {
  /** Bookmark ID */
  id: string
  /** Display name */
  name: string
  /** Story ID */
  storyId: string
  /** Variant ID */
  variantId: string
  /** Props state */
  props: Record<string, any>
  /** Created timestamp */
  created: number
  /** Notes */
  notes?: string
  /** Color label */
  color?: string
}

/**
 * Bookmarks storage
 */
export interface BookmarksStorage {
  version: number
  bookmarks: Bookmark[]
}

const BOOKMARKS_FILE = '.stx/story/bookmarks.json'
const STORAGE_VERSION = 1

/**
 * Bookmarks manager
 */
export class BookmarksManager {
  private storage: BookmarksStorage
  private storagePath: string
  private dirty = false

  constructor(rootDir: string) {
    this.storagePath = path.join(rootDir, BOOKMARKS_FILE)
    this.storage = this.loadStorage()
  }

  private loadStorage(): BookmarksStorage {
    try {
      const content = fs.readFileSync(this.storagePath, 'utf-8')
      return JSON.parse(content) as BookmarksStorage
    }
    catch {
      return { version: STORAGE_VERSION, bookmarks: [] }
    }
  }

  async save(): Promise<void> {
    if (!this.dirty)
      return

    const dir = path.dirname(this.storagePath)
    await fs.promises.mkdir(dir, { recursive: true })
    await fs.promises.writeFile(
      this.storagePath,
      JSON.stringify(this.storage, null, 2),
    )
    this.dirty = false
  }

  /**
   * Add a bookmark
   */
  addBookmark(
    storyId: string,
    variantId: string,
    props: Record<string, any>,
    options: { name?: string, notes?: string, color?: string } = {},
  ): Bookmark {
    const bookmark: Bookmark = {
      id: generateId(),
      name: options.name || `${storyId}/${variantId}`,
      storyId,
      variantId,
      props,
      created: Date.now(),
      notes: options.notes,
      color: options.color,
    }

    this.storage.bookmarks.push(bookmark)
    this.dirty = true

    return bookmark
  }

  /**
   * Get all bookmarks
   */
  getAllBookmarks(): Bookmark[] {
    return [...this.storage.bookmarks]
  }

  /**
   * Get bookmarks for a story
   */
  getBookmarksForStory(storyId: string): Bookmark[] {
    return this.storage.bookmarks.filter(b => b.storyId === storyId)
  }

  /**
   * Get a bookmark by ID
   */
  getBookmark(id: string): Bookmark | undefined {
    return this.storage.bookmarks.find(b => b.id === id)
  }

  /**
   * Check if a combination is bookmarked
   */
  isBookmarked(storyId: string, variantId: string): boolean {
    return this.storage.bookmarks.some(
      b => b.storyId === storyId && b.variantId === variantId,
    )
  }

  /**
   * Update a bookmark
   */
  updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id' | 'created'>>): Bookmark | undefined {
    const bookmark = this.getBookmark(id)
    if (!bookmark)
      return undefined

    Object.assign(bookmark, updates)
    this.dirty = true

    return bookmark
  }

  /**
   * Delete a bookmark
   */
  deleteBookmark(id: string): boolean {
    const index = this.storage.bookmarks.findIndex(b => b.id === id)
    if (index === -1)
      return false

    this.storage.bookmarks.splice(index, 1)
    this.dirty = true

    return true
  }

  /**
   * Toggle bookmark for a combination
   */
  toggleBookmark(
    storyId: string,
    variantId: string,
    props: Record<string, any>,
  ): { added: boolean, bookmark?: Bookmark } {
    const existing = this.storage.bookmarks.find(
      b => b.storyId === storyId && b.variantId === variantId,
    )

    if (existing) {
      this.deleteBookmark(existing.id)
      return { added: false }
    }

    const bookmark = this.addBookmark(storyId, variantId, props)
    return { added: true, bookmark }
  }

  /**
   * Export bookmarks
   */
  exportBookmarks(): string {
    return JSON.stringify(this.storage, null, 2)
  }

  /**
   * Import bookmarks
   */
  importBookmarks(json: string, merge = true): number {
    const data = JSON.parse(json) as BookmarksStorage
    let imported = 0

    for (const bookmark of data.bookmarks) {
      if (merge) {
        const existing = this.storage.bookmarks.find(b => b.id === bookmark.id)
        if (existing) {
          Object.assign(existing, bookmark)
        }
        else {
          this.storage.bookmarks.push(bookmark)
        }
      }
      else {
        this.storage.bookmarks.push(bookmark)
      }
      imported++
    }

    if (imported > 0) {
      this.dirty = true
    }

    return imported
  }
}

function generateId(): string {
  return `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Generate bookmarks panel HTML
 */
export function getBookmarksPanelHtml(bookmarks: Bookmark[]): string {
  const items = bookmarks.map(b => `
    <div class="bookmark-item" data-bookmark-id="${b.id}" style="${b.color ? `border-left: 3px solid ${b.color}` : ''}">
      <div class="bookmark-info">
        <div class="bookmark-name">${b.name}</div>
        <div class="bookmark-path">${b.storyId} / ${b.variantId}</div>
        ${b.notes ? `<div class="bookmark-notes">${b.notes}</div>` : ''}
      </div>
      <div class="bookmark-actions">
        <button onclick="loadBookmark('${b.id}')" title="Load">▶</button>
        <button onclick="deleteBookmark('${b.id}')" title="Delete">×</button>
      </div>
    </div>
  `).join('')

  return `
    <div class="bookmarks-panel">
      <div class="bookmarks-header">
        <h3>📑 Bookmarks</h3>
        <button onclick="addCurrentBookmark()" title="Bookmark current">+</button>
      </div>
      <div class="bookmarks-list">
        ${items || '<div class="bookmarks-empty">No bookmarks yet</div>'}
      </div>
    </div>
  `
}

/**
 * Generate bookmarks panel styles
 */
export function getBookmarksPanelStyles(): string {
  return `
    .bookmarks-panel {
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }
    .bookmarks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .bookmarks-header h3 {
      margin: 0;
      font-size: 14px;
    }
    .bookmarks-header button {
      padding: 4px 8px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .bookmarks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }
    .bookmark-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: var(--bg);
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .bookmark-name {
      font-weight: 500;
      font-size: 13px;
    }
    .bookmark-path {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .bookmark-notes {
      font-size: 11px;
      color: var(--text-secondary);
      font-style: italic;
      margin-top: 4px;
    }
    .bookmark-actions {
      display: flex;
      gap: 4px;
    }
    .bookmark-actions button {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .bookmark-actions button:hover {
      background: var(--bg-secondary);
    }
    .bookmarks-empty {
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
      padding: 20px;
    }
  `
}

/**
 * Generate bookmarks client script
 */
export function getBookmarksScript(): string {
  return `
<script>
window.__stxBookmarks = {
  async loadBookmark(id) {
    const response = await fetch('/api/bookmarks/' + id);
    const bookmark = await response.json();

    if (bookmark) {
      window.__stxHotSwap?.selectVariant(bookmark.storyId, bookmark.variantId);
      if (bookmark.props) {
        window.dispatchEvent(new CustomEvent('stx:props-change', {
          detail: { props: bookmark.props }
        }));
      }
    }
  },

  async addCurrentBookmark() {
    const name = prompt('Bookmark name:');
    if (!name) return;

    const storyId = window.__stxHotSwap?.storyId;
    const variantId = window.__stxHotSwap?.variantId;
    const props = window.__stxProps || {};

    if (!storyId || !variantId) {
      alert('No story selected');
      return;
    }

    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, storyId, variantId, props })
    });

    window.__stxStory?.refreshBookmarks?.();
  },

  async deleteBookmark(id) {
    if (!confirm('Delete this bookmark?')) return;

    await fetch('/api/bookmarks/' + id, { method: 'DELETE' });
    window.__stxStory?.refreshBookmarks?.();
  },

  async toggleCurrent() {
    const storyId = window.__stxHotSwap?.storyId;
    const variantId = window.__stxHotSwap?.variantId;
    const props = window.__stxProps || {};

    if (!storyId || !variantId) return;

    await fetch('/api/bookmarks/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, variantId, props })
    });

    window.__stxStory?.refreshBookmarks?.();
  }
};

window.loadBookmark = window.__stxBookmarks.loadBookmark.bind(window.__stxBookmarks);
window.addCurrentBookmark = window.__stxBookmarks.addCurrentBookmark.bind(window.__stxBookmarks);
window.deleteBookmark = window.__stxBookmarks.deleteBookmark.bind(window.__stxBookmarks);
</script>
`
}
