# Headwind Integration Fix Summary

## Problem

The VSCode extension was failing to activate with the error:
```
ReferenceError: vscode is not defined
```

Additionally, there was an ESM module loading issue:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '@stacksjs/headwind'
```

## Root Causes

### 1. Type-only Import Issue
The `vscode` module was imported as a **type-only** import in `src/headwind/index.ts`:
```typescript
import type * as vscode from 'vscode'  // ❌ Type-only - undefined at runtime
```

This meant `vscode` was only available for TypeScript type checking, but was `undefined` at runtime when trying to pass it to functions.

### 2. Optional Parameter with Fallback
Functions in `context.ts` had optional `vscode` parameters with fallback to global import:
```typescript
export function getDefaultConfig(vscodeModule?: typeof vscode): HeadwindConfig {
  const vs = vscodeModule || vscode  // ❌ Falls back to undefined after bundling
}
```

After bundling, the fallback `vscode` was also undefined in the module scope.

### 3. ESM Dynamic Import in CommonJS Bundle
The extension is bundled as CommonJS (`format: 'cjs'`), but was using dynamic imports for the ESM `@stacksjs/headwind` module:
```typescript
const headwind = await import('@stacksjs/headwind')  // ❌ Path resolution fails in CJS bundle
```

Dynamic imports have different path resolution in CommonJS bundles, causing module not found errors.

## Solutions Applied

### Fix 1: Regular Import in index.ts
Changed from type-only to regular import:
```typescript
// Before
import type * as vscode from 'vscode'

// After
import * as vscode from 'vscode'
```

### Fix 2: Required Parameters (No Fallback)
Made `vscodeModule` a required parameter and removed fallback logic:
```typescript
// Before
export function getDefaultConfig(vscodeModule?: typeof vscode): HeadwindConfig {
  const vs = vscodeModule || vscode
  // ...
}

// After
export function getDefaultConfig(vscodeModule: typeof vscode): HeadwindConfig {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath
  // ...
}
```

### Fix 3: Dynamic Import with require() Fallback
Added fallback to `require()` for CommonJS bundled context:
```typescript
async function loadHeadwind() {
  if (headwindLoaded) return

  try {
    // Try dynamic import first (for ESM)
    const headwind = await import('@stacksjs/headwind')
    CSSGenerator = headwind.CSSGenerator
    // ...
    headwindLoaded = true
  } catch (importError) {
    // Fallback to require for CommonJS bundled context
    try {
      const headwind = require('@stacksjs/headwind')
      CSSGenerator = headwind.CSSGenerator
      // ...
      headwindLoaded = true
    } catch (requireError) {
      console.error('[Headwind] Failed to load @stacksjs/headwind:', { importError, requireError })
      throw new Error(`Cannot load @stacksjs/headwind: ${importError}`)
    }
  }
}
```

### Fix 4: Pass vscode to All Functions
Updated all function signatures to require the vscode module:
- `createSortClassesCommand(vscodeModule: typeof vscode)`
- All call sites pass `vscode` explicitly

## Files Modified

1. **src/headwind/index.ts**
   - Changed `import type * as vscode` to `import * as vscode`
   - Pass vscode to `createSortClassesCommand(vscode)`

2. **src/headwind/context.ts**
   - Made `vscodeModule` required (not optional) in `getDefaultConfig()` and `loadHeadwindConfig()`
   - Removed fallback to global `vscode` import
   - Added `require()` fallback for ESM module loading
   - Changed vscode import back to `import type` since it's only used for types now

3. **src/headwind/sort-provider.ts**
   - Added `require()` fallback for ESM module loading in `sortClasses()`
   - Updated `createSortClassesCommand()` to accept required `vscodeModule` parameter
   - Changed all `vscode.*` references to use `vscodeModule.*`
   - Made `sortClasses()` call awaited (it's async)

## Testing

Created comprehensive test suite in `test/headwind.test.ts` with 34 tests validating:

- ✅ All required Headwind files exist
- ✅ Proper import patterns (regular vs type-only)
- ✅ Required vs optional parameters
- ✅ No fallback to global vscode
- ✅ Dynamic import with require fallback
- ✅ Dependencies (Headwind/Prettier present, UnoCSS/Tailwind absent)
- ✅ Configuration in package.json
- ✅ Provider registrations

All tests pass: **34 pass, 0 fail**

## Why This Approach Works

1. **vscode is always defined**: By using a regular import and passing it explicitly, we ensure the actual runtime value is available everywhere it's needed.

2. **No bundling scope issues**: Instead of relying on module-level imports that may not survive bundling, we pass the vscode instance as a parameter from where it's definitely available.

3. **ESM/CJS compatibility**: The dynamic import + require fallback ensures the Headwind module loads correctly in both development (ESM) and production (bundled CJS) contexts.

4. **Type safety maintained**: TypeScript still provides full type checking while runtime values are properly propagated.

## Verification

To verify the fix works:

1. Press F5 to launch Extension Development Host
2. Check Debug Console for successful activation:
   ```
   [Headwind] Activating utility class features...
   [Headwind] CSS Generator initialized
   [Headwind] Successfully activated utility class features
   ```
3. Test features:
   - Hover over utility classes (e.g., `flex`, `bg-blue-500`) → should show CSS
   - Color classes should show colored square decorations
   - Autocomplete should work in `class=""` attributes
   - Command palette → "Stacks: Sort Utility Classes" should work

## Prevention

The test suite now validates:
- Import patterns (catches type-only imports where values are needed)
- Parameter requirements (catches optional params that should be required)
- No fallback patterns (catches `|| vscode` fallbacks)
- ESM compatibility patterns (validates require fallback exists)

These tests will catch similar issues in the future during development.
