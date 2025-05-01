# STX Language Support for VS Code

This extension adds language support for STX (Stacks) templates, a templating language for TypeScript similar to Laravel Blade but designed for TypeScript instead of PHP.

## Features

- Syntax highlighting for STX files (.stx)
- Snippets for common STX directives
- Auto-closing pairs for brackets, quotes, and STX tags
- Code folding for STX blocks
- IntelliSense completion for STX directives
- Hover information for directives

## What is STX?

STX is a templating language that allows you to use TypeScript directly in your HTML templates. It has a similar syntax to Laravel's Blade but is powered by TypeScript instead of PHP.

## Available Directives

STX supports a variety of directives, including:

- `@if`, `@else`, `@elseif`, `@endif`: Conditional statements
- `@for`, `@endfor`: Loop through items with JavaScript-style iteration
- `@foreach`, `@endforeach`: Loop through items with PHP-style iteration
- `@ts`, `@endts`: Embed TypeScript code
- `@js`, `@endjs`: Embed JavaScript code
- `@raw`, `@endraw`: Display content without processing STX expressions
- `@markdown`, `@endmarkdown`: Render markdown content as HTML
- `@component`, `@endcomponent`: Include reusable components
- `@include`: Include other templates
- `@translate` or `@t`: Translation functions

## Using the Extension

1. Install the extension
2. Create a new file with the `.stx` extension
3. Start typing to see syntax highlighting and auto-completion

You can also use the command `Set Language Mode to STX` from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) to manually set the language for a file.

## Examples

See the `examples` directory for sample STX files that demonstrate the language features.

## Variable Syntax

STX uses double curly braces to output variables:

```html
<p>Hello, {{ name }}</p>
```

You can also use triple curly braces or exclamation marks for different output methods:

```html
<!-- Triple braces for HTML output -->
<div>{{{ '<strong>HTML</strong>' }}}</div>

<!-- Exclamation marks for unescaped output -->
<div>{!! '<strong>Unescaped HTML</strong>' !!}</div>
```

## TypeScript Integration

Use the `@ts` directive to embed TypeScript code directly in your templates:

```html
@ts
    const greeting = 'Hello, World!';
    const user = {
        name: 'John',
        email: 'john@example.com'
    };

    function formatName(name: string): string {
        return name.toUpperCase();
    }
@endts

<h1>{{ greeting }}</h1>
<p>Welcome, {{ formatName(user.name) }}</p>
```

## Syntax Highlighting

The extension provides robust syntax highlighting for STX templates, including special support for:

- TypeScript code blocks between `@ts` and `@endts` tags
- JavaScript code blocks between `@js` and `@endjs` tags
- TypeScript expressions inside `{{ }}` syntax
- HTML markup and attributes
- CSS inside style tags
- Component declarations with `@component` and `@endcomponent`
- Component special variables like `$props` and `$slot`
- Directives such as `@click`, `@if`, `@for`, etc.

The syntax highlighting works by combining an HTML-based grammar with specific injections for TypeScript and JavaScript code sections, ensuring proper language support within each context.

## Troubleshooting

### Syntax Highlighting Issues

If you're experiencing issues with syntax highlighting for STX files:

1. Make sure the extension is correctly installed
2. Try running the command `Set Language Mode to STX` from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. If that doesn't work, try manually setting the language mode:
   - Click on the language indicator in the bottom right of the editor
   - Select "Configure File Association for '.stx'..."
   - Choose "STX" from the list of languages

### HTML Inside STX

For HTML content inside STX templates, normal HTML syntax highlighting and IntelliSense should work. If you're having issues, you might need to:

1. Restart VS Code
2. Check for any extension conflicts
3. Ensure the file extension is `.stx`

## Contributors

Thank you to all contributors who have helped make this extension possible.

## License

MIT
