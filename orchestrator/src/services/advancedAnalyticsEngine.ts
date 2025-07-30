// import asyncio
// import json
// import time
// import logging
// from typing import Dict, Any, List, Optional
// from datetime import datetime, timedelta
// from dataclasses import dataclass, asdict
// import numpy as np
// from collections import defaultdict, deque
// import statistics

// logger = logging.getLogger("advanced_analytics_engine")

// @dataclass
// class AnalyticsInsight:
//     id: str
//     type: str
//     title: str
//     description: str
//     confidence: float
//     impact_level: str  # 'low', 'medium', 'high', 'critical'
//     recommendations: List[str]
//     data_points: Dict[str, Any]
//     timestamp: datetime

// @dataclass
// class PerformanceTrend:
//     metric_name: str
//     trend_direction: str  # 'increasing', 'decreasing', 'stable', 'volatile'
//     trend_strength: float  # 0-1
//     correlation_factors: List[str]
//     forecast_7d: List[float]
//     anomalies_detected: List[Dict[str, Any]]

// @dataclass
// class OptimizationRecommendation:
//     id: str
//     category: str
//     priority: str  # 'low', 'medium', 'high', 'critical'
//     title: str
//     description: str
//     expected_improvement: str
//     implementation_effort: str  # 'low', 'medium', 'high'
//     estimated_impact: Dict[str, float]
//     action_items: List[str]

// class AdvancedAnalyticsEngine:
//     """FAANG-level analytics engine with ML-powered insights and predictive analytics"""
    
//     def __init__(self):
//         self.time_series_data: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10000))
//         self.insights_history: List[AnalyticsInsight] = []
//         self.performance_baselines: Dict[str, float] = {}
//         self.anomaly_thresholds: Dict[str, Dict[str, float]] = {}
        
//         # ML-like models (simplified for demonstration)
//         self.trend_models: Dict[str, Dict] = {}
//         self.seasonal_patterns: Dict[str, List[float]] = {}
//         self.correlation_matrix: Dict[str, Dict[str, float]] = {}
        
//         # Performance targets
//         self.performance_targets = {
//             "agent_response_time_ms": {"target": 1500, "critical": 3000},
//             "success_rate": {"target": 0.95, "critical": 0.85},
//             "throughput_per_minute": {"target": 100, "critical": 50},
//             "error_rate": {"target": 0.02, "critical": 0.1},
//             "memory_usage_mb": {"target": 512, "critical": 1024},
//             "cpu_usage_percent": {"target": 70, "critical": 90}
//         }
        
//         logger.info("📊 Advanced Analytics Engine initialized")
    
//     async def ingest_metrics(self, metrics: Dict[str, Any]):
//         """Ingest real-time metrics for analysis"""
//         timestamp = time.time()
        
//         for metric_name, value in metrics.items():
//             if isinstance(value, (int, float)):
//                 self.time_series_data[metric_name].append({
//                     "timestamp": timestamp,
//                     "value": value,
//                     "hour": datetime.fromtimestamp(timestamp).hour,
//                     "day_of_week": datetime.fromtimestamp(timestamp).weekday()
//                 })
        
//         # Trigger real-time analysis
//         await self._perform_real_time_analysis(metrics, timestamp)
    
//     async def _perform_real_time_analysis(self, metrics: Dict[str, Any], timestamp: float):
//         """Perform real-time analysis on incoming metrics"""
//         insights = []
        
//         # Anomaly detection
//         anomalies = await self._detect_anomalies(metrics, timestamp)
//         for anomaly in anomalies:
//             insight = AnalyticsInsight(
//                 id=f"anomaly_{int(timestamp)}_{anomaly['metric']}",
//                 type="anomaly",
//                 title=f"Anomaly Detected: {anomaly['metric']}",
//                 description=f"Unusual value detected: {anomaly['value']} (expected: {anomaly['expected_range']})",
//                 confidence=anomaly['confidence'],
//                 impact_level=self._determine_impact_level(anomaly['metric'], anomaly['severity']),
//                 recommendations=self._generate_anomaly_recommendations(anomaly),
//                 data_points=anomaly,
//                 timestamp=datetime.fromtimestamp(timestamp)
//             )
//             insights.append(insight)
        
//         # Performance threshold alerts
//         threshold_alerts = await self._check_performance_thresholds(metrics)
//         for alert in threshold_alerts:
//             insight = AnalyticsInsight(
//                 id=f"threshold_{int(timestamp)}_{alert['metric']}",
//                 type="threshold_alert",
//                 title=f"Performance Threshold: {alert['metric']}",
//                 description=alert['description'],
//                 confidence=0.95,
//                 impact_level=alert['impact_level'],
//                 recommendations=alert['recommendations'],
//                 data_points=alert,
//                 timestamp=datetime.fromtimestamp(timestamp)
//             )
//             insights.append(insight)
        
//         # Store insights
//         self.insights_history.extend(insights)
        
//         # Keep only recent insights (last 24 hours)
//         cutoff_time = datetime.fromtimestamp(timestamp) - timedelta(hours=24)
//         self.insights_history = [
//             insight for insight in self.insights_history 
//             if insight.timestamp > cutoff_time
//         ]
    
//     async def _detect_anomalies(self, metrics: Dict[str, Any], timestamp: float) -> List[Dict[str, Any]]:
//         """Advanced anomaly detection using statistical methods"""
//         anomalies = []
        
//         for metric_name, current_value in metrics.items():
//             if not isinstance(current_value, (int, float)):
//                 continue
                
//             historical_data = self.time_series_data[metric_name]
//             if len(historical_data) < 30:  # Need sufficient history
//                 continue
            
//             # Get recent values for analysis
//             recent_values = [point["value"] for point in list(historical_data)[-100:]]
            
//             # Statistical anomaly detection
//             mean_val = statistics.mean(recent_values)
//             std_val = statistics.stdev(recent_values) if len(recent_values) > 1 else 0
            
//             # Z-score based detection
//             if std_val > 0:
//                 z_score = abs(current_value - mean_val) / std_val
                
//                 if z_score > 3:  # 3 sigma rule
//                     anomalies.append({
//                         "metric": metric_name,
//                         "value": current_value,
//                         "expected_range": f"{mean_val - 2*std_val:.2f} - {mean_val + 2*std_val:.2f}",
//                         "z_score": z_score,
//                         "confidence": min(0.99, z_score / 5),
//                         "severity": "high" if z_score > 4 else "medium",
//                         "historical_mean": mean_val,
//                         "historical_std": std_val
//                     })
            
//             # Trend-based anomaly detection
//             if len(recent_values) >= 10:
//                 recent_trend = self._calculate_trend(recent_values[-10:])
//                 overall_trend = self._calculate_trend(recent_values)
                
//                 if abs(recent_trend - overall_trend) > 0.5:  # Significant trend change
//                     anomalies.append({
//                         "metric": metric_name,
//                         "value": current_value,
//                         "type": "trend_anomaly",
//                         "recent_trend": recent_trend,
//                         "overall_trend": overall_trend,
//                         "confidence": min(0.9, abs(recent_trend - overall_trend)),
//                         "severity": "medium"
//                     })
        
//         return anomalies
    
//     def _calculate_trend(self, values: List[float]) -> float:
//         """Calculate trend slope using linear regression"""
//         if len(values) < 2:
//             return 0
        
//         x = list(range(len(values)))
//         y = values
        
//         n = len(values)
//         sum_x = sum(x)
//         sum_y = sum(y)
//         sum_xy = sum(x[i] * y[i] for i in range(n))
//         sum_x2 = sum(x[i] ** 2 for i in range(n))
        
//         if n * sum_x2 - sum_x ** 2 == 0:
//             return 0
        
//         slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
//         return slope
    
//     async def _check_performance_thresholds(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
//         """Check metrics against performance thresholds"""
//         alerts = []
        
//         for metric_name, current_value in metrics.items():
//             if metric_name in self.performance_targets:
//                 target_config = self.performance_targets[metric_name]
                
//                 if metric_name in ["error_rate"]:  # Lower is better
//                     if current_value > target_config["critical"]:
//                         alerts.append({
//                             "metric": metric_name,
//                             "value": current_value,
//                             "threshold": target_config["critical"],
//                             "level": "critical",
//                             "impact_level": "critical",
//                             "description": f"{metric_name} is critically high: {current_value}",
//                             "recommendations": [
//                                 f"Immediate investigation required for {metric_name}",
//                                 "Check error logs and system health",
//                                 "Consider scaling or optimization"
//                             ]
//                         })
//                     elif current_value > target_config["target"]:
//                         alerts.append({
//                             "metric": metric_name,
//                             "value": current_value,
//                             "threshold": target_config["target"],
//                             "level": "warning",
//                             "impact_level": "medium",
//                             "description": f"{metric_name} is above target: {current_value}",
//                             "recommendations": [
//                                 f"Monitor {metric_name} closely",
//                                 "Consider preventive optimization"
//                             ]
//                         })
                
//                 elif metric_name in ["success_rate"]:  # Higher is better
//                     if current_value < target_config["critical"]:
//                         alerts.append({
//                             "metric": metric_name,
//                             "value": current_value,
//                             "threshold": target_config["critical"],
//                             "level": "critical",
//                             "impact_level": "critical",
//                             "description": f"{metric_name} is critically low: {current_value}",
//                             "recommendations": [
//                                 "Immediate system health check required",
//                                 "Investigate failed operations",
//                                 "Implement circuit breakers if not already present"
//                             ]
//                         })
                
//                 else:  # Higher is worse (response time, memory, CPU usage)
//                     if current_value > target_config["critical"]:
//                         alerts.append({
//                             "metric": metric_name,
//                             "value": current_value,
//                             "threshold": target_config["critical"],
//                             "level": "critical",
//                             "impact_level": "critical",
//                             "description": f"{metric_name} is critically high: {current_value}",
//                             "recommendations": [
//                                 f"Immediate optimization required for {metric_name}",
//                                 "Check for resource bottlenecks",
//                                 "Consider horizontal scaling"
//                             ]
//                         })
        
//         return alerts
    
//     def _determine_impact_level(self, metric_name: str, severity: str) -> str:
//         """Determine the business impact level of an anomaly"""
//         critical_metrics = ["error_rate", "success_rate", "agent_response_time_ms"]
        
//         if metric_name in critical_metrics:
//             if severity == "high":
//                 return "critical"
//             else:
//                 return "high"
//         else:
//             if severity == "high":
//                 return "high"
//             else:
//                 return "medium"
    
//     def _generate_anomaly_recommendations(self, anomaly: Dict[str, Any]) -> List[str]:
//         """Generate specific recommendations for anomalies"""
//         metric = anomaly["metric"]
//         recommendations = []
        
//         if "response_time" in metric:
//             recommendations.extend([
//                 "Check system load and resource utilization",
//                 "Review recent deployments or configuration changes",
//                 "Consider caching optimization",
//                 "Analyze slow query logs if database-related"
//             ])
        
//         elif "error_rate" in metric:
//             recommendations.extend([
//                 "Review error logs for patterns",
//                 "Check external service dependencies",
//                 "Verify recent code deployments",
//                 "Implement additional error handling"
//             ])
        
//         elif "memory" in metric:
//             recommendations.extend([
//                 "Check for memory leaks",
//                 "Review garbage collection patterns",
//                 "Analyze memory allocation patterns",
//                 "Consider increasing memory limits"
//             ])
        
//         elif "cpu" in metric:
//             recommendations.extend([
//                 "Analyze CPU-intensive operations",
//                 "Check for infinite loops or blocking operations",
//                 "Consider horizontal scaling",
//                 "Optimize algorithmic complexity"
//             ])
        
//         else:
//             recommendations.extend([
//                 f"Investigate recent changes affecting {metric}",
//                 "Monitor trend continuation",
//                 "Review system logs for correlations"
//             ])
        
//         return recommendations
    
//     async def generate_performance_trends(self, time_window_hours: int = 24) -> List[PerformanceTrend]:
//         """Generate performance trends with ML-powered forecasting"""
//         trends = []
        
//         cutoff_time = time.time() - (time_window_hours * 3600)
        
//         for metric_name, data_points in self.time_series_data.items():
//             # Filter data within time window
//             filtered_points = [
//                 point for point in data_points 
//                 if point["timestamp"] > cutoff_time
//             ]
            
//             if len(filtered_points) < 10:
//                 continue
            
//             values = [point["value"] for point in filtered_points]
//             timestamps = [point["timestamp"] for point in filtered_points]
            
//             # Calculate trend
//             trend_slope = self._calculate_trend(values)
//             trend_direction = self._classify_trend_direction(trend_slope, values)
//             trend_strength = min(1.0, abs(trend_slope) / (max(values) - min(values) + 1))
            
//             # Detect anomalies in the trend
//             anomalies = await self._detect_trend_anomalies(filtered_points)
            
//             # Simple forecasting (linear extrapolation)
//             forecast_7d = self._generate_forecast(values, timestamps, 7 * 24)  # 7 days
            
//             # Find correlation factors
//             correlation_factors = await self._find_correlation_factors(metric_name, filtered_points)
            
//             trend = PerformanceTrend(
//                 metric_name=metric_name,
//                 trend_direction=trend_direction,
//                 trend_strength=trend_strength,
//                 correlation_factors=correlation_factors,
//                 forecast_7d=forecast_7d,
//                 anomalies_detected=anomalies
//             )
            
//             trends.append(trend)
        
//         return trends
    
//     def _classify_trend_direction(self, slope: float, values: List[float]) -> str:
//         """Classify trend direction based on slope and variance"""
//         if len(values) < 2:
//             return "stable"
        
//         # Calculate coefficient of variation
//         mean_val = statistics.mean(values)
//         std_val = statistics.stdev(values) if len(values) > 1 else 0
//         cv = std_val / mean_val if mean_val != 0 else 0
        
//         if cv > 0.2:  # High variance
//             return "volatile"
//         elif abs(slope) < 0.01:  # Very small slope
//             return "stable"
//         elif slope > 0:
//             return "increasing"
//         else:
//             return "decreasing"
    
//     async def _detect_trend_anomalies(self, data_points: List[Dict]) -> List[Dict[str, Any]]:
//         """Detect anomalies within a trend"""
//         if len(data_points) < 20:
//             return []
        
//         values = [point["value"] for point in data_points]
//         timestamps = [point["timestamp"] for point in data_points]
        
//         # Use moving average to detect anomalies
//         window_size = min(10, len(values) // 4)
//         anomalies = []
        
//         for i in range(window_size, len(values)):
//             moving_avg = statistics.mean(values[i-window_size:i])
//             current_value = values[i]
            
//             # Calculate deviation from moving average
//             if moving_avg != 0:
//                 deviation = abs(current_value - moving_avg) / moving_avg
                
//                 if deviation > 0.3:  # 30% deviation threshold
//                     anomalies.append({
//                         "timestamp": timestamps[i],
//                         "value": current_value,
//                         "expected": moving_avg,
//                         "deviation_percent": deviation * 100,
//                         "severity": "high" if deviation > 0.5 else "medium"
//                     })
        
//         return anomalies
    
//     def _generate_forecast(self, values: List[float], timestamps: List[float], hours_ahead: int) -> List[float]:
//         """Generate simple linear forecast"""
//         if len(values) < 5:
//             return []
        
//         # Simple linear regression for forecasting
//         trend_slope = self._calculate_trend(values[-20:])  # Use recent trend
//         last_value = values[-1]
        
//         forecast = []
//         for i in range(1, hours_ahead + 1):
//             forecasted_value = last_value + (trend_slope * i)
//             forecast.append(max(0, forecasted_value))  # Ensure non-negative
        
//         return forecast
    
//     async def _find_correlation_factors(self, target_metric: str, data_points: List[Dict]) -> List[str]:
//         """Find metrics that correlate with the target metric"""
//         correlations = []
        
//         # This is a simplified correlation analysis
//         # In production, this would use more sophisticated methods
        
//         target_values = [point["value"] for point in data_points]
//         target_timestamps = [point["timestamp"] for point in data_points]
        
//         for other_metric, other_data in self.time_series_data.items():
//             if other_metric == target_metric:
//                 continue
            
//             # Find overlapping time points
//             other_points = [
//                 point for point in other_data 
//                 if any(abs(point["timestamp"] - ts) < 300 for ts in target_timestamps)  # 5 min tolerance
//             ]
            
//             if len(other_points) < 10:
//                 continue
            
//             other_values = [point["value"] for point in other_points[:len(target_values)]]
            
//             if len(other_values) == len(target_values):
//                 # Calculate correlation coefficient
//                 correlation = self._calculate_correlation(target_values, other_values)
                
//                 if abs(correlation) > 0.6:  # Strong correlation threshold
//                     correlations.append(other_metric)
        
//         return correlations[:5]  # Return top 5 correlations
    
//     def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
//         """Calculate Pearson correlation coefficient"""
//         if len(x) != len(y) or len(x) < 2:
//             return 0
        
//         n = len(x)
//         sum_x = sum(x)
//         sum_y = sum(y)
//         sum_xy = sum(x[i] * y[i] for i in range(n))
//         sum_x2 = sum(xi ** 2 for xi in x)
//         sum_y2 = sum(yi ** 2 for yi in y)
        
//         denominator = ((n * sum_x2 - sum_x ** 2) * (n * sum_y2 - sum_y ** 2)) ** 0.5
        
//         if denominator == 0:
//             return 0
        
//         correlation = (n * sum_xy - sum_x * sum_y) / denominator
//         return correlation
    
//     async def generate_optimization_recommendations(self) -> List[OptimizationRecommendation]:
//         """Generate ML-powered optimization recommendations"""
//         recommendations = []
        
//         # Analyze recent performance trends
//         trends = await self.generate_performance_trends(24)
        
//         for trend in trends:
//             if trend.trend_direction == "increasing" and "time" in trend.metric_name:
//                 # Response time increasing
//                 rec = OptimizationRecommendation(
//                     id=f"opt_response_time_{int(time.time())}",
//                     category="performance",
//                     priority="high",
//                     title="Optimize Response Time Performance",
//                     description=f"{trend.metric_name} is increasing. Consider optimization strategies.",
//                     expected_improvement="20-40% response time reduction",
//                     implementation_effort="medium",
//                     estimated_impact={
//                         "response_time_improvement": 0.3,
//                         "user_satisfaction": 0.25,
//                         "cost_reduction": 0.15
//                     },
//                     action_items=[
//                         "Implement response caching for frequently requested data",
//                         "Optimize database queries and add indexes",
//                         "Consider CDN implementation for static assets",
//                         "Review and optimize API endpoints"
//                     ]
//                 )
//                 recommendations.append(rec)
            
//             elif trend.trend_direction == "increasing" and "error" in trend.metric_name:
//                 # Error rate increasing
//                 rec = OptimizationRecommendation(
//                     id=f"opt_error_rate_{int(time.time())}",
//                     category="reliability",
//                     priority="critical",
//                     title="Reduce Error Rate",
//                     description=f"{trend.metric_name} is trending upward. Immediate attention required.",
//                     expected_improvement="50-70% error reduction",
//                     implementation_effort="high",
//                     estimated_impact={
//                         "error_rate_reduction": 0.6,
//                         "system_reliability": 0.4,
//                         "user_experience": 0.5
//                     },
//                     action_items=[
//                         "Implement comprehensive error monitoring",
//                         "Add circuit breakers for external dependencies",
//                         "Improve input validation and error handling",
//                         "Set up automated alerting for error spikes"
//                     ]
//                 )
//                 recommendations.append(rec)
        
//         # Resource utilization optimization
//         for metric_name in ["memory_usage_mb", "cpu_usage_percent"]:
//             if metric_name in self.time_series_data:
//                 recent_data = list(self.time_series_data[metric_name])[-50:]
//                 if recent_data:
//                     avg_usage = statistics.mean([point["value"] for point in recent_data])
//                     target = self.performance_targets.get(metric_name, {}).get("target", 70)
                    
//                     if avg_usage > target:
//                         rec = OptimizationRecommendation(
//                             id=f"opt_resources_{metric_name}_{int(time.time())}",
//                             category="resource_optimization",
//                             priority="medium",
//                             title=f"Optimize {metric_name.replace('_', ' ').title()}",
//                             description=f"Current {metric_name} is {avg_usage:.1f}, above target of {target}",
//                             expected_improvement=f"15-25% {metric_name} reduction",
//                             implementation_effort="medium",
//                             estimated_impact={
//                                 "resource_efficiency": 0.2,
//                                 "cost_savings": 0.15,
//                                 "system_stability": 0.1
//                             },
//                             action_items=[
//                                 f"Profile {metric_name} usage patterns",
//                                 "Implement resource pooling where applicable",
//                                 "Consider auto-scaling configuration",
//                                 "Optimize algorithm efficiency"
//                             ]
//                         )
//                         recommendations.append(rec)
        
//         return recommendations
    
//     def get_real_time_insights(self, hours_back: int = 1) -> List[AnalyticsInsight]:
//         """Get recent insights for real-time dashboard"""
//         cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
        
//         recent_insights = [
//             insight for insight in self.insights_history
//             if insight.timestamp > cutoff_time
//         ]
        
//         # Sort by impact level and confidence
//         impact_priority = {"critical": 4, "high": 3, "medium": 2, "low": 1}
//         recent_insights.sort(
//             key=lambda x: (impact_priority.get(x.impact_level, 0), x.confidence),
//             reverse=True
//         )
        
//         return recent_insights[:20]  # Return top 20 insights
    
//     def get_analytics_summary(self) -> Dict[str, Any]:
//         """Get comprehensive analytics summary"""
//         current_time = time.time()
        
//         # Calculate summary statistics
//         total_insights = len(self.insights_history)
//         critical_insights = len([i for i in self.insights_history if i.impact_level == "critical"])
//         recent_insights = len([i for i in self.insights_history 
//                              if (current_time - i.timestamp.timestamp()) < 3600])
        
//         # Metrics coverage
//         metrics_tracked = len(self.time_series_data)
//         active_metrics = len([m for m, data in self.time_series_data.items() 
//                             if data and (current_time - data[-1]["timestamp"]) < 300])
        
//         return {
//             "insights_summary": {
//                 "total_insights": total_insights,
//                 "critical_insights": critical_insights,
//                 "recent_insights_1h": recent_insights,
//                 "insight_types": self._get_insight_type_breakdown()
//             },
//             "metrics_summary": {
//                 "total_metrics_tracked": metrics_tracked,
//                 "active_metrics": active_metrics,
//                 "data_points_stored": sum(len(data) for data in self.time_series_data.values()),
//                 "oldest_data_age_hours": self._get_oldest_data_age_hours()
//             },
//             "system_health": self._calculate_system_health_score(),
//             "top_recommendations": [asdict(rec) for rec in self._get_top_recommendations()[:3]]
//         }
    
//     def _get_insight_type_breakdown(self) -> Dict[str, int]:
//         """Get breakdown of insights by type"""
//         breakdown = defaultdict(int)
//         for insight in self.insights_history:
//             breakdown[insight.type] += 1
//         return dict(breakdown)
    
//     def _get_oldest_data_age_hours(self) -> float:
//         """Get age of oldest data point in hours"""
//         if not self.time_series_data:
//             return 0
        
//         oldest_timestamp = min(
//             data[0]["timestamp"] for data in self.time_series_data.values() if data
//         )
        
//         return (time.time() - oldest_timestamp) / 3600
    
//     def _calculate_system_health_score(self) -> float:
//         """Calculate overall system health score"""
//         scores = []
        
//         # Check critical metrics against targets
//         for metric_name, target_config in self.performance_targets.items():
//             if metric_name in self.time_series_data:
//                 recent_data = list(self.time_series_data[metric_name])[-10:]
//                 if recent_data:
//                     avg_value = statistics.mean([point["value"] for point in recent_data])
                    
//                     if metric_name in ["error_rate"]:  # Lower is better
//                         score = max(0, 1 - (avg_value / target_config["target"]))
//                     elif metric_name in ["success_rate"]:  # Higher is better
//                         score = avg_value / target_config["target"] if target_config["target"] > 0 else 1
//                     else:  # Lower is better (response times, resource usage)
//                         score = max(0, 1 - (avg_value / target_config["target"]))
                    
//                     scores.append(min(1, score))
        
//         return statistics.mean(scores) if scores else 0.8  # Default healthy score
    
//     def _get_top_recommendations(self) -> List[OptimizationRecommendation]:
//         """Get top optimization recommendations (placeholder)"""
//         # This would return cached recommendations from the last analysis
//         return []  # Simplified for this implementation

// # Global singleton
// advanced_analytics_engine = AdvancedAnalyticsEngine()