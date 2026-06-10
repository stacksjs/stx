/**
 * Vision framework — OCR, face detection, barcode scanning.
 *
 * Each function reads an image from disk and returns an array of
 * results. Results are coordinate-tagged where geometry matters
 * (faces, barcodes); text recognition returns a plain string per
 * detected block plus the recognizer's confidence score.
 *
 * No web fallback — Vision is a macOS / iOS framework. Browsers
 * have OCR-via-Tesseract-WASM but the shape is different and apps
 * that want both should layer that themselves.
 */
import { hasBridge } from './_bridge'

export interface VisionTextResult {
  text: string
  /** 0..1 confidence score from VNRecognizedText.confidence. */
  confidence?: number
}

export interface VisionFaceResult {
  /** Face bounding box in image-pixel coordinates. */
  bounds: { x: number, y: number, width: number, height: number }
}

export interface VisionBarcodeResult {
  /** Decoded payload (URL, text, contact card, etc). */
  payload: string
  /** Symbology — `qr`, `ean8`, `ean13`, `code128`, etc. */
  type?: string
}

export interface VisionAPI {
  /** OCR an image at a path. Returns recognized text blocks. */
  recognizeText: (path: string) => Promise<VisionTextResult[]>
  /** Find faces in an image. */
  detectFaces: (path: string) => Promise<VisionFaceResult[]>
  /** Decode barcodes / QR codes. */
  detectBarcodes: (path: string) => Promise<VisionBarcodeResult[]>
}

export const vision: VisionAPI = {
  async recognizeText(path) {
    if (!path) throw new Error('vision.recognizeText: path is required')
    if (!hasBridge('vision')) return []
    return await window.craft!.vision.recognizeText(path)
  },
  async detectFaces(path) {
    if (!path) throw new Error('vision.detectFaces: path is required')
    if (!hasBridge('vision')) return []
    return await window.craft!.vision.detectFaces(path)
  },
  async detectBarcodes(path) {
    if (!path) throw new Error('vision.detectBarcodes: path is required')
    if (!hasBridge('vision')) return []
    return await window.craft!.vision.detectBarcodes(path)
  },
}
