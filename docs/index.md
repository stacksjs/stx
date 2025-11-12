---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "stx"
  text: "Fast & Powerful UI Engine"
  tagline: "A modern templating engine inspired by Laravel Blade, powered by Bun"
  image: /images/logo-white.png
  actions:
    - theme: brand
      text: Get Started
      link: /guide/intro
    - theme: alt
      text: View on GitHub
      link: https://github.com/stacksjs/stx

features:
  - title: "Lightning Fast"
    icon: "Fast"
    details: "44.1% faster than VanillaJS. Built on Bun for exceptional performance and minimal overhead."
  - title: "Type-Safe Templates"
    icon: "Shield"
    details: "First-class TypeScript support with full type safety in your templates."
  - title: "Blade-Inspired"
    icon: "Blade"
    details: "Familiar syntax for Laravel Blade developers with powerful 30+ directives."
  - title: "Modern Tooling"
    icon: "Tools"
    details: "VSCode extension, DevTools, and CLI for a great developer experience."
  - title: "Component-Based"
    icon: "Components"
    details: "Create reusable components with props, slots, and lifecycle hooks."
  - title: "Streaming Ready"
    icon: "Stream"
    details: "Built-in support for streaming SSR and progressive enhancement."
  - title: "Desktop Apps"
    icon: "Desktop"
    details: "Build native desktop applications with the @stacksjs/desktop framework."
  - title: "Fastest Parsing"
    icon: "Parser"
    details: "Markdown parsing 2.89x faster, HTML sanitization 77x faster than competitors."
  - title: "200K+ Icons"
    icon: "Icons"
    details: "Access 200,000+ icons from 218 Iconify collections with type-safe components."
---

## Meet the Team

<script setup>
import { VPTeamMembers } from 'vitepress/theme'
import { core } from './_data/team.js'
</script>

<VPTeamMembers size="small" :members="core" />

[Learn more about our team →](/community/team)
