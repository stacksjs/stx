# Composable module delivery

Composable discovery reads executable client references and template binding
expressions. Static prose, links, classes, comments and literal strings do not
select a module. For example, `hq.support` and `/support.css` do not execute an
export named `support`; `@click="support.open()"` does.

Selected TypeScript modules retain their explicit imported dependencies. The
compiler keeps `import.meta` in real ESM, and preserves top-level await through
bundle namespaces, composable registration and the page module registry. It does
not emulate a module URL with a build-machine path or a browser global.

When a page needs ESM, each module has an explicit completion dependency. Later
page initializers and hydration wait for that dependency, including top-level
await. Classic initializers execute as classic scripts at their original DOM
position so their global declarations and component root remain correct. CSP
nonces are retained. SPA document and fragment swaps preserve module type and
wait for actual execution before `stx:load`; an inline module's insertion or
fetch alone does not establish completion. Ordinary classic-only pages keep
their synchronous initialization path.

Component setup registrations stay synchronous and run through their existing
scope/structural-clone protocol after dependencies are ready. Put shared module
logic in explicitly imported TypeScript modules; importing dependencies does not
make their private bindings ambient globals.

The production SSG test uses the actual emitted HTML/assets and Chromium. It
checks unused `import.meta` modules remain absent, two independent asynchronous
bundles complete before their consumers, explicit imports resolve, module URLs
are real browser URLs, and cold/document/fragment/repeated navigation has no
runtime errors. The HTML minifier uses the JavaScript parser so comment-looking
text inside strings and regular expressions remains intact.
