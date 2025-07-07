import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Get the current git hash
function getCurrentGitHash(): string {
  try {
    // Execute git command to get the shortened commit hash
    const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf-8',
    })

    if (result.error) {
      console.error('Error executing git command:', result.error)
      return 'unknown'
    }

    if (result.status !== 0) {
      console.error('Git command failed with status code:', result.status)
      console.error('stderr:', result.stderr)
      return 'unknown'
    }

    // Trim the output to remove any whitespace or newlines
    return result.stdout.trim()
  }
  catch (error) {
    console.error('Failed to get git hash:', error)
    return 'unknown'
  }
}

// Update the release.ts file with the current git hash
function updateReleaseFile(gitHash: string) {
  // Path to the release.ts file
  const releaseFilePath = path.resolve(__dirname, '../src/release.ts')

  // Content to write to the file
  const fileContent = `export const gitHash = '${gitHash}'\n`

  try {
    // Write the file
    writeFileSync(releaseFilePath, fileContent, 'utf-8')
    console.log(`Successfully updated git hash to ${gitHash} in release.ts`)
  }
  catch (error) {
    console.error('Failed to update release.ts file:', error)
    process.exit(1)
  }
}

// Main execution
function main() {
  const gitHash = getCurrentGitHash()
  updateReleaseFile(gitHash)
}

main()
