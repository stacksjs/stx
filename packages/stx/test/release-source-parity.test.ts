import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeAll, expect, test } from 'bun:test'

interface Step {
  name?: string
  run?: string
  if?: string
  'working-directory'?: string
  'continue-on-error'?: boolean | string
}
interface Job {
  steps: Step[]
  needs?: string | string[]
  if?: string
  'continue-on-error'?: boolean | string
}
interface Workflow { jobs: Record<string, Job> }
interface Call { args: string[], cwd: string }

const root = resolve(import.meta.dir, '../../..')
const workflow = async (name: string) => Bun.YAML.parse(await readFile(join(root, '.github/workflows', name), 'utf8')) as Workflow
let ci: Workflow
let release: Workflow
let preflight: Call[]

async function observePreflight(fail = '') {
  const fixture = await realpath(await mkdtemp(join(tmpdir(), 'stx-release-preflight-')))
  let child: Bun.Subprocess<'ignore', 'pipe', 'pipe'> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopError: unknown
  let timedOut = false
  function stop() {
    if (!child) return
    try {
      if (process.platform === 'win32') child.kill('SIGKILL')
      else process.kill(-child.pid, 'SIGKILL')
    }
    catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) stopError = error
    }
  }
  try {
    await mkdir(join(fixture, 'bin'))
    const calls = join(fixture, 'calls')
    const recorder = join(fixture, 'bin/bun')
    // Only the external bare Bun command is authored. Execute the real public
    // preflight entry, without copying its source or performing a build/install.
    await writeFile(recorder, `#!${process.execPath}\nimport { appendFileSync } from 'node:fs'\nconst args = process.argv.slice(2)\nappendFileSync(process.env.CALLS, JSON.stringify({ args, cwd: process.cwd() }) + '\\n')\nprocess.exit(args.join(' ') === process.env.FAIL_COMMAND ? 42 : 0)\n`)
    await chmod(recorder, 0o755)
    child = Bun.spawn([process.execPath, '--no-env-file', join(root, 'scripts/release-preflight.ts')], {
      cwd: fixture,
      env: { PATH: join(fixture, 'bin'), CALLS: calls, FAIL_COMMAND: fail },
      stdin: 'ignore', stdout: 'pipe', stderr: 'pipe', detached: process.platform !== 'win32',
    })
    timer = setTimeout(() => { timedOut = true; stop() }, 3000)
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    if (stopError) throw stopError
    expect(timedOut, stdout + stderr).toBe(false)
    const rows = (await readFile(calls, 'utf8')).trim().split('\n').map(line => JSON.parse(line) as Call)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(row => row.cwd === fixture)).toBe(true)
    return { code, rows, stdout, stderr }
  }
  finally {
    if (timer !== undefined) clearTimeout(timer)
    stop()
    if (child) await child.exited
    if (stopError) throw stopError
    await rm(fixture, { recursive: true, force: true })
  }
}

function requiredCheck(name: string, candidate = release): string | undefined {
  const expected = ci.jobs.test!.steps.find(step => step.name === name)
  if (!expected?.run) throw new Error(`MainCI no longer declares ${name}`)
  const steps = candidate.jobs.gate!.steps
  const index = steps.findIndex(step => step.run === expected.run)
  if (index === -1) return `missing ${name}`
  const actual = steps[index]!
  if (resolve(root, actual['working-directory'] ?? '.') !== resolve(root, expected['working-directory'] ?? '.')) return `wrong working directory for ${name}`
  const unit = ci.jobs.test!.steps.find(step => step.name === 'Unit Test')
  const unitIndex = steps.findIndex(step => step.run === unit?.run)
  if (!unit?.run || unitIndex < 0 || unitIndex >= index) return `${name} must follow the full source tests`
  if (name === 'Integration Tests') {
    const coverage = ci.jobs.test!.steps.find(step => step.name === 'Component Tests with Coverage')
    const coverageIndex = steps.findIndex(step => step.run === coverage?.run)
    if (!coverage?.run || coverageIndex < 0 || coverageIndex >= index) return 'Integration Tests must follow component coverage'
  }
  if (actual.if !== undefined || (actual['continue-on-error'] !== undefined && actual['continue-on-error'] !== false)) return `${name} must fail the gate`
  return undefined
}

function publicationProblem(candidate = release): string | undefined {
  const npm = candidate.jobs.npm!
  const needs = typeof npm.needs === 'string' ? [npm.needs] : npm.needs ?? []
  if (!needs.includes('gate') || !needs.includes('native-signing')) return 'publication must require source and native-signing gates'
  if (npm.if !== undefined || candidate.jobs.gate!.if !== undefined) return 'publication must use default success admission'
  const tolerated = candidate.jobs.gate!['continue-on-error']
  if (tolerated !== undefined && tolerated !== false) return 'source gate failures must not be tolerated'
  const icons = candidate.jobs.icons!
  if (!(typeof icons.needs === 'string' ? [icons.needs] : icons.needs ?? []).includes('npm')) return 'icons must follow npm'
  if (icons.if !== undefined || (icons['continue-on-error'] !== undefined && icons['continue-on-error'] !== false)) return 'icons must remain required'
  return undefined
}

beforeAll(async () => {
  const inputs = await Promise.all([workflow('ci.yml'), workflow('release.yml')])
  ci = inputs[0]
  release = inputs[1]
  const observed = await observePreflight()
  expect(observed.code, observed.stdout + observed.stderr).toBe(0)
  preflight = observed.rows
})

test('the actual public preflight already covers MainCI build and installed-package smoke', () => {
  expect(release.jobs.gate!.steps.some(step => step.run === 'bun run preflight:release')).toBe(true)
  for (const name of ['Build', 'Verify an installed consumer of the actual package archives']) {
    const step = ci.jobs.test!.steps.find(step => step.name === name)
    expect(step?.run).toBeDefined()
    expect(preflight.some(call => `bun ${call.args.join(' ')}` === step!.run)).toBe(true)
  }
})

for (const name of ['Component Tests with Coverage', 'Integration Tests']) {
  test(`the release source gate runs MainCI ${name} with its actual cwd after the full suite`, () => {
    expect(requiredCheck(name)).toBeUndefined()
  })
}

test('publication remains behind the successful source and signing gates, with icons afterward', () => {
  expect(publicationProblem()).toBeUndefined()
})

test('the real preflight propagates a failed installed smoke without running later commands', async () => {
  const observed = await observePreflight('run smoke:install')
  expect(observed.code).toBe(42)
  expect(observed.rows.at(-1)?.args).toEqual(['run', 'smoke:install'])
  expect(observed.rows.map(row => row.args.join(' '))).not.toContain('run bench:budgets')
})

const step = (candidate: Workflow, name: string) => {
  const found = candidate.jobs.gate!.steps.find(item => item.name === name)
  if (!found) throw new Error(`The actual release gate has no ${name}`)
  return found
}

test('the parity guard rejects coverage in the wrong package directory', () => {
  const candidate = structuredClone(release)
  step(candidate, 'Component Tests with Coverage')['working-directory'] = './packages/stx'
  expect(requiredCheck('Component Tests with Coverage', candidate)).toBe('wrong working directory for Component Tests with Coverage')
})

test('the parity guard rejects a missing full source suite before the component checks', () => {
  const candidate = structuredClone(release)
  const unit = ci.jobs.test!.steps.find(item => item.name === 'Unit Test')!
  candidate.jobs.gate!.steps = candidate.jobs.gate!.steps.filter(item => item.run !== unit.run)
  expect(requiredCheck('Component Tests with Coverage', candidate)).toBe('Component Tests with Coverage must follow the full source tests')
})

test('the parity guard rejects integration running before coverage', () => {
  const candidate = structuredClone(release)
  const steps = candidate.jobs.gate!.steps
  const integration = step(candidate, 'Integration Tests')
  steps.splice(steps.indexOf(integration), 1)
  steps.splice(steps.indexOf(step(candidate, 'Component Tests with Coverage')), 0, integration)
  expect(requiredCheck('Integration Tests', candidate)).toBe('Integration Tests must follow component coverage')
})

test('the parity guard rejects coverage whose failure is tolerated', () => {
  const candidate = structuredClone(release)
  step(candidate, 'Component Tests with Coverage')['continue-on-error'] = true
  expect(requiredCheck('Component Tests with Coverage', candidate)).toBe('Component Tests with Coverage must fail the gate')
})

test('the parity guard rejects conditional integration checks', () => {
  const candidate = structuredClone(release)
  step(candidate, 'Integration Tests').if = 'false'
  expect(requiredCheck('Integration Tests', candidate)).toBe('Integration Tests must fail the gate')
})

test('the publication guard rejects npm without the source gate dependency', () => {
  const candidate = structuredClone(release)
  candidate.jobs.npm!.needs = ['native-signing']
  expect(publicationProblem(candidate)).toBe('publication must require source and native-signing gates')
})

test('the publication guard rejects admission after a failed gate', () => {
  const candidate = structuredClone(release)
  candidate.jobs.npm!.if = 'always()'
  expect(publicationProblem(candidate)).toBe('publication must use default success admission')
})

test('the publication guard rejects a tolerated source gate failure', () => {
  const candidate = structuredClone(release)
  candidate.jobs.gate!['continue-on-error'] = true
  expect(publicationProblem(candidate)).toBe('source gate failures must not be tolerated')
})

test('the publication guard rejects conditional icon publication', () => {
  const candidate = structuredClone(release)
  candidate.jobs.icons!.if = 'failure()'
  expect(publicationProblem(candidate)).toBe('icons must remain required')
})
