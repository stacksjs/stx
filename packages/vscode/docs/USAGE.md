# stx Language Usage Guide

This guide provides detailed information on how to use the stx templating language with the VS Code extension.

## Installation

1. Install the extension from the VS Code marketplace or by searching for "stx Language Support" in the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
2. Once installed, the extension will automatically activate for files with the `.stx` extension.

## Creating Your First stx Template

1. Create a new file with the `.stx` extension (e.g., `hello.stx`).
2. Start by adding a basic HTML structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First stx Template</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
```

3. Now, let's add some stx syntax:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First stx Template</title>
</head>
<body>
    @ts
        const name = 'World';
        const items = ['Apple', 'Banana', 'Cherry'];
    @endts

    <h1>Hello, {{ name }}!</h1>

    <ul>
        @for(const item of items)
            <li>{{ item }}</li>
        @endfor
    </ul>
</body>
</html>
```

## stx Syntax Reference

### Comments

stx comments are wrapped in `{{--` and `--}}`:

```html
{{-- This is a comment that won't be rendered in the output --}}
```

### Variables and Expressions

To output variables or expressions, use double curly braces:

```html
<p>Hello, {{ name }}</p>
<p>The current year is {{ new Date().getFullYear() }}</p>
```

### Unescaped Output

By default, output is HTML-escaped. To output unescaped HTML, use `{!! ... !!}`:

```html
{!! '<strong>This is bold</strong>' !!}
```

### Embedding TypeScript

You can embed TypeScript code using the `@ts` directive:

```html
@ts
    const user = {
        name: 'John',
        email: 'john@example.com'
    };

    function formatName(name: string): string {
        return name.toUpperCase();
    }
@endts

<h1>Welcome, {{ formatName(user.name) }}</h1>
```

### Embedding JavaScript

For plain JavaScript, use the `@js` directive:

```html
@js
    const currentDate = new Date();
    console.log('Current date:', currentDate);
@endjs
```

### Conditionals

stx supports if-else conditionals:

```html
@if(user.isAdmin)
    <p>Welcome, Admin!</p>
@elseif(user.isRegistered)
    <p>Welcome back, {{ user.name }}!</p>
@else
    <p>Welcome, Guest!</p>
@endif
```

### Loops

There are two loop syntaxes available:

```html
<!-- JavaScript-style for...of loop -->
@for(const item of items)
    <li>{{ item }}</li>
@endfor

<!-- PHP-style foreach loop -->
@foreach(items as item)
    <li>{{ item }}</li>
@endforeach
```

### Including Partials

You can include other templates:

```html
@include('partials.header')
```

### Components

Components allow you to create reusable template blocks:

```html
@component('components.alert', { type: 'error', message: 'Error occurred!' })
    <p>Additional content for the component</p>
@endcomponent
```

### Raw Content

To display content that should not be processed:

```html
@raw
    {{ This will be displayed as-is and not processed }}
@endraw
```

### Markdown Support

You can render markdown content:

```html
@markdown
    # Header

    This is **bold** text and this is *italic* text.

    - List item 1
    - List item 2
@endmarkdown
```

## Tips and Best Practices

1. **Keep TypeScript Blocks Small**: Try to keep your `@ts` blocks small and focused on specific functionality.

2. **Use Components for Reusability**: Break down your UI into reusable components for better organization.

3. **Maintain Directory Structure**: Consider organizing your templates in a logical directory structure:

   ```
   templates/
   ├── components/
   │   ├── alert.stx
   │   └── button.stx
   ├── layouts/
   │   └── main.stx
   └── pages/
       ├── home.stx
       └── about.stx
   ```

4. **Proper Indentation**: Maintain consistent indentation to improve readability, especially when nesting directives.

5. **Comments**: Use comments to document complex sections of your templates.

## Troubleshooting

If you encounter any issues with the stx language support:

1. **Syntax Highlighting Not Working**: Try manually setting the language mode to stx using the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and selecting "Set Language Mode to stx".

2. **IntelliSense Not Working**: Make sure the file has the `.stx` extension and the language mode is set to stx.

3. **Extension Not Activating**: Check the Output panel (View > Output) and select "stx Language Support" from the dropdown to see any activation errors.

## Resources

- [stx Repository](https://github.com/stacksjs/stx)
- [VS Code Marketplace Extension](https://marketplace.visualstudio.com/items?itemName=Stacks.vscode-stacks)
