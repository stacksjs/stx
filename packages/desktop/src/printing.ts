/**
 * Printing
 *
 * Print the current page (system print sheet) or save it as a PDF.
 * Uses `[WKWebView printOperationWithPrintInfo:]` on macOS — i.e.
 * the same code path Safari uses.
 *
 * Browser fallback uses `window.print()` for `print()`. There's no
 * portable web equivalent for "silently save current page as PDF" —
 * that path throws.
 */

import { hasBridge, requireBridge } from './_bridge'

export interface PrintToPDFResult {
  ok: boolean
  /** Where the PDF was written. */
  path?: string
}

export interface PrintingAPI {
  /** Open the system print sheet for the current webview. */
  print: () => Promise<void>
  /** Render the current page to a PDF on disk. Path must be absolute. */
  printToPDF: (path: string) => Promise<PrintToPDFResult>
}

export const printing: PrintingAPI = {
  async print() {
    if (hasBridge('printing')) {
      await window.craft!.printing.print()
      return
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print()
    }
  },

  async printToPDF(path: string): Promise<PrintToPDFResult> {
    if (!path) throw new Error('printToPDF: path is required')
    // Earlier we only accepted POSIX-style absolute paths (starts with
    // `/`), which broke on Windows where `C:\Users\...` is the norm.
    // Accept either: POSIX `/` prefix OR Windows drive-letter prefix
    // (`X:\` or `X:/`). UNC paths (`\\server\share`) also welcome.
    const isPosixAbs = path.startsWith('/')
    const isWinAbs = /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('\\\\')
    if (!isPosixAbs && !isWinAbs) {
      throw new Error('printToPDF: path must be absolute')
    }
    const r = await requireBridge('printing').printToPDF(path)
    return { ok: !!(r && r.ok), path: r?.path }
  },
}
