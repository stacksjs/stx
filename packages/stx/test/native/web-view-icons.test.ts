/**
 * An icon whose name a binding picks (`<i :class="sport.icon">`, a sport's,
 * a state's) is an Icon too, as `<i class="i-lucide-sun">` is: its symbol
 * follows the class the binding gives it.
 */
import { expect, test } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { mountWebView, webApp } from './web-view-app'

test('an <i> whose class is bound is an Icon', async () => {
  const { root } = await translateHtmlToIR('<div><i class="h-4 w-4" :class="icon"></i><i x-class="other"></i></div>')
  const [bound, other] = root.children as any[]
  expect(bound.type).toBe('Icon')
  expect(other.type).toBe('Icon')
})

test('its symbol follows the bound class', async () => {
  const root = webApp({
    'views/sport.stx': `<script client>
  const sport = state('run')
  const icon = derived(() => sport() === 'run' ? 'i-lucide-footprints' : 'i-lucide-bike')
</script>
<div>
  <i testid="sport-icon" class="h-6 w-6" :class="icon"></i>
  <button testid="ride" @click="sport.set('ride')">Ride</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Sport: 'views/sport.stx' }, 'Sport')
  const icon = () => phone.byTestID('sport-icon')!
  expect(icon().type).toBe('Icon')
  const run = icon().props.symbol
  expect(run).toBeTruthy()
  phone.press(phone.byTestID('ride')!)
  await phone.settle()
  expect(icon().props.symbol).toBeTruthy()
  expect(icon().props.symbol).not.toBe(run)
})
