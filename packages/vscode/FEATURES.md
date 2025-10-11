# VSCode Extension Features

## 🎉 Complete Feature List

### 1. **Auto-Completion** ✨

#### Directive Completion
- **90+ directives** with intelligent auto-completion
- Triggered by typing `@`
- Categorized by type:
  - Control flow: `@if`, `@unless`, `@switch`
  - Loops: `@for`, `@foreach`, `@forelse`, `@while`
  - Layout: `@extends`, `@section`, `@yield`
  - Components: `@component`, `@slot`, `@webcomponent`
  - Auth: `@auth`, `@guest`, `@can`, `@cannot`
  - And many more!

#### Smart Snippets
- **Placeholder navigation** with tab stops
- **Parameter suggestions** with dropdown options
- **Auto-closing directives** (e.g., `@if` → `@endif`)
- **Context-aware snippets**:
  ```stx
  @foreach → @foreach(items as item)
              {cursor}
            @endforeach
  ```

#### Path IntelliSense
- **Template path completion** for `@include()` and `@component()`
- **Directory navigation** with `/` trigger
- **Smart search** in common template directories
- **File extension handling** (auto-removes `.stx`, `.html`)

### 2. **Hover Documentation** 📚

#### Comprehensive Documentation
- **Syntax examples** for every directive
- **Parameter explanations** with types
- **Use case descriptions**
- **Code examples** showing real-world usage

#### Smart Context
- Hover over directives → See full documentation
- Hover over parameters → See parameter details
- Hover over TypeScript code → See type information
- Hover over CSS classes → See CSS definitions

### 3. **Diagnostics & Validation** 🔍

#### Syntax Validation
- **Unclosed directive detection**
  ```stx
  @if(condition)
    <p>Content</p>
  // ⚠️ Warning: Unclosed @if directive. Expected @endif
  ```

- **Mismatched directive detection**
  ```stx
  @if(condition)
    <p>Content</p>
  @endfor
  // ❌ Error: Mismatched directive. Expected @endif but found @endfor
  ```

- **Unexpected closing directive detection**
  ```stx
  @endif
  // ❌ Error: Unexpected @endif. No matching opening directive found
  ```

#### Template Path Validation
- **File existence checking** for `@include()` and `@component()`
- **Smart directory search** in common template locations
- **Extension-aware validation** (`.stx`, `.html`)
  ```stx
  @include('partials/header')
  // ⚠️ Warning: Template file 'partials/header' not found
  ```

### 4. **Code Actions (Quick Fixes)** 🔧

#### Auto-Fix for Unclosed Directives
- **One-click fix** to add missing closing directive
- **Smart insertion** at appropriate location
- **Indentation preservation**

Example:
```stx
@if(condition)   // ⚠️ Unclosed @if
  <p>Content</p>

💡 Quick Fix: Add missing @endif
```

#### Convert Between Directives
- **@if ↔ @unless conversion**
  ```stx
  @if(!user.isGuest)

  💡 Quick Fix: Convert to @unless

  @unless(user.isGuest)
  ```

#### Extract to Component
- **Refactor selected HTML** to a new component
- Works with multi-line selections

### 5. **Folding Ranges** 📁

#### Collapsible Code Blocks
- **Fold directive blocks** (`@if...@endif`, `@foreach...@endforeach`)
- **Fold code blocks** (`@ts...@endts`, `@css...@endcss`)
- **Fold HTML tags** for better code navigation
- **Fold comments** (`{{-- ... --}}`)

#### Smart Folding
- Different fold types for different content:
  - **Region**: Control flow, components
  - **Comment**: Documentation, comments

### 6. **Semantic Highlighting** 🎨

#### Color-Coded Directives
- **Control flow** (blue): `@if`, `@else`, `@switch`
- **Loops** (blue): `@for`, `@foreach`, `@while`
- **Functions** (yellow/gold): `@component`, `@include`, `@extends`
- **Variables** (highlighted): Variables in expressions
- **Strings** (green): String literals in directives
- **Comments** (grey): stx comments

#### Enhanced Readability
- Better visual distinction between directive types
- Easier to spot syntax errors
- Improved code scanning

## 🚀 Usage Examples

### Auto-Completion in Action

```stx
Type: @for
Result: @for(let i = 0; i < items.length; i++)
          {cursor}
        @endfor

Type: @include('
Result: Shows available templates with path completion

Type: @transition(
Result: Shows dropdown with: fade | slide | scale | flip | rotate | custom
```

### Quick Fixes in Action

```stx
<!-- Before -->
@if(user.isAdmin)
  <button>Admin Panel</button>
⚠️ Unclosed @if directive

<!-- After Quick Fix -->
@if(user.isAdmin)
  <button>Admin Panel</button>
@endif ✅
```

### Path Validation in Action

```stx
<!-- Invalid path -->
@include('partials/non-existent')
⚠️ Template file 'partials/non-existent' not found

<!-- After fixing -->
@include('partials/header') ✅
```

## 📊 Statistics

- **90+ directives** with auto-completion
- **60+ new directives** added in latest update
- **25+ directive pairs** validated
- **10+ template directories** searched for paths
- **4 provider types**: Completion, Hover, Diagnostics, Code Actions
- **3 folding types**: Region, Comment, Custom

## 🎯 Keyboard Shortcuts

- `@` - Trigger directive completion
- `Ctrl+Space` - Show completion suggestions
- `Ctrl+.` - Show code actions (quick fixes)
- `Ctrl+Shift+[` - Fold region
- `Ctrl+Shift+]` - Unfold region
- `Cmd+K Cmd+0` - Fold all
- `Cmd+K Cmd+J` - Unfold all

## 🔄 What's New in This Version

### Added
- ✨ 60+ new directives with full support
- 🔍 Real-time syntax validation with diagnostics
- 🔧 Quick fixes for common errors
- 📁 Folding ranges for all directive blocks
- 🎨 Semantic highlighting for better readability
- 🔍 Template path validation
- 📚 Comprehensive hover documentation for all directives
- 🛤️ Path IntelliSense for `@include` and `@component`

### Improved
- ⚡ Better completion performance
- 📝 More detailed error messages
- 🎯 Smarter snippet insertion
- 🔄 Enhanced directive matching

## 🐛 Known Limitations

- Template path validation only works within workspace folders
- Code actions for "Extract to Component" require manual implementation
- Semantic tokens may not override theme colors in all themes

## 📖 See Also

- [TESTING.md](./TESTING.md) - How to test the extension
- [README.md](./README.md) - Extension overview
- [package.json](./package.json) - Extension configuration
