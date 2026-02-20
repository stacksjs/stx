/**
 * STX JSX Type Declarations
 *
 * Provides TypeScript IntrinsicElements for JSX, plus stx-specific
 * attribute types for directives and event bindings.
 */

import type { VNode, ComponentFunction } from './jsx-runtime'

export namespace JSX {
  // The return type of JSX expressions
  type Element = VNode

  // Props that all elements share
  interface HTMLAttributes {
    // Standard HTML attributes
    id?: string
    class?: string | Record<string, boolean> | Array<string | Record<string, boolean>>
    className?: string | Record<string, boolean> | Array<string | Record<string, boolean>>
    style?: string | Record<string, string | number>
    title?: string
    tabIndex?: number
    tabindex?: number
    role?: string
    slot?: string
    hidden?: boolean
    dir?: string
    lang?: string
    translate?: 'yes' | 'no'
    draggable?: boolean | 'true' | 'false'
    contentEditable?: boolean | 'true' | 'false' | 'inherit'
    spellcheck?: boolean | 'true' | 'false'
    inputMode?: string
    inputmode?: string
    accessKey?: string
    accesskey?: string

    // Data attributes
    [key: `data-${string}`]: any

    // Aria attributes
    [key: `aria-${string}`]: any

    // stx-specific attributes
    'v-if'?: string
    'v-else-if'?: string
    'v-else'?: boolean
    'v-for'?: string
    'v-show'?: string
    'v-model'?: string
    'v-html'?: string
    'v-text'?: string
    'v-pre'?: boolean
    'v-once'?: boolean
    'v-cloak'?: boolean
    'v-memo'?: string
    '@show'?: string
    '@model'?: string
    '@if'?: string
    '@for'?: string

    // stx bind shorthand
    [key: `:${string}`]: any
    [key: `@bind:${string}`]: any

    // Event handlers (DOM)
    onClick?: (e: Event) => void
    onChange?: (e: Event) => void
    onInput?: (e: Event) => void
    onSubmit?: (e: Event) => void
    onFocus?: (e: Event) => void
    onBlur?: (e: Event) => void
    onKeyDown?: (e: KeyboardEvent) => void
    onKeyUp?: (e: KeyboardEvent) => void
    onKeyPress?: (e: KeyboardEvent) => void
    onMouseDown?: (e: MouseEvent) => void
    onMouseUp?: (e: MouseEvent) => void
    onMouseEnter?: (e: MouseEvent) => void
    onMouseLeave?: (e: MouseEvent) => void
    onMouseMove?: (e: MouseEvent) => void
    onMouseOver?: (e: MouseEvent) => void
    onMouseOut?: (e: MouseEvent) => void
    onScroll?: (e: Event) => void
    onWheel?: (e: WheelEvent) => void
    onDragStart?: (e: DragEvent) => void
    onDrag?: (e: DragEvent) => void
    onDragEnd?: (e: DragEvent) => void
    onDragEnter?: (e: DragEvent) => void
    onDragLeave?: (e: DragEvent) => void
    onDragOver?: (e: DragEvent) => void
    onDrop?: (e: DragEvent) => void
    onTouchStart?: (e: TouchEvent) => void
    onTouchEnd?: (e: TouchEvent) => void
    onTouchMove?: (e: TouchEvent) => void
    onTouchCancel?: (e: TouchEvent) => void
    onLoad?: (e: Event) => void
    onError?: (e: Event) => void

    // stx event directives
    '@click'?: string
    '@submit'?: string
    '@input'?: string
    '@change'?: string
    '@keydown'?: string
    '@keyup'?: string
    '@focus'?: string
    '@blur'?: string
    '@mouseenter'?: string
    '@mouseleave'?: string

    // Ref
    ref?: string | ((el: any) => void)

    // Key
    key?: string | number

    // Raw innerHTML
    innerHTML?: string
    dangerouslySetInnerHTML?: { __html: string }
  }

  // Specific element attribute interfaces
  interface AnchorHTMLAttributes extends HTMLAttributes {
    href?: string
    target?: string
    rel?: string
    download?: any
    hreflang?: string
    type?: string
    referrerPolicy?: string
  }

  interface ButtonHTMLAttributes extends HTMLAttributes {
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    form?: string
    formAction?: string
    formEncType?: string
    formMethod?: string
    formNoValidate?: boolean
    formTarget?: string
    name?: string
    value?: string | number
  }

  interface FormHTMLAttributes extends HTMLAttributes {
    action?: string
    method?: string
    encType?: string
    enctype?: string
    target?: string
    noValidate?: boolean
    novalidate?: boolean
    autoComplete?: string
    autocomplete?: string
  }

  interface ImgHTMLAttributes extends HTMLAttributes {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    loading?: 'lazy' | 'eager'
    decoding?: 'sync' | 'async' | 'auto'
    crossOrigin?: string
    crossorigin?: string
    srcSet?: string
    srcset?: string
    sizes?: string
    fetchPriority?: 'high' | 'low' | 'auto'
    fetchpriority?: 'high' | 'low' | 'auto'
  }

  interface InputHTMLAttributes extends HTMLAttributes {
    type?: string
    value?: string | number
    checked?: boolean
    disabled?: boolean
    placeholder?: string
    name?: string
    required?: boolean
    readonly?: boolean
    readOnly?: boolean
    min?: number | string
    max?: number | string
    step?: number | string
    minLength?: number
    minlength?: number
    maxLength?: number
    maxlength?: number
    pattern?: string
    autoComplete?: string
    autocomplete?: string
    autoFocus?: boolean
    autofocus?: boolean
    form?: string
    list?: string
    multiple?: boolean
    accept?: string
    capture?: string
    size?: number
  }

  interface LabelHTMLAttributes extends HTMLAttributes {
    htmlFor?: string
    for?: string
    form?: string
  }

  interface LinkHTMLAttributes extends HTMLAttributes {
    href?: string
    rel?: string
    type?: string
    media?: string
    crossOrigin?: string
    crossorigin?: string
    integrity?: string
    as?: string
  }

  interface MetaHTMLAttributes extends HTMLAttributes {
    name?: string
    content?: string
    httpEquiv?: string
    'http-equiv'?: string
    charset?: string
    property?: string
  }

  interface OptionHTMLAttributes extends HTMLAttributes {
    value?: string | number
    selected?: boolean
    disabled?: boolean
    label?: string
  }

  interface ScriptHTMLAttributes extends HTMLAttributes {
    src?: string
    type?: string
    async?: boolean
    defer?: boolean
    crossOrigin?: string
    crossorigin?: string
    integrity?: string
    noModule?: boolean
    nomodule?: boolean
  }

  interface SelectHTMLAttributes extends HTMLAttributes {
    value?: string | number
    multiple?: boolean
    disabled?: boolean
    name?: string
    required?: boolean
    size?: number
    form?: string
  }

  interface StyleHTMLAttributes extends HTMLAttributes {
    media?: string
    type?: string
    scoped?: boolean
  }

  interface TableHTMLAttributes extends HTMLAttributes {
    cellPadding?: number | string
    cellSpacing?: number | string
    border?: number | string
  }

  interface TextareaHTMLAttributes extends HTMLAttributes {
    value?: string
    placeholder?: string
    name?: string
    disabled?: boolean
    required?: boolean
    readonly?: boolean
    readOnly?: boolean
    rows?: number
    cols?: number
    minLength?: number
    minlength?: number
    maxLength?: number
    maxlength?: number
    wrap?: string
    autoComplete?: string
    autocomplete?: string
    form?: string
  }

  interface VideoHTMLAttributes extends HTMLAttributes {
    src?: string
    poster?: string
    width?: number | string
    height?: number | string
    autoPlay?: boolean
    autoplay?: boolean
    controls?: boolean
    loop?: boolean
    muted?: boolean
    playsInline?: boolean
    playsinline?: boolean
    preload?: 'auto' | 'metadata' | 'none'
    crossOrigin?: string
    crossorigin?: string
  }

  interface SVGAttributes extends HTMLAttributes {
    viewBox?: string
    xmlns?: string
    fill?: string
    stroke?: string
    strokeWidth?: number | string
    'stroke-width'?: number | string
    strokeLinecap?: string
    'stroke-linecap'?: string
    strokeLinejoin?: string
    'stroke-linejoin'?: string
    d?: string
    x?: number | string
    y?: number | string
    cx?: number | string
    cy?: number | string
    r?: number | string
    rx?: number | string
    ry?: number | string
    x1?: number | string
    y1?: number | string
    x2?: number | string
    y2?: number | string
    width?: number | string
    height?: number | string
    transform?: string
    opacity?: number | string
    clipPath?: string
    'clip-path'?: string
    points?: string
    pathLength?: number
  }

  // The IntrinsicElements interface maps tag names to their attribute types
  interface IntrinsicElements {
    // Main structural elements
    div: HTMLAttributes
    span: HTMLAttributes
    p: HTMLAttributes
    main: HTMLAttributes
    section: HTMLAttributes
    article: HTMLAttributes
    aside: HTMLAttributes
    header: HTMLAttributes
    footer: HTMLAttributes
    nav: HTMLAttributes
    figure: HTMLAttributes
    figcaption: HTMLAttributes

    // Headings
    h1: HTMLAttributes
    h2: HTMLAttributes
    h3: HTMLAttributes
    h4: HTMLAttributes
    h5: HTMLAttributes
    h6: HTMLAttributes

    // Text inline elements
    a: AnchorHTMLAttributes
    strong: HTMLAttributes
    em: HTMLAttributes
    b: HTMLAttributes
    i: HTMLAttributes
    u: HTMLAttributes
    s: HTMLAttributes
    small: HTMLAttributes
    mark: HTMLAttributes
    del: HTMLAttributes
    ins: HTMLAttributes
    sub: HTMLAttributes
    sup: HTMLAttributes
    code: HTMLAttributes
    kbd: HTMLAttributes
    samp: HTMLAttributes
    var: HTMLAttributes
    abbr: HTMLAttributes
    cite: HTMLAttributes
    q: HTMLAttributes
    dfn: HTMLAttributes
    time: HTMLAttributes
    data: HTMLAttributes
    ruby: HTMLAttributes
    rt: HTMLAttributes
    rp: HTMLAttributes
    bdi: HTMLAttributes
    bdo: HTMLAttributes
    wbr: HTMLAttributes
    br: HTMLAttributes
    hr: HTMLAttributes

    // Lists
    ul: HTMLAttributes
    ol: HTMLAttributes
    li: HTMLAttributes
    dl: HTMLAttributes
    dt: HTMLAttributes
    dd: HTMLAttributes

    // Tables
    table: TableHTMLAttributes
    thead: HTMLAttributes
    tbody: HTMLAttributes
    tfoot: HTMLAttributes
    tr: HTMLAttributes
    th: HTMLAttributes
    td: HTMLAttributes
    caption: HTMLAttributes
    colgroup: HTMLAttributes
    col: HTMLAttributes

    // Forms
    form: FormHTMLAttributes
    input: InputHTMLAttributes
    textarea: TextareaHTMLAttributes
    select: SelectHTMLAttributes
    option: OptionHTMLAttributes
    optgroup: HTMLAttributes
    button: ButtonHTMLAttributes
    label: LabelHTMLAttributes
    fieldset: HTMLAttributes
    legend: HTMLAttributes
    output: HTMLAttributes
    progress: HTMLAttributes
    meter: HTMLAttributes
    datalist: HTMLAttributes

    // Media
    img: ImgHTMLAttributes
    video: VideoHTMLAttributes
    audio: VideoHTMLAttributes
    source: HTMLAttributes & { src?: string; type?: string; srcSet?: string; srcset?: string; sizes?: string; media?: string }
    track: HTMLAttributes & { src?: string; kind?: string; srclang?: string; label?: string; default?: boolean }
    picture: HTMLAttributes
    canvas: HTMLAttributes & { width?: number | string; height?: number | string }
    map: HTMLAttributes & { name?: string }
    area: HTMLAttributes & { href?: string; alt?: string; coords?: string; shape?: string; target?: string }

    // Embedded content
    iframe: HTMLAttributes & { src?: string; srcdoc?: string; name?: string; width?: number | string; height?: number | string; sandbox?: string; allow?: string; loading?: 'lazy' | 'eager'; referrerPolicy?: string }
    embed: HTMLAttributes & { src?: string; type?: string; width?: number | string; height?: number | string }
    object: HTMLAttributes & { data?: string; type?: string; name?: string; width?: number | string; height?: number | string }
    param: HTMLAttributes & { name?: string; value?: string }

    // Interactive elements
    details: HTMLAttributes & { open?: boolean }
    summary: HTMLAttributes
    dialog: HTMLAttributes & { open?: boolean }
    menu: HTMLAttributes

    // Head elements
    head: HTMLAttributes
    title: HTMLAttributes
    meta: MetaHTMLAttributes
    link: LinkHTMLAttributes
    style: StyleHTMLAttributes
    script: ScriptHTMLAttributes
    noscript: HTMLAttributes
    base: HTMLAttributes & { href?: string; target?: string }

    // Document elements
    html: HTMLAttributes
    body: HTMLAttributes

    // Template / slot
    template: HTMLAttributes
    slot: HTMLAttributes & { name?: string }

    // SVG elements
    svg: SVGAttributes
    path: SVGAttributes
    circle: SVGAttributes
    rect: SVGAttributes
    line: SVGAttributes
    polyline: SVGAttributes
    polygon: SVGAttributes
    ellipse: SVGAttributes
    text: SVGAttributes
    tspan: SVGAttributes
    g: SVGAttributes
    defs: SVGAttributes
    clipPath: SVGAttributes
    mask: SVGAttributes
    use: SVGAttributes & { href?: string }
    symbol: SVGAttributes
    linearGradient: SVGAttributes
    radialGradient: SVGAttributes
    stop: SVGAttributes & { offset?: string | number; 'stop-color'?: string; 'stop-opacity'?: number }
    filter: SVGAttributes
    image: SVGAttributes & { href?: string }
    foreignObject: SVGAttributes
    animate: SVGAttributes
    animateTransform: SVGAttributes
    pattern: SVGAttributes
    marker: SVGAttributes

    // Catchall for custom elements
    [elemName: string]: any
  }

  interface ElementChildrenAttribute {
    children: {}
  }
}

// Module augmentation for the jsx-runtime
declare module '@stacksjs/stx/jsx-runtime' {
  export { JSX }
}
