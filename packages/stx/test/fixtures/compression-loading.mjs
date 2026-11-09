import { compressResponse, isCompressible, negotiateEncoding } from '../../src/compression.ts'

if (negotiateEncoding('br;q=0, gzip') !== 'gzip' || negotiateEncoding('br;q=0,gzip;q=0') !== null)
  throw new Error('Encoding negotiation changed')
if (!isCompressible('text/html; charset=utf-8') || isCompressible('image/png') || isCompressible('text/event-stream'))
  throw new Error('Compression content-type filtering changed')
console.log('OK compression metadata without requesting response encoding')

if (process.argv[2] === 'gzip' || process.argv[2] === 'br') {
  const encoding = process.argv[2]
  const input = 'actual response bytes '.repeat(2048)
  const request = new Request('https://example.test/', { headers: { 'Accept-Encoding': encoding } })
  const response = new Response(input, { headers: { 'Content-Type': 'text/plain' } })
  const output = await compressResponse(request, response)
  if (output.headers.get('Content-Encoding') !== encoding)
    throw new Error(`Requested ${encoding} encoding did not execute`)
  const bytes = new Uint8Array(await output.arrayBuffer())
  if (bytes.length === 0 || bytes.length >= input.length)
    throw new Error('Encoding did not return genuine compressed bytes')
  console.log(`OK actual ${encoding} response: ${bytes.length} bytes`)
}
