// ============================================================
// Phase 2: API Integration Framework - Dynamic Connectors & OAuth
// Production-grade API integration with rate limiting and error handling
// ============================================================

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface APIConnectorConfig {
  connectorId: string;
  name: string;
  baseUrl: string;
  auth: {
    type: 'api_key' | 'oauth' | 'bearer' | 'basic';
    credentials: Record<string, string>;
  };
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    backoffMs: number;
  };
  headers?: Record<string, string>;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
}

export interface APIRequest {
  requestId: string;
  connectorId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface APIResponse {
  requestId: string;
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  headers: Record<string, string>;
  duration: number;
  timestamp: Date;
  retryCount: number;
}

export interface RateLimitStatus {
  connectorId: string;
  requests: number;
  windowStart: number;
  isLimited: boolean;
  resetTime: number;
}

class APIIntegrationFramework extends EventEmitter {
  private connectors: Map<string, APIConnectorConfig> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private rateLimits: Map<string, RateLimitStatus> = new Map();
  private oauthTokens: Map<string, any> = new Map();

  constructor() {
    super();
    console.log('🔌 API Integration Framework initializing...');
    this.startRateLimitCleanup();
  }

  // Create Dynamic API Connector
  async createConnector(config: APIConnectorConfig): Promise<string> {
    try {
      console.log(`🔧 Creating API connector: ${config.name}`);

      // Create Axios instance with configuration
      const client = axios.create({
        baseURL: config.baseUrl,
        headers: {
          'User-Agent': 'Genesis-Agent/1.0',
          ...config.headers
        },
        timeout: 30000
      });

      // Setup authentication
      await this.setupAuthentication(client, config);

      // Setup request/response interceptors
      this.setupInterceptors(client, config.connectorId);

      // Store connector and client
      this.connectors.set(config.connectorId, config);
      this.clients.set(config.connectorId, client);

      // Initialize rate limit tracking
      this.rateLimits.set(config.connectorId, {
        connectorId: config.connectorId,
        requests: 0,
        windowStart: Date.now(),
        isLimited: false,
        resetTime: Date.now() + config.rateLimit.window
      });

      this.emit('connectorCreated', { connectorId: config.connectorId, name: config.name });
      console.log(`✅ API connector created: ${config.connectorId}`);
      
      return config.connectorId;

    } catch (error) {
      console.error(`❌ Failed to create connector ${config.connectorId}:`, error);
      throw new Error(`Connector creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // OAuth Flow Handling
  async initiateOAuthFlow(connectorId: string, oauthConfig: OAuthConfig): Promise<string> {
    console.log(`🔐 Initiating OAuth flow for: ${connectorId}`);

    const state = `${connectorId}-${Date.now()}`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      scope: oauthConfig.scopes.join(' '),
      state
    });

    const authUrl = `${oauthConfig.authUrl}?${params.toString()}`;
    
    this.emit('oauthInitiated', { connectorId, authUrl, state });
    return authUrl;
  }

  async completeOAuthFlow(connectorId: string, authCode: string, oauthConfig: OAuthConfig): Promise<any> {
    try {
      console.log(`🔑 Completing OAuth flow for: ${connectorId}`);

      const tokenResponse = await axios.post(oauthConfig.tokenUrl, {
        grant_type: 'authorization_code',
        code: authCode,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokens = tokenResponse.data;
      this.oauthTokens.set(connectorId, tokens);

      // Update connector authentication
      const connector = this.connectors.get(connectorId);
      if (connector) {
        connector.auth.credentials.access_token = tokens.access_token;
        if (tokens.refresh_token) {
          connector.auth.credentials.refresh_token = tokens.refresh_token;
        }

        // Update client with new token
        const client = this.clients.get(connectorId);
        if (client) {
          client.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
        }
      }

      this.emit('oauthCompleted', { connectorId, tokens });
      console.log(`✅ OAuth flow completed for: ${connectorId}`);
      
      return tokens;

    } catch (error) {
      console.error(`❌ OAuth flow failed for ${connectorId}:`, error);
      this.emit('oauthFailed', { connectorId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Execute API Request with Rate Limiting
  async executeRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      const connector = this.connectors.get(request.connectorId);
      if (!connector) {
        throw new Error(`Connector ${request.connectorId} not found`);
      }

      // Check rate limit
      const canProceed = await this.checkRateLimit(request.connectorId);
      if (!canProceed) {
        const rateLimitStatus = this.rateLimits.get(request.connectorId)!;
        const waitTime = rateLimitStatus.resetTime - Date.now();
        
        this.emit('rateLimited', { 
          connectorId: request.connectorId, 
          waitTime,
          resetTime: rateLimitStatus.resetTime 
        });
        
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
      }

      const client = this.clients.get(request.connectorId)!;
      
      // Prepare request config
      const config: AxiosRequestConfig = {
        method: request.method,
        url: request.endpoint,
        data: request.data,
        headers: request.headers,
        timeout: request.timeout || 30000
      };

      console.log(`🚀 Executing ${request.method} request to ${request.endpoint}`);

      // Execute request with retry logic
      let response: AxiosResponse;
      let retryCount = 0;
      const maxRetries = connector.retryPolicy.enabled ? connector.retryPolicy.maxRetries : 0;

      while (retryCount <= maxRetries) {
        try {
          response = await client.request(config);
          break;
        } catch (error: any) {
          retryCount++;
          
          if (retryCount > maxRetries) {
            throw error;
          }

          // Check if error is retryable
          if (this.isRetryableError(error)) {
            const backoffTime = connector.retryPolicy.backoffMs * Math.pow(2, retryCount - 1);
            console.log(`⏳ Retrying request in ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            throw error;
          }
        }
      }

      // Update rate limit counter
      this.updateRateLimit(request.connectorId);

      const apiResponse: APIResponse = {
        requestId: request.requestId,
        success: true,
        status: response!.status,
        data: response!.data,
        headers: response!.headers as Record<string, string>,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        retryCount
      };

      this.emit('requestCompleted', apiResponse);
      return apiResponse;

    } catch (error: any) {
      const apiResponse: APIResponse = {
        requestId: request.requestId,
        success: false,
        status: error.response?.status || 0,
        error: error.response?.data?.message || error.message || 'Unknown error',
        headers: error.response?.headers || {},
        duration: Date.now() - startTime,
        timestamp: new Date(),
        retryCount: 0
      };

      this.emit('requestFailed', apiResponse);
      return apiResponse;
    }
  }

  // Data Parsing and Extraction
  parseResponse(response: APIResponse, extractionRules?: Record<string, string>): any {
    if (!response.success || !response.data) {
      return null;
    }

    if (!extractionRules) {
      return response.data;
    }

    const extracted: Record<string, any> = {};
    
    for (const [key, path] of Object.entries(extractionRules)) {
      try {
        // Simple JSON path extraction (e.g., "data.items[0].name")
        const value = this.extractByPath(response.data, path);
        extracted[key] = value;
      } catch (error) {
        console.warn(`Failed to extract ${key} from path ${path}:`, error);
        extracted[key] = null;
      }
    }

    return extracted;
  }

  // Common API Connectors Templates
  async createShopifyConnector(shop: string, accessToken: string): Promise<string> {
    return this.createConnector({
      connectorId: `shopify-${shop}`,
      name: `Shopify - ${shop}`,
      baseUrl: `https://${shop}.myshopify.com/admin/api/2023-10`,
      auth: {
        type: 'api_key',
        credentials: { 'X-Shopify-Access-Token': accessToken }
      },
      rateLimit: { requests: 40, window: 1000 }, // Shopify rate limit
      retryPolicy: { enabled: true, maxRetries: 3, backoffMs: 1000 },
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async createStripeConnector(secretKey: string): Promise<string> {
    return this.createConnector({
      connectorId: 'stripe',
      name: 'Stripe Payments',
      baseUrl: 'https://api.stripe.com/v1',
      auth: {
        type: 'bearer',
        credentials: { token: secretKey }
      },
      rateLimit: { requests: 100, window: 1000 },
      retryPolicy: { enabled: true, maxRetries: 3, backoffMs: 500 }
    });
  }

  async createSendGridConnector(apiKey: string): Promise<string> {
    return this.createConnector({
      connectorId: 'sendgrid',
      name: 'SendGrid Email',
      baseUrl: 'https://api.sendgrid.com/v3',
      auth: {
        type: 'bearer',
        credentials: { token: apiKey }
      },
      rateLimit: { requests: 600, window: 60000 }, // 600 requests per minute
      retryPolicy: { enabled: true, maxRetries: 2, backoffMs: 1000 }
    });
  }

  // Private helper methods
  private async setupAuthentication(client: AxiosInstance, config: APIConnectorConfig): Promise<void> {
    switch (config.auth.type) {
      case 'api_key':
        // API key can be in headers or query params
        for (const [key, value] of Object.entries(config.auth.credentials)) {
          client.defaults.headers.common[key] = value;
        }
        break;
        
      case 'bearer':
        const token = config.auth.credentials.token;
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        break;
        
      case 'basic':
        const username = config.auth.credentials.username;
        const password = config.auth.credentials.password;
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        client.defaults.headers.common['Authorization'] = `Basic ${encoded}`;
        break;
        
      case 'oauth':
        // OAuth token will be set after authentication flow
        break;
    }
  }

  private setupInterceptors(client: AxiosInstance, connectorId: string): void {
    // Request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        this.emit('requestStarted', { connectorId, url: config.url, method: config.method });
        return config;
      },
      (error) => {
        this.emit('requestError', { connectorId, error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and token refresh
    client.interceptors.response.use(
      (response) => {
        this.emit('responseReceived', { connectorId, status: response.status });
        return response;
      },
      async (error) => {
        // Handle token refresh for OAuth
        if (error.response?.status === 401 && this.oauthTokens.has(connectorId)) {
          const tokens = this.oauthTokens.get(connectorId);
          if (tokens?.refresh_token) {
            // Implement token refresh logic here
            console.log('🔄 Attempting to refresh OAuth token...');
          }
        }
        
        this.emit('responseError', { connectorId, status: error.response?.status, error: error.message });
        return Promise.reject(error);
      }
    );
  }

  private async checkRateLimit(connectorId: string): Promise<boolean> {
    const rateLimitStatus = this.rateLimits.get(connectorId);
    if (!rateLimitStatus) return true;

    const now = Date.now();
    const connector = this.connectors.get(connectorId)!;

    // Reset window if expired
    if (now >= rateLimitStatus.resetTime) {
      rateLimitStatus.requests = 0;
      rateLimitStatus.windowStart = now;
      rateLimitStatus.resetTime = now + connector.rateLimit.window;
      rateLimitStatus.isLimited = false;
    }

    // Check if limit exceeded
    if (rateLimitStatus.requests >= connector.rateLimit.requests) {
      rateLimitStatus.isLimited = true;
      return false;
    }

    return true;
  }

  private updateRateLimit(connectorId: string): void {
    const rateLimitStatus = this.rateLimits.get(connectorId);
    if (rateLimitStatus) {
      rateLimitStatus.requests++;
    }
  }

  private isRetryableError(error: any): boolean {
    const status = error.response?.status;
    // Retry on server errors and rate limits
    return status >= 500 || status === 429;
  }

  private extractByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        // Handle array access like "items[0]"
        const [property, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current[property][index];
      } else {
        current = current[part];
      }
      
      if (current === undefined) {
        return null;
      }
    }
    
    return current;
  }

  private startRateLimitCleanup(): void {
    // Clean up old rate limit entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [connectorId, status] of this.rateLimits.entries()) {
        if (now > status.resetTime + 300000) { // 5 minutes past reset
          this.rateLimits.delete(connectorId);
        }
      }
    }, 300000); // Run every 5 minutes
  }

  // Public management methods
  getConnector(connectorId: string): APIConnectorConfig | undefined {
    return this.connectors.get(connectorId);
  }

  getAllConnectors(): APIConnectorConfig[] {
    return Array.from(this.connectors.values());
  }

  getRateLimitStatus(connectorId: string): RateLimitStatus | undefined {
    return this.rateLimits.get(connectorId);
  }

  async removeConnector(connectorId: string): Promise<void> {
    this.connectors.delete(connectorId);
    this.clients.delete(connectorId);
    this.rateLimits.delete(connectorId);
    this.oauthTokens.delete(connectorId);
    
    this.emit('connectorRemoved', { connectorId });
    console.log(`🗑️ Connector removed: ${connectorId}`);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up API Integration Framework...');
    this.connectors.clear();
    this.clients.clear();
    this.rateLimits.clear();
    this.oauthTokens.clear();
  }
}

// Create singleton instance
export const apiIntegrationFramework = new APIIntegrationFramework();
export default apiIntegrationFramework;