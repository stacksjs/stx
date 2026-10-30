export interface GeneratedSetupScript {
  name: string
  code: string
}

/** One generated script the native bundle must execute before hydration. */
export interface NativeClientScript {
  code: string
  /** Component scope whose root must be exposed while its factory runs. */
  owner?: string
  /** The module registry: what the screen's other scripts import, bundled. */
  registry?: boolean
}

const SCOPED_SCRIPT = /<script\b([^>]*\bdata-stx-scoped\b[^>]*)>([\s\S]*?)<\/script>/gi
const SETUP_NAME = /function\s+(__stx_setup_[\w$]+)\s*\(/
const OWNER = /\bdata-stx-owner\s*=\s*["']([^"']+)["']/i

/** Extract the setup stx generated from a screen's client script. */
export function extractGeneratedSetupScript(html: string): GeneratedSetupScript | null {
  SCOPED_SCRIPT.lastIndex = 0
  for (const match of html.matchAll(SCOPED_SCRIPT)) {
    const code = match[2].trim()
    const name = SETUP_NAME.exec(code)?.[1]
    if (name)
      return { name, code }
  }
  return null
}

/** Extract the generated page setup plus component factory registrations/calls. */
export function extractNativeClientScripts(html: string): NativeClientScript[] {
  const scripts: NativeClientScript[] = []
  SCOPED_SCRIPT.lastIndex = 0
  for (const match of html.matchAll(SCOPED_SCRIPT)) {
    const attrs = match[1]
    const code = match[2].trim()
    const owner = OWNER.exec(attrs)?.[1]
    const isFactoryPrelude = /\bdata-stx-component-factories\b/i.test(attrs)
    if (!code || (!owner && !isFactoryPrelude && !SETUP_NAME.test(code)))
      continue
    scripts.push(owner ? { code, owner } : { code })
  }
  return scripts
}
