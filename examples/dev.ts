import { spawn } from 'bun'

const cssBin = '/Users/glennmichaeltorregosa/Documents/Projects/css/packages/css/bin/css'

// Start css watch
const css = spawn([cssBin, 'watch', '--config', './css.config.ts'], {
  cwd: import.meta.dir,
  stdout: 'inherit',
  stderr: 'inherit',
})

// Start server
const server = spawn(['bun', 'serve.ts'], {
  cwd: import.meta.dir,
  stdout: 'inherit',
  stderr: 'inherit',
})

// Handle cleanup
process.on('SIGINT', () => {
  css.kill()
  server.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  css.kill()
  server.kill()
  process.exit(0)
})

// Wait for both
await Promise.all([css.exited, server.exited])
