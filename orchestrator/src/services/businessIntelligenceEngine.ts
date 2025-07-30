/**
 * Phase 3: Business Intelligence Engine
 * Advanced analytics, insights generation, and predictive intelligence for enterprise decision-making
 */

import { v4 as uuid } from 'uuid';

interface DataSource {
  id: string;
  name: string;
  type: 'agent_performance' | 'workflow_execution' | 'user_interaction' | 'system_metrics' | 'external_api';
  connection: {
    endpoint?: string;
    credentials?: string;
    refreshRate: number; // minutes
  };
  schema: Record<string, string>;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'error';
}

interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: 'performance' | 'efficiency' | 'quality' | 'business' | 'user_experience';
  aggregation: 'sum' | 'average' | 'count' | 'max' | 'min' | 'percentile';
  timeGranularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  benchmarks: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
    significance: 'high' | 'medium' | 'low';
  };
}

interface InsightRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | 'between';
    value: number | [number, number];
    timeWindow: string; // e.g., "7d", "1h", "30m"
  }>;
  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    actionable: boolean;
    suggestedActions?: string[];
  }>;
  priority: number;
  enabled: boolean;
}

interface BusinessInsight {
  id: string;
  type: 'performance_optimization' | 'cost_reduction' | 'efficiency_improvement' | 'risk_mitigation' | 'growth_opportunity';
  title: string;
  description: string;
  impact: {
    category: 'revenue' | 'cost' | 'efficiency' | 'quality' | 'risk';
    magnitude: 'high' | 'medium' | 'low';
    estimatedValue?: number;
    timeframe: string;
  };
  confidence: number; // 0-1
  supportingData: Array<{
    metric: string;
    value: number;
    trend: string;
    context: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'short-term' | 'long-term';
    effort: 'low' | 'medium' | 'high';
    expectedOutcome: string;
  }>;
  generated: Date;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering' | 'time_series';
  targetVariable: string;
  features: string[];
  algorithm: string;
  accuracy: number;
  lastTrained: Date;
  predictions: Array<{
    timestamp: Date;
    predicted: number;
    actual?: number;
    confidence: number;
  }>;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'analytical' | 'real-time';
  widgets: Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'insight' | 'prediction';
    title: string;
    dataSource: string;
    configuration: Record<string, any>;
    position: { x: number; y: number; width: number; height: number };
  }>;
  access: {
    public: boolean;
    allowedRoles: string[];
    allowedUsers: string[];
  };
  refreshRate: number; // minutes
}

export class BusinessIntelligenceEngine {
  private dataSources: Map<string, DataSource> = new Map();
  private metrics: Map<string, MetricDefinition> = new Map();
  private insightRules: Map<string, InsightRule> = new Map();
  private insights: BusinessInsight[] = [];
  private predictiveModels: Map<string, PredictiveModel> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private dataWarehouse: Map<string, any[]> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultMetrics();
    this.initializeDefaultInsightRules();
    this.initializeDefaultDashboards();
    this.startContinuousAnalysis();
    console.log('📊 Business Intelligence Engine initialized');
  }

  private initializeDefaultMetrics(): void {
    const defaultMetrics: MetricDefinition[] = [
      {
        id: 'agent_response_time',
        name: 'Agent Response Time',
        description: 'Average time taken by agents to respond to requests',
        formula: 'AVG(response_time)',
        category: 'performance',
        aggregation: 'average',
        timeGranularity: 'hour',
        benchmarks: { excellent: 1.0, good: 2.0, acceptable: 5.0, poor: 10.0 },
        trends: { direction: 'stable', changePercentage: 0, significance: 'low' }
      },
      {
        id: 'task_completion_rate',
        name: 'Task Completion Rate',
        description: 'Percentage of tasks completed successfully',
        formula: 'COUNT(completed_tasks) / COUNT(total_tasks) * 100',
        category: 'efficiency',
        aggregation: 'average',
        timeGranularity: 'day',
        benchmarks: { excellent: 95, good: 85, acceptable: 75, poor: 60 },
        trends: { direction: 'up', changePercentage: 5.2, significance: 'medium' }
      },
      {
        id: 'user_satisfaction_score',
        name: 'User Satisfaction Score',
        description: 'Average user satisfaction rating',
        formula: 'AVG(satisfaction_rating)',
        category: 'quality',
        aggregation: 'average',
        timeGranularity: 'day',
        benchmarks: { excellent: 4.5, good: 4.0, acceptable: 3.5, poor: 3.0 },
        trends: { direction: 'up', changePercentage: 8.1, significance: 'high' }
      },
      {
        id: 'cost_per_interaction',
        name: 'Cost per Interaction',
        description: 'Average cost of each user interaction',
        formula: 'SUM(operational_costs) / COUNT(interactions)',
        category: 'business',
        aggregation: 'average',
        timeGranularity: 'day',
        benchmarks: { excellent: 0.10, good: 0.25, acceptable: 0.50, poor: 1.00 },
        trends: { direction: 'down', changePercentage: -12.3, significance: 'high' }
      },
      {
        id: 'system_uptime',
        name: 'System Uptime',
        description: 'Percentage of time system is operational',
        formula: 'SUM(uptime_minutes) / SUM(total_minutes) * 100',
        category: 'performance',
        aggregation: 'average',
        timeGranularity: 'hour',
        benchmarks: { excellent: 99.9, good: 99.5, acceptable: 99.0, poor: 95.0 },
        trends: { direction: 'stable', changePercentage: 0.1, significance: 'low' }
      }
    ];

    defaultMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });
  }

  private initializeDefaultInsightRules(): void {
    const defaultRules: InsightRule[] = [
      {
        id: 'performance_degradation_alert',
        name: 'Performance Degradation Alert',
        description: 'Detect when agent response times are consistently high',
        conditions: [
          { metric: 'agent_response_time', operator: '>', value: 5.0, timeWindow: '1h' }
        ],
        insights: [{
          type: 'risk',
          message: 'Agent response times are consistently above acceptable thresholds',
          severity: 'high',
          actionable: true,
          suggestedActions: [
            'Scale up agent instances',
            'Optimize agent processing logic',
            'Review system resource allocation'
          ]
        }],
        priority: 1,
        enabled: true
      },
      {
        id: 'efficiency_opportunity',
        name: 'Efficiency Improvement Opportunity',
        description: 'Identify opportunities to improve task completion rates',
        conditions: [
          { metric: 'task_completion_rate', operator: '<', value: 80, timeWindow: '7d' }
        ],
        insights: [{
          type: 'opportunity',
          message: 'Task completion rates are below optimal levels - opportunity for process improvement',
          severity: 'medium',
          actionable: true,
          suggestedActions: [
            'Analyze failed task patterns',
            'Enhance agent training',
            'Streamline workflow processes'
          ]
        }],
        priority: 2,
        enabled: true
      },
      {
        id: 'cost_optimization',
        name: 'Cost Optimization Alert',
        description: 'Detect when costs per interaction are rising',
        conditions: [
          { metric: 'cost_per_interaction', operator: '>', value: 0.50, timeWindow: '3d' }
        ],
        insights: [{
          type: 'risk',
          message: 'Cost per interaction is increasing - review resource efficiency',
          severity: 'medium',
          actionable: true,
          suggestedActions: [
            'Optimize resource allocation',
            'Review pricing models',
            'Implement cost controls'
          ]
        }],
        priority: 3,
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.insightRules.set(rule.id, rule);
    });
  }

  private initializeDefaultDashboards(): void {
    const executiveDashboard: Dashboard = {
      id: 'executive_overview',
      name: 'Executive Overview',
      description: 'High-level business metrics and insights for executive decision-making',
      category: 'executive',
      widgets: [
        {
          id: 'kpi_summary',
          type: 'metric',
          title: 'Key Performance Indicators',
          dataSource: 'aggregated_metrics',
          configuration: {
            metrics: ['task_completion_rate', 'user_satisfaction_score', 'cost_per_interaction'],
            timeRange: '30d'
          },
          position: { x: 0, y: 0, width: 6, height: 3 }
        },
        {
          id: 'performance_trends',
          type: 'chart',
          title: 'Performance Trends',
          dataSource: 'time_series_metrics',
          configuration: {
            chartType: 'line',
            metrics: ['agent_response_time', 'system_uptime'],
            timeRange: '7d'
          },
          position: { x: 6, y: 0, width: 6, height: 3 }
        },
        {
          id: 'business_insights',
          type: 'insight',
          title: 'Business Insights',
          dataSource: 'generated_insights',
          configuration: {
            maxInsights: 5,
            severityFilter: ['critical', 'high']
          },
          position: { x: 0, y: 3, width: 12, height: 4 }
        }
      ],
      access: {
        public: false,
        allowedRoles: ['executive', 'admin'],
        allowedUsers: []
      },
      refreshRate: 15
    };

    const operationalDashboard: Dashboard = {
      id: 'operational_metrics',
      name: 'Operational Metrics',
      description: 'Real-time operational metrics for system monitoring',
      category: 'operational',
      widgets: [
        {
          id: 'real_time_metrics',
          type: 'metric',
          title: 'Real-time System Metrics',
          dataSource: 'real_time_data',
          configuration: {
            metrics: ['agent_response_time', 'system_uptime', 'active_sessions'],
            refreshRate: 30
          },
          position: { x: 0, y: 0, width: 8, height: 3 }
        },
        {
          id: 'agent_performance',
          type: 'table',
          title: 'Agent Performance',
          dataSource: 'agent_metrics',
          configuration: {
            columns: ['agent_id', 'response_time', 'tasks_completed', 'success_rate'],
            sortBy: 'response_time'
          },
          position: { x: 8, y: 0, width: 4, height: 6 }
        },
        {
          id: 'system_health',
          type: 'chart',
          title: 'System Health',
          dataSource: 'system_metrics',
          configuration: {
            chartType: 'gauge',
            metric: 'system_uptime',
            thresholds: [95, 99, 99.9]
          },
          position: { x: 0, y: 3, width: 4, height: 3 }
        }
      ],
      access: {
        public: false,
        allowedRoles: ['operations', 'admin', 'developer'],
        allowedUsers: []
      },
      refreshRate: 5
    };

    this.dashboards.set(executiveDashboard.id, executiveDashboard);
    this.dashboards.set(operationalDashboard.id, operationalDashboard);
  }

  async addDataSource(sourceConfig: Partial<DataSource>): Promise<string> {
    const sourceId = sourceConfig.id || `source_${uuid()}`;

    const dataSource: DataSource = {
      id: sourceId,
      name: sourceConfig.name || 'Unnamed Source',
      type: sourceConfig.type || 'system_metrics',
      connection: {
        refreshRate: 60,
        ...sourceConfig.connection
      },
      schema: sourceConfig.schema || {},
      lastUpdated: new Date(),
      status: 'active'
    };

    this.dataSources.set(sourceId, dataSource);

    // Initialize data collection for this source
    await this.startDataCollection(sourceId);

    console.log(`📊 Added data source: ${dataSource.name}`);
    return sourceId;
  }

  private async startDataCollection(sourceId: string): Promise<void> {
    const source = this.dataSources.get(sourceId);
    if (!source) return;

    // Simulate data collection based on source type
    const collectData = () => {
      const data = this.generateMockData(source.type);

      if (!this.dataWarehouse.has(sourceId)) {
        this.dataWarehouse.set(sourceId, []);
      }

      const sourceData = this.dataWarehouse.get(sourceId)!;
      sourceData.push({
        timestamp: new Date(),
        ...data
      });

      // Keep only last 10000 records per source
      if (sourceData.length > 10000) {
        sourceData.splice(0, sourceData.length - 10000);
      }

      source.lastUpdated = new Date();
    };

    // Initial data collection
    collectData();

    // Schedule periodic collection
    setInterval(collectData, source.connection.refreshRate * 60 * 1000);
  }

  private generateMockData(sourceType: DataSource['type']): Record<string, any> {
    const baseTime = Date.now();

    switch (sourceType) {
      case 'agent_performance':
        return {
          agent_id: `agent_${Math.floor(Math.random() * 10) + 1}`,
          response_time: 1 + Math.random() * 8, // 1-9 seconds
          tasks_completed: Math.floor(Math.random() * 20),
          success_rate: 0.7 + Math.random() * 0.3,
          user_satisfaction: 3.5 + Math.random() * 1.5
        };

      case 'workflow_execution':
        return {
          workflow_id: `workflow_${Math.floor(Math.random() * 5) + 1}`,
          execution_time: 30 + Math.random() * 300, // 30-330 seconds
          success: Math.random() > 0.1, // 90% success rate
          steps_completed: Math.floor(Math.random() * 10) + 1,
          resource_usage: Math.random() * 100
        };

      case 'user_interaction':
        return {
          user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
          interaction_type: ['chat', 'api', 'webhook'][Math.floor(Math.random() * 3)],
          duration: Math.random() * 600, // 0-10 minutes
          satisfaction_rating: Math.floor(Math.random() * 5) + 1,
          resolved: Math.random() > 0.2 // 80% resolution rate
        };

      case 'system_metrics':
        return {
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          disk_usage: Math.random() * 100,
          network_io: Math.random() * 1000,
          active_connections: Math.floor(Math.random() * 1000),
          uptime: 99 + Math.random() * 1 // 99-100%
        };

      default:
        return {
          value: Math.random() * 100,
          status: Math.random() > 0.1 ? 'ok' : 'error'
        };
    }
  }

  async generateInsights(): Promise<BusinessInsight[]> {
    const newInsights: BusinessInsight[] = [];

    // Apply insight rules to current data
    for (const rule of this.insightRules.values()) {
      if (!rule.enabled) continue;

      const ruleTriggered = await this.evaluateInsightRule(rule);

      if (ruleTriggered) {
        for (const insightTemplate of rule.insights) {
          const insight: BusinessInsight = {
            id: `insight_${uuid()}`,
            type: this.mapInsightTypeToBusinessType(insightTemplate.type),
            title: `${rule.name}: ${insightTemplate.type}`,
            description: insightTemplate.message,
            impact: {
              category: this.determineImpactCategory(insightTemplate.type),
              magnitude: insightTemplate.severity === 'critical' ? 'high' :
                       insightTemplate.severity === 'high' ? 'medium' : 'low',
              timeframe: '1-4 weeks'
            },
            confidence: this.calculateInsightConfidence(rule),
            supportingData: await this.gatherSupportingData(rule.conditions),
            recommendations: insightTemplate.suggestedActions?.map(action => ({
              action,
              priority: insightTemplate.severity === 'critical' ? 'immediate' :
                       insightTemplate.severity === 'high' ? 'short-term' : 'long-term',
              effort: 'medium',
              expectedOutcome: `Improved ${rule.name.toLowerCase()}`
            })) || [],
            generated: new Date(),
            status: 'new'
          };

          newInsights.push(insight);
        }
      }
    }

    // Advanced pattern recognition insights
    const patternInsights = await this.generatePatternBasedInsights();
    newInsights.push(...patternInsights);

    // Add new insights to collection
    this.insights.push(...newInsights);

    // Keep only recent insights (last 1000)
    if (this.insights.length > 1000) {
      this.insights = this.insights.slice(-1000);
    }

    console.log(`💡 Generated ${newInsights.length} new business insights`);
    return newInsights;
  }

  private async evaluateInsightRule(rule: InsightRule): Promise<boolean> {
    for (const condition of rule.conditions) {
      const metricData = await this.getMetricData(condition.metric, condition.timeWindow);

      if (!metricData || metricData.length === 0) continue;

      const latestValue = metricData[metricData.length - 1].value;

      const conditionMet = this.evaluateCondition(latestValue, condition.operator, condition.value);

      if (!conditionMet) {
        return false; // All conditions must be met
      }
    }

    return true;
  }

  private evaluateCondition(value: number, operator: string, target: number | [number, number]): boolean {
    switch (operator) {
      case '>': return value > (target as number);
      case '<': return value < (target as number);
      case '>=': return value >= (target as number);
      case '<=': return value <= (target as number);
      case '=': return Math.abs(value - (target as number)) < 0.001;
      case 'between': 
        const [min, max] = target as [number, number];
        return value >= min && value <= max;
      default: return false;
    }
  }

  private async getMetricData(metricId: string, timeWindow: string): Promise<Array<{timestamp: Date, value: number}>> {
    // Parse time window (e.g., "7d", "1h", "30m")
    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoffTime = new Date(Date.now() - windowMs);

    // Simulate metric data retrieval
    const metric = this.metrics.get(metricId);
    if (!metric) return [];

    // Generate mock time series data
    const data: Array<{timestamp: Date, value: number}> = [];
    const intervals = Math.min(100, windowMs / (60 * 1000)); // Max 100 data points

    for (let i = 0; i < intervals; i++) {
      const timestamp = new Date(cutoffTime.getTime() + (i * windowMs / intervals));
      const value = this.generateMetricValue(metricId);
      data.push({ timestamp, value });
    }

    return data;
  }

  private parseTimeWindow(timeWindow: string): number {
    const match = timeWindow.match(/^(\d+)([mhd])$/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'm': return value * 60 * 1000; // minutes
      case 'h': return value * 60 * 60 * 1000; // hours
      case 'd': return value * 24 * 60 * 60 * 1000; // days
      default: return 3600000;
    }
  }

  private generateMetricValue(metricId: string): number {
    // Generate realistic metric values based on metric type
    switch (metricId) {
      case 'agent_response_time':
        return 1 + Math.random() * 8; // 1-9 seconds
      case 'task_completion_rate':
        return 70 + Math.random() * 30; // 70-100%
      case 'user_satisfaction_score':
        return 3.5 + Math.random() * 1.5; // 3.5-5.0
      case 'cost_per_interaction':
        return 0.05 + Math.random() * 0.95; // $0.05-$1.00
      case 'system_uptime':
        return 95 + Math.random() * 5; // 95-100%
      default:
        return Math.random() * 100;
    }
  }

  private async generatePatternBasedInsights(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    // Analyze correlation patterns
    const correlations = await this.analyzeMetricCorrelations();

    for (const correlation of correlations) {
      if (correlation.strength > 0.7) { // Strong correlation
        insights.push({
          id: `pattern_insight_${uuid()}`,
          type: 'efficiency_improvement',
          title: `Strong Correlation Detected: ${correlation.metric1} and ${correlation.metric2}`,
          description: `There is a ${correlation.strength > 0 ? 'positive' : 'negative'} correlation (${(correlation.strength * 100).toFixed(1)}%) between ${correlation.metric1} and ${correlation.metric2}`,
          impact: {
            category: 'efficiency',
            magnitude: 'medium',
            timeframe: '2-6 weeks'
          },
          confidence: Math.abs(correlation.strength),
          supportingData: [
            { metric: correlation.metric1, value: correlation.avg1, trend: correlation.trend1, context: 'Average over analysis period' },
            { metric: correlation.metric2, value: correlation.avg2, trend: correlation.trend2, context: 'Average over analysis period' }
          ],
          recommendations: [
            {
              action: `Optimize ${correlation.metric1} to improve ${correlation.metric2}`,
              priority: 'short-term',
              effort: 'medium',
              expectedOutcome: `Improved overall system efficiency`
            }
          ],
          generated: new Date(),
          status: 'new'
        });
      }
    }

    // Trend analysis insights
    const trends = await this.analyzeTrends();

    for (const trend of trends) {
      if (Math.abs(trend.changeRate) > 0.1) { // Significant trend
        insights.push({
          id: `trend_insight_${uuid()}`,
          type: trend.changeRate > 0 ? 'growth_opportunity' : 'risk_mitigation',
          title: `${trend.changeRate > 0 ? 'Positive' : 'Negative'} Trend in ${trend.metric}`,
          description: `${trend.metric} is showing a ${Math.abs(trend.changeRate * 100).toFixed(1)}% ${trend.changeRate > 0 ? 'improvement' : 'decline'} over the past ${trend.period}`,
          impact: {
            category: trend.changeRate > 0 ? 'efficiency' : 'risk',
            magnitude: Math.abs(trend.changeRate) > 0.2 ? 'high' : 'medium',
            timeframe: '1-3 weeks'
          },
          confidence: trend.confidence,
          supportingData: [
            { metric: trend.metric, value: trend.currentValue, trend: trend.changeRate > 0 ? 'improving' : 'declining', context: `${trend.changeRate > 0 ? 'Increase' : 'Decrease'} of ${(Math.abs(trend.changeRate) * 100).toFixed(1)}%` }
          ],
          recommendations: trend.changeRate > 0 ? [
            {
              action: `Amplify factors contributing to ${trend.metric} improvement`,
              priority: 'short-term',
              effort: 'low',
              expectedOutcome: 'Accelerated positive trend'
            }
          ] : [
            {
              action: `Investigate and address factors causing ${trend.metric} decline`,
              priority: 'immediate',
              effort: 'medium',
              expectedOutcome: 'Trend stabilization and reversal'
            }
          ],
          generated: new Date(),
          status: 'new'
        });
      }
    }

    return insights;
  }

  private async analyzeMetricCorrelations(): Promise<Array<{
    metric1: string;
    metric2: string;
    strength: number;
    avg1: number;
    avg2: number;
    trend1: string;
    trend2: string;
  }>> {
    const correlations = [];
    const metricIds = Array.from(this.metrics.keys());

    // Analyze correlations between all metric pairs
    for (let i = 0; i < metricIds.length; i++) {
      for (let j = i + 1; j < metricIds.length; j++) {
        const metric1Data = await this.getMetricData(metricIds[i], '7d');
        const metric2Data = await this.getMetricData(metricIds[j], '7d');

        if (metric1Data.length > 0 && metric2Data.length > 0) {
          const correlation = this.calculateCorrelation(metric1Data, metric2Data);

          correlations.push({
            metric1: metricIds[i],
            metric2: metricIds[j],
            strength: correlation,
            avg1: metric1Data.reduce((sum, d) => sum + d.value, 0) / metric1Data.length,
            avg2: metric2Data.reduce((sum, d) => sum + d.value, 0) / metric2Data.length,
            trend1: this.calculateTrend(metric1Data),
            trend2: this.calculateTrend(metric2Data)
          });
        }
      }
    }

    return correlations.filter(c => Math.abs(c.strength) > 0.5);
  }

  private calculateCorrelation(data1: Array<{value: number}>, data2: Array<{value: number}>): number {
    const n = Math.min(data1.length, data2.length);
    if (n < 2) return 0;

    const values1 = data1.slice(0, n).map(d => d.value);
    const values2 = data2.slice(0, n).map(d => d.value);

    const mean1 = values1.reduce((sum, v) => sum + v, 0) / n;
    const mean2 = values2.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;

      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateTrend(data: Array<{value: number}>): string {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avg1 = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

    const change = (avg2 - avg1) / avg1;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private async analyzeTrends(): Promise<Array<{
    metric: string;
    changeRate: number;
    currentValue: number;
    confidence: number;
    period: string;
  }>> {
    const trends = [];

    for (const metricId of this.metrics.keys()) {
      const data = await this.getMetricData(metricId, '7d');

      if (data.length > 10) {
        const trend = this.calculateDetailedTrend(data);
        trends.push({
          metric: metricId,
          changeRate: trend.rate,
          currentValue: data[data.length - 1].value,
          confidence: trend.confidence,
          period: '7 days'
        });
      }
    }

    return trends;
  }

  private calculateDetailedTrend(data: Array<{value: number}>): {rate: number; confidence: number} {
    if (data.length < 2) return { rate: 0, confidence: 0 };

    // Simple linear regression for trend
    const n = data.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices
    const ySum = data.reduce((sum, d) => sum + d.value, 0);
    const xySum = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const xSqSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squared indices

    const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum);
    const avgY = ySum / n;

    // Calculate R-squared for confidence
    const totalSumSquares = data.reduce((sum, d) => sum + Math.pow(d.value - avgY, 2), 0);
    const residualSumSquares = data.reduce((sum, d, i) => {
      const predicted = avgY + slope * (i - (n - 1) / 2);
      return sum + Math.pow(d.value - predicted, 2);
    }, 0);

    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);

    return {
      rate: slope / avgY, // Normalized rate
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  private mapInsightTypeToBusinessType(type: string): BusinessInsight['type'] {
    switch (type) {
      case 'opportunity': return 'growth_opportunity';
      case 'risk': return 'risk_mitigation';
      case 'trend': return 'performance_optimization';
      case 'anomaly': return 'risk_mitigation';
      case 'recommendation': return 'efficiency_improvement';
      default: return 'performance_optimization';
    }
  }

  private determineImpactCategory(type: string): BusinessInsight['impact']['category'] {
    switch (type) {
      case 'opportunity': return 'revenue';
      case 'risk': return 'risk';
      case 'trend': return 'efficiency';
      case 'anomaly': return 'quality';
      case 'recommendation': return 'efficiency';
      default: return 'efficiency';
    }
  }

  private calculateInsightConfidence(rule: InsightRule): number {
    // Base confidence on rule priority and number of conditions
    const baseConfidence = 0.7;
    const priorityBonus = (5 - rule.priority) * 0.05; // Higher priority = higher confidence
    const conditionBonus = Math.min(rule.conditions.length * 0.05, 0.2); // More conditions = higher confidence

    return Math.min(1.0, baseConfidence + priorityBonus + conditionBonus);
  }

  private async gatherSupportingData(conditions: InsightRule['conditions']): Promise<BusinessInsight['supportingData']> {
    const supportingData = [];

    for (const condition of conditions) {
      const metricData = await this.getMetricData(condition.metric, condition.timeWindow);

      if (metricData.length > 0) {
        const latestValue = metricData[metricData.length - 1].value;
        const trend = this.calculateTrend(metricData);

        supportingData.push({
          metric: condition.metric,
          value: latestValue,
          trend,
          context: `${condition.operator} ${condition.value} over ${condition.timeWindow}`
        });
      }
    }

    return supportingData;
  }

  private startContinuousAnalysis(): void {
    this.analysisInterval = setInterval(async () => {
      try {
        await this.generateInsights();
        await this.updateMetricTrends();
      } catch (error) {
        console.error('Error in continuous analysis:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async updateMetricTrends(): Promise<void> {
    for (const metric of this.metrics.values()) {
      const data = await this.getMetricData(metric.id, '24h');

      if (data.length > 0) {
        const trend = this.calculateDetailedTrend(data);
        metric.trends.changePercentage = trend.rate * 100;
        metric.trends.direction = trend.rate > 0.05 ? 'up' : trend.rate < -0.05 ? 'down' : 'stable';
        metric.trends.significance = trend.confidence > 0.7 ? 'high' : trend.confidence > 0.4 ? 'medium' : 'low';
      }
    }
  }

  getDashboard(dashboardId: string): Dashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  getInsights(filter?: {
    type?: BusinessInsight['type'];
    severity?: string;
    status?: BusinessInsight['status'];
    limit?: number;
  }): BusinessInsight[] {
    let filteredInsights = this.insights;

    if (filter) {
      if (filter.type) {
        filteredInsights = filteredInsights.filter(i => i.type === filter.type);
      }
      if (filter.status) {
        filteredInsights = filteredInsights.filter(i => i.status === filter.status);
      }
      if (filter.limit) {
        filteredInsights = filteredInsights.slice(-filter.limit);
      }
    }

    return filteredInsights.sort((a, b) => b.generated.getTime() - a.generated.getTime());
  }

  getMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  getSystemHealthScore(): number {
    const metricScores = [];

    for (const metric of this.metrics.values()) {
      // Calculate score based on benchmark comparison
      const mockCurrentValue = this.generateMetricValue(metric.id);

      let score = 0;
      if (mockCurrentValue >= metric.benchmarks.excellent) score = 100;
      else if (mockCurrentValue >= metric.benchmarks.good) score = 80;
      else if (mockCurrentValue >= metric.benchmarks.acceptable) score = 60;
      else if (mockCurrentValue >= metric.benchmarks.poor) score = 40;
      else score = 20;

      metricScores.push(score);
    }

    return metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length;
  }

  destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    console.log('🛑 Business Intelligence Engine destroyed');
  }
}

export const businessIntelligenceEngine = new BusinessIntelligenceEngine();
