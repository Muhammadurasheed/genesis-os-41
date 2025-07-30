import asyncio
import json
import time
import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
from collections import defaultdict, deque
import weakref
import threading
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger("monitoring_service")

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge" 
    HISTOGRAM = "histogram"
    TIMER = "timer"

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class Metric:
    name: str
    value: float
    timestamp: float
    tags: Dict[str, str]
    metric_type: MetricType
    
@dataclass
class Alert:
    id: str
    level: AlertLevel
    title: str
    message: str
    timestamp: float
    resolved: bool = False
    metadata: Dict[str, Any] = None

@dataclass
class PerformanceProfile:
    execution_id: str
    start_time: float
    end_time: Optional[float]
    duration_ms: Optional[float]
    cpu_usage: float
    memory_usage_mb: float
    network_io_kb: float
    disk_io_kb: float
    function_calls: List[Dict[str, Any]]
    bottlenecks: List[str]

class RealTimeMonitoringService:
    """Enterprise-grade real-time monitoring service with FAANG-level observability"""
    
    def __init__(self):
        self.metrics_buffer: deque = deque(maxlen=10000)  # Ring buffer for metrics
        self.alerts: Dict[str, Alert] = {}
        self.active_executions: Dict[str, Dict[str, Any]] = {}
        self.performance_profiles: Dict[str, PerformanceProfile] = {}
        
        # Real-time aggregations (sliding windows)
        self.minute_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=60))
        self.hour_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=60))
        self.day_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=24))
        
        # WebSocket connections registry
        self.websocket_connections: Set = set()
        
        # Thresholds for automatic alerting
        self.alert_thresholds = {
            "response_time_ms": {"warning": 2000, "critical": 5000},
            "error_rate": {"warning": 0.05, "critical": 0.1},
            "memory_usage_mb": {"warning": 512, "critical": 1024},
            "cpu_usage_percent": {"warning": 80, "critical": 95}
        }
        
        # Background tasks
        self._monitoring_task = None
        self._cleanup_task = None
        self._running = False
        
        logger.info("🔍 Enterprise Real-time Monitoring Service initialized")
    
    async def start_monitoring(self):
        """Start background monitoring tasks"""
        if self._running:
            return
            
        self._running = True
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("🔍 Real-time monitoring started")
    
    async def stop_monitoring(self):
        """Stop background monitoring tasks"""
        self._running = False
        
        if self._monitoring_task:
            self._monitoring_task.cancel()
        if self._cleanup_task:
            self._cleanup_task.cancel()
            
        logger.info("🔍 Real-time monitoring stopped")
    
    async def _monitoring_loop(self):
        """Main monitoring loop - processes metrics and generates alerts"""
        while self._running:
            try:
                await asyncio.sleep(1)  # Check every second
                
                current_time = time.time()
                
                # Process recent metrics for alerting
                recent_metrics = [m for m in self.metrics_buffer if current_time - m.timestamp < 60]
                
                # Generate automated alerts
                await self._process_alerts(recent_metrics)
                
                # Update sliding window aggregations
                await self._update_aggregations()
                
                # Broadcast real-time updates to WebSocket clients
                await self._broadcast_updates()
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
    
    async def _cleanup_loop(self):
        """Cleanup old data to prevent memory leaks"""
        while self._running:
            try:
                await asyncio.sleep(300)  # Cleanup every 5 minutes
                
                current_time = time.time()
                
                # Remove old performance profiles (keep last 24 hours)
                old_profiles = [
                    exec_id for exec_id, profile in self.performance_profiles.items()
                    if current_time - profile.start_time > 86400
                ]
                for exec_id in old_profiles:
                    del self.performance_profiles[exec_id]
                
                # Remove old alerts (keep last 7 days)
                old_alerts = [
                    alert_id for alert_id, alert in self.alerts.items()
                    if current_time - alert.timestamp > 604800
                ]
                for alert_id in old_alerts:
                    del self.alerts[alert_id]
                
                logger.info(f"🧹 Cleanup: Removed {len(old_profiles)} old profiles, {len(old_alerts)} old alerts")
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    def record_metric(self, name: str, value: float, tags: Dict[str, str] = None, metric_type: MetricType = MetricType.GAUGE):
        """Record a metric with automatic alerting"""
        metric = Metric(
            name=name,
            value=value,
            timestamp=time.time(),
            tags=tags or {},
            metric_type=metric_type
        )
        
        self.metrics_buffer.append(metric)
        
        # Check for immediate alerts
        asyncio.create_task(self._check_metric_thresholds(metric))
    
    async def _check_metric_thresholds(self, metric: Metric):
        """Check if metric exceeds thresholds and generate alerts"""
        if metric.name in self.alert_thresholds:
            thresholds = self.alert_thresholds[metric.name]
            
            if metric.value >= thresholds["critical"]:
                await self._create_alert(
                    AlertLevel.CRITICAL,
                    f"Critical {metric.name}",
                    f"{metric.name} is critically high: {metric.value}",
                    {"metric": asdict(metric)}
                )
            elif metric.value >= thresholds["warning"]:
                await self._create_alert(
                    AlertLevel.WARNING,
                    f"High {metric.name}",
                    f"{metric.name} is above warning threshold: {metric.value}",
                    {"metric": asdict(metric)}
                )
    
    async def _create_alert(self, level: AlertLevel, title: str, message: str, metadata: Dict[str, Any] = None):
        """Create and broadcast an alert"""
        alert_id = f"alert-{int(time.time() * 1000)}"
        alert = Alert(
            id=alert_id,
            level=level,
            title=title,
            message=message,
            timestamp=time.time(),
            metadata=metadata or {}
        )
        
        self.alerts[alert_id] = alert
        
        # Broadcast alert to WebSocket clients
        await self._broadcast_alert(alert)
        
        logger.warning(f"🚨 Alert created: {level.value} - {title}")
    
    def start_execution_tracking(self, execution_id: str, metadata: Dict[str, Any] = None) -> str:
        """Start tracking an execution with comprehensive profiling"""
        profile = PerformanceProfile(
            execution_id=execution_id,
            start_time=time.time(),
            end_time=None,
            duration_ms=None,
            cpu_usage=0.0,
            memory_usage_mb=0.0,
            network_io_kb=0.0,
            disk_io_kb=0.0,
            function_calls=[],
            bottlenecks=[]
        )
        
        self.performance_profiles[execution_id] = profile
        
        # Track active execution
        self.active_executions[execution_id] = {
            "start_time": time.time(),
            "metadata": metadata or {},
            "status": "running"
        }
        
        # Record metric
        self.record_metric("active_executions", len(self.active_executions), {"type": "execution_start"}, MetricType.GAUGE)
        
        logger.info(f"🎯 Started tracking execution: {execution_id}")
        return execution_id
    
    def end_execution_tracking(self, execution_id: str, status: str = "completed", error: str = None):
        """End execution tracking and generate comprehensive report"""
        if execution_id not in self.performance_profiles:
            logger.warning(f"Execution {execution_id} not found in profiles")
            return
        
        profile = self.performance_profiles[execution_id]
        profile.end_time = time.time()
        profile.duration_ms = (profile.end_time - profile.start_time) * 1000
        
        # Update active executions
        if execution_id in self.active_executions:
            self.active_executions[execution_id]["status"] = status
            self.active_executions[execution_id]["end_time"] = time.time()
            if error:
                self.active_executions[execution_id]["error"] = error
        
        # Record performance metrics
        self.record_metric("execution_duration_ms", profile.duration_ms, {"execution_id": execution_id, "status": status}, MetricType.TIMER)
        self.record_metric("active_executions", len([e for e in self.active_executions.values() if e["status"] == "running"]), {"type": "execution_end"}, MetricType.GAUGE)
        
        # Analyze for bottlenecks
        if profile.duration_ms > 5000:  # > 5 seconds
            profile.bottlenecks.append("slow_execution")
            asyncio.create_task(self._create_alert(
                AlertLevel.WARNING,
                "Slow Execution Detected",
                f"Execution {execution_id} took {profile.duration_ms:.0f}ms",
                {"execution_id": execution_id, "duration_ms": profile.duration_ms}
            ))
        
        logger.info(f"✅ Completed tracking execution: {execution_id} ({profile.duration_ms:.2f}ms)")
    
    def record_function_call(self, execution_id: str, function_name: str, duration_ms: float, success: bool = True):
        """Record individual function call within an execution"""
        if execution_id in self.performance_profiles:
            self.performance_profiles[execution_id].function_calls.append({
                "function": function_name,
                "duration_ms": duration_ms,
                "timestamp": time.time(),
                "success": success
            })
            
            # Record function-level metrics
            self.record_metric(
                "function_duration_ms", 
                duration_ms, 
                {"function": function_name, "execution_id": execution_id, "success": str(success)}, 
                MetricType.TIMER
            )
    
    async def _process_alerts(self, recent_metrics: List[Metric]):
        """Process recent metrics for pattern-based alerting"""
        # Group metrics by name for trend analysis
        metrics_by_name = defaultdict(list)
        for metric in recent_metrics:
            metrics_by_name[metric.name].append(metric)
        
        # Detect error rate spikes
        error_metrics = metrics_by_name.get("error_rate", [])
        if len(error_metrics) >= 5:  # Need at least 5 data points
            recent_errors = [m.value for m in error_metrics[-5:]]
            avg_error_rate = sum(recent_errors) / len(recent_errors)
            
            if avg_error_rate > 0.1:  # 10% error rate
                await self._create_alert(
                    AlertLevel.CRITICAL,
                    "High Error Rate Detected",
                    f"Average error rate over last 5 minutes: {avg_error_rate:.2%}",
                    {"error_rate": avg_error_rate, "sample_size": len(recent_errors)}
                )
    
    async def _update_aggregations(self):
        """Update sliding window aggregations for different time periods"""
        current_time = time.time()
        current_minute = int(current_time // 60)
        current_hour = int(current_time // 3600)
        current_day = int(current_time // 86400)
        
        # Aggregate metrics by minute
        minute_metrics = defaultdict(list)
        for metric in self.metrics_buffer:
            if int(metric.timestamp // 60) == current_minute:
                minute_metrics[metric.name].append(metric.value)
        
        # Store aggregated values
        for name, values in minute_metrics.items():
            if values:
                avg_value = sum(values) / len(values)
                self.minute_metrics[name].append({
                    "timestamp": current_minute * 60,
                    "avg": avg_value,
                    "min": min(values),
                    "max": max(values),
                    "count": len(values)
                })
    
    async def _broadcast_updates(self):
        """Broadcast real-time updates to WebSocket clients"""
        if not self.websocket_connections:
            return
        
        # Prepare update payload
        update = {
            "type": "monitoring_update",
            "timestamp": time.time(),
            "active_executions": len([e for e in self.active_executions.values() if e["status"] == "running"]),
            "recent_alerts": len([a for a in self.alerts.values() if not a.resolved and time.time() - a.timestamp < 300]),
            "metrics_summary": self._get_metrics_summary()
        }
        
        # Broadcast to all connected clients
        disconnected = []
        for websocket in self.websocket_connections:
            try:
                await websocket.send(json.dumps(update))
            except:
                disconnected.append(websocket)
        
        # Remove disconnected clients
        for ws in disconnected:
            self.websocket_connections.discard(ws)
    
    async def _broadcast_alert(self, alert: Alert):
        """Broadcast alert to WebSocket clients"""
        if not self.websocket_connections:
            return
        
        alert_data = {
            "type": "alert",
            "alert": asdict(alert)
        }
        
        disconnected = []
        for websocket in self.websocket_connections:
            try:
                await websocket.send(json.dumps(alert_data))
            except:
                disconnected.append(websocket)
        
        for ws in disconnected:
            self.websocket_connections.discard(ws)
    
    def _get_metrics_summary(self) -> Dict[str, Any]:
        """Get current metrics summary"""
        recent_metrics = [m for m in self.metrics_buffer if time.time() - m.timestamp < 60]
        
        if not recent_metrics:
            return {}
        
        # Group by metric name
        by_name = defaultdict(list)
        for metric in recent_metrics:
            by_name[metric.name].append(metric.value)
        
        summary = {}
        for name, values in by_name.items():
            summary[name] = {
                "avg": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "count": len(values),
                "latest": values[-1] if values else 0
            }
        
        return summary
    
    def register_websocket(self, websocket):
        """Register a WebSocket connection for real-time updates"""
        self.websocket_connections.add(websocket)
        logger.info(f"📡 WebSocket registered. Total connections: {len(self.websocket_connections)}")
    
    def unregister_websocket(self, websocket):
        """Unregister a WebSocket connection"""
        self.websocket_connections.discard(websocket)
        logger.info(f"📡 WebSocket unregistered. Total connections: {len(self.websocket_connections)}")
    
    def get_performance_report(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive performance report for an execution"""
        if execution_id not in self.performance_profiles:
            return None
        
        profile = self.performance_profiles[execution_id]
        execution_data = self.active_executions.get(execution_id, {})
        
        return {
            "execution_id": execution_id,
            "performance_profile": asdict(profile),
            "execution_metadata": execution_data,
            "recommendations": self._generate_performance_recommendations(profile)
        }
    
    def _generate_performance_recommendations(self, profile: PerformanceProfile) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        if profile.duration_ms and profile.duration_ms > 3000:
            recommendations.append("Consider optimizing execution flow - duration exceeds 3 seconds")
        
        if profile.memory_usage_mb > 256:
            recommendations.append("High memory usage detected - consider memory optimization")
        
        slow_functions = [fc for fc in profile.function_calls if fc["duration_ms"] > 1000]
        if slow_functions:
            recommendations.append(f"Optimize slow functions: {', '.join([fc['function'] for fc in slow_functions])}")
        
        if len(profile.function_calls) > 100:
            recommendations.append("High number of function calls - consider batching or caching")
        
        return recommendations
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health metrics"""
        current_time = time.time()
        
        # Recent metrics (last 5 minutes)
        recent_metrics = [m for m in self.metrics_buffer if current_time - m.timestamp < 300]
        
        # Calculate health indicators
        active_executions = len([e for e in self.active_executions.values() if e["status"] == "running"])
        recent_errors = len([m for m in recent_metrics if m.name == "error_rate" and m.value > 0])
        critical_alerts = len([a for a in self.alerts.values() if a.level == AlertLevel.CRITICAL and not a.resolved])
        
        # Determine overall health status
        health_status = "healthy"
        if critical_alerts > 0:
            health_status = "critical"
        elif recent_errors > 5:
            health_status = "degraded"
        elif active_executions > 50:
            health_status = "under_load"
        
        return {
            "status": health_status,
            "timestamp": current_time,
            "active_executions": active_executions,
            "recent_errors": recent_errors,
            "critical_alerts": critical_alerts,
            "websocket_connections": len(self.websocket_connections),
            "metrics_buffer_size": len(self.metrics_buffer),
            "uptime_seconds": current_time - (current_time - 3600),  # Placeholder for actual uptime
            "performance_profiles": len(self.performance_profiles)
        }

# Global singleton instance
monitoring_service = RealTimeMonitoringService()