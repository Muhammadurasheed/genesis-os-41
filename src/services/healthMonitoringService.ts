/**
 * Health Monitoring Service - Phase 1 Critical Fix
 * Monitors and reports health of all system components
 */

import { backendAPIService } from './backendAPIService';
import { enhancedEinsteinEngine } from './ai/enhancedEinsteinEngine';
import { geminiService } from './ai/geminiService';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  error?: string;
  lastChecked: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  timestamp: string;
}

class HealthMonitoringService {
  private healthCache = new Map<string, ServiceHealth>();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    console.log('🏥 Health Monitoring Service initialized');
  }

  /**
   * Check health of all critical services
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    console.log('🔍 Checking system health...');
    
    const services = await Promise.all([
      this.checkServiceHealth('gemini', () => geminiService.healthCheck()),
      this.checkServiceHealth('einstein', () => enhancedEinsteinEngine.checkGeminiHealth()),
      this.checkServiceHealth('orchestrator', () => backendAPIService.checkOrchestratorHealth()),
      this.checkServiceHealth('agent-service', () => backendAPIService.checkAgentServiceHealth()),
      this.checkServiceHealth('einstein-backend', () => backendAPIService.checkEinsteinService()),
      this.checkServiceHealth('cost-prediction', () => backendAPIService.checkCostPredictionService()),
      this.checkServiceHealth('mcp-service', () => backendAPIService.checkMCPService())
    ]);

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    let overall: 'healthy' | 'degraded' | 'down';
    if (healthyCount === services.length) {
      overall = 'healthy';
    } else if (healthyCount + degradedCount >= services.length * 0.5) {
      overall = 'degraded';
    } else {
      overall = 'down';
    }

    const health: SystemHealth = {
      overall,
      services,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 System health: ${overall} (${healthyCount}/${services.length} healthy)`);
    return health;
  }

  /**
   * Check health of a specific service with caching
   */
  private async checkServiceHealth(
    serviceName: string, 
    healthCheck: () => Promise<boolean>
  ): Promise<ServiceHealth> {
    const cached = this.healthCache.get(serviceName);
    const now = Date.now();
    
    if (cached && (now - new Date(cached.lastChecked).getTime()) < this.cacheTimeout) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      const isHealthy = await Promise.race([
        healthCheck(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        )
      ]);

      const latency = Date.now() - startTime;
      
      const health: ServiceHealth = {
        service: serviceName,
        status: isHealthy ? 'healthy' : 'down',
        latency,
        lastChecked: new Date().toISOString()
      };

      this.healthCache.set(serviceName, health);
      return health;

    } catch (error: any) {
      const health: ServiceHealth = {
        service: serviceName,
        status: 'down',
        error: error?.message || 'Unknown error',
        lastChecked: new Date().toISOString()
      };

      this.healthCache.set(serviceName, health);
      return health;
    }
  }

  /**
   * Get detailed service status
   */
  async getServiceStatus(serviceName: string): Promise<ServiceHealth | null> {
    const cached = this.healthCache.get(serviceName);
    return cached || null;
  }

  /**
   * Clear health cache
   */
  clearCache(): void {
    this.healthCache.clear();
    console.log('🧹 Health cache cleared');
  }

  /**
   * Get system readiness for operations
   */
  async getSystemReadiness(): Promise<{
    ready: boolean;
    criticalServices: string[];
    missingServices: string[];
    recommendations: string[];
  }> {
    const health = await this.checkSystemHealth();
    
    const criticalServices = ['gemini', 'einstein'];
    const healthyServices = health.services
      .filter(s => s.status === 'healthy')
      .map(s => s.service);
    
    const missingCritical = criticalServices.filter(s => !healthyServices.includes(s));
    
    const recommendations: string[] = [];
    
    if (missingCritical.includes('gemini')) {
      recommendations.push('Configure Gemini API key in environment variables');
    }
    
    if (health.services.find(s => s.service === 'orchestrator')?.status !== 'healthy') {
      recommendations.push('Start the Node.js orchestrator service');
    }
    
    if (health.services.find(s => s.service === 'agent-service')?.status !== 'healthy') {
      recommendations.push('Start the FastAPI agent service');
    }

    return {
      ready: missingCritical.length === 0,
      criticalServices: healthyServices,
      missingServices: missingCritical,
      recommendations
    };
  }
}

export const healthMonitoringService = new HealthMonitoringService();