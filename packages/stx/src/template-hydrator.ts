/**
 * Template Hydrator
 *
 * Resolves placeholder tokens in pre-compiled templates at serve time.
 * Only executes the dynamic parts — server scripts, expression evaluation,
 * and view composers — skipping all the deterministic work done at build time.
 *
 * @module template-hydrator
 */

import type { CompiledTemplate } from './template-compiler'
import { extractVariables } from './variable-extractor'
import { evaluateExpression, escapeHtmlValue } from './expressions'
import { replacePlaceholders, hasPlaceholders } from './placeholder'
import { runPageAction } from './page-action'

/**
 * Hydrate a pre-compiled template with request-time data.
 *
 * This is the serve-time counterpart to compileTemplate(). It takes a
 * compiled template (with placeholder tokens) and a request context,
 * executes server scripts, evaluates expressions, and returns final HTML.
 *
 * @param compiled - The pre-compiled template from build time
 * @param requestContext - Request-time context (route params, session, etc.)
 * @returns Final HTML ready to send to the browser
 */
export async function hydrateTemplate(
  compiled: CompiledTemplate,
  requestContext: Record<string, any> = {},
): Promise<string> {
  return (await runHydration(compiled, requestContext)).html
}

/**
 * Like `hydrateTemplate`, but also returns any streaming-SSR boundaries the
 * page's `<script server>` exported (`streamBoundaries`) — re-run per request,
 * so they're fresh. The production server uses this to stream a page's shell
 * first, then its boundaries (#1746). `boundaries` is `undefined` for a normal
 * page. (The low-level `streamBoundaries` form; the `@stream` sugar's captured
 * templates aren't serialized into the compiled template, so use the function
 * form in production.)
 */
export async function hydrateTemplateStream(
  compiled: CompiledTemplate,
  requestContext: Record<string, any> = {},
): Promise<{ html: string, boundaries?: { id: string, render: () => Promise<string> }[], redirect?: string, cookies?: string[] }> {
  const { html, context, redirect, cookies } = await runHydration(compiled, requestContext)

  // A redirecting action has nothing to render, and streaming a shell for a
  // page the caller is about to replace with a 303 would be wasted work.
  if (redirect)
    return { html, redirect, cookies }

  const { extractStreamBoundaries } = await import('./streaming')
  // Low-level: streamBoundaries export → functions returning HTML.
  let boundaries = extractStreamBoundaries(context)

  // @stream sugar: render each compile-time-captured inner template per request
  // with $boundary = await streamBoundaries[id]() (mirrors serve-app).
  const templates = compiled.streamTemplates
  if (templates && Object.keys(templates).length > 0) {
    const { processDirectives } = await import('./process')
    const { defaultConfig } = await import('./config')
    const dataFns = (context.streamBoundaries || {}) as Record<string, () => Promise<unknown>>
    const fragmentConfig = { ...defaultConfig, autoShell: false } as any
    const tplBoundaries = Object.keys(templates).map(id => ({
      id,
      render: async (): Promise<string> => {
        const data = typeof dataFns[id] === 'function' ? await dataFns[id]() : undefined
        return processDirectives(templates[id], { ...context, $boundary: data }, compiled.sourceFile, fragmentConfig, new Set())
      },
    }))
    const tplIds = new Set(tplBoundaries.map(b => b.id))
    boundaries = [...(boundaries || []).filter(b => !tplIds.has(b.id)), ...tplBoundaries]
  }

  return { html, boundaries: boundaries && boundaries.length > 0 ? boundaries : undefined, cookies }
}

/** Build the request-time context (running server scripts) and fill placeholders. */
async function runHydration(
  compiled: CompiledTemplate,
  requestContext: Record<string, any>,
): Promise<{ html: string, context: Record<string, any>, redirect?: string, cookies?: string[] }> {
  // Build the hydration context from request data
  const context: Record<string, any> = {
    __filename: compiled.sourceFile,
    __dirname: compiled.sourceFile.replace(/[/\\][^/\\]+$/, ''),
    ...requestContext,
  }

  // If the page has no dynamic content, return pre-rendered HTML as-is.
  if (!compiled.hasServerScripts && !hasPlaceholders(compiled.html)) {
    return { html: compiled.html, context }
  }

  // Execute server scripts to populate context with dynamic data (incl. any
  // streamBoundaries export, re-run fresh each request).
  for (const scriptContent of compiled.serverScriptContent) {
    try {
      await extractVariables(scriptContent, context, compiled.sourceFile)
    }
    catch (error) {
      console.warn(`[stx] Server script error in ${compiled.sourceFile}:`, error)
    }
  }

  /*
   * A page handling its own form submission (stacksjs/stx#1847).
   *
   * Runs after the server block and before any placeholder is resolved, so the
   * values the action returns — `errors`, the submitted `values` — are the ones
   * the template renders. Doing it the other way round re-renders the page as
   * it looked before the submit, which answers 200 and reads exactly like the
   * action having run and found nothing wrong.
   *
   * This is the production half of the feature. It shipped in the dev server
   * only, so a form worked under `buddy dev` and silently did nothing once
   * deployed.
   */
  const action = await runPageAction(context, {
    request: requestContext.request as Request | undefined,
    method: requestContext.method as string | undefined,
    params: (requestContext.params ?? {}) as Record<string, string>,
    cookies: (requestContext.cookies ?? {}) as Record<string, string>,
  })

  if (action.redirect)
    return { html: compiled.html, context, redirect: action.redirect, cookies: action.cookies }

  // If no placeholders, server scripts only needed to populate context
  // for side effects (e.g., setting headers). Return HTML as-is.
  if (!hasPlaceholders(compiled.html)) {
    return { html: compiled.html, context, cookies: action.cookies }
  }

  // Resolve expression placeholders
  const values = new Map<string, string>()

  for (const [token, info] of Object.entries(compiled.placeholders)) {
    if (info.expression) {
      try {
        const value = evaluateExpression(info.expression, context)
        if (info.type === 'raw') {
          values.set(token, value !== undefined && value !== null ? String(value) : '')
        }
        else {
          values.set(token, value !== undefined && value !== null ? escapeHtmlValue(String(value)) : '')
        }
      }
      catch {
        values.set(token, '')
      }
    }
  }

  return { html: replacePlaceholders(compiled.html, values), context, cookies: action.cookies }
}

/**
 * Hydrate a fragment (for SPA navigation).
 * Same as hydrateTemplate but returns the fragment portion.
 */
export async function hydrateFragment(
  compiled: CompiledTemplate,
  requestContext: Record<string, any> = {},
): Promise<string> {
  if (!compiled.hasServerScripts && !hasPlaceholders(compiled.fragment)) {
    return compiled.fragment
  }

  // Hydrate the full HTML first (to get context from server scripts)
  const context: Record<string, any> = {
    __filename: compiled.sourceFile,
    __dirname: compiled.sourceFile.replace(/[/\\][^/\\]+$/, ''),
    ...requestContext,
  }

  for (const scriptContent of compiled.serverScriptContent) {
    try {
      await extractVariables(scriptContent, context, compiled.sourceFile)
    }
    catch (error) {
      console.warn(`[stx] Server script error in ${compiled.sourceFile}:`, error)
    }
  }

  if (!hasPlaceholders(compiled.fragment)) {
    return compiled.fragment
  }

  const values = new Map<string, string>()
  for (const [token, info] of Object.entries(compiled.placeholders)) {
    if (info.expression) {
      try {
        const value = evaluateExpression(info.expression, context)
        if (info.type === 'raw') {
          values.set(token, value !== undefined && value !== null ? String(value) : '')
        }
        else {
          values.set(token, value !== undefined && value !== null ? escapeHtmlValue(String(value)) : '')
        }
      }
      catch {
        values.set(token, '')
      }
    }
  }

  return replacePlaceholders(compiled.fragment, values)
}
