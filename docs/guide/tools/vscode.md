# VSCode Extension

The stx VSCode extension provides comprehensive support for stx development with syntax highlighting, IntelliSense, debugging, and productivity features.

## Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "stx Language Support"
4. Click Install

### From Command Line

```bash
code --install-extension stx.stx-vscode
```

## Features

### Syntax Highlighting

The extension provides rich syntax highlighting for stx templates:

```stx
@component('UserCard', {
  props: {
    user: Object,
    showEmail: Boolean
  }
})
  <div class="user-card">
    <img :src="user.avatar" :alt="user.name">
    <h3>&#123;&#123; user.name &#125;&#125;</h3>
    @if(showEmail)
      <p>&#123;&#123; user.email &#125;&#125;</p>
    @endif
  </div>
@endcomponent
```

Features:

- stx directive highlighting
- Template interpolation
- Component syntax
- TypeScript code blocks
- HTML attribute binding

### IntelliSense

#### Autocomplete

- Component names and props
- Directive suggestions
- Template variables
- Built-in functions
- CSS classes (with Tailwind support)

#### Code Snippets

Type these prefixes and press Tab:

- `stx-component` - Create a new component
- `stx-if` - If/else conditional
- `stx-for` - Loop directive
- `stx-include` - Include partial
- `stx-extends` - Extend layout

### Error Detection

The extension provides real-time error detection:

- Syntax errors in templates
- TypeScript errors in code blocks
- Missing component props
- Invalid directive usage
- Unclosed tags and directives

### Code Actions

Right-click in stx files for quick actions:

- Extract Component
- Wrap in Conditional
- Add Missing Props
- Convert to TypeScript
- Optimize Imports

## Configuration

### Settings

Configure the extension in VSCode settings:

```json
{
  "stx.typescript.enabled": true,
  "stx.typescript.strictMode": true,
  "stx.validation.enabled": true,
  "stx.formatting.enabled": true,
  "stx.inlayHints.enabled": true,

  // Tailwind CSS support
  "stx.tailwind.enabled": true,
  "stx.tailwind.configPath": "./tailwind.config.js",

  // Component discovery
  "stx.components.autoImport": true,
  "stx.components.paths": [
    "./src/components/**/*.stx",
    "./components/**/*.stx"
  ],

  // Formatting options
  "stx.format.indentSize": 2,
  "stx.format.maxLineLength": 80,
  "stx.format.insertFinalNewline": true
}
```

### File Associations

Ensure `.stx` files are associated with the stx language:

```json
{
  "files.associations": {
    "*.stx": "stx"
  }
}
```

### Emmet Support

Enable Emmet for stx files:

```json
{
  "emmet.includeLanguages": {
    "stx": "html"
  }
}
```

## Advanced Features

### TypeScript Integration

The extension provides full TypeScript support:

```stx
@ts
interface UserCardProps {
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  showEmail?: boolean
}
@endts

@component('UserCard', {
  props: {
    user: { type: Object, required: true },
    showEmail: { type: Boolean, default: false }
  }
})
  <!-- Template with full type checking -->
@endcomponent
```

Features:

- Type checking in templates
- Prop validation
- Autocomplete based on types
- Go to definition
- Find all references

### Component Intelligence

#### Auto Import

The extension automatically imports components:

```stx
<!-- Type 'UserCard' and it will auto-import -->
<UserCard :user="currentUser" />

<!-- Auto-generated import -->
@include('components.UserCard')
```

#### Component Outline

View component structure in the Explorer:

- Props and their types
- Methods and computed properties
- Template structure
- Slots and named slots

### Debugging

#### Template Debugging

Set breakpoints in stx templates:

1. Click in the gutter next to template code
2. Run your application in debug mode
3. Execution will pause at breakpoints

#### Variable Inspection

While debugging, inspect template variables:

- Hover over variables to see values
- Use the Debug Console to evaluate expressions
- View component state in Variables panel

## Productivity Features

### Code Folding

Fold sections of your stx files:

- Component definitions
- Large template blocks
- TypeScript code blocks
- Comment blocks

### Multi-cursor Editing

Use multi-cursor for efficient editing:

- Alt+Click to add cursors
- Ctrl+Alt+Down/Up for column selection
- Ctrl+D to select next occurrence

### File Navigation

#### Go to Symbol

Ctrl+Shift+O to navigate to:

- Component definitions
- Props and methods
- Template sections
- Imports and includes

#### Breadcrumbs

Enable breadcrumbs for navigation:

```json
{
  "breadcrumbs.enabled": true,
  "breadcrumbs.showFiles": true,
  "breadcrumbs.showSymbols": true
}
```

### Live Templates

Create custom live templates for common patterns:

```json
{
  "stx Component": {
    "prefix": "stx-comp",
    "body": [
      "@component('$1', {",
      "  props: {",
      "    $2",
      "  }",
      "})",
      "  $3",
      "@endcomponent"
    ],
    "description": "Create stx component"
  }
}
```

## Troubleshooting

### Common Issues

#### Extension Not Working

1. Check if stx files are properly associated
2. Restart VSCode after installation
3. Check the Output panel for errors
4. Ensure workspace has stx project structure

#### IntelliSense Not Working

1. Check TypeScript version compatibility
2. Verify `stx.config.ts` exists
3. Restart TypeScript language service (Ctrl+Shift+P → "TypeScript: Restart TS Server")

#### Slow Performance

1. Exclude large directories from workspace
2. Disable unused features in settings
3. Close unnecessary files
4. Check for other conflicting extensions

### Debug Mode

Enable debug logging:

```json
{
  "stx.trace.server": "verbose",
  "stx.debug.enabled": true
}
```

View logs in Output panel → stx Language Server

## Community

### Contributing

The stx VSCode extension is open source:

- [GitHub Repository](https://github.com/stacksjs/stx-vscode)
- [Issue Tracker](https://github.com/stacksjs/stx-vscode/issues)
- [Contributing Guide](https://github.com/stacksjs/stx-vscode/blob/main/CONTRIBUTING.md)

### Feedback

Help improve the extension:

- Report bugs on GitHub
- Request features
- Submit pull requests
- Rate and review on Marketplace

## Related Resources

- [stx Language Reference](/api/template-syntax) - Complete syntax guide
- [Component Development](/guide/components) - Building components
- [TypeScript Guide](/guide/typescript) - TypeScript integration
- [Build Guide](/guide/build) - Build tools and configuration
