import type { BuildConfig } from 'bun'
import type { StxOptions } from '../src/types'
import { processDirectives } from '../src/process'

export function buildWithStx(config: Omit<BuildConfig, 'stx'> & { stx?: StxOptions }): Promise<any> {
  return Bun.build(config as any)
}

// =============================================================================
// Test Utilities for stx
// =============================================================================

/**
 * Process a template string with the stx engine
 * Convenience wrapper for testing
 */
export async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<string> {
  return processDirectives(template, context, 'test.stx', options)
}

/**
 * Assert that a template produces the expected output
 */
export async function assertTemplate(
  template: string,
  expected: string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<void> {
  const result = await processTemplate(template, context, options)
  if (result.trim() !== expected.trim()) {
    throw new Error(
      `Template mismatch:\n`
      + `Expected: ${JSON.stringify(expected.trim())}\n`
      + `Got: ${JSON.stringify(result.trim())}`,
    )
  }
}

/**
 * Assert that a template throws an error
 */
export async function assertTemplateThrows(
  template: string,
  errorPattern?: RegExp | string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<void> {
  try {
    await processTemplate(template, context, options)
    throw new Error('Expected template to throw, but it did not')
  }
  catch (error: any) {
    if (error.message === 'Expected template to throw, but it did not') {
      throw error
    }
    if (errorPattern) {
      const matches = typeof errorPattern === 'string'
        ? error.message.includes(errorPattern)
        : errorPattern.test(error.message)
      if (!matches) {
        throw new Error(
          `Error message did not match pattern:\n`
          + `Pattern: ${errorPattern}\n`
          + `Got: ${error.message}`,
        )
      }
    }
  }
}

// =============================================================================
// Edge Case Test Generators
// =============================================================================

/**
 * Generate a deeply nested directive structure for testing
 * @param depth - How deep to nest
 * @param directive - The directive to nest (default: 'if')
 */
export function generateNestedDirectives(depth: number, directive: string = 'if'): string {
  let template = ''
  const condition = 'true'

  // Opening tags
  for (let i = 0; i < depth; i++) {
    template += `@${directive}(${condition})\n`
    template += `Level ${i + 1}\n`
  }

  // Content at deepest level
  template += 'Deepest content\n'

  // Closing tags
  for (let i = depth - 1; i >= 0; i--) {
    template += `@end${directive}\n`
  }

  return template
}

/**
 * Generate a template with Unicode content for testing
 */
export function generateUnicodeTemplate(): string {
  return `
<script>
  const greeting = '你好世界'
  const emoji = '🎉🚀✨'
  const arabic = 'مرحبا بالعالم'
  const japanese = 'こんにちは世界'
  const special = '€£¥₹'
</script>

<div>
  <p>Chinese: {{ greeting }}</p>
  <p>Emoji: {{ emoji }}</p>
  <p>Arabic: {{ arabic }}</p>
  <p>Japanese: {{ japanese }}</p>
  <p>Currency: {{ special }}</p>
</div>
`
}

/**
 * Generate a large template for stress testing
 * @param itemCount - Number of items to generate
 */
export function generateLargeTemplate(itemCount: number): string {
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 100,
  }))

  return `
<script>
  const items = ${JSON.stringify(items)}
</script>

<ul>
  @foreach(items as item)
    <li id="item-{{ item.id }}">
      <span class="name">{{ item.name }}</span>
      <span class="value">{{ item.value | number:2 }}</span>
    </li>
  @endforeach
</ul>
`
}

/**
 * Generate a template with all directive types for comprehensive testing
 */
export function generateComprehensiveTemplate(): string {
  return `
<script>
  const title = 'Test Page'
  const items = ['a', 'b', 'c']
  const count = 5
  const showExtra = true
  const user = { name: 'John', role: 'admin' }
</script>

<!DOCTYPE html>
<html lang="en">
<head>
  <title>{{ title }}</title>
</head>
<body>
  @if(showExtra)
    <header>Extra Header</header>
  @else
    <header>Normal Header</header>
  @endif

  <main>
    @unless(items.length === 0)
      <ul>
        @foreach(items as item)
          <li>{{ item | uppercase }}</li>
        @endforeach
      </ul>
    @endunless

    @for(let i = 0; i < count; i++)
      <span>{{ i }}</span>
    @endfor

    @switch(user.role)
      @case('admin')
        <p>Admin access</p>
        @break
      @case('user')
        <p>User access</p>
        @break
      @default
        <p>Guest access</p>
    @endswitch
  </main>
</body>
</html>
`
}

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Common context objects for testing
 */
export const testContexts = {
  empty: {},

  basic: {
    name: 'World',
    count: 42,
    active: true,
  },

  withArray: {
    items: ['apple', 'banana', 'cherry'],
    numbers: [1, 2, 3, 4, 5],
  },

  withNested: {
    user: {
      name: 'John',
      email: 'john@example.com',
      profile: {
        age: 30,
        city: 'NYC',
      },
    },
  },

  withAuth: {
    auth: {
      check: true,
      user: { id: 1, name: 'Admin', role: 'admin' },
    },
    userCan: {
      'edit-posts': true,
      'delete-posts': false,
    },
  },

  withTranslations: {
    __translations: {
      greeting: 'Hello',
      welcome: 'Welcome, :name!',
      nested: {
        key: 'Nested Value',
      },
    },
  },
}

/**
 * Common template patterns for testing
 */
export const testTemplates = {
  simpleExpression: '{{ name }}',
  escapedExpression: '{!! raw !!}',
  withFilter: '{{ name | uppercase }}',
  conditional: '@if(active)Active@else Inactive@endif',
  loop: '@foreach(items as item){{ item }}@endforeach',
  nested: '@if(a)@if(b)Both@endif@endif',
}
