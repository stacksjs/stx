import { describe, expect, it } from 'bun:test'

/**
 * #1874: Form declared initialValues / validateOnChange / validateOnBlur /
 * onSubmit / onError in FormProps and implemented none of them, so passing any
 * of them did nothing at all and the failure was silent.
 *
 * These assert the wiring exists in the component source. The neighbouring
 * form-validation.test.ts never loads Form.stx -- it reimplements a validate()
 * inside the test file -- which is exactly why the gap survived a green suite.
 */
const FORM = await Bun.file(new URL('../../src/ui/form/Form.stx', import.meta.url)).text()
const INDEX = await Bun.file(new URL('../../src/ui/form/index.ts', import.meta.url)).text()

describe('form: declared props are actually implemented (#1874)', () => {
  it('reads every prop it declares in the server block', () => {
    for (const prop of ['initialValues', 'validateOnChange', 'validateOnBlur'])
      expect(FORM).toContain(`$props.${prop}`)
  })

  it('bridges those props into the client scope', () => {
    for (const prop of ['initialValues', 'validateOnChange', 'validateOnBlur'])
      expect(FORM).toMatch(new RegExp(`const ${prop} = \\{\\{ ${prop} \\}\\}`))
  })

  it('delegates change and blur off the form element', () => {
    // Children arrive through <slot />, so per-input binding is impossible;
    // input/focusout bubble, blur does not.
    expect(FORM).toContain('@input="onFieldInput($event)"')
    expect(FORM).toContain('@focusout="onFieldBlur($event)"')
    expect(FORM).toContain('function onFieldInput')
    expect(FORM).toContain('function onFieldBlur')
  })

  it('gates per-field validation behind the two flags', () => {
    expect(FORM).toMatch(/if \(validateOnChange\)\s*validateOne/)
    expect(FORM).toMatch(/if \(validateOnBlur\)\s*validateOne/)
  })

  it('calls the custom FieldSchema.validate rule', () => {
    expect(INDEX).toContain('validate?: (value: any, values: Record<string, any>) => string | null | undefined')
    expect(FORM).toContain('typeof schema.validate === \'function\'')
    expect(FORM).toContain('schema.validate(value, allValues || {})')
  })

  it('seeds values from initialValues and restores them on reset', () => {
    expect(FORM).toContain('state({ ...initialValues })')
    expect(FORM).toMatch(/function reset\([\s\S]*?values\.set\(\{ \.\.\.initialValues \}\)/)
  })

  it('passes FormHelpers as the second argument of the submit event', () => {
    expect(FORM).toContain('emit(\'submit\', submitted, helpers)')
    expect(FORM).toContain('const helpers = { setErrors, setValues, resetForm }')
  })

  it('exposes every name FormHelpers promises', () => {
    // The type named setValues/resetForm while the component implemented
    // setErrors/reset and no setValues, so the documented shape destructured to
    // two undefined functions.
    const helpersBlock = INDEX.slice(INDEX.indexOf('interface FormHelpers'), INDEX.indexOf('interface FormProps'))
    for (const name of ['setErrors', 'setValues', 'resetForm']) {
      expect(helpersBlock).toContain(name)
      expect(FORM).toContain(`function ${name}`)
    }
  })

  it('still exposes the pre-existing names, so current call sites keep working', () => {
    for (const name of ['errors', 'isSubmitting', 'submitCount', 'setErrors', 'reset', 'validateForm'])
      expect(FORM).toMatch(new RegExp(`defineExpose\\(\\{[^}]*\\b${name}\\b`))
  })
})
