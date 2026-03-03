# STX Improvements

Improvements and enhancements for the STX framework. Items include file references, context, and implementation guidance for AI agents and contributors.

---

## Default App Layout for Pages

Pages should not need to repeat the full HTML boilerplate (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`) in every `.stx` file. STX should provide a default layout out of the box — similar to how Laravel scaffolds `app.blade.php`.

### Context

STX already has partial support for this feature:

- **Auto-layout config** (`packages/stx/src/types/config-types.ts:456-458`): `defaultLayout` and `layoutsDir` config options exist
- **Auto-wrap logic** (`packages/stx/src/serve.ts:125-145`): Dev server already checks `!hasDoctype && !hasExtends && stxOptions.defaultLayout` and wraps the page content with the layout
- **Layout processing** (`packages/stx/src/process.ts:1309-1471`): Full `@layout`/`@extends`, `@section`/`@yield`, `@push`/`@stack` directive support is implemented
- **Scaffolding** (`packages/stx/src/scaffolding.ts:447-477`): `addLayout()` command exists to create layout files
- **Init presets** (`packages/stx/src/init.ts:249-302`): A `layout` preset template exists but is not used by default

However, none of this is wired up as the default experience. Users still have to manually create a layout, configure `defaultLayout`, and know to use `@layout()` in their pages.

### Tasks

- [ ] **Scaffold a default `layouts/app.stx` on `stx init`** (`packages/stx/src/init.ts`, `packages/stx/src/scaffolding.ts`)
  - The `default` and `full` project templates in `scaffolding.ts:161-240` should generate a `layouts/app.stx` file with the standard HTML document structure
  - The layout should use `@yield('title', 'My App')`, `@yield('content')`, `@stack('styles')`, and `@stack('scripts')`
  - The `getProjectFiles()` function (`scaffolding.ts:267-333`) needs to include the layout file in its output
  - Example layout:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>@yield('title', 'My App')</title>
      @stack('styles')
    </head>
    <body>
      @yield('content')
      @stack('scripts')
    </body>
    </html>
    ```

- [ ] **Set `defaultLayout` in generated config by default** (`packages/stx/src/config.ts`, `packages/stx/src/scaffolding.ts`)
  - When `stx init` generates the project config, it should set `layoutsDir: 'layouts'` and `defaultLayout: 'app'` so the auto-wrap behavior is enabled out of the box
  - The config type definitions are in `packages/stx/src/types/config-types.ts:451-458`

- [ ] **Ensure auto-layout works in SSG build, not just dev server** (`packages/stx/src/ssg.ts`)
  - The auto-wrap logic currently lives in `serve.ts:125-145` (dev server only)
  - The same `!hasDoctype && !hasExtends` check and layout wrapping needs to be applied in the SSG build pipeline (`ssg.ts:551-601`) where pages are rendered via `processDirectives()`
  - This ensures pages without `@layout` are wrapped consistently in both dev and production builds

- [ ] **Scaffolded pages should use `@layout` instead of full HTML boilerplate** (`packages/stx/src/init.ts`, `packages/stx/src/scaffolding.ts`)
  - The `basic` preset (`init.ts:133-192`) and `addPage()` command (`scaffolding.ts:377-407`) currently generate pages with full HTML document structure
  - These should instead generate pages that extend the default layout:
    ```html
    @layout('layouts/app')

    @section('title', 'Page Title')

    @section('content')
      <h1>Welcome</h1>
    @endsection
    ```

---

## File-Based Routing Parity with Nuxt

STX already has a solid file-based routing foundation. The goal is to reach full Nuxt-level routing DX so users switching from Nuxt feel right at home.

### Context — What Already Works

STX has most of the core routing features implemented:

- **File-based route discovery** (`packages/stx/src/router.ts`): `pages/index.stx` → `/`, `pages/about.stx` → `/about`, `pages/blog/index.stx` → `/blog`
- **Dynamic routes** (`router.ts:88-113`): `pages/blog/[slug].stx` → `/blog/:slug`
- **Catch-all routes** (`router.ts`): `pages/[...slug].stx` → catch-all pattern
- **Route middleware** (`packages/stx/src/route-middleware.ts`): Full Nuxt-style middleware with `defineMiddleware()`, `navigateTo()`, `abortNavigation()`, universal/server/client modes
- **Client-side SPA router** (`packages/stx/src/client/router.ts`, `packages/stx/src/client/stx-router.browser.ts`): Link interception, View Transitions API, page caching, prefetch on hover, history API
- **Page metadata** (`packages/stx/src/head.ts`): `definePageMeta()` with title, description, layout, middleware, transition
- **SSG with ISR** (`packages/stx/src/ssg.ts`): `getStaticPaths()`, `getStaticProps()`, companion `.data.ts` files, incremental regeneration, sitemap/RSS generation
- **Named routes** (`packages/stx/src/routes.ts`): Laravel-style `defineRoute()`, `route()` helper, `@route()` directive
- **Router composables** (`packages/stx/src/composables/use-router.ts`): `navigate()`, `goBack()`, `goForward()`, `useRoute()`, `useSearchParams()`

### Tasks — Missing Features

- [ ] **`<StxLink>` component** (`packages/stx/src/client/router.ts`, new component file)
  - Nuxt has `<NuxtLink>` — STX should have an equivalent `<StxLink>` or `<Link>` component
  - Should automatically apply `active` and `exact-active` CSS classes based on current route
  - Should support `prefetch` attribute for eager prefetching
  - Should integrate with the existing SPA router in `client/router.ts` which already intercepts `<a>` tags
  - The browser router in `client/stx-router.browser.ts` already has prefetch-on-hover logic — the component should leverage this
  - Example usage:
    ```html
    <StxLink to="/about" active-class="text-blue-500">About</StxLink>
    <StxLink to="/blog" prefetch>Blog</StxLink>
    ```

- [ ] **Optional route segments `[[param]]`** (`packages/stx/src/router.ts`)
  - Nuxt supports `pages/users/[[id]].vue` which matches both `/users` and `/users/123`
  - The `filePathToPattern()` function (`router.ts:88-113`) needs to handle `[[param]]` as an optional segment
  - The `matchRoute()` regex generation needs to make the segment optional in the pattern
  - Example: `pages/blog/[[page]].stx` → matches `/blog` and `/blog/2`

- [ ] **Auto-generated route types** (`packages/stx/src/router.ts`, new types output file)
  - Nuxt auto-generates TypeScript types for all routes so `navigateTo()` and route params are type-safe
  - After route discovery in `createRouter()`, generate a `.stx/route-types.d.ts` file with typed route names and their expected params
  - The named routes system in `routes.ts` already has `defineRoute()` — types should be generated from this
  - Example generated output:
    ```typescript
    declare module 'stx/routes' {
      interface RouteMap {
        '/': {}
        '/about': {}
        '/blog/[slug]': { slug: string }
        '/blog/[...slug]': { slug: string[] }
      }
    }
    ```

- [ ] **Nested layouts via folder structure** (`packages/stx/src/process.ts:1309-1471`, `packages/stx/src/serve.ts`)
  - Nuxt supports nested layouts where a folder can define its own layout that wraps child pages
  - Currently layouts are global or specified per-page via `@layout()` — there's no folder-level layout convention
  - A `pages/dashboard/_layout.stx` (or `pages/dashboard/+layout.stx`) file should automatically wrap all pages in that directory
  - The layout resolution in `process.ts:1354-1383` and `utils.ts:resolveTemplatePath()` (line 666+) would need to walk up the directory tree looking for layout files
  - This works with the existing `@yield('content')` / `@section('content')` mechanism

- [ ] **Custom error pages beyond 404** (`packages/stx/src/ssg.ts`, `packages/stx/src/serve.ts`)
  - STX only supports `404.stx` (via `ssg.ts` `generate404` config)
  - Should support `pages/500.stx`, `pages/error.stx`, or a generic `pages/[error].stx` pattern for custom error pages
  - The dev server (`dev-server.ts`) and serve handler (`serve.ts`) should resolve to these error pages when errors occur

- [ ] **Route validation and param schemas** (`packages/stx/src/router.ts`, `packages/stx/src/route-middleware.ts`)
  - Nuxt supports `definePageMeta({ validate: (route) => ... })` to validate route params before rendering
  - The `definePageMeta()` in `head.ts` already has a type system — add a `validate` callback option
  - If validation fails, redirect to the error page
  - Example:
    ```typescript
    definePageMeta({
      validate: (route) => {
        return /^\d+$/.test(route.params.id)
      }
    })
    ```
