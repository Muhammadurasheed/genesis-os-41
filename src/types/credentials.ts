// Phase 3 Sprint 3.1: Security-First Credential Architecture
// Following exact specifications from master blueprint

export interface CredentialDefinition {
  id: string;
  workspace_id: string;
  service_name: string;
  credential_type: 'api_key' | 'oauth' | 'basic_auth' | 'custom';
  encrypted_value: string; // AES-256 encrypted
  metadata: {
    scopes?: string[];
    expires_at?: string;
    test_endpoint?: string;
    created_by?: string;
    last_used?: string;
    usage_count?: number;
  };
  status: 'pending' | 'verified' | 'expired' | 'invalid';
  last_verified: string;
  created_at: string;
  updated_at: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  status: 'verified' | 'expired' | 'invalid' | 'rate_limited' | 'network_error';
  message: string;
  details?: {
    endpoint_tested?: string;
    response_code?: number;
    error_code?: string;
    permissions?: string[];
    rate_limit_remaining?: number;
  };
  tested_at: string;
}

export interface CredentialSetupFlow {
  step: 'service_selection' | 'auth_method' | 'credential_input' | 'validation' | 'storage';
  service_id: string;
  service_name: string;
  auth_type: 'api_key' | 'oauth' | 'basic_auth' | 'custom';
  required_fields: CredentialField[];
  current_values: Record<string, string>;
  validation_result?: CredentialValidationResult;
  error_message?: string;
}

export interface CredentialField {
  key: string;
  name: string;
  description: string;
  type: 'text' | 'password' | 'textarea' | 'select' | 'url';
  required: boolean;
  placeholder?: string;
  validation_pattern?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
}

export interface ServiceCredentialGuide {
  service_id: string;
  service_name: string;
  logo_url?: string;
  setup_steps: SetupStep[];
  common_errors: CommonError[];
  test_instructions: string;
  documentation_url: string;
}

export interface SetupStep {
  step_number: number;
  title: string;
  description: string;
  screenshot_url?: string;
  code_example?: string;
  external_url?: string;
}

export interface CommonError {
  error_code: string;
  title: string;
  description: string;
  solution: string;
  documentation_url?: string;
}

// Priority integrations as per master blueprint
export const PRIORITY_INTEGRATIONS = [
  // Communication
  'gmail', 'outlook', 'slack', 'discord', 'whatsapp_business',
  
  // Productivity  
  'google_sheets', 'airtable', 'notion', 'monday', 'trello',
  
  // Business
  'hubspot', 'salesforce', 'stripe', 'quickbooks', 'shopify',
  
  // Development
  'github', 'linear', 'jira', 'figma', 'vercel'
] as const;

export type PriorityIntegration = typeof PRIORITY_INTEGRATIONS[number];

export interface CredentialEncryption {
  algorithm: 'AES-256-GCM';
  key_derivation: 'PBKDF2';
  salt: string;
  iv: string;
  encrypted_data: string;
  auth_tag: string;
}

export interface CredentialPermission {
  user_id: string;
  credential_id: string;
  permission_type: 'read' | 'write' | 'admin';
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}