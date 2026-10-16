import { describe, expect, test } from 'bun:test'
import * as path from 'node:path'
import {
  componentDirectoryForDocument,
  extractedComponentContent,
  normalizeComponentName,
} from '../src/commands/extract-component'

describe('extract to component', () => {
  test('normalizes common component names', () => {
    expect(normalizeComponentName('user-card')).toBe('UserCard')
    expect(normalizeComponentName('userCard')).toBe('UserCard')
    expect(normalizeComponentName('UserCard')).toBe('UserCard')
    expect(normalizeComponentName('../UserCard')).toBeUndefined()
  })

  test('removes selection indentation without changing its structure', () => {
    expect(extractedComponentContent(`
      <article>
        <h2>Title</h2>
      </article>
    `)).toBe('<article>\n  <h2>Title</h2>\n</article>\n')
    expect(extractedComponentContent('\n\n')).toBe('\n')
  })

  test('uses the component convention matching the document layout', () => {
    const workspace = path.join(path.sep, 'workspace')
    expect(componentDirectoryForDocument(workspace, path.join(workspace, 'pages', 'index.stx')))
      .toBe(path.join(workspace, 'components'))
    expect(componentDirectoryForDocument(workspace, path.join(workspace, 'resources', 'views', 'home.stx')))
      .toBe(path.join(workspace, 'resources', 'views', 'components'))
    expect(componentDirectoryForDocument(workspace, path.join(workspace, 'src', 'pages', 'home.stx')))
      .toBe(path.join(workspace, 'src', 'components'))
  })
})
