/**
 * Where a chat contact's face and name lead, or '' for nowhere.
 *
 * A contact's own `href` wins. Otherwise `template` is a URL with `{field}`
 * placeholders filled (URL-encoded) from the contact, e.g. "/people/{username}".
 * A placeholder whose field is empty means that contact gets no link, so an app
 * can send a handle only for the people whose page it may show.
 */
export function contactLink(person: object | null | undefined, template = ''): string {
  if (!person)
    return ''
  const contact = person as Record<string, unknown>
  if (typeof contact.href === 'string' && contact.href)
    return contact.href
  if (!template)
    return ''
  let missing = false
  const url = template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = contact[key]
    if (value == null || value === '') {
      missing = true
      return ''
    }
    return encodeURIComponent(String(value))
  })
  return missing ? '' : url
}
