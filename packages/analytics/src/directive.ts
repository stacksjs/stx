export function processAnalyticsDirective(content: string): string {
  return content.replace(/@analytics\b/g, generateTrackingScript())
}

export function generateTrackingScript(config?: { endpoint?: string, sessionTimeout?: number }): string {
  const endpoint = config?.endpoint || '/_stx/analytics/pageview'
  const sessionTimeout = config?.sessionTimeout || 1800000

  return `<script>
(function() {
  var endpoint = ${JSON.stringify(endpoint)};
  var sessionTimeout = ${sessionTimeout};
  var sessionKey = '_stx_sid';

  function getSessionId() {
    var stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < sessionTimeout) {
          parsed.ts = Date.now();
          sessionStorage.setItem(sessionKey, JSON.stringify(parsed));
          return parsed.id;
        }
      } catch(e) {}
    }
    var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(sessionKey, JSON.stringify({ id: id, ts: Date.now() }));
    return id;
  }

  var sessionId = getSessionId();

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: location.pathname,
      referrer: document.referrer || undefined,
      sessionId: sessionId
    }),
    keepalive: true
  }).catch(function() {});
})();
</script>`
}
