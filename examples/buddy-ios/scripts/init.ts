/**
 * Initialize Buddy iOS using Craft's iOS tooling
 */

import { init } from '/Users/chrisbreuer/Code/craft/packages/ios/dist/index.js'

await init({
  name: 'Buddy',
  bundleId: 'com.stacksjs.buddy',
  output: process.cwd(),
})

console.log('')
console.log('Now run: bun run build')
