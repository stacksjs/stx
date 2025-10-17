# Marketing Page Example

A complete marketing page example built with Stacks, demonstrating a modern media management SaaS landing page. Styled with **@stacksjs/headwind** (a performant Tailwind-compatible utility-first CSS framework).

## Overview

This example showcases a full-featured marketing page with:

- **Hero Section** - Eye-catching gradient header with animated waves
- **Feature Highlights** - Grid-based feature showcase
- **Call-to-Action** - Conversion-focused CTA sections
- **Why Section** - Problem/solution messaging
- **Pricing Cards** - Two-tier pricing display (Hobby $19, Professional $39)
- **Footer** - Complete footer with newsletter signup

## Structure

This is a self-contained single-file example:

```
examples/
├── marketing-page.stx          # Complete marketing page (single file)
└── marketing-page/
    ├── components/             # Reference components (not used in build)
    └── README.md               # This file
```

## Features

### Design
- Ocean-themed gradient backgrounds (`from-ocean-blue to-ocean-green`)
- Animated SVG waves with smooth transitions
- Responsive grid layouts
- **Headwind CSS** for styling (Tailwind-compatible)
- Clean, modern aesthetic
- Inter font family

### Styling
The page uses @stacksjs/headwind which provides Tailwind-compatible utility classes. Custom colors can be defined in `headwind.config.ts`

## Usage

To view this example:

```bash
# Start the Stacks dev server
./stx dev examples/marketing-page.stx

# Navigate to:
# http://localhost:3000/
```

## Rebuilding CSS

When you modify the page and add new utility classes, rebuild the CSS:

```bash
# From the stx package directory
cd packages/stx

# Build once
bun run build:css

# Or watch for changes (recommended during development)
bun run css:watch
```

This will scan all `.stx` files in the examples directory and generate the CSS at `packages/stx/examples/dist/styles.css`.

## Customization

### Colors
Custom colors are defined via CSS custom properties in the `<style>` block or in `headwind.config.ts`. The example uses:
- Ocean blue gradients for hero section
- Sky/cyan colors for accents
- Gray scale for text and backgrounds

### Content
Edit `examples/marketing-page.stx` to modify:
- Headlines and copy
- Feature descriptions
- Pricing tiers and features
- Footer links
- Sections can be reordered by moving HTML blocks

### Adding Custom Styles
For complex animations or custom CSS, add them to the `<style>` block in the page head (like the wave animations).

## Based On

This example is refactored from the [Meema.io](https://meema.io) marketing page, adapted to use Stacks conventions and modern styling practices.

## Learn More

- [Stacks Documentation](https://stacksjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Component Patterns](https://stacksjs.org/docs/components)
