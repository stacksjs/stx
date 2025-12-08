import { describe, expect, it } from 'bun:test'
import {
  assertProp,
  createPropValidator,
  PropTypes,
  validateProps,
  warnProp,
} from '../../src/utils/prop-validation'

describe('PropTypes Validators', () => {
  describe('Primitive Types', () => {
    it('should validate string type', () => {
      expect(PropTypes.string.validate('hello', 'prop', 'Component')).toBe(true)
      expect(PropTypes.string.validate(123, 'prop', 'Component')).toBe(false)
    })

    it('should validate number type', () => {
      expect(PropTypes.number.validate(123, 'prop', 'Component')).toBe(true)
      expect(PropTypes.number.validate('123', 'prop', 'Component')).toBe(false)
      expect(PropTypes.number.validate(Number.NaN, 'prop', 'Component')).toBe(false)
    })

    it('should validate boolean type', () => {
      expect(PropTypes.boolean.validate(true, 'prop', 'Component')).toBe(true)
      expect(PropTypes.boolean.validate(false, 'prop', 'Component')).toBe(true)
      expect(PropTypes.boolean.validate(1, 'prop', 'Component')).toBe(false)
    })

    it('should validate function type', () => {
      expect(PropTypes.func.validate(() => {}, 'prop', 'Component')).toBe(true)
      expect(PropTypes.func.validate('not a function', 'prop', 'Component')).toBe(false)
    })

    it('should validate object type', () => {
      expect(PropTypes.object.validate({}, 'prop', 'Component')).toBe(true)
      expect(PropTypes.object.validate([], 'prop', 'Component')).toBe(false)
      expect(PropTypes.object.validate(null, 'prop', 'Component')).toBe(false)
    })

    it('should validate array type', () => {
      expect(PropTypes.array.validate([], 'prop', 'Component')).toBe(true)
      expect(PropTypes.array.validate({}, 'prop', 'Component')).toBe(false)
    })
  })

  describe('Enum Validators', () => {
    it('should validate oneOf with valid values', () => {
      const validator = PropTypes.oneOf(['primary', 'secondary'])
      expect(validator.validate('primary', 'prop', 'Component')).toBe(true)
      expect(validator.validate('invalid', 'prop', 'Component')).toBe(false)
    })

    it('should validate oneOfType with multiple validators', () => {
      const validator = PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      expect(validator.validate('hello', 'prop', 'Component')).toBe(true)
      expect(validator.validate(123, 'prop', 'Component')).toBe(true)
      expect(validator.validate(true, 'prop', 'Component')).toBe(false)
    })
  })

  describe('Array Validators', () => {
    it('should validate arrayOf with correct types', () => {
      const validator = PropTypes.arrayOf(PropTypes.string)
      expect(validator.validate(['a', 'b'], 'prop', 'Component')).toBe(true)
      expect(validator.validate(['a', 123], 'prop', 'Component')).toBe(false)
      expect(validator.validate('not an array', 'prop', 'Component')).toBe(false)
    })
  })

  describe('Object Validators', () => {
    it('should validate shape with correct structure', () => {
      const validator = PropTypes.shape({
        name: PropTypes.string.required,
        age: PropTypes.number,
      })

      expect(validator.validate({ name: 'John', age: 30 }, 'prop', 'Component')).toBe(true)
      expect(validator.validate({ name: 'John' }, 'prop', 'Component')).toBe(true)
      expect(validator.validate({ age: 30 }, 'prop', 'Component')).toBe(false) // missing required
      expect(validator.validate({ name: 'John', age: 'thirty' }, 'prop', 'Component')).toBe(false)
    })
  })

  describe('Number Validators', () => {
    it('should validate min value', () => {
      const validator = PropTypes.min(10)
      expect(validator.validate(15, 'prop', 'Component')).toBe(true)
      expect(validator.validate(10, 'prop', 'Component')).toBe(true)
      expect(validator.validate(5, 'prop', 'Component')).toBe(false)
    })

    it('should validate max value', () => {
      const validator = PropTypes.max(100)
      expect(validator.validate(50, 'prop', 'Component')).toBe(true)
      expect(validator.validate(100, 'prop', 'Component')).toBe(true)
      expect(validator.validate(150, 'prop', 'Component')).toBe(false)
    })

    it('should validate range', () => {
      const validator = PropTypes.range(0, 100)
      expect(validator.validate(50, 'prop', 'Component')).toBe(true)
      expect(validator.validate(0, 'prop', 'Component')).toBe(true)
      expect(validator.validate(100, 'prop', 'Component')).toBe(true)
      expect(validator.validate(-10, 'prop', 'Component')).toBe(false)
      expect(validator.validate(150, 'prop', 'Component')).toBe(false)
    })
  })

  describe('String Validators', () => {
    it('should validate pattern', () => {
      const validator = PropTypes.pattern(/^[A-Z]{3}$/)
      expect(validator.validate('ABC', 'prop', 'Component')).toBe(true)
      expect(validator.validate('abc', 'prop', 'Component')).toBe(false)
      expect(validator.validate('ABCD', 'prop', 'Component')).toBe(false)
    })

    it('should validate email', () => {
      expect(PropTypes.email.validate('test@example.com', 'prop', 'Component')).toBe(true)
      expect(PropTypes.email.validate('invalid-email', 'prop', 'Component')).toBe(false)
    })

    it('should validate URL', () => {
      expect(PropTypes.url.validate('https://example.com', 'prop', 'Component')).toBe(true)
      expect(PropTypes.url.validate('not a url', 'prop', 'Component')).toBe(false)
    })
  })

  describe('Required Props', () => {
    it('should mark validator as required', () => {
      const validator = PropTypes.string.required
      expect(validator.isRequired).toBe(true)
    })
  })

  describe('Custom Validators', () => {
    it('should validate with custom function', () => {
      const validator = PropTypes.custom(
        value => value > 0 && value < 100,
        'Value must be between 0 and 100',
      )
      expect(validator.validate(50, 'prop', 'Component')).toBe(true)
      expect(validator.validate(150, 'prop', 'Component')).toBe(false)
    })
  })
})

describe('validateProps', () => {
  it('should validate all props successfully', () => {
    const schema = {
      name: PropTypes.string,
      age: PropTypes.number,
    }
    const props = { name: 'John', age: 30 }
    const result = validateProps('TestComponent', props, schema, { logWarnings: false })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for invalid props', () => {
    const schema = {
      name: PropTypes.string.required,
      age: PropTypes.number,
    }
    const props = { age: 'thirty' }
    const result = validateProps('TestComponent', props, schema, { logWarnings: false })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should detect missing required props', () => {
    const schema = {
      name: PropTypes.string.required,
    }
    const props = {}
    const result = validateProps('TestComponent', props, schema, { logWarnings: false })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Required prop')
  })
})

describe('createPropValidator', () => {
  it('should create a reusable validator function', () => {
    const validateButton = createPropValidator('Button', {
      variant: PropTypes.oneOf(['primary', 'secondary']),
      disabled: PropTypes.boolean,
    }, { logWarnings: false })

    const result1 = validateButton({ variant: 'primary', disabled: false })
    expect(result1.valid).toBe(true)

    const result2 = validateButton({ variant: 'invalid' })
    expect(result2.valid).toBe(false)
  })
})

describe('assertProp', () => {
  it('should not throw for valid values', () => {
    expect(() => {
      assertProp('hello', PropTypes.string, 'testProp')
    }).not.toThrow()
  })

  it('should throw for invalid values', () => {
    expect(() => {
      assertProp(123, PropTypes.string, 'testProp')
    }).toThrow()
  })
})

describe('warnProp', () => {
  it('should not throw for invalid values', () => {
    expect(() => {
      warnProp(123, PropTypes.string, 'testProp')
    }).not.toThrow()
  })
})
