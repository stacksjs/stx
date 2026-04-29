/**
 * Clipboard
 *
 * Read/write the system clipboard — text and HTML. When running inside a
 * Craft native window, uses NSPasteboard (macOS) / GTK clipboard (Linux)
 * / OpenClipboard (Windows). When running in a browser, falls back to
 * the Async Clipboard API (`navigator.clipboard.{read,write}Text`).
 *
 * **Permissions:** browsers require a user gesture (click, key) for
 * `writeText`. The native side has no such requirement.
 */

import { hasBridge } from './_bridge'

export interface Clipboard {
  /** Write plain text to the clipboard. */
  writeText: (text: string) => Promise<void>
  /** Read plain text from the clipboard. Returns "" if empty/unavailable. */
  readText: () => Promise<string>
  /** Write HTML to the clipboard (useful for rich-text paste targets). */
  writeHTML: (html: string) => Promise<void>
  /** Read HTML from the clipboard. Returns "" if no HTML payload present. */
  readHTML: () => Promise<string>
  /** Empty the clipboard. */
  clear: () => Promise<void>
  /** True when the clipboard currently contains plain text. */
  hasText: () => Promise<boolean>
  /** True when the clipboard currently contains HTML. */
  hasHTML: () => Promise<boolean>
  /** True when the clipboard currently contains an image. */
  hasImage: () => Promise<boolean>
}

export const clipboard: Clipboard = {
  async writeText(text: string): Promise<void> {
    if (hasBridge('clipboard')) {
      await window.craft!.clipboard.writeText(text)
      return
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  },

  async readText(): Promise<string> {
    if (hasBridge('clipboard')) {
      const v = await window.craft!.clipboard.readText()
      return typeof v === 'string' ? v : ''
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try { return await navigator.clipboard.readText() }
      catch { return '' }
    }
    return ''
  },

  async writeHTML(html: string): Promise<void> {
    if (hasBridge('clipboard')) {
      await window.craft!.clipboard.writeHTML(html)
      return
    }
    // Web Clipboard API: ClipboardItem with text/html. Browsers gate this
    // behind a user gesture *and* a runtime permission, so callers may
    // see a silent no-op when neither condition is met.
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.write) {
      try {
        const item = new (window as any).ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([stripHtml(html)], { type: 'text/plain' }),
        })
        await (navigator as any).clipboard.write([item])
      }
      catch {
        // Best-effort; fall through.
      }
    }
  },

  async readHTML(): Promise<string> {
    if (hasBridge('clipboard')) {
      const v = await window.craft!.clipboard.readHTML()
      return typeof v === 'string' ? v : ''
    }
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.read) {
      try {
        const items = await (navigator as any).clipboard.read()
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html')
            return await blob.text()
          }
        }
      }
      catch { /* fall through */ }
    }
    return ''
  },

  async clear(): Promise<void> {
    if (hasBridge('clipboard')) {
      await window.craft!.clipboard.clear()
      return
    }
    // Web fallback: write an empty string (no dedicated API).
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText('') } catch { /* ignore */ }
    }
  },

  async hasText(): Promise<boolean> {
    if (hasBridge('clipboard')) {
      return await window.craft!.clipboard.hasText()
    }
    return (await this.readText()).length > 0
  },

  async hasHTML(): Promise<boolean> {
    if (hasBridge('clipboard')) {
      return await window.craft!.clipboard.hasHTML()
    }
    return (await this.readHTML()).length > 0
  },

  async hasImage(): Promise<boolean> {
    if (hasBridge('clipboard')) {
      return await window.craft!.clipboard.hasImage()
    }
    // No reliable web API for "is there an image in the clipboard" without
    // actually trying to read it (which prompts for permission). Report
    // false rather than silently asking for permission.
    return false
  },
}

/**
 * Tiny HTML→text reducer for the writeHTML web fallback's plain alt.
 *
 * Drops `<script>`/`<style>` content entirely (common XSS vector when
 * naively stripped — `<script>alert(1)</script>` would otherwise leave
 * the literal `alert(1)` in the plaintext clipboard, looking innocuous
 * but still potentially dangerous if pasted into a code editor that
 * runs it). Replaces `<br>`/`</p>` with newlines so the plaintext
 * mirrors the HTML's visible structure.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(br|p|div|li|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
