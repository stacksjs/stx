/**
 * PDF reader (PDFKit on macOS).
 *
 * Two operations covering the common "read the file and grep its
 * text" use case:
 *
 *   - `countPages(path)`   — total page count
 *   - `extractText(path)`  — concatenated plaintext of all pages
 *
 * Apps that need richer extraction (per-page text, embedded images,
 * annotations, form-field values) should walk the document directly
 * via the lower-level PDFKit surface.
 */
import { hasBridge } from './_bridge'

export interface PDFAPI {
  /** Number of pages in the PDF, or 0 on error. */
  countPages: (path: string) => Promise<number>
  /** Concatenated plain text of all pages. Empty string on error. */
  extractText: (path: string) => Promise<string>
}

export const pdf: PDFAPI = {
  async countPages(path) {
    if (!path) throw new Error('pdf.countPages: path is required')
    if (!hasBridge('pdf')) return 0
    return await window.craft!.pdf.countPages(path)
  },
  async extractText(path) {
    if (!path) throw new Error('pdf.extractText: path is required')
    if (!hasBridge('pdf')) return ''
    return await window.craft!.pdf.extractText(path)
  },
}
