/**
 * STX Story - Desktop Preview
 * Native window preview via @stacksjs/desktop
 */

import type { ServerStoryFile, StoryContext } from './types'

/**
 * Desktop preview options
 */
export interface DesktopPreviewOptions {
  /** Window width */
  width?: number
  /** Window height */
  height?: number
  /** Window title */
  title?: string
  /** Enable dev tools */
  devTools?: boolean
}

/**
 * Desktop preview instance
 */
export interface DesktopPreviewInstance {
  /** Close the preview window */
  close: () => void
  /** Reload the preview */
  reload: () => void
  /** Update the content */
  update: (html: string) => void
}

/**
 * Check if desktop preview is available
 */
export async function isDesktopPreviewAvailable(): Promise<boolean> {
  try {
    const desktop = await import('@stacksjs/desktop')
    return typeof desktop.createWindowWithHTML === 'function'
  }
  catch {
    return false
  }
}

/**
 * Open a story in a native desktop window
 */
export async function openDesktopPreview(
  ctx: StoryContext,
  story: ServerStoryFile,
  variantId: string,
  options: DesktopPreviewOptions = {},
): Promise<DesktopPreviewInstance | null> {
  try {
    const desktop = await import('@stacksjs/desktop')

    const variant = story.story?.variants.find(v => v.id === variantId)
    if (!variant)
      return null

    const title = options.title || `${story.fileName} - ${variant.title}`
    const html = generatePreviewHTML(ctx, story, variant)

    // Create native window with the preview HTML
    const _window = await desktop.createWindowWithHTML(html, {
      title,
      width: options.width || 800,
      height: options.height || 600,
    })

    return {
      close: () => {
        // Window close is handled by the desktop module
      },
      reload: () => {
        // Reload would recreate the window
      },
      update: (_html: string) => {
        // Update content - would need window reference
      },
    }
  }
  catch (error) {
    console.warn('Desktop preview not available:', error)
    return null
  }
}

/**
 * Generate preview HTML for desktop window
 */
function generatePreviewHTML(
  ctx: StoryContext,
  story: ServerStoryFile,
  variant: { title: string, source?: string, state?: Record<string, any> },
): string {
  const { theme } = ctx.config

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.fileName} - ${variant.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px;
      background: ${theme.defaultColorScheme === 'dark' ? '#1a1a1a' : '#ffffff'};
      color: ${theme.defaultColorScheme === 'dark' ? '#ffffff' : '#333333'};
    }
    .preview-header {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${theme.defaultColorScheme === 'dark' ? '#404040' : '#e0e0e0'};
    }
    .preview-title {
      font-size: 14px;
      font-weight: 600;
    }
    .preview-subtitle {
      font-size: 12px;
      color: ${theme.defaultColorScheme === 'dark' ? '#a0a0a0' : '#666666'};
    }
    .preview-content {
      padding: 16px;
    }
  </style>
</head>
<body>
  <div class="preview-header">
    <div class="preview-title">${story.fileName}</div>
    <div class="preview-subtitle">${variant.title}</div>
  </div>
  <div class="preview-content">
    ${variant.source || '<!-- No source -->'}
  </div>
  <script>
    window.__stxProps = ${JSON.stringify(variant.state || {})};
  </script>
</body>
</html>`
}

/**
 * Get desktop preview button HTML
 */
export function getDesktopPreviewButton(storyId: string, variantId: string): string {
  return `
    <button
      class="stx-desktop-preview-btn"
      onclick="window.__stxStory.openDesktopPreview('${storyId}', '${variantId}')"
      title="Open in native window"
    >
      🖥️ Desktop
    </button>
  `
}

/**
 * Get desktop preview styles
 */
export function getDesktopPreviewStyles(): string {
  return `
    .stx-desktop-preview-btn {
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .stx-desktop-preview-btn:hover {
      background: var(--bg-secondary);
    }
  `
}
