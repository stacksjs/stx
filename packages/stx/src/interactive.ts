import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
/**
 * Interactive CLI Mode
 *
 * Provides an interactive REPL-like experience for stx development.
 * Users can execute commands, preview templates, and explore the codebase
 * without leaving the terminal.
 *
 * ## Features
 *
 * - Interactive command prompt
 * - Template rendering preview
 * - Expression evaluation
 * - File watching integration
 * - History support
 * - Tab completion
 *
 * ## Usage
 *
 * ```bash
 * stx interactive
 * stx i  # shorthand
 * ```
 *
 * ## Commands (in interactive mode)
 *
 * - `render <file>` - Render a template and show output
 * - `eval <expr>` - Evaluate an expression with current context
 * - `set <key> <value>` - Set a context variable
 * - `context` - Show current context
 * - `clear` - Clear context
 * - `watch <file>` - Watch a file for changes
 * - `help` - Show available commands
 * - `exit` / `quit` - Exit interactive mode
 */
import * as readline from 'node:readline'
import { processExpressions } from './expressions'
import { processDirectives } from './process'

// =============================================================================
// Types
// =============================================================================

export interface InteractiveOptions {
  /** Initial context variables */
  context?: Record<string, any>
  /** Working directory */
  cwd?: string
  /** Show verbose output */
  verbose?: boolean
  /** History file path */
  historyFile?: string
  /** Max history entries */
  maxHistory?: number
}

interface InteractiveState {
  context: Record<string, any>
  cwd: string
  history: string[]
  running: boolean
  lastResult: any
}

// =============================================================================
// Colors
// =============================================================================

const c = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
}

// =============================================================================
// Interactive Commands
// =============================================================================

const commands: Record<string, {
  description: string
  usage: string
  handler: (args: string[], state: InteractiveState) => Promise<void>
}> = {
  help: {
    description: 'Show available commands',
    usage: 'help [command]',
    handler: async (args, _state) => {
      if (args[0] && commands[args[0]]) {
        const cmd = commands[args[0]]
        console.log(`\n${c.bold}${args[0]}${c.reset} - ${cmd.description}`)
        console.log(`  Usage: ${c.cyan}${cmd.usage}${c.reset}\n`)
      }
      else {
        console.log(`\n${c.bold}Available Commands:${c.reset}\n`)
        for (const [name, cmd] of Object.entries(commands)) {
          console.log(`  ${c.cyan}${name.padEnd(12)}${c.reset} ${cmd.description}`)
        }
        console.log(`\n${c.dim}Type 'help <command>' for more details${c.reset}\n`)
      }
    },
  },

  render: {
    description: 'Render a template file',
    usage: 'render <file> [--raw]',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.red}Error: Please specify a file to render${c.reset}`)
        return
      }

      const filePath = path.resolve(state.cwd, args[0])

      if (!fs.existsSync(filePath)) {
        console.log(`${c.red}Error: File not found: ${filePath}${c.reset}`)
        return
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const showRaw = args.includes('--raw')

        console.log(`\n${c.dim}Rendering ${filePath}...${c.reset}\n`)

        const result = await processDirectives(content, state.context, filePath, {})
        state.lastResult = result

        if (showRaw) {
          console.log(result)
        }
        else {
          // Pretty print with line numbers
          const lines = result.split('\n')
          lines.forEach((line, i) => {
            const lineNum = String(i + 1).padStart(3, ' ')
            console.log(`${c.dim}${lineNum}${c.reset} ${line}`)
          })
        }
        console.log()
      }
      catch (error) {
        console.log(`${c.red}Error rendering template:${c.reset}`, error)
      }
    },
  },

  eval: {
    description: 'Evaluate an expression',
    usage: 'eval <expression>',
    handler: async (args, state) => {
      if (!args.length) {
        console.log(`${c.red}Error: Please provide an expression to evaluate${c.reset}`)
        return
      }

      const expr = args.join(' ')

      try {
        // Wrap in {{ }} for expression processing
        const template = `{{ ${expr} }}`
        const result = await processExpressions(template, state.context, 'eval')

        // Strip any whitespace
        const output = result.trim()
        state.lastResult = output

        console.log(`${c.green}→${c.reset} ${output}`)
      }
      catch (error) {
        console.log(`${c.red}Error:${c.reset}`, error)
      }
    },
  },

  set: {
    description: 'Set a context variable',
    usage: 'set <key> <value>',
    handler: async (args, state) => {
      if (args.length < 2) {
        console.log(`${c.red}Error: Usage: set <key> <value>${c.reset}`)
        return
      }

      const key = args[0]
      const valueStr = args.slice(1).join(' ')

      // Try to parse as JSON, otherwise use as string
      let value: any
      try {
        value = JSON.parse(valueStr)
      }
      catch {
        value = valueStr
      }

      state.context[key] = value
      console.log(`${c.green}✓${c.reset} ${key} = ${JSON.stringify(value)}`)
    },
  },

  unset: {
    description: 'Remove a context variable',
    usage: 'unset <key>',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.red}Error: Please specify a variable to remove${c.reset}`)
        return
      }

      if (args[0] in state.context) {
        delete state.context[args[0]]
        console.log(`${c.green}✓${c.reset} Removed ${args[0]}`)
      }
      else {
        console.log(`${c.yellow}Variable not found: ${args[0]}${c.reset}`)
      }
    },
  },

  context: {
    description: 'Show current context variables',
    usage: 'context',
    handler: async (_args, state) => {
      const keys = Object.keys(state.context)

      if (keys.length === 0) {
        console.log(`${c.dim}Context is empty${c.reset}`)
        return
      }

      console.log(`\n${c.bold}Context Variables:${c.reset}\n`)
      for (const key of keys) {
        const value = state.context[key]
        const type = Array.isArray(value) ? 'array' : typeof value
        const preview = JSON.stringify(value).slice(0, 50)
        console.log(`  ${c.cyan}${key}${c.reset} ${c.dim}(${type})${c.reset}: ${preview}${preview.length >= 50 ? '...' : ''}`)
      }
      console.log()
    },
  },

  clear: {
    description: 'Clear context or screen',
    usage: 'clear [context|screen]',
    handler: async (args, state) => {
      if (args[0] === 'context' || !args[0]) {
        state.context = {}
        console.log(`${c.green}✓${c.reset} Context cleared`)
      }
      if (args[0] === 'screen' || !args[0]) {
        console.clear()
      }
    },
  },

  cd: {
    description: 'Change working directory',
    usage: 'cd <directory>',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.cyan}${state.cwd}${c.reset}`)
        return
      }

      const newPath = path.resolve(state.cwd, args[0])

      if (!fs.existsSync(newPath)) {
        console.log(`${c.red}Error: Directory not found: ${newPath}${c.reset}`)
        return
      }

      if (!fs.statSync(newPath).isDirectory()) {
        console.log(`${c.red}Error: Not a directory: ${newPath}${c.reset}`)
        return
      }

      state.cwd = newPath
      console.log(`${c.green}✓${c.reset} ${newPath}`)
    },
  },

  ls: {
    description: 'List files in current directory',
    usage: 'ls [pattern]',
    handler: async (args, state) => {
      const pattern = args[0] || '*'
      const glob = new Bun.Glob(pattern)

      const files: string[] = []
      for await (const file of glob.scan({ cwd: state.cwd, onlyFiles: false })) {
        files.push(file)
      }

      if (files.length === 0) {
        console.log(`${c.dim}No files found${c.reset}`)
        return
      }

      // Sort and display
      files.sort()
      const stxFiles = files.filter(f => f.endsWith('.stx'))
      const mdFiles = files.filter(f => f.endsWith('.md'))
      const otherFiles = files.filter(f => !f.endsWith('.stx') && !f.endsWith('.md'))

      if (stxFiles.length > 0) {
        console.log(`\n${c.bold}Templates:${c.reset}`)
        stxFiles.forEach(f => console.log(`  ${c.green}${f}${c.reset}`))
      }

      if (mdFiles.length > 0) {
        console.log(`\n${c.bold}Markdown:${c.reset}`)
        mdFiles.forEach(f => console.log(`  ${c.blue}${f}${c.reset}`))
      }

      if (otherFiles.length > 0) {
        console.log(`\n${c.bold}Other:${c.reset}`)
        otherFiles.forEach(f => console.log(`  ${c.dim}${f}${c.reset}`))
      }

      console.log()
    },
  },

  cat: {
    description: 'Show file contents',
    usage: 'cat <file>',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.red}Error: Please specify a file${c.reset}`)
        return
      }

      const filePath = path.resolve(state.cwd, args[0])

      if (!fs.existsSync(filePath)) {
        console.log(`${c.red}Error: File not found: ${filePath}${c.reset}`)
        return
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      console.log()
      lines.forEach((line, i) => {
        const lineNum = String(i + 1).padStart(3, ' ')
        console.log(`${c.dim}${lineNum}${c.reset} ${line}`)
      })
      console.log()
    },
  },

  load: {
    description: 'Load context from JSON file',
    usage: 'load <file.json>',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.red}Error: Please specify a JSON file${c.reset}`)
        return
      }

      const filePath = path.resolve(state.cwd, args[0])

      if (!fs.existsSync(filePath)) {
        console.log(`${c.red}Error: File not found: ${filePath}${c.reset}`)
        return
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)
        state.context = { ...state.context, ...data }
        console.log(`${c.green}✓${c.reset} Loaded ${Object.keys(data).length} variables from ${args[0]}`)
      }
      catch (error) {
        console.log(`${c.red}Error parsing JSON:${c.reset}`, error)
      }
    },
  },

  save: {
    description: 'Save context to JSON file',
    usage: 'save <file.json>',
    handler: async (args, state) => {
      if (!args[0]) {
        console.log(`${c.red}Error: Please specify a file name${c.reset}`)
        return
      }

      const filePath = path.resolve(state.cwd, args[0])

      try {
        fs.writeFileSync(filePath, JSON.stringify(state.context, null, 2))
        console.log(`${c.green}✓${c.reset} Context saved to ${args[0]}`)
      }
      catch (error) {
        console.log(`${c.red}Error saving file:${c.reset}`, error)
      }
    },
  },

  history: {
    description: 'Show command history',
    usage: 'history [count]',
    handler: async (args, state) => {
      const count = args[0] ? Number.parseInt(args[0], 10) : 20
      const entries = state.history.slice(-count)

      if (entries.length === 0) {
        console.log(`${c.dim}No history${c.reset}`)
        return
      }

      console.log()
      entries.forEach((cmd, i) => {
        const num = String(state.history.length - entries.length + i + 1).padStart(3, ' ')
        console.log(`${c.dim}${num}${c.reset} ${cmd}`)
      })
      console.log()
    },
  },

  exit: {
    description: 'Exit interactive mode',
    usage: 'exit',
    handler: async (_args, state) => {
      state.running = false
      console.log(`\n${c.dim}Goodbye!${c.reset}\n`)
    },
  },

  quit: {
    description: 'Exit interactive mode (alias for exit)',
    usage: 'quit',
    handler: async (args, state) => commands.exit.handler(args, state),
  },
}

// =============================================================================
// Tab Completion
// =============================================================================

function getCompletions(line: string, state: InteractiveState): string[] {
  const parts = line.split(' ')
  const cmd = parts[0]

  // Complete command names
  if (parts.length === 1) {
    return Object.keys(commands).filter(c => c.startsWith(cmd))
  }

  // Complete file paths for file-related commands
  if (['render', 'cat', 'load', 'cd'].includes(cmd)) {
    const partial = parts.slice(1).join(' ')
    const dir = path.dirname(partial) || '.'
    const prefix = path.basename(partial)
    const searchDir = path.resolve(state.cwd, dir)

    if (fs.existsSync(searchDir) && fs.statSync(searchDir).isDirectory()) {
      try {
        const files = fs.readdirSync(searchDir)
        return files
          .filter(f => f.startsWith(prefix))
          .map(f => `${cmd} ${dir === '.' ? '' : `${dir}/`}${f}`)
      }
      catch {
        return []
      }
    }
  }

  // Complete context variable names for set/unset/eval
  if (['unset', 'eval', 'set'].includes(cmd)) {
    const partial = parts[1] || ''
    return Object.keys(state.context)
      .filter(k => k.startsWith(partial))
      .map(k => `${cmd} ${k}`)
  }

  return []
}

// =============================================================================
// Main Interactive Loop
// =============================================================================

/**
 * Start interactive CLI mode
 */
export async function startInteractive(options: InteractiveOptions = {}): Promise<void> {
  const state: InteractiveState = {
    context: options.context || {},
    cwd: options.cwd || process.cwd(),
    history: [],
    running: true,
    lastResult: null,
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line: string) => {
      const completions = getCompletions(line, state)
      return [completions, line]
    },
    historySize: options.maxHistory || 100,
  })

  // Welcome message
  console.log(`
${c.bold}${c.blue}stx Interactive Mode${c.reset}
${c.dim}Type 'help' for available commands, 'exit' to quit${c.reset}
`)

  // Prompt function
  const prompt = () => {
    const cwdShort = state.cwd.replace(process.env.HOME || '', '~')
    rl.question(`${c.cyan}stx${c.reset} ${c.dim}${cwdShort}${c.reset} ${c.green}>${c.reset} `, async (input) => {
      const line = input.trim()

      if (!line) {
        if (state.running)
          prompt()
        return
      }

      // Add to history
      state.history.push(line)

      // Parse command and arguments
      const parts = line.match(/(?:[^\s"]|"[^"]*")+/g) || []
      const cmd = parts[0]?.toLowerCase()
      const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''))

      // Execute command
      if (commands[cmd]) {
        try {
          await commands[cmd].handler(args, state)
        }
        catch (error) {
          console.log(`${c.red}Error:${c.reset}`, error)
        }
      }
      else if (cmd) {
        // Try to evaluate as expression if not a command
        if (line.includes('{{') || line.includes('}}')) {
          try {
            const result = await processExpressions(line, state.context, 'eval')
            console.log(`${c.green}→${c.reset} ${result}`)
          }
          catch {
            console.log(`${c.red}Unknown command: ${cmd}${c.reset}`)
            console.log(`${c.dim}Type 'help' for available commands${c.reset}`)
          }
        }
        else {
          console.log(`${c.red}Unknown command: ${cmd}${c.reset}`)
          console.log(`${c.dim}Type 'help' for available commands${c.reset}`)
        }
      }

      // Continue if still running
      if (state.running) {
        prompt()
      }
      else {
        rl.close()
      }
    })
  }

  // Handle Ctrl+C
  rl.on('SIGINT', () => {
    console.log(`\n${c.dim}(Use 'exit' to quit)${c.reset}`)
    prompt()
  })

  // Start the prompt
  prompt()
}
