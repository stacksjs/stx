# STX Framework - Comprehensive TODO List

This document contains all identified issues, improvements, and enhancements for the stx codebase. Items are organized by priority and category for systematic resolution.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [Architecture & Design](#architecture--design)
3. [Parser & Compiler](#parser--compiler)
4. [Directive System](#directive-system)
5. [Component System](#component-system)
6. [Expression Evaluation](#expression-evaluation)
7. [Security](#security)
8. [Performance](#performance)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Documentation](#documentation)
12. [Developer Experience](#developer-experience)
13. [Desktop Package](#desktop-package)
14. [Bun Plugin](#bun-plugin)
15. [CLI](#cli)
16. [Streaming & Hydration](#streaming--hydration)
17. [i18n](#i18n)
18. [Forms](#forms)
19. [SEO & A11y](#seo--a11y)
20. [Web Components](#web-components)
21. [Code Quality](#code-quality)
22. [Future Features](#future-features)

---

## Critical Issues

### High Priority Bugs

- [ ] **Hardcoded test cases in component system** (`packages/stx/src/components.ts:16-47`)
  - Component directive has hardcoded outputs for specific test files (`component-test.stx`, `nested-components.stx`, `pascal-case-component.stx`)
  - This is a code smell and should be removed; tests should use proper fixtures

- [ ] **Hardcoded test case in process.ts** (`packages/stx/src/process.ts:566-577`)
  - `processCustomElements` has a hardcoded special case for PascalCase test with `user-card`
  - Should be removed and tests should work with actual component rendering

- [ ] **Import issue in dev-server.ts** (`packages/stx/src/dev-server.ts:9`)
  - TODO comment: `import this from 'bun-plugin-stx'. Oddly, there seemingly are issues right now`
  - Currently imports from local `./plugin` instead of the package

- [ ] **Global mutable state in expressions.ts** (`packages/stx/src/expressions.ts:14`)
  - `globalContext` is a module-level mutable variable that could cause issues in concurrent scenarios
  - Should be passed through function parameters or use a context provider pattern

---

## Architecture & Design

### Structural Improvements

- [ ] **Circular dependency risk between modules**
  - `process.ts` imports from many modules, and some modules import back from `process.ts`
  - Consider implementing a dependency injection pattern or event-based architecture

- [ ] **Inconsistent async/sync function signatures**
  - Some directive processors are sync (`processConditionals`), others are async (`processIncludes`)
  - Standardize on async throughout for consistency

- [ ] **Lack of proper AST representation**
  - Template parsing uses regex-based approach throughout
  - Consider implementing a proper tokenizer/parser for better error messages and tooling support

- [ ] **Missing plugin architecture for directives**
  - Custom directives exist but are limited
  - Implement a more robust plugin system with lifecycle hooks

- [ ] **Configuration scattered across multiple files**
  - Config in `config.ts`, `types.ts`, and inline defaults
  - Centralize all configuration with proper validation

### Type System

- [ ] **Loose typing in context objects**
  - `context: Record<string, any>` used everywhere
  - Create specific context interfaces for different processing stages

- [ ] **Missing discriminated unions for directive types**
  - Directives could benefit from a tagged union type for better type safety

- [ ] **`any` types in function signatures**
  - Many functions use `any` for flexibility but lose type safety
  - Add proper generics where applicable

---

## Parser & Compiler

### Template Processing (`process.ts`)

- [ ] **Directive processing order is implicit**
  - Order matters but isn't documented or enforced
  - Add explicit ordering configuration with dependency resolution

- [ ] **Regex-based parsing limitations**
  - Complex nested structures can fail
  - Edge cases with quotes inside expressions not handled well

- [ ] **No source maps for compiled templates**
  - Errors point to compiled output, not source
  - Implement source map generation for debugging

- [ ] **Missing template validation step**
  - Templates are processed without pre-validation
  - Add a validation pass before processing

### Variable Extraction (`utils.ts`)

- [ ] **Complex script parsing is fragile** (`utils.ts:217-279`)
  - `convertToCommonJS` uses line-by-line parsing
  - Fails on complex patterns like template literals with expressions

- [ ] **Destructuring support is incomplete** (`utils.ts:298-326`)
  - Creates `__destructured_` variables which is hacky
  - Properly handle destructuring patterns

- [ ] **No support for async/await in scripts**
  - Top-level await in `<script>` tags not supported
  - Add async script execution support

- [ ] **Import statements not supported**
  - Cannot use `import` in `<script>` tags
  - Consider adding import resolution

---

## Directive System

### Conditionals (`conditionals.ts`)

- [ ] **Nested @if/@elseif handling is fragile** (`conditionals.ts:198-253`)
  - Uses simple regex that can fail on complex nesting
  - Implement proper balanced tag matching

- [ ] **@unless doesn't support @else** (`conditionals.ts:181-183`)
  - Converts to @if negation but loses @else support
  - Add proper @else handling for @unless

- [ ] **Switch statement regex is complex** (`conditionals.ts:57`)
  - Pattern `(?:[^()]|\([^()]*\))*` only handles one level of nesting
  - Implement recursive parenthesis matching

- [ ] **Auth directives require specific context shape** (`conditionals.ts:270-426`)
  - Expects `auth?.check`, `auth?.user`, `permissions?.check`
  - Document required context shape or make more flexible

### Loops (`loops.ts`)

- [ ] **@for loop expression evaluation is unsafe** (`loops.ts:218-226`)
  - Uses template literal interpolation with user code
  - Potential for code injection

- [ ] **@while loop has hardcoded max iterations** (`loops.ts:251`)
  - 1000 iterations max is arbitrary
  - Make configurable

- [ ] **No @break or @continue support**
  - Common loop control structures missing
  - Implement break/continue directives

- [ ] **Loop variable `loop` conflicts with user variables**
  - If user has a `loop` variable, it gets overwritten
  - Use a namespaced variable like `$loop` or `__loop`

### Includes (`includes.ts`)

- [ ] **Circular include detection is per-call** (`includes.ts:255`)
  - `processedIncludes` set is local to each call
  - Could still have issues with indirect circular references

- [ ] **@includeFirst error handling** (`includes.ts:194-206`)
  - Returns error message in HTML which could break layout
  - Should throw or use fallback content

- [ ] **Partials cache never invalidates** (`includes.ts:12`)
  - `partialsCache` is a module-level Map that grows indefinitely
  - Add cache invalidation or LRU eviction

- [ ] **@once store persists across requests** (`includes.ts:15`)
  - `onceStore` is global and never cleared automatically
  - Could cause issues in long-running servers

---

## Component System

### Component Resolution (`components.ts`, `utils.ts`)

- [ ] **Component path resolution is complex** (`utils.ts:40-68`)
  - Multiple fallback paths make debugging difficult
  - Simplify and document resolution order

- [ ] **No component prop validation**
  - Props are passed without type checking
  - Add optional prop type definitions and validation

- [ ] **Slot content handling is basic**
  - Only supports default slot
  - Add named slots support like Vue

- [ ] **No component lifecycle hooks**
  - Components are stateless templates
  - Consider adding `onMount`, `onDestroy` hooks for SSR

- [ ] **Component caching doesn't consider props** (`utils.ts:84-86`)
  - Same component with different props uses same cache
  - Cache key should include prop hash

### Custom Elements (`process.ts:457-661`)

- [ ] **PascalCase to kebab-case conversion edge cases** (`process.ts:512`, `process.ts:594`)
  - `tagName.replace(/([a-z0-9])([A-Z])/g, '$1-$2')` doesn't handle consecutive caps
  - `XMLParser` becomes `x-m-l-parser` instead of `xml-parser`

- [ ] **Attribute parsing is fragile** (`process.ts:605`)
  - Regex `/(:|v-bind:)?([^\s=]+)(?:=["']([^"']*)["'])?/g` has issues with complex values
  - Doesn't handle attributes with `=` in values

- [ ] **No support for v-model or two-way binding**
  - Vue-like syntax partially supported but not v-model
  - Consider adding or documenting limitations

---

## Expression Evaluation

### Expression Processing (`expressions.ts`)

- [ ] **Filter chain parsing is fragile** (`expressions.ts:210-313`)
  - Manual character-by-character parsing
  - Fails on complex nested expressions

- [ ] **Limited built-in filters** (`expressions.ts:23-113`)
  - Only basic filters: uppercase, lowercase, capitalize, number, join, escape, translate
  - Add more: truncate, date, currency, pluralize, etc.

- [ ] **No custom filter registration API**
  - Filters are hardcoded in `defaultFilters`
  - Allow users to register custom filters

- [ ] **Logical OR `||` conflicts with filter pipe `|`** (`expressions.ts:342-345`)
  - Special case handling but could still fail
  - Consider different filter syntax (e.g., `|>` or `:`)

### Safe Evaluator (`safe-evaluator.ts`)

- [ ] **Dangerous pattern list may be incomplete** (`safe-evaluator.ts:34-41`)
  - Missing: `Reflect`, `Proxy`, `Symbol`, `WeakMap`, `WeakSet`
  - Review and expand blocked patterns

- [ ] **Bracket notation blocking is too aggressive** (`safe-evaluator.ts:40`)
  - `/\[\s*['"]` blocks legitimate array access like `arr["key"]`
  - Refine pattern to only block injection attempts

- [ ] **Object sanitization depth limit** (`safe-evaluator.ts:104`)
  - Hardcoded depth of 10
  - Make configurable

- [ ] **No sandboxing for function execution**
  - Still uses `new Function()` which has access to global scope
  - Consider using a proper sandbox like `vm2` or isolated-vm

---

## Security

### Critical Security Items

- [ ] **`new Function()` usage throughout codebase**
  - Used in: `expressions.ts`, `conditionals.ts`, `loops.ts`, `forms.ts`, `i18n.ts`, `seo.ts`
  - Potential for code injection if user input reaches these
  - Implement proper sandboxing

- [ ] **Path traversal in includes** (`includes.ts:227-252`)
  - `resolvePath` doesn't fully prevent `../` traversal
  - Add strict path validation

- [ ] **HTML injection in error messages**
  - Error messages include user input without escaping
  - Escape all user input in error output

- [ ] **CSRF token generation is weak** (`forms.ts:9-11`)
  - Uses `Math.random().toString(36)` which is not cryptographically secure
  - Use `crypto.randomUUID()` or similar

- [ ] **No Content Security Policy support**
  - Generated HTML doesn't include CSP headers
  - Add CSP configuration option

### Input Validation

- [ ] **Directive parameters not sanitized**
  - User input in directive params goes directly to evaluation
  - Add input sanitization layer

- [ ] **File path validation is incomplete** (`error-handling.ts:150-162`)
  - `isValidFilePath` checks are basic
  - Add more comprehensive path validation

---

## Performance

### Optimization Opportunities

- [ ] **Regex compilation on every call**
  - Many regex patterns are created inline
  - Use `getCachedRegex` consistently or compile at module load

- [ ] **No template pre-compilation**
  - Templates are parsed on every request
  - Add ahead-of-time compilation option

- [ ] **Component cache is unbounded** (`utils.ts:14`)
  - `componentsCache` Map grows indefinitely
  - Implement LRU cache with size limit

- [ ] **Synchronous file operations in some paths**
  - `fs.existsSync` used in several places
  - Convert to async consistently

- [ ] **No lazy loading for directive processors**
  - All processors loaded even if not used
  - Implement lazy loading for unused features

### Performance Monitoring (`performance-utils.ts`)

- [ ] **Performance monitoring is opt-in but always imported**
  - Even when disabled, the module is loaded
  - Make truly optional with dynamic import

- [ ] **No performance budgets**
  - Can't set limits on processing time
  - Add configurable performance budgets with warnings

---

## Error Handling

### Error System (`error-handling.ts`)

- [ ] **Error recovery may hide real issues** (`error-handling.ts:203-226`)
  - `fixCommonSyntaxErrors` auto-fixes might mask bugs
  - Make recovery opt-in and log warnings

- [ ] **Error logger has no persistence** (`error-handling.ts:239-280`)
  - Errors only kept in memory
  - Add file/external logging option

- [ ] **Inconsistent error message formats**
  - Some errors use `createDetailedErrorMessage`, others use simple strings
  - Standardize error formatting

- [ ] **No error codes for programmatic handling**
  - Errors have types but no numeric codes
  - Add error codes for easier error handling

### User-Facing Errors

- [ ] **Error messages expose internal paths**
  - Full file paths shown in errors
  - Option to show relative paths only

- [ ] **No localization for error messages**
  - All errors in English
  - Add i18n support for errors

---

## Testing

### Test Coverage Gaps

- [ ] **No integration tests for full build pipeline**
  - Tests are mostly unit tests
  - Add end-to-end build tests

- [ ] **Missing edge case tests**
  - Deeply nested directives
  - Unicode in expressions
  - Very large templates

- [ ] **No performance regression tests**
  - No benchmarks in CI
  - Add performance tests with thresholds

- [ ] **Test fixtures are inline** (`test/stx.test.ts`)
  - Templates written as strings in tests
  - Move to separate fixture files

### Test Infrastructure

- [ ] **Tests create files in temp directories**
  - Could leave artifacts on failure
  - Add proper cleanup in afterAll

- [ ] **No snapshot testing**
  - Output changes not tracked
  - Add snapshot tests for rendered output

- [ ] **Mocking is inconsistent**
  - Some tests use real file system
  - Standardize on mocking approach

---

## Documentation

### Missing Documentation

- [ ] **No API documentation**
  - Functions lack JSDoc comments in many places
  - Add comprehensive JSDoc

- [ ] **Directive reference incomplete**
  - Not all directives documented
  - Create complete directive reference

- [ ] **No architecture documentation**
  - Processing pipeline not documented
  - Add architecture diagrams

- [ ] **Missing migration guide**
  - No guide for Laravel Blade users
  - Create migration documentation

### Code Comments

- [ ] **Magic numbers without explanation**
  - `1000` max iterations, `16` hash length, etc.
  - Add constants with documentation

- [ ] **Complex regex without explanation**
  - Many regex patterns lack comments
  - Add inline documentation for complex patterns

---

## Developer Experience

### Dev Server (`dev-server.ts`)

- [ ] **Massive file (1400+ lines)**
  - Single file handles too much
  - Split into smaller modules

- [ ] **Duplicate code for markdown/stx serving**
  - Similar HTML wrapper code repeated
  - Extract shared template

- [ ] **No WebSocket-based hot reload**
  - Uses file watching but no push to browser
  - Implement proper HMR

- [ ] **Theme selector code duplicated** (`dev-server.ts:219-467`, `dev-server.ts:897-1016`)
  - Same HTML/CSS for theme selector in multiple places
  - Extract to shared template

### CLI

- [ ] **CLI not fully documented**
  - Commands mentioned in CLAUDE.md but not all implemented
  - Verify and document all commands

- [ ] **No interactive mode**
  - All commands are one-shot
  - Add interactive/watch modes

- [ ] **No project scaffolding**
  - `stx init` exists but limited
  - Add more starter templates

---

## Desktop Package

### Window Management (`packages/desktop/src/window.ts`)

- [ ] **Most WindowInstance methods are stubs** (`window.ts:61-90`, `window.ts:205-234`)
  - `hide`, `close`, `focus`, `minimize`, `maximize`, `restore`, `setTitle`, `loadURL`, `reload` all just log warnings
  - Implement actual functionality or document limitations

- [ ] **Hardcoded craft binary paths** (`window.ts:12-19`)
  - Paths are specific to certain machine configurations
  - Make configurable or use proper binary resolution

- [ ] **No error recovery for ts-craft failures**
  - Falls back to browser but doesn't retry
  - Add retry logic or better error handling

### Other Desktop Features

- [ ] **System tray is placeholder** (per CLAUDE.md)
  - `packages/desktop/src/system-tray.ts` is placeholder
  - Implement or remove from exports

- [ ] **Modals are placeholder** (per CLAUDE.md)
  - `packages/desktop/src/modals.ts` is placeholder
  - Implement or remove from exports

- [ ] **Alerts are placeholder** (per CLAUDE.md)
  - `packages/desktop/src/alerts.ts` is placeholder
  - Implement or remove from exports

- [ ] **Only 3 of 35 components implemented** (per CLAUDE.md)
  - `packages/desktop/src/components.ts` has 35 documented but only 3 implemented
  - Implement remaining or update documentation

---

## Bun Plugin

### Plugin Implementation (`packages/bun-plugin/src/index.ts`)

- [ ] **Duplicate code with packages/stx/src/plugin.ts**
  - Two plugin implementations exist
  - Consolidate into single source

- [ ] **No watch mode support**
  - Plugin doesn't support incremental builds
  - Add file watching integration

- [ ] **Error handling differs from main plugin**
  - Different error page generation
  - Standardize error handling

---

## Streaming & Hydration

### Streaming (`streaming.ts`)

- [ ] **Section pattern is HTML comments** (`streaming.ts:20`)
  - `<!-- @section:name -->` pattern is fragile
  - Consider using custom elements or data attributes

- [ ] **No actual streaming implementation**
  - `streamTemplate` returns full content at once
  - Implement true chunked streaming

- [ ] **Island hydration is basic** (`streaming.ts:199-228`)
  - Only generates wrapper divs
  - No actual client-side hydration code

### Hydration

- [ ] **No client-side hydration runtime**
  - Server generates markers but no client code
  - Implement hydration runtime

- [ ] **No selective hydration**
  - All islands hydrate the same way
  - Add priority-based hydration

---

## i18n

### Translation System (`i18n.ts`)

- [ ] **Translation file loading is synchronous-ish**
  - Uses dynamic import but blocks on it
  - Consider lazy loading

- [ ] **No pluralization support**
  - Only simple string replacement
  - Add plural forms support

- [ ] **No ICU message format**
  - Limited parameter replacement
  - Consider ICU MessageFormat support

- [ ] **Cache invalidation missing** (`i18n.ts:20`)
  - `translationsCache` never clears
  - Add cache invalidation

- [ ] **YAML support requires Bun's import**
  - Relies on Bun's YAML import support
  - Add explicit YAML parser fallback

---

## Forms

### Form Directives (`forms.ts`)

- [ ] **Duplicate CSRF processing** (`forms.ts:39-76`, `forms.ts:439-469`)
  - `processBasicFormDirectives` and `processFormDirectives` both handle @csrf
  - Consolidate

- [ ] **No form validation directives**
  - Only error display, no validation rules
  - Add @validate directive

- [ ] **Bootstrap-specific classes hardcoded** (`forms.ts:137`, `forms.ts:165`, etc.)
  - `form-control`, `is-invalid`, `form-check-input`
  - Make class names configurable

- [ ] **No file upload support**
  - No @file directive
  - Add file input handling

---

## SEO & A11y

### SEO (`seo.ts`)

- [ ] **Duplicate escapeHtml function** (`seo.ts:381-388`)
  - Same function exists in `expressions.ts`
  - Extract to shared utility

- [ ] **No sitemap generation**
  - SEO features but no sitemap
  - Add sitemap generation

- [ ] **No robots.txt generation**
  - Only meta robots tag
  - Add robots.txt support

### Accessibility (`a11y.ts`)

- [ ] **A11y checks have hardcoded test cases** (`a11y.ts:113-166`)
  - Special case handling for specific HTML strings
  - Remove test-specific code from production

- [ ] **Limited a11y checks**
  - Only basic checks implemented
  - Add more WCAG checks

- [ ] **No auto-fix for a11y issues**
  - `autoFix` config exists but not implemented
  - Implement auto-fix functionality

- [ ] **Requires very-happy-dom** (`a11y.ts:104-106`)
  - DOM parsing requires global document
  - Add fallback for non-DOM environments

---

## Web Components

### Web Component Generation (`web-components.ts`)

- [ ] **Generated code is basic** (`web-components.ts:127-207`)
  - No reactive properties
  - No proper lifecycle management

- [ ] **No CSS scoping**
  - Styles not properly scoped
  - Add CSS scoping/encapsulation

- [ ] **No TypeScript output option**
  - Only generates JavaScript
  - Add TypeScript generation

- [ ] **Slot processing is empty** (`web-components.ts:177-179`)
  - `_processSlots()` method is empty
  - Implement slot handling

---

## Code Quality

### Linting & Style

- [ ] **Inconsistent eslint-disable comments**
  - Many `eslint-disable-next-line` and `eslint-disable` comments
  - Fix underlying issues or document why disabled

- [ ] **Unused imports in some files**
  - `/* eslint-disable unused-imports/no-unused-vars */` at top of files
  - Clean up unused imports

- [ ] **Biome ignore comments** (`conditionals.ts:91-92`)
  - Mix of ESLint and Biome comments
  - Standardize on one linter

### Code Organization

- [ ] **Large files need splitting**
  - `dev-server.ts`: 1400+ lines
  - `utils.ts`: 880+ lines
  - `process.ts`: 750+ lines
  - Split into smaller, focused modules

- [ ] **Inconsistent file naming**
  - Some kebab-case (`dev-server.ts`), some camelCase (`viewComposers` in code)
  - Standardize naming convention

- [ ] **Magic strings throughout**
  - Directive names, class names, etc. as strings
  - Extract to constants

---

## Future Features

### Potential Enhancements

- [ ] **TypeScript-first templates**
  - Full TypeScript support in `<script>` tags
  - Type checking for template expressions

- [ ] **Visual editor integration**
  - VS Code extension exists but could be enhanced
  - Add visual template editing

- [ ] **Build-time optimization**
  - Tree-shaking for unused directives
  - Dead code elimination

- [ ] **Server components**
  - React Server Components-like feature
  - Streaming server rendering

- [ ] **Edge runtime support**
  - Cloudflare Workers, Deno Deploy
  - Platform-agnostic runtime

- [ ] **State management integration**
  - Built-in state management
  - Or integration with existing solutions

- [ ] **Animation system completion**
  - `animation.ts` has foundation
  - Complete the animation directive system

- [ ] **Database integration**
  - Direct database queries in templates
  - Like Laravel's Blade with Eloquent

---

## Notes

### Priority Guide

- **P0 (Critical)**: Security issues, data loss risks, blocking bugs
- **P1 (High)**: Major functionality gaps, significant UX issues
- **P2 (Medium)**: Improvements, minor bugs, technical debt
- **P3 (Low)**: Nice-to-haves, future features

### Contributing

When working on items:

1. Create a branch named `fix/item-description` or `feat/item-description`
2. Reference this TODO in commit messages
3. Update this file when items are completed
4. Add tests for any fixes

---

*Last updated: November 2024*
*Generated from codebase analysis*
