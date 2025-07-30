/**
 * Webhook Management Service - Phase 2 Critical Component
 * Handles dynamic webhook creation, validation, and management
 */

interface WebhookDefinition {
  id: string;
  workflowId: string;
  endpoint: string;
  secret: string;
  authentication: 'none' | 'api_key' | 'signature';
  payloadSchema: any;
  isActive: boolean;
  created: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface WebhookPayload {
  webhookId: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: Date;
  signature?: string;
}

export class WebhookService {
  private webhooks: Map<string, WebhookDefinition> = new Map();
  private webhookEndpoints: Map<string, string> = new Map(); // endpointId -> webhookId

  /**
   * Create a new webhook endpoint
   */
  async createWebhook(workflowId: string, config: {
    authentication?: 'none' | 'api_key' | 'signature';
    payloadSchema?: any;
  } = {}): Promise<WebhookDefinition> {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const endpoint = `https://api.genesis.app/webhooks/${webhookId}`;
    const secret = this.generateSecret();

    const webhook: WebhookDefinition = {
      id: webhookId,
      workflowId,
      endpoint,
      secret,
      authentication: config.authentication || 'signature',
      payloadSchema: config.payloadSchema,
      isActive: true,
      created: new Date(),
      triggerCount: 0
    };

    this.webhooks.set(webhookId, webhook);
    this.webhookEndpoints.set(endpoint, webhookId);

    console.log('🎣 Webhook created:', {
      id: webhookId,
      endpoint,
      workflowId
    });

    return webhook;
  }

  /**
   * Process incoming webhook payload
   */
  async processWebhook(endpoint: string, payload: any, headers: Record<string, string>): Promise<{
    success: boolean;
    workflowId?: string;
    error?: string;
  }> {
    try {
      const webhookId = this.webhookEndpoints.get(endpoint);
      if (!webhookId) {
        return { success: false, error: 'Webhook not found' };
      }

      const webhook = this.webhooks.get(webhookId);
      if (!webhook || !webhook.isActive) {
        return { success: false, error: 'Webhook inactive or not found' };
      }

      // Validate authentication
      const authResult = await this.validateAuthentication(webhook, payload, headers);
      if (!authResult.valid) {
        return { success: false, error: authResult.error };
      }

      // Validate payload schema
      const schemaResult = this.validatePayloadSchema(webhook, payload);
      if (!schemaResult.valid) {
        return { success: false, error: schemaResult.error };
      }

      // Update webhook statistics
      webhook.lastTriggered = new Date();
      webhook.triggerCount++;

      // Process the webhook payload
      const webhookPayload: WebhookPayload = {
        webhookId,
        payload,
        headers,
        timestamp: new Date(),
        signature: headers['x-webhook-signature']
      };

      // Trigger workflow execution
      await this.triggerWorkflow(webhook.workflowId, webhookPayload);

      console.log('✅ Webhook processed successfully:', {
        webhookId,
        workflowId: webhook.workflowId,
        triggerCount: webhook.triggerCount
      });

      return { success: true, workflowId: webhook.workflowId };
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      return { success: false, error: `Processing failed: ${error}` };
    }
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookDefinition | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks for a workflow
   */
  getWebhooksForWorkflow(workflowId: string): WebhookDefinition[] {
    return Array.from(this.webhooks.values()).filter(w => w.workflowId === workflowId);
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookDefinition>): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    Object.assign(webhook, updates);
    console.log('🔄 Webhook updated:', webhookId);
    return true;
  }

  /**
   * Deactivate webhook
   */
  async deactivateWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    webhook.isActive = false;
    console.log('⏸️ Webhook deactivated:', webhookId);
    return true;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    this.webhooks.delete(webhookId);
    this.webhookEndpoints.delete(webhook.endpoint);
    console.log('🗑️ Webhook deleted:', webhookId);
    return true;
  }

  /**
   * Generate webhook statistics
   */
  getWebhookStats(webhookId: string): {
    totalTriggers: number;
    lastTriggered?: Date;
    averageDaily: number;
    isHealthy: boolean;
  } | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const daysSinceCreated = Math.max(1, Math.floor((Date.now() - webhook.created.getTime()) / (1000 * 60 * 60 * 24)));
    const averageDaily = webhook.triggerCount / daysSinceCreated;
    const isHealthy = webhook.isActive && (!webhook.lastTriggered || Date.now() - webhook.lastTriggered.getTime() < 7 * 24 * 60 * 60 * 1000);

    return {
      totalTriggers: webhook.triggerCount,
      lastTriggered: webhook.lastTriggered,
      averageDaily,
      isHealthy
    };
  }

  /**
   * Test webhook with sample payload
   */
  async testWebhook(webhookId: string, samplePayload?: any): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        return { success: false, responseTime: 0, error: 'Webhook not found' };
      }

      const testPayload = samplePayload || { test: true, timestamp: new Date().toISOString() };
      const result = await this.processWebhook(webhook.endpoint, testPayload, {
        'content-type': 'application/json',
        'x-test-webhook': 'true'
      });

      const responseTime = Date.now() - startTime;

      return {
        success: result.success,
        responseTime,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: `Test failed: ${error}`
      };
    }
  }

  // Private helper methods

  private generateSecret(): string {
    return `webhook_secret_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async validateAuthentication(webhook: WebhookDefinition, _payload: any, headers: Record<string, string>): Promise<{
    valid: boolean;
    error?: string;
  }> {
    switch (webhook.authentication) {
      case 'none':
        return { valid: true };
      
      case 'api_key':
        const apiKey = headers['x-api-key'] || headers['authorization'];
        if (!apiKey) {
          return { valid: false, error: 'Missing API key' };
        }
        // In production, validate against stored API key
        return { valid: true };
      
      case 'signature':
        const signature = headers['x-webhook-signature'];
        if (!signature) {
          return { valid: false, error: 'Missing webhook signature' };
        }
        // In production, validate HMAC signature
        return { valid: true };
      
      default:
        return { valid: false, error: 'Unknown authentication method' };
    }
  }

  private validatePayloadSchema(webhook: WebhookDefinition, payload: any): {
    valid: boolean;
    error?: string;
  } {
    if (!webhook.payloadSchema) {
      return { valid: true };
    }

    // Basic schema validation (in production, use a proper JSON schema validator)
    try {
      if (typeof payload !== 'object' || payload === null) {
        return { valid: false, error: 'Payload must be an object' };
      }
      
      // Add more sophisticated validation as needed
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Schema validation failed: ${error}` };
    }
  }

  private async triggerWorkflow(workflowId: string, _webhookPayload: WebhookPayload): Promise<void> {
    try {
      // In production, this would trigger the actual workflow execution
      console.log('🚀 Triggering workflow:', {
        workflowId,
        webhookId: _webhookPayload.webhookId,
        timestamp: _webhookPayload.timestamp
      });

      // Emit event to canvas service for execution
      // This would integrate with the canvas execution engine
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

// Export types for external use
export type { WebhookDefinition, WebhookPayload };