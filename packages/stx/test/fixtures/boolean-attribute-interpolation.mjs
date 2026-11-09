import { escapeInterpolatedHtmlValue } from '../../src/expressions.ts'

const source = '<input {{ attributes }}>'
const offset = source.indexOf('{{')
const interpolationLength = '{{ attributes }}'.length
const accepted = ['', 'disabled', 'selected checked', '  required\treadonly  ', 'hidden\nmultiple', 'aria-hidden data-test :bound _private', 'disabled\u00A0checked', 'disabled\uFEFFchecked']
for (const value of accepted) {
  const output = escapeInterpolatedHtmlValue(source, offset, value, false, interpolationLength)
  if (output !== value.trim())
    throw new Error(`Boolean attribute list changed: ${JSON.stringify(value)}`)
}

const rejected = ['on', 'onclick', 'disabled onclick', 'id=x', 'disabled name="x"', 'disabled \'checked\'', '><script>alert(1)</script>', 'checked/hidden', 'disabled\x00checked', 'disabled\u200Bchecked']
for (const value of rejected) {
  let refused = false
  try {
    escapeInterpolatedHtmlValue(source, offset, value, false, interpolationLength)
  }
  catch (error) {
    if (!String(error).includes('Unsafe interpolation in tag structure'))
      throw error
    refused = true
  }
  if (!refused)
    throw new Error(`Unsafe attribute list accepted: ${JSON.stringify(value)}`)
}

let refusedAssignment = false
try {
  escapeInterpolatedHtmlValue('<input {{ attributes }}="x">', offset, 'disabled', false, interpolationLength)
}
catch (error) {
  if (!String(error).includes('Unsafe interpolation in tag structure'))
    throw error
  refusedAssignment = true
}
if (!refusedAssignment)
  throw new Error('Dynamic attribute assignment accepted')

console.log(`OK ${accepted.length} boolean attribute lists, ${rejected.length} refused lists and a refused assignment`)
