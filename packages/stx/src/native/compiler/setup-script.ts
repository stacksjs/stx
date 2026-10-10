export interface GeneratedSetupScript {
  name: string
  code: string
}

const SCOPED_SCRIPT = /<script\b[^>]*\bdata-stx-scoped\b[^>]*>([\s\S]*?)<\/script>/gi
const SETUP_NAME = /function\s+(__stx_setup_[\w$]+)\s*\(/

/** Extract the setup stx generated from a screen's client script. */
export function extractGeneratedSetupScript(html: string): GeneratedSetupScript | null {
  SCOPED_SCRIPT.lastIndex = 0
  for (const match of html.matchAll(SCOPED_SCRIPT)) {
    const code = match[1].trim()
    const name = SETUP_NAME.exec(code)?.[1]
    if (name)
      return { name, code }
  }
  return null
}
