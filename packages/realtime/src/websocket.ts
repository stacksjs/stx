export interface WebSocketHandlerConfig {
  path?: string
  onConnection?: (ws: any) => void
  onMessage?: (ws: any, message: string) => void
  onClose?: (ws: any) => void
  authenticate?: (request: Request) => Promise<boolean>
}

export function createWebSocketHandler(config?: WebSocketHandlerConfig): {
  handleUpgrade: (request: Request) => Response | undefined
} {
  const wsPath = config?.path ?? '/ws'

  return {
    handleUpgrade(request: Request): Response | undefined {
      const url = new URL(request.url)

      if (url.pathname !== wsPath) {
        return undefined
      }

      const upgradeHeader = request.headers.get('Upgrade')
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      // In Bun, server.upgrade() handles the actual upgrade.
      // This handler validates the request and returns undefined to signal
      // the caller should proceed with the upgrade.
      return undefined
    },
  }
}

export function buildWebSocketUrl(path: string, params?: Record<string, string>): string {
  const protocol = typeof globalThis.location !== 'undefined' && globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = typeof globalThis.location !== 'undefined' ? globalThis.location.host : 'localhost'

  let url = `${protocol}//${host}${path.startsWith('/') ? path : `/${path}`}`

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  return url
}
