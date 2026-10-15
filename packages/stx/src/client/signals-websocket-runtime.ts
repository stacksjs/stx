/** WebSocket composable embedded in the generated browser runtime. */
export const SIGNALS_WEBSOCKET_RUNTIME = `  // ==========================================================================
  // WebSocket Composable
  // ==========================================================================

  function useWebSocket(url, options) {
    options = options || {};
    var ws = state(null);
    var status = state('CLOSED');
    var lastMessage = state(null);
    var error = state(null);

    var reconnectAttempts = 0;
    var maxReconnects = options.reconnect === false ? 0 : (options.maxReconnects || 10);
    var reconnectDelay = options.reconnectDelay || 1000;
    var reconnectTimer = null;
    var manualClose = false;
    var listeners = {};
    var subscriptions = {};

    function connect() {
      if (ws() && ws().readyState <= 1) return;
      manualClose = false;
      status.set('CONNECTING');
      error.set(null);

      var socket = new WebSocket(url);

      socket.onopen = function() {
        status.set('OPEN');
        reconnectAttempts = 0;
        // A channel is commonly selected immediately after useWebSocket(),
        // while the native socket is still CONNECTING. Keep that intent and
        // subscribe once the transport is writable. Replaying the set here
        // also restores channels after an automatic reconnect.
        for (var channel in subscriptions) {
          send({ event: 'subscribe', channel: channel });
        }
        if (options.onOpen) options.onOpen(socket);
      };

      socket.onmessage = function(event) {
        var data = event.data;
        try { data = JSON.parse(data); } catch(e) {}
        lastMessage.set(data);
        if (options.onMessage) options.onMessage(data, event);
        // Dispatch to channel listeners
        if (data && data.channel && data.event) {
          var key = data.channel + ':' + data.event;
          var fns = listeners[key];
          if (fns) {
            for (var i = 0; i < fns.length; i++) {
              fns[i](data.data);
            }
          }
        }
      };

      socket.onerror = function(event) {
        error.set(event);
        if (options.onError) options.onError(event);
      };

      socket.onclose = function(event) {
        status.set('CLOSED');
        ws.set(null);
        if (options.onClose) options.onClose(event);
        if (!manualClose && reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          var delay = reconnectDelay * Math.min(reconnectAttempts, 5);
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      ws.set(socket);
    }

    function send(data) {
      var socket = ws();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    }

    function close() {
      manualClose = true;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      var socket = ws();
      if (socket) socket.close();
    }

    function subscribe(channel) {
      subscriptions[channel] = true;
      var socket = ws();
      if (socket && socket.readyState === WebSocket.OPEN) {
        send({ event: 'subscribe', channel: channel });
      }
      return {
        listen: function(event, handler) {
          var key = channel + ':' + event;
          if (!listeners[key]) listeners[key] = [];
          listeners[key].push(handler);
          return this;
        },
        leave: function() {
          delete subscriptions[channel];
          send({ event: 'unsubscribe', channel: channel });
          // Remove all listeners for this channel
          var prefix = channel + ':';
          for (var key in listeners) {
            if (key.indexOf(prefix) === 0) {
              delete listeners[key];
            }
          }
        }
      };
    }

    if (options.immediate !== false) {
      connect();
    }

    onDestroy(function() {
      close();
      listeners = {};
    });

    return {
      ws: ws,
      status: status,
      lastMessage: lastMessage,
      error: error,
      send: send,
      close: close,
      connect: connect,
      subscribe: subscribe
    };
  }
`
