/**
 * Defer Directive
 *
 * Lazy loads content based on various triggers.
 *
 * Usage:
 * @defer(on: 'visible')
 *   <HeavyComponent />
 * @placeholder
 *   <Skeleton />
 * @loading
 *   <Spinner />
 * @error
 *   <div>Failed to load</div>
 * @enddefer
 *
 * Triggers:
 * - 'visible' - Load when element enters viewport (IntersectionObserver)
 * - 'idle' - Load when browser is idle (requestIdleCallback)
 * - 'interaction' - Load on first interaction (click, focus)
 * - 'hover' - Load on hover
 * - 'timer(ms)' - Load after specified milliseconds
 * - 'immediate' - Load immediately but async (default)
 */

interface DeferBlock {
  trigger: string
  triggerValue?: string
  content: string
  placeholder?: string
  loading?: string
  error?: string
}

let deferCounter = 0

/**
 * Generate a unique ID for defer blocks
 */
function generateDeferId(): string {
  return `stx-defer-${++deferCounter}`
}

/**
 * Parse defer directive and extract trigger
 */
function parseDeferTrigger(args: string): { trigger: string, value?: string } {
  // @defer(on: 'visible')
  // @defer(on: 'timer(2000)')
  // @defer(on: 'idle', threshold: 0.5)

  const onMatch = args.match(/on:\s*['"]?(\w+)(?:\((\d+)\))?['"]?/)
  if (onMatch) {
    return {
      trigger: onMatch[1],
      value: onMatch[2],
    }
  }

  // Default to immediate
  return { trigger: 'immediate' }
}

/**
 * Parse a defer block and extract all parts
 */
function parseDeferBlock(fullMatch: string, args: string, body: string): DeferBlock {
  const { trigger, value } = parseDeferTrigger(args)

  // Split body into sections
  let content = body
  let placeholder: string | undefined
  let loading: string | undefined
  let error: string | undefined

  // Extract @placeholder section
  const placeholderMatch = body.match(/@placeholder\s*([\s\S]*?)(?=@loading|@error|$)/)
  if (placeholderMatch) {
    placeholder = placeholderMatch[1].trim()
    content = content.replace(/@placeholder[\s\S]*?(?=@loading|@error|$)/, '')
  }

  // Extract @loading section
  const loadingMatch = body.match(/@loading\s*([\s\S]*?)(?=@error|$)/)
  if (loadingMatch) {
    loading = loadingMatch[1].trim()
    content = content.replace(/@loading[\s\S]*?(?=@error|$)/, '')
  }

  // Extract @error section
  const errorMatch = body.match(/@error(?:\s*\(\s*(\w+)\s*\))?\s*([\s\S]*)$/)
  if (errorMatch) {
    error = errorMatch[2].trim()
    content = content.replace(/@error(?:\s*\(\s*\w+\s*\))?[\s\S]*$/, '')
  }

  // Clean up content
  content = content.trim()

  return {
    trigger,
    triggerValue: value,
    content,
    placeholder,
    loading,
    error,
  }
}

/**
 * Generate the client-side script for defer functionality
 */
function generateDeferScript(id: string, block: DeferBlock): string {
  const { trigger, triggerValue } = block

  let triggerCode: string

  switch (trigger) {
    case 'visible':
      triggerCode = `
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            loadContent();
          }
        }, { threshold: 0.1 });
        observer.observe(container);
      `
      break

    case 'idle':
      triggerCode = `
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => loadContent(), { timeout: 3000 });
        } else {
          setTimeout(loadContent, 200);
        }
      `
      break

    case 'interaction':
      triggerCode = `
        const events = ['click', 'focus', 'touchstart'];
        const handler = () => {
          events.forEach(e => container.removeEventListener(e, handler));
          loadContent();
        };
        events.forEach(e => container.addEventListener(e, handler, { once: true, passive: true }));
      `
      break

    case 'hover':
      triggerCode = `
        const handler = () => {
          container.removeEventListener('mouseenter', handler);
          container.removeEventListener('focusin', handler);
          loadContent();
        };
        container.addEventListener('mouseenter', handler, { once: true });
        container.addEventListener('focusin', handler, { once: true });
      `
      break

    case 'timer':
      const delay = triggerValue || '1000'
      triggerCode = `
        setTimeout(loadContent, ${delay});
      `
      break

    case 'immediate':
    default:
      triggerCode = `
        Promise.resolve().then(loadContent);
      `
      break
  }

  return `
    <script>
    (function() {
      const container = document.getElementById('${id}');
      if (!container) return;

      const contentEl = container.querySelector('[data-defer-content]');
      const placeholderEl = container.querySelector('[data-defer-placeholder]');
      const loadingEl = container.querySelector('[data-defer-loading]');
      const errorEl = container.querySelector('[data-defer-error]');

      function showElement(el) {
        if (el) el.style.display = '';
      }
      function hideElement(el) {
        if (el) el.style.display = 'none';
      }

      function loadContent() {
        hideElement(placeholderEl);
        showElement(loadingEl);

        // Simulate async load (content is already rendered but hidden)
        Promise.resolve().then(() => {
          hideElement(loadingEl);
          showElement(contentEl);
          container.dispatchEvent(new CustomEvent('defer:loaded'));
        }).catch((err) => {
          hideElement(loadingEl);
          if (errorEl) {
            showElement(errorEl);
          }
          console.error('Defer load error:', err);
        });
      }

      ${triggerCode}
    })();
    </script>
  `
}

/**
 * Process @defer directives in template
 */
export function processDeferDirectives(
  template: string,
  _context: Record<string, unknown>,
  _filePath: string,
): string {
  // Reset counter for each template
  deferCounter = 0

  // Match @defer(...)...@enddefer
  const deferRegex = /@defer\s*\(([^)]*)\)\s*([\s\S]*?)@enddefer/g

  return template.replace(deferRegex, (fullMatch, args, body) => {
    const id = generateDeferId()
    const block = parseDeferBlock(fullMatch, args, body)

    // Build the output HTML
    const placeholderHtml = block.placeholder
      ? `<div data-defer-placeholder>${block.placeholder}</div>`
      : ''

    const loadingHtml = block.loading
      ? `<div data-defer-loading style="display: none;">${block.loading}</div>`
      : '<div data-defer-loading style="display: none;"></div>'

    const errorHtml = block.error
      ? `<div data-defer-error style="display: none;">${block.error}</div>`
      : ''

    const contentHtml = `<div data-defer-content style="display: none;">${block.content}</div>`

    const script = generateDeferScript(id, block)

    return `
      <div id="${id}" class="stx-defer" data-defer-trigger="${block.trigger}">
        ${placeholderHtml}
        ${loadingHtml}
        ${contentHtml}
        ${errorHtml}
      </div>
      ${script}
    `
  })
}
