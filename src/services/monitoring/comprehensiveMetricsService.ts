/**
 * Comprehensive Metrics Collection Service - FAANG Level Implementation
 * Provides system-wide metrics, monitoring, and alerting
 */

interface MetricValue {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

interface MetricConfig {
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  description: string;
  unit?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  retention?: number; // seconds
}

interface AlertRule {
  id: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[]; // notification channels
}

interface MetricAlert {
  id: string;
  ruleId: string;
  metricName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: number;
  resolvedAt?: number;
  status: 'active' | 'resolved';
  value: number;
  threshold: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    heap: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
  application: {
    requestsPerSecond: number;
    errorRate: number;
    responseTime: number;
    activeUsers: number;
  };
}

export class ComprehensiveMetricsService {
  private metrics: Map<string, MetricValue[]> = new Map();
  private configs: Map<string, MetricConfig> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, MetricAlert> = new Map();
  private systemMetrics: SystemMetrics;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.systemMetrics = this.initializeSystemMetrics();
    console.log('📊 Comprehensive Metrics Service initialized');
    this.startMetricsCollection();
    this.setupDefaultMetrics();
    this.setupDefaultAlerts();
  }

  /**
   * Register a metric
   */
  registerMetric(name: string, config: MetricConfig): void {
    this.configs.set(name, config);
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    console.log(`📈 Registered metric: ${name} (${config.type})`);
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const config = this.configs.get(name);
    if (!config) {
      console.warn(`⚠️ Metric not registered: ${name}`);
      return;
    }

    const metricValue: MetricValue = {
      timestamp: Date.now(),
      value,
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(metricValue);

    // Apply retention policy
    const retentionMs = (config.retention || 86400) * 1000; // Default 24 hours
    const cutoff = Date.now() - retentionMs;
    const filtered = values.filter(v => v.timestamp > cutoff);
    this.metrics.set(name, filtered);

    // Check alert rules
    this.checkAlertRules(name, value);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, amount: number = 1, tags?: Record<string, string>): void {
    const current = this.getCurrentValue(name) || 0;
    this.recordMetric(name, current + amount, tags);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record a timer/histogram metric
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric(name, duration, tags);
  }

  /**
   * Start a timer and return a function to end it
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordTiming(name, duration, tags);
    };
  }

  /**
   * Get current metric value
   */
  getCurrentValue(name: string, tags?: Record<string, string>): number | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    if (tags) {
      const filtered = values.filter(v => 
        v.tags && Object.entries(tags).every(([key, value]) => v.tags![key] === value)
      );
      return filtered.length > 0 ? filtered[filtered.length - 1].value : null;
    }

    return values[values.length - 1].value;
  }

  /**
   * Get metric values within time range
   */
  getMetricValues(
    name: string,
    startTime: number,
    endTime: number,
    tags?: Record<string, string>
  ): MetricValue[] {
    const values = this.metrics.get(name) || [];
    
    let filtered = values.filter(v => 
      v.timestamp >= startTime && v.timestamp <= endTime
    );

    if (tags) {
      filtered = filtered.filter(v => 
        v.tags && Object.entries(tags).every(([key, value]) => v.tags![key] === value)
      );
    }

    return filtered;
  }

  /**
   * Calculate aggregated metric value
   */
  getAggregatedValue(
    name: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    startTime: number,
    endTime: number,
    tags?: Record<string, string>
  ): number {
    const values = this.getMetricValues(name, startTime, endTime, tags);
    
    if (values.length === 0) return 0;

    const nums = values.map(v => v.value);

    switch (aggregation) {
      case 'sum':
        return nums.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return nums.reduce((sum, val) => sum + val, 0) / nums.length;
      case 'min':
        return Math.min(...nums);
      case 'max':
        return Math.max(...nums);
      case 'count':
        return nums.length;
      default:
        return 0;
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  /**
   * Create alert rule
   */
  createAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`🚨 Created alert rule: ${rule.id} for metric ${rule.metricName}`);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    console.log(`🔄 Updated alert rule: ${ruleId}`);
    return true;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): boolean {
    const deleted = this.alertRules.delete(ruleId);
    if (deleted) {
      console.log(`❌ Deleted alert rule: ${ruleId}`);
    }
    return deleted;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MetricAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): MetricAlert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, limit);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    console.log(`✅ Resolved alert: ${alertId}`);
    return true;
  }

  /**
   * Get metrics dashboard data
   */
  getDashboardData(timeRange: number = 3600000): {
    systemMetrics: SystemMetrics;
    applicationMetrics: Record<string, any>;
    alerts: MetricAlert[];
    topMetrics: Array<{ name: string; value: number; trend: 'up' | 'down' | 'stable' }>;
  } {
    const now = Date.now();
    const startTime = now - timeRange;

    const applicationMetrics: Record<string, any> = {};
    
    // Get key application metrics
    const keyMetrics = [
      'requests_total',
      'requests_duration',
      'error_rate',
      'active_users',
      'cpu_usage',
      'memory_usage'
    ];

    for (const metric of keyMetrics) {
      if (this.metrics.has(metric)) {
        applicationMetrics[metric] = {
          current: this.getCurrentValue(metric),
          avg: this.getAggregatedValue(metric, 'avg', startTime, now),
          max: this.getAggregatedValue(metric, 'max', startTime, now),
          values: this.getMetricValues(metric, startTime, now)
        };
      }
    }

    // Calculate trends
    const topMetrics = keyMetrics.map(name => {
      const current = this.getCurrentValue(name) || 0;
      const previous = this.getAggregatedValue(name, 'avg', startTime, now - timeRange / 2) || 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (current > previous * 1.1) trend = 'up';
      else if (current < previous * 0.9) trend = 'down';

      return { name, value: current, trend };
    }).filter(m => m.value > 0);

    return {
      systemMetrics: this.systemMetrics,
      applicationMetrics,
      alerts: this.getActiveAlerts(),
      topMetrics
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = '';
    
    for (const [name, config] of this.configs.entries()) {
      const values = this.metrics.get(name) || [];
      const latestValue = values[values.length - 1];
      
      if (latestValue) {
        output += `# HELP ${name} ${config.description}\n`;
        output += `# TYPE ${name} ${config.type}\n`;
        
        if (latestValue.tags) {
          const tagString = Object.entries(latestValue.tags)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
          output += `${name}{${tagString}} ${latestValue.value}\n`;
        } else {
          output += `${name} ${latestValue.value}\n`;
        }
      }
    }
    
    return output;
  }

  /**
   * Check alert rules for a metric
   */
  private checkAlertRules(metricName: string, value: number): void {
    for (const rule of this.alertRules.values()) {
      if (rule.metricName !== metricName || !rule.enabled) continue;

      const shouldAlert = this.evaluateCondition(rule.condition, value, rule.threshold);
      
      if (shouldAlert) {
        this.triggerAlert(rule, value);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: MetricAlert = {
      id: alertId,
      ruleId: rule.id,
      metricName: rule.metricName,
      message: `Metric ${rule.metricName} ${rule.condition} ${rule.threshold} (current: ${value})`,
      severity: rule.severity,
      triggeredAt: Date.now(),
      status: 'active',
      value,
      threshold: rule.threshold
    };

    this.activeAlerts.set(alertId, alert);
    console.warn(`🚨 Alert triggered: ${alert.message}`);

    // TODO: Send notifications to configured channels
    this.sendNotification(alert, rule.channels);
  }

  /**
   * Send alert notification
   */
  private sendNotification(alert: MetricAlert, channels: string[]): void {
    // Implementation would depend on configured notification channels
    // (email, Slack, webhooks, etc.)
    console.log(`📢 Alert ${alert.id}: ${alert.message} -> ${channels.join(', ')}`);
  }

  /**
   * Initialize system metrics structure
   */
  private initializeSystemMetrics(): SystemMetrics {
    return {
      cpu: { usage: 0, load1m: 0, load5m: 0, load15m: 0 },
      memory: { used: 0, total: 0, usage: 0, heap: 0 },
      network: { bytesIn: 0, bytesOut: 0, connectionsActive: 0 },
      application: { requestsPerSecond: 0, errorRate: 0, responseTime: 0, activeUsers: 0 }
    };
  }

  /**
   * Setup default metrics
   */
  private setupDefaultMetrics(): void {
    const defaultMetrics = [
      { name: 'requests_total', config: { type: 'counter' as const, description: 'Total number of requests' } },
      { name: 'requests_duration', config: { type: 'histogram' as const, description: 'Request duration in milliseconds', unit: 'ms' } },
      { name: 'error_rate', config: { type: 'gauge' as const, description: 'Error rate percentage', unit: '%' } },
      { name: 'active_users', config: { type: 'gauge' as const, description: 'Number of active users' } },
      { name: 'cpu_usage', config: { type: 'gauge' as const, description: 'CPU usage percentage', unit: '%' } },
      { name: 'memory_usage', config: { type: 'gauge' as const, description: 'Memory usage percentage', unit: '%' } },
      { name: 'disk_usage', config: { type: 'gauge' as const, description: 'Disk usage percentage', unit: '%' } },
      { name: 'network_throughput', config: { type: 'gauge' as const, description: 'Network throughput in bytes/sec', unit: 'bytes/s' } }
    ];

    for (const { name, config } of defaultMetrics) {
      this.registerMetric(name, config);
    }
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlerts(): void {
    const defaultAlerts: AlertRule[] = [
      {
        id: 'high-error-rate',
        metricName: 'error_rate',
        condition: 'gt',
        threshold: 5,
        duration: 300,
        severity: 'high',
        enabled: true,
        channels: ['console']
      },
      {
        id: 'high-cpu-usage',
        metricName: 'cpu_usage',
        condition: 'gt',
        threshold: 80,
        duration: 600,
        severity: 'medium',
        enabled: true,
        channels: ['console']
      },
      {
        id: 'high-memory-usage',
        metricName: 'memory_usage',
        condition: 'gt',
        threshold: 85,
        duration: 300,
        severity: 'medium',
        enabled: true,
        channels: ['console']
      }
    ];

    for (const alert of defaultAlerts) {
      this.createAlertRule(alert);
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Mock system metrics collection
    // In a real implementation, this would collect actual system metrics
    this.systemMetrics.cpu.usage = Math.random() * 100;
    this.systemMetrics.memory.usage = Math.random() * 100;
    this.systemMetrics.application.requestsPerSecond = Math.random() * 1000;
    this.systemMetrics.application.errorRate = Math.random() * 10;
    this.systemMetrics.application.responseTime = Math.random() * 500;
    this.systemMetrics.application.activeUsers = Math.floor(Math.random() * 10000);

    // Record metrics
    this.setGauge('cpu_usage', this.systemMetrics.cpu.usage);
    this.setGauge('memory_usage', this.systemMetrics.memory.usage);
    this.setGauge('error_rate', this.systemMetrics.application.errorRate);
    this.setGauge('active_users', this.systemMetrics.application.activeUsers);
  }

  /**
   * Shutdown metrics service
   */
  shutdown(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.metrics.clear();
    this.configs.clear();
    this.alertRules.clear();
    this.activeAlerts.clear();
    
    console.log('🛑 Comprehensive Metrics Service shut down');
  }
}

// Global singleton
export const comprehensiveMetricsService = new ComprehensiveMetricsService();