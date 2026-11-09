import { generateSrcSet, getMimeType, resizeAndConvert } from '../../src/image-optimization/processor.ts'
import { getImageDelivery, prepareImageDelivery } from '../../src/builtins/image-delivery.ts'

if (getMimeType('png') !== 'image/png')
  throw new Error('Wrong PNG MIME type')
if (generateSrcSet([{ width: 32, url: '/small.png', format: 'png' }, { width: 64, url: '/large.png', format: 'png' }]) !== '/small.png 32w, /large.png 64w')
  throw new Error('Wrong responsive image metadata')
if (getImageDelivery('/never-registered.png') !== undefined || typeof prepareImageDelivery !== 'function')
  throw new Error('Wrong image delivery exports')

console.log('OK image helpers initialized and produced metadata without requesting codecs')

if (process.argv[2] === 'resize') {
  // Actual opaque red pixel, encoded as a complete PNG, not header-only test data.
  const source = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8cfc0f01f00050001ff89993d1d0000000049454e44ae426082', 'hex')
  const output = await resizeAndConvert(source, { width: 2, height: 2, format: 'png', quality: 100, fit: 'fill' })
  if (output[0] !== 0x89 || output[1] !== 0x50 || output.readUInt32BE(16) !== 2 || output.readUInt32BE(20) !== 2)
    throw new Error('Requested resize did not produce a genuine 2 by 2 PNG')
  console.log('OK requested image resize produced an actual 2 by 2 PNG')
}
