
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Calendar, Download } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/button';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: string;
  conversionRate: number;
  revenue: number;
}

interface AnalyticsDashboardProps {
  guildId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  guildId
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('users');
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Mock data - in real app this would come from props or API
  const data: AnalyticsData = {
    totalUsers: 1250,
    activeUsers: 890,
    totalSessions: 3420,
    avgSessionDuration: '4m 32s',
    conversionRate: 12.5,
    revenue: 15420
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const metrics = [
    {
      id: 'users',
      name: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      id: 'active',
      name: 'Active Users',
      value: data.activeUsers.toLocaleString(),
      change: '+8.2%',
      icon: Activity,
      color: 'text-green-400'
    },
    {
      id: 'sessions',
      name: 'Total Sessions',
      value: data.totalSessions.toLocaleString(),
      change: '+15.3%',
      icon: BarChart3,
      color: 'text-purple-400'
    },
    {
      id: 'conversion',
      name: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-orange-400'
    }
  ];

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <GlassCard
              key={metric.id}
              variant="medium"
              className={`p-6 cursor-pointer transition-all ${
                selectedMetric === metric.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:bg-white/10'
              }`}
            >
              <div 
                className="w-full h-full"
                onClick={() => setSelectedMetric(metric.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">{metric.name}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className="text-sm text-green-400">{metric.change}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Chart Section */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Updated 5 minutes ago</span>
          </div>
        </div>
        
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-white/40 mx-auto mb-2" />
            <p className="text-white/60">Chart visualization for Guild: {guildId}</p>
          </div>
        </div>
      </GlassCard>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Average Duration</span>
              <span className="text-white font-medium">{data.avgSessionDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Bounce Rate</span>
              <span className="text-white font-medium">32.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Pages per Session</span>
              <span className="text-white font-medium">4.2</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Total Revenue</span>
              <span className="text-white font-medium">${data.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Average Order Value</span>
              <span className="text-white font-medium">$127.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Revenue per User</span>
              <span className="text-white font-medium">$23.40</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
