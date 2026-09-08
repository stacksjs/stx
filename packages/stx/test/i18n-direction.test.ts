import { describe, expect, test } from 'bun:test'
import { getLocaleDirection, isRtlLocale } from '../src/i18n'

describe('Locale text direction', () => {
  test('resolves right-to-left languages', () => {
    for (const locale of ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'prs', 'syr', 'nqo'])
      expect(getLocaleDirection(locale)).toBe('rtl')
  })

  test('resolves left-to-right languages', () => {
    for (const locale of ['en', 'de', 'fr', 'ja', 'zh', 'ru', 'hi', 'th'])
      expect(getLocaleDirection(locale)).toBe('ltr')
  })

  test('ignores the region subtag', () => {
    expect(getLocaleDirection('ar-EG')).toBe('rtl')
    expect(getLocaleDirection('en-US')).toBe('ltr')
  })

  test('lets an explicit script override the language default, both ways', () => {
    // Hausa and Punjabi are ordinarily Latin/Gurmukhi; their Arabic-script
    // orthographies are named by the script subtag, not by the language.
    expect(getLocaleDirection('ha-Arab')).toBe('rtl')
    expect(getLocaleDirection('pa-Arab')).toBe('rtl')
    expect(getLocaleDirection('fa-Latn')).toBe('ltr')
    expect(getLocaleDirection('pa-Guru')).toBe('ltr')
    expect(getLocaleDirection('sr-Cyrl')).toBe('ltr')
  })

  test('does not flip languages whose default script is Latin', () => {
    // The list follows CLDR default scripts, so these stay left-to-right even
    // though each has an Arabic-script variety reachable via `-Arab`.
    for (const locale of ['ha', 'ku', 'az', 'uz'])
      expect(getLocaleDirection(locale)).toBe('ltr')
  })

  test('handles the one region-qualified entry', () => {
    expect(getLocaleDirection('uz-AF')).toBe('rtl')
    expect(getLocaleDirection('uz')).toBe('ltr')
  })

  test('normalises case, whitespace and underscore separators', () => {
    expect(getLocaleDirection('  HE  ')).toBe('rtl')
    expect(getLocaleDirection('ar_EG')).toBe('rtl')
    expect(getLocaleDirection('AR-Arab')).toBe('rtl')
  })

  test('falls back to ltr for unknown or absent locales', () => {
    for (const locale of ['zz', 'xx-YY', '', undefined, null])
      expect(getLocaleDirection(locale)).toBe('ltr')
  })

  test('isRtlLocale mirrors getLocaleDirection', () => {
    expect(isRtlLocale('he')).toBe(true)
    expect(isRtlLocale('en')).toBe(false)
    expect(isRtlLocale(undefined)).toBe(false)
  })
})
