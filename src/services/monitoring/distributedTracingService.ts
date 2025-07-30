/**
 * Distributed Tracing Service - FAANG Level Implementation
 * Provides end-to-end request tracing across microservices
 */

interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  tags: Record<string, any>;
  logs: TraceLog[];
  baggageItems: Record<string, string>;
}

interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

interface TraceContext {
  traceId: string;
  spanId: string;
  baggageItems: Record<string, string>;
}

interface TracingMetrics {
  totalSpans: number;
  activeSpans: number;
  errorRate: number;
  averageDuration: number;
  throughput: number;
  serviceMetrics: Record<string, {
    spanCount: number;
    errorCount: number;
    averageDuration: number;
  }>;
}

export class DistributedTracingService {
  private spans: Map<string, TraceSpan> = new Map();
  private activeTraces: Map<string, TraceSpan[]> = new Map();
  private metricsBuffer: TraceSpan[] = [];
  private tracingEnabled: boolean = true;
  private samplingRate: number = 1.0; // 100% sampling by default

  constructor() {
    console.log('🔍 Distributed Tracing Service initialized');
    this.startMetricsCollection();
  }

  /**
   * Start a new trace
   */
  startTrace(operationName: string, serviceName: string, tags: Record<string, any> = {}): TraceContext {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const span: TraceSpan = {
      spanId,
      traceId,
      operationName,
      serviceName,
      startTime: Date.now(),
      status: 'pending',
      tags: {
        'service.name': serviceName,
        'operation.name': operationName,
        ...tags
      },
      logs: [],
      baggageItems: {}
    };

    this.spans.set(spanId, span);
    
    if (!this.activeTraces.has(traceId)) {
      this.activeTraces.set(traceId, []);
    }
    this.activeTraces.get(traceId)!.push(span);

    console.log(`🔍 Started trace: ${traceId} for ${serviceName}:${operationName}`);

    return {
      traceId,
      spanId,
      baggageItems: {}
    };
  }

  /**
   * Start a child span
   */
  startChildSpan(
    parentContext: TraceContext,
    operationName: string,
    serviceName: string,
    tags: Record<string, any> = {}
  ): TraceContext {
    const spanId = this.generateSpanId();
    
    const span: TraceSpan = {
      spanId,
      traceId: parentContext.traceId,
      parentSpanId: parentContext.spanId,
      operationName,
      serviceName,
      startTime: Date.now(),
      status: 'pending',
      tags: {
        'service.name': serviceName,
        'operation.name': operationName,
        'parent.span.id': parentContext.spanId,
        ...tags
      },
      logs: [],
      baggageItems: { ...parentContext.baggageItems }
    };

    this.spans.set(spanId, span);
    this.activeTraces.get(parentContext.traceId)?.push(span);

    return {
      traceId: parentContext.traceId,
      spanId,
      baggageItems: span.baggageItems
    };
  }

  /**
   * Finish a span
   */
  finishSpan(context: TraceContext, status: 'success' | 'error' = 'success', error?: Error): void {
    const span = this.spans.get(context.spanId);
    if (!span) {
      console.warn(`⚠️ Span not found: ${context.spanId}`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.tags['error'] = true;
      span.tags['error.message'] = error.message;
      span.tags['error.stack'] = error.stack;
      this.addLog(context, 'error', error.message, { error: error.stack });
    }

    // Add to metrics buffer
    this.metricsBuffer.push({ ...span });

    console.log(`✅ Finished span: ${context.spanId} (${span.duration}ms) - ${status}`);
  }

  /**
   * Add a log to a span
   */
  addLog(
    context: TraceContext,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, any>
  ): void {
    const span = this.spans.get(context.spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
  }

  /**
   * Set baggage item
   */
  setBaggageItem(context: TraceContext, key: string, value: string): void {
    const span = this.spans.get(context.spanId);
    if (!span) return;

    span.baggageItems[key] = value;
  }

  /**
   * Get baggage item
   */
  getBaggageItem(context: TraceContext, key: string): string | undefined {
    const span = this.spans.get(context.spanId);
    return span?.baggageItems[key];
  }

  /**
   * Set span tag
   */
  setTag(context: TraceContext, key: string, value: any): void {
    const span = this.spans.get(context.spanId);
    if (!span) return;

    span.tags[key] = value;
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): TraceSpan[] | undefined {
    return this.activeTraces.get(traceId);
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): TraceSpan | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get traces by service
   */
  getTracesByService(serviceName: string, limit: number = 50): TraceSpan[][] {
    const serviceTraces: TraceSpan[][] = [];
    
    for (const spans of this.activeTraces.values()) {
      const serviceSpans = spans.filter(span => span.serviceName === serviceName);
      if (serviceSpans.length > 0) {
        serviceTraces.push(spans);
        if (serviceTraces.length >= limit) break;
      }
    }

    return serviceTraces;
  }

  /**
   * Search traces by operation
   */
  searchTraces(query: {
    serviceName?: string;
    operationName?: string;
    tags?: Record<string, any>;
    minDuration?: number;
    maxDuration?: number;
    status?: 'success' | 'error';
    timeRange?: { start: number; end: number };
  }): TraceSpan[][] {
    const results: TraceSpan[][] = [];

    for (const spans of this.activeTraces.values()) {
      const matchingSpans = spans.filter(span => {
        // Service name filter
        if (query.serviceName && span.serviceName !== query.serviceName) {
          return false;
        }

        // Operation name filter
        if (query.operationName && span.operationName !== query.operationName) {
          return false;
        }

        // Status filter
        if (query.status && span.status !== query.status) {
          return false;
        }

        // Duration filters
        if (span.duration) {
          if (query.minDuration && span.duration < query.minDuration) {
            return false;
          }
          if (query.maxDuration && span.duration > query.maxDuration) {
            return false;
          }
        }

        // Time range filter
        if (query.timeRange) {
          if (span.startTime < query.timeRange.start || span.startTime > query.timeRange.end) {
            return false;
          }
        }

        // Tags filter
        if (query.tags) {
          for (const [key, value] of Object.entries(query.tags)) {
            if (span.tags[key] !== value) {
              return false;
            }
          }
        }

        return true;
      });

      if (matchingSpans.length > 0) {
        results.push(spans);
      }
    }

    return results;
  }

  /**
   * Get tracing metrics
   */
  getMetrics(): TracingMetrics {
    const now = Date.now();
    const recentSpans = this.metricsBuffer.filter(span => 
      span.endTime && (now - span.endTime) < 300000 // Last 5 minutes
    );

    const serviceMetrics: Record<string, { spanCount: number; errorCount: number; averageDuration: number }> = {};
    
    for (const span of recentSpans) {
      if (!serviceMetrics[span.serviceName]) {
        serviceMetrics[span.serviceName] = {
          spanCount: 0,
          errorCount: 0,
          averageDuration: 0
        };
      }

      const metrics = serviceMetrics[span.serviceName];
      metrics.spanCount++;
      
      if (span.status === 'error') {
        metrics.errorCount++;
      }

      if (span.duration) {
        metrics.averageDuration = 
          (metrics.averageDuration * (metrics.spanCount - 1) + span.duration) / metrics.spanCount;
      }
    }

    const totalSpans = recentSpans.length;
    const errorSpans = recentSpans.filter(span => span.status === 'error').length;
    const totalDuration = recentSpans.reduce((sum, span) => sum + (span.duration || 0), 0);

    return {
      totalSpans,
      activeSpans: this.spans.size,
      errorRate: totalSpans > 0 ? (errorSpans / totalSpans) * 100 : 0,
      averageDuration: totalSpans > 0 ? totalDuration / totalSpans : 0,
      throughput: totalSpans / 5, // spans per minute (5-minute window)
      serviceMetrics
    };
  }

  /**
   * Create trace context from HTTP headers
   */
  extractTraceContext(headers: Record<string, string>): TraceContext | null {
    const traceId = headers['x-trace-id'] || headers['X-Trace-Id'];
    const spanId = headers['x-span-id'] || headers['X-Span-Id'];
    const baggage = headers['x-baggage'] || headers['X-Baggage'];

    if (!traceId || !spanId) {
      return null;
    }

    const baggageItems: Record<string, string> = {};
    if (baggage) {
      baggage.split(',').forEach(item => {
        const [key, value] = item.trim().split('=');
        if (key && value) {
          baggageItems[key] = decodeURIComponent(value);
        }
      });
    }

    return {
      traceId,
      spanId,
      baggageItems
    };
  }

  /**
   * Inject trace context into HTTP headers
   */
  injectTraceContext(context: TraceContext): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Trace-Id': context.traceId,
      'X-Span-Id': context.spanId
    };

    if (Object.keys(context.baggageItems).length > 0) {
      const baggage = Object.entries(context.baggageItems)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join(',');
      headers['X-Baggage'] = baggage;
    }

    return headers;
  }

  /**
   * Set sampling rate
   */
  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
    console.log(`🎯 Tracing sampling rate set to ${(this.samplingRate * 100).toFixed(1)}%`);
  }

  /**
   * Check if trace should be sampled
   */
  shouldSample(): boolean {
    return Math.random() < this.samplingRate;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      // Clean up old spans
      const cutoff = Date.now() - 3600000; // 1 hour
      
      for (const [spanId, span] of this.spans.entries()) {
        if (span.endTime && span.endTime < cutoff) {
          this.spans.delete(spanId);
        }
      }

      // Clean up completed traces
      for (const [traceId, spans] of this.activeTraces.entries()) {
        const allCompleted = spans.every(span => span.endTime);
        const oldestSpan = Math.min(...spans.map(span => span.startTime));
        
        if (allCompleted && oldestSpan < cutoff) {
          this.activeTraces.delete(traceId);
        }
      }

      // Clean up metrics buffer
      this.metricsBuffer = this.metricsBuffer.filter(span => 
        span.endTime && span.endTime > cutoff
      );

    }, 300000); // Every 5 minutes
  }

  /**
   * Enable/disable tracing
   */
  setTracingEnabled(enabled: boolean): void {
    this.tracingEnabled = enabled;
    console.log(`🔍 Distributed tracing ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get tracing status
   */
  getStatus(): {
    enabled: boolean;
    samplingRate: number;
    activeSpans: number;
    activeTraces: number;
    metricsBufferSize: number;
  } {
    return {
      enabled: this.tracingEnabled,
      samplingRate: this.samplingRate,
      activeSpans: this.spans.size,
      activeTraces: this.activeTraces.size,
      metricsBufferSize: this.metricsBuffer.length
    };
  }

  /**
   * Shutdown tracing service
   */
  shutdown(): void {
    this.spans.clear();
    this.activeTraces.clear();
    this.metricsBuffer = [];
    console.log('🛑 Distributed Tracing Service shut down');
  }
}

// Global singleton
export const distributedTracingService = new DistributedTracingService();