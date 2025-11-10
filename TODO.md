# STX Component Library Migration TODO

## Project Overview
Migrate and refactor 23+ Vue components from `/Users/chrisbreuer/Code/stacks/storage/framework/core/components` to `/Users/chrisbreuer/Code/stx/packages/components`, converting them from Vue to STX format with proper syntax highlighting (using ts-syntax-highlighter) and utility-first CSS classes (using headwind).

**Total Components to Migrate:** 23 components
**Total Vue Files:** ~197 .vue files
**Target Format:** .stx files with headwind utility classes

---

## Phase 1: Setup & Infrastructure

### 1.1 Package Structure Setup
- [ ] Create base package structure at `/Users/chrisbreuer/Code/stx/packages/components`
- [ ] Create `package.json` with proper exports and dependencies
- [ ] Add `@stacksjs/components` as package name
- [ ] Set up TypeScript configuration (`tsconfig.json`, `tsconfig.build.json`)
- [ ] Create `src/` directory for component source files
- [ ] Create `dist/` directory structure for builds
- [ ] Create `examples/` directory for component demos
- [ ] Create `test/` directory for component tests

### 1.2 Dependencies Setup
- [ ] Add ts-syntax-highlighter dependency (`~/Code/ts-syntax-highlighter`)
- [ ] Add headwind dependency (`~/Code/headwind`)
- [ ] Add stx core dependencies (`@stacksjs/stx`)
- [ ] Configure workspace references in root `package.json`
- [ ] Add bun-plugin-stx for .stx file processing
- [ ] Set up build tooling and scripts

### 1.3 Build Configuration
- [ ] Create `build.ts` script for component compilation
- [ ] Configure CSS processing for headwind utilities
- [ ] Set up type generation pipeline
- [ ] Configure bundling for individual components
- [ ] Set up watch mode for development
- [ ] Create production build optimization

### 1.4 Documentation Infrastructure
- [ ] Create main `README.md` for the package
- [ ] Set up documentation structure in `docs/` directory
- [ ] Create component documentation templates
- [ ] Set up example/demo templates
- [ ] Create migration guide documentation

---

## Phase 2: Core Utilities & Shared Code

### 2.1 Syntax Highlighting Integration
- [ ] Create syntax highlighter wrapper for STX
- [ ] Integrate ts-syntax-highlighter with headwind classes
- [ ] Create reusable `<CodeBlock>` component
- [ ] Create `<InlineCode>` component
- [ ] Set up language detection utilities
- [ ] Configure theme support (light/dark mode)
- [ ] Create syntax highlighting composables/utilities

### 2.2 Headwind Utility Setup
- [ ] Configure headwind build pipeline
- [ ] Create headwind configuration file
- [ ] Set up utility class generation
- [ ] Create design token mapping
- [ ] Set up responsive utility classes
- [ ] Configure dark mode utilities
- [ ] Create component-specific utility presets

### 2.3 Shared Composables Migration
- [ ] Migrate `useCopyCode` composable to STX
- [ ] Migrate `useDarkMode` composable to STX
- [ ] Migrate `useSEOHeader` composable to STX
- [ ] Migrate `useIsDocumentHidden` composable to STX
- [ ] Create STX-compatible composable utilities
- [ ] Set up reactivity system for STX components
- [ ] Create shared state management utilities

### 2.4 Shared Components
- [ ] Create base `<Hero>` component template
- [ ] Create base `<Footer>` component template
- [ ] Create base `<Installation>` component template
- [ ] Create base `<Usage>` component template
- [ ] Create base `<Styling>` component template
- [ ] Create base `<Example>` component template
- [ ] Create component wrapper/layout templates

---

## Phase 3: Component Migration (23 Components)

### 3.1 Auth Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate auth logic and state management
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.2 Audio Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate audio player logic
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.3 Button Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Create button variants (primary, secondary, outline, etc.)
- [ ] Add size variations
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.4 Calendar Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate date picker logic
- [ ] Implement calendar grid and navigation
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.5 Combobox Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate search/filter logic
- [x] Implement keyboard navigation
- [x] Create component examples
- [ ] Write component tests
- [x] Generate component documentation

### 3.6 Command Palette Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate command search logic
- [ ] Implement keyboard shortcuts
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.7 Dialog Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate modal/dialog logic
- [x] Implement focus trap and accessibility
- [x] Create component examples (alert, confirm, custom)
- [ ] Write component tests
- [x] Generate component documentation

### 3.8 Drawer Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate slide-out panel logic
- [ ] Implement position variants (left, right, top, bottom)
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.9 Dropdown Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate dropdown menu logic
- [x] Implement keyboard navigation
- [x] Create component examples
- [ ] Write component tests
- [x] Generate component documentation

### 3.10 Image Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate image loading logic
- [ ] Implement lazy loading
- [ ] Add placeholder/skeleton support
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.11 Listbox Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate selection logic
- [ ] Implement keyboard navigation
- [ ] Support single and multi-select
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.12 Navigator Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate navigation logic
- [ ] Implement active state handling
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.13 Notification Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate toast/notification system
- [x] Implement position variants
- [x] Add animation/transitions
- [x] Create component examples
- [ ] Write component tests
- [x] Generate component documentation

### 3.14 Payment Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate payment form logic
- [ ] Implement validation
- [ ] Add card input formatting
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.15 Popover Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate popover positioning logic
- [x] Implement auto-positioning
- [x] Add arrow/pointer support
- [x] Create component examples
- [ ] Write component tests
- [x] Generate component documentation

### 3.16 Radio Group Component
- [x] Analyze Vue component structure and dependencies
- [x] Convert Vue templates to STX syntax
- [x] Replace CSS with headwind utility classes
- [x] Convert Vue script setup to STX script blocks
- [x] Migrate radio selection logic
- [x] Implement keyboard navigation
- [x] Create component examples
- [ ] Write component tests
- [x] Generate component documentation

### 3.17 Select Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate select dropdown logic
- [ ] Implement search/filter
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.18 Stepper Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate step navigation logic
- [ ] Implement progress tracking
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.19 Storage Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate storage utilities
- [ ] Implement localStorage/sessionStorage helpers
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.20 Switch Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate toggle switch logic
- [ ] Add size variations
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.21 Table Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate table rendering logic
- [ ] Implement sorting
- [ ] Implement filtering
- [ ] Add pagination support
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.22 Transition Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate transition/animation logic
- [ ] Implement various transition types
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

### 3.23 Video Component
- [ ] Analyze Vue component structure and dependencies
- [ ] Convert Vue templates to STX syntax
- [ ] Replace CSS with headwind utility classes
- [ ] Convert Vue script setup to STX script blocks
- [ ] Migrate video player logic
- [ ] Implement controls
- [ ] Add thumbnail support
- [ ] Create component examples
- [ ] Write component tests
- [ ] Generate component documentation

---

## Phase 4: Testing & Quality Assurance

### 4.1 Unit Testing
- [ ] Set up Bun test environment for components package
- [ ] Create test utilities and helpers
- [ ] Write unit tests for shared utilities
- [ ] Write unit tests for composables
- [ ] Ensure all components have test coverage
- [ ] Set up coverage reporting
- [ ] Achieve minimum 80% code coverage

### 4.2 Integration Testing
- [ ] Create integration test suite
- [ ] Test component interactions
- [ ] Test state management
- [ ] Test event handling
- [ ] Test accessibility features
- [ ] Test keyboard navigation

### 4.3 Visual Regression Testing
- [ ] Set up visual testing framework
- [ ] Create visual test snapshots
- [ ] Test components in light mode
- [ ] Test components in dark mode
- [ ] Test responsive layouts
- [ ] Test component variants

### 4.4 Accessibility Testing
- [ ] Audit components for WCAG compliance
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify ARIA attributes
- [ ] Test focus management
- [ ] Fix accessibility issues

---

## Phase 5: Documentation & Examples

### 5.1 Component Documentation
- [ ] Write API documentation for each component
- [ ] Document component props and types
- [ ] Document component events
- [ ] Document component slots
- [ ] Create usage examples for each component
- [ ] Add code snippets with syntax highlighting

### 5.2 Example Applications
- [ ] Create basic form example
- [ ] Create dashboard example
- [ ] Create e-commerce example
- [ ] Create admin panel example
- [ ] Create landing page example
- [ ] Create documentation site example

### 5.3 Migration Guides
- [ ] Write Vue to STX migration guide
- [ ] Document breaking changes
- [ ] Create migration scripts/codemods if needed
- [ ] Document headwind utility class mappings
- [ ] Create side-by-side comparison examples

### 5.4 API Reference
- [ ] Generate TypeScript API documentation
- [ ] Create component API reference
- [ ] Document utility functions
- [ ] Document composables API
- [ ] Create searchable documentation

---

## Phase 6: Build & Distribution

### 6.1 Build System
- [ ] Optimize production builds
- [ ] Set up code splitting
- [ ] Configure tree-shaking
- [ ] Minify and compress assets
- [ ] Generate source maps
- [ ] Create bundle size reports

### 6.2 Package Distribution
- [ ] Configure npm/jsr publishing
- [ ] Set up versioning strategy
- [ ] Create release workflow
- [ ] Generate changelog automation
- [ ] Set up package registry
- [ ] Test package installation

### 6.3 CI/CD Pipeline
- [ ] Set up GitHub Actions workflow
- [ ] Configure automated testing
- [ ] Set up automated builds
- [ ] Configure automated publishing
- [ ] Set up preview deployments
- [ ] Configure automated changelog generation

---

## Phase 7: Performance & Optimization

### 7.1 Performance Optimization
- [ ] Analyze bundle sizes
- [ ] Optimize component rendering
- [ ] Implement code splitting
- [ ] Optimize CSS delivery
- [ ] Implement lazy loading
- [ ] Optimize syntax highlighting performance
- [ ] Profile component performance

### 7.2 Developer Experience
- [ ] Set up hot module replacement
- [ ] Optimize build times
- [ ] Create development playground
- [ ] Add TypeScript autocomplete
- [ ] Create component snippets
- [ ] Set up error handling and debugging

---

## Phase 8: Final Polish & Release

### 8.1 Code Review & Cleanup
- [ ] Review all migrated components
- [ ] Ensure consistent code style
- [ ] Remove unused code
- [ ] Optimize imports
- [ ] Update dependencies
- [ ] Fix linting issues

### 8.2 Documentation Review
- [ ] Review all documentation
- [ ] Fix typos and errors
- [ ] Ensure examples work
- [ ] Update README files
- [ ] Create getting started guide
- [ ] Add troubleshooting guide

### 8.3 Release Preparation
- [ ] Create release notes
- [ ] Update version numbers
- [ ] Tag release
- [ ] Publish to package registry
- [ ] Announce release
- [ ] Update main repository

---

## Maintenance Tasks

### Ongoing
- [ ] Monitor GitHub issues
- [ ] Review pull requests
- [ ] Update dependencies
- [ ] Fix bugs
- [ ] Add new features based on feedback
- [ ] Keep documentation up to date

---

## Notes

### Key Technologies
- **STX Framework**: Template processing and component system
- **ts-syntax-highlighter**: Code syntax highlighting (`~/Code/ts-syntax-highlighter`)
- **headwind**: Utility-first CSS framework (`~/Code/headwind`)
- **Bun**: Runtime and test runner
- **TypeScript**: Type safety and tooling

### Migration Strategy
1. Start with simpler components (Button, Switch) to establish patterns
2. Move to medium complexity (Dropdown, Dialog)
3. Tackle complex components last (Table, Calendar, Command Palette)
4. Test thoroughly at each stage
5. Maintain backward compatibility where possible

### Quality Standards
- 80%+ test coverage
- WCAG 2.1 Level AA compliance
- TypeScript strict mode
- Bundle size < 50KB per component (gzipped)
- First-class dark mode support
- Comprehensive documentation

### Success Criteria
- All 23 components successfully migrated
- All tests passing
- Documentation complete
- Examples working
- Package published
- Zero critical bugs
