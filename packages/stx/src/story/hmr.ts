/**
 * STX Story - Hot Module Reload
 * WebSocket-based HMR for story updates
 */

import type { ServerWebSocket } from 'bun'

/**
 * HMR message types
 */
export type HmrMessageType =
  | 'connected'
  | 'story-update'
  | 'story-add'
  | 'story-remove'
  | 'config-change'
  | 'full-reload'
  | 'error'

/**
 * HMR message structure
 */
export interface HmrMessage {
  type: HmrMessageType
  data?: any
  timestamp?: number
}

/**
 * Connected WebSocket clients
 */
const clients: Set<ServerWebSocket<unknown>> = new Set()

/**
 * Create WebSocket upgrade handler for HMR
 */
export interface HmrWebSocketHandler {
  open: (ws: ServerWebSocket<unknown>) => void
  close: (ws: ServerWebSocket<unknown>) => void
  message: (ws: ServerWebSocket<unknown>, message: string | ArrayBuffer) => void
}

export function createHmrHandler(): HmrWebSocketHandler {
  return {
    open(ws: ServerWebSocket<unknown>): void {
      clients.add(ws)
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
      }))
    },

    close(ws: ServerWebSocket<unknown>): void {
      clients.delete(ws)
    },

    message(_ws: ServerWebSocket<unknown>, _message: string | ArrayBuffer): void {
      // Handle client messages if needed
    },
  }
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcast(message: HmrMessage): void {
  const payload = JSON.stringify({
    ...message,
    timestamp: message.timestamp || Date.now(),
  })

  for (const client of clients) {
    try {
      client.send(payload)
    }
    catch {
      // Client disconnected, remove from set
      clients.delete(client)
    }
  }
}

/**
 * Notify clients of a story update
 */
export function notifyStoryUpdate(storyId: string, data?: any): void {
  broadcast({
    type: 'story-update',
    data: { storyId, ...data },
  })
}

/**
 * Notify clients of a new story
 */
export function notifyStoryAdd(storyId: string, data?: any): void {
  broadcast({
    type: 'story-add',
    data: { storyId, ...data },
  })
}

/**
 * Notify clients of a removed story
 */
export function notifyStoryRemove(storyId: string): void {
  broadcast({
    type: 'story-remove',
    data: { storyId },
  })
}

/**
 * Notify clients of a config change
 */
export function notifyConfigChange(): void {
  broadcast({
    type: 'config-change',
  })
}

/**
 * Notify clients to do a full reload
 */
export function notifyFullReload(): void {
  broadcast({
    type: 'full-reload',
  })
}

/**
 * Notify clients of an error
 */
export function notifyError(error: string): void {
  broadcast({
    type: 'error',
    data: { error },
  })
}

/**
 * Get the number of connected clients
 */
export function getClientCount(): number {
  return clients.size
}

/**
 * Get HMR client script to inject into the page
 */
export function getHmrClientScript(wsUrl: string): string {
  return `
<script>
(function() {
  const ws = new WebSocket('${wsUrl}');

  ws.onopen = function() {
    console.log('[STX Story] HMR connected');
  };

  ws.onmessage = function(event) {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'connected':
        console.log('[STX Story] Connected to HMR server');
        break;

      case 'story-update':
        console.log('[STX Story] Story updated:', message.data.storyId);
        // Reload the current story if it matches
        if (window.__stxStory && window.__stxStory.currentStoryId === message.data.storyId) {
          window.__stxStory.reloadCurrentStory();
        }
        break;

      case 'story-add':
        console.log('[STX Story] Story added:', message.data.storyId);
        window.__stxStory && window.__stxStory.refreshStoryList();
        break;

      case 'story-remove':
        console.log('[STX Story] Story removed:', message.data.storyId);
        window.__stxStory && window.__stxStory.refreshStoryList();
        break;

      case 'config-change':
        console.log('[STX Story] Config changed, reloading...');
        location.reload();
        break;

      case 'full-reload':
        console.log('[STX Story] Full reload requested');
        location.reload();
        break;

      case 'error':
        console.error('[STX Story] Error:', message.data.error);
        break;
    }
  };

  ws.onclose = function() {
    console.log('[STX Story] HMR disconnected, attempting reconnect...');
    setTimeout(function() {
      location.reload();
    }, 1000);
  };

  ws.onerror = function(error) {
    console.error('[STX Story] WebSocket error:', error);
  };
})();
</script>
`
}
