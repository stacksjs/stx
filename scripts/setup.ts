#!/usr/bin/env bun
/**
 * Development Environment Setup
 *
 * Sets up gitlint hooks and pre-commit linting for development.
 */

import { chmodSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const preCommitHook = `#!/bin/sh
# Pre-commit hook for stx
# This hook runs staged-lint checks on only the files being committed

echo "🔍 Running pre-commit checks..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(js|ts|tsx|stx)$')

if [ -z "$STAGED_FILES" ]; then
    echo "📝 No staged JavaScript/TypeScript files to lint"
    echo "✅ Pre-commit checks passed!"
    exit 0
fi

echo "📝 Running staged-lint on modified files..."
echo "$STAGED_FILES" | while read file; do
    echo "  • $file"
done

# Run ESLint on staged files only
echo "$STAGED_FILES" | xargs bun eslint --fix

# Check if linting was successful
if [ $? -ne 0 ]; then
    echo "❌ Staged linting failed. Please fix the issues before committing."
    echo "💡 Files have been auto-fixed where possible. Please review and re-add them."
    exit 1
fi

# Re-add files that may have been auto-fixed
echo "$STAGED_FILES" | xargs git add

echo "✅ Pre-commit staged-lint checks passed!"
`

const postCommitHook = `#!/bin/sh
# Post-commit hook for stx
# This hook runs auto-versioning after each commit

echo "🚀 Running post-commit auto-versioning..."
bun run scripts/auto-version.ts
`

const commitMsgHook = `#!/bin/sh
# GitLint commit-msg hook for stx
# Uses locally installed gitlint (works offline)

bun node_modules/@stacksjs/gitlint/dist/bin/cli.js --edit "$1"
`

function setup(): void {
  console.log('🚀 Setting up stx development environment...')

  try {
    // Create commit-msg hook
    console.log('📝 Setting up gitlint commit message hook...')
    const commitMsgPath = resolve('.git/hooks/commit-msg')
    writeFileSync(commitMsgPath, commitMsgHook, 'utf8')
    chmodSync(commitMsgPath, 0o755)

    // Create pre-commit hook
    console.log('🔍 Setting up pre-commit staged-lint hook...')
    const preCommitPath = resolve('.git/hooks/pre-commit')
    writeFileSync(preCommitPath, preCommitHook, 'utf8')
    chmodSync(preCommitPath, 0o755)

    // Create post-commit hook
    console.log('🚀 Setting up post-commit auto-versioning hook...')
    const postCommitPath = resolve('.git/hooks/post-commit')
    writeFileSync(postCommitPath, postCommitHook, 'utf8')
    chmodSync(postCommitPath, 0o755)

    console.log('✅ Development environment setup complete!')
    console.log('')
    console.log('📋 Installed hooks:')
    console.log('  • commit-msg: Validates commit message format (local @stacksjs/gitlint)')
    console.log('  • pre-commit: Runs staged-lint on modified files only')
    console.log('  • post-commit: Runs auto-versioning after commits')
    console.log('')
    console.log('💡 Tips:')
    console.log('  • Use conventional commit format: feat|fix|docs|style|refactor|test|chore')
    console.log('  • Staged-lint automatically runs on modified files only')
    console.log('  • Auto-versioning runs after each successful commit')
    console.log('  • All hooks work offline using local dependencies')
    console.log('  • Run "bun run lint:fix" to fix all files manually')
    console.log('  • Use "git commit --no-verify" to skip hooks if needed')
  }
  catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  setup()
}

export { setup }
