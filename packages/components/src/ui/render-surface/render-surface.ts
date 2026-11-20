/**
 * Frames for a `<RenderSurface>`: a box shared TypeScript draws into, frame
 * by frame, the same on a phone and in a browser (stacksjs/stx#2108).
 *
 * A frame is `width * height` 0xAARRGGBB words, row by row: what a CPU
 * graphics core produces. On a native screen `presentFrame` hands them to the
 * host's own `craft.renderSurface.present`, which copies them where the script
 * runs and draws them with Metal (craft-native/craft#578). In a browser the
 * component's `<canvas>` takes them. Either way the frame is scaled to the
 * box, `nearest` or `linear`, so a game can draw below the display's
 * resolution.
 *
 *   import { startRenderLoop } from '@stacksjs/components/render-surface'
 *
 *   <RenderSurface class="flex-1" @ready="loop = startRenderLoop($event.surface, paint)"
 *     @restored="loop.wake()" @error="report($event)" />
 *
 * This module never defines `craft.renderSurface`. The host installs it
 * before the screen's script runs, and it is a function rather than a
 * message: a frame sent as a message would be serialized on every frame.
 */

export type RenderSurfaceFilter = 'nearest' | 'linear'

/** What `ready`, `resize` and `restored` carry: the box in points, and in pixels. */
export interface RenderSurfaceMetrics {
  /** The surface's name: what `presentFrame` is given. */
  surface: string
  width: number
  height: number
  scale: number
  pixelWidth: number
  pixelHeight: number
}

/** What `error` carries. `UNAVAILABLE`: this device cannot draw one. `DUPLICATE`: the name is taken. */
export interface RenderSurfaceError {
  surface: string
  code: 'UNAVAILABLE' | 'DUPLICATE' | string
  message: string
}

/** Where a frame goes: the host's surface, a canvas, or nowhere. */
export type RenderSurfaceHost = 'native' | 'canvas' | 'none'

/** The largest frame, in pixels a side, that a host takes. */
export const RENDER_SURFACE_MAX_SIDE = 8192

interface CanvasSurface {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  opaque: boolean
  image: ImageData | null
}

interface NativeRenderSurface {
  present: (surface: string, pixels: Uint32Array, width: number, height: number) => boolean
}

type AnyGlobal = typeof globalThis & {
  craft?: { renderSurface?: NativeRenderSurface, capabilities?: Record<string, boolean> }
  stx?: { _host?: { isNative?: boolean } }
  __stxRenderSurfaces?: Map<string, CanvasSurface>
}

const root = globalThis as AnyGlobal

/**
 * The page's canvases, by name. Kept on the global: the component's own copy
 * of this module and an app's import of `@stacksjs/components/render-surface`
 * are two modules, and one name has to mean one canvas to both.
 */
function canvases(): Map<string, CanvasSurface> {
  root.__stxRenderSurfaces ??= new Map()
  return root.__stxRenderSurfaces
}

function surfaceError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code })
}

function onNativeScreen(): boolean {
  return Boolean(root.stx?._host?.isNative)
}

/**
 * Where a frame would go on this page: `native` on a screen whose host has a
 * Metal GPU, `canvas` in a browser, `none` on a native host without the
 * capability. Read before mounting to decide whether to offer a surface.
 */
export function renderSurfaceHost(): RenderSurfaceHost {
  if (onNativeScreen()) {
    const present = root.craft?.renderSurface?.present
    return typeof present === 'function' && root.craft?.capabilities?.renderSurface === true ? 'native' : 'none'
  }
  if (typeof document === 'undefined') return 'none'
  return 'canvas'
}

function checkFrame(surface: string, pixels: Uint32Array, width: number, height: number): void {
  if (typeof surface !== 'string' || !surface)
    throw new TypeError('presentFrame needs the surface\'s name')
  if (!(pixels instanceof Uint32Array))
    throw new TypeError('presentFrame takes a Uint32Array of 0xAARRGGBB words')
  for (const [side, value] of [['width', width], ['height', height]] as const) {
    if (!Number.isInteger(value) || value < 1 || value > RENDER_SURFACE_MAX_SIDE)
      throw new TypeError(`presentFrame's ${side} must be a whole number from 1 to ${RENDER_SURFACE_MAX_SIDE}, not ${value}`)
  }
  if (pixels.length !== width * height)
    throw new TypeError(`presentFrame was given ${pixels.length} words for a ${width} x ${height} frame (${width * height})`)
}

/**
 * Draw one frame. True when the surface took it; false while it is not ready
 * or is lost (wait for `ready` or `restored`, then draw a whole frame again:
 * nothing is kept across a loss). Throws a TypeError for a wrong array or
 * size, and an Error whose `code` is NOT_FOUND for a name no mounted surface
 * holds (from its removal on) or UNAVAILABLE where nothing can draw one.
 */
export function presentFrame(surface: string, pixels: Uint32Array, width: number, height: number): boolean {
  if (onNativeScreen()) {
    const host = root.craft?.renderSurface
    if (!host || typeof host.present !== 'function')
      throw surfaceError('UNAVAILABLE', 'This device cannot draw a RenderSurface')
    return host.present(surface, pixels, width, height)
  }
  checkFrame(surface, pixels, width, height)
  const target = canvases().get(surface)
  if (!target)
    throw surfaceError('NOT_FOUND', `No RenderSurface named "${surface}" is on the page`)
  drawToCanvas(target, pixels, width, height)
  return true
}

/** 0xAARRGGBB words into the canvas's RGBA bytes, at the frame's own size. CSS scales it to the box. */
function drawToCanvas(target: CanvasSurface, pixels: Uint32Array, width: number, height: number): void {
  const { canvas, context, opaque } = target
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  if (!target.image || target.image.width !== width || target.image.height !== height)
    target.image = context.createImageData(width, height)
  const bytes = target.image.data
  for (let i = 0, j = 0; i < pixels.length; i++, j += 4) {
    const word = pixels[i]!
    let a = word >>> 24
    let r = (word >>> 16) & 0xFF
    let g = (word >>> 8) & 0xFF
    let b = word & 0xFF
    if (opaque) {
      a = 0xFF
    }
    else if (a > 0 && a < 0xFF) {
      // A surface that is not opaque takes premultiplied words, as the host
      // does; ImageData holds straight alpha.
      r = Math.min(0xFF, Math.round(r * 0xFF / a))
      g = Math.min(0xFF, Math.round(g * 0xFF / a))
      b = Math.min(0xFF, Math.round(b * 0xFF / a))
    }
    bytes[j] = r
    bytes[j + 1] = g
    bytes[j + 2] = b
    bytes[j + 3] = a
  }
  context.putImageData(target.image, 0, 0)
}

/**
 * The component's half in a browser: put a canvas under a name, or say why
 * not. One live surface per name, as on a native screen: a second answers
 * DUPLICATE and the first keeps drawing.
 */
export function claimCanvasSurface(surface: string, canvas: HTMLCanvasElement, options: { opaque?: boolean } = {}): { release: () => void } | { error: RenderSurfaceError } {
  if (canvases().has(surface))
    return { error: { surface, code: 'DUPLICATE', message: `Another RenderSurface named "${surface}" is already on the page` } }
  let context: CanvasRenderingContext2D | null = null
  try { context = canvas.getContext('2d', { alpha: options.opaque === false }) }
  catch { context = null }
  if (!context)
    return { error: { surface, code: 'UNAVAILABLE', message: 'This browser cannot draw a RenderSurface: it has no 2D canvas' } }
  const entry: CanvasSurface = { canvas, context, opaque: options.opaque !== false, image: null }
  canvases().set(surface, entry)
  return {
    release: () => {
      if (canvases().get(surface) === entry) canvases().delete(surface)
    },
  }
}

export interface RenderFrame {
  pixels: Uint32Array
  width: number
  height: number
}

export interface RenderLoop {
  /** Stop asking for frames. */
  stop: () => void
  /** Resume after `present` answered false: call it from `ready` and `restored`. */
  wake: () => void
  /** Whether the loop is waiting for `wake`. */
  readonly waiting: boolean
  /** Whether the loop has ended: stopped, or its surface was removed. */
  readonly ended: boolean
}

/**
 * Draw on every display frame. `draw` returns the frame to show, or nothing
 * to skip one. While the surface answers false (not ready yet, or lost) the
 * loop draws nothing until `wake()`. Its surface being removed ends it
 * quietly: that is how a loop learns its screen went. Any other error ends
 * it and goes to `onError`, or is thrown when there is none.
 */
export function startRenderLoop(surface: string, draw: (time: number) => RenderFrame | null | undefined | void, options: { onError?: (error: unknown) => void } = {}): RenderLoop {
  const frame: (callback: (time: number) => void) => unknown = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : callback => setTimeout(() => callback(Date.now()), 16)
  let ended = false
  let waiting = false
  const tick = (time: number): void => {
    if (ended) return
    if (!waiting) {
      try {
        const next = draw(time)
        if (next && !presentFrame(surface, next.pixels, next.width, next.height))
          waiting = true
      }
      catch (error) {
        ended = true
        if ((error as { code?: string })?.code === 'NOT_FOUND') return
        if (options.onError) options.onError(error)
        else throw error
        return
      }
    }
    frame(tick)
  }
  frame(tick)
  return {
    stop: () => { ended = true },
    wake: () => { waiting = false },
    get waiting() { return waiting },
    get ended() { return ended },
  }
}
