/**
 * STX Story - Component Performance Profiling
 * Track render times, re-render counts, and memory usage
 */

/**
 * Performance metrics for a component
 */
export interface ComponentMetrics {
  /** Component ID */
  componentId: string
  /** Component name */
  componentName: string
  /** Render count */
  renderCount: number
  /** Total render time in ms */
  totalRenderTime: number
  /** Average render time in ms */
  avgRenderTime: number
  /** Min render time in ms */
  minRenderTime: number
  /** Max render time in ms */
  maxRenderTime: number
  /** Last render time in ms */
  lastRenderTime: number
  /** Memory usage in bytes (if available) */
  memoryUsage?: number
  /** Render history */
  history: RenderRecord[]
}

/**
 * Single render record
 */
export interface RenderRecord {
  /** Timestamp */
  timestamp: number
  /** Render duration in ms */
  duration: number
  /** Props that triggered render */
  props?: Record<string, any>
  /** Memory snapshot */
  memory?: number
}

/**
 * Performance profiler
 */
export class PerformanceProfiler {
  private metrics = new Map<string, ComponentMetrics>()
  private maxHistorySize = 100
  private enabled = true

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Record a render
   */
  recordRender(
    componentId: string,
    componentName: string,
    duration: number,
    props?: Record<string, any>,
  ): void {
    if (!this.enabled)
      return

    let metrics = this.metrics.get(componentId)

    if (!metrics) {
      metrics = {
        componentId,
        componentName,
        renderCount: 0,
        totalRenderTime: 0,
        avgRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        history: [],
      }
      this.metrics.set(componentId, metrics)
    }

    // Update metrics
    metrics.renderCount++
    metrics.totalRenderTime += duration
    metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount
    metrics.minRenderTime = Math.min(metrics.minRenderTime, duration)
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, duration)
    metrics.lastRenderTime = duration

    // Get memory if available
    const memory = this.getMemoryUsage()
    if (memory !== undefined) {
      metrics.memoryUsage = memory
    }

    // Add to history
    metrics.history.push({
      timestamp: Date.now(),
      duration,
      props,
      memory,
    })

    // Trim history
    if (metrics.history.length > this.maxHistorySize) {
      metrics.history = metrics.history.slice(-this.maxHistorySize)
    }
  }

  /**
   * Get metrics for a component
   */
  getMetrics(componentId: string): ComponentMetrics | undefined {
    return this.metrics.get(componentId)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): ComponentMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit = 10): ComponentMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime)
      .slice(0, limit)
  }

  /**
   * Get most rendered components
   */
  getMostRenderedComponents(limit = 10): ComponentMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, limit)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Clear metrics for a component
   */
  clearComponent(componentId: string): void {
    this.metrics.delete(componentId)
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize
    }
    return undefined
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.getAllMetrics(),
    }, null, 2)
  }

  /**
   * Create a render timer
   */
  createTimer(componentId: string, componentName: string): RenderTimer {
    return new RenderTimer(this, componentId, componentName)
  }
}

/**
 * Render timer helper
 */
export class RenderTimer {
  private startTime: number
  private props?: Record<string, any>

  constructor(
    private profiler: PerformanceProfiler,
    private componentId: string,
    private componentName: string,
  ) {
    this.startTime = performance.now()
  }

  /**
   * Set props for this render
   */
  setProps(props: Record<string, any>): this {
    this.props = props
    return this
  }

  /**
   * End timing and record
   */
  end(): number {
    const duration = performance.now() - this.startTime
    this.profiler.recordRender(
      this.componentId,
      this.componentName,
      duration,
      this.props,
    )
    return duration
  }
}

/**
 * Global profiler instance
 */
export const profiler: PerformanceProfiler = new PerformanceProfiler()

/**
 * Generate performance panel HTML
 */
export function getPerformancePanelHtml(metrics: ComponentMetrics[]): string {
  const rows = metrics.map(m => `
    <tr>
      <td>${m.componentName}</td>
      <td>${m.renderCount}</td>
      <td>${m.avgRenderTime.toFixed(2)}ms</td>
      <td>${m.minRenderTime.toFixed(2)}ms</td>
      <td>${m.maxRenderTime.toFixed(2)}ms</td>
      <td>${m.memoryUsage ? formatBytes(m.memoryUsage) : '-'}</td>
    </tr>
  `).join('')

  return `
    <div class="performance-panel">
      <div class="performance-header">
        <h3>Performance</h3>
        <button onclick="clearPerformanceMetrics()">Clear</button>
      </div>
      <table class="performance-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Renders</th>
            <th>Avg</th>
            <th>Min</th>
            <th>Max</th>
            <th>Memory</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" class="empty">No data</td></tr>'}
        </tbody>
      </table>
    </div>
  `
}

/**
 * Generate performance panel styles
 */
export function getPerformancePanelStyles(): string {
  return `
    .performance-panel {
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }
    .performance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .performance-header h3 {
      margin: 0;
      font-size: 14px;
    }
    .performance-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .performance-table th,
    .performance-table td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .performance-table th {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .performance-table .empty {
      text-align: center;
      color: var(--text-secondary);
      padding: 20px;
    }
  `
}

/**
 * Generate performance client script
 */
export function getPerformanceScript(): string {
  return `
<script>
window.__stxPerformance = {
  metrics: new Map(),

  recordRender(componentId, componentName, duration, props) {
    let m = this.metrics.get(componentId);
    if (!m) {
      m = {
        componentId,
        componentName,
        renderCount: 0,
        totalRenderTime: 0,
        avgRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        history: []
      };
      this.metrics.set(componentId, m);
    }

    m.renderCount++;
    m.totalRenderTime += duration;
    m.avgRenderTime = m.totalRenderTime / m.renderCount;
    m.minRenderTime = Math.min(m.minRenderTime, duration);
    m.maxRenderTime = Math.max(m.maxRenderTime, duration);
    m.lastRenderTime = duration;

    m.history.push({ timestamp: Date.now(), duration, props });
    if (m.history.length > 100) m.history.shift();

    this.updatePanel();
  },

  getMetrics() {
    return Array.from(this.metrics.values());
  },

  clear() {
    this.metrics.clear();
    this.updatePanel();
  },

  updatePanel() {
    const panel = document.getElementById('performance-panel');
    if (panel) {
      // Update panel content
      window.dispatchEvent(new CustomEvent('stx:performance-update', {
        detail: { metrics: this.getMetrics() }
      }));
    }
  },

  // Timer helper
  startTimer(componentId, componentName) {
    const start = performance.now();
    return {
      end: (props) => {
        const duration = performance.now() - start;
        this.recordRender(componentId, componentName, duration, props);
        return duration;
      }
    };
  }
};

window.clearPerformanceMetrics = () => window.__stxPerformance.clear();
</script>
`
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes}B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
