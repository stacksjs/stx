import { expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../src/config'
import { createTempDir } from '../src/temp-dir'

test('an application without optional STX config uses the framework defaults', async () => {
  const directory = createTempDir('stx-config-defaults-')
  try {
    const config = await loadStxConfig(directory)
    expect(config.enabled).toBe(true)
    expect(config.defaultLayout).toBe(defaultConfig.defaultLayout)
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})

for (const filename of ['stx.config.ts', 'config/ui.ts']) {
  test(`a malformed ${filename} is rejected instead of using defaults`, async () => {
    const directory = createTempDir('stx-config-invalid-')
    try {
      const file = join(directory, filename)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, 'export default { componentsDir: [\n')
      await expect(loadStxConfig(directory)).rejects.toThrow()
    }
    finally { rmSync(directory, { recursive: true, force: true }) }
  })
}

test('a runtime failure in the config is propagated', async () => {
  const directory = createTempDir('stx-config-runtime-')
  try {
    writeFileSync(join(directory, 'stx.config.ts'), "throw new Error('Configured STX settings failed')\nexport default {}\n")
    await expect(loadStxConfig(directory)).rejects.toThrow('Configured STX settings failed')
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})
