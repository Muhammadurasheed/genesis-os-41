
// Microservice Manager - Frontend version
// Handles communication with backend services via HTTP API calls

import axios from 'axios';

interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retries: number;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: number;
  responseTime?: number;
  error?: string;
}

class MicroserviceManager {
  private services: Map<string, ServiceConfig> = new Map();
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
    
    // Register default services
    this.registerService('orchestrator', `${baseUrl}`, 10000, 3);
    this.registerService('wizard', `${baseUrl}/api/wizard`, 15000, 3);
    this.registerService('agent-service', `${baseUrl}/api/agent`, 15000, 2);
    this.registerService('voice-service', `${baseUrl}/api/agent/voice`, 20000, 2);
    this.registerService('video-service', `${baseUrl}/api/agent/video`, 30000, 2);
  }

  registerService(name: string, url: string, timeout: number = 10000, retries: number = 3) {
    this.services.set(name, { name, url, timeout, retries });
    this.healthStatus.set(name, {
      name,
      status: 'unknown',
      lastCheck: 0
    });
    console.log(`✅ Service registered: ${name} at ${url}`);
  }

  async callService(serviceName: string, endpoint: string, data?: any, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= service.retries; attempt++) {
      try {
        const url = `${service.url}${endpoint}`;
        console.log(`🔄 Calling ${serviceName}: ${method} ${url} (attempt ${attempt})`);

        const response = await axios({
          method,
          url,
          data: method !== 'GET' ? data : undefined,
          params: method === 'GET' ? data : undefined,
          timeout: service.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Service call successful: ${serviceName}`);
        this.updateHealthStatus(serviceName, 'healthy');
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Service call failed (attempt ${attempt}/${service.retries}): ${serviceName} - ${error.message}`);
        
        if (attempt < service.retries) {
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    this.updateHealthStatus(serviceName, 'unhealthy', lastError.message);
    throw new Error(`Service ${serviceName} failed after ${service.retries} attempts: ${lastError.message}`);
  }

  private updateHealthStatus(serviceName: string, status: 'healthy' | 'unhealthy', error?: string) {
    const current = this.healthStatus.get(serviceName);
    if (current) {
      this.healthStatus.set(serviceName, {
        ...current,
        status,
        lastCheck: Date.now(),
        error
      });
    }
  }

  private startHealthChecks() {
    // Check service health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      for (const [serviceName] of this.services) {
        try {
          await this.callService(serviceName, '/health', undefined, 'GET');
        } catch (error) {
          // Health check failures are logged but don't throw
          console.warn(`⚠️ Health check failed for ${serviceName}`);
        }
      }
    }, 30000);
  }

  getServiceHealth(serviceName?: string): ServiceHealth | ServiceHealth[] {
    if (serviceName) {
      return this.healthStatus.get(serviceName) || {
        name: serviceName,
        status: 'unknown',
        lastCheck: 0,
        error: 'Service not found'
      };
    }
    
    return Array.from(this.healthStatus.values());
  }

  isServiceHealthy(serviceName: string): boolean {
    const health = this.healthStatus.get(serviceName);
    return health?.status === 'healthy';
  }

  getAllServicesStatus(): Record<string, ServiceHealth> {
    const status: Record<string, ServiceHealth> = {};
    for (const [name, health] of this.healthStatus) {
      status[name] = health;
    }
    return status;
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Create singleton instance
const microserviceManager = new MicroserviceManager();

export default microserviceManager;
