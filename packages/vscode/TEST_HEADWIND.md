# Testing Headwind Integration

## Quick Test

1. **Launch Extension Development Host**
   - Press `F5` in VSCode (while in vscode package)
   - Or Run > Start Debugging

2. **Create test file** `test.stx`:
```html
<div class="flex items-center justify-center bg-blue-500 text-white p-4 rounded-lg">
  <h1 class="text-2xl font-bold">Hello Headwind!</h1>
</div>
```

3. **Test Features**:

### ✅ Hover Tooltips
- Hover over `flex` - Should show CSS:
  ```css
  .flex {
    display: flex;
  }
  ```
- Hover over `bg-blue-500` - Should show background color CSS
- Hover over `p-4` - Should show padding CSS with rem to px conversion

### ✅ Color Previews
- `bg-blue-500` - Should have a blue square decoration before it
- `text-white` - Should have a white square decoration
- `bg-cool-gray-100` - Should show gray square

### ✅ Autocomplete
- Type `class="` and start typing
- Type `f` - should suggest `flex`, `font-bold`, etc.
- Type `b` - should suggest `block`, `bg-white`, `border`, etc.

### ✅ Class Sorting
- Command Palette (`Cmd/Ctrl+Shift+P`)
- Type `Stacks: Sort Utility Classes`
- Classes should be reordered based on Headwind's rule ordering

## Debug Console

Check the Debug Console for logs:
- `[Headwind] Activating utility class features...`
- `[Headwind] CSS Generator initialized`
- `[Headwind] Successfully activated utility class features`

## Troubleshooting

If features don't work:

1. Check settings:
   - `stx.utilityClasses.enable` = true
   - `stx.utilityClasses.colorPreview` = true
   - `stx.utilityClasses.hoverPreview` = true

2. Check console for errors:
   - View > Output > Stacks Extension

3. Reload window:
   - Command Palette > Developer: Reload Window

4. Rebuild extension:
   ```bash
   bun run build
   ```
