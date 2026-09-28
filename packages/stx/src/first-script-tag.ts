/**
 * Where the first script that can run sits in a rendered document.
 *
 * The signals runtime has to execute before every other script on the page,
 * so both places that position it -- `injectSignalsRuntime` when it first
 * goes in, and the relocation at the end of `processDirectives` -- insert it
 * at the offset this returns.
 *
 * "First `<script`" is not the same thing as "first script that runs". A
 * script inside a `<template>` is inert: it is template CONTENT, and executes
 * only if something clones it into the document later. A runtime placed there
 * never runs at all, so nothing defines `window.stx` and every page script
 * dies on its first line. That is exactly what a bare layout produced: with no
 * `<head>` script to anchor to, the first `<script` in the document was the
 * one inside a component's `<template :if>`, and the runtime went in beside it
 * (the Stacks `/login` page rendered blank with "Cannot destructure property
 * 'navigate' of 'window.stx'").
 *
 * So a `<template>` is treated as one opaque unit. A script found inside one
 * resolves to the start of the OUTERMOST enclosing template: ahead of that
 * unit, the runtime still precedes everything in it and everything after it,
 * and it is in the live document where it executes.
 */

/**
 * Sticky, so each test runs at an offset in the document instead of against a
 * copy of everything after it.
 *
 * `findFirstScriptTag` looks at every `<` until it finds a script, and it used
 * to slice the whole remainder at each one to run an anchored `^...` pattern
 * over the copy. That was the largest remaining allocation site in the render
 * after the component scan: 2.4MB on a plain page, 4.5MB on a component-dense
 * one, per render (#1945). Nothing about the matching changes -- same patterns,
 * same `i` flag, evaluated at `lastIndex` rather than at the start of a slice.
 *
 * STYLE_CLOSE_TAG matches the exact literal `</style>`, case-insensitively,
 * because that is what the `toLowerCase().indexOf('</style>')` it replaces did.
 * It must NOT be widened to tolerate `</style >`: a page where that spelling
 * currently fails to close the skip would start closing it, which moves where
 * the runtime is placed -- the regression class #1787 and #1792 exist to pin.
 */
const STYLE_OPEN_TAG = /<style\b[^>]*>/iy
const STYLE_CLOSE_TAG = /<\/style>/gi
const SCRIPT_OPEN_TAG = /<script\b[^>]*>/iy
const TEMPLATE_OPEN_TAG = /<template(?=[\s>/])[^>]*>/iy
const TEMPLATE_CLOSE_TAG = /<\/template\s*>/iy

export function findFirstScriptTag(html: string): number {
  let searchFrom = 0
  // How many <template> elements the scan is inside, and where the outermost
  // one opened.
  let templateDepth = 0
  let outerTemplateStart = -1

  while (searchFrom < html.length) {
    const tagStart = html.indexOf('<', searchFrom)
    if (tagStart === -1)
      return -1

    if (html.startsWith('<!--', tagStart)) {
      const commentEnd = html.indexOf('-->', tagStart + 4)
      searchFrom = commentEnd === -1 ? html.length : commentEnd + 3
      continue
    }

    STYLE_OPEN_TAG.lastIndex = tagStart
    const styleTag = STYLE_OPEN_TAG.exec(html)
    if (styleTag) {
      // Searched in place. Lower-casing the document to find one closing tag
      // copied the whole page per <style>, and the index it produced was
      // computed against a string that is not always the same LENGTH as the
      // original -- a handful of code points grow when lower-cased -- so the
      // offset could land off the mark on such a page.
      STYLE_CLOSE_TAG.lastIndex = tagStart + styleTag[0].length
      const styleEnd = STYLE_CLOSE_TAG.exec(html)
      searchFrom = styleEnd === null ? html.length : styleEnd.index + '</style>'.length
      continue
    }

    TEMPLATE_OPEN_TAG.lastIndex = tagStart
    const templateTag = TEMPLATE_OPEN_TAG.exec(html)
    if (templateTag) {
      if (templateDepth === 0)
        outerTemplateStart = tagStart
      templateDepth++
      searchFrom = tagStart + templateTag[0].length
      continue
    }

    TEMPLATE_CLOSE_TAG.lastIndex = tagStart
    const templateClose = TEMPLATE_CLOSE_TAG.exec(html)
    if (templateClose) {
      if (templateDepth > 0)
        templateDepth--
      searchFrom = tagStart + templateClose[0].length
      continue
    }

    SCRIPT_OPEN_TAG.lastIndex = tagStart
    if (SCRIPT_OPEN_TAG.test(html))
      return templateDepth > 0 ? outerTemplateStart : tagStart

    searchFrom = tagStart + 1
  }

  return -1
}
