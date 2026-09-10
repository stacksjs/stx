import path from 'node:path'

/**
 * Make a borrowed file's relative imports survive being inlined somewhere else.
 *
 * A layout, and anything else composed into a page, is read as text and merged
 * into the page's output. Its `<script client>` block travels with it, and by
 * the time the bundler sees the result there is one file path for the whole
 * thing — the page's. So `import { useFoo } from '../composables/useFoo'`,
 * written correctly against `resources/layouts/`, is resolved against
 * `resources/views/trail/` and fails.
 *
 * `process.ts` used to choose between the two directories and could only be
 * right about one of them: preferring the layout's directory broke every
 * page-authored relative import, and preferring the page's — which is what it
 * does — breaks every layout-authored one. The page wins because pages
 * outnumber layouts, so the failure is quiet and rare rather than absent.
 *
 * Rewriting the borrowed file's specifiers to absolute paths removes the
 * choice: an absolute specifier resolves to the same module from any
 * directory, so both halves are correct at once and nested layouts stay
 * correct however many times their content is moved.
 *
 * Only `./` and `../` specifiers are touched. Bare imports resolve through
 * node_modules, `@/` through the project root, and absolute ones are already
 * unambiguous — none of them depends on the file's location.
 */

/** `import ... from 'x'`, `export ... from 'x'`, `import 'x'`, `import('x')`. */
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"]*)\2/g

/** A `<script>` block and its body, so markup and text are never rewritten. */
const SCRIPT_BLOCK = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi

/**
 * Absolutise the relative import specifiers in `code`, as written in
 * `sourceFile`.
 *
 * The path is emitted with forward slashes on every platform: it goes into
 * JavaScript source, where a Windows backslash would be an escape character.
 */
export function absolutizeRelativeImports(code: string, sourceFile: string): string {
  if (!sourceFile || !code.includes('/'))
    return code

  const dir = path.dirname(sourceFile)

  return code.replace(SPECIFIER, (match, lead: string, quote: string, request: string) => {
    const resolved = path.resolve(dir, request)
    // `path.resolve` yields a native path; the bundler and the browser both
    // read this as JavaScript, so it has to be POSIX-shaped.
    return `${lead}${quote}${resolved.split(path.sep).join('/')}${quote}`
  })
}

/**
 * The same, applied only inside `<script>` blocks of a template.
 *
 * A template is markup as well as code, and a string like `'../foo'` in an
 * attribute or in prose is not an import. Scoping to script blocks keeps the
 * rewrite to the only place an import specifier can appear.
 */
export function absolutizeTemplateImports(template: string, sourceFile: string): string {
  if (!sourceFile || !template.includes('<script'))
    return template

  return template.replace(SCRIPT_BLOCK, (_match, open: string, body: string, close: string) =>
    `${open}${absolutizeRelativeImports(body, sourceFile)}${close}`)
}
