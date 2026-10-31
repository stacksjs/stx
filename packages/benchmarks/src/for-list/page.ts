/**
 * Browser page for the keyed `:for` benchmark.
 *
 * The page embeds the production signals runtime, mounts one list and exposes
 * `window.bench.run(rows)`, which times each scenario with `performance.now()`
 * around the synchronous work. `requestAnimationFrame` is deliberately not
 * used: embedded browser panes throttle it to 1 Hz.
 *
 * Two row shapes, chosen with `?row=`:
 *
 *   simple (default)  ten elements and six bindings, no components, no `:if`
 *   todo              the row of a real to-do app: a `<template :for>` holding
 *                     two conditional `<li>`s, five listeners, function-call
 *                     bindings that read shared signals, `:if` children and a
 *                     nested `:for` of chips
 *   todo-editor       the same, whose second `<li>` holds a component of ~100
 *                     elements and its setup script (an inline editor)
 *
 * `?lazy=0` switches the shared row-branch optimisation off, to measure what it saves.
 * `?scope=N` pads the page scope with N extra names, because a real page holds
 * every name its components declare. `?prof=1` wraps the runtime's hot
 * functions with exclusive timers; read the table with `bench.profile()`.
 *
 * Every timing is the median of several runs after a warm-up, in milliseconds.
 * `script` is how long `signal.set()` takes to return (effects run
 * synchronously); `total` adds a forced style + layout, the cost the user
 * actually waits for before the next frame can paint.
 */
import { generateSignalsRuntime } from '../../../stx/src/signals'

const SIMPLE_ROW = `
    <li :for="t in rows" :key="t.id" class="row" :class="t.done ? 'row done' : 'row'">
      <button class="check" :aria-checked="t.done" type="button"><i class="box"></i></button>
      <span class="title" :text="t.title"></span>
      <span class="chip" :text="t.tag"></span>
      <span class="due" :text="t.due"></span>
      <div class="meta"><b :text="t.count"></b><em>{{ t.note }}</em></div>
    </li>`

// The inline editor a row carries but almost never shows: a component of about a
// hundred elements and its setup script, inside a row-level conditional.
const EDITOR = Array.from({ length: 24 }, (_, i) => `<div class="field" data-field="${i}"><label for="f${i}">Field ${i}</label><input id="f${i}" type="text" :value="draft()"><button type="button" class="b" @click="save()"><i class="ico"></i></button></div>`).join('')
const EDITOR_BRANCH = `<li class="card" :if="openId() === todo.id"><div data-stx-scope="stx_editor_1" data-stx-component-wrapper>${EDITOR}</div><script data-stx-scoped data-stx-run="always" data-stx-owner="stx_editor_1" client>(function(__scopeId){ var __s = window.stx._scopes = window.stx._scopes || {}; var v = __s[__scopeId] = __s[__scopeId] || {}; v.draft = window.stx.state(''); v.save = function () {}; })("stx_editor_1")</script></li>`

const TODO_ROW = `
    <template :for="todo in rows" :key="todo.id">
      <li class="row" :if="openId() !== todo.id" role="listitem" draggable="true"
          :data-state="rowState(todo)" @click="open(todo)" @dragstart="dragStart($event, todo)" @dragover="dragOver($event, todo)" @drop="dropOn($event, todo)" @dragend="dragEnd()">
        <button type="button" class="check" role="checkbox" :aria-checked="isDone(todo) ? 'true' : 'false'" :aria-label="safe((isDone(todo) ? 'Mark not done: ' : 'Complete: ') + todo.title)" @click="toggle($event, todo)">
          <i class="tick" aria-hidden="true"></i>
        </button>
        <div class="body">
          <button type="button" class="title"><span :text="safe(todo.title || 'New to-do')"></span><i class="ico" :if="todo.notes" aria-hidden="true"></i></button>
          <div class="meta" :if="chips(todo).length"><span class="chip" :for="chip in chips(todo)" :key="chip.key" :class="chip.tone"><i class="ico" :class="chip.icon" style="width: 13px; height: 13px" aria-hidden="true"></i><span :text="chip.text"></span></span></div>
        </div>
      </li>
      __EDITOR__
    </template>`

const TODO_SETUP = `
  var cursor = stx.state(null), fading = stx.state({}), dragging = stx.state(null), drop = stx.state(null), openId = stx.state(null)
  scope.openId = openId
  scope.safe = function (s) { return String(s).split('{{').join('{\\u200b{') }
  var isDone = function (todo) { return !!todo.completed_at || fading()[todo.id] !== undefined }
  scope.isDone = isDone
  scope.rowState = function (todo) {
    var s = ''
    if (cursor() === todo.id) s += ' cursor'
    if (isDone(todo)) s += ' done'
    var d = drop()
    if (d && d.id === todo.id) s += ' drop-' + (d.after ? 'after' : 'before')
    return s.trim()
  }
  scope.chips = function (todo) {
    var out = []
    if (todo.deadline && !todo.completed_at) out.push({ key: 'due', icon: 'i-flag', text: todo.deadline, tone: '' })
    if (todo.project) out.push({ key: 'project', icon: 'i-folder', text: scope.safe(todo.project), tone: '' })
    if (todo.checklist.length) out.push({ key: 'checks', icon: 'i-check', text: '0/' + todo.checklist.length, tone: '' })
    for (var i = 0; i < todo.tags.length; i++) out.push({ key: 'tag:' + todo.tags[i], icon: 'i-tag', text: todo.tags[i], tone: '' })
    return out
  }
  scope.open = function (todo) { cursor.set(todo.id) }
  scope.dragStart = scope.dragOver = scope.dropOn = scope.toggle = function () {}
  scope.dragEnd = function () { dragging.set(null); drop.set(null) }
  window.benchCursor = cursor`

const BENCH = `
  const shape = new URLSearchParams(location.search).get('row') || 'simple'
  const mk = (id, salt) => shape.startsWith('todo')
    ? { id, title: 'Task ' + id + (salt || ''), notes: id % 7 === 0 ? 'has notes' : '', deadline: id % 5 === 0 ? '2026-11-03' : null, completed_at: null, project: id % 4 === 0 ? 'Home' : '', tags: id % 3 === 0 ? ['work', 'home'] : [], checklist: id % 6 === 0 ? [{ done: false }] : [] }
    : { id, title: 'Task ' + id + (salt || ''), tag: 'tag' + (id % 7), due: 'D' + (id % 28), count: id % 100, done: id % 3 === 0, note: 'n' + id }
  const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
  const layout = () => document.body.offsetHeight
  let nextId = 1
  const fresh = (n) => Array.from({ length: n }, () => mk(nextId++))
  const touch = (r) => ({ ...r, title: 'changed ' + r.id })
  function time(setup, change, repeats) {
    const script = []
    const total = []
    for (let i = 0; i < repeats + 2; i++) {
      setup()
      layout()
      const t0 = performance.now()
      change()
      const t1 = performance.now()
      layout()
      const t2 = performance.now()
      if (i >= 2) { script.push(t1 - t0); total.push(t2 - t0) }
    }
    return { script: +median(script).toFixed(2), total: +median(total).toFixed(2) }
  }
  window.bench = {
    run(n, repeats = 7) {
      const rows = window.benchRows
      const out = {}
      const base = fresh(n)
      const reset = () => { rows.set([]); layout() }
      out.create = time(reset, () => rows.set(base.map(r => ({ ...r }))), repeats)
      rows.set(base)
      layout()
      out.swap = time(() => rows.set(base), () => { const a = base.slice(); const t = a[1]; a[1] = a[n - 2]; a[n - 2] = t; rows.set(a) }, repeats)
      out.partial = time(() => rows.set(base), () => { const a = base.slice(); for (let i = 0; i < 5; i++) a[i * 7 % n] = touch(a[i * 7 % n]); rows.set(a) }, repeats)
      out.unchanged = time(() => rows.set(base), () => rows.set(base.slice()), repeats)
      out.replaceAll = time(() => rows.set(base), () => rows.set(fresh(n)), repeats)
      out.removeOne = time(() => rows.set(base), () => rows.set(base.filter((_, i) => i !== (n >> 1))), repeats)
      out.clear = time(() => rows.set(base), () => rows.set([]), repeats)
      if (window.benchCursor) out.cursorMove = time(() => window.benchCursor.set(null), () => window.benchCursor.set(base[3].id), repeats)
      rows.set(base)
      layout()
      out.domRows = document.querySelectorAll('li.row').length
      return out
    },
    // Counts DOM mutations one change causes (attributes, text, child lists).
    mutations(n) {
      const rows = window.benchRows
      const base = fresh(n)
      rows.set(base); layout()
      const obs = new MutationObserver(() => {})
      obs.observe(document.getElementById('list'), { subtree: true, childList: true, attributes: true, characterData: true })
      const count = (fn) => { obs.takeRecords(); fn(); return obs.takeRecords().length }
      const res = {
        replaceAll: count(() => rows.set(fresh(n))),
        partial: count(() => { const a = rows().slice(); a[3] = touch(a[3]); rows.set(a) }),
        unchanged: count(() => rows.set(rows().slice())),
      }
      obs.disconnect()
      return res
    },
    // Exclusive time per runtime function, after ?prof=1, for one replaceAll.
    profile(n) {
      const rows = window.benchRows
      rows.set(fresh(n)); layout()
      window.__prof.reset()
      rows.set(fresh(n))
      return window.__prof.table()
    },
  }`

// Functions of the runtime that get exclusive timers under ?prof=1.
const PROFILED = [
  'processElement', 'bindIf', 'bindIfChain', 'bindFor', 'bindClass', 'bindStyle', 'bindModel', 'bindShow', 'effect',
  'mergeTemplateScopes', 'assignTemplateScope', 'findElementScope', 'createExpressionAutoUnwrapProxy',
  'createAutoUnwrapProxy', '__stxCompileScoped', '__stxArgs', '__stxNamesIn', 'parsePipeExpression', 'markLoopRow',
  'remapForComponentScopes', 'hydrateComponentScopes', 'deferRowConditionals', 'disposeSubtreeEffects',
  'disposeSubtreeScopes', 'trackEffects', 'getElementAttributes', 'isForeignToLoopRow', 'noteExprSuccess',
  'bindParentComponentProps', 'resolveComponentCallerScope', 'hasPendingAncestorLoopBoundary', 'hasPendingLoopBoundary',
  'findIfChain', 'followPlaceholder',
]

/** Wrap each named function declaration with an exclusive timer. */
function instrument(runtime: string): string {
  let out = runtime
  for (const name of PROFILED) {
    const pattern = new RegExp(`function ${name}\\(([^)]*)\\)\\s*\\{`)
    if (!pattern.test(out))
      continue
    out = out.replace(pattern, (_m, args) => `function ${name}(...__a) { return __prof.call('${name}', __orig_${name}, this, __a) }\n  function __orig_${name}(${args}) {`)
  }
  const prelude = `window.__prof = (function () {
  var stack = [], total = {}, calls = {}
  return {
    call: function (name, fn, self, args) {
      var t0 = performance.now()
      stack.push(0)
      try { return fn.apply(self, args) }
      finally {
        var inner = stack.pop()
        var dt = performance.now() - t0
        total[name] = (total[name] || 0) + (dt - inner)
        calls[name] = (calls[name] || 0) + 1
        if (stack.length) stack[stack.length - 1] += dt
      }
    },
    reset: function () { total = {}; calls = {} },
    table: function () { return Object.keys(total).map(function (k) { return [k, +total[k].toFixed(2), calls[k]] }).sort(function (a, b) { return b[1] - a[1] }) },
  }
})();\n`
  return prelude + out
}

export function benchPage(search = ''): string {
  const params = new URLSearchParams(search)
  const kind = params.get('row')
  const todo = kind === 'todo' || kind === 'todo-editor'
  const todoRow = TODO_ROW.replace('__EDITOR__', kind === 'todo-editor' ? EDITOR_BRANCH : '<li class="card" :if="openId() === todo.id">editor</li>')
  let runtime = generateSignalsRuntime()
  // ?lazy=0 turns the shared row-branch optimisation off, to measure what it saves.
  if (params.get('lazy') === '0')
    runtime = runtime.replace(/function shareHeavyRowBranches\(([\w$]+)\)\{/, 'function shareHeavyRowBranches($1){return;')
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>stx :for benchmark</title>
<style>.row{display:flex;gap:6px;padding:2px 4px;border-bottom:1px solid #ddd}.done{opacity:.6}body{font:12px system-ui}.meta{display:flex;gap:4px}</style></head>
<body><main data-stx="__stx_setup_bench"><ul id="list">${todo ? todoRow : SIMPLE_ROW}
</ul></main>
<script>
window.__stx_setup_bench = function () {
  window.benchRows = window.stx.state([])
  var scope = { rows: window.benchRows }
  // A real page scope holds every name its components declare. The merge that
  // gives each row and element its own scope copies all of them, so the size
  // of the scope is part of what a row costs: ?scope=400 models a large app.
  var extra = Number(new URLSearchParams(location.search).get('scope') || 0)
  for (var i = 0; i < extra; i++) scope['name' + i] = i % 3 === 0 ? window.stx.state(i) : i % 3 === 1 ? function () { return 1 } : { a: i }
  ${todo ? TODO_SETUP : ''}
  return scope
}
</script>
<script>${params.get('prof') ? instrument(runtime) : runtime}</script>
<script>document.addEventListener('DOMContentLoaded', function () { setTimeout(function () {${BENCH}
window.benchReady = true }, 0) })</script>
</body></html>`
}
