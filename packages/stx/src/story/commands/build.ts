/**
 * STX Story - Build command
 * Build static story site for deployment
 */

import fs from 'node:fs'
import path from 'node:path'
import { scanStoryFiles } from '../collect/scanner'
import { buildTree } from '../collect/tree'
import { createContext, updateContextStoryFiles, updateContextTree } from '../context'

/**
 * Options for the build command
 */
export interface BuildOptions {
  /** Output directory (overrides config) */
  outDir?: string
}

/**
 * Build static story site
 */
export async function buildCommand(options: BuildOptions = {}): Promise<void> {
  console.log('\n📖 Building STX Story...\n')

  // Create context
  const ctx = await createContext({ mode: 'build' })

  if (!ctx.config.enabled) {
    console.log('Story feature is disabled in config.')
    return
  }

  // Scan for story files
  const storyFiles = await scanStoryFiles(ctx)
  updateContextStoryFiles(ctx, storyFiles)

  // Build tree
  const tree = buildTree(ctx.config, storyFiles)
  updateContextTree(ctx, tree)

  console.log(`  Found ${storyFiles.length} story files`)

  // Determine output directory
  const outDir = options.outDir ?? ctx.config.outDir
  const absoluteOutDir = path.resolve(ctx.root, outDir)

  // Create output directory
  await fs.promises.mkdir(absoluteOutDir, { recursive: true })

  // Generate static files
  console.log(`  Building to ${outDir}...`)

  // Write index.html
  const indexHtml = generateStaticHTML(ctx)
  await fs.promises.writeFile(path.join(absoluteOutDir, 'index.html'), indexHtml)

  // Write stories data
  const storiesData = {
    files: storyFiles.map(f => ({
      id: f.id,
      fileName: f.fileName,
      relativePath: f.relativePath,
      treePath: f.treePath,
    })),
    tree,
  }
  await fs.promises.writeFile(
    path.join(absoluteOutDir, 'stories.json'),
    JSON.stringify(storiesData, null, 2),
  )

  // Write config
  const configData = {
    theme: ctx.config.theme,
    responsivePresets: ctx.config.responsivePresets,
    backgroundPresets: ctx.config.backgroundPresets,
  }
  await fs.promises.writeFile(
    path.join(absoluteOutDir, 'config.json'),
    JSON.stringify(configData, null, 2),
  )

  // Copy story files
  const storiesDir = path.join(absoluteOutDir, 'stories')
  await fs.promises.mkdir(storiesDir, { recursive: true })

  for (const file of storyFiles) {
    const content = await fs.promises.readFile(file.path, 'utf-8')
    await fs.promises.writeFile(
      path.join(storiesDir, `${file.id}.stx`),
      content,
    )
  }

  console.log(`\n  ✅ Built ${storyFiles.length} stories to ${outDir}\n`)
}

/**
 * Generate static HTML for the story site
 */
function generateStaticHTML(ctx: import('../types').StoryContext): string {
  const { theme } = ctx.config
  const title = theme.title || 'STX Story'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #ffffff;
      --bg-secondary: #f5f5f5;
      --text: #333333;
      --text-secondary: #666666;
      --border: #e0e0e0;
      --primary: #3b82f6;
    }
    .dark {
      --bg: #1a1a1a;
      --bg-secondary: #2a2a2a;
      --text: #ffffff;
      --text-secondary: #a0a0a0;
      --border: #404040;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
    }
    .sidebar {
      width: 280px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 1rem;
    }
    .sidebar h1 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .story-list { list-style: none; }
    .story-item {
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 2px;
    }
    .story-item:hover { background: var(--border); }
    .story-item.active { background: var(--primary); color: white; }
    .main { flex: 1; display: flex; flex-direction: column; }
    .toolbar {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 0.5rem;
    }
    .canvas { flex: 1; padding: 2rem; overflow: auto; }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <h1>📖 ${title}</h1>
    <ul class="story-list" id="story-list"></ul>
  </aside>
  <main class="main">
    <div class="toolbar">
      <button onclick="toggleTheme()">🌓 Theme</button>
    </div>
    <div class="canvas" id="canvas">
      <div class="empty-state">Select a story</div>
    </div>
  </main>
  <script>
    fetch('stories.json')
      .then(r => r.json())
      .then(data => {
        const list = document.getElementById('story-list');
        list.innerHTML = data.files.map(f =>
          '<li class="story-item" onclick="selectStory(\\'' + f.id + '\\')">' + f.fileName + '</li>'
        ).join('');
      });

    function selectStory(id) {
      document.querySelectorAll('.story-item').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');
      fetch('stories/' + id + '.stx')
        .then(r => r.text())
        .then(content => {
          document.getElementById('canvas').innerHTML =
            '<pre style="padding:1rem;overflow:auto;height:100%">' + escapeHtml(content) + '</pre>';
        });
    }

    function escapeHtml(t) {
      const d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }

    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }
  </script>
</body>
</html>`
}

/**
 * Run build command (alias)
 */
export const build: typeof buildCommand = buildCommand
