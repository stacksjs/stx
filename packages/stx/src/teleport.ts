/**
 * Teleport Directive
 *
 * Moves content to a different location in the DOM.
 * Useful for modals, tooltips, notifications that need to escape
 * their parent's stacking context.
 *
 * Usage:
 * @teleport('#modals')
 *   <div class="modal">Modal content</div>
 * @endteleport
 *
 * With disabled state:
 * @teleport('#modals', disabled: isInline)
 *   <div class="modal">Modal content</div>
 * @endteleport
 *
 * Multiple targets:
 * @teleport('body')  - Appends to body
 * @teleport('#app')  - Appends to #app element
 * @teleport('.modals-container')  - Appends to first matching element
 */

let teleportCounter = 0

/**
 * Generate a unique ID for teleport blocks
 */
function generateTeleportId(): string {
  return `stx-teleport-${++teleportCounter}`
}

/**
 * Parse teleport directive arguments
 */
function parseTeleportArgs(args: string): { target: string, disabled?: string } {
  // @teleport('#modals')
  // @teleport('#modals', disabled: isInline)
  // @teleport('body', disabled: false)

  const parts = args.split(',').map(p => p.trim())

  // First part is the target selector
  const target = parts[0].replace(/['"]/g, '')

  // Check for disabled option
  let disabled: string | undefined
  for (let i = 1; i < parts.length; i++) {
    const disabledMatch = parts[i].match(/disabled:\s*(.+)/)
    if (disabledMatch) {
      disabled = disabledMatch[1].trim()
    }
  }

  return { target, disabled }
}

/**
 * Generate the client-side script for teleport functionality
 */
function generateTeleportScript(id: string, target: string): string {
  return `
    <script>
    (function() {
      const source = document.getElementById('${id}');
      if (!source) return;

      const targetEl = document.querySelector('${target}');
      if (!targetEl) {
        console.warn('[stx] Teleport target not found: ${target}');
        return;
      }

      // Get the content template
      const template = source.querySelector('template');
      if (!template) return;

      // Clone and append content to target
      const content = template.content.cloneNode(true);

      // Create a wrapper to track teleported content
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-teleport-from', '${id}');
      wrapper.appendChild(content);

      targetEl.appendChild(wrapper);

      // Remove the source placeholder
      source.remove();

      // Dispatch event for tracking
      wrapper.dispatchEvent(new CustomEvent('teleport:mounted', {
        bubbles: true,
        detail: { sourceId: '${id}', target: '${target}' }
      }));
    })();
    </script>
  `
}

/**
 * Process @teleport directives in template
 */
export function processTeleportDirectives(
  template: string,
  context: Record<string, unknown>,
  _filePath: string,
): string {
  // Reset counter for each template
  teleportCounter = 0

  // Match @teleport(...)...@endteleport
  const teleportRegex = /@teleport\s*\(([^)]+)\)\s*([\s\S]*?)@endteleport/g

  return template.replace(teleportRegex, (fullMatch, args, body) => {
    const id = generateTeleportId()
    const { target, disabled } = parseTeleportArgs(args)
    const content = body.trim()

    // Check if teleport is disabled
    if (disabled) {
      // Try to evaluate the disabled condition
      try {
        // Simple evaluation - check if it's a boolean or context variable
        let isDisabled = false

        if (disabled === 'true') {
          isDisabled = true
        }
        else if (disabled === 'false') {
          isDisabled = false
        }
        else if (disabled in context) {
          isDisabled = Boolean(context[disabled])
        }

        if (isDisabled) {
          // If disabled, render content in place without teleporting
          return `<div class="stx-teleport-inline" data-teleport-disabled>${content}</div>`
        }
      }
      catch {
        // If evaluation fails, proceed with teleport
      }
    }

    // Generate the teleport structure
    // Content is wrapped in a template to prevent it from rendering in place
    const script = generateTeleportScript(id, target)

    return `
      <div id="${id}" class="stx-teleport-source" style="display: none;">
        <template>${content}</template>
      </div>
      ${script}
    `
  })
}

/**
 * Ensure teleport targets exist in the document
 * Call this to create common teleport targets if they don't exist
 */
export function ensureTeleportTargets(): string {
  return `
    <script>
    (function() {
      // Common teleport targets
      const targets = ['#stx-modals', '#stx-tooltips', '#stx-notifications'];

      targets.forEach(selector => {
        const id = selector.slice(1); // Remove #
        if (!document.getElementById(id)) {
          const el = document.createElement('div');
          el.id = id;
          el.setAttribute('data-teleport-container', '');
          document.body.appendChild(el);
        }
      });
    })();
    </script>
  `
}
