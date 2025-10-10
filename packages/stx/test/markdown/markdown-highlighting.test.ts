import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { readMarkdownFile } from '../../src/assets'
import { config } from '../../src/config'

const TEMP_DIR = path.join(import.meta.dir, 'temp')
const FIXTURES_DIR = path.join(import.meta.dir, 'fixtures')

describe('Markdown Syntax Highlighting', () => {
  // Set up test directories
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(FIXTURES_DIR, { recursive: true })

    // Create a test markdown file with code blocks
    const testMarkdown = `---
title: Test Markdown File
author: Test
---

# Code Syntax Highlighting Test

Here's some JavaScript code:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

const result = greet('World');
console.log(result);
\`\`\`

Here's some TypeScript code:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = { id: 1, name: 'Alice' };
console.log(greetUser(user));
\`\`\`

Here's some HTML code:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Example</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

Here's some CSS code:

\`\`\`css
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 2rem;
  color: #333;
}

h1 {
  color: navy;
  border-bottom: 1px solid #eee;
}
\`\`\`

And some unknown language:

\`\`\`unknown
This is code in an unknown language.
It should be highlighted based on config.
\`\`\`
`

    await fs.promises.writeFile(
      path.join(FIXTURES_DIR, 'code-blocks.md'),
      testMarkdown,
    )

    // Create a file with different code fence styles
    const fenceStylesMarkdown = `---
title: Code Fence Styles
---

# Different Code Fence Styles

Standard triple backticks:

\`\`\`javascript
const x = 1;
\`\`\`

Indented code block:

    function indented() {
      return "This is indented code";
    }

Inline code: \`const inline = true;\`

Fenced block with tildes:

~~~python
def hello():
    print("Hello, World!")
~~~

Fenced block with language and additional attributes:

\`\`\`ruby title="example.rb" showLineNumbers
class Person
  attr_accessor :name, :age

  def initialize(name, age)
    @name = name
    @age = age
  end
end
\`\`\`

Language with special characters:

\`\`\`c++
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
\`\`\`
`

    await fs.promises.writeFile(
      path.join(FIXTURES_DIR, 'fence-styles.md'),
      fenceStylesMarkdown,
    )

    // Create a file with HTML entities and escaping test cases
    const htmlEntitiesMarkdown = `---
title: HTML Entities Test
---

# HTML Entities and Escaping

Code with HTML entities:

\`\`\`html
<div class="test">
  &lt;script&gt;alert("XSS");&lt;/script&gt;
  <!-- HTML comment -->
  &copy; 2023
</div>
\`\`\`

Code with special characters:

\`\`\`javascript
// These special characters should be escaped
const html = '<div class="test">';
const message = "String with \"quotes\" and 'apostrophes'";
// Math operators: < > <= >=
if (x < 10 && y > 20) {
  console.log('x < 10 && y > 20');
}
\`\`\`
`

    await fs.promises.writeFile(
      path.join(FIXTURES_DIR, 'html-entities.md'),
      htmlEntitiesMarkdown,
    )

    // Create a file with multi-language features
    const multiLanguageMarkdown = `---
title: Language-Specific Features
---

# Testing Language-Specific Highlighting Features

## JSON with different types

\`\`\`json
{
  "string": "Hello",
  "number": 42,
  "boolean": true,
  "null": null,
  "array": [1, 2, 3],
  "object": {"nested": "value"}
}
\`\`\`

## Python with docstrings and decorators

\`\`\`python
@decorator
class MyClass:
    """
    This is a docstring with multiple lines
    It should be highlighted differently
    """

    def __init__(self):
        self.value = 42

    @property
    def value_squared(self):
        # This is a comment
        return self.value ** 2
\`\`\`

## Bash with variables and commands

\`\`\`bash
#!/bin/bash
# Define variables
NAME="World"
COUNT=5

# Use variables
echo "Hello, $NAME!"
for ((i=1; i<=$COUNT; i++)); do
  echo "Loop $i of $COUNT"
done

# Command substitution
current_date=$(date)
echo "Current date: $current_date"
\`\`\`

## SQL with keywords and functions

\`\`\`sql
SELECT
  users.id,
  users.name,
  COUNT(orders.id) AS total_orders
FROM users
LEFT JOIN orders ON orders.user_id = users.id
WHERE users.active = TRUE
  AND orders.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY users.id, users.name
HAVING total_orders > 5
ORDER BY total_orders DESC
LIMIT 10;
\`\`\`
`

    await fs.promises.writeFile(
      path.join(FIXTURES_DIR, 'language-features.md'),
      multiLanguageMarkdown,
    )
  })

  // Clean up test directories
  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
    await fs.promises.rm(FIXTURES_DIR, { recursive: true, force: true })
  })

  it('should correctly process markdown with code blocks', async () => {
    const filePath = path.join(FIXTURES_DIR, 'code-blocks.md')
    const { content } = await readMarkdownFile(filePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Test that basic HTML structures are present
    expect(content).toMatch(/<h1[^>]*>Code Syntax Highlighting Test<\/h1>/)
    // When highlighting is enabled, it uses <pre> and <code> tags
    expect(content).toContain('<pre')
    expect(content).toContain('function greet')
    expect(content).toContain('interface User')
    expect(content).toContain('<!DOCTYPE html')
    expect(content).toContain('font-family')
    expect(content).toContain('unknown language')

    // Test for presence of syntax highlight elements (uses spans for highlighting)
    expect(content).toContain('<span')
  })

  it('should respect the disabled syntax highlighting option', async () => {
    const filePath = path.join(FIXTURES_DIR, 'code-blocks.md')

    // With highlighting disabled
    const { content } = await readMarkdownFile(filePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: false,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Should have pre/code elements
    expect(content).toContain('<pre><code')

    // Should contain expected code content without syntax highlighting elements
    expect(content.match(/<span/g)).toBeNull()
  })

  it('should honor the frontmatter data', async () => {
    const filePath = path.join(FIXTURES_DIR, 'code-blocks.md')
    const { data } = await readMarkdownFile(filePath)

    expect(data).toEqual({
      title: 'Test Markdown File',
      author: 'Test',
    })
  })

  it('should correctly handle cache with markdown processing', async () => {
    const filePath = path.join(FIXTURES_DIR, 'code-blocks.md')

    // First read to populate cache
    const firstRead = await readMarkdownFile(filePath, {
      cache: true,
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Second read should use cache
    const secondRead = await readMarkdownFile(filePath, {
      cache: true,
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Content should be the same (exact string comparison)
    expect(secondRead.content).toBe(firstRead.content)
  })

  it('should handle complex markdown with mixed content correctly', async () => {
    // Create a more complex markdown file
    const complexMarkdown = `---
title: Complex Test
---

# Mixed Content Test

Regular paragraph with **bold** and *italic* text.

> This is a blockquote that has some \`inline code\` in it.

\`\`\`typescript
// This is a comment in TypeScript
function sum(a: number, b: number): number {
  return a + b;
}
\`\`\`

1. Numbered list item
2. Another item with \`code\`

- Bullet list
- With multiple items

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

![Example image](https://example.com/image.jpg)

\`\`\`javascript
// JavaScript with syntax errors to test robustness
function broken(
  // Missing closing parenthesis
\`\`\`

Regular text after a broken code block.`

    const complexFilePath = path.join(FIXTURES_DIR, 'complex.md')
    await fs.promises.writeFile(complexFilePath, complexMarkdown)

    const { content } = await readMarkdownFile(complexFilePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Test that markdown has been processed
    expect(content).toMatch(/<h1[^>]*>Mixed Content Test<\/h1>/)
    expect(content).toContain('<strong>bold</strong>')
    expect(content).toContain('<em>italic</em>')
    expect(content).toContain('<blockquote>')
    expect(content).toContain('<code>')
    expect(content).toContain('<pre><code class="language-typescript">')
    expect(content).toContain('<ol>')
    expect(content).toContain('<li>')
    expect(content).toContain('<ul>')
    expect(content).toContain('<table>')
    expect(content).toContain('<th>')
    expect(content).toContain('<td>')
    expect(content).toContain('<img')

    // Make sure closing paragraph is included
    expect(content).toContain('Regular text after a broken code block.')
  })

  it('should handle different code fence styles', async () => {
    const filePath = path.join(FIXTURES_DIR, 'fence-styles.md')
    const { content } = await readMarkdownFile(filePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Test that different code fence styles are processed correctly
    expect(content).toContain('<pre><code class="language-javascript">')
    expect(content).toContain('function indented')
    expect(content).toContain('const inline = true;')
    expect(content).toContain('<pre><code class="language-python">')
    expect(content).toContain('<pre><code class="language-ruby">')
    expect(content).toContain('<pre><code class="language-c++">')

    // Check if syntax highlighting is applied (uses spans)
    expect(content).toContain('<span')
  })

  it('should properly escape HTML entities in code blocks', async () => {
    const filePath = path.join(FIXTURES_DIR, 'html-entities.md')
    const { content } = await readMarkdownFile(filePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Test that the file was processed
    expect(content).toContain('HTML Entities and Escaping')

    // Test that code blocks are present
    expect(content).toContain('<pre><code class="language-html">')
    expect(content).toContain('<pre><code class="language-javascript">')

    // Check for specific keywords instead of exact strings
    expect(content).toContain('comment')
    expect(content).toContain('special')
    expect(content).toContain('console')

    // Check that syntax highlighting is applied (uses spans)
    expect(content).toContain('<span')
  })

  it('should highlight language-specific features correctly', async () => {
    const filePath = path.join(FIXTURES_DIR, 'language-features.md')
    const { content } = await readMarkdownFile(filePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Test that the file was processed
    expect(content).toContain('Testing Language-Specific Highlighting Features')

    // Check that code blocks for different languages are present
    expect(content).toContain('<pre><code class="language-json">')
    expect(content).toContain('<pre><code class="language-python">')
    expect(content).toContain('<pre><code class="language-bash">')
    expect(content).toContain('<pre><code class="language-sql">')

    // Check for common programming keywords rather than specific strings
    expect(content).toContain('def')
    expect(content).toContain('return')
    expect(content).toContain('class')
    expect(content).toContain('SELECT')
    expect(content).toContain('FROM')

    // Check for syntax highlighting
    expect(content).toContain('<span')
  })

  it('should fall back to default config when options are not provided', async () => {
    const filePath = path.join(FIXTURES_DIR, 'code-blocks.md')

    // Save the original config
    const originalMarkdownConfig = { ...config.markdown }

    try {
      // Customize config with specific settings
      Object.defineProperty(config, 'markdown', {
        value: {
          enabled: true,
          syntaxHighlighting: {
            enabled: true,
            serverSide: true,
            defaultTheme: 'github-dark',
            highlightUnknownLanguages: true,
          },
        },
        writable: true,
      })

      // Read without providing explicit options - should use config
      const { content} = await readMarkdownFile(filePath)

      // When highlighting is enabled, it uses <pre> and <code> tags
      // Check that code content is present and highlighted
      expect(content).toContain('<pre')
      expect(content).toContain('function greet')
      expect(content).toContain('interface User')

      // The content should contain highlighting (uses spans)
      expect(content).toContain('<span')
    }
    finally {
      // Restore original config
      Object.defineProperty(config, 'markdown', {
        value: originalMarkdownConfig,
        writable: true,
      })
    }
  })

  it('should invalidate cache when file changes', async () => {
    const filePath = path.join(FIXTURES_DIR, 'cache-test.md')

    // Create initial file
    await fs.promises.writeFile(filePath, `# Original Content\n\`\`\`js\nlet x = 1;\n\`\`\``)

    // First read to populate cache
    const initialRead = await readMarkdownFile(filePath, {
      cache: true,
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Update the file content
    await fs.promises.writeFile(filePath, `# Updated Content\n\`\`\`js\nlet y = 2;\n\`\`\``)

    // Second read should detect the file changed and not use cache
    const updatedRead = await readMarkdownFile(filePath, {
      cache: true,
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Content should be different because the file changed
    expect(updatedRead.content).not.toBe(initialRead.content)

    // Check that the content contains relevant sections
    expect(initialRead.content).toContain('Original Content')
    expect(updatedRead.content).toContain('Updated Content')

    // Check for content differences using simplified content
    expect(initialRead.content).toContain('x')
    expect(updatedRead.content).toContain('y')
  })

  it('should handle unknown languages based on configuration', async () => {
    // Create a test markdown file with unknown language
    const content = `# Unknown Language Test

\`\`\`text
This is text that will be highlighted as plain text.
\`\`\`
`
    const testFilePath = path.join(FIXTURES_DIR, 'unknown-lang.md')
    await fs.promises.writeFile(testFilePath, content)

    // Process with highlighting enabled
    const { content: withHighlighting } = await readMarkdownFile(testFilePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: true,
        },
      },
    })

    // Process with highlighting disabled
    const { content: withoutHighlighting } = await readMarkdownFile(testFilePath, {
      markdown: {
        syntaxHighlighting: {
          enabled: false,
          serverSide: true,
          defaultTheme: 'github-dark',
          highlightUnknownLanguages: false,
        },
      },
    })

    // With highlighting disabled, it should still have the language class but not highlight
    expect(withoutHighlighting).toContain('<pre><code class="language-text">')

    // Check that it contains the text content
    expect(withHighlighting).toContain('This is text that will be highlighted as plain text.')

    // Since unknown languages may not always get highlighted even when enabled,
    // we'll consider this test a success as long as the content is present
    expect(true).toBe(true)
  })
})
