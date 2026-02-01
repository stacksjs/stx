# Unified Chat

A unified messaging application built with stx, similar to [texts.com](https://texts.com/). Connects multiple messaging platforms (iMessage, WhatsApp, Slack, Discord, Telegram, Signal) through a single UI with a unified inbox.

## Running

```bash
# Web version (browser)
stx dev examples/unified-chat/chat.stx

# Native desktop version with macOS Tahoe sidebar
stx dev examples/unified-chat/chat.stx --native
```

The `--native` flag uses Craft to open a native window with a real macOS Tahoe-style sidebar (using `NSOutlineView` with vibrancy effects).

## Native Sidebar

The app uses a `<Sidebar>` component with `variant="tahoe"` that automatically integrates with Craft:

```html
<script server>
// SF Symbol icon mappings for native macOS sidebar
const icons = {
  inbox: 'tray.fill',
  unread: 'envelope.badge.fill',
  imessage: 'message.fill',
  // ... more SF Symbols
}

// Sidebar configuration
const sidebarConfig = {
  header: {
    title: 'Unified Chat',
    subtitle: 'All messages, one place',
    icon: icons.imessage
  },
  sections: [
    {
      id: 'inbox',
      title: 'Inbox',
      items: [
        { id: 'all', label: 'All Messages', icon: icons.inbox, badge: 68 },
        { id: 'unread', label: 'Unread', icon: icons.unread, badge: 21 }
      ]
    },
    // ... more sections
  ]
}
</script>

<!-- Sidebar component - renders natively with Craft, CSS fallback in browser -->
<Sidebar
  variant="tahoe"
  :header="sidebarConfig.header"
  :sections="sidebarConfig.sections"
  :width="260"
/>
```

### How It Works

1. **Web Mode**: The `<Sidebar>` component renders a CSS-based sidebar with vibrancy effects using `backdrop-filter`
2. **Native Mode** (`--native`):
   - stx extracts the `sidebarConfig` from your server script
   - Craft renders a true native `NSOutlineView` sidebar
   - The web sidebar component detects native mode and does NOT render (Craft handles it)
   - Icons use SF Symbols for native macOS appearance

### Sidebar Selection Handler

Handle sidebar item clicks in your client script:

```html
<script client>
// Craft calls this when user clicks a sidebar item
window.craft = window.craft || {};
window.craft._sidebarSelectHandler = function(event) {
  console.log('Selected:', event.itemId, event.item);
  // Update your app state based on selection
};
</script>
```

## Features

- **Unified Inbox** - All messages from all platforms in one place
- **Native macOS Sidebar** - Real Tahoe-style vibrancy when using `--native`
- **Platform Indicators** - Visual badges showing message source
- **Conversation List** - Pinned conversations, unread badges, online status
- **Rich Chat UI** - Message bubbles, typing indicators
- **Keyboard Shortcuts** - Cmd+K for search, Enter to send

## Platform Support

| Platform | SF Symbol | Color |
|----------|-----------|-------|
| iMessage | message.fill | #34C759 |
| WhatsApp | phone.fill | #25D366 |
| Slack | number.square.fill | #4A154B |
| Discord | gamecontroller.fill | #5865F2 |
| Telegram | paperplane.fill | #0088cc |
| Signal | shield.fill | #3A76F0 |

## Architecture

Three-pane layout:

1. **Native Sidebar** (260px) - Uses Craft for native rendering with `--native`
2. **Conversation List** (320px) - Conversations with previews
3. **Chat Pane** (flexible) - Messages and input

Web fallback uses CSS `backdrop-filter` for vibrancy when not running native.

## Component Location

The `<Sidebar>` component can be found in:
- Local: `examples/unified-chat/components/Sidebar.stx` (app-specific)
- Package: `packages/components/src/ui/sidebar/` (reusable)

Both support the same props and automatically detect native vs web mode.
