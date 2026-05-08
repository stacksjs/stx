const commands = [
  ['bun', 'run', 'build'],
  ['bun', 'run', 'typecheck'],
  ['bun', 'run', 'validate:exports'],
  ['bun', 'run', 'smoke:install'],
  ['bun', 'run', 'bench:budgets'],
  ['bun', 'test', 'packages/stx/test/package-exports.test.ts', 'packages/router/test/layout-metadata.test.ts', 'packages/router/test/client-navigation.test.ts', 'packages/stx/test/build-mode-detector.test.ts', 'packages/stx/test/security/safe-evaluator.test.ts', 'packages/stx/test/components/security.test.ts', 'packages/stx/test/types/public-types.test.ts'],
]

for (const command of commands) {
  console.log(`\n$ ${command.join(' ')}`)
  const result = Bun.spawnSync(command, {
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
  })

  if (result.exitCode !== 0)
    process.exit(result.exitCode)
}

console.log('\nrelease preflight passed')
