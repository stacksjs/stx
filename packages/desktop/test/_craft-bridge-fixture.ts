import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CANDIDATE_PATHS = [
  process.env.CRAFT_BRIDGE_PATH,
  join(__dirname, '../../../../craft/packages/zig/src/js/craft-bridge.js'),
  join(__dirname, '../node_modules/craft/packages/zig/src/js/craft-bridge.js'),
  join(__dirname, '../node_modules/@craft-native/craft/packages/zig/src/js/craft-bridge.js'),
].filter((path): path is string => Boolean(path))

export function installCraftBridgeFixture(): boolean {
  const bridgePath = CANDIDATE_PATHS.find((path) => existsSync(path))
  if (!bridgePath) {
    console.warn(`Skipping Craft bridge fixture tests: fixture not found. Set CRAFT_BRIDGE_PATH or check out Craft next to STX. Tried: ${CANDIDATE_PATHS.join(', ')}`)
    return false
  }

  if ((window as any).craft?.__craft_bridge_loaded) {
    delete (window as any).craft.__craft_bridge_loaded
  }

  const code = readFileSync(bridgePath, 'utf8')
  ;(0, eval)(code)
  return true
}
