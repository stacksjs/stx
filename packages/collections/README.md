# Iconify Collections

This directory contains all 218 generated Iconify icon collections as individual, tree-shakeable packages.

## 📦 Collections Overview

Each subdirectory (`iconify-{collection}`) is a standalone npm package containing icons from a specific Iconify collection.

**Total Collections**: 218
**Total Icons**: 200,000+

## 🚀 Quick Start

### 1. Choose a Collection

Browse the directories or see [ICONIFY_ALL_COLLECTIONS.md](../../ICONIFY_ALL_COLLECTIONS.md) for a complete list.

Popular collections:
- `iconify-lucide` - Modern, clean icons (1,661 icons)
- `iconify-mdi` - Material Design Icons (7,638 icons)
- `iconify-tabler` - Outline icons (6,011 icons)
- `iconify-heroicons` - Tailwind's icons (1,288 icons)
- `iconify-fluent` - Microsoft Fluent (18,908 icons)

### 2. Build the Collection

```bash
cd iconify-lucide
bun install
bun run build
```

### 3. Use in Your Project

```bash
# From your project
bun add @stx/iconify-lucide @stx/iconify-core
```

```typescript
import { home, settings } from '@stx/iconify-lucide'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, { size: 24 })
```

## 📁 Directory Structure

```
collections/
├── iconify-academicons/
├── iconify-akar-icons/
├── iconify-ant-design/
├── iconify-basil/
├── iconify-bi/
├── iconify-bitcoin-icons/
├── iconify-bx/
├── iconify-carbon/
├── iconify-charm/
├── iconify-clarity/
├── iconify-codicon/
├── iconify-devicon/
├── iconify-emojione/
├── iconify-fa6-solid/
├── iconify-feather/
├── iconify-fluent/
├── iconify-heroicons/
├── iconify-ic/
├── iconify-iconamoon/
├── iconify-iconoir/
├── iconify-ion/
├── iconify-jam/
├── iconify-line-md/
├── iconify-logos/
├── iconify-lucide/
├── iconify-majesticons/
├── iconify-maki/
├── iconify-material-symbols/
├── iconify-mdi/
├── iconify-mingcute/
├── iconify-octicon/
├── iconify-pajamas/
├── iconify-pepicons/
├── iconify-ph/
├── iconify-prime/
├── iconify-radix-icons/
├── iconify-ri/
├── iconify-simple-icons/
├── iconify-solar/
├── iconify-svg-spinners/
├── iconify-tabler/
├── iconify-teenyicons/
├── iconify-twemoji/
├── iconify-uil/
├── iconify-vscode-icons/
└── ... (190 more collections)
```

## 🔧 Generating Collections

### Generate a New Collection

```bash
# From project root
stx iconify generate lucide

# Generate specific icons only
stx iconify generate mdi --icons home,settings,user,heart,star

# Custom output directory
stx iconify generate tabler --output ./custom-path
```

### Regenerate All Collections

```bash
# From project root
bun scripts/generate-all-iconify.ts
```

This will regenerate all 218 collections with the latest icons from Iconify.

## 📊 Collection Categories

### Material Design & Google (35k+ icons)
- `iconify-material-symbols` (15,613 icons)
- `iconify-ic` (10,956 icons)
- `iconify-mdi` (7,638 icons)

### Fluent & Microsoft (28k+ icons)
- `iconify-fluent` (18,908 icons)
- `iconify-fluent-emoji` (3,950 icons)

### Popular UI Sets (20k+ icons)
- `iconify-ph` (9,161 icons)
- `iconify-solar` (7,404 icons)
- `iconify-tabler` (6,011 icons)
- `iconify-hugeicons` (4,583 icons)

### Font Awesome (5k+ icons)
- `iconify-fa6-solid` (1,392 icons)
- `iconify-fa6-brands` (488 icons)
- `iconify-fa7-solid` (1,416 icons)

### Emojis & Flags (15k+ icons)
- `iconify-twemoji` (3,969 icons)
- `iconify-openmoji` (4,172 icons)
- `iconify-noto` (3,970 icons)

### Logos & Brands (6k+ icons)
- `iconify-simple-icons` (3,337 icons)
- `iconify-logos` (1,652 icons)
- `iconify-vscode-icons` (1,371 icons)

## 📖 Documentation

- **Main Guide**: [../../docs/iconify.md](../../docs/iconify.md)
- **All Collections List**: [../../ICONIFY_ALL_COLLECTIONS.md](../../ICONIFY_ALL_COLLECTIONS.md)
- **Implementation Details**: [../../ICONIFY_IMPLEMENTATION.md](../../ICONIFY_IMPLEMENTATION.md)

## ⚡ Features

- ✅ **Tree-Shakeable** - Import only the icons you need
- ✅ **TypeScript Support** - Full type safety and autocomplete
- ✅ **Zero Runtime Dependencies** - Pure SVG generation
- ✅ **Customizable** - Size, color, rotation, flip transformations
- ✅ **Always Up-to-Date** - Based on latest Iconify data

## 🆘 Need Help?

```bash
# List all available collections
stx iconify list

# CLI help
stx iconify --help
```

---

**Generated**: October 7, 2025
**Source**: @iconify/json v2.2.392
**Total Collections**: 218
**Total Icons**: 200,000+
