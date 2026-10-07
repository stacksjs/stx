import { processDirectives } from '../packages/stx/src/process'
import { safeEvaluate } from '../packages/stx/src/safe-evaluator'
import { getRouterScript } from '../packages/router/src/client'

const strict = process.env.STX_PERF_STRICT === '1'
const multiplier = strict ? 1 : 4

const budgets = {
  simpleCompileMs: 8 * multiplier,
  productGridCompileMs: 40 * multiplier,
  expressionBatchMs: 45 * multiplier,
  // The shipped router script (debug logging stripped -- see getRouterScript).
  // It was 45.7KB when this cap was written, grew past it on real features
  // (CSS-flash handling, server data, build-skew reload), and the dev/prod
  // split plus call-site hoisting brought it back to ~49KB.
  //
  // Raised from 52KB to 58KB for v0.2.396. Measured first, as the old note
  // asked: 57025 bytes, 3777 over the 52KB cap. The growth is instant
  // navigation, added across 0.2.386 and 0.2.387 -- `instant` appears 25 times
  // in the shipped text and `prefetch` 20. It is NOT the offline work, which
  // reads as one mention here because it ships separately rather than inline.
  //
  // So this is a deliberate raise for features that were added on purpose, not
  // a cap moved to make a build pass. Worth saying plainly: v0.2.395 shipped
  // at 57025 bytes with this budget set to 52KB, which means the preflight was
  // not run for it. A budget quietly stepped over every release is not doing
  // anything, so 58KB is the number the script actually has to live under now.
  //
  // 2.3KB of slack, tighter than the 3KB this started with, because a raise
  // should leave less room than a fresh cap. If this trips again, measure
  // before raising it -- identifier mangling via Bun.build is still the next
  // real win (~25%), and at 55.7KB it is overdue rather than theoretical.
  routerScriptBytes: 58 * 1024,
}

async function measure<T>(fn: () => T | Promise<T>, iterations: number): Promise<number> {
  await fn()
  const start = performance.now()
  for (let i = 0; i < iterations; i++)
    await fn()
  return (performance.now() - start) / iterations
}

function assertBudget(label: string, value: number, budget: number, unit = 'ms'): void {
  if (value <= budget)
    return

  throw new Error(`${label} exceeded budget: ${value.toFixed(2)}${unit} > ${budget}${unit}`)
}

const simpleTemplate = '<h1>{{ title }}</h1><p>{{ description }}</p>'
const products = Array.from({ length: 75 }, (_, i) => ({
  name: `Product ${i}`,
  price: i + 10,
  featured: i % 3 === 0,
}))
const gridTemplate = `
<section>
  @foreach(products as product)
    <article class="{{ product.featured ? 'featured' : 'standard' }}">
      <h2>{{ product.name }}</h2>
      <p>{{ product.price }}</p>
    </article>
  @endforeach
</section>`

const simpleCompileMs = await measure(
  () => processDirectives(simpleTemplate, { title: 'Lumen', description: 'Fast templates' }, '/tmp/simple.stx', { debug: false }, new Set()),
  60,
)

const productGridCompileMs = await measure(
  () => processDirectives(gridTemplate, { products }, '/tmp/grid.stx', { debug: false }, new Set()),
  25,
)

const expressionBatchMs = await measure(() => {
  for (let i = 0; i < 1000; i++)
    safeEvaluate('price * qty + tax', { price: 28, qty: 3, tax: 4 })
}, 25)

const routerScriptBytes = new TextEncoder().encode(getRouterScript()).byteLength

assertBudget('simple template compile', simpleCompileMs, budgets.simpleCompileMs)
assertBudget('product grid compile', productGridCompileMs, budgets.productGridCompileMs)
assertBudget('1000 expression evaluations', expressionBatchMs, budgets.expressionBatchMs)
assertBudget('router script size', routerScriptBytes, budgets.routerScriptBytes, ' bytes')

console.log(JSON.stringify({
  simpleCompileMs,
  productGridCompileMs,
  expressionBatchMs,
  routerScriptBytes,
  budgets,
}, null, 2))
