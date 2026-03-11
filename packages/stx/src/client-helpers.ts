/**
 * Client-side helper utilities for stx applications.
 * Injected as a <script> tag to provide common UI patterns.
 */
export const stxClientHelpers = `
<script data-stx-helpers>
(function() {
  'use strict'

  if (window.__stxHelpers) return
  window.__stxHelpers = true

  window.stx = window.stx || {}

  // ===== FORMATTERS =====

  stx.formatCurrency = function(val, currency, locale) {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(val)
  }

  stx.formatNumber = function(val, decimals, locale) {
    var opts = {}
    if (typeof decimals === 'number') {
      opts.minimumFractionDigits = decimals
      opts.maximumFractionDigits = decimals
    }
    return new Intl.NumberFormat(locale || 'en-US', opts).format(val)
  }

  stx.formatDate = function(val, format, locale) {
    locale = locale || 'en-US'
    var d = val instanceof Date ? val : new Date(val)
    if (isNaN(d.getTime())) return String(val)

    if (format === 'long') return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    if (format === 'relative') {
      var diff = Date.now() - d.getTime()
      var mins = Math.floor(diff / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return mins + 'm ago'
      var hrs = Math.floor(mins / 60)
      if (hrs < 24) return hrs + 'h ago'
      var days = Math.floor(hrs / 24)
      if (days < 7) return days + 'd ago'
      return d.toLocaleDateString(locale)
    }
    return d.toLocaleDateString(locale)
  }

  stx.formatPhone = function(phone) {
    var n = String(phone).replace(/\\D/g, '')
    if (n.length === 10) return \`(\${n.slice(0,3)}) \${n.slice(3,6)}-\${n.slice(6)}\`
    if (n.length === 11 && n[0] === '1') return \`+1 (\${n.slice(1,4)}) \${n.slice(4,7)}-\${n.slice(7)}\`
    return phone
  }

  stx.renderStars = function(rating, max) {
    max = max || 5
    var full = Math.floor(rating)
    var half = rating - full >= 0.5
    var h = ''
    for (var i = 0; i < max; i++) {
      if (i < full || (i === full && half))
        h += '<span style="color: var(--badge-amber-text, #f59e0b)">\\u2605</span>'
      else
        h += '<span style="color: var(--text-muted, #6b7280)">\\u2606</span>'
    }
    return h
  }

  // ===== BADGE SYSTEM =====

  var badgeMaps = {
    status: {
      'Active Repair': 'badge-amber', 'Completed': 'badge-emerald',
      'Pending Pickup': 'badge-blue', 'Pending Estimate': 'badge-slate',
      'Approved': 'badge-emerald', 'In Review': 'badge-blue',
      'Supplement': 'badge-amber', 'Draft': 'badge-slate', 'Rejected': 'badge-red',
      'Delivered': 'badge-emerald', 'Shipped': 'badge-blue', 'Processing': 'badge-amber',
      'In Stock': 'badge-emerald', 'Backordered': 'badge-red', 'Low Stock': 'badge-amber',
    },
    priority: { 'Rush': 'badge-red', 'High': 'badge-amber', 'Normal': 'badge-blue', 'Low': 'badge-slate' },
    severity: { 'light': 'severity-light', 'moderate': 'severity-moderate', 'heavy': 'severity-heavy' },
    type: { 'OEM': 'badge-blue', 'Aftermarket': 'badge-amber', 'Recycled': 'badge-emerald', 'Reman': 'badge-slate' },
    drp: { 'Active DRP': 'badge-emerald', 'Preferred': 'badge-blue', 'Standard': 'badge-slate' },
  }

  stx.registerBadgeMap = function(name, map) {
    badgeMaps[name] = Object.assign(badgeMaps[name] || {}, map)
  }

  stx.badgeClass = function(value, mapName) {
    var map = badgeMaps[mapName || 'status'] || badgeMaps.status
    return map[value] || 'badge-slate'
  }

  stx.badge = function(value, mapName) {
    return \`<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium \${stx.badgeClass(value, mapName)}">\${value}</span>\`
  }

  // ===== DETAIL PANEL BUILDER =====

  function esc(v) { return v != null ? v : '\\u2014' }

  stx.detail = {
    panel: function(opts) {
      if (!opts || !opts.title) return ''
      var badges = ''
      if (opts.badges) {
        opts.badges.forEach(function(b) { badges += stx.badge(b.text, b.map) })
      }
      return \`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-main)">
          <div>
            <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">\${opts.title}</h2>
            \${opts.subtitle ? \`<p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem">\${opts.subtitle}</p>\` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            \${badges}
            <button onclick="closeSlideOver()" style="padding:0.5rem;border-radius:0.5rem;color:var(--text-muted);background:none;border:none;cursor:pointer;font-size:1.5rem;line-height:1" aria-label="Close">&times;</button>
          </div>
        </div>\`
    },

    section: function(label, rows) {
      var inner = ''
      if (rows) {
        if (!Array.isArray(rows) && typeof rows === 'object') {
          Object.keys(rows).forEach(function(k) { inner += stx.detail.row(k, rows[k]) })
        } else {
          rows.forEach(function(r) {
            if (Array.isArray(r)) inner += stx.detail.row(r[0], r[1])
            else inner += stx.detail.row(r.label, r.value)
          })
        }
      }
      return \`
        <div class="detail-section">
          <div class="detail-label">\${label}</div>
          \${inner}
        </div>\`
    },

    row: function(label, value) {
      return \`
        <div class="detail-row">
          <span class="detail-row-label">\${label}</span>
          <span class="detail-row-value">\${esc(value)}</span>
        </div>\`
    },

    stats: function(items) {
      var list = Array.isArray(items)
        ? items
        : Object.keys(items).map(function(k) { return { label: k, value: items[k] } })

      var cards = list.map(function(item) {
        return \`
          <div style="padding:0.75rem;border-radius:0.5rem;background:var(--bg-subtle);text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">\${item.value}</div>
            <div style="font-size:0.6875rem;color:var(--text-muted);margin-top:0.25rem">\${item.label}</div>
          </div>\`
      }).join('')

      return \`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.75rem;padding:0 1.5rem 1rem">\${cards}</div>\`
    },

    timeline: function(items) {
      var entries = items.map(function(item, i) {
        var color = item.color || 'var(--text-accent)'
        var isLast = i === items.length - 1

        return \`
          <div style="display:flex;gap:0.75rem">
            <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
              <div style="width:10px;height:10px;border-radius:50%;background:\${color};flex-shrink:0"></div>
              \${!isLast ? '<div style="width:2px;flex:1;background:var(--bar-track);min-height:24px"></div>' : ''}
            </div>
            <div style="padding-bottom:\${isLast ? '0' : '1rem'};flex:1">
              <div style="font-size:0.8125rem;font-weight:500;color:var(--text-primary)">\${item.title}</div>
              \${item.description ? \`<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.125rem">\${item.description}</div>\` : ''}
              \${item.meta ? \`<div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:0.25rem">\${item.meta}</div>\` : ''}
            </div>
          </div>\`
      }).join('')

      return \`<div style="padding:0 1.5rem 1rem">\${entries}</div>\`
    },

    open: function(html) {
      if (typeof openSlideOver === 'function') openSlideOver(html)
    },
  }

  // ===== DATA TABLE HELPERS =====

  stx.table = {
    filter: function(opts) {
      var searchEl = document.getElementById(opts.searchId)
      var search = searchEl ? searchEl.value.toLowerCase() : ''
      var rows = document.querySelectorAll(opts.rowSelector || 'tbody tr')
      var filters = opts.filters || []
      var matched = []

      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase()
        var matchSearch = !search || text.indexOf(search) !== -1
        var matchFilters = filters.every(function(f) {
          var el = document.getElementById(f.id)
          if (!el) return true
          var val = el.value
          if (!val || val === f.allValue) return true
          return row.getAttribute(\`data-\${f.attr}\`) === val
        })

        if (matchSearch && matchFilters) matched.push(row)
        else row.style.display = 'none'
      })

      return matched
    },

    sort: function(rows, sortBy, direction) {
      direction = direction || 'asc'
      return rows.slice().sort(function(a, b) {
        var aVal = a.getAttribute(\`data-\${sortBy}\`) || a.textContent
        var bVal = b.getAttribute(\`data-\${sortBy}\`) || b.textContent
        var aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''))
        var bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''))
        if (!isNaN(aNum) && !isNaN(bNum)) return direction === 'asc' ? aNum - bNum : bNum - aNum
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    },
  }

  // ===== PAGINATION =====

  stx.pagination = function(opts) {
    var page = opts.page || 1
    var perPage = opts.perPage || 10
    var items = opts.items || []
    var total = items.length
    var totalPages = Math.max(1, Math.ceil(total / perPage))
    if (page > totalPages) page = totalPages

    var start = (page - 1) * perPage
    var end = Math.min(start + perPage, total)

    items.forEach(function(el, i) { el.style.display = (i >= start && i < end) ? '' : 'none' })

    var ids = { count: opts.countId, total: opts.totalId, empty: opts.emptyId, bar: opts.barId }
    if (ids.count) { var el = document.getElementById(ids.count); if (el) el.textContent = total === 0 ? '0' : \`\${start + 1}\\u2013\${end}\` }
    if (ids.total) { var el = document.getElementById(ids.total); if (el) el.textContent = total }
    if (ids.empty) { var el = document.getElementById(ids.empty); if (el) el.style.display = total === 0 ? 'block' : 'none' }
    if (ids.bar) { var el = document.getElementById(ids.bar); if (el) el.style.display = total === 0 ? 'none' : '' }

    if (opts.buttonsId) {
      var wrap = document.getElementById(opts.buttonsId)
      if (wrap) {
        var go = opts.goToPage
        var pages = stx.pagination.getPages(page, totalPages)

        var btn = function(label, target, disabled) {
          return \`<button onclick="\${go}(\${target})" \${disabled ? 'disabled' : ''}
            class="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style="background:var(--bg-subtle);border:1px solid var(--border-input);color:\${disabled ? 'var(--text-muted)' : 'var(--text-primary)'};opacity:\${disabled ? '0.5' : '1'}">\${label}</button>\`
        }

        var h = btn('Previous', page - 1, page === 1)
        pages.forEach(function(p) {
          if (p === '...') {
            h += '<span class="px-2 text-sm" style="color:var(--text-muted)">\\u2026</span>'
          } else if (p === page) {
            h += \`<button class="w-9 h-9 rounded-lg text-sm font-medium" style="background:var(--btn-primary-bg, var(--text-accent));color:#fff">\${p}</button>\`
          } else {
            h += btn(p, p, false)
          }
        })
        h += btn('Next', page + 1, page === totalPages)
        wrap.innerHTML = h
      }
    }

    return { page: page, totalPages: totalPages, total: total, start: start, end: end }
  }

  stx.pagination.getPages = function(current, total) {
    if (total <= 7) return Array.from({ length: total }, function(_, i) { return i + 1 })
    var pages = [1]
    if (current > 3) pages.push('...')
    for (var i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
  }

  // ===== UTILITIES =====

  stx.debounce = function(fn, delay) {
    var timer
    return function() {
      var args = arguments, ctx = this
      clearTimeout(timer)
      timer = setTimeout(function() { fn.apply(ctx, args) }, delay || 250)
    }
  }

})()
</script>
`
