export class SSEStream {
  private _controller: ReadableStreamDefaultController<Uint8Array> | null = null
  private _stream: ReadableStream<Uint8Array>
  private _closed = false
  private _retry: number | undefined
  private _heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private _encoder = new TextEncoder()

  constructor(config?: { retry?: number; heartbeat?: number }) {
    this._retry = config?.retry

    this._stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this._controller = controller

        if (this._retry !== undefined) {
          controller.enqueue(this._encoder.encode(`retry: ${this._retry}\n\n`))
        }

        if (config?.heartbeat && config.heartbeat > 0) {
          this._heartbeatInterval = setInterval(() => {
            if (!this._closed) {
              try {
                controller.enqueue(this._encoder.encode(': heartbeat\n\n'))
              }
              catch {
                this.close()
              }
            }
          }, config.heartbeat)
        }
      },
      cancel: () => {
        this._closed = true
        if (this._heartbeatInterval) {
          clearInterval(this._heartbeatInterval)
          this._heartbeatInterval = null
        }
      },
    })
  }

  send(event: string, data: unknown, id?: string): void {
    if (this._closed || !this._controller)
      return

    let message = ''

    if (id) {
      message += `id: ${id}\n`
    }

    message += `event: ${event}\n`

    const serialized = typeof data === 'string' ? data : JSON.stringify(data)
    for (const line of serialized.split('\n')) {
      message += `data: ${line}\n`
    }

    message += '\n'

    try {
      this._controller.enqueue(this._encoder.encode(message))
    }
    catch {
      this._closed = true
    }
  }

  close(): void {
    if (this._closed)
      return

    this._closed = true

    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval)
      this._heartbeatInterval = null
    }

    try {
      this._controller?.close()
    }
    catch {
      // already closed
    }
  }

  toResponse(): Response {
    return new Response(this._stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}

export function createSSEStream(config?: { retry?: number }): SSEStream {
  return new SSEStream(config)
}

export function createSSEResponse(handler: (stream: SSEStream) => void | Promise<void>): Response {
  const stream = new SSEStream()
  // Start the handler asynchronously
  Promise.resolve(handler(stream)).catch(() => stream.close())
  return stream.toResponse()
}
