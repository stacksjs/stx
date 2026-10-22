/**
 * A web view as a Stacks app writes one, unchanged, on a native screen: it
 * extends a layout with a site nav, a header and a footer, keeps a count in a
 * store that saves it to localStorage, names itself with useHead, and links
 * on with `<a href>`, `<StxLink>` and `navigate()` (fixtures/web-view).
 */
import { expect, test } from 'bun:test'
import path from 'node:path'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

const root = path.join(import.meta.dir, 'fixtures/web-view')

test('the fixture web view compiles and runs as a native screen', async () => {
  const result = await compileNativeBundle({ root, screens: { Home: 'views/home.stx' } })
  expect(result.chrome?.Home).toEqual({
    tabs: [{ path: '/', title: 'Home', symbol: 'house' }, { path: '/settings', title: 'Settings', symbol: 'gearshape' }],
    bar: [{ path: '/account', title: 'Account', symbol: 'person.crop.circle' }],
  })

  const phone = mountNativeScreen(result.code, 'Home', { routeURL: '/', storage: { 'stx.localStorage:counter.count': '4' } })
  await phone.settle()
  // The content alone: the nav, header and footer are the app's chrome.
  expect(phone.texts()).toEqual(expect.arrayContaining(['Count 4', 'Add one', 'Profile', 'About']))
  expect(phone.texts()).not.toContain('Footer links')
  expect(phone.texts()).not.toContain('Home')
  // useHead's title and the layout's bar link.
  expect(phone.bars.filter(bar => 'title' in bar).map(bar => bar.title)).toEqual(['Home'])
  expect(phone.barButtons()).toEqual(['layout:/account'])

  phone.press(phone.byTestID('increment')!)
  await phone.settle()
  expect(phone.texts()).toContain('Count 5')
  expect(phone.stored['stx.localStorage:counter.count']).toBe('5')

  phone.press(phone.find(node => node.props.href === '/settings/profile')!)
  phone.press(phone.find(node => node.props.href === '/about')!)
  phone.press(phone.byTestID('go')!)
  phone.tapBar('layout:/account')
  await phone.settle()
  expect(phone.opened).toEqual(['/settings/profile', '/about', '/settings', '/account'])
  expect(phone.mutationErrors).toEqual([])
})
