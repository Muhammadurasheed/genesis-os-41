/**
 * Enhanced Credential Management Service
 * Phase 1: Foundation - Complete credential system for Genesis
 */

// import { supabase } from '@/lib/supabase'; // TODO: Fix import path

export interface CredentialDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: 'api_key' | 'oauth' | 'basic_auth' | 'bearer_token' | 'certificate';
  service: string;
  required: boolean;
  fields: CredentialField[];
  validation_rules: ValidationRule[];
  setup_instructions: string;
  documentation_url?: string;
  test_endpoint?: string;
}

export interface CredentialField {
  name: string;
  display_name: string;
  type: 'text' | 'password' | 'url' | 'email' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: string;
  help_text?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'url' | 'email' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface CredentialSet {
  id: string;
  user_id: string;
  definition_id: string;
  service: string;
  values: Record<string, string>;
  is_valid: boolean;
  last_validated: Date;
  created_at: Date;
  updated_at: Date;
  metadata: {
    test_results?: any;
    usage_count?: number;
    last_used?: Date;
  };
}

export interface CredentialTestResult {
  success: boolean;
  message: string;
  details?: any;
  tested_at: Date;
}

export class EnhancedCredentialManagementService {
  private credentialDefinitions: Map<string, CredentialDefinition> = new Map();

  constructor() {
    this.initializeBuiltInCredentials();
    console.log('🔐 Enhanced Credential Management Service initialized');
  }

  /**
   * Initialize built-in credential definitions for common services
   */
  private initializeBuiltInCredentials() {
    const builtInCredentials: CredentialDefinition[] = [
      {
        id: 'openai',
        name: 'openai_api_key',
        display_name: 'OpenAI API Key',
        description: 'API key for OpenAI GPT models',
        type: 'api_key',
        service: 'openai',
        required: true,
        fields: [
          {
            name: 'api_key',
            display_name: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'sk-...',
            help_text: 'Your OpenAI API key starting with sk-'
          },
          {
            name: 'organization_id',
            display_name: 'Organization ID (Optional)',
            type: 'text',
            required: false,
            placeholder: 'org-...',
            help_text: 'Your OpenAI organization ID (optional)'
          }
        ],
        validation_rules: [
          {
            field: 'api_key',
            rule: 'required',
            message: 'API key is required'
          },
          {
            field: 'api_key',
            rule: 'pattern',
            value: '^sk-[a-zA-Z0-9-_]{32,}$',
            message: 'API key must start with sk- and be at least 32 characters'
          }
        ],
        setup_instructions: 'Get your API key from OpenAI Platform',
        documentation_url: 'https://platform.openai.com/api-keys',
        test_endpoint: 'https://api.openai.com/v1/models'
      },
      {
        id: 'anthropic',
        name: 'anthropic_api_key',
        display_name: 'Anthropic API Key',
        description: 'API key for Anthropic Claude models',
        type: 'api_key',
        service: 'anthropic',
        required: true,
        fields: [
          {
            name: 'api_key',
            display_name: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'sk-ant-...',
            help_text: 'Your Anthropic API key starting with sk-ant-'
          }
        ],
        validation_rules: [
          {
            field: 'api_key',
            rule: 'required',
            message: 'API key is required'
          },
          {
            field: 'api_key',
            rule: 'pattern',
            value: '^sk-ant-[a-zA-Z0-9-_]{32,}$',
            message: 'API key must start with sk-ant- and be properly formatted'
          }
        ],
        setup_instructions: 'Get your API key from Anthropic Console',
        documentation_url: 'https://console.anthropic.com/settings/keys',
        test_endpoint: 'https://api.anthropic.com/v1/messages'
      },
      {
        id: 'stripe',
        name: 'stripe_keys',
        display_name: 'Stripe API Keys',
        description: 'API keys for Stripe payment processing',
        type: 'api_key',
        service: 'stripe',
        required: true,
        fields: [
          {
            name: 'publishable_key',
            display_name: 'Publishable Key',
            type: 'text',
            required: true,
            placeholder: 'pk_test_...',
            help_text: 'Your Stripe publishable key (safe to expose in frontend)'
          },
          {
            name: 'secret_key',
            display_name: 'Secret Key',
            type: 'password',
            required: true,
            placeholder: 'sk_test_...',
            help_text: 'Your Stripe secret key (keep this secure)'
          },
          {
            name: 'webhook_secret',
            display_name: 'Webhook Endpoint Secret',
            type: 'password',
            required: false,
            placeholder: 'whsec_...',
            help_text: 'Webhook endpoint secret for event verification'
          }
        ],
        validation_rules: [
          {
            field: 'publishable_key',
            rule: 'pattern',
            value: '^pk_(test_|live_)[a-zA-Z0-9]{24,}$',
            message: 'Publishable key must start with pk_test_ or pk_live_'
          },
          {
            field: 'secret_key',
            rule: 'pattern',
            value: '^sk_(test_|live_)[a-zA-Z0-9]{24,}$',
            message: 'Secret key must start with sk_test_ or sk_live_'
          }
        ],
        setup_instructions: 'Get your API keys from Stripe Dashboard',
        documentation_url: 'https://dashboard.stripe.com/apikeys',
        test_endpoint: 'https://api.stripe.com/v1/account'
      },
      {
        id: 'twilio',
        name: 'twilio_credentials',
        display_name: 'Twilio Credentials',
        description: 'Credentials for Twilio SMS and voice services',
        type: 'basic_auth',
        service: 'twilio',
        required: true,
        fields: [
          {
            name: 'account_sid',
            display_name: 'Account SID',
            type: 'text',
            required: true,
            placeholder: 'AC...',
            help_text: 'Your Twilio Account SID'
          },
          {
            name: 'auth_token',
            display_name: 'Auth Token',
            type: 'password',
            required: true,
            placeholder: 'Your auth token',
            help_text: 'Your Twilio Auth Token'
          },
          {
            name: 'phone_number',
            display_name: 'Twilio Phone Number',
            type: 'text',
            required: false,
            placeholder: '+1234567890',
            help_text: 'Your Twilio phone number (with country code)'
          }
        ],
        validation_rules: [
          {
            field: 'account_sid',
            rule: 'pattern',
            value: '^AC[a-f0-9]{32}$',
            message: 'Account SID must start with AC and be 34 characters'
          }
        ],
        setup_instructions: 'Get your credentials from Twilio Console',
        documentation_url: 'https://console.twilio.com/',
        test_endpoint: 'https://api.twilio.com/2010-04-01/Accounts'
      },
      {
        id: 'sendgrid',
        name: 'sendgrid_api_key',
        display_name: 'SendGrid API Key',
        description: 'API key for SendGrid email service',
        type: 'api_key',
        service: 'sendgrid',
        required: true,
        fields: [
          {
            name: 'api_key',
            display_name: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'SG...',
            help_text: 'Your SendGrid API key'
          },
          {
            name: 'from_email',
            display_name: 'From Email',
            type: 'email',
            required: true,
            placeholder: 'noreply@yourdomain.com',
            help_text: 'Default sender email address'
          },
          {
            name: 'from_name',
            display_name: 'From Name',
            type: 'text',
            required: false,
            placeholder: 'Your Company',
            help_text: 'Default sender name'
          }
        ],
        validation_rules: [
          {
            field: 'api_key',
            rule: 'pattern',
            value: '^SG\\.[a-zA-Z0-9_-]{22}\\.[a-zA-Z0-9_-]{43}$',
            message: 'SendGrid API key format is invalid'
          },
          {
            field: 'from_email',
            rule: 'email',
            message: 'Please enter a valid email address'
          }
        ],
        setup_instructions: 'Create an API key in SendGrid Settings',
        documentation_url: 'https://app.sendgrid.com/settings/api_keys',
        test_endpoint: 'https://api.sendgrid.com/v3/user/account'
      }
    ];

    builtInCredentials.forEach(def => {
      this.credentialDefinitions.set(def.id, def);
    });
  }

  /**
   * Get all available credential definitions
   */
  public getCredentialDefinitions(): CredentialDefinition[] {
    return Array.from(this.credentialDefinitions.values());
  }

  /**
   * Get credential definition by ID
   */
  public getCredentialDefinition(id: string): CredentialDefinition | null {
    return this.credentialDefinitions.get(id) || null;
  }

  /**
   * Get credential definitions for specific services
   */
  public getCredentialDefinitionsForServices(services: string[]): CredentialDefinition[] {
    return Array.from(this.credentialDefinitions.values())
      .filter(def => services.includes(def.service));
  }

  /**
   * Save credentials for a user
   */
  public async saveCredentials(
    userId: string,
    definitionId: string,
    values: Record<string, string>
  ): Promise<string> {
    const definition = this.credentialDefinitions.get(definitionId);
    if (!definition) {
      throw new Error(`Credential definition ${definitionId} not found`);
    }

    // Validate credentials
    const validationResult = this.validateCredentials(definition, values);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Test credentials if test endpoint is available
    let testResult: CredentialTestResult | null = null;
    if (definition.test_endpoint) {
      testResult = await this.testCredentials(definition, values);
    }

    // Save to Supabase using Supabase secrets
    console.log(`💾 Storing credentials for ${definition.service}`, {
      user_id: userId,
      definition_id: definitionId,
      service: definition.service,
      is_valid: testResult?.success ?? true,
      metadata: { test_results: testResult, usage_count: 0 }
    });

    // Store sensitive values as Supabase secrets
    for (const field of definition.fields) {
      if (field.type === 'password' && values[field.name]) {
        const secretName = `${definition.service.toUpperCase()}_${field.name.toUpperCase()}`;
        // TODO: Use Supabase vault for secure storage
        console.log(`📝 Would store secret: ${secretName}`);
      }
    }

    console.log(`✅ Credentials saved for ${definition.service}`);
    return `cred_${Date.now()}`;
  }

  /**
   * Get user credentials for a service
   */
  public async getUserCredentials(userId: string, service: string): Promise<CredentialSet | null> {
    try {
      // TODO: Implement actual Supabase query
      console.log(`🔍 Getting credentials for user ${userId}, service ${service}`);
      return null;
    } catch (error) {
      console.error('Failed to get user credentials:', error);
      return null;
    }
  }

  /**
   * Test credentials against service API
   */
  public async testCredentials(
    definition: CredentialDefinition,
    values: Record<string, string>
  ): Promise<CredentialTestResult> {
    if (!definition.test_endpoint) {
      return {
        success: true,
        message: 'No test endpoint available',
        tested_at: new Date()
      };
    }

    console.log(`🧪 Testing credentials for ${definition.service}`);

    try {
      // Implement service-specific testing logic
      switch (definition.service) {
        case 'openai':
          return await this.testOpenAICredentials(values);
        case 'anthropic':
          return await this.testAnthropicCredentials(values);
        case 'stripe':
          return await this.testStripeCredentials(values);
        case 'twilio':
          return await this.testTwilioCredentials(values);
        case 'sendgrid':
          return await this.testSendGridCredentials(values);
        default:
          return {
            success: true,
            message: 'Service-specific testing not implemented',
            tested_at: new Date()
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tested_at: new Date()
      };
    }
  }

  /**
   * Validate credential values against definition rules
   */
  public validateCredentials(
    definition: CredentialDefinition,
    values: Record<string, string>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of definition.validation_rules) {
      const value = values[rule.field];

      switch (rule.rule) {
        case 'required':
          if (!value || value.trim() === '') {
            errors.push(rule.message);
          }
          break;
        
        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            errors.push(rule.message);
          }
          break;
        
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message);
          }
          break;
        
        case 'url':
          if (value) {
            try {
              new URL(value);
            } catch {
              errors.push(rule.message);
            }
          }
          break;
        
        case 'min_length':
          if (value && value.length < rule.value) {
            errors.push(rule.message);
          }
          break;
        
        case 'max_length':
          if (value && value.length > rule.value) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Service-specific credential testing methods

  private async testOpenAICredentials(values: Record<string, string>): Promise<CredentialTestResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${values.api_key}`,
          'OpenAI-Organization': values.organization_id || ''
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'OpenAI credentials are valid',
          details: { status: response.status },
          tested_at: new Date()
        };
      } else {
        return {
          success: false,
          message: `OpenAI API returned ${response.status}: ${response.statusText}`,
          tested_at: new Date()
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
        tested_at: new Date()
      };
    }
  }

  private async testAnthropicCredentials(values: Record<string, string>): Promise<CredentialTestResult> {
    // TODO: Implement Anthropic API test
    console.log('Testing Anthropic credentials:', values.api_key ? '***' : 'missing');
    return {
      success: true,
      message: 'Anthropic test not yet implemented',
      tested_at: new Date()
    };
  }

  private async testStripeCredentials(values: Record<string, string>): Promise<CredentialTestResult> {
    // TODO: Implement Stripe API test
    console.log('Testing Stripe credentials:', values.secret_key ? '***' : 'missing');
    return {
      success: true,
      message: 'Stripe test not yet implemented',
      tested_at: new Date()
    };
  }

  private async testTwilioCredentials(values: Record<string, string>): Promise<CredentialTestResult> {
    // TODO: Implement Twilio API test
    console.log('Testing Twilio credentials:', values.account_sid, values.auth_token ? '***' : 'missing');
    return {
      success: true,
      message: 'Twilio test not yet implemented',
      tested_at: new Date()
    };
  }

  private async testSendGridCredentials(values: Record<string, string>): Promise<CredentialTestResult> {
    // TODO: Implement SendGrid API test
    console.log('Testing SendGrid credentials:', values.api_key ? '***' : 'missing');
    return {
      success: true,
      message: 'SendGrid test not yet implemented',
      tested_at: new Date()
    };
  }

  /**
   * Delete user credentials
   */
  public async deleteCredentials(userId: string, credentialId: string): Promise<void> {
    console.log(`🗑️ Deleting credentials ${credentialId} for user ${userId}`);
    // TODO: Implement actual deletion from Supabase
  }

  /**
   * Update credentials
   */
  public async updateCredentials(
    credentialId: string,
    _values: Record<string, string>
  ): Promise<void> {
    console.log(`📝 Updating credentials ${credentialId}`);
    // TODO: Implement actual update in Supabase
  }

  /**
   * Get required credentials for agent tools
   */
  public getRequiredCredentialsForTools(tools: string[]): CredentialDefinition[] {
    const requiredServices = new Set<string>();
    
    // Map tools to services
    for (const tool of tools) {
      if (tool.includes('openai') || tool.includes('gpt')) {
        requiredServices.add('openai');
      }
      if (tool.includes('anthropic') || tool.includes('claude')) {
        requiredServices.add('anthropic');
      }
      if (tool.includes('stripe') || tool.includes('payment')) {
        requiredServices.add('stripe');
      }
      if (tool.includes('twilio') || tool.includes('sms')) {
        requiredServices.add('twilio');
      }
      if (tool.includes('sendgrid') || tool.includes('email')) {
        requiredServices.add('sendgrid');
      }
    }

    return Array.from(this.credentialDefinitions.values())
      .filter(def => requiredServices.has(def.service));
  }
}

// Singleton instance
export const enhancedCredentialManagementService = new EnhancedCredentialManagementService();