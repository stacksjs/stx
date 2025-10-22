# Fix Needed for @stacksjs/headwind Package

## Issue

The `@stacksjs/headwind` package has an incorrect `exports` configuration in its `package.json`, causing it to fail when imported by VSCode extensions and other CommonJS consumers.

## Current (Broken) Configuration

**File**: `package.json` in https://github.com/stacksjs/headwind

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/src/index.js"  // ❌ WRONG: This file doesn't exist
    },
    "./*": {
      "import": "./dist/*"
    }
  }
}
```

### The Problem

1. **Wrong Path**: Points to `./dist/src/index.js` but the actual built file is at `./dist/index.js`
2. **Missing CommonJS Support**: No `require` field for CommonJS consumers (VSCode extensions use CommonJS)
3. **Build Output Structure**: The build process outputs to `dist/index.js`, not `dist/src/index.js`

### Error Messages

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/path/to/node_modules/@stacksjs/headwind/dist/src/index.js'
```

Or:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './dist/index.js' is not defined by "exports"
```

## Required Fix

**File**: `package.json` in the headwind repository

**Change**:
```diff
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
-     "import": "./dist/src/index.js"
+     "import": "./dist/index.js",
+     "require": "./dist/index.js"
    },
    "./*": {
      "import": "./dist/*"
    }
  }
```

## Why This Fix Works

1. **Correct Path**: Points to the actual file location `./dist/index.js`
2. **CommonJS Support**: Adds `require` field so CommonJS consumers (like VSCode extensions) can import it
3. **ESM Support**: Keeps `import` field for ESM consumers
4. **Backward Compatible**: Doesn't break existing functionality

## Verification

After making this change:

1. Build the package: `bun run build`
2. Verify the dist structure:
   ```bash
   ls -la dist/
   # Should show: index.js, index.d.ts, and other files
   # Should NOT have a src/ directory
   ```
3. Test imports work:
   ```typescript
   // ESM
   import { CSSGenerator } from '@stacksjs/headwind'

   // CommonJS
   const { CSSGenerator } = require('@stacksjs/headwind')
   ```

## Testing Checklist

After publishing the fixed version:

- [ ] Can import with ESM: `import { CSSGenerator } from '@stacksjs/headwind'`
- [ ] Can require with CommonJS: `const { CSSGenerator } = require('@stacksjs/headwind')`
- [ ] VSCode extension can load it without errors
- [ ] All exports work: `CSSGenerator`, `parseClass`, `builtInRules`, etc.
- [ ] Type definitions load correctly

## Additional Notes

### If Build Process Needs Changes

If the build is supposed to output to `dist/src/index.js`, then check your build configuration. However, based on the actual output, it appears the correct output location is `dist/index.js`, so the package.json just needs to be corrected to match.

### Publishing

After fixing:
1. Bump version (e.g., to `0.1.4`)
2. Run `bun run release` or `npm publish`
3. Update consumers to use the new version

## Impact

This fix affects all consumers of `@stacksjs/headwind`, including:
- VSCode extensions (like vscode-stx)
- Build tools and plugins
- Any CommonJS projects
- Any projects using Node.js with strict export checking

## Workaround (Temporary)

While waiting for the fix, consumers can work around this by:

```typescript
// Instead of:
const headwind = require('@stacksjs/headwind')

// Use direct file path (bypasses exports):
const headwind = require('@stacksjs/headwind/dist/index.js')
```

But this is fragile and should be removed once the package is fixed.

---

## Summary

**Change Required**:
```json
"import": "./dist/index.js",
"require": "./dist/index.js"
```

**File to Edit**: `package.json` in headwind repository

**Priority**: High - Blocks VSCode extension and other consumers

**Estimated Time**: 5 minutes to fix + publish
