/**
 * STX Story - Code Panel
 * Shows component source code with syntax highlighting
 */

import type { AnalyzedComponent, ServerStoryFile } from '../types'
import fs from 'node:fs'

/**
 * Code panel tabs
 */
export type CodePanelTab = 'source' | 'story' | 'compiled' | 'props'

/**
 * Generate code panel HTML
 */
export function generateCodePanel(
  story: ServerStoryFile,
  component: AnalyzedComponent | null,
  activeTab: CodePanelTab = 'source',
): string {
  return `
    <div class="stx-code-panel">
      <div class="stx-code-tabs">
        <button class="${activeTab === 'source' ? 'active' : ''}" onclick="window.__stxStory.setCodeTab('source')">Source</button>
        <button class="${activeTab === 'story' ? 'active' : ''}" onclick="window.__stxStory.setCodeTab('story')">Story</button>
        <button class="${activeTab === 'compiled' ? 'active' : ''}" onclick="window.__stxStory.setCodeTab('compiled')">Compiled</button>
        <button class="${activeTab === 'props' ? 'active' : ''}" onclick="window.__stxStory.setCodeTab('props')">Props</button>
      </div>
      <div class="stx-code-toolbar">
        <button onclick="window.__stxStory.copyCode()" title="Copy code">📋 Copy</button>
        <button onclick="window.__stxStory.openInVSCode()" title="Open in VS Code">📝 VS Code</button>
      </div>
      <div class="stx-code-content" id="code-content">
        <!-- Content loaded dynamically -->
      </div>
    </div>
  `
}

/**
 * Get source code for a component
 */
export async function getComponentSource(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8')
  }
  catch {
    return '// Unable to read source file'
  }
}

/**
 * Get story code with current props
 */
export function getStoryCode(
  componentName: string,
  props: Record<string, any>,
): string {
  const propsStr = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      if (typeof value === 'boolean') {
        return value ? key : `:${key}="false"`
      }
      if (typeof value === 'number') {
        return `:${key}="${value}"`
      }
      return `:${key}="${JSON.stringify(value).replace(/"/g, '\'')}"`
    })
    .join('\n  ')

  return `<${componentName}
  ${propsStr}
/>`
}

/**
 * Get props as JSON
 */
export function getPropsJson(props: Record<string, any>): string {
  return JSON.stringify(props, null, 2)
}

/**
 * Apply syntax highlighting to code
 * Uses simple regex-based highlighting without external deps
 */
export function highlightCode(code: string, language: string): string {
  let highlighted = escapeHtml(code)

  if (language === 'html' || language === 'stx') {
    // HTML/STX highlighting
    highlighted = highlighted
      // Tags
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')
      // Attributes
      .replace(/([\w-]+)(=)/g, '<span class="hl-attr">$1</span>$2')
      // Strings
      .replace(/(&quot;[^&]*&quot;)/g, '<span class="hl-string">$1</span>')
      // Comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
      // Directives
      .replace(/(@\w+)/g, '<span class="hl-directive">$1</span>')
      // Interpolation
      .replace(/(\{\{[^}]*\}\})/g, '<span class="hl-interpolation">$1</span>')
  }
  else if (language === 'json') {
    // JSON highlighting
    highlighted = highlighted
      // Keys
      .replace(/(&quot;\w+&quot;)(:)/g, '<span class="hl-key">$1</span>$2')
      // Strings
      .replace(/(: )(&quot;[^&]*&quot;)/g, '$1<span class="hl-string">$2</span>')
      // Numbers
      .replace(/(: )(\d+)/g, '$1<span class="hl-number">$2</span>')
      // Booleans
      .replace(/(true|false|null)/g, '<span class="hl-boolean">$1</span>')
  }
  else if (language === 'typescript' || language === 'javascript') {
    // TypeScript/JavaScript highlighting
    highlighted = highlighted
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|interface|type|export|import|from|async|await)\b/g, '<span class="hl-keyword">$1</span>')
      // Strings
      .replace(/(&apos;[^&]*&apos;|&quot;[^&]*&quot;|`[^`]*`)/g, '<span class="hl-string">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
      // Comments
      .replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
  }

  return `<pre class="hl-code"><code>${highlighted}</code></pre>`
}

/**
 * Get syntax highlighting styles
 */
export function getHighlightStyles(): string {
  return `
    .hl-code {
      margin: 0;
      padding: 16px;
      overflow: auto;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      background: var(--bg-secondary);
      border-radius: 4px;
    }
    .hl-code code {
      font-family: inherit;
    }
    .hl-tag { color: #22863a; }
    .hl-attr { color: #6f42c1; }
    .hl-string { color: #032f62; }
    .hl-comment { color: #6a737d; font-style: italic; }
    .hl-directive { color: #d73a49; font-weight: 500; }
    .hl-interpolation { color: #e36209; }
    .hl-key { color: #005cc5; }
    .hl-number { color: #005cc5; }
    .hl-boolean { color: #d73a49; }
    .hl-keyword { color: #d73a49; }

    .dark .hl-tag { color: #85e89d; }
    .dark .hl-attr { color: #b392f0; }
    .dark .hl-string { color: #9ecbff; }
    .dark .hl-comment { color: #6a737d; }
    .dark .hl-directive { color: #f97583; }
    .dark .hl-interpolation { color: #ffab70; }
    .dark .hl-key { color: #79b8ff; }
    .dark .hl-number { color: #79b8ff; }
    .dark .hl-boolean { color: #f97583; }
    .dark .hl-keyword { color: #f97583; }
  `
}

/**
 * Get code panel styles
 */
export function getCodePanelStyles(): string {
  return `
    .stx-code-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-left: 1px solid var(--border);
    }
    .stx-code-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    .stx-code-tabs button {
      padding: 8px 16px;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 12px;
      border-bottom: 2px solid transparent;
    }
    .stx-code-tabs button:hover {
      color: var(--text);
    }
    .stx-code-tabs button.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .stx-code-toolbar {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid var(--border);
    }
    .stx-code-toolbar button {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
    }
    .stx-code-toolbar button:hover {
      background: var(--bg-secondary);
    }
    .stx-code-content {
      flex: 1;
      overflow: auto;
      padding: 0;
    }
    ${getHighlightStyles()}
  `
}

/**
 * Copy code to clipboard (client-side)
 */
export function getCopyCodeScript(): string {
  return `
    window.__stxStory.copyCode = function() {
      const codeEl = document.querySelector('.hl-code code');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent || '');
        // Show toast
        const toast = document.createElement('div');
        toast.className = 'stx-toast';
        toast.textContent = 'Copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    };
  `
}

/**
 * Open in VS Code (client-side)
 */
export function getOpenInVSCodeScript(filePath: string): string {
  return `
    window.__stxStory.openInVSCode = function() {
      // Use VS Code URL scheme
      window.open('vscode://file/${filePath}', '_blank');
    };
  `
}

/**
 * Escape HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
