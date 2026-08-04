import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'

const SIDEBAR_HEADER = join(import.meta.dir, '../src/ui/sidebar/SidebarHeader.stx')

describe('SidebarHeader', () => {
  it('renders the supplied brand in the macOS title strip when window controls are hidden', async () => {
    const source = await Bun.file(SIDEBAR_HEADER).text()

    expect(source).toContain('@elseif(logo || title)')
    expect(source).toContain('<img src="{{ logo }}"')
    expect(source).toContain('{{ title }}</span>')
  })
})
