/**
 * A preview in the DOM: one sandboxed frame, sized like a device and shrunk to
 * fit the box it is shown in.
 *
 * The frame is made new for every load. A frame's sandbox is read when its
 * document is created, so a frame that is reused keeps the permissions of the
 * page before; a new one cannot. It also makes "reload" exactly what it says.
 */
import type { PreviewScheme, ResolvedViewport, ViewportName } from './core'
import { buildDocument, describeViewport, fitScale, normalizeScheme, resolveViewport, sandboxValue, stepViewport } from './core'

export interface PreviewFrameOptions {
  html?: string
  viewport?: ViewportName | string
  /** A viewport of its own size, in CSS pixels. Both are needed. */
  frameWidth?: number | null
  frameHeight?: number | null
  landscape?: boolean
  scheme?: PreviewScheme
  /** Let the page's scripts run, in an origin of their own. */
  scripts?: boolean
  forms?: boolean
  /** The frame's accessible name, and the title of a wrapped fragment. */
  title?: string
}

export interface PreviewState {
  viewport: ViewportName
  width: number | null
  height: number | null
  landscape: boolean
  scale: number
  /** What was asked for. */
  scheme: PreviewScheme
  /** What the page sees: `auto` settled against the host page. */
  effectiveScheme: 'light' | 'dark'
}

export interface PreviewFrameCallbacks {
  onLoad?: (state: PreviewState) => void
  onReload?: (state: PreviewState) => void
  onViewport?: (state: PreviewState) => void
  onScheme?: (state: PreviewState) => void
}

const STAGE_PADDING = 16

export class PreviewFrameView {
  private html: string
  private viewportName: string
  private frameWidth: number | null
  private frameHeight: number | null
  private landscape: boolean
  private scheme: PreviewScheme
  private scripts: boolean
  private forms: boolean
  private title: string
  private viewport: ResolvedViewport
  private scale = 1
  private frame: HTMLIFrameElement | null = null
  private readonly stage: HTMLElement
  private readonly device: HTMLElement
  private observer: ResizeObserver | null = null
  private pending = 0
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: PreviewFrameOptions = {}, private readonly callbacks: PreviewFrameCallbacks = {}) {
    this.html = options.html ?? ''
    this.viewportName = options.viewport || 'fill'
    this.frameWidth = options.frameWidth ?? null
    this.frameHeight = options.frameHeight ?? null
    this.landscape = Boolean(options.landscape)
    this.scheme = normalizeScheme(options.scheme)
    this.scripts = Boolean(options.scripts)
    this.forms = Boolean(options.forms)
    this.title = options.title || 'Preview'
    this.viewport = this.resolve()

    this.stage = this.part('stage')
    this.device = this.part('device')

    const onClick = (event: Event): void => this.onToolbarClick(event)
    const onKey = (event: Event): void => this.onToolbarKey(event as KeyboardEvent)
    this.root.addEventListener('click', onClick)
    this.root.addEventListener('keydown', onKey)
    this.disposers.push(() => this.root.removeEventListener('click', onClick), () => this.root.removeEventListener('keydown', onKey))

    if (typeof ResizeObserver !== 'undefined') {
      // On the next frame, not inside the observer: resizing the device from
      // within the notification that the stage resized is what the browser
      // reports as a resize loop.
      this.observer = new ResizeObserver(() => {
        cancelAnimationFrame(this.pending)
        this.pending = requestAnimationFrame(() => this.layout())
      })
      this.observer.observe(this.stage)
    }

    this.load()
    this.reflect()
    this.root.setAttribute('data-preview-ready', '')
  }

  getState(): PreviewState {
    return {
      viewport: this.viewport.name,
      width: this.viewport.size?.width ?? null,
      height: this.viewport.size?.height ?? null,
      landscape: this.viewport.landscape,
      scale: this.scale,
      scheme: this.scheme,
      effectiveScheme: this.effectiveScheme(),
    }
  }

  setHtml(html: string | null | undefined): void {
    const next = html == null ? '' : String(html)
    if (next === this.html)
      return
    this.html = next
    this.load()
  }

  setViewport(name: string, options: { landscape?: boolean, width?: number | null, height?: number | null } = {}): void {
    this.viewportName = name || 'fill'
    if ('landscape' in options)
      this.landscape = Boolean(options.landscape)
    if ('width' in options)
      this.frameWidth = options.width ?? null
    if ('height' in options)
      this.frameHeight = options.height ?? null
    const before = JSON.stringify(this.viewport)
    this.viewport = this.resolve()
    this.layout()
    this.reflect()
    if (JSON.stringify(this.viewport) !== before)
      this.callbacks.onViewport?.(this.getState())
  }

  setScheme(scheme: unknown): void {
    const next = normalizeScheme(scheme)
    if (next === this.scheme)
      return
    this.scheme = next
    this.applyScheme()
    this.reflect()
    this.callbacks.onScheme?.(this.getState())
  }

  /** Changing what the page may do needs a new frame, so this loads it again. */
  setPermissions(options: { scripts?: boolean, forms?: boolean }): void {
    const scripts = options.scripts ?? this.scripts
    const forms = options.forms ?? this.forms
    if (scripts === this.scripts && forms === this.forms)
      return
    this.scripts = scripts
    this.forms = forms
    this.load()
  }

  /** Load the same markup again, from nothing. */
  reload(): void {
    this.load()
    this.callbacks.onReload?.(this.getState())
  }

  destroy(): void {
    this.observer?.disconnect()
    cancelAnimationFrame(this.pending)
    for (const dispose of this.disposers) dispose()
    this.frame?.remove()
    this.frame = null
    this.root.removeAttribute('data-preview-ready')
  }

  private part(name: string): HTMLElement {
    const found = this.root.querySelector<HTMLElement>(`[data-pf="${name}"]`)
    if (!found)
      throw new Error(`PreviewFrame: the template has no ${name} part`)
    return found
  }

  private resolve(): ResolvedViewport {
    return resolveViewport(this.viewportName, { width: this.frameWidth, height: this.frameHeight, landscape: this.landscape })
  }

  /**
   * The scheme the page will see. `auto` follows the host page: a `dark` or
   * `light` class on an ancestor, the way stx themes a page, and the system
   * setting when there is neither.
   */
  private effectiveScheme(): 'light' | 'dark' {
    if (this.scheme !== 'auto')
      return this.scheme
    if (this.root.closest('.dark'))
      return 'dark'
    if (this.root.closest('.light'))
      return 'light'
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private load(): void {
    const frame = document.createElement('iframe')
    // Written before the frame is in the document and before it has content:
    // the sandbox a frame is created with is the one its page lives under.
    frame.setAttribute('sandbox', sandboxValue({ scripts: this.scripts, forms: this.forms }))
    frame.setAttribute('referrerpolicy', 'no-referrer')
    frame.setAttribute('title', this.title)
    frame.setAttribute('data-pf', 'frame')
    frame.className = 'stx-preview-frame'
    frame.addEventListener('load', () => {
      if (frame === this.frame)
        this.callbacks.onLoad?.(this.getState())
    })
    frame.srcdoc = buildDocument(this.html, { title: this.title })

    this.frame?.remove()
    this.frame = frame
    this.applyScheme()
    this.device.appendChild(frame)
    this.layout()
  }

  /**
   * A frame's page takes its `prefers-color-scheme` from the `color-scheme`
   * its frame element is drawn with. So the scheme is set here, on the host's
   * side, and the page needs no script and no cooperation to follow it.
   */
  private applyScheme(): void {
    const scheme = this.effectiveScheme()
    this.root.setAttribute('data-scheme', scheme)
    if (this.frame)
      this.frame.style.colorScheme = scheme
  }

  private layout(): void {
    const frame = this.frame
    if (!frame)
      return
    const size = this.viewport.size
    this.root.setAttribute('data-viewport', this.viewport.name)

    if (!size) {
      this.scale = 1
      this.device.style.width = ''
      this.device.style.height = ''
      frame.style.width = ''
      frame.style.height = ''
      frame.style.transform = ''
    }
    else {
      const box = this.stage.getBoundingClientRect()
      this.scale = fitScale(size, { width: box.width, height: box.height }, STAGE_PADDING)
      // The page is laid out at its real size and drawn smaller, so its media
      // queries see the device's width, not the box's.
      this.device.style.width = `${size.width * this.scale}px`
      this.device.style.height = `${size.height * this.scale}px`
      frame.style.width = `${size.width}px`
      frame.style.height = `${size.height}px`
      frame.style.transform = this.scale === 1 ? '' : `scale(${this.scale})`
    }

    const readout = this.root.querySelector('[data-pf="size"]')
    if (readout)
      readout.textContent = describeViewport(this.viewport, this.scale)
  }

  /** Bring the toolbar in line with the state. */
  private reflect(): void {
    for (const button of this.root.querySelectorAll<HTMLElement>('[data-pf-viewport]')) {
      const chosen = button.getAttribute('data-pf-viewport') === this.viewport.name
      button.setAttribute('aria-checked', String(chosen))
      button.tabIndex = chosen ? 0 : -1
    }
    // A viewport of its own size matches no button; the first one keeps the group reachable.
    if (!this.root.querySelector('[data-pf-viewport][tabindex="0"]'))
      this.root.querySelector<HTMLElement>('[data-pf-viewport]')?.setAttribute('tabindex', '0')

    const dark = this.effectiveScheme() === 'dark'
    const scheme = this.root.querySelector<HTMLElement>('[data-pf-action="scheme"]')
    if (scheme) {
      scheme.setAttribute('aria-pressed', String(dark))
      const text = scheme.querySelector('[data-pf="scheme-text"]')
      if (text)
        text.textContent = dark ? 'Dark' : 'Light'
    }

    const rotate = this.root.querySelector<HTMLButtonElement>('[data-pf-action="rotate"]')
    if (rotate) {
      const size = resolveViewport(this.viewportName, { width: this.frameWidth, height: this.frameHeight }).size
      // Only something taller than it is wide has a side to be turned on.
      rotate.disabled = !size || this.viewport.name === 'custom' || size.height <= size.width
      rotate.setAttribute('aria-pressed', String(this.viewport.landscape))
    }
  }

  private onToolbarClick(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-pf-viewport], [data-pf-action]') : null
    if (!target || !this.root.contains(target))
      return

    const viewport = target.getAttribute('data-pf-viewport')
    if (viewport) {
      this.setViewport(viewport, { width: null, height: null })
      return
    }

    switch (target.getAttribute('data-pf-action')) {
      case 'scheme':
        this.setScheme(this.effectiveScheme() === 'dark' ? 'light' : 'dark')
        break
      case 'rotate':
        this.setViewport(this.viewportName, { landscape: !this.landscape })
        break
      case 'reload':
        this.reload()
        break
    }
  }

  /** The viewport buttons are one radio group: the arrows move through it. */
  private onToolbarKey(event: KeyboardEvent): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-pf-viewport]') : null
    if (!target)
      return
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (direction === 0)
      return

    event.preventDefault()
    const current = (target.getAttribute('data-pf-viewport') || 'fill') as ViewportName
    const next = stepViewport(current, direction)
    this.setViewport(next, { width: null, height: null })
    this.root.querySelector<HTMLElement>(`[data-pf-viewport="${next}"]`)?.focus()
  }
}
