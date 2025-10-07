# stx Accessibility Features

stx includes a comprehensive set of accessibility features to help you build more inclusive web applications. These features include accessibility-focused directives, automatic scanning for accessibility issues, and tools to ensure your templates meet accessibility standards.

## Accessibility Directives

### @a11y Directive

The `@a11y` directive helps developers remember accessibility requirements for specific elements. It adds a helpful HTML comment with accessibility hints.

```html
<button @a11y('aria-label')>×</button>
<!-- Outputs: <!-- a11y-hint: Ensure interactive elements have accessible labels --> -->
```

You can also provide a custom message:

```html
<div @a11y('color-contrast', 'Ensure text is readable on this background')>Content</div>
<!-- Outputs: <!-- a11y-hint: Ensure text is readable on this background --> -->
```

Available hint types:

| Type | Description |
|------|-------------|
| `aria-label` | Ensure interactive elements have accessible labels |
| `alt-text` | Provide alternative text for images |
| `focus` | Ensure the element can receive keyboard focus |
| `landmark` | Use appropriate landmark roles |
| `heading-order` | Maintain proper heading hierarchy |
| `color-contrast` | Ensure sufficient color contrast |
| `keyboard-nav` | Make sure element is keyboard navigable |
| `screen-reader` | Optimize for screen reader users |

### @screenReader Directive

The `@screenReader` directive creates content that's only visible to screen readers, using a visually hidden class.

```html
<button>
  ×
  @screenReader(Close dialog)@endScreenReader
</button>
```

This creates:

```html
<button>
  ×
  <span class="sr-only">Close dialog</span>
</button>
```

### @ariaDescribe Directive

The `@ariaDescribe` directive creates a connection between an element and a detailed description via ARIA.

```html
<button id="delete-btn">Delete Account</button>
@ariaDescribe('delete-btn', 'Warning: This action cannot be undone')
```

This creates:

```html
<button id="delete-btn">Delete Account</button>
<span id="desc-delete-btn" class="sr-only">Warning: This action cannot be undone</span>
<!-- add aria-describedby="desc-delete-btn" to #delete-btn -->
```

You'll need to manually add the `aria-describedby` attribute to the element, or use a middleware to automate this process.

## Automatic Accessibility Checking

stx includes built-in accessibility checking that can identify common accessibility issues in your templates.

### Using the CLI

The `stx a11y` command can scan your templates for accessibility issues:

```bash
# Scan all .stx files in the current directory
stx a11y

# Scan a specific directory
stx a11y ./templates

# Exclude recursive scanning
stx a11y --no-recursive

# Ignore specific paths
stx a11y --ignore node_modules,dist

# Output as JSON
stx a11y --json

# Generate an HTML report
stx a11y --output a11y-report.html
```

### Programmatic Usage

You can also use the accessibility checking functions in your own code:

```typescript
import { checkA11y, scanA11yIssues } from 'stx'

// Check a single HTML string
const violations = await checkA11y(htmlContent, 'template.stx')

// Scan a directory of .stx files
const results = await scanA11yIssues('./templates', {
  recursive: true,
  ignorePaths: ['node_modules', 'dist']
})
```

## Configuration

You can configure accessibility features in your `bunfig.toml` file:

```toml
[stx.a11y]
enabled = true
addSrOnlyStyles = true
level = "AA" # 'AA' or 'AAA'
autoFix = false
ignoreChecks = [] # Array of check types to ignore
```

## Screen Reader Only Style

stx provides a built-in screen reader only style that you can include in your stylesheets:

```typescript
import { getScreenReaderOnlyStyle } from 'stx'

const srOnlyStyle = getScreenReaderOnlyStyle()
// Add this to your CSS
```

Or you can use your own CSS:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Accessibility Issues Detected

The stx accessibility checker can detect these common issues:

1. **Missing alt text** - Images without alternative text
2. **Missing accessible names** - Interactive elements without accessible labels
3. **Form inputs without labels** - Form fields not associated with labels
4. **Heading hierarchy issues** - Skipped heading levels (e.g., h1 to h3)
5. **Missing language attribute** - HTML without a language specification

Each issue includes:

- Type of violation
- Impact level (critical, serious, moderate, minor)
- The problematic HTML element
- A helpful message and suggested fix
- Link to more information when available

## Best Practices

1. **Use semantic HTML** - Use the right HTML elements for their intended purpose
2. **Maintain heading hierarchy** - Don't skip heading levels (h1 → h3)
3. **Provide text alternatives** - All non-text content needs text alternatives
4. **Ensure keyboard accessibility** - All interactive elements must be keyboard accessible
5. **Use ARIA judiciously** - Use ARIA attributes when HTML semantics aren't sufficient
6. **Test with screen readers** - Test your site with actual screen readers
7. **Maintain sufficient color contrast** - Ensure text is readable against its background

## Example

Here's a complete example using accessibility features:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Accessible Form</title>
  <style>
    /* Include screen reader only style */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  </style>
</head>
<body>
  <h1>Contact Form</h1>

  <form>
    <div>
      <label for="name">Name</label>
      <input type="text" id="name" @a11y('focus')>
    </div>

    <div>
      <label for="email">Email</label>
      <input type="email" id="email">
    </div>

    <div>
      <label for="message">Message</label>
      <textarea id="message"></textarea>
    </div>

    <button id="submit-btn" type="submit">
      Submit
      @screenReader(Send your message to our team)@endScreenReader
    </button>

    @ariaDescribe('submit-btn', 'By submitting this form, you agree to our terms of service')
  </form>
</body>
</html>
```
