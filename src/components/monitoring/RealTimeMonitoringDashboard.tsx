import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Zap, 
  Cpu, 
  HardDrive, 
  Network,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MetricData {
  timestamp: string;
  value: number;
}

interface SystemMetrics {
  cpu_usage: MetricData[];
  memory_usage: MetricData[];
  active_agents: MetricData[];
  request_rate: MetricData[];
  response_time: MetricData[];
  error_rate: MetricData[];
}

interface RealTimeMonitoringDashboardProps {
  guildId?: string;
}

export const RealTimeMonitoringDashboard: React.FC<RealTimeMonitoringDashboardProps> = ({ guildId: _guildId }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu_usage: [],
    memory_usage: [],
    active_agents: [],
    request_rate: [],
    response_time: [],
    error_rate: []
  });
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      
      setMetrics(prev => {
        const updateMetric = (metric: MetricData[], newValue: number) => {
          const updated = [...metric, { timestamp: now, value: newValue }];
          return updated.slice(-20); // Keep last 20 data points
        };

        return {
          cpu_usage: updateMetric(prev.cpu_usage, Math.random() * 80 + 10),
          memory_usage: updateMetric(prev.memory_usage, Math.random() * 60 + 20),
          active_agents: updateMetric(prev.active_agents, Math.floor(Math.random() * 50 + 10)),
          request_rate: updateMetric(prev.request_rate, Math.random() * 1000 + 100),
          response_time: updateMetric(prev.response_time, Math.random() * 200 + 50),
          error_rate: updateMetric(prev.error_rate, Math.random() * 5)
        };
      });
      
      setIsConnected(true);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const createChartData = (data: MetricData[], label: string, color: string) => ({
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [{
      label,
      data: data.map(d => d.value),
      borderColor: color,
      backgroundColor: `${color}20`,
      tension: 0.4,
      fill: true
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  const currentMetrics = {
    cpu: metrics.cpu_usage[metrics.cpu_usage.length - 1]?.value || 0,
    memory: metrics.memory_usage[metrics.memory_usage.length - 1]?.value || 0,
    agents: metrics.active_agents[metrics.active_agents.length - 1]?.value || 0,
    requests: metrics.request_rate[metrics.request_rate.length - 1]?.value || 0,
    responseTime: metrics.response_time[metrics.response_time.length - 1]?.value || 0,
    errorRate: metrics.error_rate[metrics.error_rate.length - 1]?.value || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-white">Real-time Monitoring</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-sm text-white">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className={`text-sm ${currentMetrics.cpu > 80 ? 'text-red-400' : 'text-green-400'}`}>
              {currentMetrics.cpu.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-gray-300">CPU Usage</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className={`text-sm ${currentMetrics.memory > 80 ? 'text-red-400' : 'text-green-400'}`}>
              {currentMetrics.memory.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-gray-300">Memory</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm text-white">{Math.floor(currentMetrics.agents)}</span>
          </div>
          <div className="text-sm text-gray-300">Active Agents</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Network className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-white">{Math.floor(currentMetrics.requests)}/s</span>
          </div>
          <div className="text-sm text-gray-300">Requests</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-white">{Math.floor(currentMetrics.responseTime)}ms</span>
          </div>
          <div className="text-sm text-gray-300">Response Time</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className={`text-sm ${currentMetrics.errorRate > 2 ? 'text-red-400' : 'text-green-400'}`}>
              {currentMetrics.errorRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-gray-300">Error Rate</div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            System Performance
          </h3>
          <div className="h-64">
            <Line 
              data={createChartData(metrics.cpu_usage, 'CPU Usage (%)', '#60A5FA')} 
              options={chartOptions} 
            />
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-400" />
            Agent Activity
          </h3>
          <div className="h-64">
            <Line 
              data={createChartData(metrics.active_agents, 'Active Agents', '#34D399')} 
              options={chartOptions} 
            />
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2 text-yellow-400" />
            Request Rate
          </h3>
          <div className="h-64">
            <Line 
              data={createChartData(metrics.request_rate, 'Requests/sec', '#FBBF24')} 
              options={chartOptions} 
            />
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-400" />
            Response Time
          </h3>
          <div className="h-64">
            <Line 
              data={createChartData(metrics.response_time, 'Response Time (ms)', '#FB923C')} 
              options={chartOptions} 
            />
          </div>
        </GlassCard>
      </div>

      {/* System Health Status */}
      <GlassCard variant="medium" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          System Health Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <span className="text-sm text-gray-300">Database</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Healthy</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <span className="text-sm text-gray-300">API Gateway</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Operational</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <span className="text-sm text-gray-300">Cache</span>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Warning</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};