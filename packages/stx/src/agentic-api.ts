/**
 * Agentic API Module for STX Dev Server
 *
 * Provides API endpoints for:
 * - AI processing with multiple drivers (Claude CLI, Claude API, OpenAI, Ollama, Mock)
 * - Git operations (clone, commit, push)
 * - File system operations
 * - GitHub integration
 *
 * These APIs enable STX applications to have agentic capabilities
 * where AI can analyze, modify, and commit code changes.
 */

import { $ } from 'bun'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'

// =============================================================================
// Types
// =============================================================================

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

interface AgenticState {
  repo: RepoState | null
  conversationHistory: AIMessage[]
  currentDriver: string
  github: GitHubCredentials | null
}

interface AIDriver {
  name: string
  process: (command: string, context: string, history: AIMessage[]) => Promise<string>
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  workDir: join(homedir(), 'Code', '.buddy-repos'),
  commitMessage: 'chore: wip',
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
}

// API Keys state (can be set at runtime via /api/settings)
const apiKeys: { anthropic?: string, openai?: string, claudeCliHost?: string } = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  claudeCliHost: process.env.BUDDY_EC2_HOST,
}

// State
const state: AgenticState = {
  repo: null,
  conversationHistory: [],
  currentDriver: 'claude-cli',
  github: null,
}

// Ensure work directory exists
if (!existsSync(CONFIG.workDir)) {
  mkdirSync(CONFIG.workDir, { recursive: true })
}

// =============================================================================
// AI Drivers
// =============================================================================

/**
 * Build system prompt for AI
 */
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

const drivers: Record<string, AIDriver> = {
  // Claude CLI driver - executes the `claude` command line tool
  'claude-cli': {
    name: 'Claude CLI',
    async process(command: string, context: string, _history: AIMessage[]): Promise<string> {
      // Check if claude CLI is available
      const whichResult = await $`which claude`.quiet().nothrow()
      if (whichResult.exitCode !== 0) {
        throw new Error('Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code')
      }

      // Build the prompt with context
      const fullPrompt = state.repo
        ? `Working in repository: ${state.repo.path}\n\nContext:\n${context}\n\nUser request: ${command}`
        : command

      // Execute claude CLI with the prompt
      const cwd = state.repo?.path || process.cwd()

      try {
        // Use --dangerously-skip-permissions to allow file operations without interactive prompts
        // Use --print to get just the response
        const result = await $`cd ${cwd} && claude --print --dangerously-skip-permissions ${fullPrompt}`.quiet()
        return result.text().trim()
      }
      catch (error) {
        // Try with allowedTools flag as alternative
        try {
          const result = await $`cd ${cwd} && claude --print --allowedTools "Write,Edit,Bash" ${fullPrompt}`.quiet()
          return result.text().trim()
        }
        catch (innerError) {
          throw new Error(`Claude CLI error: ${(innerError as Error).message}`)
        }
      }
    },
  },

  // Claude CLI with SSH to remote EC2 instance
  'claude-cli-ec2': {
    name: 'Claude CLI (EC2)',
    async process(command: string, context: string, _history: AIMessage[]): Promise<string> {
      const ec2Host = apiKeys.claudeCliHost || process.env.BUDDY_EC2_HOST
      const ec2User = process.env.BUDDY_EC2_USER || 'ubuntu'
      const ec2Key = process.env.BUDDY_EC2_KEY

      if (!ec2Host) {
        throw new Error('EC2 host not configured. Set it in settings or via BUDDY_EC2_HOST environment variable.')
      }

      // Build the prompt
      const fullPrompt = state.repo
        ? `Working in repository: ${state.repo.name}\n\nContext:\n${context}\n\nUser request: ${command}`
        : command

      // Escape the prompt for SSH
      const escapedPrompt = fullPrompt.replace(/'/g, `'\\''`)

      // Build SSH command
      const sshArgs = ec2Key ? `-i ${ec2Key}` : ''
      const sshTarget = `${ec2User}@${ec2Host}`

      try {
        // Execute claude CLI on remote EC2 via SSH
        const result = await $`ssh ${sshArgs} ${sshTarget} "claude --print '${escapedPrompt}'"`.quiet()
        return result.text().trim()
      }
      catch (error) {
        throw new Error(`EC2 Claude CLI error: ${(error as Error).message}. Make sure SSH is configured and claude CLI is installed on EC2.`)
      }
    },
  },

  claude: {
    name: 'Claude',
    async process(command: string, context: string, history: AIMessage[]): Promise<string> {
      const apiKey = apiKeys.anthropic
      if (!apiKey) {
        throw new Error('Anthropic API key not set. Click the settings button to enter your API key.')
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
      const apiKey = apiKeys.openai
      if (!apiKey) {
        throw new Error('OpenAI API key not set. Click the settings button to enter your API key.')
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

// =============================================================================
// Repository Operations
// =============================================================================

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

  for (const match of response.matchAll(filePattern)) {
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

// =============================================================================
// API Request Handler
// =============================================================================

/**
 * Handle API requests for agentic functionality
 * Returns null if the request is not an API route
 */
export async function handleAgenticApi(req: Request): Promise<Response | null> {
  const url = new URL(req.url)

  // Only handle /api/* routes
  if (!url.pathname.startsWith('/api/')) {
    return null
  }

  // CORS headers for all API responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // API: Open repository
    if (url.pathname === '/api/repo' && req.method === 'POST') {
      const { input } = (await req.json()) as { input: string }
      const repo = await openRepository(input)
      return Response.json({ success: true, repo }, { headers: corsHeaders })
    }

    // API: Process command
    if (url.pathname === '/api/process' && req.method === 'POST') {
      const { command, driver } = (await req.json()) as { command: string, driver?: string }

      const response = await processCommand(command, driver)
      const modifiedFiles = await applyChanges(response)

      return Response.json({
        success: true,
        message: response,
        hasChanges: modifiedFiles.length > 0,
        modifiedFiles,
      }, { headers: corsHeaders })
    }

    // API: Commit changes
    if (url.pathname === '/api/commit' && req.method === 'POST') {
      const hash = await commitChanges()
      return Response.json({ success: true, hash, message: CONFIG.commitMessage }, { headers: corsHeaders })
    }

    // API: Push changes
    if (url.pathname === '/api/push' && req.method === 'POST') {
      await pushChanges()
      return Response.json({ success: true }, { headers: corsHeaders })
    }

    // API: Get state
    if (url.pathname === '/api/state' && req.method === 'GET') {
      return Response.json({
        repo: state.repo,
        currentDriver: state.currentDriver,
        historyLength: state.conversationHistory.length,
        availableDrivers: Object.keys(drivers),
        github: state.github ? { username: state.github.username, name: state.github.name, email: state.github.email } : null,
      }, { headers: corsHeaders })
    }

    // API: Connect GitHub
    if (url.pathname === '/api/github/connect' && req.method === 'POST') {
      const { token, username, name, email } = (await req.json()) as GitHubCredentials
      state.github = { token, username, name, email }
      console.log(`GitHub connected: ${username} <${email}>`)
      return Response.json({ success: true, username, name, email }, { headers: corsHeaders })
    }

    // API: Disconnect GitHub
    if (url.pathname === '/api/github/disconnect' && req.method === 'POST') {
      const previousUser = state.github?.username
      state.github = null
      console.log(`GitHub disconnected: ${previousUser || 'unknown'}`)
      return Response.json({ success: true }, { headers: corsHeaders })
    }

    // API: Update settings (API keys)
    if (url.pathname === '/api/settings' && req.method === 'POST') {
      const { apiKeys: newKeys } = (await req.json()) as { apiKeys: { anthropic?: string, openai?: string, claudeCliHost?: string } }

      if (newKeys.anthropic !== undefined) {
        apiKeys.anthropic = newKeys.anthropic || undefined
        console.log(`Anthropic API key ${newKeys.anthropic ? 'set' : 'cleared'}`)
      }
      if (newKeys.openai !== undefined) {
        apiKeys.openai = newKeys.openai || undefined
        console.log(`OpenAI API key ${newKeys.openai ? 'set' : 'cleared'}`)
      }
      if (newKeys.claudeCliHost !== undefined) {
        apiKeys.claudeCliHost = newKeys.claudeCliHost || undefined
        console.log(`Claude CLI Host ${newKeys.claudeCliHost ? 'set to ' + newKeys.claudeCliHost : 'cleared'}`)
      }

      return Response.json({
        success: true,
        configured: {
          anthropic: !!apiKeys.anthropic,
          openai: !!apiKeys.openai,
          claudeCliHost: !!apiKeys.claudeCliHost,
        },
      }, { headers: corsHeaders })
    }

    // API: Get settings status
    if (url.pathname === '/api/settings' && req.method === 'GET') {
      return Response.json({
        configured: {
          anthropic: !!apiKeys.anthropic,
          openai: !!apiKeys.openai,
          claudeCliHost: !!apiKeys.claudeCliHost,
        },
      }, { headers: corsHeaders })
    }

    // API route not found
    return Response.json({ error: 'API endpoint not found' }, { status: 404, headers: corsHeaders })
  }
  catch (error) {
    console.error('API error:', error)
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 400, headers: corsHeaders },
    )
  }
}

// Export state getters for testing
export function getState() {
  return state
}

export function getApiKeys() {
  return apiKeys
}
