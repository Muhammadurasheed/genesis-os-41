/**
 * Circuit Breaker Service - FAANG Level Implementation
 * Prevents cascade failures and provides fault tolerance
 */

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  volumeThreshold: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  nextAttempt: number;
  lastFailureTime: number;
}

interface CircuitBreakerMetrics {
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  rejectedRequests: number;
  averageResponseTime: number;
  lastStateChange: number;
}

export class CircuitBreakerService {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();
  private metrics: Map<string, CircuitBreakerMetrics> = new Map();
  private requestTimes: Map<string, number[]> = new Map();

  constructor() {
    console.log('⚡ Circuit Breaker Service initialized');
    this.startMonitoring();
  }

  /**
   * Register a circuit breaker for a service
   */
  registerCircuit(
    serviceName: string, 
    config: Partial<CircuitBreakerConfig> = {}
  ): void {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      volumeThreshold: 10,
      ...config
    };

    this.configs.set(serviceName, defaultConfig);
    this.circuits.set(serviceName, {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      nextAttempt: 0,
      lastFailureTime: 0
    });
    this.metrics.set(serviceName, {
      totalRequests: 0,
      failedRequests: 0,
      successfulRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
      lastStateChange: Date.now()
    });
    this.requestTimes.set(serviceName, []);

    console.log(`🔧 Circuit breaker registered for ${serviceName}`);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(serviceName);
    const config = this.configs.get(serviceName);
    const metrics = this.metrics.get(serviceName);

    if (!circuit || !config || !metrics) {
      throw new Error(`Circuit breaker not registered for service: ${serviceName}`);
    }

    // Check if circuit should reject the request
    if (this.shouldReject(serviceName)) {
      metrics.rejectedRequests++;
      console.warn(`🚫 Circuit breaker OPEN - rejecting request for ${serviceName}`);
      
      if (fallback) {
        return fallback();
      }
      throw new Error(`Service ${serviceName} is currently unavailable (Circuit breaker OPEN)`);
    }

    const startTime = Date.now();
    metrics.totalRequests++;

    try {
      const result = await operation();
      
      // Record success
      const responseTime = Date.now() - startTime;
      this.recordSuccess(serviceName, responseTime);
      
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(serviceName);
      
      if (fallback) {
        console.warn(`🔄 Circuit breaker fallback triggered for ${serviceName}`);
        return fallback();
      }
      
      throw error;
    }
  }

  /**
   * Check if request should be rejected
   */
  private shouldReject(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName)!;
    const now = Date.now();

    switch (circuit.state) {
      case 'OPEN':
        if (now >= circuit.nextAttempt) {
          circuit.state = 'HALF_OPEN';
          circuit.successCount = 0;
          this.updateMetrics(serviceName, 'lastStateChange', now);
          console.log(`🔄 Circuit breaker transitioning to HALF_OPEN for ${serviceName}`);
          return false;
        }
        return true;

      case 'HALF_OPEN':
        // Allow limited requests in half-open state
        return circuit.successCount >= 3; // Allow 3 test requests

      case 'CLOSED':
      default:
        return false;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(serviceName: string, responseTime: number): void {
    const circuit = this.circuits.get(serviceName)!;
    const metrics = this.metrics.get(serviceName)!;
    const times = this.requestTimes.get(serviceName)!;

    metrics.successfulRequests++;
    circuit.successCount++;

    // Update response time metrics
    times.push(responseTime);
    if (times.length > 100) {
      times.shift(); // Keep only last 100 times
    }
    metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Reset failure count on success
    if (circuit.state === 'HALF_OPEN' && circuit.successCount >= 3) {
      circuit.state = 'CLOSED';
      circuit.failureCount = 0;
      metrics.lastStateChange = Date.now();
      console.log(`✅ Circuit breaker CLOSED for ${serviceName} - service recovered`);
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(serviceName: string): void {
    const circuit = this.circuits.get(serviceName)!;
    const config = this.configs.get(serviceName)!;
    const metrics = this.metrics.get(serviceName)!;

    metrics.failedRequests++;
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (circuit.state === 'CLOSED' && this.shouldOpen(serviceName)) {
      circuit.state = 'OPEN';
      circuit.nextAttempt = Date.now() + config.recoveryTimeout;
      metrics.lastStateChange = Date.now();
      console.warn(`🔴 Circuit breaker OPEN for ${serviceName} - too many failures`);
    } else if (circuit.state === 'HALF_OPEN') {
      circuit.state = 'OPEN';
      circuit.nextAttempt = Date.now() + config.recoveryTimeout;
      metrics.lastStateChange = Date.now();
      console.warn(`🔴 Circuit breaker reopened for ${serviceName} - test failed`);
    }
  }

  /**
   * Determine if circuit should open
   */
  private shouldOpen(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName)!;
    const config = this.configs.get(serviceName)!;
    const metrics = this.metrics.get(serviceName)!;

    // Check failure threshold
    if (circuit.failureCount >= config.failureThreshold) {
      // Check volume threshold
      if (metrics.totalRequests >= config.volumeThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus(serviceName: string): {
    state: string;
    metrics: CircuitBreakerMetrics;
    health: 'healthy' | 'degraded' | 'unhealthy';
  } | null {
    const circuit = this.circuits.get(serviceName);
    const metrics = this.metrics.get(serviceName);

    if (!circuit || !metrics) {
      return null;
    }

    const failureRate = metrics.totalRequests > 0 ? 
      (metrics.failedRequests / metrics.totalRequests) * 100 : 0;

    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (circuit.state === 'OPEN') {
      health = 'unhealthy';
    } else if (failureRate > 10 || circuit.state === 'HALF_OPEN') {
      health = 'degraded';
    }

    return {
      state: circuit.state,
      metrics: { ...metrics },
      health
    };
  }

  /**
   * Get all circuit statuses
   */
  getAllCircuitStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const [serviceName] of this.circuits) {
      statuses[serviceName] = this.getCircuitStatus(serviceName);
    }

    return statuses;
  }

  /**
   * Get all statuses (alias for compatibility)
   */
  getAllStatuses(): Record<string, any> {
    return this.getAllCircuitStatuses();
  }

  /**
   * Force circuit state change (for testing/maintenance)
   */
  forceCircuitState(serviceName: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): boolean {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return false;

    circuit.state = state;
    circuit.failureCount = 0;
    circuit.successCount = 0;
    
    const metrics = this.metrics.get(serviceName)!;
    metrics.lastStateChange = Date.now();

    console.log(`🔧 Circuit breaker for ${serviceName} forced to ${state}`);
    return true;
  }

  /**
   * Reset circuit breaker metrics
   */
  resetMetrics(serviceName: string): boolean {
    const metrics = this.metrics.get(serviceName);
    const circuit = this.circuits.get(serviceName);
    
    if (!metrics || !circuit) return false;

    Object.assign(metrics, {
      totalRequests: 0,
      failedRequests: 0,
      successfulRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
      lastStateChange: Date.now()
    });

    circuit.failureCount = 0;
    circuit.successCount = 0;
    this.requestTimes.set(serviceName, []);

    console.log(`🔄 Metrics reset for circuit breaker: ${serviceName}`);
    return true;
  }

  /**
   * Update metric helper
   */
  private updateMetrics(serviceName: string, key: keyof CircuitBreakerMetrics, value: number): void {
    const metrics = this.metrics.get(serviceName);
    if (metrics) {
      (metrics as any)[key] = value;
    }
  }

  /**
   * Start monitoring and cleanup
   */
  private startMonitoring(): void {
    setInterval(() => {
      // Clean up old request times and perform health checks
      for (const [serviceName, times] of this.requestTimes.entries()) {
        if (times.length > 100) {
          this.requestTimes.set(serviceName, times.slice(-50));
        }
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Shutdown circuit breaker service
   */
  shutdown(): void {
    this.circuits.clear();
    this.configs.clear();
    this.metrics.clear();
    this.requestTimes.clear();
    console.log('🛑 Circuit Breaker Service shut down');
  }
}

// Global singleton
export const circuitBreakerService = new CircuitBreakerService();