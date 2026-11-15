export const methodScopeSource = `<script>
const { value } = withDefaults(defineProps<{ value?: string }>(), { value: 'initial' })
const count = state(0)
function label(input: string): string {
  if (input === 'throw') throw new Error('expected label failure')
  return input + ':' + count()
}
function read(): string { return this.label(value) }
function increment(): string { count.update(current => current + 1); return this.read() }
async function readLater(): Promise<string> { await Promise.resolve(); return this.read() }
function recurse(depth: number): string { return depth ? this.recurse(depth - 1) : value }
function overflow(): number { return 1 + this.overflow() }
</script><template><p>{{ this.label(value) }}</p></template>`

interface Probe extends HTMLElement {
  value: string
  read(): string
  increment(): string
  readLater(): Promise<string>
  overflow(): number
  recurse(depth: number): string
  updateComplete: Promise<void>
  render(helpers: { escape(value: unknown): string }): string
}

export async function exerciseMethodScope(tag: string): Promise<unknown[]> {
  const first = document.createElement(tag) as Probe
  const second = document.createElement(tag) as Probe
  const values: unknown[] = []
  try {
    // A method may be called before the element's first connection/render.
    values.push(first.read())
    second.value = 'second'
    document.body.append(first, second)
    values.push(first.textContent, second.textContent)
    first.value = 'pending'
    values.push(first.read(), first.increment())
    await first.updateComplete
    values.push(first.textContent, second.read(), second.textContent)
    first.value = 'manual'
    values.push(first.render({ escape: value => String(value) }))
    values.push(first.read())
    await first.updateComplete
    values.push(first.textContent)
    first.value = 'async'
    values.push(await first.readLater())
    await first.updateComplete
    values.push(first.textContent)
    first.value = 'throw'
    try { first.read() }
    catch (error) { values.push((error as Error).message) }
    first.value = 'recovered'
    values.push(first.read())
    await first.updateComplete
    values.push(first.textContent, first.recurse(4))
    // Actual user recursion still runs and throws, without a compiler guard
    // swallowing it or substituting a stale scope result.
    try { first.overflow() }
    catch (error) { values.push((error as Error).name) }
    values.push(first.read(), second.read())
    return values
  }
  finally { first.remove(); second.remove() }
}

export const methodScopeExpected = ['initial:0', 'initial:0', 'second:0', 'pending:0', 'pending:1', 'pending:1', 'second:0', 'second:0', '<p>manual:1</p>', 'manual:1', 'manual:1', 'async:1', 'async:1', 'expected label failure', 'recovered:1', 'recovered:1', 'recovered', 'RangeError', 'recovered:1', 'second:0']

