/** Formatting helpers and object dependency tracking used by client bindings. */
export const SIGNALS_HELPERS_RUNTIME = `  // ==========================================================================
  // Global Helpers (Feature #5)
  // ==========================================================================

  const globalHelpers = {
    // Number formatting
    fmt(n) {
      if (n == null) return '0';
      n = Number(n);
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    },

    // Date formatting
    formatDate(date, format = 'YYYY-MM-DD') {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    // Time ago formatting
    timeAgo(date) {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const seconds = Math.floor((now - d) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
      if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
      return d.toLocaleDateString();
    },

    // Debounce function
    debounce(fn, delay = 300) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    // Throttle function
    throttle(fn, limit = 300) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // Capitalize first letter
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Truncate string
    truncate(str, length = 50, suffix = '...') {
      if (!str || str.length <= length) return str || '';
      return str.slice(0, length) + suffix;
    },

    // JSON stringify (safe)
    json(value, indent = 2) {
      try {
        return JSON.stringify(value, null, indent);
      }
catch (e) {
        return String(value);
      }
    },

    // Pluralize
    pluralize(count, singular, plural) {
      const p = plural || singular + 's';
      return count === 1 ? singular : p;
    },

    // Clamp number
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    // Currency formatting
    currency(value, symbol = '$', decimals = 2) {
      if (value == null) return symbol + '0.00';
      return symbol + Number(value).toFixed(decimals).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
    },

    // Percentage formatting
    percent(value, decimals = 0) {
      if (value == null) return '0%';
      return (Number(value) * 100).toFixed(decimals) + '%';
    }
  };

  function track(target, key) {
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) targetMap.set(target, (depsMap = new Map()));
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, (deps = new Set()));
    deps.add(activeEffect);
  }

  function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const deps = depsMap.get(key);
    if (deps) {
      if (isBatching) {
        deps.forEach(effect => pendingEffects.add(effect));
      }
else {
        deps.forEach(effect => effect());
      }
    }
  }
`
