import { supabase } from '../lib/supabase';
import { backendAPIService } from './backendAPIService';
import { 
  CredentialDefinition, 
  CredentialValidationResult, 
  CredentialSetupFlow,
  ServiceCredentialGuide,
  PriorityIntegration 
} from '../types/credentials';

class CredentialManagementService {
  /**
   * Phase 2: Security-First Credential Architecture
   */
  async createCredential(credential: Omit<CredentialDefinition, 'id' | 'encrypted_value' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      console.log('🔐 Credential Management: Creating secure credential...');
      
      // Try backend credential service first
      try {
        const response = await backendAPIService.createCredential(credential);
        if (response.success) {
          console.log('✅ Credential created via backend service');
          return response.data.credentialId;
        }
      } catch (backendError) {
        console.warn('Backend credential creation failed, using edge function fallback:', backendError);
      }
      
      // Fallback to edge function credential storage
      const response = await supabase.functions.invoke('credential-management', {
        body: {
          action: 'create_credential',
          credential
        }
      });

      if (response.error) {
        throw new Error(`Credential creation failed: ${response.error.message}`);
      }

      return response.data.credential_id;
    } catch (error) {
      console.error('Credential creation failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Real-time Credential Validation
   */
  async validateCredential(credentialId: string): Promise<CredentialValidationResult> {
    try {
      console.log('🔍 Credential Validation: Testing credential...');
      
      // Try backend validation service first
      try {
        const response = await backendAPIService.validateCredential(credentialId);
        if (response.success) {
          return response.data;
        }
      } catch (backendError) {
        console.warn('Backend validation failed, using edge function fallback:', backendError);
      }
      
      // Fallback to edge function validation
      const response = await supabase.functions.invoke('credential-management', {
        body: {
          action: 'validate_credential',
          credential_id: credentialId
        }
      });

      if (response.error) {
        throw new Error(`Credential validation failed: ${response.error.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return {
        isValid: false,
        status: 'network_error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tested_at: new Date().toISOString()
      };
    }
  }

  /**
   * Phase 2: MCP Integration and Tool Registry
   */
  async registerMCPTool(toolConfig: {
    name: string;
    description: string;
    endpoint: string;
    credential_id: string;
    schema: any;
  }): Promise<string> {
    try {
      console.log('🛠️ MCP Integration: Registering tool...');
      
      const response = await supabase.functions.invoke('mcp-integration', {
        body: {
          action: 'register_tool',
          tool_config: toolConfig
        }
      });

      if (response.error) {
        throw new Error(`Tool registration failed: ${response.error.message}`);
      }

      console.log('✅ MCP tool registered successfully');
      return response.data.tool_id;
    } catch (error) {
      console.error('MCP tool registration failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Credential Setup Wizard
   */
  async getServiceSetupGuide(serviceId: PriorityIntegration): Promise<ServiceCredentialGuide> {
    const guides: Record<PriorityIntegration, ServiceCredentialGuide> = {
      // Communication
      gmail: {
        service_id: 'gmail',
        service_name: 'Gmail',
        setup_steps: [
          {
            step_number: 1,
            title: 'Enable Gmail API',
            description: 'Go to Google Cloud Console and enable the Gmail API',
            external_url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com'
          },
          {
            step_number: 2,
            title: 'Create OAuth2 Credentials',
            description: 'Create OAuth2 client ID credentials for your application',
            external_url: 'https://console.cloud.google.com/apis/credentials'
          }
        ],
        common_errors: [
          {
            error_code: 'invalid_grant',
            title: 'Invalid Grant Error',
            description: 'OAuth token has expired or is invalid',
            solution: 'Re-authenticate and obtain a new token'
          }
        ],
        test_instructions: 'Send a test email to verify the connection',
        documentation_url: 'https://developers.google.com/gmail/api'
      },
      slack: {
        service_id: 'slack',
        service_name: 'Slack',
        setup_steps: [
          {
            step_number: 1,
            title: 'Create Slack App',
            description: 'Create a new Slack app in your workspace',
            external_url: 'https://api.slack.com/apps/new'
          },
          {
            step_number: 2,
            title: 'Get Bot Token',
            description: 'Install the app and copy the Bot User OAuth Token',
            code_example: 'xoxb-your-bot-token-here'
          }
        ],
        common_errors: [
          {
            error_code: 'invalid_auth',
            title: 'Invalid Authentication',
            description: 'Bot token is invalid or has insufficient permissions',
            solution: 'Check token and bot permissions in Slack app settings'
          }
        ],
        test_instructions: 'Send a test message to a channel',
        documentation_url: 'https://api.slack.com/bot-users'
      },
      // Add minimal implementations for other services
      outlook: { service_id: 'outlook', service_name: 'Outlook', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      discord: { service_id: 'discord', service_name: 'Discord', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      whatsapp_business: { service_id: 'whatsapp_business', service_name: 'WhatsApp Business', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      google_sheets: { service_id: 'google_sheets', service_name: 'Google Sheets', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      airtable: { service_id: 'airtable', service_name: 'Airtable', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      notion: { service_id: 'notion', service_name: 'Notion', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      monday: { service_id: 'monday', service_name: 'Monday', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      trello: { service_id: 'trello', service_name: 'Trello', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      hubspot: { service_id: 'hubspot', service_name: 'HubSpot', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      salesforce: { service_id: 'salesforce', service_name: 'Salesforce', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      stripe: { service_id: 'stripe', service_name: 'Stripe', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      quickbooks: { service_id: 'quickbooks', service_name: 'QuickBooks', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      shopify: { service_id: 'shopify', service_name: 'Shopify', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      github: { service_id: 'github', service_name: 'GitHub', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      linear: { service_id: 'linear', service_name: 'Linear', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      jira: { service_id: 'jira', service_name: 'Jira', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      figma: { service_id: 'figma', service_name: 'Figma', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' },
      vercel: { service_id: 'vercel', service_name: 'Vercel', setup_steps: [], common_errors: [], test_instructions: '', documentation_url: '' }
    };

    return guides[serviceId];
  }

  /**
   * Phase 2: Credential List Management
   */
  async listCredentials(workspaceId: string): Promise<CredentialDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list credentials: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to list credentials:', error);
      return [];
    }
  }

  /**
   * Phase 2: Secure Credential Deletion
   */
  async deleteCredential(credentialId: string): Promise<void> {
    try {
      console.log('🗑️ Credential Management: Securely deleting credential...');
      
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', credentialId);

      if (error) {
        throw new Error(`Failed to delete credential: ${error.message}`);
      }

      console.log('✅ Credential deleted securely');
    } catch (error) {
      console.error('Credential deletion failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Get Workspace Credentials
   */
  async getWorkspaceCredentials(workspaceId: string): Promise<CredentialDefinition[]> {
    return this.listCredentials(workspaceId);
  }

  /**
   * Phase 2: Initiate Credential Setup
   */
  async initiateCredentialSetup(serviceId: string): Promise<CredentialSetupFlow> {
    const guide = await this.getServiceSetupGuide(serviceId as PriorityIntegration);
    
    return {
      step: 'service_selection',
      service_id: serviceId,
      service_name: guide.service_name,
      auth_type: 'api_key', // Default, can be changed based on service
      required_fields: [
        {
          key: 'api_key',
          name: 'API Key',
          description: `Enter your ${guide.service_name} API key`,
          type: 'password',
          required: true,
          placeholder: 'sk-...'
        }
      ],
      current_values: {}
    };
  }

  /**
   * Phase 2: Save Credential
   */
  async saveCredential(
    workspaceId: string, 
    serviceId: string, 
    authType: string, 
    _credentialData: Record<string, string>
  ): Promise<string> {
    const credential: Omit<CredentialDefinition, 'id' | 'encrypted_value' | 'created_at' | 'updated_at'> = {
      workspace_id: workspaceId,
      service_name: serviceId,
      credential_type: authType as any,
      metadata: {
        created_by: 'user',
        usage_count: 0
      },
      status: 'pending',
      last_verified: new Date().toISOString()
    };

    return this.createCredential(credential);
  }

  /**
   * Phase 2: Get Error Recovery Instructions
   */
  getErrorRecoveryInstructions(_serviceId: string, errorCode?: string): string {
    const commonInstructions: Record<string, string> = {
      'invalid_auth': 'Check your API key and ensure it has the correct permissions.',
      'rate_limited': 'Your API key has exceeded rate limits. Wait before trying again.',
      'insufficient_permissions': 'Your API key needs additional permissions for this operation.',
      'expired_token': 'Your token has expired. Please refresh or regenerate it.'
    };

    return errorCode ? (commonInstructions[errorCode] || 'Please check your credentials and try again.') : 'Verify your API key is correct and has proper permissions.';
  }

  /**
   * Phase 2: Batch Credential Validation
   */
  async validateAllCredentials(workspaceId: string): Promise<Record<string, CredentialValidationResult>> {
    try {
      console.log('🔍 Credential Management: Validating all credentials...');
      
      const credentials = await this.listCredentials(workspaceId);
      const validationResults: Record<string, CredentialValidationResult> = {};

      // Validate credentials in parallel for efficiency
      await Promise.all(
        credentials.map(async (credential) => {
          try {
            validationResults[credential.id] = await this.validateCredential(credential.id);
          } catch (error) {
            validationResults[credential.id] = {
              isValid: false,
              status: 'network_error',
              message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tested_at: new Date().toISOString()
            };
          }
        })
      );

      return validationResults;
    } catch (error) {
      console.error('Batch credential validation failed:', error);
      return {};
    }
  }
}

export const credentialManagementService = new CredentialManagementService();