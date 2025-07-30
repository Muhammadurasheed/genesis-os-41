// Phase 3 Sprint 3.3: Mock Service Engine
// Production-grade API mocking and simulation infrastructure

import { 
  MockService, 
  MockEndpoint, 
  ResponseTemplate, 
  LatencyConfig
} from '../../types/simulation';

export class MockServiceEngine {
  private mockServices: Map<string, MockService> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimiters: Map<string, RateLimiterState> = new Map();
  private requestLogs: MockRequestLog[] = [];

  constructor() {
    this.initializeDefaultMockServices();
  }

  // Service Registration
  registerMockService(service: MockService): void {
    this.mockServices.set(service.service_id, service);
    this.initializeServiceState(service);
  }

  unregisterMockService(serviceId: string): boolean {
    const success = this.mockServices.delete(serviceId);
    this.circuitBreakers.delete(serviceId);
    this.rateLimiters.delete(serviceId);
    return success;
  }

  getMockService(serviceId: string): MockService | undefined {
    return this.mockServices.get(serviceId);
  }

  getAllMockServices(): MockService[] {
    return Array.from(this.mockServices.values());
  }

  // Mock API Request Handler
  async executeMockRequest(
    serviceId: string,
    endpoint: string,
    method: string,
    headers: Record<string, string> = {},
    body?: any,
    requestId?: string
  ): Promise<MockApiResponse> {
    const service = this.mockServices.get(serviceId);
    if (!service) {
      throw new Error(`Mock service not found: ${serviceId}`);
    }

    const mockEndpoint = this.findMatchingEndpoint(service, endpoint, method);
    if (!mockEndpoint) {
      return this.createNotFoundResponse(serviceId, endpoint, method);
    }

    const requestLog = this.createRequestLog(serviceId || 'unknown', endpoint, method, headers, body, requestId);
    this.requestLogs.push(requestLog);

    try {
      // Authentication check
      const authResult = this.validateAuthentication(service, headers);
      if (!authResult.isValid) {
        return this.createAuthFailureResponse(service, authResult.error || 'Authentication failed');
      }

      // Rate limiting check
      const rateLimitResult = this.checkRateLimit(serviceId, mockEndpoint);
      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(mockEndpoint, rateLimitResult);
      }

      // Circuit breaker check
      const circuitBreakerResult = this.checkCircuitBreaker(serviceId);
      if (!circuitBreakerResult.allowed) {
        return this.createCircuitBreakerResponse(circuitBreakerResult);
      }

      // Reliability simulation (downtime, failures)
      const reliabilityResult = this.simulateReliability(service, mockEndpoint);
      if (!reliabilityResult.isAvailable) {
        return this.createServiceUnavailableResponse(reliabilityResult);
      }

      // Response template selection
      const responseTemplate = this.selectResponseTemplate(mockEndpoint, body, headers);
      
      // Latency simulation
      await this.simulateLatency(mockEndpoint.latency_simulation || service.global_latency);

      // Create and return response
      const response = this.createSuccessResponse(responseTemplate, requestLog);
      this.updateCircuitBreakerSuccess(serviceId);
      this.updateRequestLog(requestLog, response);

      return response;

    } catch (error) {
      const errorResponse = this.createErrorResponse(error, requestLog);
      this.updateCircuitBreakerFailure(serviceId);
      this.updateRequestLog(requestLog, errorResponse);
      return errorResponse;
    }
  }

  // Request Log Management
  getRequestLogs(serviceId?: string, limit: number = 100): MockRequestLog[] {
    let logs = [...this.requestLogs];
    
    if (serviceId) {
      logs = logs.filter(log => log.service_id === serviceId);
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  clearRequestLogs(serviceId?: string): void {
    if (serviceId) {
      this.requestLogs = this.requestLogs.filter(log => log.service_id !== serviceId);
    } else {
      this.requestLogs = [];
    }
  }

  // Service Health Management
  getServiceHealth(serviceId: string): ServiceHealthStatus {
    const service = this.mockServices.get(serviceId);
    if (!service) {
      return { status: 'unknown', message: 'Service not found' };
    }

    const circuitBreaker = this.circuitBreakers.get(serviceId);
    const recentLogs = this.getRequestLogs(serviceId, 100);
    const recentErrors = recentLogs.filter(log => (log.response?.status_code || 0) >= 400);
    const errorRate = recentLogs.length > 0 ? recentErrors.length / recentLogs.length : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';
    let message = 'Service operating normally';

    if (circuitBreaker?.state === 'open') {
      status = 'unhealthy';
      message = 'Circuit breaker open - service unavailable';
    } else if (errorRate > 0.5) {
      status = 'degraded';
      message = `High error rate: ${(errorRate * 100).toFixed(1)}%`;
    } else if (errorRate > 0.1) {
      status = 'degraded';
      message = `Elevated error rate: ${(errorRate * 100).toFixed(1)}%`;
    }

    return {
      status,
      message,
      error_rate: errorRate,
      total_requests: recentLogs.length,
      circuit_breaker_state: circuitBreaker?.state || 'closed'
    };
  }

  // Private Methods
  private initializeDefaultMockServices(): void {
    // Gmail Mock Service
    const gmailMock: MockService = {
      service_name: 'Gmail',
      service_id: 'gmail',
      base_url: 'https://gmail.googleapis.com',
      endpoints: [
        {
          id: 'send-email',
          path: '/gmail/v1/users/me/messages/send',
          method: 'POST',
          response_templates: [
            {
              id: 'success',
              name: 'Email Sent Successfully',
              status_code: 200,
              headers: { 'Content-Type': 'application/json' },
              body: {
                id: '{{random.uuid}}',
                threadId: '{{random.uuid}}',
                labelIds: ['SENT']
              },
              content_type: 'application/json',
              probability_weight: 0.95
            },
            {
              id: 'quota-exceeded',
              name: 'Daily Quota Exceeded',
              status_code: 429,
              headers: { 'Content-Type': 'application/json' },
              body: {
                error: {
                  code: 429,
                  message: 'Daily quota exceeded'
                }
              },
              content_type: 'application/json',
              probability_weight: 0.05
            }
          ],
          latency_simulation: {
            min_ms: 200,
            max_ms: 1500,
            distribution: 'normal',
            mean_ms: 600,
            std_dev_ms: 200
          },
          failure_simulation: {
            enabled: true,
            failure_rate: 0.02,
            failure_types: [
              {
                type: 'timeout',
                probability: 0.6,
                error_response: {
                  id: 'timeout',
                  name: 'Request Timeout',
                  status_code: 408,
                  headers: {},
                  body: { error: 'Request timeout' },
                  content_type: 'application/json',
                  probability_weight: 1
                }
              }
            ]
          },
          conditional_responses: []
        }
      ],
      response_patterns: [],
      authentication: {
        type: 'bearer_token',
        required_headers: ['Authorization'],
        valid_tokens: ['valid_gmail_token_123'],
        auth_failure_response: {
          id: 'auth-failure',
          name: 'Authentication Failed',
          status_code: 401,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Invalid credentials' },
          content_type: 'application/json',
          probability_weight: 1
        }
      },
      global_latency: {
        min_ms: 100,
        max_ms: 2000,
        distribution: 'normal',
        mean_ms: 500
      },
      reliability_config: {
        uptime_percentage: 99.9,
        downtime_simulation: []
      }
    };

    // Slack Mock Service
    const slackMock: MockService = {
      service_name: 'Slack',
      service_id: 'slack',
      base_url: 'https://slack.com/api',
      endpoints: [
        {
          id: 'post-message',
          path: '/chat.postMessage',
          method: 'POST',
          response_templates: [
            {
              id: 'success',
              name: 'Message Posted',
              status_code: 200,
              headers: { 'Content-Type': 'application/json' },
              body: {
                ok: true,
                channel: '{{request.body.channel}}',
                ts: '{{timestamp}}',
                message: {
                  text: '{{request.body.text}}',
                  user: 'U123456789'
                }
              },
              content_type: 'application/json',
              probability_weight: 1
            }
          ],
          latency_simulation: {
            min_ms: 100,
            max_ms: 800,
            distribution: 'uniform'
          },
          failure_simulation: {
            enabled: true,
            failure_rate: 0.01,
            failure_types: []
          },
          conditional_responses: []
        }
      ],
      response_patterns: [],
      authentication: {
        type: 'bearer_token',
        required_headers: ['Authorization'],
        valid_tokens: ['xoxb-valid-slack-token'],
        auth_failure_response: {
          id: 'auth-failure',
          name: 'Invalid Token',
          status_code: 401,
          headers: { 'Content-Type': 'application/json' },
          body: { ok: false, error: 'invalid_auth' },
          content_type: 'application/json',
          probability_weight: 1
        }
      },
      global_latency: {
        min_ms: 50,
        max_ms: 1000,
        distribution: 'exponential'
      },
      reliability_config: {
        uptime_percentage: 99.95,
        downtime_simulation: []
      }
    };

    this.registerMockService(gmailMock);
    this.registerMockService(slackMock);
  }

  private initializeServiceState(service: MockService): void {
    // Initialize circuit breaker
    this.circuitBreakers.set(service.service_id, {
      state: 'closed',
      failure_count: 0,
      last_failure_time: null,
      success_count: 0
    });

    // Initialize rate limiters for each endpoint
    service.endpoints.forEach(endpoint => {
      if (endpoint.rate_limit_simulation) {
        const key = `${service.service_id}:${endpoint.id}`;
        this.rateLimiters.set(key, {
          requests: [],
          last_reset: Date.now()
        });
      }
    });
  }

  private findMatchingEndpoint(service: MockService, path: string, method: string): MockEndpoint | undefined {
    return service.endpoints.find(endpoint => {
      const pathMatches = this.matchPath(endpoint.path, path);
      const methodMatches = endpoint.method === method;
      return pathMatches && methodMatches;
    });
  }

  private matchPath(templatePath: string, actualPath: string): boolean {
    // Simple path matching - could be enhanced with regex or path parameters
    const templateParts = templatePath.split('/');
    const actualParts = actualPath.split('/');

    if (templateParts.length !== actualParts.length) {
      return false;
    }

    return templateParts.every((templatePart, index) => {
      const actualPart = actualParts[index];
      return templatePart === actualPart || templatePart.startsWith('{') && templatePart.endsWith('}');
    });
  }

  private validateAuthentication(service: MockService, headers: Record<string, string>): AuthValidationResult {
    const auth = service.authentication;
    
    if (auth.type === 'none') {
      return { isValid: true };
    }

    const authHeader = headers['Authorization'] || headers['authorization'];
    
    if (!authHeader) {
      return { 
        isValid: false, 
        error: 'Missing Authorization header' 
      };
    }

    if (auth.type === 'bearer_token') {
      const token = authHeader.replace('Bearer ', '');
      const isValidToken = auth.valid_tokens?.includes(token) || false;
      
      if (!isValidToken) {
        return { 
          isValid: false, 
          error: 'Invalid bearer token' 
        };
      }
    }

    return { isValid: true };
  }

  private checkRateLimit(serviceId: string, endpoint: MockEndpoint): RateLimitResult {
    const rateLimitConfig = endpoint.rate_limit_simulation;
    if (!rateLimitConfig) {
      return { allowed: true };
    }

    const key = `${serviceId}:${endpoint.id}`;
    const rateLimiter = this.rateLimiters.get(key);
    if (!rateLimiter) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Clean old requests
    rateLimiter.requests = rateLimiter.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (rateLimiter.requests.length >= rateLimitConfig.requests_per_minute) {
      const oldestRequest = Math.min(...rateLimiter.requests);
      const resetTime = oldestRequest + 60000;
      
      return {
        allowed: false,
        limit: rateLimitConfig.requests_per_minute,
        remaining: 0,
        reset_time: new Date(resetTime).toISOString(),
        retry_after: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Add current request
    rateLimiter.requests.push(now);

    return {
      allowed: true,
      limit: rateLimitConfig.requests_per_minute,
      remaining: rateLimitConfig.requests_per_minute - rateLimiter.requests.length,
      reset_time: new Date(windowStart + 60000).toISOString()
    };
  }

  private checkCircuitBreaker(serviceId: string): CircuitBreakerResult {
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (!circuitBreaker) {
      return { allowed: true };
    }

    const now = Date.now();

    if (circuitBreaker.state === 'open') {
      const recovery_timeout = 30000; // 30 seconds
      if (circuitBreaker.last_failure_time && (now - circuitBreaker.last_failure_time) > recovery_timeout) {
        circuitBreaker.state = 'half_open';
        circuitBreaker.success_count = 0;
      } else {
        return { 
          allowed: false, 
          state: 'open',
          message: 'Circuit breaker is open'
        };
      }
    }

    if (circuitBreaker.state === 'half_open') {
      const max_calls = 5;
      if (circuitBreaker.success_count >= max_calls) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failure_count = 0;
      }
    }

    return { allowed: true, state: circuitBreaker.state };
  }

  private simulateReliability(service: MockService, endpoint: MockEndpoint): ReliabilityResult {
    const reliability = service.reliability_config;
    const uptimeRandom = Math.random() * 100;
    
    if (uptimeRandom > reliability.uptime_percentage) {
      return {
        isAvailable: false,
        reason: 'service_downtime',
        message: 'Service temporarily unavailable'
      };
    }

    const failureConfig = endpoint.failure_simulation;
    if (failureConfig?.enabled) {
      const failureRandom = Math.random();
      if (failureRandom < failureConfig.failure_rate) {
        const failureType = this.selectFailureType(failureConfig.failure_types);
        return {
          isAvailable: false,
          reason: failureType?.type || 'unknown_failure',
          message: `Simulated ${failureType?.type || 'failure'}`
        };
      }
    }

    return { isAvailable: true };
  }

  private selectFailureType(failureTypes: any[]): any {
    const random = Math.random();
    let cumulative = 0;

    for (const failureType of failureTypes) {
      cumulative += failureType.probability;
      if (random <= cumulative) {
        return failureType;
      }
    }

    return failureTypes[0]; // Fallback
  }

  private selectResponseTemplate(endpoint: MockEndpoint, body?: any, headers?: Record<string, string>): ResponseTemplate {
    // Check conditional responses first
    for (const conditionalResponse of endpoint.conditional_responses) {
      if (this.evaluateCondition(conditionalResponse.condition, { body, headers })) {
        const template = endpoint.response_templates.find(t => t.id === conditionalResponse.response_template_id);
        if (template) return template;
      }
    }

    // Use weighted random selection
    const totalWeight = endpoint.response_templates.reduce((sum, template) => sum + template.probability_weight, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;

    for (const template of endpoint.response_templates) {
      cumulative += template.probability_weight;
      if (random <= cumulative) {
        return template;
      }
    }

    return endpoint.response_templates[0]; // Fallback
  }

  private evaluateCondition(_condition: string, _context: { body?: any; headers?: Record<string, string> }): boolean {
    try {
      // Simple condition evaluation - could be enhanced with a proper expression parser
      // For now, just return true for demonstration
      return true; // Mock implementation - always return true
    } catch {
      return false;
    }
  }

  private async simulateLatency(latencyConfig: LatencyConfig): Promise<void> {
    let delay: number;

    switch (latencyConfig.distribution) {
      case 'uniform':
        delay = Math.random() * (latencyConfig.max_ms - latencyConfig.min_ms) + latencyConfig.min_ms;
        break;
      case 'normal':
        delay = this.generateNormalDistribution(
          latencyConfig.mean_ms || ((latencyConfig.max_ms + latencyConfig.min_ms) / 2),
          latencyConfig.std_dev_ms || ((latencyConfig.max_ms - latencyConfig.min_ms) / 4)
        );
        delay = Math.max(latencyConfig.min_ms, Math.min(latencyConfig.max_ms, delay));
        break;
      case 'exponential':
        const lambda = 1 / (latencyConfig.mean_ms || latencyConfig.min_ms);
        delay = -Math.log(Math.random()) / lambda;
        delay = Math.max(latencyConfig.min_ms, Math.min(latencyConfig.max_ms, delay));
        break;
      default:
        delay = latencyConfig.min_ms;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateNormalDistribution(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private createRequestLog(
    serviceId: string,
    endpoint: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    requestId?: string
  ): MockRequestLog {
    return {
      id: requestId || this.generateId(),
      service_id: serviceId,
      endpoint,
      method,
      headers,
      body,
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      response: null
    };
  }

  private updateRequestLog(log: MockRequestLog, response: MockApiResponse): void {
    log.response = response;
    log.duration_ms = Date.now() - new Date(log.timestamp).getTime();
  }

  private createSuccessResponse(template: ResponseTemplate, log: MockRequestLog): MockApiResponse {
    return {
      status_code: template.status_code,
      headers: { ...template.headers },
      body: this.processResponseTemplate(template.body, log),
      content_type: template.content_type,
      timestamp: new Date().toISOString(),
      is_mock: true,
      mock_template_id: template.id
    };
  }

  private createNotFoundResponse(serviceId: string, endpoint: string, method: string): MockApiResponse {
    return {
      status_code: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `No mock endpoint found for ${method} ${endpoint}`,
        service_id: serviceId
      },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  }

  private createAuthFailureResponse(service: MockService, error: string): MockApiResponse {
    const template = service.authentication.auth_failure_response;
    if (template) {
      return {
        status_code: template.status_code,
        headers: template.headers,
        body: template.body,
        content_type: template.content_type,
        timestamp: new Date().toISOString(),
        is_mock: true,
        mock_template_id: template.id
      };
    }

    return {
      status_code: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Unauthorized', message: error },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  }

  private createRateLimitResponse(endpoint: MockEndpoint, rateLimitResult: RateLimitResult): MockApiResponse {
    const template = endpoint.rate_limit_simulation?.rate_limit_response;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '0',
      'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
      'X-RateLimit-Reset': rateLimitResult.reset_time || new Date().toISOString()
    };

    if (rateLimitResult.retry_after) {
      headers['Retry-After'] = rateLimitResult.retry_after.toString();
    }

    return {
      status_code: 429,
      headers,
      body: template?.body || {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded'
      },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true,
      mock_template_id: template?.id
    };
  }

  private createCircuitBreakerResponse(result: CircuitBreakerResult): MockApiResponse {
    return {
      status_code: 503,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Service Unavailable',
        message: result.message || 'Circuit breaker is open',
        circuit_breaker_state: result.state
      },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  }

  private createServiceUnavailableResponse(result: ReliabilityResult): MockApiResponse {
    return {
      status_code: 503,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Service Unavailable',
        message: result.message || 'Service temporarily unavailable',
        reason: result.reason
      },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  }

  private createErrorResponse(error: any, log: MockRequestLog): MockApiResponse {
    return {
      status_code: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
        request_id: log.id
      },
      content_type: 'application/json',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  }

  private processResponseTemplate(template: any, log: MockRequestLog): any {
    if (typeof template === 'string') {
      return this.replaceTemplateVariables(template, log);
    } else if (Array.isArray(template)) {
      return template.map(item => this.processResponseTemplate(item, log));
    } else if (typeof template === 'object' && template !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.processResponseTemplate(value, log);
      }
      return result;
    }
    return template;
  }

  private replaceTemplateVariables(template: string, log: MockRequestLog): string {
    return template
      .replace(/\{\{random\.uuid\}\}/g, this.generateId())
      .replace(/\{\{timestamp\}\}/g, Date.now().toString())
      .replace(/\{\{request\.body\.(\w+)\}\}/g, (match, field) => {
        return log.body?.[field] || match;
      });
  }

  private updateCircuitBreakerSuccess(serviceId: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (circuitBreaker) {
      if (circuitBreaker.state === 'half_open') {
        circuitBreaker.success_count++;
      }
      circuitBreaker.failure_count = 0;
    }
  }

  private updateCircuitBreakerFailure(serviceId: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (circuitBreaker) {
      circuitBreaker.failure_count++;
      circuitBreaker.last_failure_time = Date.now();

      const failure_threshold = 5;
      if (circuitBreaker.failure_count >= failure_threshold) {
        circuitBreaker.state = 'open';
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Supporting Interfaces
interface MockApiResponse {
  status_code: number;
  headers: Record<string, string>;
  body: any;
  content_type: string;
  timestamp: string;
  is_mock: boolean;
  mock_template_id?: string;
}

interface MockRequestLog {
  id: string;
  service_id: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
  duration_ms: number;
  response: MockApiResponse | null;
}

interface AuthValidationResult {
  isValid: boolean;
  error?: string;
}

interface RateLimitResult {
  allowed: boolean;
  limit?: number;
  remaining?: number;
  reset_time?: string;
  retry_after?: number;
}

interface CircuitBreakerResult {
  allowed: boolean;
  state?: 'open' | 'closed' | 'half_open';
  message?: string;
}

interface ReliabilityResult {
  isAvailable: boolean;
  reason?: string;
  message?: string;
}

interface CircuitBreakerState {
  state: 'open' | 'closed' | 'half_open';
  failure_count: number;
  last_failure_time: number | null;
  success_count: number;
}

interface RateLimiterState {
  requests: number[];
  last_reset: number;
}

interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  error_rate?: number;
  total_requests?: number;
  circuit_breaker_state?: string;
}

// Export singleton instance
export const mockServiceEngine = new MockServiceEngine();