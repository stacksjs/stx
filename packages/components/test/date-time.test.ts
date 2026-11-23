import { describe, expect, it } from 'bun:test'
import { dateTimeFields, dateTimeInstant, dateTimePreset, dateTimeToIso, formatDateTime, validTimeZone } from '../src/ui/date-time-picker/date-time'

describe('workspace date-time conversion (#2222)', () => {
  it('round-trips civil minutes across day boundaries and fractional offsets', () => {
    for (const [zone, date, time, iso] of [
      ['UTC', '2026-12-01', '09:30', '2026-12-01T09:30:00.000Z'],
      ['America/New_York', '2026-12-01', '09:30', '2026-12-01T14:30:00.000Z'],
      ['Asia/Manila', '2026-12-01', '00:15', '2026-11-30T16:15:00.000Z'],
      ['Asia/Kathmandu', '2026-12-01', '09:30', '2026-12-01T03:45:00.000Z'],
    ]) {
      expect(dateTimeToIso(date, time, zone)).toBe(iso)
      expect(dateTimeFields(iso, zone)).toEqual({ date, time })
    }
  })

  it('rejects nonexistent minutes and skipped days instead of moving the appointment', () => {
    expect(dateTimeToIso('2026-03-08', '02:30', 'America/New_York')).toBeNull()
    expect(dateTimeToIso('2026-10-04', '02:15', 'Australia/Lord_Howe')).toBeNull()
    expect(dateTimeToIso('2011-12-30', '09:00', 'Pacific/Apia')).toBeNull()
  })

  it('handles both occurrences of an ambiguous clock minute', () => {
    expect(dateTimeToIso('2026-11-01', '01:30', 'America/New_York')).toBe('2026-11-01T05:30:00.000Z')
    expect(dateTimeToIso('2026-11-01', '01:30', 'America/New_York', 'later')).toBe('2026-11-01T06:30:00.000Z')
  })

  it('validates dates, clocks, zones and instants', () => {
    for (const [date, time] of [['2026-02-30', '10:00'], ['2026-02-28', '24:00'], ['2026-02-28', '12:60'], ['', ''], ['2026-13-01', '12:00']]) expect(dateTimeToIso(date, time, 'UTC')).toBeNull()
    expect(validTimeZone('not/a-zone')).toBe(false)
    expect(validTimeZone(undefined as any)).toBe(false)
    expect(dateTimeInstant(false as any)).toBeNull()
    expect(dateTimeToIso('2026-12-01', '10:00', 'not/a-zone')).toBeNull()
    expect(dateTimeInstant('bad')).toBeNull()
    expect(dateTimeInstant('2026-12-01T09:30')).toBeNull()
    expect(dateTimeInstant('2026-02-30T09:30Z')).toBeNull()
    expect(dateTimeInstant(null)).toBeNull()
    expect(dateTimeFields('bad', 'UTC')).toBeNull()
    expect(dateTimeInstant(new Date('2026-12-01T09:30:15.123Z'))).toBe('2026-12-01T09:30:15.123Z')
    expect(formatDateTime('2026-12-01T14:30Z', 'America/New_York')).toContain('9:30')
  })

  it('computes quick choices in the workspace zone across DST and year changes', () => {
    const now = new Date('2026-03-07T20:00:00Z')
    expect(dateTimePreset('hour', 'America/New_York', now)).toBe('2026-03-07T21:00:00.000Z')
    expect(dateTimePreset('tomorrow', 'America/New_York', now)).toBe('2026-03-08T13:00:00.000Z')
    expect(dateTimePreset('tomorrow', 'Asia/Manila', new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01T01:00:00.000Z')
    expect(dateTimePreset('suggested', 'UTC', now, '2026-12-01T14:30Z')).toBe('2026-12-01T14:30:00.000Z')
    expect(dateTimePreset('suggested', 'UTC', now)).toBeNull()
  })
})
