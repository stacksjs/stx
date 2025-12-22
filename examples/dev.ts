import { spawn } from 'bun'

const headwindBin = '/Users/glennmichaeltorregosa/Documents/Projects/headwind/packages/headwind/bin/headwind'

// Start headwind watch
const headwind = spawn([headwindBin, 'watch', '--config', './headwind.config.ts'], {
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
  headwind.kill()
  server.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  headwind.kill()
  server.kill()
  process.exit(0)
})

// Wait for both
await Promise.all([headwind.exited, server.exited])
