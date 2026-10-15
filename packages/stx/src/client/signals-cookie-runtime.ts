/** Cookie signal composable used by the generated client runtime. */
export const SIGNALS_COOKIE_RUNTIME = `  // Reactive cookie binding. Mirrors useLocalStorage's shape: returns a string-
  // valued signal, writes on .set(), and respects cookie attributes via opts.
  // Setting the signal to '' deletes the cookie (max-age=0). Cookies don't fire
  // a 'storage' event, so cross-tab updates aren't auto-reflected; consumers
  // that need that can poll on 'visibilitychange' themselves. See issue #1701.
  function useCookie(name, opts) {
    opts = opts || {};
    var encode = opts.encode || encodeURIComponent;
    var decode = opts.decode || decodeURIComponent;
    // Escape cookie name so dots/brackets/etc. read safely through the matcher.
    var escapedName = name.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    var nameRe = new RegExp('(?:^|; )' + escapedName + '=([^;]*)');
    function read() {
      if (typeof document === 'undefined') return opts.defaultValue || '';
      var m = document.cookie.match(nameRe);
      return m ? decode(m[1]) : (opts.defaultValue || '');
    }
    var s = state(read());
    function serialise(value) {
      var parts = [name + '=' + (value ? encode(value) : '')];
      parts.push('path=' + (opts.path || '/'));
      if (opts.domain) parts.push('domain=' + opts.domain);
      if (value === '') parts.push('max-age=0');
      else if (typeof opts.maxAge === 'number') parts.push('max-age=' + opts.maxAge);
      else if (opts.expires !== undefined) {
        // Date, seconds-from-now, or anything Date can parse — matching the
        // composable. Accepting only a Date here meant the same option silently
        // produced a session cookie on the runtime path.
        var expiresDate = opts.expires instanceof Date
          ? opts.expires
          : (typeof opts.expires === 'number' ? new Date(Date.now() + opts.expires * 1000) : new Date(opts.expires));
        parts.push('expires=' + expiresDate.toUTCString());
      }
      parts.push('SameSite=' + (opts.sameSite || 'Lax'));
      var secure = opts.secure;
      if (secure === undefined) secure = typeof location !== 'undefined' && location.protocol === 'https:';
      if (secure) parts.push('Secure');
      return parts.join('; ');
    }
    // subscribe, not effect: an effect runs once at creation, so merely
    // DECLARING a cookie rewrote it from these options. A second declaration
    // that only wanted to read - no options, because it is not the owner of the
    // policy - therefore reserialised it with no max-age, which is the
    // definition of a session cookie. A 30-day login died at browser close
    // because the user opened a settings page (#1933).
    //
    // subscribe fires on set() only, so construction is a pure read: read()
    // above already seeds the signal. This matches the composable, which has
    // always used subscribe.
    s.subscribe(function(value) {
      if (typeof document === 'undefined') return;
      document.cookie = serialise(value);
    });
    return s;
  }
`
