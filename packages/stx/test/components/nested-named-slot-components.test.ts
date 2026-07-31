import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'

let fixtureDir = ''

beforeAll(() => {
  fixtureDir = mkdtempSync(join(tmpdir(), 'stx-nested-slots-'))
  writeFileSync(join(fixtureDir, 'card.stx'), '<section><slot name="header" /></section>')
  writeFileSync(
    join(fixtureDir, 'input.stx'),
    `<script client>
defineProps({ value: '', ariaLabel: '', placeholder: '', size: 'md' })
defineEmits(['input', 'update:value'])
</script>
<label><slot name="iconLeft" /><input :value="value"></label>`,
  )
})

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('nested named-slot components', () => {
  it('consumes the complete nested component invocation', async () => {
    const result = await processDirectives(
      `<Card>
        <template #header>
          <Input v-model:value="searchQuery" ariaLabel="Search errors" placeholder="Search errors..." size="sm" @input="resetFilterPage">
            <template #iconLeft><span>Search</span></template>
          </Input>
        </template>
      </Card>`,
      {},
      join(fixtureDir, 'page.stx'),
      { componentsDir: fixtureDir },
      new Set<string>(),
    )

    expect(result).toContain('<section>')
    expect(result).toContain('<label>')
    expect(result).toContain('<span>Search</span>')
    expect(result).not.toContain('</Input>')
    expect(result).not.toContain('</template>')
  })
})
