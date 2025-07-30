/**
 * API Gateway Service - FAANG Level Implementation
 * Centralized authentication, authorization, rate limiting, and routing
 */

import { circuitBreakerService } from './circuitBreakerService';
import { serviceDiscoveryService } from './serviceDiscoveryService';
import { securityService } from '../security/securityService';

interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  targetService: string;
  targetPath?: string;
  authentication: {
    required: boolean;
    roles?: string[];
    scopes?: string[];
  };
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
    skipIfAuthenticated?: boolean;
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
    varyBy?: string[]; // headers to vary cache by
  };
  transformation?: {
    request?: (data: any) => any;
    response?: (data: any) => any;
  };
}

interface RequestContext {
  requestId: string;
  userId?: string;
  userRoles?: string[];
  userScopes?: string[];
  startTime: number;
  route?: Route;
  metadata: Record<string, any>;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
}

export class APIGatewayService {
  private routes: Map<string, Route> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private requestContexts: Map<string, RequestContext> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initializeDefaultRoutes();
    this.startCacheCleanup();
    console.log('🚪 API Gateway Service initialized');
  }

  /**
   * Initialize default routes for core services
   */
  private initializeDefaultRoutes(): void {
    // Agent Service routes
    this.registerRoute({
      path: '/api/agents/:agentId/execute',
      method: 'POST',
      targetService: 'agent-service',
      targetPath: '/agent/:agentId/execute',
      authentication: {
        required: true,
        scopes: ['agent:execute']
      },
      rateLimit: {
        requests: 100,
        window: 60000 // 1 minute
      }
    });

    this.registerRoute({
      path: '/api/agents/:agentId/configure',
      method: 'POST',
      targetService: 'agent-service',
      targetPath: '/agent/:agentId/configure',
      authentication: {
        required: true,
        scopes: ['agent:configure']
      },
      rateLimit: {
        requests: 50,
        window: 60000
      }
    });

    // Voice synthesis routes
    this.registerRoute({
      path: '/api/voice/synthesize',
      method: 'POST',
      targetService: 'agent-service',
      targetPath: '/voice/synthesize',
      authentication: {
        required: true,
        scopes: ['voice:synthesize']
      },
      rateLimit: {
        requests: 30,
        window: 60000
      }
    });

    // Orchestrator routes
    this.registerRoute({
      path: '/api/workflows/execute',
      method: 'POST',
      targetService: 'orchestrator',
      targetPath: '/executeFlow',
      authentication: {
        required: true,
        scopes: ['workflow:execute']
      },
      rateLimit: {
        requests: 20,
        window: 60000
      }
    });

    this.registerRoute({
      path: '/api/canvas/generate',
      method: 'POST',
      targetService: 'orchestrator',
      targetPath: '/generateCanvas',
      authentication: {
        required: true,
        scopes: ['canvas:generate']
      },
      rateLimit: {
        requests: 10,
        window: 60000
      },
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        varyBy: ['user-id']
      }
    });

    // Simulation routes
    this.registerRoute({
      path: '/api/simulation/run',
      method: 'POST',
      targetService: 'agent-service',
      targetPath: '/simulation/run',
      authentication: {
        required: true,
        scopes: ['simulation:run']
      },
      rateLimit: {
        requests: 5,
        window: 300000 // 5 minutes
      }
    });

    // Monitoring routes (public)
    this.registerRoute({
      path: '/api/health',
      method: 'GET',
      targetService: 'orchestrator',
      targetPath: '/health',
      authentication: {
        required: false
      },
      cache: {
        enabled: true,
        ttl: 30 // 30 seconds
      }
    });

    console.log(`✅ Registered ${this.routes.size} default API routes`);
  }

  /**
   * Register a new route
   */
  registerRoute(route: Route): void {
    const routeKey = `${route.method}:${route.path}`;
    this.routes.set(routeKey, route);
    
    // Register circuit breaker for target service
    circuitBreakerService.registerCircuit(route.targetService, {
      failureThreshold: 5,
      recoveryTimeout: 30000
    });

    console.log(`📍 Registered route: ${routeKey} -> ${route.targetService}`);
  }

  /**
   * Process incoming request through the gateway
   */
  async processRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, string>
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
    context: RequestContext;
  }> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Create request context
    const context: RequestContext = {
      requestId,
      startTime,
      metadata: {
        method,
        path,
        userAgent: headers['user-agent'],
        ip: headers['x-forwarded-for'] || 'unknown'
      }
    };

    this.requestContexts.set(requestId, context);

    try {
      // 1. Route matching
      const route = this.findRoute(method as any, path);
      if (!route) {
        return this.createErrorResponse(404, 'Route not found', context);
      }

      context.route = route;

      // 2. Authentication & Authorization
      if (route.authentication.required) {
        const authResult = await this.authenticateRequest(headers, route);
        if (!authResult.success) {
          return this.createErrorResponse(
            authResult.status || 401,
            authResult.error || 'Authentication failed',
            context
          );
        }

        context.userId = authResult.userId;
        context.userRoles = authResult.roles;
        context.userScopes = authResult.scopes;
      }

      // 3. Rate limiting
      if (route.rateLimit) {
        const rateLimitResult = this.checkRateLimit(context, route.rateLimit);
        if (!rateLimitResult.allowed) {
          return this.createErrorResponse(
            429,
            'Rate limit exceeded',
            context,
            { 'retry-after': rateLimitResult.retryAfter.toString() }
          );
        }
      }

      // 4. Cache check (for GET requests)
      if (method === 'GET' && route.cache?.enabled) {
        const cacheKey = this.generateCacheKey(path, query, headers, route.cache.varyBy);
        const cachedResponse = this.getFromCache(cacheKey);
        if (cachedResponse) {
          return {
            status: 200,
            headers: {
              'content-type': 'application/json',
              'x-cache': 'HIT',
              'etag': cachedResponse.etag
            },
            body: cachedResponse.data,
            context
          };
        }
      }

      // 5. Request transformation
      let transformedBody = body;
      if (route.transformation?.request) {
        transformedBody = route.transformation.request(body);
      }

      // 6. Service discovery and load balancing
      const serviceInstance = serviceDiscoveryService.getServiceInstance(route.targetService);
      if (!serviceInstance) {
        return this.createErrorResponse(503, 'Service unavailable', context);
      }

      // 7. Circuit breaker execution
      const targetPath = this.buildTargetPath(route.targetPath || path, path);
      const targetUrl = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}${targetPath}`;

      const response = await circuitBreakerService.execute(
        route.targetService,
        () => this.forwardRequest(targetUrl, method, transformedBody, headers, query),
        () => this.getFallbackResponse(route, context)
      );

      if (!response.success) {
        return this.createErrorResponse(
          503,
          response.error || 'Service error',
          context,
          { 'x-circuit-state': response.circuitState }
        );
      }

      // 8. Response transformation
      let transformedResponse = response.data;
      if (route.transformation?.response) {
        transformedResponse = route.transformation.response(response.data);
      }

      // 9. Cache storage (for cacheable responses)
      if (method === 'GET' && route.cache?.enabled && response.data) {
        const cacheKey = this.generateCacheKey(path, query, headers, route.cache.varyBy);
        this.storeInCache(cacheKey, transformedResponse, route.cache.ttl);
      }

      // 10. Response preparation
      const responseHeaders: Record<string, string> = {
        'content-type': 'application/json',
        'x-request-id': requestId,
        'x-response-time': `${Date.now() - startTime}ms`,
        'x-service': route.targetService,
        'x-circuit-state': response.circuitState
      };

      return {
        status: 200,
        headers: responseHeaders,
        body: transformedResponse,
        context
      };

    } catch (error) {
      console.error(`Gateway error for request ${requestId}:`, error);
      return this.createErrorResponse(500, 'Internal gateway error', context);
    } finally {
      // Log request completion
      this.logRequest(context);
      
      // Cleanup context after some time
      setTimeout(() => {
        this.requestContexts.delete(requestId);
      }, 300000); // 5 minutes
    }
  }

  /**
   * Find matching route for request
   */
  private findRoute(method: Route['method'], path: string): Route | null {
    // Exact match first
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // Pattern matching
    for (const [routeKey, route] of this.routes.entries()) {
      const [routeMethod, routePath] = routeKey.split(':');
      
      if (routeMethod !== method) continue;

      // Convert route pattern to regex
      const pattern = routePath
        .replace(/:[^/]+/g, '[^/]+') // Replace :param with [^/]+
        .replace(/\*/g, '.*'); // Replace * with .*

      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Authenticate request
   */
  private async authenticateRequest(
    headers: Record<string, string>,
    route: Route
  ): Promise<{
    success: boolean;
    userId?: string;
    roles?: string[];
    scopes?: string[];
    error?: string;
    status?: number;
  }> {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header', status: 401 };
    }

    const token = authHeader.substring(7);

    try {
      // In a real implementation, you would:
      // 1. Validate JWT token
      // 2. Check token expiration
      // 3. Extract user information
      // 4. Verify scopes and roles

      // Mock implementation
      const mockUser = await this.validateToken(token);
      
      if (!mockUser) {
        return { success: false, error: 'Invalid token', status: 401 };
      }

      // Check required roles
      if (route.authentication.roles && route.authentication.roles.length > 0) {
        const hasRequiredRole = route.authentication.roles.some(role => 
          mockUser.roles.includes(role)
        );
        
        if (!hasRequiredRole) {
          return { success: false, error: 'Insufficient roles', status: 403 };
        }
      }

      // Check required scopes
      if (route.authentication.scopes && route.authentication.scopes.length > 0) {
        const hasRequiredScope = route.authentication.scopes.some(scope => 
          mockUser.scopes.includes(scope)
        );
        
        if (!hasRequiredScope) {
          return { success: false, error: 'Insufficient scopes', status: 403 };
        }
      }

      return {
        success: true,
        userId: mockUser.id,
        roles: mockUser.roles,
        scopes: mockUser.scopes
      };

    } catch (error) {
      return { success: false, error: 'Token validation failed', status: 401 };
    }
  }

  /**
   * Mock token validation (replace with real JWT validation)
   */
  private async validateToken(token: string): Promise<{
    id: string;
    roles: string[];
    scopes: string[];
  } | null> {
    // Mock validation - in production, validate with your auth service
    if (token === 'invalid') {
      return null;
    }

    return {
      id: 'user-123',
      roles: ['user', 'admin'],
      scopes: ['agent:execute', 'agent:configure', 'voice:synthesize', 'workflow:execute', 'canvas:generate', 'simulation:run']
    };
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(
    context: RequestContext,
    rateLimit: NonNullable<Route['rateLimit']>
  ): { allowed: boolean; retryAfter: number } {
    const key = context.userId || context.metadata.ip;
    const now = Date.now();
    
    const counter = this.rateLimitCounters.get(key);
    
    if (!counter || now > counter.resetTime) {
      // Reset or create new counter
      this.rateLimitCounters.set(key, {
        count: 1,
        resetTime: now + rateLimit.window
      });
      return { allowed: true, retryAfter: 0 };
    }

    if (counter.count >= rateLimit.requests) {
      const retryAfter = Math.ceil((counter.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    counter.count++;
    return { allowed: true, retryAfter: 0 };
  }

  /**
   * Forward request to target service
   */
  private async forwardRequest(
    targetUrl: string,
    method: string,
    body: any,
    headers: Record<string, string>,
    query?: Record<string, string>
  ): Promise<any> {
    const url = new URL(targetUrl);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'content-type': 'application/json',
        'user-agent': 'GenesisOS-Gateway/1.0',
        ...headers
      }
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), requestOptions);
    
    if (!response.ok) {
      throw new Error(`Service responded with status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get fallback response when service is unavailable
   */
  private async getFallbackResponse(route: Route, context: RequestContext): Promise<any> {
    // Return cached response if available
    const cacheKey = this.generateCacheKey(
      context.metadata.path,
      {},
      {},
      route.cache?.varyBy
    );
    
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      return cachedResponse.data;
    }

    // Return appropriate fallback based on route
    return {
      error: 'Service temporarily unavailable',
      message: 'Please try again later',
      fallback: true,
      service: route.targetService
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    path: string,
    query?: Record<string, string>,
    headers?: Record<string, string>,
    varyBy?: string[]
  ): string {
    let key = path;
    
    if (query && Object.keys(query).length > 0) {
      const sortedQuery = Object.keys(query).sort().map(k => `${k}=${query[k]}`).join('&');
      key += `?${sortedQuery}`;
    }

    if (varyBy && headers) {
      const varyValues = varyBy.map(header => headers[header.toLowerCase()] || '').join('|');
      key += `|vary:${varyValues}`;
    }

    return key;
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + (entry.ttl * 1000)) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Store response in cache
   */
  private storeInCache(key: string, data: any, ttl: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      etag: this.generateETag(data)
    };

    this.cache.set(key, entry);
  }

  /**
   * Generate ETag for cache validation
   */
  private generateETag(data: any): string {
    // Simple hash of the data for ETag
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `"${Math.abs(hash).toString(16)}"`;
  }

  /**
   * Build target path with parameter substitution
   */
  private buildTargetPath(targetPath: string, _originalPath: string): string {
    // Simple parameter substitution
    // In a real implementation, you'd need more sophisticated path matching
    return targetPath.replace(/:[^/]+/g, (match) => {
      // Extract parameter value from original path
      // This is a simplified implementation
      return match; // For now, keep the parameter as-is
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    status: number,
    message: string,
    context: RequestContext,
    additionalHeaders: Record<string, string> = {}
  ) {
    return {
      status,
      headers: {
        'content-type': 'application/json',
        'x-request-id': context.requestId,
        'x-response-time': `${Date.now() - context.startTime}ms`,
        ...additionalHeaders
      },
      body: {
        error: message,
        status,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      },
      context
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log request for monitoring
   */
  private logRequest(context: RequestContext): void {
    const duration = Date.now() - context.startTime;
    const logData = {
      requestId: context.requestId,
      method: context.metadata.method,
      path: context.metadata.path,
      userId: context.userId,
      duration,
      route: context.route?.targetService,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 Gateway Request: ${JSON.stringify(logData)}`);

    // In production, send to your logging system
    securityService.logSecurityEvent(
      context.userId || 'anonymous',
      'api_request',
      context.metadata.path,
      'success',
      logData
    );
  }

  /**
   * Start cache cleanup task
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.timestamp + (entry.ttl * 1000)) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }

      // Also cleanup old rate limit counters
      let rateLimitCleaned = 0;
      for (const [key, counter] of this.rateLimitCounters.entries()) {
        if (now > counter.resetTime) {
          this.rateLimitCounters.delete(key);
          rateLimitCleaned++;
        }
      }

      if (rateLimitCleaned > 0) {
        console.log(`🧹 Cleaned ${rateLimitCleaned} expired rate limit counters`);
      }

    }, 300000); // 5 minutes
  }

  /**
   * Get gateway statistics
   */
  getGatewayStats(): {
    totalRoutes: number;
    activeRequests: number;
    cacheSize: number;
    rateLimitEntries: number;
    circuitBreakerStatus: Record<string, any>;
  } {
    return {
      totalRoutes: this.routes.size,
      activeRequests: this.requestContexts.size,
      cacheSize: this.cache.size,
      rateLimitEntries: this.rateLimitCounters.size,
      circuitBreakerStatus: circuitBreakerService.getAllStatuses()
    };
  }
}

// Global singleton instance
export const apiGatewayService = new APIGatewayService();