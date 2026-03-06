import type { AsyncValidatorFn, ValidatorFn, ValidatorRule } from './types'

export class Validator {
  private rules: ValidatorRule[]
  private _defaultValue: unknown

  constructor(rules: ValidatorRule[] = [], defaultValue: unknown = undefined) {
    this.rules = rules
    this._defaultValue = defaultValue
  }

  private addRule(rule: ValidatorRule): Validator {
    return new Validator([...this.rules, rule], this._defaultValue)
  }

  required(message = 'This field is required'): Validator {
    return this.addRule({
      name: 'required',
      message,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '')
          return message
        if (typeof value === 'string' && value.trim() === '')
          return message
        return true
      },
    })
  }

  email(message = 'Invalid email address'): Validator {
    return this.addRule({
      name: 'email',
      message,
      validate: (value: unknown) => {
        if (!value)
          return true // not required by default
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return pattern.test(String(value)) ? true : message
      },
    })
  }

  url(message = 'Invalid URL'): Validator {
    return this.addRule({
      name: 'url',
      message,
      validate: (value: unknown) => {
        if (!value)
          return true
        try {
          new URL(String(value))
          return true
        }
        catch {
          return message
        }
      },
    })
  }

  min(n: number, message?: string): Validator {
    const msg = message ?? `Must be at least ${n} characters`
    return this.addRule({
      name: 'min',
      message: msg,
      validate: (value: unknown) => {
        if (!value)
          return true
        return String(value).length >= n ? true : msg
      },
    })
  }

  max(n: number, message?: string): Validator {
    const msg = message ?? `Must be at most ${n} characters`
    return this.addRule({
      name: 'max',
      message: msg,
      validate: (value: unknown) => {
        if (!value)
          return true
        return String(value).length <= n ? true : msg
      },
    })
  }

  length(min: number, max: number, message?: string): Validator {
    const msg = message ?? `Must be between ${min} and ${max} characters`
    return this.addRule({
      name: 'length',
      message: msg,
      validate: (value: unknown) => {
        if (!value)
          return true
        const len = String(value).length
        return len >= min && len <= max ? true : msg
      },
    })
  }

  pattern(regex: RegExp, message = 'Invalid format'): Validator {
    return this.addRule({
      name: 'pattern',
      message,
      validate: (value: unknown) => {
        if (!value)
          return true
        return regex.test(String(value)) ? true : message
      },
    })
  }

  hasUppercase(message = 'Must contain an uppercase letter'): Validator {
    return this.pattern(/[A-Z]/, message)
  }

  hasLowercase(message = 'Must contain a lowercase letter'): Validator {
    return this.pattern(/[a-z]/, message)
  }

  hasNumber(message = 'Must contain a number'): Validator {
    return this.pattern(/\d/, message)
  }

  hasSpecial(message = 'Must contain a special character'): Validator {
    return this.pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message)
  }

  alphanumeric(message = 'Must be alphanumeric'): Validator {
    return this.pattern(/^[a-zA-Z0-9]+$/, message)
  }

  number(message = 'Must be a number'): Validator {
    return this.addRule({
      name: 'number',
      message,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '')
          return true
        return !Number.isNaN(Number(value)) ? true : message
      },
    })
  }

  between(min: number, max: number, message?: string): Validator {
    const msg = message ?? `Must be between ${min} and ${max}`
    return this.addRule({
      name: 'between',
      message: msg,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '')
          return true
        const num = Number(value)
        return !Number.isNaN(num) && num >= min && num <= max ? true : msg
      },
    })
  }

  integer(message = 'Must be an integer'): Validator {
    return this.addRule({
      name: 'integer',
      message,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '')
          return true
        return Number.isInteger(Number(value)) ? true : message
      },
    })
  }

  positive(message = 'Must be a positive number'): Validator {
    return this.addRule({
      name: 'positive',
      message,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '')
          return true
        return Number(value) > 0 ? true : message
      },
    })
  }

  custom(fn: ValidatorFn, message = 'Validation failed'): Validator {
    return this.addRule({
      name: 'custom',
      message,
      validate: fn,
    })
  }

  async(fn: AsyncValidatorFn, message = 'Validation failed'): Validator {
    return this.addRule({
      name: 'async',
      message,
      validate: fn,
      async: true,
    })
  }

  async validate(value: unknown, formValues?: Record<string, unknown>): Promise<string[]> {
    const errors: string[] = []

    for (const rule of this.rules) {
      const result = await rule.validate(value, formValues)
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : rule.message)
      }
    }

    return errors
  }

  getDefaultValue(): unknown {
    return this._defaultValue
  }

  default(value: unknown): Validator {
    return new Validator([...this.rules], value)
  }

  getRules(): ValidatorRule[] {
    return [...this.rules]
  }
}

export const v = new Validator()
