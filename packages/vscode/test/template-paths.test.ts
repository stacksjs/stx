import { describe, expect, test } from 'bun:test'
import {
  COMPONENT_SEARCH_DIRECTORIES,
  findTemplatePathReferences,
  getTemplatePathCompletionContext,
  TEMPLATE_SEARCH_DIRECTORIES,
} from '../src/utils/template-paths'

describe('template path completion context', () => {
  test('recognizes regular includes and components', () => {
    expect(getTemplatePathCompletionContext("@include('partials/hea")).toEqual({ kind: 'include', path: 'partials/hea' })
    expect(getTemplatePathCompletionContext("@component('User")).toEqual({ kind: 'component', path: 'User' })
    expect(getTemplatePathCompletionContext("@webcomponent('ui/car")).toEqual({ kind: 'component', path: 'ui/car' })
    expect(getTemplatePathCompletionContext('<div>plain markup</div>')).toBeUndefined()
  })

  test('recognizes conditional and first-existing includes', () => {
    expect(getTemplatePathCompletionContext("@includeIf('optional/nav")).toEqual({ kind: 'include', path: 'optional/nav' })
    expect(getTemplatePathCompletionContext("@includeWhen(user, 'admin/nav")).toEqual({ kind: 'include', path: 'admin/nav' })
    expect(getTemplatePathCompletionContext("@includeWhen(can('admin', user), 'admin/nav")).toEqual({ kind: 'include', path: 'admin/nav' })
    expect(getTemplatePathCompletionContext("@includeUnless(hidden, \"menu")).toEqual({ kind: 'include', path: 'menu' })
    expect(getTemplatePathCompletionContext("@includeFirst(['mobile/nav")).toEqual({ kind: 'include', path: 'mobile/nav' })
    expect(getTemplatePathCompletionContext("@includeFirst(['mobile/nav', 'desktop/nav")).toEqual({ kind: 'include', path: 'desktop/nav' })
  })

  test('finds paths for navigation without confusing include argument order', () => {
    expect(findTemplatePathReferences("@includeIf('optional/nav')").map(reference => reference.path)).toEqual(['optional/nav'])
    expect(findTemplatePathReferences("@includeWhen(user.isAdmin, 'admin/nav')").map(reference => reference.path)).toEqual(['admin/nav'])
    expect(findTemplatePathReferences("@includeWhen(can('admin', user), 'admin/nav')").map(reference => reference.path)).toEqual(['admin/nav'])
    expect(findTemplatePathReferences("@webcomponent('ui/menu')").map(reference => reference.path)).toEqual(['ui/menu'])
  })

  test('finds every includeFirst fallback with exact source ranges', () => {
    const line = "@includeFirst(['custom/header', 'default/header'])"
    const references = findTemplatePathReferences(line)

    expect(references.map(reference => reference.path)).toEqual(['custom/header', 'default/header'])
    expect(references.map(reference => line.slice(reference.start, reference.end))).toEqual(['custom/header', 'default/header'])
  })

  test('shares standalone, Stacks, and src directory conventions', () => {
    expect(TEMPLATE_SEARCH_DIRECTORIES).toContain('resources/views')
    expect(TEMPLATE_SEARCH_DIRECTORIES).toContain('src/views')
    expect(COMPONENT_SEARCH_DIRECTORIES).toContain('resources/views/components')
    expect(COMPONENT_SEARCH_DIRECTORIES).toContain('src/components')
  })
})
