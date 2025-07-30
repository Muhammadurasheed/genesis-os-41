
import axios, { AxiosInstance } from 'axios';

// Interface for agent configuration
interface AgentConfig {
  name: string;
  role: string;
  description: string;
  tools?: string[];
  personality?: string;
  memory_enabled?: boolean;
  voice_enabled?: boolean;
  voice_config?: Record<string, any>;
}

class AgentConfigurationService {
  private apiClient: AxiosInstance;

  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Configure an agent with the given settings
   */
  public async configureAgent(
    agent_id: string,
    config: AgentConfig
  ): Promise<{ success: boolean; message: string; agent_id: string }> {
    try {
      console.log(`🤖 Configuring agent ${agent_id} with name: ${config.name}`);
      
      const response = await this.apiClient.post(
        `/agent/${agent_id}/configure`,
        config
      );
      
      console.log(`✅ Agent ${agent_id} configured successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error configuring agent ${agent_id}:`, error.message);
      throw new Error(`Failed to configure agent: ${error.message}`);
    }
  }

  /**
   * Clear an agent's memory
   */
  public async clearAgentMemory(agent_id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🤖 Clearing memory for agent ${agent_id}`);
      
      const response = await this.apiClient.post(
        `/agent/${agent_id}/clear-memory`
      );
      
      console.log(`✅ Memory cleared for agent ${agent_id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error clearing memory for agent ${agent_id}:`, error.message);
      
      return {
        success: false,
        message: `Failed to clear agent memory: ${error.message}`
      };
    }
  }

  /**
   * Get an agent's memories
   */
  public async getAgentMemories(
    agent_id: string,
    limit: number = 10
  ): Promise<{ memories: any[]; count: number }> {
    try {
      console.log(`🤖 Retrieving memories for agent ${agent_id}`);
      
      const response = await this.apiClient.get(
        `/agent/${agent_id}/memories?limit=${limit}`
      );
      
      console.log(`✅ Retrieved ${response.data.count} memories for agent ${agent_id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error retrieving memories for agent ${agent_id}:`, error.message);
      
      return {
        memories: [],
        count: 0
      };
    }
  }
}

export default AgentConfigurationService;
