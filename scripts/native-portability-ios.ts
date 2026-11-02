import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { compileSharedScreenBundle } from '../packages/stx/src/native/compiler/bundle'

// STX owns these tests; the supplied Craft SDK only generates a temporary app.
// Neither checkout is modified, and the caller supplies an owned booted device.
const { values } = parseArgs({ options: {
  'craft-root': { type: 'string' },
  simulator: { type: 'string' },
  appearance: { type: 'string', default: 'dark' },
  suite: { type: 'string', default: 'overlays' },
} })
const suites: Record<string, { source: string, tests: string, count: number, unitTests?: string, unitCount?: number }> = {
  hud: { source: 'native-hud-device.stx', tests: 'NativeHudUITests', count: 1 },
  controls: { source: 'shared-controls-device.stx', tests: 'SharedControlsUITests', count: 2 },
  overlays: { source: 'shared-overlays-device.stx', tests: 'SharedPortabilityUITests', count: 4 },
  images: { source: 'shared-image-device.stx', tests: 'SharedImageUITests', count: 1, unitTests: 'SharedImageNativeTests', unitCount: 5 },
  videos: { source: 'shared-video-device.stx', tests: 'SharedVideoUITests', count: 1, unitTests: 'SharedVideoNativeTests', unitCount: 4 },
  toggles: { source: 'shared-toggle-device.stx', tests: 'SharedToggleUITests', count: 2, unitTests: 'SharedToggleNativeTests', unitCount: 3 },
}
if (!values['craft-root'] || !values.simulator || !['light', 'dark'].includes(values.appearance!) || !suites[values.suite!])
  throw new Error('Usage: bun scripts/native-portability-ios.ts --craft-root /path/to/craft --simulator OWNED_BOOTED_UUID [--appearance light|dark] [--suite overlays|controls|hud|images|videos|toggles]')
const suite = suites[values.suite!]

function run(command: string[], cwd?: string, capture = false, allowFailure = false): string {
  const result = Bun.spawnSync(command, { cwd, stdout: capture ? 'pipe' : 'inherit', stderr: 'inherit' })
  if (result.exitCode !== 0 && !allowFailure) throw new Error(`${command[0]} failed with exit ${result.exitCode}`)
  return capture ? result.stdout?.toString().trim() ?? '' : ''
}

const craft = resolve(values['craft-root'])
if (run(['git', 'status', '--porcelain'], craft, true))
  throw new Error('Use a clean Craft checkout for reproducible host validation')
const craftCommit = run(['git', 'rev-parse', 'HEAD'], craft, true)
const devices = JSON.parse(run(['xcrun', 'simctl', 'list', 'devices', 'booted', '--json'], undefined, true))
if (!Object.values(devices.devices as Record<string, Array<{ udid: string }>>).flat().some(device => device.udid === values.simulator))
  throw new Error('The specified owned simulator must already be booted')

const workspace = mkdtempSync(join(tmpdir(), 'stx-portability-ios-'))
console.log(`Evidence retained at ${workspace}`)
const root = resolve(import.meta.dir, '..')
const fixtures = join(root, 'packages/stx/test/native/fixtures')
const bundle = join(workspace, 'screen.js')
const compiled = await compileSharedScreenBundle(join(fixtures, suite.source), { root, outFile: bundle, minify: true })
// Meaningful unsupported styles remain diagnostics and are part of the receipt.
writeFileSync(join(workspace, 'compile.json'), JSON.stringify({ diagnostics: compiled.diagnostics, dependencies: compiled.dependencies }, null, 2))
const sdk = await import(pathToFileURL(join(craft, 'packages/ios/src/index.ts')).href)
const output = join(workspace, 'StxPortability')
await sdk.init({ name: 'StxPortability', bundleId: 'dev.stx.portability', output, runtimeDir: null, config: { renderer: 'native', appearance: 'system' } })
await sdk.build({ output, nativeBundlePath: bundle, generateProject: false, runtimeDir: null })
mkdirSync(join(output, 'UITests'))
copyFileSync(join(fixtures, `${suite.tests}.swift`), join(output, `UITests/${suite.tests}.swift`))
if (suite.unitTests) {
  mkdirSync(join(output, 'UnitTests'))
  copyFileSync(join(fixtures, `${suite.unitTests}.swift`), join(output, `UnitTests/${suite.unitTests}.swift`))
}
const projectFile = join(output, 'project.yml')
let project = readFileSync(projectFile, 'utf8')
const unitTarget = suite.unitTests ? `
  SharedPortabilityUnitTests:
    type: bundle.unit-test
    platform: iOS
    sources: [UnitTests]
    dependencies:
      - target: StxPortability
    settings:
      TEST_HOST: "$(BUILT_PRODUCTS_DIR)/StxPortability.app/StxPortability"
      BUNDLE_LOADER: "$(TEST_HOST)"
      GENERATE_INFOPLIST_FILE: YES
      PRODUCT_BUNDLE_IDENTIFIER: dev.stx.portability.tests
      SWIFT_VERSION: "5.0"
` : ''
const targets = `${unitTarget}
  SharedPortabilityUITests:
    type: bundle.ui-testing
    platform: iOS
    sources: [UITests]
    dependencies:
      - target: StxPortability
    settings:
      TEST_TARGET_NAME: StxPortability
      GENERATE_INFOPLIST_FILE: YES
      PRODUCT_BUNDLE_IDENTIFIER: dev.stx.portability.uitests
      SWIFT_VERSION: "5.0"
`
const marker = '\nschemes:\n'
const test = '    test:\n      config: Debug\n'
if (!project.includes(marker) || !project.includes(test)) throw new Error('Craft generated an unfamiliar Xcode scheme')
project = project.replace(marker, `${targets}${marker}`)
project = project.replace(test, `${test}      targets:\n        - SharedPortabilityUITests\n${suite.unitTests ? '        - SharedPortabilityUnitTests\n' : ''}`)
writeFileSync(projectFile, project)
if (craftCommit !== run(['git', 'rev-parse', 'HEAD'], craft, true) || run(['git', 'status', '--porcelain'], craft, true))
  throw new Error('Craft changed during generation; rerun with a stable checkout')
const hashes = Object.fromEntries([bundle, ...compiled.dependencies, join(fixtures, `${suite.tests}.swift`), ...(suite.unitTests ? [join(fixtures, `${suite.unitTests}.swift`)] : [])]
  .map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]))
writeFileSync(join(workspace, 'provenance.json'), JSON.stringify({ craftCommit, stxCommit: run(['git', 'rev-parse', 'HEAD'], root, true), stxWorkingTree: run(['git', 'status', '--porcelain'], root, true), hashes, appearance: values.appearance, simulator: values.simulator }, null, 2))
run(['xcodegen', 'generate'], output)
run(['xcrun', 'simctl', 'ui', values.simulator, 'appearance', values.appearance!])
const results = join(workspace, 'TestResults.xcresult')
run(['xcodebuild', '-project', 'StxPortability.xcodeproj', '-scheme', 'StxPortability',
  '-configuration', 'Debug', '-destination', `id=${values.simulator}`,
  '-derivedDataPath', join(workspace, 'DerivedData'), '-resultBundlePath', results,
  '-parallel-testing-enabled', 'NO', '-collect-test-diagnostics', 'never',
  '-test-timeouts-enabled', 'YES', '-default-test-execution-time-allowance', '300', '-maximum-test-execution-time-allowance', '300',
  'CODE_SIGN_IDENTITY=-', 'CODE_SIGNING_REQUIRED=NO', 'ENABLE_TESTABILITY=YES',
  'ONLY_ACTIVE_ARCH=YES', 'SWIFT_OPTIMIZATION_LEVEL=-Onone', 'test',
  `-only-testing:SharedPortabilityUITests/${suite.tests}`,
  ...(suite.unitTests ? [`-only-testing:SharedPortabilityUnitTests/${suite.unitTests}`] : [])], output, false, true)
const summary = JSON.parse(run(['xcrun', 'xcresulttool', 'get', 'test-results', 'summary', '--path', results], undefined, true))
writeFileSync(join(workspace, 'summary.json'), JSON.stringify(summary, null, 2))
const expectedCount = suite.count + (suite.unitCount ?? 0)
if (summary.result !== 'Passed' || summary.totalTestCount !== expectedCount || summary.passedTests !== expectedCount || summary.failedTests !== 0 || summary.skippedTests !== 0)
  throw new Error(`Expected ${expectedCount} passing ${values.suite} native tests: ${JSON.stringify(summary)}`)
console.log(`${expectedCount} ${values.suite} iOS native tests passed; evidence: ${workspace}`)
