# Testing the VSCode Extension

## Method 1: Run Extension in Development Mode (Recommended)

1. **Open the extension folder in VSCode**:
   ```bash
   cd packages/vscode
   code .
   ```

2. **Build the extension**:
   ```bash
   bun run build
   ```

3. **Press F5** or go to **Run > Start Debugging**
   - This will open a new VSCode window with the extension loaded
   - The window title will show `[Extension Development Host]`

4. **Test the extension**:
   - Open or create a `.stx` file
   - Type `@` to see auto-completion
   - Hover over directives to see documentation
   - Try creating unclosed directives to see diagnostics

## Method 2: Install VSIX Package Manually

1. **Build the extension**:
   ```bash
   cd packages/vscode
   bun run build
   ```

2. **Package the extension**:
   ```bash
   bun run package
   ```
   This creates a `.vsix` file in the current directory.

3. **Install via VSCode UI**:
   - Open VSCode
   - Go to Extensions (Cmd+Shift+X or Ctrl+Shift+X)
   - Click the `...` menu at the top right
   - Select "Install from VSIX..."
   - Navigate to `packages/vscode/` and select the `.vsix` file

## Method 3: Install via Command Line (if `code` is in PATH)

1. **Add `code` to PATH** (if not already):
   - Open VSCode
   - Press Cmd+Shift+P (or Ctrl+Shift+P)
   - Type "shell command"
   - Select "Shell Command: Install 'code' command in PATH"

2. **Install the extension**:
   ```bash
   cd packages/vscode
   code --install-extension vscode-stacks-0.1.12.vsix
   ```

## What to Test

### Auto-Completion
- Type `@` → See all directives
- Type `@for` → Get smart snippet with placeholders
- Type `@include('` → Get path suggestions
- Type `@transition(` → Get parameter suggestions

### Hover Documentation
- Hover over `@if` → See documentation
- Hover over `@transition` parameters → See parameter docs
- Hover over CSS classes → See CSS definitions

### Diagnostics
- Type `@if(true)` without `@endif` → See warning
- Type `@if(true)` then `@endfor` → See mismatch error
- Fix the errors and see diagnostics clear

### Path IntelliSense
- Type `@include('` → See available templates
- Type `@component('` → See available components
- Navigate directories with `/`

## Troubleshooting

- **Extension not loading?** Check the Debug Console for errors
- **Build errors?** Run `bun install` first
- **Changes not showing?** Rebuild with `bun run build` and reload the extension development host window
