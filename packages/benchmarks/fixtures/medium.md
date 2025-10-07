# Comprehensive Markdown Test Document

## Introduction

This document contains various **markdown** features to test *parsing* performance. It includes `inline code`, lists, blockquotes, and more.

## Code Examples

Here's some JavaScript code:

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(result);
```

And some TypeScript:

```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}
```

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

### Ordered Lists

1. First step
2. Second step
3. Third step

### Task Lists

- [x] Completed task
- [ ] Pending task
- [x] Another completed task

## Blockquotes

> This is a blockquote with **bold** and *italic* text.
> It can span multiple lines.

> Nested blockquotes are also supported
> > Like this
> > > And this

## Tables

| Name    | Age | City        |
|---------|-----|-------------|
| Alice   | 30  | New York    |
| Bob     | 25  | Los Angeles |
| Charlie | 35  | Chicago     |

## Links and Images

[GitHub](https://github.com)
[Documentation](https://docs.example.com)

![Alt text](https://example.com/image.png)

## Emphasis

**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~

## Horizontal Rules

---

## Inline Elements

This paragraph contains `inline code`, **bold text**, *italic text*, and [a link](https://example.com).

## Conclusion

This document tests various markdown features to benchmark parsing performance.
