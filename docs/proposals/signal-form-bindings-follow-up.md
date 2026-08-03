# Signal form bindings follow-up

Observed while building Postline's campaign planner on 2026-08-02. This is a
small, reproducible client-signal issue worth turning into a regression test.

## False boolean bindings can remain present in structural clones

```stx
<template :if="editing()">
  <input :disabled="queuedId()" x-model="title">
</template>

<script client>
const editing = state(false)
const queuedId = state(0)
const title = state('Draft title')
</script>
```

Expected: when `editing` becomes true and `queuedId()` is `0`, the input is
enabled.

Observed: the cloned input had its native `disabled` property set and appeared
as disabled in the accessibility tree even though the expression was false.
Other controls in the same panel showed the same behavior.

The application workaround renders queued and editable states separately and
does not use a reactive boolean attribute for those controls. Regression tests
should verify property and attribute removal for `disabled`, `required`,
`readonly`, `checked`, and `selected` when structural templates mount and when
their source signals change.
