import { backendAPIService } from './backendAPIService';
import { supabase } from '../lib/supabase';

interface DeploymentConfig {
  guild_id: string;
  deployment_type: 'discord' | 'slack' | 'telegram' | 'webhook' | 'api';
  config: {
    // Discord config
    discord_bot_token?: string;
    discord_guild_id?: string;
    permissions?: string[];
    
    // Slack config
    slack_app_token?: string;
    slack_bot_token?: string;
    signing_secret?: string;
    workspace_id?: string;
    
    // Telegram config
    telegram_bot_token?: string;
    webhook_url?: string;
    
    // Webhook config
    endpoint_url?: string;
    method?: 'POST' | 'GET' | 'PUT';
    headers?: Record<string, string>;
    
    // API config
    api_key?: string;
    base_url?: string;
  };
  monitoring: {
    health_checks: boolean;
    metrics_enabled: boolean;
    logging_level: 'debug' | 'info' | 'warn' | 'error';
  };
}

interface DeploymentStatus {
  deployment_id: string;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'stopped';
  endpoint?: string;
  webhook_url?: string;
  metrics: {
    uptime: string;
    requests_count: number;
    success_rate: number;
    avg_response_time: number;
  };
  last_health_check: string;
}

class DeploymentIntegrationService {
  /**
   * Phase 2: Advanced Deployment Pipeline
   */
  async deployToDiscord(config: DeploymentConfig): Promise<string> {
    try {
      console.log('🤖 Discord Deployment: Starting deployment...');
      
      // Try backend deployment service first
      try {
        const response = await backendAPIService.deployToDiscord(config);
        if (response.success) {
          console.log('✅ Discord deployment initiated via backend');
          return response.data.deploymentId;
        }
      } catch (backendError) {
        console.warn('Backend Discord deployment failed, using edge function:', backendError);
      }
      
      // Fallback to edge function
      return await this.deployViaEdgeFunction('discord', config);
    } catch (error) {
      console.error('Discord deployment failed:', error);
      throw error;
    }
  }

  async deployToSlack(config: DeploymentConfig): Promise<string> {
    try {
      console.log('💬 Slack Deployment: Starting deployment...');
      
      try {
        const response = await backendAPIService.deployToSlack(config);
        if (response.success) {
          console.log('✅ Slack deployment initiated via backend');
          return response.data.deploymentId;
        }
      } catch (backendError) {
        console.warn('Backend Slack deployment failed, using edge function:', backendError);
      }
      
      return await this.deployViaEdgeFunction('slack', config);
    } catch (error) {
      console.error('Slack deployment failed:', error);
      throw error;
    }
  }

  async deployToTelegram(config: DeploymentConfig): Promise<string> {
    try {
      console.log('📱 Telegram Deployment: Starting deployment...');
      
      try {
        const response = await backendAPIService.deployToTelegram(config);
        if (response.success) {
          console.log('✅ Telegram deployment initiated via backend');
          return response.data.deploymentId;
        }
      } catch (backendError) {
        console.warn('Backend Telegram deployment failed, using edge function:', backendError);
      }
      
      return await this.deployViaEdgeFunction('telegram', config);
    } catch (error) {
      console.error('Telegram deployment failed:', error);
      throw error;
    }
  }

  async deployWebhook(config: DeploymentConfig): Promise<{ deployment_id: string; webhook_url: string }> {
    try {
      console.log('🔗 Webhook Deployment: Starting deployment...');
      
      try {
        const response = await backendAPIService.deployWebhook(config);
        if (response.success) {
          console.log('✅ Webhook deployment initiated via backend');
          return { deployment_id: response.data.deploymentId, webhook_url: response.data.webhookUrl };
        }
      } catch (backendError) {
        console.warn('Backend webhook deployment failed, using edge function:', backendError);
      }
      
      // Fallback to edge function
      const deploymentId = await this.deployViaEdgeFunction('webhook', config);
      const webhookUrl = await this.generateWebhookUrl(deploymentId);
      
      return { deployment_id: deploymentId, webhook_url: webhookUrl };
    } catch (error) {
      console.error('Webhook deployment failed:', error);
      throw error;
    }
  }

  private async deployViaEdgeFunction(platform: string, config: DeploymentConfig): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('guild-deployment', {
      body: {
        platform,
        guild_id: config.guild_id,
        config: config.config,
        monitoring: config.monitoring
      }
    });

    if (response.error) {
      throw new Error(`${platform} deployment failed: ${response.error.message}`);
    }

    return response.data.deployment_id;
  }

  private async generateWebhookUrl(deploymentId: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return '';

    // Generate webhook URL for the deployment
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${baseUrl}/functions/v1/webhook-handler/${deploymentId}`;
  }

  /**
   * Phase 2: Deployment Status Monitoring
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    try {
      // Try backend monitoring first
      const response = await backendAPIService.getDeploymentStatus(deploymentId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend deployment status failed, using database fallback:', error);
    }

    // Fallback to database query
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error) {
      throw new Error(`Failed to get deployment status: ${error.message}`);
    }

    return {
      deployment_id: data.id,
      status: data.status,
      endpoint: data.endpoint_url,
      webhook_url: data.webhook_url,
      metrics: data.metrics || {
        uptime: '0%',
        requests_count: 0,
        success_rate: 0,
        avg_response_time: 0
      },
      last_health_check: data.last_health_check || new Date().toISOString()
    };
  }

  /**
   * Phase 2: Deployment Control Methods
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    try {
      // Try backend stop first
      await backendAPIService.stopDeployment(deploymentId);
      console.log('⏹️ Deployment stopped via backend');
    } catch (error) {
      console.warn('Backend deployment stop failed, using direct update:', error);
      
      // Fallback to direct database update
      const { error: updateError } = await supabase
        .from('deployments')
        .update({ 
          status: 'stopped', 
          stopped_at: new Date().toISOString() 
        })
        .eq('id', deploymentId);

      if (updateError) {
        throw new Error(`Failed to stop deployment: ${updateError.message}`);
      }
    }
  }

  async restartDeployment(deploymentId: string): Promise<void> {
    try {
      // Get deployment config
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();

      if (error) throw error;

      // Stop current deployment
      await this.stopDeployment(deploymentId);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Restart with same config
      const newDeploymentId = await this.deployViaEdgeFunction(data.platform, {
        guild_id: data.guild_id,
        deployment_type: data.platform,
        config: data.config,
        monitoring: data.monitoring
      });

      console.log(`🔄 Deployment restarted with new ID: ${newDeploymentId}`);
    } catch (error) {
      console.error('Failed to restart deployment:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Production Monitoring and Analytics
   */
  async getDeploymentAnalytics(deploymentId: string, timeRange: string = '24h'): Promise<{
    metrics: {
      total_requests: number;
      success_rate: number;
      error_rate: number;
      avg_response_time: number;
      uptime_percentage: number;
    };
    timeline: Array<{
      timestamp: string;
      requests: number;
      errors: number;
      response_time: number;
    }>;
    errors: Array<{
      timestamp: string;
      error_type: string;
      message: string;
      count: number;
    }>;
  }> {
    try {
      // Try backend analytics
      const response = await fetch(`/api/deployments/${deploymentId}/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend analytics failed, using basic metrics:', error);
    }

    // Fallback to basic metrics
    return {
      metrics: {
        total_requests: 0,
        success_rate: 0,
        error_rate: 0,
        avg_response_time: 0,
        uptime_percentage: 0
      },
      timeline: [],
      errors: []
    };
  }

  /**
   * Phase 2: Health Check and Monitoring
   */
  async performHealthCheck(deploymentId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message: string;
      duration_ms: number;
    }>;
    overall_health_score: number;
  }> {
    const checks = [];
    let healthScore = 100;

    try {
      // Check deployment endpoint
      const deploymentStatus = await this.getDeploymentStatus(deploymentId);
      
      if (deploymentStatus.status === 'deployed') {
        checks.push({
          name: 'Deployment Status',
          status: 'pass' as const,
          message: 'Deployment is active',
          duration_ms: 50
        });
      } else {
        checks.push({
          name: 'Deployment Status',
          status: 'fail' as const,
          message: `Deployment status: ${deploymentStatus.status}`,
          duration_ms: 50
        });
        healthScore -= 30;
      }

      // Check response time
      if (deploymentStatus.metrics.avg_response_time > 5000) {
        checks.push({
          name: 'Response Time',
          status: 'fail' as const,
          message: 'High response time detected',
          duration_ms: deploymentStatus.metrics.avg_response_time
        });
        healthScore -= 20;
      } else {
        checks.push({
          name: 'Response Time',
          status: 'pass' as const,
          message: 'Response time within limits',
          duration_ms: deploymentStatus.metrics.avg_response_time
        });
      }

      // Check success rate
      if (deploymentStatus.metrics.success_rate < 0.95) {
        checks.push({
          name: 'Success Rate',
          status: 'fail' as const,
          message: 'Low success rate detected',
          duration_ms: 100
        });
        healthScore -= 25;
      } else {
        checks.push({
          name: 'Success Rate',
          status: 'pass' as const,
          message: 'Success rate is healthy',
          duration_ms: 100
        });
      }

    } catch (error) {
      checks.push({
        name: 'Health Check',
        status: 'fail' as const,
        message: `Health check failed: ${error}`,
        duration_ms: 0
      });
      healthScore = 0;
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 60) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      overall_health_score: healthScore
    };
  }

  /**
   * Phase 2: Deployment Scaling and Management
   */
  async scaleDeployment(deploymentId: string, scalingConfig: {
    min_instances: number;
    max_instances: number;
    target_cpu_usage: number;
    target_memory_usage: number;
  }): Promise<void> {
    try {
      const response = await fetch(`/api/deployments/${deploymentId}/scale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(scalingConfig)
      });

      if (!response.ok) {
        throw new Error('Scaling operation failed');
      }

      console.log('📈 Deployment scaling configured');
    } catch (error) {
      console.error('Failed to scale deployment:', error);
      throw error;
    }
  }
}

export const deploymentIntegrationService = new DeploymentIntegrationService();