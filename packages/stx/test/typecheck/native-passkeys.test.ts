import { afterAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const dir = createTempDir('stx-native-passkey-types-')
afterAll(() => rm(dir, { recursive: true, force: true }))

test('native passkey types preserve base64url inputs and distinguish registration from assertion responses', async () => {
  const good = join(dir, 'passkeys.stx')
  const bad = join(dir, 'invalid.stx')
  const header = `import type { NativeCraft } from '@stacksjs/stx/native'
const craft = (globalThis as typeof globalThis & { craft: NativeCraft }).craft`
  await Bun.write(good, `<script client>
${header}
async function authenticate() {
  if (!craft.passkeys || !await craft.passkeys.isAvailable()) return
  const registration = await craft.passkeys.create({ challenge: '_-AA', user: { id: '_-BB', name: 'Member' } })
  const attestation: string = registration.response.attestationObject
  const assertion = await craft.passkeys.get({ challenge: '_-CC', rpId: 'example.test', allowCredentials: [{ id: registration.id }] })
  const signature: string = assertion.response.signature
  const userHandle: string | undefined = assertion.response.userHandle
  return { attestation, signature, userHandle }
}
</script>`)
  await Bun.write(bad, `<script client>
${header}
craft.passkeys?.create({ challenge: new Uint8Array(), user: { id: 'id', name: 'Member' } })
craft.passkeys?.create({ challenge: 'challenge', user: { id: 42, name: 'Member' } })
craft.passkeys?.get({ challenge: 'challenge', allowCredentials: [{ id: 42 }] })
</script>`)
  const result = await typecheckStxFiles([good, bad], { templates: false })
  expect(result.diagnostics.filter(d => d.file === good)).toEqual([])
  expect(result.diagnostics.filter(d => d.file === bad && d.code === 2322)).toHaveLength(3)
})
