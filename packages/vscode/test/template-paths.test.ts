import { describe, expect, test } from 'bun:test'
import {
  COMPONENT_SEARCH_DIRECTORIES,
  getTemplatePathCompletionContext,
  TEMPLATE_SEARCH_DIRECTORIES,
} from '../src/utils/template-paths'

describe('template path completion context', () => {
  test('recognizes regular includes and components', () => {
    expect(getTemplatePathCompletionContext("@include('partials/hea")).toEqual({ kind: 'include', path: 'partials/hea' })
    expect(getTemplatePathCompletionContext("@component('User")).toEqual({ kind: 'component', path: 'User' })
    expect(getTemplatePathCompletionContext("@webcomponent('ui/car")).toEqual({ kind: 'component', path: 'ui/car' })
  })

  test('recognizes conditional and first-existing includes', () => {
    expect(getTemplatePathCompletionContext("@includeWhen(user, 'admin/nav")).toEqual({ kind: 'include', path: 'admin/nav' })
    expect(getTemplatePathCompletionContext("@includeUnless(hidden, \"menu")).toEqual({ kind: 'include', path: 'menu' })
    expect(getTemplatePathCompletionContext("@includeFirst(['mobile/nav")).toEqual({ kind: 'include', path: 'mobile/nav' })
  })

  test('shares standalone, Stacks, and src directory conventions', () => {
    expect(TEMPLATE_SEARCH_DIRECTORIES).toContain('resources/views')
    expect(TEMPLATE_SEARCH_DIRECTORIES).toContain('src/views')
    expect(COMPONENT_SEARCH_DIRECTORIES).toContain('resources/views/components')
    expect(COMPONENT_SEARCH_DIRECTORIES).toContain('src/components')
  })
})
