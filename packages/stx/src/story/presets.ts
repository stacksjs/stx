/**
 * STX Story - Prop Presets
 * Save and load prop configurations for quick testing
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Prop preset
 */
export interface PropPreset {
  /** Preset ID */
  id: string
  /** Preset name */
  name: string
  /** Description */
  description?: string
  /** Props values */
  props: Record<string, any>
  /** Component this preset is for */
  componentId?: string
  /** Created timestamp */
  created: number
  /** Last used timestamp */
  lastUsed?: number
  /** Usage count */
  usageCount: number
  /** Tags for organization */
  tags?: string[]
}

/**
 * Presets storage
 */
export interface PresetsStorage {
  /** Version for migrations */
  version: number
  /** All presets */
  presets: PropPreset[]
  /** Recently used preset IDs */
  recentIds: string[]
}

const PRESETS_FILE = '.stx/story/presets.json'
const STORAGE_VERSION = 1
const MAX_RECENT = 10

/**
 * Presets manager
 */
export class PresetsManager {
  private storage: PresetsStorage
  private storagePath: string
  private dirty = false

  constructor(rootDir: string) {
    this.storagePath = path.join(rootDir, PRESETS_FILE)
    this.storage = this.loadStorage()
  }

  /**
   * Load storage from disk
   */
  private loadStorage(): PresetsStorage {
    try {
      const content = fs.readFileSync(this.storagePath, 'utf-8')
      const data = JSON.parse(content) as PresetsStorage

      if (data.version !== STORAGE_VERSION) {
        return this.migrateStorage(data)
      }

      return data
    }
    catch {
      return {
        version: STORAGE_VERSION,
        presets: [],
        recentIds: [],
      }
    }
  }

  /**
   * Migrate storage to current version
   */
  private migrateStorage(data: any): PresetsStorage {
    // Add migration logic as needed
    return {
      version: STORAGE_VERSION,
      presets: data.presets || [],
      recentIds: data.recentIds || [],
    }
  }

  /**
   * Save storage to disk
   */
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
   * Create a new preset
   */
  createPreset(
    name: string,
    props: Record<string, any>,
    options: {
      description?: string
      componentId?: string
      tags?: string[]
    } = {},
  ): PropPreset {
    const preset: PropPreset = {
      id: generateId(),
      name,
      description: options.description,
      props,
      componentId: options.componentId,
      created: Date.now(),
      usageCount: 0,
      tags: options.tags,
    }

    this.storage.presets.push(preset)
    this.dirty = true

    return preset
  }

  /**
   * Get a preset by ID
   */
  getPreset(id: string): PropPreset | undefined {
    return this.storage.presets.find(p => p.id === id)
  }

  /**
   * Get all presets
   */
  getAllPresets(): PropPreset[] {
    return [...this.storage.presets]
  }

  /**
   * Get presets for a specific component
   */
  getPresetsForComponent(componentId: string): PropPreset[] {
    return this.storage.presets.filter(
      p => !p.componentId || p.componentId === componentId,
    )
  }

  /**
   * Get recent presets
   */
  getRecentPresets(): PropPreset[] {
    return this.storage.recentIds
      .map(id => this.getPreset(id))
      .filter((p): p is PropPreset => p !== undefined)
  }

  /**
   * Use a preset (updates usage stats)
   */
  usePreset(id: string): PropPreset | undefined {
    const preset = this.getPreset(id)
    if (!preset)
      return undefined

    preset.lastUsed = Date.now()
    preset.usageCount++

    // Update recent list
    this.storage.recentIds = [
      id,
      ...this.storage.recentIds.filter(i => i !== id),
    ].slice(0, MAX_RECENT)

    this.dirty = true
    return preset
  }

  /**
   * Update a preset
   */
  updatePreset(
    id: string,
    updates: Partial<Omit<PropPreset, 'id' | 'created'>>,
  ): PropPreset | undefined {
    const preset = this.getPreset(id)
    if (!preset)
      return undefined

    Object.assign(preset, updates)
    this.dirty = true

    return preset
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const index = this.storage.presets.findIndex(p => p.id === id)
    if (index === -1)
      return false

    this.storage.presets.splice(index, 1)
    this.storage.recentIds = this.storage.recentIds.filter(i => i !== id)
    this.dirty = true

    return true
  }

  /**
   * Search presets
   */
  searchPresets(query: string): PropPreset[] {
    const lowerQuery = query.toLowerCase()

    return this.storage.presets.filter((preset) => {
      if (preset.name.toLowerCase().includes(lowerQuery))
        return true
      if (preset.description?.toLowerCase().includes(lowerQuery))
        return true
      if (preset.tags?.some(t => t.toLowerCase().includes(lowerQuery)))
        return true
      return false
    })
  }

  /**
   * Get most used presets
   */
  getMostUsedPresets(limit = 5): PropPreset[] {
    return [...this.storage.presets]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Export presets to JSON
   */
  exportPresets(ids?: string[]): string {
    const presets = ids
      ? this.storage.presets.filter(p => ids.includes(p.id))
      : this.storage.presets

    return JSON.stringify({ presets }, null, 2)
  }

  /**
   * Import presets from JSON
   */
  importPresets(json: string, overwrite = false): number {
    const data = JSON.parse(json) as { presets: PropPreset[] }
    let imported = 0

    for (const preset of data.presets) {
      const existing = this.storage.presets.find(p => p.id === preset.id)

      if (existing && !overwrite) {
        continue
      }

      if (existing) {
        Object.assign(existing, preset)
      }
      else {
        this.storage.presets.push(preset)
      }

      imported++
    }

    if (imported > 0) {
      this.dirty = true
    }

    return imported
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Generate presets panel HTML
 */
export function getPresetsPanelHtml(presets: PropPreset[]): string {
  const presetItems = presets.map(p => `
    <div class="preset-item" data-preset-id="${p.id}">
      <div class="preset-info">
        <div class="preset-name">${p.name}</div>
        ${p.description ? `<div class="preset-desc">${p.description}</div>` : ''}
      </div>
      <div class="preset-actions">
        <button class="preset-apply" onclick="applyPreset('${p.id}')">Apply</button>
        <button class="preset-delete" onclick="deletePreset('${p.id}')">×</button>
      </div>
    </div>
  `).join('')

  return `
    <div class="presets-panel">
      <div class="presets-header">
        <h3>Presets</h3>
        <button class="preset-save-btn" onclick="saveCurrentAsPreset()">+ Save Current</button>
      </div>
      <div class="presets-list">
        ${presetItems || '<div class="presets-empty">No presets saved</div>'}
      </div>
    </div>
  `
}

/**
 * Generate presets panel styles
 */
export function getPresetsPanelStyles(): string {
  return `
    .presets-panel {
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }
    .presets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .presets-header h3 {
      margin: 0;
      font-size: 14px;
    }
    .preset-save-btn {
      padding: 4px 8px;
      font-size: 12px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .presets-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .preset-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: var(--bg);
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .preset-name {
      font-weight: 500;
      font-size: 13px;
    }
    .preset-desc {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .preset-actions {
      display: flex;
      gap: 4px;
    }
    .preset-apply {
      padding: 4px 8px;
      font-size: 11px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
    }
    .preset-delete {
      padding: 4px 8px;
      font-size: 11px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .preset-delete:hover {
      color: #ef4444;
    }
    .presets-empty {
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
      padding: 20px;
    }
  `
}

/**
 * Generate presets client script
 */
export function getPresetsScript(): string {
  return `
<script>
window.__stxPresets = {
  async saveCurrentAsPreset() {
    const name = prompt('Preset name:');
    if (!name) return;

    const props = window.__stxProps || {};
    const storyId = window.__stxStory?.currentStoryId;

    const response = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, props, componentId: storyId })
    });

    if (response.ok) {
      window.__stxStory?.refreshPresets?.();
    }
  },

  async applyPreset(id) {
    const response = await fetch('/api/presets/' + id + '/use', { method: 'POST' });
    const preset = await response.json();

    if (preset.props) {
      window.dispatchEvent(new CustomEvent('stx:props-change', {
        detail: { props: preset.props }
      }));
    }
  },

  async deletePreset(id) {
    if (!confirm('Delete this preset?')) return;

    await fetch('/api/presets/' + id, { method: 'DELETE' });
    window.__stxStory?.refreshPresets?.();
  }
};

// Expose to global scope
window.saveCurrentAsPreset = window.__stxPresets.saveCurrentAsPreset;
window.applyPreset = window.__stxPresets.applyPreset;
window.deletePreset = window.__stxPresets.deletePreset;
</script>
`
}
