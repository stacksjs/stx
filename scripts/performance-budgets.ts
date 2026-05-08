import { processDirectives } from '../packages/stx/src/process'
import { safeEvaluate } from '../packages/stx/src/safe-evaluator'
import { getRouterScript } from '../packages/router/src/client'

const strict = process.env.STX_PERF_STRICT === '1'
const multiplier = strict ? 1 : 4

const budgets = {
  simpleCompileMs: 8 * multiplier,
  productGridCompileMs: 40 * multiplier,
  expressionBatchMs: 45 * multiplier,
  routerScriptBytes: 48 * 1024,
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
