# Live Activities on iOS

Craft hosts with Live Activities enabled advertise the `liveActivities`
capability. Native screens receive `craft.liveActivity` for real ActivityKit
Lock Screen and Dynamic Island presentations. Unsupported hosts have no service.

For a session whose reactive state changes, use the scoped controller:

```ts
import { createLiveActivity } from '@stacksjs/stx/native/live-activity'

const activity = createLiveActivity(craft.liveActivity, error => console.warn(error))
await activity.update({
  activityId: 'session-42',
  title: 'Practice',
  status: 'In progress',
  timerStartedAt: Date.now(),
  showsDistance: false,
  symbol: 'timer',
  deepLink: 'myapp://session/42',
})
await activity.update(null) // ends this exact activity
```

The controller serializes native work, coalesces pending updates, and ends a
late start if the session stopped meanwhile. Replacing its application
`activityId` ends the previous activity first. Identical states do not trigger
native updates. A missing bridge is a no-op; it never returns a simulated ID.

Times are epoch milliseconds. Native SwiftUI date views advance without per-second
JavaScript updates. Publish pause/resume, current step, and metric changes from
the session's own state. On pause, freeze `durationSeconds` or `remainingSeconds`,
set `paused`, and clear timer anchors with `null`. End on completion, discard,
and sign-out. Keeping an activity across navigation is an application lifecycle
choice; destroying a screen does not implicitly end a session.

A system-rendered timer does not keep application JavaScript running or execute
future step transitions. Set `staleAt` and a localized `staleStatus` when the
snapshot can become outdated. Native `list()` and stable application activity IDs
allow relaunch reconciliation without creating duplicates.
