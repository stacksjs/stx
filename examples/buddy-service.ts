/**
 * Buddy - Voice AI Code Assistant Backend Service
 *
 * This service handles:
 * - Multiple AI driver support (Claude, OpenAI, Ollama, Mock)
 * - GitHub repository cloning and management
 * - Git commit and push operations
 *
 * Usage:
 *   bun examples/buddy-service.ts
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY - For Claude driver
 *   OPENAI_API_KEY - For OpenAI driver
 *   OLLAMA_HOST - For Ollama driver (default: http://localhost:11434)
 */

import { $ } from 'bun'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

// Types
interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RepoState {
  path: string
  name: string
  branch: string
  hasChanges: boolean
  lastCommit?: string
}

interface GitHubCredentials {
  token: string
  username: string
  name: string
  email: string
}

interface BuddyState {
  repo: RepoState | null
  conversationHistory: AIMessage[]
  currentDriver: string
  github: GitHubCredentials | null
}

interface AIDriver {
  name: string
  process: (command: string, context: string, history: AIMessage[]) => Promise<string>
}

// Configuration
const CONFIG = {
  workDir: join(homedir(), 'Code', '.buddy-repos'),
  commitMessage: 'chore: wip',
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
}

// State
const state: BuddyState = {
  repo: null,
  conversationHistory: [],
  currentDriver: 'claude',
  github: null,
}

// Ensure work directory exists
if (!existsSync(CONFIG.workDir)) {
  mkdirSync(CONFIG.workDir, { recursive: true })
}

// AI Drivers
const drivers: Record<string, AIDriver> = {
  claude: {
    name: 'Claude',
    async process(command: string, context: string, history: AIMessage[]): Promise<string> {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set')
      }

      const systemPrompt = buildSystemPrompt(context)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [...history, { role: 'user', content: command }],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Claude API error: ${error}`)
      }

      const data = (await response.json()) as { content: Array<{ text: string }> }
      return data.content[0].text
    },
  },

  openai: {
    name: 'OpenAI',
    async process(command: string, context: string, history: AIMessage[]): Promise<string> {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set')
      }

      const systemPrompt = buildSystemPrompt(context)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: command },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
      return data.choices[0].message.content
    },
  },

  ollama: {
    name: 'Ollama',
    async process(command: string, context: string, history: AIMessage[]): Promise<string> {
      const systemPrompt = buildSystemPrompt(context)

      const response = await fetch(`${CONFIG.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.ollamaModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: command },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Ollama API error: ${error}`)
      }

      const data = (await response.json()) as { message: { content: string } }
      return data.message.content
    },
  },

  mock: {
    name: 'Mock',
    async process(command: string): Promise<string> {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const lowerCommand = command.toLowerCase()

      if (lowerCommand.includes('readme') || lowerCommand.includes('documentation')) {
        return `I'll update the README.md file for you.

Analyzing the repository structure...

FILE: README.md
\`\`\`markdown
# Project Name

## Installation

\`\`\`bash
npm install
# or
bun install
\`\`\`

## Usage

\`\`\`bash
npm run start
\`\`\`
\`\`\`

File modified: README.md
Lines added: 12`
      }

      if (lowerCommand.includes('fix') || lowerCommand.includes('bug')) {
        return `I'll analyze and fix the issue.

Scanning for potential bugs...

FILE: src/utils.ts
\`\`\`typescript
export function getData(data: { value?: string }) {
  return data?.value ?? 'default';
}
\`\`\`

Files modified: src/utils.ts
Lines changed: 4`
      }

      return `I understand you want to: "${command}"

I'll analyze the repository and implement this change.

FILE: src/main.ts
\`\`\`typescript
// Updated based on your request
export function main() {
  console.log('Changes applied');
}
\`\`\`

Files modified: 1`
    },
  },
}

// Build system prompt for AI
function buildSystemPrompt(context: string): string {
  return `You are Buddy, an AI code assistant that helps users modify codebases through voice commands.

${state.repo
  ? `You are working on the repository: ${state.repo.name}
Branch: ${state.repo.branch}
Path: ${state.repo.path}

${context}`
  : 'No repository is currently open.'}

When the user gives you a command:
1. Analyze what they want to do
2. Identify the files that need to be modified
3. Generate the exact code changes needed
4. Respond with a structured format showing:
   - Summary of changes
   - Files to modify/create with full content
   - Any additional notes

Format file changes as:
FILE: path/to/file.ts
\`\`\`typescript
// Full file content
\`\`\`

Be concise but thorough. The user will review and commit your changes.`
}

/**
 * Clone or open a repository
 */
async function openRepository(input: string): Promise<RepoState> {
  let repoPath: string
  let repoName: string

  if (input.includes('github.com') || input.startsWith('git@')) {
    repoName = input.split('/').pop()?.replace('.git', '') || 'repo'
    repoPath = join(CONFIG.workDir, repoName)

    if (existsSync(repoPath)) {
      console.log(`Repository already exists, pulling latest...`)
      await $`cd ${repoPath} && git pull --rebase`.quiet()
    }
    else {
      console.log(`Cloning ${input}...`)
      await $`git clone ${input} ${repoPath}`.quiet()
    }
  }
  else {
    repoPath = input.startsWith('~') ? input.replace('~', homedir()) : input

    if (!existsSync(repoPath)) {
      throw new Error(`Local path does not exist: ${repoPath}`)
    }

    if (!existsSync(join(repoPath, '.git'))) {
      throw new Error(`Not a git repository: ${repoPath}`)
    }

    repoName = repoPath.split('/').pop() || 'repo'
  }

  const branchResult = await $`cd ${repoPath} && git branch --show-current`.quiet()
  const branch = branchResult.text().trim()

  const statusResult = await $`cd ${repoPath} && git status --porcelain`.quiet()
  const hasChanges = statusResult.text().trim().length > 0

  const lastCommitResult = await $`cd ${repoPath} && git log -1 --format="%h %s"`.quiet()
  const lastCommit = lastCommitResult.text().trim()

  const repoState: RepoState = {
    path: repoPath,
    name: repoName,
    branch,
    hasChanges,
    lastCommit,
  }

  state.repo = repoState
  state.conversationHistory = [] // Reset conversation for new repo
  return repoState
}

/**
 * Get repository structure for context
 */
async function getRepoContext(repoPath: string): Promise<string> {
  const treeResult
    = await $`cd ${repoPath} && find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -name "*.lock" | head -50`.quiet()
  const files = treeResult.text().trim()

  let readme = ''
  const readmePath = join(repoPath, 'README.md')
  if (existsSync(readmePath)) {
    readme = readFileSync(readmePath, 'utf-8').slice(0, 2000)
  }

  let packageJson = ''
  const packagePath = join(repoPath, 'package.json')
  if (existsSync(packagePath)) {
    packageJson = readFileSync(packagePath, 'utf-8')
  }

  return `
Repository Structure:
${files}

${readme ? `README.md (excerpt):\n${readme}\n` : ''}
${packageJson ? `package.json:\n${packageJson}\n` : ''}
`.trim()
}

/**
 * Process command with selected AI driver
 */
async function processCommand(command: string, driverName?: string): Promise<string> {
  if (!state.repo) {
    throw new Error('No repository opened')
  }

  const driver = drivers[driverName || state.currentDriver]
  if (!driver) {
    throw new Error(`Unknown driver: ${driverName || state.currentDriver}`)
  }

  if (driverName) {
    state.currentDriver = driverName
  }

  const context = await getRepoContext(state.repo.path)
  const response = await driver.process(command, context, state.conversationHistory)

  // Update conversation history
  state.conversationHistory.push({ role: 'user', content: command })
  state.conversationHistory.push({ role: 'assistant', content: response })

  return response
}

/**
 * Apply file changes from AI response
 */
async function applyChanges(response: string): Promise<string[]> {
  if (!state.repo) {
    throw new Error('No repository opened')
  }

  const modifiedFiles: string[] = []
  const filePattern = /FILE:\s*([^\n]+)\n```\w*\n([\s\S]*?)```/g
  let match

  while ((match = filePattern.exec(response)) !== null) {
    const filePath = match[1].trim()
    const content = match[2]

    const fullPath = join(state.repo.path, filePath)

    const dir = dirname(fullPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(fullPath, content)
    modifiedFiles.push(filePath)
    console.log(`Modified: ${filePath}`)
  }

  if (modifiedFiles.length > 0) {
    state.repo.hasChanges = true
  }

  return modifiedFiles
}

/**
 * Configure git user for commits
 */
async function configureGitUser(): Promise<void> {
  if (!state.repo || !state.github)
    return

  const { name, email } = state.github

  // Set local git config for this repo
  await $`cd ${state.repo.path} && git config user.name ${name}`.quiet()
  await $`cd ${state.repo.path} && git config user.email ${email}`.quiet()

  console.log(`Git configured for ${name} <${email}>`)
}

/**
 * Stage and commit changes
 */
async function commitChanges(): Promise<string> {
  if (!state.repo) {
    throw new Error('No repository opened')
  }

  // Configure git user if GitHub is connected
  if (state.github) {
    await configureGitUser()
  }

  await $`cd ${state.repo.path} && git add -A`.quiet()
  await $`cd ${state.repo.path} && git commit -m ${CONFIG.commitMessage}`.quiet()

  const hashResult = await $`cd ${state.repo.path} && git rev-parse --short HEAD`.quiet()
  const commitHash = hashResult.text().trim()

  state.repo.hasChanges = false
  state.repo.lastCommit = commitHash

  return commitHash
}

/**
 * Push changes to remote
 */
async function pushChanges(): Promise<void> {
  if (!state.repo) {
    throw new Error('No repository opened')
  }

  await $`cd ${state.repo.path} && git push`.quiet()
}

// Read the STX template
const stxPath = join(import.meta.dir, 'voice-buddy.stx')
const html = readFileSync(stxPath, 'utf-8')

// Create the server
const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url)

    // Serve the main UI
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // API: Open repository
    if (url.pathname === '/api/repo' && req.method === 'POST') {
      try {
        const { input } = (await req.json()) as { input: string }
        const repo = await openRepository(input)
        return Response.json({ success: true, repo })
      }
      catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 400 })
      }
    }

    // API: Process command
    if (url.pathname === '/api/process' && req.method === 'POST') {
      try {
        const { command, driver } = (await req.json()) as { command: string, driver?: string }

        const response = await processCommand(command, driver)
        const modifiedFiles = await applyChanges(response)

        return Response.json({
          success: true,
          message: response,
          hasChanges: modifiedFiles.length > 0,
          modifiedFiles,
        })
      }
      catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 400 })
      }
    }

    // API: Commit changes
    if (url.pathname === '/api/commit' && req.method === 'POST') {
      try {
        const hash = await commitChanges()
        return Response.json({ success: true, hash, message: CONFIG.commitMessage })
      }
      catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 400 })
      }
    }

    // API: Push changes
    if (url.pathname === '/api/push' && req.method === 'POST') {
      try {
        await pushChanges()
        return Response.json({ success: true })
      }
      catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 400 })
      }
    }

    // API: Get state
    if (url.pathname === '/api/state' && req.method === 'GET') {
      return Response.json({
        repo: state.repo,
        currentDriver: state.currentDriver,
        historyLength: state.conversationHistory.length,
        availableDrivers: Object.keys(drivers),
        github: state.github ? { username: state.github.username, name: state.github.name, email: state.github.email } : null,
      })
    }

    // API: Connect GitHub
    if (url.pathname === '/api/github/connect' && req.method === 'POST') {
      try {
        const { token, username, name, email } = (await req.json()) as GitHubCredentials
        state.github = { token, username, name, email }
        console.log(`GitHub connected: ${username} <${email}>`)
        return Response.json({ success: true, username, name, email })
      }
      catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 400 })
      }
    }

    // API: Disconnect GitHub
    if (url.pathname === '/api/github/disconnect' && req.method === 'POST') {
      const previousUser = state.github?.username
      state.github = null
      console.log(`GitHub disconnected: ${previousUser || 'unknown'}`)
      return Response.json({ success: true })
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🤖  Buddy - Voice AI Code Assistant                      ║
║                                                            ║
║   Running at: http://localhost:${server.port}                      ║
║                                                            ║
║   AI Drivers:                                              ║
║   • Claude (ANTHROPIC_API_KEY)                             ║
║   • OpenAI (OPENAI_API_KEY)                                ║
║   • Ollama (local, no key needed)                          ║
║   • Mock (demo mode)                                       ║
║                                                            ║
║   Features:                                                ║
║   • Voice & text input                                     ║
║   • GitHub account connection                              ║
║   • Git commit with "chore: wip"                           ║
║   • GitHub repo cloning                                    ║
║                                                            ║
║   Press Ctrl+C to stop                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`)

// Open in browser
const { exec } = await import('node:child_process')
if (process.platform === 'darwin') {
  exec(`open http://localhost:${server.port}`)
}
else if (process.platform === 'win32') {
  exec(`start http://localhost:${server.port}`)
}
else {
  exec(`xdg-open http://localhost:${server.port}`)
}
