/**
 * A TypeScript file of any length, for the editor example and its tests.
 *
 * Generated rather than checked in: two thousand lines of fixture is two
 * thousand lines nobody reads, and what the example needs from it is variety -
 * block comments, template strings, generics, long and short lines - so that
 * highlighting is doing real work on every screenful.
 */

const MODELS = ['User', 'Order', 'Product', 'Invoice', 'Team', 'Subscription', 'Payment', 'Review']
const FIELDS = ['id', 'name', 'email', 'status', 'total', 'createdAt', 'updatedAt', 'ownerId']

function block(index: number): string[] {
  const model = MODELS[index % MODELS.length]!
  const field = FIELDS[index % FIELDS.length]!
  const lower = model.toLowerCase()

  return [
    `/**`,
    ` * Load ${lower} number ${index} with what a page needs to draw it.`,
    ` */`,
    `export async function load${model}${index}(id: number): Promise<${model} | null> {`,
    `  const ${lower} = await ${model}.where('${field}', id).with(['owner', 'items']).first()`,
    `  if (!${lower}) {`,
    `    log.warn(\`${lower} \${id} was not found\`)`,
    `    return null`,
    `  }`,
    ``,
    `  // Totals are kept in minor units, so ${100 + index} is ${(100 + index) / 100} in the currency.`,
    `  const total = ${lower}.items.reduce((sum: number, item: LineItem) => sum + item.price * item.quantity, ${index})`,
    `  const label = total > ${1000 + index * 3} ? 'large' : "small"`,
    ``,
    `  return { ...${lower}, total, label, checkedAt: new Date(${1700000000000 + index}) }`,
    `}`,
    ``,
    `interface ${model}Summary${index}<T extends object = Record<string, unknown>> {`,
    `  ${field}: T[keyof T] | undefined`,
    `  /* the count is cached for ${index % 60} minutes */ count: number`,
    `}`,
    ``,
  ]
}

/** `lines` lines of plausible TypeScript. The same input gives the same text. */
export function sampleTypeScript(lines: number): string {
  const out: string[] = [
    `import type { LineItem } from './types'`,
    `import { log } from '@stacksjs/logging'`,
    ``,
  ]

  for (let index = 1; out.length < lines; index++)
    out.push(...block(index))

  return out.slice(0, lines).join('\n')
}
