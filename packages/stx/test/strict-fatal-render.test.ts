import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { processDirectives } from '../src/process'
import { validateClientScript } from '../src/script-validation'
import { StxValidationError } from '../src/errors/types'
import { createTempDir } from '../src/temp-dir'

const dir = createTempDir('stx-strict-fatal-')
const violation = '<script>document.getElementById("strict-probe")</script>'
const strict = { enabled: true, failOnViolation: true }
const options = {
  strict,
  root: dir,
  layoutsDir: path.join(dir, 'layouts'),
  componentsDir: path.join(dir, 'components'),
  partialsDir: path.join(dir, 'partials'),
}

beforeAll(async () => {
  await Bun.write(path.join(dir, 'layouts/app.stx'), '<html><body>@yield("content")</body></html>')
  await Bun.write(path.join(dir, 'components/Broken.stx'), `<section>${violation}</section>`)
  await Bun.write(path.join(dir, 'partials/broken.stx'), violation)
})

afterAll(async () => { await rm(dir, { recursive: true, force: true }) })

describe('fatal strict validation (#2097)', () => {
  it('logs the first violation and throws the fatal type on cold and memoized calls', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (let i = 0; i < 2; i++)
        expect(() => validateClientScript('document.getElementById("memo")', path.join(dir, 'memo.stx'), strict)).toThrow(StxValidationError)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(String(warn.mock.calls[0][0])).toContain('document.getElementById')
    }
    finally {
      warn.mockRestore()
    }
  })

  for (const [name, source] of Object.entries({
    plain: violation,
    layout: `@extends('layouts/app')\n@section('content')${violation}@endsection`,
    component: '<Broken />',
    include: '@include("broken")',
  })) {
    it(`rejects instead of returning error text through ${name}`, async () => {
      const warn = spyOn(console, 'warn').mockImplementation(() => {})
      try {
        await expect(processDirectives(source, {}, path.join(dir, `${name}.stx`), options, new Set())).rejects.toBeInstanceOf(StxValidationError)
      }
      finally {
        warn.mockRestore()
      }
    })
  }
})
