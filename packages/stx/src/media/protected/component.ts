/**
 * STX Media - Protected Media Component
 *
 * Render protected media that requires signed URLs for access.
 * Supports batch signature requests for multiple protected items on a page.
 *
 * @module media/protected/component
 */

import type {
  ProtectedMediaProps,
  SignatureConfig,
  SignedUrl,
} from '../types'
import {
  signUrl,
  batchSignUrls,
  checkAuthAccess,
  buildAuthParams,
  generateSignatureRuntime,
} from './signature'

// =============================================================================
// Component Rendering
// =============================================================================

/**
 * Render a protected image component
 *
 * @example
 * ```typescript
 * const html = await renderProtectedImg({
 *   src: '/api/media/secure-image.jpg',
 *   alt: 'Secure content',
 *   signatureEndpoint: '/api/sign',
 *   auth: { role: 'premium' },
 * })
 * ```
 */
export async function renderProtectedImg(
  props: ProtectedMediaProps,
): Promise<{ html: string; script?: string }> {
  const {
    src,
    alt = '',
    signatureEndpoint = '/api/sign',
    signatureConfig = {},
    auth,
    fallback,
    oneTimeUse = true,
  } = props

  const className = props.class
  const style = props.style

  // Check auth access
  if (auth) {
    const hasAccess = await checkAuthAccess(auth)
    if (!hasAccess) {
      // Render fallback or placeholder
      if (fallback) {
        return {
          html: `<img src="${escapeAttr(fallback)}" alt="${escapeAttr(alt)}"${className ? ` class="${escapeAttr(className)}"` : ''}${style ? ` style="${escapeAttr(style)}"` : ''} />`,
        }
      }
      return {
        html: `<!-- Protected content: access denied -->`,
      }
    }
  }

  // Build signature config
  const config: SignatureConfig = {
    endpoint: signatureEndpoint,
    oneTimeUse,
    ...signatureConfig,
    params: auth ? buildAuthParams(auth) : signatureConfig.params,
  }

  // Generate unique ID for this element
  const elementId = `stx-protected-${Math.random().toString(36).slice(2, 8)}`

  // Render with data attributes for client-side loading
  // The actual signed URL will be loaded client-side for security (no DOM exposure)
  const attrs: string[] = [
    `id="${elementId}"`,
    `data-protected-src="${escapeAttr(src)}"`,
    `data-signature-endpoint="${escapeAttr(signatureEndpoint)}"`,
    `alt="${escapeAttr(alt)}"`,
  ]

  if (fallback) {
    attrs.push(`data-fallback="${escapeAttr(fallback)}"`)
    attrs.push(`src="${escapeAttr(fallback)}"`) // Show fallback initially
  } else {
    // Transparent placeholder
    attrs.push('src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"')
  }

  if (className) attrs.push(`class="${escapeAttr(className)}"`)
  if (style) attrs.push(`style="${escapeAttr(style)}"`)

  // Client-side script to load signed URL
  const script = `
(function() {
  var el = document.getElementById('${elementId}');
  if (!el) return;

  STX.loadProtectedMedia(el, {
    endpoint: '${escapeAttr(signatureEndpoint)}',
    oneTimeUse: ${oneTimeUse},
    expirationSeconds: ${signatureConfig.expirationSeconds || 3600}
  });
})();
`.trim()

  return {
    html: `<img ${attrs.join(' ')} />`,
    script,
  }
}

/**
 * Render a protected video component
 */
export async function renderProtectedVideo(
  props: ProtectedMediaProps & {
    poster?: string
    controls?: boolean
    autoplay?: boolean
    muted?: boolean
    loop?: boolean
  },
): Promise<{ html: string; script?: string }> {
  const {
    src,
    signatureEndpoint = '/api/sign',
    signatureConfig = {},
    auth,
    fallback,
    oneTimeUse = true,
    poster,
    controls = true,
    autoplay = false,
    muted = false,
    loop = false,
  } = props

  const className = props.class
  const style = props.style
  const alt = props.alt

  // Check auth access
  if (auth) {
    const hasAccess = await checkAuthAccess(auth)
    if (!hasAccess) {
      return {
        html: `<!-- Protected video: access denied -->`,
      }
    }
  }

  const elementId = `stx-protected-video-${Math.random().toString(36).slice(2, 8)}`

  const attrs: string[] = [
    `id="${elementId}"`,
    `data-protected-src="${escapeAttr(src)}"`,
    `data-signature-endpoint="${escapeAttr(signatureEndpoint)}"`,
  ]

  if (poster) attrs.push(`poster="${escapeAttr(poster)}"`)
  if (controls) attrs.push('controls')
  if (autoplay) attrs.push('autoplay')
  if (muted) attrs.push('muted')
  if (loop) attrs.push('loop')
  if (className) attrs.push(`class="${escapeAttr(className)}"`)
  if (style) attrs.push(`style="${escapeAttr(style)}"`)
  if (fallback) attrs.push(`data-fallback="${escapeAttr(fallback)}"`)

  const script = `
(function() {
  var el = document.getElementById('${elementId}');
  if (!el) return;

  STX.loadProtectedMedia(el, {
    endpoint: '${escapeAttr(signatureEndpoint)}',
    oneTimeUse: ${oneTimeUse},
    expirationSeconds: ${signatureConfig.expirationSeconds || 3600}
  });
})();
`.trim()

  return {
    html: `<video ${attrs.join(' ')}></video>`,
    script,
  }
}

// =============================================================================
// Batch Processing
// =============================================================================

/**
 * Collect all protected media elements from content and batch sign
 */
export async function processProtectedMedia(
  content: string,
  signatureEndpoint: string,
): Promise<{ html: string; script: string }> {
  // Find all protected media elements
  const protectedPattern = /data-protected-src="([^"]+)"/g
  const sources: string[] = []
  let match: RegExpExecArray | null

  while ((match = protectedPattern.exec(content)) !== null) {
    sources.push(match[1])
  }

  if (sources.length === 0) {
    return { html: content, script: '' }
  }

  // Include the signature runtime
  let script = generateSignatureRuntime() + '\n\n'

  // Add batch loading script
  script += `
(function() {
  var sources = ${JSON.stringify(sources)};
  var endpoint = '${escapeAttr(signatureEndpoint)}';

  // Batch sign all URLs
  STX.batchSignUrls(sources, { endpoint: endpoint })
    .then(function(data) {
      sources.forEach(function(src) {
        var els = document.querySelectorAll('[data-protected-src="' + src + '"]');
        var signedUrl = data.signatures && data.signatures[src];

        els.forEach(function(el) {
          if (signedUrl) {
            if (el.tagName === 'IMG') el.src = signedUrl.url;
            else if (el.tagName === 'VIDEO') { el.src = signedUrl.url; el.load(); }
          } else if (el.dataset.fallback) {
            el.src = el.dataset.fallback;
          }
        });
      });
    })
    .catch(function(error) {
      console.error('Failed to sign protected media:', error);
      document.querySelectorAll('[data-protected-src]').forEach(function(el) {
        if (el.dataset.fallback) el.src = el.dataset.fallback;
      });
    });
})();
`.trim()

  return { html: content, script }
}

// =============================================================================
// Directive
// =============================================================================

/**
 * Parse @protected directive arguments
 */
export function parseProtectedArgs(
  content: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): ProtectedMediaProps {
  // If params already structured
  if (params.src) {
    return {
      src: String(params.src),
      alt: String(params.alt || ''),
      signatureEndpoint: String(params.signatureEndpoint || '/api/sign'),
      auth: params.auth as ProtectedMediaProps['auth'],
      fallback: params.fallback ? String(params.fallback) : undefined,
      oneTimeUse: params.oneTimeUse !== false,
    }
  }

  // Parse from content string
  let args = content.trim()
  if (args.startsWith('@protected(') || args.startsWith('(')) {
    args = args.replace(/^@protected\(/, '').replace(/^\(/, '').replace(/\)$/, '')
  }

  const parts = parseArguments(args)

  return {
    src: resolveValue(parts[0], context) as string || '',
    alt: resolveValue(parts[1], context) as string || '',
    ...(typeof parts[2] === 'object' ? parts[2] : {}) as Partial<ProtectedMediaProps>,
  }
}

/**
 * Parse arguments helper
 */
function parseArguments(argsStr: string): unknown[] {
  const args: unknown[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let braceDepth = 0

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    const prevChar = i > 0 ? argsStr[i - 1] : ''

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      } else {
        current += char
      }
      continue
    }

    if (!inString) {
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--

      if (char === ',' && braceDepth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
    }

    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

/**
 * Resolve value from context
 */
function resolveValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  if (context[trimmed] !== undefined) {
    return context[trimmed]
  }

  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Not valid JSON
    }
  }

  return trimmed
}

/**
 * Escape HTML attribute
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
