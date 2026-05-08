import { describe, expect, it } from 'bun:test'
import { deriveLayoutGroup, extractLayoutMetadata } from '../src/layout-metadata'

describe('layout metadata utilities', () => {
  it('derives stable groups from layout paths', () => {
    expect(deriveLayoutGroup('layouts/shop/product.stx')).toBe('shop')
    expect(deriveLayoutGroup('/abs/app/layouts/checkout/index.stx')).toBe('checkout')
    expect(deriveLayoutGroup('marketing.stx')).toBe('marketing')
    expect(deriveLayoutGroup('')).toBe('app')
  })

  it('prefers explicit meta tags and falls back to layout comments', () => {
    expect(extractLayoutMetadata('<meta name="stx-layout" content="layouts/shop/index.stx"><meta name="stx-layout-group" content="shop">')).toEqual({
      layout: 'layouts/shop/index.stx',
      group: 'shop',
    })

    expect(extractLayoutMetadata('<!-- stx-layout: layouts/checkout/index.stx -->')).toEqual({
      layout: 'layouts/checkout/index.stx',
      group: 'checkout',
    })
  })
})
