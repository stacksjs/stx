/**
 * The five store screenshots STORE_LISTING.md asks for, at the 1280x800 the
 * Chrome Web Store wants (stacksjs/stx#1754).
 *
 * Each shot is ONE view, not the whole preview page: the store shows these at
 * roughly a third of their size in the listing carousel, and a full-page dump
 * of every panel at once is unreadable there. Fixtures and theme come from
 * gen-preview.ts so the two cannot drift.
 *
 * `bun scripts/gen-store-shots.ts [outDir]`
 */
import { renderGraph, renderIfTrace, renderQueries, renderScope, renderStores, renderTree } from '../src/render'
import { captureScreenshot } from '../../stx/src/screenshot'
import { page } from './gen-preview'

/**
 * Richer fixtures than the preview's.
 *
 * gen-preview.ts exists to iterate the UI, so three signals and four queries is
 * plenty there. A store screenshot is a picture of the product: at that size a
 * near-empty panel reads as "this tool shows almost nothing" rather than "this
 * example is small", so each view here carries enough rows to fill its frame.
 * Deliberately kept separate rather than enlarging the preview's fixtures,
 * which would make the iteration view noisier for no gain.
 */
const tree = [
  { scopeId: 'AppShell', tag: 'div', children: [
    { scopeId: 'Header', tag: 'header', children: [
      { scopeId: 'SearchBox', tag: 'form', children: [] },
      { scopeId: 'NavMenu', tag: 'nav', children: [] },
    ] },
    { scopeId: 'ProductGrid', tag: 'section', children: [
      { scopeId: 'ProductCard', tag: 'article', children: [] },
      { scopeId: 'ProductCard', tag: 'article', children: [] },
      { scopeId: 'ProductCard', tag: 'article', children: [] },
    ] },
    { scopeId: 'CartDrawer', tag: 'aside', children: [
      { scopeId: 'CartItem', tag: 'li', children: [] },
      { scopeId: 'CartItem', tag: 'li', children: [] },
      { scopeId: 'CartSummary', tag: 'div', children: [] },
    ] },
  ] },
  { scopeId: 'Footer', tag: 'footer', children: [
    { scopeId: 'NewsletterForm', tag: 'form', children: [] },
  ] },
]

const graph = [
  { scopeId: 'CartDrawer', nodes: [
    { name: 'items', type: 'signal', value: [{ id: 1 }, { id: 2 }, { id: 3 }], setCount: 7, subscribers: 4 },
    { name: 'total', type: 'derived', value: 59.97, setCount: 0, subscribers: 2 },
    { name: 'open', type: 'signal', value: true, setCount: 12, subscribers: 1 },
    { name: 'itemCount', type: 'derived', value: 3, setCount: 0, subscribers: 3 },
  ] },
  { scopeId: 'Header', nodes: [
    { name: 'query', type: 'signal', value: 'shoes', setCount: 23, subscribers: 3 },
    { name: 'suggestions', type: 'derived', value: ['shoes', 'shorts'], setCount: 0, subscribers: 1 },
  ] },
  { scopeId: 'ProductGrid', nodes: [
    { name: 'products', type: 'signal', value: [{ id: 1 }, { id: 2 }], setCount: 2, subscribers: 5 },
    { name: 'sortBy', type: 'signal', value: 'price', setCount: 4, subscribers: 2 },
    { name: 'visible', type: 'derived', value: 12, setCount: 0, subscribers: 1 },
  ] },
]

const queries = [
  { source: 'useFetch', url: '/api/products?q=shoes', method: 'GET', status: 200, ok: true, ms: 84.3 },
  { source: 'useQuery', url: '/api/cart', method: 'GET', status: 200, ok: true, ms: 41.1 },
  { source: 'useMutation', url: '/api/cart/add', method: 'POST', status: 201, ok: true, ms: 120.6 },
  { source: 'useQuery', url: '/api/user/profile', method: 'GET', status: 200, ok: true, ms: 33.8 },
  { source: 'useFetch', url: '/api/recommendations', method: 'GET', status: 200, ok: true, ms: 210.4 },
  { source: 'useMutation', url: '/api/cart/remove', method: 'POST', status: 204, ok: true, ms: 67.2 },
  { source: 'useQuery', url: '/api/inventory/8821', method: 'GET', status: 404, ok: false, ms: 22.9, error: 'not found' },
  { source: 'useFetch', url: '/api/reviews/16', method: 'GET', status: 0, ok: false, ms: 5002, error: 'timed out' },
]

const ifTrace = [
  { scopeId: 'CartDrawer', branches: [':if', ':else'], picked: 0, pickedAttr: ':if' },
  { scopeId: 'Header', branches: [':if', ':else-if', ':else'], picked: 2, pickedAttr: ':else' },
  { scopeId: 'ProductCard', branches: [':if', ':else-if', ':else'], picked: 1, pickedAttr: ':else-if' },
  { scopeId: 'CartSummary', branches: [':if', ':else'], picked: 1, pickedAttr: ':else' },
  { scopeId: 'NewsletterForm', branches: [':if'], picked: 0, pickedAttr: ':if' },
  { scopeId: 'CartItem', branches: [':if'], picked: -1, pickedAttr: null },
]

// Deliberately the smallest fixture here: this shot stacks the store LIST and
// one store's state in the same frame, so it runs out of vertical room first.
// An earlier draft carried five stores and eight state rows and cut `locale`
// off at the bottom edge -- a clipped screenshot looks broken in the carousel
// and is worth failing review over.
const scope = {
  signals: { items: [{ id: 1 }, { id: 2 }, { id: 3 }], open: true },
  derived: { total: 59.97, itemCount: 3 },
  values: { currency: 'USD' },
  methods: ['add', 'remove', 'clear'],
}

/** Store carousel dimensions. The store also accepts 640x400. */
const WIDTH = 1280
const HEIGHT = 800

/**
 * A framed shot: the panel content on the panel's own background, padded so it
 * does not sit flush against the edge of the frame, with a caption naming what
 * the reviewer is looking at.
 */
function shot(caption: string, body: string): string {
  // Typography is scaled up hard. The store renders these at roughly a third of
  // their size in the carousel, so panel-native 12px is illegible there; and at
  // native size the content filled only the top 40% of the frame, which reads as
  // a broken screenshot rather than a sparse one.
  return page(caption, `
    <div style="padding:44px 52px;font-size:19px">
      <div style="color:#4ec9b0;font-size:30px;margin-bottom:6px">Stacks DevTools</div>
      <div style="color:#888;font-size:20px;margin-bottom:34px">${caption}</div>
      <div class="out" style="font-size:19px;line-height:1.9">${body}</div>
    </div>`)
}

/** The PNG's real pixel dimensions, straight out of the IHDR chunk. */
async function pngSize(file: string): Promise<[number, number]> {
  const head = new DataView(await Bun.file(file).slice(0, 33).arrayBuffer())
  return [head.getUint32(16), head.getUint32(20)]
}

const shots: Array<[string, string]> = [
  ['signals-tree', shot('Scope tree — every mounted scope, drill in to inspect one', renderTree(tree))],
  ['reactive-graph', shot('Reactive graph — signals and derived values, with set counts and subscribers', renderGraph(graph))],
  ['if-trace', shot('Decision trace — which branch of an :if chain rendered, and why', renderIfTrace(ifTrace))],
  ['store-panel', shot('Stores — registered stores and the state inside one', `${renderStores({ cart: true, auth: true, theme: true })}<h3>cart</h3>${renderScope(scope)}`)],
  ['query-timeline', shot('Query timeline — every useFetch / useQuery / useMutation, with status and timing', renderQueries(queries))],
]

const outDir = process.argv[2] || `${import.meta.dir}/../store-assets`
await Bun.$`mkdir -p ${outDir}`.quiet()

for (const [index, [name, html]] of shots.entries()) {
  const htmlPath = `${outDir}/.${name}.html`
  const pngPath = `${outDir}/${index + 1}-${name}.png`
  await Bun.write(htmlPath, html)
  await captureScreenshot(htmlPath, pngPath, { width: WIDTH, height: HEIGHT })
  await Bun.file(htmlPath).delete()

  // The WebView captures at the display's scale, so a 1280x800 viewport comes
  // out 2560x1600 on a Retina Mac. The store takes 1280x800 or 640x400 and
  // nothing else, so resample rather than hand over something it will reject.
  const [capturedWidth] = await pngSize(pngPath)
  if (capturedWidth !== WIDTH)
    await Bun.$`sips -z ${HEIGHT} ${WIDTH} ${pngPath}`.quiet()

  // Asserted, not assumed. A screenshot that is silently the wrong size looks
  // right in a viewer and is refused at submission -- the same trap the icon
  // test exists for.
  const [width, height] = await pngSize(pngPath)
  if (width !== WIDTH || height !== HEIGHT)
    throw new Error(`${pngPath} is ${width}x${height}, expected ${WIDTH}x${HEIGHT}`)

  // eslint-disable-next-line no-console
  console.log(`${pngPath}  ${width}x${height}  ${(Bun.file(pngPath).size / 1024).toFixed(0)}KB`)
}
