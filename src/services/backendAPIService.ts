import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';

interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
}

interface VideoGenerationRequest {
  script: string;
  persona: {
    name: string;
    voiceId: string;
    backgroundUrl?: string;
  };
  settings: {
    resolution: string;
    duration: number;
  };
}

interface AgentAnalysisRequest {
  agentData: {
    role: string;
    tools: string[];
    personality?: string;
    configuration: Record<string, any>;
  };
  analysisType: 'performance' | 'optimization' | 'compatibility';
}

class BackendAPIService {
  private orchestratorClient: AxiosInstance;
  private agentServiceClient: AxiosInstance;

  constructor() {
    const orchestratorUrl = process.env.NODE_ENV === 'production' 
      ? 'https://genesisos-orchestrator.onrender.com'
      : 'http://localhost:3002';
    
    const agentServiceUrl = process.env.NODE_ENV === 'production'
      ? 'https://genesisos-agents.onrender.com'
      : 'http://localhost:8001';

    this.orchestratorClient = axios.create({
      baseURL: orchestratorUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.agentServiceClient = axios.create({
      baseURL: agentServiceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Add auth token to requests
    const addAuthToken = async (config: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    };

    this.orchestratorClient.interceptors.request.use(addAuthToken);
    this.agentServiceClient.interceptors.request.use(addAuthToken);

    // Handle errors
    const handleError = (error: any) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    };

    this.orchestratorClient.interceptors.response.use(
      response => response,
      handleError
    );

    this.agentServiceClient.interceptors.response.use(
      response => response,
      handleError
    );
  }

  // Workflow execution endpoints
  async executeWorkflow(workflowData: any): Promise<APIResponse<{ executionId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/workflows/execute', {
        workflow: workflowData,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to execute workflow');
    }
  }

  async pauseWorkflow(executionId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.post(`/api/workflows/${executionId}/pause`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to pause workflow');
    }
  }

  async resumeWorkflow(executionId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.post(`/api/workflows/${executionId}/resume`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to resume workflow');
    }
  }

  async stopWorkflow(executionId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.post(`/api/workflows/${executionId}/stop`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to stop workflow');
    }
  }

  async getWorkflowStatus(executionId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/workflows/${executionId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get workflow status');
    }
  }

  // Agent management endpoints
  async createAgent(agentData: any): Promise<APIResponse<{ agentId: string }>> {
    try {
      const response = await this.agentServiceClient.post('/api/agents', agentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create agent');
    }
  }

  async updateAgent(agentId: string, updates: any): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.put(`/api/agents/${agentId}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update agent');
    }
  }

  async deleteAgent(agentId: string): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.delete(`/api/agents/${agentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete agent');
    }
  }

  async getAgentStatus(agentId: string): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.get(`/api/agents/${agentId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get agent status');
    }
  }

  async analyzeAgent(request: AgentAnalysisRequest): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.post('/api/agents/analyze', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to analyze agent');
    }
  }

  // Deployment endpoints
  async deployToDiscord(config: any): Promise<APIResponse<{ deploymentId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/deploy/discord', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to deploy to Discord');
    }
  }

  async deployToSlack(config: any): Promise<APIResponse<{ deploymentId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/deploy/slack', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to deploy to Slack');
    }
  }

  async deployToTelegram(config: any): Promise<APIResponse<{ deploymentId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/deploy/telegram', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to deploy to Telegram');
    }
  }

  async deployWebhook(config: any): Promise<APIResponse<{ deploymentId: string, webhookUrl: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/deploy/webhook', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to deploy webhook');
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/deployments/${deploymentId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get deployment status');
    }
  }

  async stopDeployment(deploymentId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.post(`/api/deployments/${deploymentId}/stop`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to stop deployment');
    }
  }

  // Voice generation endpoints
  async generateVoice(request: VoiceGenerationRequest): Promise<APIResponse<{ audioUrl: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/voice/generate', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate voice');
    }
  }

  async getVoices(): Promise<APIResponse<any[]>> {
    try {
      const response = await this.orchestratorClient.get('/api/voice/voices');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get voices');
    }
  }

  // Video generation endpoints
  async generateVideo(request: VideoGenerationRequest): Promise<APIResponse<{ videoId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/video/generate', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate video');
    }
  }

  async getVideoStatus(videoId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/video/${videoId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get video status');
    }
  }

  // Analytics endpoints
  async getSystemAnalytics(timeRange: string = '24h'): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/analytics/system?range=${timeRange}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get system analytics');
    }
  }

  async getAgentAnalytics(agentId: string, timeRange: string = '24h'): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/analytics/agent/${agentId}?range=${timeRange}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get agent analytics');
    }
  }

  async getWorkflowAnalytics(workflowId: string, timeRange: string = '24h'): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/analytics/workflow/${workflowId}?range=${timeRange}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get workflow analytics');
    }
  }

  // Health check endpoints
  async checkOrchestratorHealth(): Promise<boolean> {
    try {
      const response = await this.orchestratorClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async checkAgentServiceHealth(): Promise<boolean> {
    try {
      const response = await this.agentServiceClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Simulation endpoints
  async runSimulation(simulationData: any): Promise<APIResponse<{ simulationId: string }>> {
    try {
      const response = await this.orchestratorClient.post('/api/simulation/run', simulationData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to run simulation');
    }
  }

  async getSimulationResults(simulationId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/simulation/${simulationId}/results`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get simulation results');
    }
  }

  // Blueprint management
  async generateBlueprint(prompt: string): Promise<APIResponse<{ blueprint: any }>> {
    try {
      const response = await this.orchestratorClient.post('/api/blueprint/generate', { prompt });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate blueprint');
    }
  }

  async validateBlueprint(blueprint: any): Promise<APIResponse<{ valid: boolean, issues: string[] }>> {
    try {
      const response = await this.orchestratorClient.post('/api/blueprint/validate', { blueprint });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to validate blueprint');
    }
  }

  // Phase 2: Additional methods
  async enableVoiceSimulation(simulationId: string, config: any): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.post(`/api/simulation/${simulationId}/voice`, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to enable voice simulation');
    }
  }

  async createCredential(credential: any): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.post('/api/credentials', credential);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create credential');
    }
  }

  async validateCredential(credentialId: string): Promise<APIResponse> {
    try {
      const response = await this.orchestratorClient.get(`/api/credentials/${credentialId}/validate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to validate credential');
    }
  }

  // Phase 1 Critical Endpoints - Einstein Engine Integration
  async analyzeIntent(userInput: string): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.post('/api/ai/einstein/analyze', { 
        user_input: userInput 
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to analyze intent');
    }
  }

  async predictCosts(blueprint: any): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.post('/api/ai/cost-prediction/predict', { 
        blueprint 
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to predict costs');
    }
  }

  async discoverMCPTools(goals: string[]): Promise<APIResponse> {
    try {
      const response = await this.agentServiceClient.post('/api/ai/mcp/discover', { 
        goals 
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to discover MCP tools');
    }
  }

  async checkEinsteinService(): Promise<boolean> {
    try {
      const response = await this.agentServiceClient.get('/api/ai/einstein/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async checkCostPredictionService(): Promise<boolean> {
    try {
      const response = await this.agentServiceClient.get('/api/ai/cost-prediction/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async checkMCPService(): Promise<boolean> {
    try {
      const response = await this.agentServiceClient.get('/api/ai/mcp/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const backendAPIService = new BackendAPIService();