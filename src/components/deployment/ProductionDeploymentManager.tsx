/**
 * Production Deployment Manager
 * Phase 3: Agent Intelligence - Production-Ready Deployment
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Settings, 
  Monitor, 
  Globe,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { securityService } from '../../services/security/securityService';
// import microserviceManager from '../../services/core/microserviceManager';
import { toast } from 'sonner';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  scaling: {
    minInstances: number;
    maxInstances: number;
    autoScale: boolean;
    cpuThreshold: number;
    memoryThreshold: number;
  };
  security: {
    encryptionEnabled: boolean;
    rateLimitEnabled: boolean;
    auditLoggingEnabled: boolean;
    accessControl: 'basic' | 'advanced';
  };
  monitoring: {
    healthChecks: boolean;
    metricsCollection: boolean;
    alerting: boolean;
    logLevel: 'info' | 'debug' | 'error';
  };
  networking: {
    loadBalancer: boolean;
    cdn: boolean;
    customDomain?: string;
    sslEnabled: boolean;
  };
}

interface DeploymentStatus {
  id: string;
  guildId: string;
  environment: string;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'stopped';
  progress: number;
  startTime: number;
  deploymentUrl?: string;
  healthStatus: 'healthy' | 'unhealthy' | 'degraded';
  metrics?: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

export const ProductionDeploymentManager: React.FC = () => {
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    environment: 'staging',
    scaling: {
      minInstances: 1,
      maxInstances: 10,
      autoScale: true,
      cpuThreshold: 70,
      memoryThreshold: 80
    },
    security: {
      encryptionEnabled: true,
      rateLimitEnabled: true,
      auditLoggingEnabled: true,
      accessControl: 'advanced'
    },
    monitoring: {
      healthChecks: true,
      metricsCollection: true,
      alerting: true,
      logLevel: 'info'
    },
    networking: {
      loadBalancer: true,
      cdn: false,
      sslEnabled: true
    }
  });

  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [, setSelectedDeployment] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    // Load existing deployments
    loadDeployments();
    
    // Set up real-time monitoring
    const monitoringInterval = setInterval(updateDeploymentMetrics, 30000);
    
    return () => clearInterval(monitoringInterval);
  }, []);

  const loadDeployments = () => {
    // Mock existing deployments
    const mockDeployments: DeploymentStatus[] = [
      {
        id: 'deploy-1',
        guildId: 'guild-1',
        environment: 'production',
        status: 'deployed',
        progress: 100,
        startTime: Date.now() - 86400000, // 1 day ago
        deploymentUrl: 'https://customer-support.genesis.ai',
        healthStatus: 'healthy',
        metrics: {
          uptime: 99.8,
          responseTime: 245,
          errorRate: 0.02,
          throughput: 1250
        },
        logs: [
          { timestamp: Date.now() - 3600000, level: 'info', message: 'Health check passed' },
          { timestamp: Date.now() - 7200000, level: 'info', message: 'Auto-scaled to 3 instances' }
        ]
      }
    ];
    
    setDeployments(mockDeployments);
  };

  const updateDeploymentMetrics = () => {
    setDeployments(prev => prev.map(deployment => {
      if (deployment.status === 'deployed') {
        // Simulate metric updates
        const variance = (Math.random() - 0.5) * 0.1;
        return {
          ...deployment,
          metrics: deployment.metrics ? {
            uptime: Math.max(95, Math.min(100, deployment.metrics.uptime + variance)),
            responseTime: Math.max(100, deployment.metrics.responseTime + (Math.random() - 0.5) * 50),
            errorRate: Math.max(0, Math.min(1, deployment.metrics.errorRate + (Math.random() - 0.5) * 0.01)),
            throughput: Math.max(0, deployment.metrics.throughput + (Math.random() - 0.5) * 100)
          } : undefined
        };
      }
      return deployment;
    }));
  };

  const deployGuild = async (guildId: string) => {
    if (isDeploying) {
      toast.error('Another deployment is already in progress');
      return;
    }

    setIsDeploying(true);

    // Validate configuration
    const validation = validateDeploymentConfig(deploymentConfig);
    if (!validation.isValid) {
      toast.error('Deployment configuration invalid', {
        description: validation.errors.join(', ')
      });
      setIsDeploying(false);
      return;
    }

    const deploymentId = `deploy-${Date.now()}`;
    const newDeployment: DeploymentStatus = {
      id: deploymentId,
      guildId,
      environment: deploymentConfig.environment,
      status: 'deploying',
      progress: 0,
      startTime: Date.now(),
      healthStatus: 'healthy',
      logs: [
        { timestamp: Date.now(), level: 'info', message: 'Starting deployment...' }
      ]
    };

    setDeployments(prev => [...prev, newDeployment]);
    setSelectedDeployment(deploymentId);

    try {
      // Security checks
      securityService.logSecurityEvent(
        'system',
        'deployment_started',
        guildId,
        'success',
        { environment: deploymentConfig.environment }
      );

      // Simulated deployment steps
      const steps = [
        { progress: 10, message: 'Validating guild configuration...' },
        { progress: 25, message: 'Building agent containers...' },
        { progress: 40, message: 'Setting up security policies...' },
        { progress: 55, message: 'Configuring load balancer...' },
        { progress: 70, message: 'Deploying to cluster...' },
        { progress: 85, message: 'Running health checks...' },
        { progress: 95, message: 'Configuring monitoring...' },
        { progress: 100, message: 'Deployment completed successfully!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setDeployments(prev => prev.map(d => 
          d.id === deploymentId ? {
            ...d,
            progress: step.progress,
            logs: [...d.logs, {
              timestamp: Date.now(),
              level: 'info',
              message: step.message
            }]
          } : d
        ));
      }

      // Final deployment update
      const deploymentUrl = `https://${guildId}.genesis.ai`;
      setDeployments(prev => prev.map(d => 
        d.id === deploymentId ? {
          ...d,
          status: 'deployed',
          deploymentUrl,
          metrics: {
            uptime: 100,
            responseTime: 200,
            errorRate: 0,
            throughput: 0
          }
        } : d
      ));

      toast.success('Guild deployed successfully!', {
        description: `Available at ${deploymentUrl}`
      });

      // Log successful deployment
      securityService.logSecurityEvent(
        'system',
        'deployment_completed',
        guildId,
        'success',
        { deploymentUrl, environment: deploymentConfig.environment }
      );

    } catch (error) {
      console.error('Deployment failed:', error);
      
      setDeployments(prev => prev.map(d => 
        d.id === deploymentId ? {
          ...d,
          status: 'failed',
          logs: [...d.logs, {
            timestamp: Date.now(),
            level: 'error',
            message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        } : d
      ));

      toast.error('Deployment failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      securityService.logSecurityEvent(
        'system',
        'deployment_failed',
        guildId,
        'failure',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const validateDeploymentConfig = (config: DeploymentConfig) => {
    const errors: string[] = [];

    if (config.scaling.minInstances < 1) {
      errors.push('Minimum instances must be at least 1');
    }

    if (config.scaling.maxInstances < config.scaling.minInstances) {
      errors.push('Maximum instances must be greater than minimum instances');
    }

    if (config.networking.customDomain && !config.networking.sslEnabled) {
      errors.push('SSL must be enabled for custom domains');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getStatusColor = (status: DeploymentStatus['status']) => {
    switch (status) {
      case 'deployed': return 'text-green-400';
      case 'deploying': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'stopped': return 'text-gray-400';
      default: return 'text-blue-400';
    }
  };

  const getHealthColor = (health: DeploymentStatus['healthStatus']) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Production Deployment</h2>
          <p className="text-gray-400">Deploy and manage your agent guilds in production</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdvancedConfig ? 'Hide' : 'Show'} Config
          </Button>
          
          <Button
            onClick={() => deployGuild('current-guild')}
            disabled={isDeploying}
            className="bg-green-600 hover:bg-green-700"
          >
            <Rocket className="w-4 h-4 mr-2" />
            {isDeploying ? 'Deploying...' : 'Deploy Guild'}
          </Button>
        </div>
      </div>

      {/* Advanced Configuration */}
      {showAdvancedConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Configuration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Environment & Scaling */}
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Environment & Scaling</h4>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Environment</label>
                    <select
                      value={deploymentConfig.environment}
                      onChange={(e) => setDeploymentConfig(prev => ({
                        ...prev,
                        environment: e.target.value as 'staging' | 'production'
                      }))}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Min Instances</label>
                      <input
                        type="number"
                        value={deploymentConfig.scaling.minInstances}
                        onChange={(e) => setDeploymentConfig(prev => ({
                          ...prev,
                          scaling: { ...prev.scaling, minInstances: parseInt(e.target.value) }
                        }))}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Instances</label>
                      <input
                        type="number"
                        value={deploymentConfig.scaling.maxInstances}
                        onChange={(e) => setDeploymentConfig(prev => ({
                          ...prev,
                          scaling: { ...prev.scaling, maxInstances: parseInt(e.target.value) }
                        }))}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white">Auto Scaling</span>
                    <Switch
                      checked={deploymentConfig.scaling.autoScale}
                      onCheckedChange={(checked) => setDeploymentConfig(prev => ({
                        ...prev,
                        scaling: { ...prev.scaling, autoScale: checked }
                      }))}
                    />
                  </div>
                </div>

                {/* Security & Networking */}
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Security & Networking</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Encryption</span>
                      <Switch
                        checked={deploymentConfig.security.encryptionEnabled}
                        onCheckedChange={(checked) => setDeploymentConfig(prev => ({
                          ...prev,
                          security: { ...prev.security, encryptionEnabled: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white">Rate Limiting</span>
                      <Switch
                        checked={deploymentConfig.security.rateLimitEnabled}
                        onCheckedChange={(checked) => setDeploymentConfig(prev => ({
                          ...prev,
                          security: { ...prev.security, rateLimitEnabled: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white">Load Balancer</span>
                      <Switch
                        checked={deploymentConfig.networking.loadBalancer}
                        onCheckedChange={(checked) => setDeploymentConfig(prev => ({
                          ...prev,
                          networking: { ...prev.networking, loadBalancer: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white">SSL Enabled</span>
                      <Switch
                        checked={deploymentConfig.networking.sslEnabled}
                        onCheckedChange={(checked) => setDeploymentConfig(prev => ({
                          ...prev,
                          networking: { ...prev.networking, sslEnabled: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deployments.map((deployment) => (
          <Card key={deployment.id} className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Guild {deployment.guildId}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-white/20 text-white">
                      {deployment.environment}
                    </Badge>
                    <span className={`text-sm ${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    deployment.healthStatus === 'healthy' ? 'bg-green-400' :
                    deployment.healthStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className={`text-sm ${getHealthColor(deployment.healthStatus)}`}>
                    {deployment.healthStatus}
                  </span>
                </div>
              </div>

              {deployment.status === 'deploying' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Deployment Progress</span>
                    <span className="text-sm text-white">{deployment.progress}%</span>
                  </div>
                  <Progress value={deployment.progress} className="h-2" />
                </div>
              )}

              {deployment.deploymentUrl && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <a
                      href={deployment.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {deployment.deploymentUrl}
                    </a>
                  </div>
                </div>
              )}

              {deployment.metrics && (
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-400">Uptime:</span>
                    <span className="text-green-400 ml-2">{deployment.metrics.uptime.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Response:</span>
                    <span className="text-blue-400 ml-2">{Math.round(deployment.metrics.responseTime)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Error Rate:</span>
                    <span className="text-yellow-400 ml-2">{(deployment.metrics.errorRate * 100).toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Throughput:</span>
                    <span className="text-purple-400 ml-2">{Math.round(deployment.metrics.throughput)}/min</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Monitor
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deployments.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No deployments yet</h3>
            <p className="text-gray-400 mb-4">Deploy your first guild to get started</p>
            <Button
              onClick={() => deployGuild('sample-guild')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Deploy Sample Guild
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};