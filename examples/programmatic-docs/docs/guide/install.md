---
title: "Installation"
description: "Install stx in your project"
---

# Installation

Get stx up and running in your project in just a few minutes.

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher

## Install stx

```bash
bun add @stacksjs/stx
```

## Install Bun Plugin (Optional)

If you want to use stx with Bun's build system:

```bash
bun add -d bun-plugin-stx
```

## Verify Installation

Create a simple test file to verify stx is working:

**test.stx**
```stx
<script>
  module.exports = {
    message: "stx is working!"
  };
</script>

<h1>{{ message }}</h1>
```

Process it with stx:

```bash
bun run stx test.stx
```

You should see the rendered HTML output.

## Project Setup

For a new project, create the following structure:

```
my-project/
├── src/
│   ├── pages/
│   │   └── index.stx
│   └── components/
│       └── header.stx
├── public/
├── package.json
└── bunpress.config.ts
```

## Next Steps

- [Quick Start Guide](/guide/quickstart) - Build your first app
- [Configuration](/guide/config) - Configure stx options
- [Programmatic Usage](/guide/programmatic) - Use stx API
