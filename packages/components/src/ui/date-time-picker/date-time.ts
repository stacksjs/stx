/** An instant, displayed and edited in the caller's workspace timezone. */
export type DateTimeValue = Date | string | null
export type DateTimePreset = 'hour' | 'tomorrow' | 'suggested'
export interface DateTimeFields { date: string, time: string }
export interface DateTimeSelection { value: string | null, timeZone: string, preset: DateTimePreset | null }

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(timeZone: string): Intl.DateTimeFormat {
  let value = formatters.get(timeZone)
  if (!value) {
    value = new Intl.DateTimeFormat('en-CA', { timeZone, calendar: 'iso8601', numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    if (formatters.size >= 64) formatters.clear()
    formatters.set(timeZone, value)
  }
  return value
}

export function validTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || !timeZone) return false
  try { formatter(timeZone); return true }
  catch { return false }
}

export function dateTimeInstant(value: DateTimeValue | undefined): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  if (typeof value === 'string') {
    const iso = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.exec(value)
    if (!iso || civilTimestamp(iso[1], iso[2]) == null) return null
  }
  const date = new Date(value instanceof Date ? value.getTime() : value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

/** Workspace civil fields, independent of the browser or server's timezone. */
export function dateTimeFields(value: DateTimeValue, timeZone: string): DateTimeFields | null {
  const instant = dateTimeInstant(value)
  if (!instant) return null
  try {
    const parts = Object.fromEntries(formatter(timeZone).formatToParts(new Date(instant)).map(part => [part.type, part.value]))
    return { date: `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
  }
  catch { return null }
}

function civilTimestamp(date: string, time: string): number | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const clock = /^(\d{2}):(\d{2})$/.exec(time)
  if (!day || !clock) return null
  const [year, month, number, hour, minute] = [+day[1], +day[2], +day[3], +clock[1], +clock[2]]
  if (year < 100 || month < 1 || month > 12 || number < 1 || hour > 23 || minute > 59) return null
  const timestamp = Date.UTC(year, month - 1, number, hour, minute)
  const actual = new Date(timestamp)
  return actual.getUTCFullYear() === year && actual.getUTCMonth() === month - 1 && actual.getUTCDate() === number ? timestamp : null
}

/**
 * Resolve a civil minute to an instant. Gaps (including skipped days) return
 * null. Folds choose the earlier occurrence unless explicitly asked for later.
 * Probe both sides of the transition, including non-hour offset changes.
 */
export function dateTimeToIso(date: string, time: string, timeZone: string, disambiguation: 'earlier' | 'later' = 'earlier'): string | null {
  const guess = civilTimestamp(date, time)
  if (guess == null || !validTimeZone(timeZone)) return null
  const offsets = new Set<number>()
  for (const delta of [-2, -1, 0, 1, 2]) {
    const timestamp = guess + delta * 86400000
    const fields = dateTimeFields(new Date(timestamp), timeZone)
    if (!fields) continue
    const civil = civilTimestamp(fields.date, fields.time)
    if (civil != null) offsets.add(civil - timestamp)
  }
  const candidates: number[] = []
  for (const offset of offsets) {
    const candidate = guess - offset
    const fields = dateTimeFields(new Date(candidate), timeZone)
    if (fields?.date === date && fields.time === time) candidates.push(candidate)
  }
  if (!candidates.length) return null
  return new Date(disambiguation === 'later' ? Math.max(...candidates) : Math.min(...candidates)).toISOString()
}

export function formatDateTime(value: DateTimeValue, timeZone: string, locale = 'en-US'): string | null {
  const instant = dateTimeInstant(value)
  if (!instant) return null
  try {
    return new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(instant))
  }
  catch { return null }
}

/** Recommendations stay app-owned; the picker only accepts the supplied instant. */
export function dateTimePreset(preset: DateTimePreset, timeZone: string, now = new Date(), suggested: DateTimeValue = null): string | null {
  if (!validTimeZone(timeZone) || !Number.isFinite(now.getTime())) return null
  if (preset === 'hour') return new Date(now.getTime() + 3600000).toISOString()
  if (preset === 'suggested') return dateTimeInstant(suggested)
  const fields = dateTimeFields(now, timeZone)
  if (!fields) return null
  const midnight = civilTimestamp(fields.date, '00:00')
  if (midnight == null) return null
  const tomorrow = new Date(midnight + 86400000).toISOString().slice(0, 10)
  return dateTimeToIso(tomorrow, '09:00', timeZone)
}
