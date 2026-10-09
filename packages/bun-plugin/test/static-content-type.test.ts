import { describe, expect, it } from 'bun:test'
import { staticContentType } from '../src/serve'

describe('the type a static file is served with', () => {
  it('serves the extensionless well-known files with the type their platform insists on', () => {
    // Apple ignores an apple-app-site-association that is not JSON, and
    // universal links then open Safari instead of the app.
    expect(staticContentType('public/.well-known/apple-app-site-association')).toBe('application/json')
    expect(staticContentType('/.well-known/apple-developer-merchantid-domain-association')).toBe('text/plain')
  })

  it('goes by extension otherwise', () => {
    expect(staticContentType('/assets/app.css')).toBe('text/css')
    expect(staticContentType('/site.webmanifest')).toBe('application/manifest+json')
    expect(staticContentType('/.well-known/assetlinks.json')).toBe('application/json')
    expect(staticContentType('/LICENSE')).toBe('application/octet-stream')
  })
})
